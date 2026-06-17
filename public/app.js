(function () {
  'use strict';

  // ── Storage helpers ─────────────────────────────────────────────────────────

  function lsGet(k)    { try { return localStorage.getItem(k);  } catch (_) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v);      } catch (_) {}              }

  // ── Theme: apply saved preference NOW to avoid flash of wrong theme ─────────

  var savedTheme = lsGet('ql_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // ── Preference persistence (redirect on fresh visit) ────────────────────────

  var VALID = {
    per_page: ['10', '25', '50', '100'],
    sort:     ['recent', 'title_asc', 'title_desc', 'author_asc', 'author_desc'],
    view:     ['grid', 'list']
  };
  var DEFAULTS = { per_page: '25', sort: 'recent', view: 'grid' };

  var params  = new URLSearchParams(window.location.search);
  var changed = false;
  Object.keys(DEFAULTS).forEach(function (key) {
    if (!params.has(key)) {
      var saved = lsGet('ql_' + key);
      if (saved && VALID[key].indexOf(saved) !== -1 && saved !== DEFAULTS[key]) {
        params.set(key, saved);
        changed = true;
      }
    }
  });
  if (changed) {
    window.location.replace(window.location.pathname + '?' + params.toString());
    return;
  }

  // ── DOM-ready ───────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {

    // ── Theme toggle ─────────────────────────────────────────────────────────

    var ICON_SUN = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3.25"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.4 3.4l1.05 1.05M11.55 11.55l1.05 1.05M3.4 12.6l1.05-1.05M11.55 4.45l1.05-1.05"/></svg>';
    var ICON_MOON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.3 10.6A6 6 0 0 1 5.4 2.7a6 6 0 1 0 7.9 7.9z"/></svg>';

    function applyThemeIcon(btn, theme) {
      btn.innerHTML = (theme === 'dark') ? ICON_SUN : ICON_MOON;
    }

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      var initTheme = document.documentElement.getAttribute('data-theme') || 'auto';
      if (initTheme === 'auto') {
        initTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      applyThemeIcon(themeBtn, initTheme);

      themeBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        if (current === 'auto') {
          current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        var next = (current === 'dark') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        lsSet('ql_theme', next);
        applyThemeIcon(this, next);
      });
    }

    // ── Sort form: auto-submit on change ─────────────────────────────────────

    document.querySelectorAll('#controls-form select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        lsSet('ql_' + this.name, this.value);
        document.getElementById('controls-form').submit();
      });
    });

    // ── Per-page select in pagination: auto-submit on change ─────────────────

    var perPageSel = document.querySelector('.pg-per-page');
    if (perPageSel) {
      perPageSel.addEventListener('change', function () {
        lsSet('ql_per_page', this.value);
        document.getElementById('per-page-form').submit();
      });
    }

    // ── View toggle: save preference before navigation ────────────────────────

    document.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = this.href.match(/[?&]view=([^&]+)/);
        if (m) lsSet('ql_view', decodeURIComponent(m[1]));
      });
    });

    // ── QuickLib logo: clear filters but keep view & per_page ────────────────

    var logo = document.querySelector('.site-title');
    if (logo) {
      logo.addEventListener('click', function (e) {
        var homeUrl = this.dataset.homeUrl;
        if (homeUrl) {
          e.preventDefault();
          window.location.href = homeUrl;
        }
      });
    }

    // ── Tags dropdown ────────────────────────────────────────────────────────

    var tagsBtn     = document.getElementById('tags-dropdown-btn');
    var tagsPanel   = document.getElementById('tags-dropdown');
    var tagsFilter  = document.getElementById('tags-filter');
    var tagsList    = document.getElementById('tags-list');
    var tagsBadge   = document.getElementById('tags-count-badge');
    var tagsApply   = document.getElementById('tags-apply');
    var tagsReset   = document.getElementById('tags-reset');

    if (tagsBtn && tagsPanel) {
      var tagData    = null;
      var selected   = {};
      var fetchedFor = { q: null, author: null };

      var curParams = new URLSearchParams(window.location.search);
      var rawTags = curParams.get('tags') || '';
      if (rawTags) {
        rawTags.split(',').forEach(function (t) {
          t = t.trim();
          if (t) selected[t] = true;
        });
      }
      updateBadge();

      function updateBadge() {
        var count = Object.keys(selected).length;
        if (tagsBadge) tagsBadge.textContent = count || '';
        if (tagsReset) tagsReset.hidden = count === 0;
      }

      function buildTagUrl() {
        var names = Object.keys(selected);
        if (!names.length) {
          curParams.delete('tags');
        } else {
          curParams.set('tags', names.join(','));
        }
        curParams.set('page', '1');
        return window.location.pathname + '?' + curParams.toString();
      }

      function openPanel() {
        tagsPanel.hidden = false;
        tagsFilter.value = '';
        tagsFilter.focus();

        var curQ      = curParams.get('q') || '';
        var curAuthor = curParams.get('author') || '';

        if (!tagData || fetchedFor.q !== curQ || fetchedFor.author !== curAuthor) {
          tagsList.innerHTML = '<div class="tags-list-empty">Chargement…</div>';
          fetch('/api/tags?q=' + encodeURIComponent(curQ) + '&author=' + encodeURIComponent(curAuthor))
            .then(function (r) { return r.json(); })
            .then(function (data) {
              tagData = data;
              fetchedFor = { q: curQ, author: curAuthor };
              renderTags();
            })
            .catch(function () {
              tagsList.innerHTML = '<div class="tags-list-empty">Erreur de chargement.</div>';
            });
        } else {
          renderTags();
        }
      }

      function closePanel() {
        tagsPanel.hidden = true;
      }

      function renderTags() {
        if (!tagData) return;
        var filter = tagsFilter.value.trim().toLowerCase();

        var subsetMap = {};
        (tagData.subset || []).forEach(function (t) { subsetMap[t.name] = t.count; });

        var seen = {};
        var merged = [];
        (tagData.subset || []).forEach(function (t) {
          if (!seen[t.name]) { seen[t.name] = true; merged.push({ name: t.name, count: t.count, inSubset: true }); }
        });
        (tagData.all || []).forEach(function (t) {
          if (!seen[t.name]) { seen[t.name] = true; merged.push({ name: t.name, count: 0, inSubset: false }); }
        });

        if (filter) {
          merged = merged.filter(function (t) { return t.name.toLowerCase().indexOf(filter) !== -1; });
        }

        // Selected tags first, then alphabetical
        merged.sort(function (a, b) {
          var sa = selected[a.name] ? 0 : 1;
          var sb = selected[b.name] ? 0 : 1;
          if (sa !== sb) return sa - sb;
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        if (!merged.length) {
          tagsList.innerHTML = '<div class="tags-list-empty">Aucun tag.</div>';
          return;
        }

        var html = '';
        for (var i = 0; i < merged.length; i++) {
          var t   = merged[i];
          var chk = selected[t.name] ? ' checked' : '';
          var cnt = t.count ? ' <span class="tag-count">' + t.count + '</span>' : '';
          html += '<div class="tag-item">' +
            '<input type="checkbox" id="tag-' + i + '" value="' + escHTML(t.name) + '"' + chk + '>' +
            '<label for="tag-' + i + '">' + escHTML(t.name) + '</label>' + cnt +
          '</div>';
        }
        tagsList.innerHTML = html;

        tagsList.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
          cb.addEventListener('change', function () {
            if (this.checked) {
              selected[this.value] = true;
            } else {
              delete selected[this.value];
            }
            updateBadge();
          });
        });
      }

      function escHTML(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      // Toggle on button click
      tagsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (tagsPanel.hidden) {
          openPanel();
        } else {
          closePanel();
        }
      });

      // Filter input
      tagsFilter.addEventListener('input', function () {
        renderTags();
      });

      // Apply button
      tagsApply.addEventListener('click', function () {
        window.location.href = buildTagUrl();
      });

      // Reset button
      tagsReset.addEventListener('click', function () {
        selected = {};
        updateBadge();
        renderTags();
      });

      // Prevent panel clicks from bubbling
      tagsPanel.addEventListener('click', function (e) {
        e.stopPropagation();
      });

      // Close on outside click
      document.addEventListener('click', function () {
        if (!tagsPanel.hidden) closePanel();
      });

      // Close on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !tagsPanel.hidden) {
          closePanel();
          tagsBtn.focus();
        }
      });
    }

    // ── Book detail modal ─────────────────────────────────────────────────────

    var modal        = document.getElementById('book-modal');
    var modalTitle   = document.getElementById('modal-title');
    var modalContent = document.getElementById('modal-content');

    function getCurrentPrefs() {
      var p = new URLSearchParams(window.location.search);
      var parts = [];
      parts.push('view=' + (VALID.view.indexOf(p.get('view')) !== -1 ? p.get('view') : DEFAULTS.view));
      var pp = p.get('per_page');
      if (pp && VALID.per_page.indexOf(pp) !== -1) parts.push('per_page=' + pp);
      return parts.join('&');
    }

    var FMT_CLS = {
      EPUB: 'epub', PDF: 'pdf', MOBI: 'mobi',
      AZW: 'azw', AZW3: 'azw', CBZ: 'cbz', CBR: 'cbr'
    };

    function escH(s) {
      return s == null ? '' : String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function fmtSize(bytes) {
      if (!bytes || bytes <= 0) return '';
      if (bytes < 1024)    return bytes + ' o';
      if (bytes < 1048576) return Math.round(bytes / 1024) + ' Ko';
      return (bytes / 1048576).toFixed(1) + ' Mo';
    }

    function fmtIdx(n) {
      return n % 1 === 0 ? String(Math.floor(n)) : String(n);
    }

    function renderModal(book) {
      modalTitle.textContent = book.title || '';

      var year = null;
      if (book.pubdate) {
        var y = parseInt(book.pubdate.slice(0, 4), 10);
        if (y > 1200) year = y;
      }

      var files = [];
      if (book.files) {
        files = book.files.split(',').filter(Boolean).map(function (f) {
          var parts = f.split('|');
          return { fmt: parts[0], size: parseInt(parts[1], 10) || 0 };
        });
      }

      var html = '<div class="modal-body">';
      if (book.has_cover) {
        html += '<img src="/covers/' + book.id + '" class="modal-cover" alt="" loading="lazy">';
      }

      html += '<dl class="modal-meta">';
      if (book.authors) {
        var prefs = getCurrentPrefs();
        var authorLinks = book.authors.split(' & ').map(function (a) {
          return '<a href="/?author=' + encodeURIComponent(a) + '&' + prefs + '&page=1" class="author-link">' + escH(a) + '</a>';
        }).join(' & ');
        html += '<dt>Auteur(s)</dt><dd>' + authorLinks + '</dd>';
      }
      if (year)             html += '<dt>Année</dt><dd>'   + year                 + '</dd>';
      if (book.publisher)   html += '<dt>Éditeur</dt><dd>' + escH(book.publisher) + '</dd>';
      if (book.series_name) {
        var si = book.series_index != null ? ' #' + fmtIdx(book.series_index) : '';
        html += '<dt>Série</dt><dd>' + escH(book.series_name) + escH(si) + '</dd>';
      }
      if (book.language)    html += '<dt>Langue</dt><dd>'  + escH(book.language) + '</dd>';
      if (book.tags)        html += '<dt>Tags</dt><dd>'    + escH(book.tags)     + '</dd>';
      html += '</dl></div>';

      if (book.description) {
        html += '<div class="modal-description">' + book.description + '</div>';
      }

      if (files.length) {
        html += '<div class="modal-downloads">';
        files.forEach(function (f) {
          var cls = FMT_CLS[f.fmt] || 'other';
          var sz  = fmtSize(f.size);
          html += '<a href="/download/' + book.id + '/' + escH(f.fmt.toLowerCase()) + '"'
                + ' class="badge fmt-' + cls + ' modal-dl-btn">'
                + escH(f.fmt);
          if (sz) html += ' <span class="dl-size">' + sz + '</span>';
          html += '</a>';
        });
        html += '</div>';
      }

      modalContent.innerHTML = html;
    }

    function showModal(id) {
      modalTitle.textContent = '…';
      modalContent.innerHTML = '<p class="modal-loading">Chargement…</p>';
      modal.showModal();

      fetch('/api/book/' + encodeURIComponent(id))
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(renderModal)
        .catch(function () {
          modalContent.innerHTML = '<p>Erreur de chargement.</p>';
        });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var trigger = e.target.closest('[data-book-id]');
      if (!trigger) return;
      e.preventDefault();
      showModal(trigger.dataset.bookId);
    });

    document.getElementById('modal-close').addEventListener('click', function () {
      modal.close();
    });

    modal.addEventListener('click', function (e) {
      if (e.target === this) this.close();
    });

  });
})();
