# api/monitor/Dockerfile
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY ./api/shared /shared
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir /shared

COPY ./api/monitor/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY ./api/monitor/app ./app

RUN chown -R appuser:appgroup /app
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries 3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
