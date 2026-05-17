# Учёт посещаемости через камеры Dahua

Async-сервис, который автоматически забирает логи проходов с нескольких камер
Dahua **DHI-ASI7213S-W** (RPC2) и складывает их в PostgreSQL — с автозаведением
сотрудников и расчётом статусов «вход/выход» за день.

## Что делает

- Опрашивает все камеры из таблицы `cameras` **параллельно** по расписанию.
- Находит сотрудника по `UserID` с камеры; если нет — заводит автоматически из
  `CardName`.
- Складывает события в таблицу `attendances` по правилу «одна строка на
  сотрудника в день»: самый ранний enter + самый поздний exit.
- Помечает каждую строку статусом: `complete` / `no_exit` / `no_enter` /
  `absent`.
- В 20:30 создаёт `absent`-строки для тех, кого вообще не было в логах.

---

## Архитектура

```
main.py                          # точка входа, AsyncIOScheduler
  └─ access_logs.fetch_access_logs(shift)
      ├─ list_cameras()          # из БД
      └─ asyncio.gather(_process_camera × N)   ← параллельно
            ├─ DahuaClient        # RPC2: login + RecordFinder
            ├─ filter             # Status==1, есть UserID/CardName, в окне
            └─ save_attendance()  # запись в БД с дедупом
```

| Файл | Роль |
|---|---|
| [main.py](main.py) | Точка входа: запускает планировщик и тестовый прогон |
| [app/services/dahua.py](app/services/dahua.py) | Async-клиент Dahua RPC2 (контекстный, авто-логин/логаут) |
| [app/services/access_logs.py](app/services/access_logs.py) | Оркестратор: окна выборки, параллельная обработка, фильтр |
| [app/services/attendance.py](app/services/attendance.py) | Запись в БД, дедуп, авто-сотрудники, статусы, `mark_absentees` |
| [app/services/camera.py](app/services/camera.py) | CRUD для `cameras` |
| [app/services/employees.py](app/services/employees.py) | CRUD для `employees` |
| [app/models/](app/models/) | SQLAlchemy-модели |
| [app/core/database.py](app/core/database.py) | async-движок и `db_helper.session_context()` |
| [init.sql](init.sql) | DDL для чистой установки (выполняется при первом старте Postgres) |
| [docker-compose.yml](docker-compose.yml) | Postgres 17 alpine + monted `init.sql` |

---

## Расписание

| Cron | Shift | Окно выборки | Зачем |
|---|---|---|---|
| **09:00** | `morning` | сегодня 06:00 → 09:00 | Утренний сбор — события первой половины рабочего дня |
| **20:00** | `evening` | сегодня 06:00 → 20:00 | Полный сбор за день; перекрывает утреннее окно (дедуп в `save_attendance` отсекает повторы) |
| **20:30** | — | — | `mark_absentees` — отмечает сотрудников, которых не было в логах за день |

Часовой пояс жёстко задан как **Asia/Tashkent (UTC+5)** в [main.py](main.py)
и [app/services/access_logs.py](app/services/access_logs.py).

---

## Логика обработки одной записи (`save_attendance`)

Для каждой записи с камеры:

1. **Фильтр** (в `_process_camera`): `Status == 1`, есть `UserID` и `CardName`,
   время в окне выборки.
2. **Дедуп**: если `RecNo` уже есть в БД (`enter_rec_no` или `exit_rec_no`) —
   пропуск.
3. **Сотрудник**: ищем по `camera_user_id == UserID`. Если нет — парсим
   `CardName` (формат `Last First Middle …`) и создаём запись в `employees`.
4. **Строка attendance за день**: ищем по `(employee_id, date)`. Если нет —
   создаём.
5. **Применяем проход** (`_apply_pass`):
   - камера типа `enter` → запоминаем **самый ранний** `enter_time` за день;
   - камера типа `exit` → запоминаем **самый поздний** `exit_time` за день.
6. **Пересчитываем `presence_status`**:
   - `complete` — есть и enter, и exit;
   - `no_exit` — только enter (на работе или ушёл без отметки);
   - `no_enter` — только exit (подозрительно: вышел, но входа нет в окне);
   - `absent` — ни enter, ни exit (заполняется в `mark_absentees`).

В конце цикла — один `commit()` на всю партию.

---

## Установка

