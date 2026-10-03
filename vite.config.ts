import { defineConfig } from 'vite';
import express from 'express';
import { apiRouter } from './server/api.ts';
function install(server: {
  middlewares: {
    use: (
      handler: (
        req: import('node:http').IncomingMessage,
        res: import('node:http').ServerResponse,
        next: () => void,
      ) => void,
    ) => unknown;
  };
}) {
  const app = express();
  app.use('/api', apiRouter());
  server.middlewares.use((req, res, next) =>
    app(req as express.Request, res as express.Response, next),
  );
}
export default defineConfig({
  plugins: [{ name: 'function-api', configureServer: install, configurePreviewServer: install }],
  build: {
    rollupOptions: { output: { manualChunks: { math: ['katex'], react: ['react', 'react-dom'] } } },
  },
});
