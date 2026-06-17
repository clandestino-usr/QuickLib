const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const { libraryPath } = require('../db');
const { getBookFile } = require('../queries');

const LIB_ROOT = path.resolve(libraryPath) + path.sep;

router.get('/:id/:format', (req, res) => {
  const id     = parseInt(req.params.id, 10);
  const format = req.params.format;

  if (!id || id <= 0)             return res.status(400).end();
  if (!/^[a-zA-Z0-9]+$/.test(format)) return res.status(400).end();

  const bookFile = getBookFile(id, format.toUpperCase());
  if (!bookFile) return res.status(404).end();

  const filePath = path.resolve(
    path.join(libraryPath, bookFile.path, `${bookFile.name}.${format.toLowerCase()}`)
  );
  if (!filePath.startsWith(LIB_ROOT)) return res.status(403).end();

  if (!fs.existsSync(filePath)) return res.status(404).end();

  res.download(filePath);
});

module.exports = router;
