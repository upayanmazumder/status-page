import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://statuspage.example.com", lastModified: new Date() },
    { url: "https://statuspage.example.com/login", lastModified: new Date() },
    { url: "https://statuspage.example.com/register", lastModified: new Date() },
    { url: "https://statuspage.example.com/demo", lastModified: new Date() },
  ];
}
