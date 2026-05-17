# create-crud

Create a full backend CRUD layer for a given entity following the Sharq project conventions.

## Usage
```
/create-crud <EntityName>
```
Example: `/create-crud Employee`

## What to generate

Given `<EntityName>` (PascalCase), generate the following files.
Use the existing Camera implementation as the reference pattern:
- `app/exceptions/camera.py`
- `app/schemas/camera.py`
- `app/repositories/camera.py`
- `app/services/camera.py`
- `app/routers/camera.py`

---

### 1. `app/exceptions/<entity_snake>.py`
Three exception classes inheriting from `BaseAppException` (app/exceptions/base.py):
- `<Entity>NotFoundException` — status_code=404
- `<Entity>AlreadyExistsException` — status_code=409
- `DatabaseException` — status_code=500 (skip if already exists)

---

### 2. `app/schemas/<entity_snake>.py`
- `PaginationParams` — page, size, limit/offset as @property (skip if already exists as shared)
- `<Entity>SearchParams` — optional filter fields based on the model
- `<Entity>Create` — all required fields from the SQLAlchemy model
- `<Entity>Update` — all fields optional (for PATCH)
- `<Entity>Read` — all fields except sensitive ones (e.g. password), with `from_attributes=True`
- `<Entity>ListResponse` — items, total, page, size, pages with a `build()` classmethod

---

### 3. `app/repositories/<entity_snake>.py`
Class `<Entity>Repository` with `__init__(self, session: AsyncSession)`.
Methods (async, SQLAlchemy 2.0 style with `select()`):
- `create(data: <Entity>Create) -> <Entity>` — commit + rollback on exception → raise DatabaseException
- `get_by_id(id: int) -> <Entity> | None`
- `get_by_<unique_field>(value) -> <Entity> | None` — for duplicate check
- `list(limit, offset, **filters) -> tuple[list[<Entity>], int]` — ilike for string filters, COUNT via subquery
- `update(obj: <Entity>, data: <Entity>Update) -> <Entity>` — model_dump(exclude_none=True), commit + rollback
- `delete(obj: <Entity>) -> None` — commit + rollback

---

### 4. `app/services/<entity_snake>.py`
Class `<Entity>Service` with `__init__(self, repo: <Entity>Repository)`.
Methods:
- `create` — check duplicate → raise `<Entity>AlreadyExistsException` if exists, then repo.create
- `list` — delegate to repo.list, return `<Entity>ListResponse.build(...)`
- `get` — repo.get_by_id → raise `<Entity>NotFoundException` if None
- `update` — get first, then repo.update
- `delete` — get first, then repo.delete

---

### 5. `app/routers/<entity_snake>.py`
- `router = APIRouter(prefix="/<entity_plural>", tags=["<entity_plural>"])`
- DI: `get_session` from `db_helper.session_getter`, `get_<entity>_service` returns service
- Endpoints:
  - `POST /` → 201, body: `<Entity>Create`, response: `<Entity>Read`
  - `GET /` → 200, query params: page, size + search fields, response: `<Entity>ListResponse`
  - `GET /{id}` → 200, response: `<Entity>Read`
  - `PATCH /{id}` → 200, body: `<Entity>Update`, response: `<Entity>Read`
  - `DELETE /{id}` → 204
- Each endpoint wraps service call in try/except and raises `HTTPException`

---

### 6. Register in `app/main.py`
```python
from app.routers.<entity_snake> import router as <entity_snake>_router
app.include_router(<entity_snake>_router, prefix="/api/v1")
```

---

## Rules
- Always read the model file (`app/models/<entity_snake>.py`) first to get exact field names and types
- Password-like fields: save plain (no hashing) unless told otherwise
- Nullable fields in the model → optional in Create schema
- Follow async SQLAlchemy 2.0 patterns (`select()`, `AsyncSession`, `await session.execute()`)
- No business logic in repository — only DB operations
- No DB calls in service — only repository calls + exception raising
