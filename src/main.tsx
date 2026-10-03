import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import '@fontsource-variable/inter';
import '@fontsource/stix-two-text/400.css';
import '@fontsource/stix-two-text/400-italic.css';
import 'katex/dist/katex.min.css';
import './style.css';
import './motion.css';
import './workspace.css';
import { App } from './App';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
);
