FROM python:3.14-rc-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

RUN pip install --no-cache-dir uv

WORKDIR /app

# Dependency layer — cached unless pyproject.toml / uv.lock change
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --no-install-project

# Application code — changes on every commit, rebuilds quickly
COPY . .
RUN uv sync --no-dev

RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

ENV PATH="/app/.venv/bin:$PATH"

COPY --chown=app:app start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
