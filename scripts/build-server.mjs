import { build } from 'esbuild';

// Bundle every local TypeScript dependency into JavaScript before Vercel traces the API.
await build({
  entryPoints: ['server/api.ts'],
  outfile: 'server-build/api.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
});
