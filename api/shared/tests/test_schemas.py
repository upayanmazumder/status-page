"""Tests for shared schemas."""
from shared.schemas import (
    HealthCheck,
    PaginationParams,
    PaginatedResponse,
    ErrorResponse,
)


class TestHealthCheck:
    def test_basic_health(self):
        health = HealthCheck(status="ok", service="test")
        assert health.status == "ok"
        assert health.service == "test"
        assert health.version == "1.0.0"

    def test_health_with_details(self):
        health = HealthCheck(
            status="ok",
            service="test",
            details={"database": "connected", "redis": "connected"},
        )
        assert health.details["database"] == "connected"


class TestPaginationParams:
    def test_default_values(self):
        params = PaginationParams()
        assert params.page == 1
        assert params.limit == 20
        assert params.offset == 0

    def test_custom_values(self):
        params = PaginationParams(page=3, limit=50)
        assert params.page == 3
        assert params.limit == 50
        assert params.offset == 100

    def test_offset_calculation(self):
        params = PaginationParams(page=2, limit=10)
        assert params.offset == 10


class TestPaginatedResponse:
    def test_create_pagination(self):
        items = [{"id": 1}, {"id": 2}]
        response = PaginatedResponse.create(
            items=items, total=100, page=1, limit=20
        )
        assert response.items == items
        assert response.total == 100
        assert response.page == 1
        assert response.limit == 20
        assert response.pages == 5
        assert response.has_next is True
        assert response.has_prev is False

    def test_last_page(self):
        items = [{"id": 99}]
        response = PaginatedResponse.create(
            items=items, total=100, page=5, limit=20
        )
        assert response.has_next is False
        assert response.has_prev is True

    def test_single_page(self):
        items = [{"id": 1}]
        response = PaginatedResponse.create(
            items=items, total=1, page=1, limit=20
        )
        assert response.pages == 1
        assert response.has_next is False
        assert response.has_prev is False


class TestErrorResponse:
    def test_error_response(self):
        error = ErrorResponse(
            error="NotFoundError",
            message="Resource not found",
            status_code=404,
        )
        assert error.error == "NotFoundError"
        assert error.status_code == 404
        assert error.details is None
