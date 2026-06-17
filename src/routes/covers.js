const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const { libraryPath }  = require('../db');
const { getBookPath }  = require('../queries');

const LIB_ROOT = path.resolve(libraryPath) + path.sep;

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id <= 0) return res.status(400).end();

  const book = getBookPath(id);
  if (!book || !book.has_cover) return res.status(404).end();

  const coverPath = path.resolve(path.join(libraryPath, book.path, 'cover.jpg'));
  if (!coverPath.startsWith(LIB_ROOT)) return res.status(403).end();

  if (!fs.existsSync(coverPath)) return res.status(404).end();

  res.set('Cache-Control', 'public, max-age=86400');
  res.sendFile(coverPath);
});

module.exports = router;
