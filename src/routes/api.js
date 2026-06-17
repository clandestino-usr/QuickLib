const express = require('express');
const router  = express.Router();
const { getBookDetail, getTags } = require('../queries');

router.get('/book/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const book = getBookDetail(id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  res.json(book);
});

router.get('/tags', (req, res) => {
  const search = String(req.query.q || '').trim() || null;
  const author = String(req.query.author || '').trim() || null;
  res.json(getTags(search, author));
});

module.exports = router;
