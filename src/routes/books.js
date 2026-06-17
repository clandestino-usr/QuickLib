const express = require('express');
const router = express.Router();
const { getCount, getBooks } = require('../queries');
const { renderPage }         = require('../views/layout');
const { renderGrid }         = require('../views/bookGrid');
const { renderList }         = require('../views/bookList');
const { renderPagination }   = require('../views/pagination');

const VALID_SORTS    = new Set(['recent', 'title_asc', 'title_desc', 'author_asc', 'author_desc']);
const VALID_PER_PAGE = new Set([10, 25, 50, 100]);

router.get('/', (req, res) => {
  const search  = String(req.query.q  || '').trim();
  const author  = String(req.query.author || '').trim() || null;
  const sort    = VALID_SORTS.has(req.query.sort)                   ? req.query.sort          : 'recent';
  const perPage = VALID_PER_PAGE.has(Number(req.query.per_page))   ? Number(req.query.per_page) : 25;
  const view    = req.query.view === 'list'                         ? 'list'                  : 'grid';
  const page    = Math.max(1, parseInt(req.query.page) || 1);
  const offset  = (page - 1) * perPage;

  const total      = getCount(search, author);
  const books      = getBooks({ search, author, sort, limit: perPage, offset });
  const totalPages = Math.ceil(total / perPage);

  const viewOpts       = { sort, perPage, view };
  const content        = view === 'list' ? renderList(books, viewOpts) : renderGrid(books, viewOpts);
  const paginationArgs = { page, totalPages, perPage, sort, search, author, view };
  const topPagination    = renderPagination({ ...paginationArgs, showPerPage: false, extraClass: 'pagination-top' });
  const bottomPagination = renderPagination({ ...paginationArgs, showPerPage: true });

  res.send(renderPage({ content, topPagination, bottomPagination, search, author, sort, perPage, view, total }));
});

module.exports = router;
