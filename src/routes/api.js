const express = require('express');
const router  = express.Router();
const { getBookDetail } = require('../queries');

router.get('/book/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const book = getBookDetail(id);
  if (!book) return res.status(404).json({ error: 'Not found' });

  res.json(book);
});

module.exports = router;
