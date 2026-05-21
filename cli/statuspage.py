"""CLI tool for Status Page Platform."""
import argparse
import asyncio
import json
import sys
from typing import Optional

import httpx


class StatusPageCLI:
    """Command-line interface for managing status pages."""

    def __init__(self, base_url: str = "http://localhost:4000", token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        """Make authenticated API request."""
        headers = kwargs.pop("headers", {})
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        response = await self.client.request(method, path, headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()

    async def list_components(self, project_id: str = "default"):
        """List all components."""
        data = await self._request("GET", f"/dashboard/components?project_id={project_id}")
        items = data.get("items", [])
        
        print(f"{'ID':<36} {'Name':<30} {'Status':<20}")
        print("-" * 90)
        for item in items:
            print(f"{item['id']:<36} {item['name']:<30} {item['status']:<20}")

    async def create_component(self, name: str, project_id: str = "default", status: str = "operational"):
        """Create a new component."""
        data = await self._request(
            "POST",
            f"/dashboard/components?project_id={project_id}",
            json={"name": name, "status": status},
        )
        print(f"Created component: {data.get('name')} ({data.get('id')})")

    async def update_component_status(self, component_id: str, status: str):
        """Update component status."""
        data = await self._request(
            "PATCH",
            f"/dashboard/components/{component_id}",
            json={"status": status},
        )
        print(f"Updated component status to: {data.get('status')}")

    async def list_incidents(self, project_id: str = "default", status_filter: Optional[str] = None):
        """List incidents."""
        url = f"/dashboard/incidents?project_id={project_id}"
        if status_filter:
            url += f"&status_filter={status_filter}"
        
        data = await self._request("GET", url)
        items = data.get("items", [])
        
        print(f"{'ID':<36} {'Title':<40} {'Status':<15} {'Impact':<10}")
        print("-" * 110)
        for item in items:
            print(f"{item['id']:<36} {item['title']:<40} {item['status']:<15} {item['impact']:<10}")

    async def create_incident(self, title: str, status: str = "investigating", impact: str = "minor", project_id: str = "default"):
        """Create a new incident."""
        data = await self._request(
            "POST",
            f"/dashboard/incidents?project_id={project_id}",
            json={"title": title, "status": status, "impact": impact},
        )
        print(f"Created incident: {data.get('title')} ({data.get('id')})")

    async def update_incident(self, incident_id: str, message: str, status: str):
        """Update incident with new status."""
        data = await self._request(
            "PATCH",
            f"/dashboard/incidents/{incident_id}",
            json={"message": message, "status": status},
        )
        print(f"Updated incident: {data.get('title')} -> {data.get('status')}")

    async def get_status(self, org_slug: str, project_slug: str = "default"):
        """Get public status page."""
        data = await self._request("GET", f"/status/{org_slug}/{project_slug}")
        
        print(f"Organization: {data.get('org_name')}")
        print(f"Project: {data.get('project_name')}")
        print(f"Overall Status: {data.get('overall_status')}")
        print(f"\nComponents:")
        for comp in data.get("components", []):
            print(f"  {comp['name']}: {comp['status']}")

    async def close(self):
        await self.client.aclose()


def main():
    parser = argparse.ArgumentParser(description="Status Page Platform CLI")
    parser.add_argument("--url", default="http://localhost:4000", help="API base URL")
    parser.add_argument("--token", help="API token for authentication")
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Components
    comp_parser = subparsers.add_parser("components", help="Manage components")
    comp_sub = comp_parser.add_subparsers(dest="subcommand")
    
    comp_list = comp_sub.add_parser("list", help="List components")
    comp_list.add_argument("--project", default="default", help="Project ID")
    
    comp_create = comp_sub.add_parser("create", help="Create component")
    comp_create.add_argument("name", help="Component name")
    comp_create.add_argument("--project", default="default", help="Project ID")
    comp_create.add_argument("--status", default="operational", choices=["operational", "degraded_performance", "partial_outage", "major_outage", "under_maintenance"])
    
    comp_update = comp_sub.add_parser("update", help="Update component status")
    comp_update.add_argument("id", help="Component ID")
    comp_update.add_argument("status", help="New status")
    
    # Incidents
    inc_parser = subparsers.add_parser("incidents", help="Manage incidents")
    inc_sub = inc_parser.add_subparsers(dest="subcommand")
    
    inc_list = inc_sub.add_parser("list", help="List incidents")
    inc_list.add_argument("--project", default="default", help="Project ID")
    inc_list.add_argument("--status", choices=["investigating", "identified", "monitoring", "resolved"])
    
    inc_create = inc_sub.add_parser("create", help="Create incident")
    inc_create.add_argument("title", help="Incident title")
    inc_create.add_argument("--project", default="default", help="Project ID")
    inc_create.add_argument("--status", default="investigating", choices=["investigating", "identified", "monitoring", "resolved"])
    inc_create.add_argument("--impact", default="minor", choices=["none", "minor", "major", "critical"])
    
    inc_update = inc_sub.add_parser("update", help="Update incident")
    inc_update.add_argument("id", help="Incident ID")
    inc_update.add_argument("message", help="Update message")
    inc_update.add_argument("--status", required=True, choices=["investigating", "identified", "monitoring", "resolved"])
    
    # Status
    status_parser = subparsers.add_parser("status", help="Get public status")
    status_parser.add_argument("org", help="Organization slug")
    status_parser.add_argument("--project", default="default", help="Project slug")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    cli = StatusPageCLI(base_url=args.url, token=args.token)
    
    async def run():
        try:
            if args.command == "components":
                if args.subcommand == "list":
                    await cli.list_components(args.project)
                elif args.subcommand == "create":
                    await cli.create_component(args.name, args.project, args.status)
                elif args.subcommand == "update":
                    await cli.update_component_status(args.id, args.status)
            
            elif args.command == "incidents":
                if args.subcommand == "list":
                    await cli.list_incidents(args.project, args.status)
                elif args.subcommand == "create":
                    await cli.create_incident(args.title, args.status, args.impact, args.project)
                elif args.subcommand == "update":
                    await cli.update_incident(args.id, args.message, args.status)
            
            elif args.command == "status":
                await cli.get_status(args.org, args.project)
        finally:
            await cli.close()
    
    asyncio.run(run())


if __name__ == "__main__":
    main()
