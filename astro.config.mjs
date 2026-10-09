import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.visi-bangun.com',
  trailingSlash: 'ignore',
  compressHTML: true,
  adapter: cloudflare({
    imageService: 'compile',
  }),
});


