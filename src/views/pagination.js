const { buildUrl, esc } = require('../utils');

function renderPagination({ page, totalPages, perPage, sort, search, author, tags, view, showPerPage = false, extraClass = '' }) {
  if (totalPages <= 1) return '';

  function pgUrl(p) {
    return buildUrl({ q: search, author, tags, sort, per_page: perPage, view, page: p });
  }

  function btn(p, label, disabled = false, current = false) {
    if (disabled) return `<span class="pg-btn disabled">${label}</span>`;
    if (current)  return `<span class="pg-btn current">${label}</span>`;
    return `<a href="${pgUrl(p)}" class="pg-btn">${label}</a>`;
  }

  const windowStart = Math.max(1, page - 2);
  const windowEnd   = Math.min(totalPages, page + 2);
  const pageNums    = [];

  if (windowStart > 1) pageNums.push(null);
  for (let p = windowStart; p <= windowEnd; p++) pageNums.push(p);
  if (windowEnd < totalPages) pageNums.push(null);

  const pageLinks = pageNums.map(p =>
    p === null
      ? '<span class="pg-btn ellipsis">…</span>'
      : btn(p, p, false, p === page)
  ).join('');

  const perPageSelect = showPerPage ? `<form id="per-page-form" method="get" action="/" class="pg-per-page-form">
    <input type="hidden" name="q"      value="${esc(search || '')}">
    ${author ? `<input type="hidden" name="author" value="${esc(author)}">` : ''}
    ${tags ? `<input type="hidden" name="tags" value="${esc(tags)}">` : ''}
    <input type="hidden" name="sort"   value="${esc(sort)}">
    <input type="hidden" name="view"   value="${esc(view)}">
    <input type="hidden" name="page"   value="1">
    <select name="per_page" class="pg-btn pg-per-page" aria-label="Livres par page">
      ${[10, 25, 50, 100].map(n =>
        `<option value="${n}"${perPage === n ? ' selected' : ''}>${n} / p.</option>`
      ).join('')}
    </select>
  </form>` : '';

  const cls = ['pagination', extraClass].filter(Boolean).join(' ');

  return `<nav class="${cls}" aria-label="Pagination">
  ${btn(1, '«', page === 1)}
  ${btn(page - 1, '‹', page === 1)}
  ${pageLinks}
  ${perPageSelect}
  ${btn(page + 1, '›', page === totalPages)}
  ${btn(totalPages, '»', page === totalPages)}
</nav>`;
}

module.exports = { renderPagination };
