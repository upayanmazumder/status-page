"""RSS/Atom feed generation for status updates."""
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import Response

from shared.logging import get_logger

logger = get_logger("status_feeds")
router = APIRouter(prefix="/feeds", tags=["feeds"])


@router.get("/{org_slug}/{project_slug}.rss")
async def rss_feed(request: Request, org_slug: str, project_slug: str):
    """Generate RSS feed for status updates."""
    base_url = str(request.base_url).rstrip("/")
    
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Status Page - {org_slug}</title>
    <link>{base_url}/status/{org_slug}/{project_slug}</link>
    <description>Real-time status updates for {org_slug}</description>
    <language>en</language>
    <lastBuildDate>{datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')}</lastBuildDate>
    <item>
      <title>All Systems Operational</title>
      <link>{base_url}/status/{org_slug}/{project_slug}</link>
      <description>All systems are currently operational.</description>
      <pubDate>{datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')}</pubDate>
      <guid>{base_url}/status/{org_slug}/{project_slug}#operational</guid>
    </item>
  </channel>
</rss>"""
    
    return Response(content=rss, media_type="application/rss+xml")


@router.get("/{org_slug}/{project_slug}.atom")
async def atom_feed(request: Request, org_slug: str, project_slug: str):
    """Generate Atom feed for status updates."""
    base_url = str(request.base_url).rstrip("/")
    
    atom = f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Status Page - {org_slug}</title>
  <link href="{base_url}/status/{org_slug}/{project_slug}" />
  <updated>{datetime.now(timezone.utc).isoformat()}</updated>
  <id>{base_url}/status/{org_slug}/{project_slug}</id>
  <entry>
    <title>All Systems Operational</title>
    <link href="{base_url}/status/{org_slug}/{project_slug}" />
    <id>{base_url}/status/{org_slug}/{project_slug}#operational</id>
    <updated>{datetime.now(timezone.utc).isoformat()}</updated>
    <summary>All systems are currently operational.</summary>
  </entry>
</feed>"""
    
    return Response(content=atom, media_type="application/atom+xml")
