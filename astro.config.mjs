import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.visi-bangun.com',
  trailingSlash: 'ignore',
  compressHTML: true,
});