### Конфигурация (`.env`)

Скопировать пример и заполнить:

```bash
cp .env.example .env
# отредактировать пароль и т.д.
```

Используется и Postgres-сервисом, и приложением (через `python-dotenv` /
`env_file` в compose).

### Зависимости (для локальной разработки)

Требуется Python 3.10+. Менеджер пакетов — `uv` (есть `uv.lock`).

```bash
uv sync                     # установит зависимости в .venv
source .venv/bin/activate
```

В production-режиме через Docker этот шаг не нужен.

### База данных

Поднять Postgres + автоматически применить [init.sql](init.sql):

```bash
docker compose up -d postgres
```

Проверить, что схема создана:

```bash
docker exec -it postgres psql -U postgres -d postgres -c "\dt"
```

Должны быть 3 таблицы: `employees`, `cameras`, `attendances`.

### Заведение камер

В `init.sql` камер нет — нужно добавить руками:

```bash
docker exec -i postgres psql -U postgres -d postgres -c "INSERT INTO cameras (ip_address, login, password, type) VALUES ('192.168.1.90', 'admin', 'admin123', 'exit'), ('192.168.1.91', 'admin', 'admin123', 'enter'), ('192.168.1.92', 'admin', 'admin123', 'enter'), ('192.168.1.93', 'admin', 'admin123', 'exit');"
```

`type` — это enum `enter` / `exit` (определяет, в какие колонки писать события
с этой камеры).

---

## Запуск

### Production (Docker Compose) — рекомендуется

```bash
docker compose up -d --build
docker compose logs -f app
```

Что делает:
- Postgres стартует с healthcheck; `app` ждёт, пока БД будет готова.
- `restart: unless-stopped` — контейнер перезапустится при падении и после
  ребута хоста.
- `init: true` — корректная пересылка SIGTERM в Python (graceful shutdown:
  останавливает планировщик, закрывает пул соединений к БД).
- Тестовый прогон на старте **выключен** по умолчанию — включается через
  `RUN_ON_STARTUP=true` в `.env`.

Остановить:

```bash
docker compose down
```

Обновить код после изменений:

```bash
docker compose up -d --build app
```

### Локальная разработка

```bash
source .venv/bin/activate
python -u main.py
```

По умолчанию тестового прогона нет. Чтобы включить — поставить в `.env`:

```
RUN_ON_STARTUP=true
```

Остановка — `Ctrl+C` (планировщик и пул БД закроются корректно).

### Запустить `mark_absentees` вручную (не ждать 20:30)

```bash
source .venv/bin/activate
python -c "import asyncio; from app.services.attendance import mark_absentees; print('создано:', asyncio.run(mark_absentees('2026-05-05')))"
```

Замени дату на нужную (`'YYYY-MM-DD'`).

### Полный сброс (свежий старт)

```bash
docker compose down -v       # удалит volume → init.sql отработает заново
docker compose up -d
# заново добавить камеры (см. выше)
```

Только пересобрать `attendances` (камеры/сотрудников оставить):

```bash
docker exec -it postgres psql -U postgres -d postgres -c "TRUNCATE attendances RESTART IDENTITY;"
```

---

## Проверка результата (SQL)

### Сводка по таблицам

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT 'employees' AS t, COUNT(*) FROM employees UNION ALL SELECT 'attendances', COUNT(*) FROM attendances UNION ALL SELECT 'cameras', COUNT(*) FROM cameras;"
```

### Распределение статусов

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT presence_status, COUNT(*) FROM attendances GROUP BY presence_status ORDER BY COUNT(*) DESC;"
```

### Кто во сколько пришёл/ушёл

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT e.last_name||' '||e.first_name AS fio, COALESCE(a.enter_time::text,'—') AS enter, COALESCE(a.exit_time::text,'—') AS exit, a.presence_status FROM attendances a JOIN employees e ON e.id=a.employee_id ORDER BY COALESCE(a.enter_time, a.exit_time);"
```

### Только полные дни (есть и вход, и выход)

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT e.last_name, e.first_name, a.enter_time, a.exit_time FROM attendances a JOIN employees e ON e.id=a.employee_id WHERE a.presence_status='complete' ORDER BY a.enter_time;"
```

