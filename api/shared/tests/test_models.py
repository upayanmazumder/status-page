"""Tests for SQLAlchemy models."""
import uuid

import pytest
from sqlalchemy import inspect

from shared.database import Base
from shared.models import (
    Organization,
    User,
    OrgMembership,
    Project,
    Component,
    ComponentGroup,
    ComponentStatus,
    Incident,
    IncidentStatus,
    IncidentImpact,
    Maintenance,
    MaintenanceStatus,
    UptimeCheck,
    CheckMethod,
    CheckResult,
    CheckHistory,
    Subscriber,
    APIToken,
    AuditLog,
)


class TestOrganization:
    def test_table_name(self):
        assert Organization.__tablename__ == "organizations"

    def test_columns(self):
        mapper = inspect(Organization)
        columns = [col.key for col in mapper.attrs]
        assert "id" in columns
        assert "name" in columns
        assert "slug" in columns
        assert "timezone" in columns
        assert "created_at" in columns
        assert "updated_at" in columns
        assert "deleted_at" in columns

    def test_default_timezone(self):
        org = Organization(name="Test", slug="test")
        assert org.timezone == "UTC"

    def test_uuid_generation(self):
        org = Organization(name="Test", slug="test")
        assert isinstance(org.id, uuid.UUID)


class TestUser:
    def test_table_name(self):
        assert User.__tablename__ == "users"

    def test_uuid_generation(self):
        user = User(external_id="ext_123", email="test@example.com")
        assert isinstance(user.id, uuid.UUID)


class TestComponent:
    def test_table_name(self):
        assert Component.__tablename__ == "components"

    def test_default_status(self):
        comp = Component(project_id=uuid.uuid4(), name="API")
        assert comp.status == ComponentStatus.operational

    def test_default_position(self):
        comp = Component(project_id=uuid.uuid4(), name="API")
        assert comp.position == 0


class TestIncident:
    def test_table_name(self):
        assert Incident.__tablename__ == "incidents"

    def test_default_status(self):
        inc = Incident(project_id=uuid.uuid4(), org_id=uuid.uuid4(), title="Outage")
        assert inc.status == IncidentStatus.investigating

    def test_default_impact(self):
        inc = Incident(project_id=uuid.uuid4(), org_id=uuid.uuid4(), title="Outage")
        assert inc.impact == IncidentImpact.none


class TestMaintenance:
    def test_table_name(self):
        assert Maintenance.__tablename__ == "maintenances"

    def test_default_status(self):
        from datetime import datetime, timezone
        m = Maintenance(
            project_id=uuid.uuid4(),
            org_id=uuid.uuid4(),
            title="Update",
            scheduled_start=datetime.now(timezone.utc),
            scheduled_end=datetime.now(timezone.utc),
        )
        assert m.status == MaintenanceStatus.scheduled


class TestUptimeCheck:
    def test_table_name(self):
        assert UptimeCheck.__tablename__ == "uptime_checks"

    def test_default_values(self):
        check = UptimeCheck(
            component_id=uuid.uuid4(),
            project_id=uuid.uuid4(),
            org_id=uuid.uuid4(),
            name="Health Check",
            method=CheckMethod.http,
            target="https://example.com",
        )
        assert check.interval == 60
        assert check.timeout_ms == 10000
        assert check.enabled is True


class TestSubscriber:
    def test_table_name(self):
        assert Subscriber.__tablename__ == "subscribers"

    def test_default_notify_settings(self):
        sub = Subscriber(project_id=uuid.uuid4(), org_id=uuid.uuid4(), email="test@example.com")
        assert sub.notify_incident is True
        assert sub.notify_maintenance is False
        assert sub.verified is False


class TestAPIToken:
    def test_table_name(self):
        assert APIToken.__tablename__ == "api_tokens"


class TestCheckHistory:
    def test_table_name(self):
        assert CheckHistory.__tablename__ == "check_history"

    def test_create_history(self):
        from datetime import datetime, timezone
        hist = CheckHistory(
            check_id=uuid.uuid4(),
            component_id=uuid.uuid4(),
            region="us-east",
            result=CheckResult.up,
            status_code=200,
            response_time_ms=150,
            checked_at=datetime.now(timezone.utc),
        )
        assert hist.result == CheckResult.up
        assert hist.status_code == 200


class TestAuditLog:
    def test_table_name(self):
        assert AuditLog.__tablename__ == "audit_logs"

    def test_create_audit_log(self):
        log = AuditLog(
            org_id=uuid.uuid4(),
            action="incident.created",
            entity_type="incident",
        )
        assert log.action == "incident.created"


class TestModelRelationships:
    def test_organization_has_projects(self):
        org = Organization(name="Test Org", slug="test-org")
        # Projects relationship should exist
        assert hasattr(org, "projects")

    def test_project_has_components(self):
        project = Project(org_id=uuid.uuid4(), name="Test", slug="test")
        assert hasattr(project, "components")

    def test_incident_has_updates(self):
        incident = Incident(project_id=uuid.uuid4(), org_id=uuid.uuid4(), title="Test")
        assert hasattr(incident, "updates")

    def test_component_has_checks(self):
        comp = Component(project_id=uuid.uuid4(), name="API")
        assert hasattr(comp, "uptime_checks")
