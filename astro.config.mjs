// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://imgfeel.com',
  output: 'static',
  compressHTML: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'fr', 'de', 'id', 'tr', 'it'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/blog'),
      customSitemaps: ['https://imgfeel.com/sitemap-blog.xml'],
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
          pt: 'pt',
          fr: 'fr',
          de: 'de',
          id: 'id',
          tr: 'tr',
          it: 'it',
        },
      },
    }),
  ],
  build: {
    inlineStylesheets: 'always',
  },
});
