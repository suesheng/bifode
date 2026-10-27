// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Behind the pod's TLS proxy Astro's built-in origin check sees http:// and rejects every form POST.
  // State-changing routes check the Origin header themselves (src/lib/auth.ts sameOrigin) and use SameSite=Lax cookies.
  security: {
    checkOrigin: false,
    allowedDomains: [
      { hostname: 'legitimate-tarantula-b4db.podway.site', protocol: 'https' },
      { hostname: 'www.bifode.org', protocol: 'https' },
      { hostname: 'bifode.org', protocol: 'https' }
    ]
  }
});
