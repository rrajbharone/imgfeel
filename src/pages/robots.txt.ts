import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://imgfeel.com/sitemap-index.xml
Sitemap: https://imgfeel.com/sitemap-blog.xml
`;
  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
