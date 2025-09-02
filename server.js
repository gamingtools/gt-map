// Simple Express static server for local development
// Serves the project root and falls back to index.html

const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5173;
const ROOT = __dirname;

app.use(compression());
app.use(
  express.static(ROOT, {
    maxAge: 0,
    etag: false,
    extensions: ['html'],
    setHeaders(res, filePath) {
      // Basic security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Disable caching for development
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    },
  })
);

// SPA fallback to index.html for non-file routes
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (!req.accepts('html')) return next();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
