const { esc, formatAuthorsHtml, formatBadges } = require('../utils');

function renderList(books, opts) {
  if (!books.length) {
    return '<p class="empty-state">Aucun livre trouvé.</p>';
  }

  const rows = books.map(book => {
    const hasCover = Boolean(book.has_cover);
    const thumb = hasCover
      ? `<img src="/covers/${book.id}" alt="" loading="lazy" class="list-cover" onerror="this.parentElement.classList.add('no-cover');this.remove()">`
      : '';

    return `<tr>
  <td class="list-cover-cell${hasCover ? '' : ' no-cover'}" data-book-id="${book.id}">${thumb}</td>
  <td class="list-title"><span data-book-id="${book.id}">${esc(book.title)}</span></td>
  <td class="list-authors">${formatAuthorsHtml(book.authors, opts)}</td>
  <td class="list-formats">${formatBadges(book.formats, book.id)}</td>
</tr>`;
  }).join('\n');

  return `<div class="table-wrap">
<table class="book-list">
  <thead>
    <tr>
      <th class="list-cover-cell"></th>
      <th>Titre</th>
      <th>Auteur(s)</th>
      <th>Formats</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
</div>`;
}

module.exports = { renderList };
