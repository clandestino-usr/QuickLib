function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildUrl(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') {
      p.set(k, String(v));
    }
  }
  const qs = p.toString();
  return qs ? '/?' + qs : '/';
}

const FORMAT_CLASS = {
  EPUB: 'epub', PDF: 'pdf', MOBI: 'mobi',
  AZW: 'azw', AZW3: 'azw', CBZ: 'cbz', CBR: 'cbr',
};

function formatAuthorsHtml(authorsStr, { sort, perPage, view }) {
  if (!authorsStr) return '—';
  const names = authorsStr.split(' & ');
  return names.map(name => {
    const url = buildUrl({ author: name, sort, per_page: perPage, view, page: 1 });
    return `<a href="${url}" class="author-link">${esc(name)}</a>`;
  }).join(' & ');
}

function formatBadges(formats, bookId) {
  if (!formats) return '';
  return formats.split(',').map(fmt => {
    const cls = FORMAT_CLASS[fmt] || 'other';
    return `<a href="/download/${bookId}/${esc(fmt.toLowerCase())}" class="badge fmt-${cls}">${esc(fmt)}</a>`;
  }).join('');
}

module.exports = { esc, buildUrl, formatAuthorsHtml, formatBadges };