### «Вошёл, но не вышел» (ещё на работе или забыл отметиться)

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT e.last_name, e.first_name, a.enter_time FROM attendances a JOIN employees e ON e.id=a.employee_id WHERE a.presence_status='no_exit' ORDER BY a.enter_time;"
```

### «Вышел без входа» (подозрительно)

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT e.last_name, e.first_name, a.exit_time FROM attendances a JOIN employees e ON e.id=a.employee_id WHERE a.presence_status='no_enter' ORDER BY a.exit_time;"
```

### Отсутствующие за день (после `mark_absentees`)

```bash
docker exec -it postgres psql -U postgres -d postgres -c "SELECT e.last_name, e.first_name FROM attendances a JOIN employees e ON e.id=a.employee_id WHERE a.presence_status='absent' ORDER BY e.last_name;"
```

---

## Схема БД

### `cameras`

| Колонка | Тип | Заметка |
|---|---|---|
| `id` | `SERIAL PK` | |
| `ip_address` | `VARCHAR(50)` | IP камеры |
| `login` | `VARCHAR(50)` | имя пользователя для RPC2 |
| `password` | `VARCHAR(100)` | пароль для RPC2 |
| `type` | `enum('enter','exit')` | вход или выход — определяет, в какую колонку attendance писать |
| `created_at`, `updated_at` | `TIMESTAMP` | |

### `employees`

| Колонка | Тип | Заметка |
|---|---|---|
| `id` | `SERIAL PK` | |
| `first_name`, `last_name`, `middle_name` | `VARCHAR(50)` | |
| `camera_user_id` | `VARCHAR(50) UNIQUE` | соответствует `UserID` на камере |
| `created_at`, `updated_at` | `TIMESTAMP` | |

### `attendances`

| Колонка | Тип | Заметка |
|---|---|---|
| `id` | `SERIAL PK` | |
| `employee_id` | `INT FK employees(id)` | |
| `enter_camera_id` | `INT FK cameras(id) NULL` | какая камера зафиксировала вход |
| `enter_time` | `VARCHAR NULL` | формат `YYYY-MM-DD HH:MM:SS` |
| `enter_rec_no` | `INT UNIQUE NULL` | RecNo с камеры (для дедупа) |
| `exit_camera_id` | `INT FK cameras(id) NULL` | |
| `exit_time` | `VARCHAR NULL` | |
| `exit_rec_no` | `INT UNIQUE NULL` | |
| `status` | `VARCHAR(50)` | служебное (не используется бизнес-логикой) |
| `presence_status` | `VARCHAR(20)` | `complete`/`no_exit`/`no_enter`/`absent` |
| `created_at`, `updated_at` | `TIMESTAMP` | |

---

## Известные ограничения

1. **Один день = одна пара enter+exit.** Если человек вышел на обед и вернулся,
   средние exit'ы теряются — exit_time перезаписывается последним.
2. **Авто-создание сотрудников по `CardName`.** Опечатки в Dahua = «двойники»
   в БД. На длинной дистанции лучше завести сотрудников руками и не доверять
   автозаведению.
3. **`enter_time`/`exit_time` хранятся как `VARCHAR`.** Поиск дня — через
   `LIKE 'YYYY-MM-DD%'`. Стоит мигрировать на `TIMESTAMP`.
4. **Нет ретраев и нет retro вчерашнего дня.** Если камера была offline во
   время вечернего сбора (20:00) — записи за тот день потеряются: на следующий
   день оба окна (`morning`, `evening`) работают только с текущей датой.
5. **Только `print()`** вместо `logging` — диагностика в проде ограничена.
6. **Нет миграций.** Изменения схемы — `ALTER TABLE` руками. Стоит подключить
   Alembic.
7. **Креды камер plaintext в БД.** В проде — шифровать или вытащить во внешний
   secret manager.
8. **`mark_absentees` в 20:30** не учитывает сценарии ночных смен.

---

## Тестирование

Автотестов нет — проверка ручная. Минимальный smoke-test после правок:

```bash
# 1. Файлы компилируются
source .venv/bin/activate
python -m py_compile main.py app/services/*.py app/models/*.py app/core/*.py

# 2. Скрипт стартует, не падает на импорте, тестовый прогон проходит
timeout 15 python -u main.py

# 3. Дедуп работает — повторный запуск
timeout 15 python -u main.py
# В выводе должно быть: сохранено=0, дубль=N
```
