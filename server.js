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
    maxAge: '1d',
    etag: true,
    extensions: ['html'],
    setHeaders(res, filePath) {
      // Basic security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// SPA fallback to index.html for non-file routes
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (!req.accepts('html')) return next();
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
