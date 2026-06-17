const { esc, formatAuthorsHtml, formatBadges } = require('../utils');

function renderGrid(books, opts) {
  if (!books.length) {
    return '<p class="empty-state">Aucun livre trouvé.</p>';
  }

  const cards = books.map(book => {
    const hasCover = Boolean(book.has_cover);
    const cover = hasCover
      ? `<img src="/covers/${book.id}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-cover');this.remove()">`
      : '';

    return `<article class="book-card">
  <div class="cover-wrap${hasCover ? '' : ' no-cover'}" data-book-id="${book.id}">${cover}</div>
  <div class="book-info">
    <p class="book-title" data-book-id="${book.id}" title="${esc(book.title)}">${esc(book.title)}</p>
    <p class="book-authors">${formatAuthorsHtml(book.authors, opts)}</p>
    <div class="formats">${formatBadges(book.formats, book.id)}</div>
  </div>
</article>`;
  }).join('\n');

  return `<div class="book-grid">\n${cards}\n</div>`;
}

module.exports = { renderGrid };
