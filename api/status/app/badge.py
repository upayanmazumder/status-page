"""Status badge image generation."""
from io import BytesIO

from fastapi import APIRouter, Response
from PIL import Image, ImageDraw, ImageFont

router = APIRouter(prefix="/badge", tags=["badge"])


@router.get("/{org_slug}")
async def status_badge(org_slug: str):
    """Generate a status badge SVG image."""
    # Simple SVG badge
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="120" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h55v20H0z"/>
    <path fill="#4c1" d="M55 0h65v20H55z"/>
    <path fill="url(#b)" d="M0 0h120v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="27.5" y="15" fill="#010101" fill-opacity=".3">status</text>
    <text x="27.5" y="14">status</text>
    <text x="91.5" y="15" fill="#010101" fill-opacity=".3">up</text>
    <text x="91.5" y="14">up</text>
  </g>
</svg>"""
    
    return Response(content=svg, media_type="image/svg+xml")
