(() => {
  const slider = document.getElementById("slider");
  const pages = Array.from(document.querySelectorAll(".page"));
  const navButtons = Array.from(document.querySelectorAll(".nav__btn"));
  const dots = Array.from(document.querySelectorAll(".dot"));

  const PAGE_COUNT = pages.length; // 5
  const START_PAGE = 3; // Snapchat-style: middle screen
  let currentIndex = START_PAGE - 1;

  // --- Core: goTo(index) ---
  function goTo(index, { animate = true } = {}) {
    currentIndex = Math.max(0, Math.min(PAGE_COUNT - 1, index));

    slider.style.transition = animate ? "transform 220ms ease" : "none";
    slider.style.transform = `translate3d(${-currentIndex * 100}%, 0, 0)`;

    // Update nav + dots
    navButtons.forEach((b, i) => b.classList.toggle("is-active", i === currentIndex));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === currentIndex));
  }

  // Start in the middle (no animation on load)
  goTo(currentIndex, { animate: false });

  // --- Click nav buttons ---
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = Number(btn.dataset.go) - 1;
      goTo(target);
    });
  });

  // --- Swipe handling (touch + mouse) ---
  let isDown = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let startTime = 0;
  let width = 0;
  let isSliding = null; // null = undecided, true = horizontal slide, false = vertical scroll

  function onStart(clientX, clientY) {
    isDown = true;
    startX = clientX;
    startY = clientY || 0;
    lastX = clientX;
    startTime = performance.now();
    width = slider.getBoundingClientRect().width;
    isSliding = null;

    slider.style.transition = "none";
  }

  function onMove(clientX, clientY) {
    if (!isDown) return;
    lastX = clientX;

    const dx = clientX - startX;
    const dy = (clientY || 0) - startY;

    // Decide whether the gesture is horizontal (slide) or vertical (scroll).
    if (isSliding === null) {
      // small threshold to avoid noise
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      isSliding = Math.abs(dx) > Math.abs(dy);
    }

    // If it's a vertical scroll gesture, don't move the slider here.
    if (!isSliding) return;

    const percent = (dx / width) * 100;

    // Rubber-band near edges
    let offset = -currentIndex * 100 + percent;
    if (currentIndex === 0 && dx > 0) offset = -currentIndex * 100 + percent * 0.35;
    if (currentIndex === PAGE_COUNT - 1 && dx < 0) offset = -currentIndex * 100 + percent * 0.35;

    slider.style.transform = `translate3d(${offset}%, 0, 0)`;
  }

  function onEnd() {
    if (!isDown) return;
    isDown = false;

    // if the gesture wasn't a horizontal slide, just reset and do nothing
    if (!isSliding) {
      isSliding = null;
      return;
    }

    const dx = lastX - startX;
    const dt = performance.now() - startTime;
    const velocity = Math.abs(dx) / Math.max(dt, 1); // px per ms
    const threshold = Math.min(90, window.innerWidth * 0.18); // swipe distance threshold

    let nextIndex = currentIndex;

    // Decide if we should change page
    if (Math.abs(dx) > threshold || velocity > 0.65) {
      if (dx < 0) nextIndex = currentIndex + 1; // swipe left -> next page
      if (dx > 0) nextIndex = currentIndex - 1; // swipe right -> previous page
    }

    isSliding = null;
    goTo(nextIndex, { animate: true });
  }

  // Touch events
  slider.addEventListener("touchstart", (e) => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  slider.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  slider.addEventListener("touchend", onEnd);

  // Mouse (for desktop testing)
  slider.addEventListener("mousedown", (e) => onStart(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onEnd);

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(currentIndex - 1);
    if (e.key === "ArrowRight") goTo(currentIndex + 1);
  });

  // Keep the snap correct on resize
  window.addEventListener("resize", () => goTo(currentIndex, { animate: false }));

  // Quick actions handlers (placeholders)
  const quickGridButtons = Array.from(document.querySelectorAll('.grid-btn'));
  quickGridButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'quick':
          alert('Quick entry — open fast entry (placeholder)');
          break;
        case 'long':
          alert('Long entry — open detailed editor (placeholder)');
          break;
        case 'picture':
          alert('Add picture — open camera/gallery (placeholder)');
          break;
        case 'video':
          alert('Add video — open recorder (placeholder)');
          break;
        default:
          console.log('Unknown action', action);
      }
    });
  });

  // --- Mood check (Quick Add page) ---
  const moodSlider = document.getElementById('mood-slider');
  const moodText = document.getElementById('mood-text');
  const logMoodBtn = document.getElementById('log-mood');

  const MOOD_LABELS = {
    1: { text: 'Very Bad', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle><path d="M8 15c1.2-1.5 3.2-1.5 4.5 0" transform="translate(0,2)"></path></svg>' },
    2: { text: 'Bad', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle><path d="M8 14c1-1 3-1 4 0" transform="translate(0,2)"></path></svg>' },
    3: { text: 'Neutral', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle><line x1="9" y1="15" x2="15" y2="15"></line></svg>' },
    4: { text: 'Good', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle><path d="M8 13c1 1 3 1 4 0" transform="translate(0,0)"></path></svg>' },
    5: { text: 'Great', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="15" cy="10" r="1"></circle><path d="M8 13c1.2 1.5 3.2 1.5 4.5 0" transform="translate(0,0)"></path></svg>' }
  };

  function updateMoodPreview(v) {
    const m = MOOD_LABELS[v] || MOOD_LABELS[3];
    if (moodText) moodText.innerHTML = `${m.svg} <span style="margin-left:8px">${m.text}</span>`;
  }

  if (moodSlider) {
    // initialize to middle (no persistence)
    moodSlider.value = '3';
    updateMoodPreview(3);
    moodSlider.addEventListener('input', (e) => updateMoodPreview(Number(e.target.value)));
  }

  // Log mood as an entry (does NOT persist the slider itself)
  if (logMoodBtn) {
    logMoodBtn.addEventListener('click', () => {
      const v = moodSlider ? Number(moodSlider.value) : 3;
      const m = MOOD_LABELS[v] || MOOD_LABELS[3];
      const items = loadEntries();
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
      const title = `Mood — ${m.text}`;
      const body = `Mood rating: ${v}/5\n${m.emoji}`;
      items.push({ id, title, body, category: '', ts: Date.now() });
      saveEntries(items);
      // clear slider to neutral for next app start (no persistence anyway)
      if (moodSlider) { moodSlider.value = '3'; updateMoodPreview(3); }
      renderEntries();
      // navigate to entries page to show the logged mood (optional UX)
      const targetBtn = document.querySelector('.nav__btn[data-go="2"]');
      if (targetBtn) targetBtn.click();
    });
  }

  // --- Categories manager (load/save + UI) ---
  const STORAGE_KEY = 'lifelog_categories';
  const addBtn = document.getElementById('add-category');
  const nameInput = document.getElementById('cat-name');
  const colorInput = document.getElementById('cat-color');
  const listEl = document.getElementById('categories-list');

  function loadCategories() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveCategories(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { console.error(e); }
  }

  function renderCategories() {
    const items = loadCategories();
    listEl.innerHTML = '';
    if (!items.length) {
      const p = document.createElement('li');
      p.className = 'category-item';
      p.textContent = 'No categories yet. Add one above.';
      listEl.appendChild(p);
      return;
    }

    items.forEach((c) => {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.dataset.id = c.id;
      li.draggable = true;

      // drag handle
      const handle = document.createElement('button');
      handle.className = 'drag-handle';
      handle.type = 'button';
      handle.setAttribute('aria-label', 'Drag to reorder');
      handle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7" cy="6" r="1.5"></circle><circle cx="7" cy="12" r="1.5"></circle><circle cx="7" cy="18" r="1.5"></circle><circle cx="17" cy="6" r="1.5"></circle><circle cx="17" cy="12" r="1.5"></circle><circle cx="17" cy="18" r="1.5"></circle></svg>';

      // color swatch
      const sw = document.createElement('span');
      sw.className = 'category-color-swatch';
      sw.style.background = c.color || '#ddd';

      // name
      const name = document.createElement('span');
      name.className = 'category-name';
      name.textContent = c.name;

      // edit button (pencil SVG)
      const edit = document.createElement('button');
      edit.className = 'category-edit';
      edit.setAttribute('aria-label', `Edit category ${c.name}`);
      edit.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21v-3a2 2 0 0 1 .6-1.4L17 3l3 3L6.6 20.4A2 2 0 0 1 5.2 21H3z"></path><path d="M14 7l3 3"></path></svg>';
      edit.addEventListener('click', () => {
        // replace content with edit controls
        li.innerHTML = '';
        const input = document.createElement('input');
        input.className = 'edit-input';
        input.value = c.name;
        input.setAttribute('aria-label', 'Edit category name');

        const color = document.createElement('input');
        color.type = 'color';
        color.className = 'edit-color';
        color.value = c.color || '#7c3aed';
        color.setAttribute('aria-label', 'Edit category color');

        const save = document.createElement('button');
        save.className = 'save-btn';
        save.textContent = 'Save';
        const cancel = document.createElement('button');
        cancel.className = 'cancel-btn';
        cancel.textContent = 'Cancel';

        const controls = document.createElement('div');
        controls.className = 'edit-controls';
        controls.appendChild(input);
        controls.appendChild(color);
        controls.appendChild(save);
        controls.appendChild(cancel);

        li.appendChild(controls);

        save.addEventListener('click', () => {
          const items = loadCategories();
          const idx = items.findIndex((it) => it.id === c.id);
          if (idx >= 0) {
            items[idx].name = (input.value || '').trim() || items[idx].name;
            items[idx].color = color.value || items[idx].color;
            saveCategories(items);
            renderCategories();
          }
        });

        cancel.addEventListener('click', () => renderCategories());
        input.focus();
      });

      // remove button
      const remove = document.createElement('button');
      remove.className = 'category-remove';
      remove.setAttribute('aria-label', `Remove category ${c.name}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
      remove.addEventListener('click', () => {
        const next = loadCategories().filter((it) => it.id !== c.id);
        saveCategories(next);
        renderCategories();
      });

      // assemble
      li.appendChild(handle);
      li.appendChild(sw);
      li.appendChild(name);
      li.appendChild(edit);
      li.appendChild(remove);

      // Drag & drop handlers
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', c.id);
        e.dataTransfer.effectAllowed = 'move';
        li.classList.add('dragging');
      });

      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        const els = listEl.querySelectorAll('.category-item');
        els.forEach((el) => el.classList.remove('drag-over'));
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('drag-over');
      });

      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));

      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId || draggedId === c.id) return;
        const items = loadCategories();
        const from = items.findIndex((it) => it.id === draggedId);
        const to = items.findIndex((it) => it.id === c.id);
        if (from < 0 || to < 0) return;
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        saveCategories(items);
        renderCategories();
      });

      listEl.appendChild(li);
    });
  }

  function addCategory() {
    const name = (nameInput.value || '').trim();
    const color = colorInput.value || '#7c3aed';
    if (!name) {
      nameInput.focus();
      return;
    }

    const items = loadCategories();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    items.push({ id, name, color });
    saveCategories(items);
    renderCategories();
    nameInput.value = '';
    nameInput.focus();
  }

  if (addBtn) addBtn.addEventListener('click', addCategory);
  // allow Enter in name input
  if (nameInput) nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCategory(); });

  // initial render
  renderCategories();

  // --- Entries manager ---
  const ENTRY_KEY = 'lifelog_entries';
  const saveEntryBtn = document.getElementById('save-entry');
  const entryTitle = document.getElementById('entry-title');
  const entryCategory = document.getElementById('entry-category');
  const entryBody = document.getElementById('entry-body');
  const entriesList = document.getElementById('entries-list');

  function loadEntries() {
    try { const raw = localStorage.getItem(ENTRY_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }

  function saveEntries(items) { try { localStorage.setItem(ENTRY_KEY, JSON.stringify(items)); } catch (e) { console.error(e); } }

  function populateCategorySelect() {
    const cats = loadCategories();
    if (!entryCategory) return;
    entryCategory.innerHTML = '<option value="">Choose category</option>';
    cats.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      opt.style.background = c.color;
      entryCategory.appendChild(opt);
    });
  }

  function renderEntries() {
    const items = loadEntries();
    entriesList.innerHTML = '';
    if (!items.length) {
      entriesList.textContent = 'No entries yet.';
      return;
    }

    // newest first
    items.slice().reverse().forEach((en) => {
      const card = document.createElement('article');
      card.className = 'entry-card';

      const header = document.createElement('div');
      header.className = 'entry-header';

      const title = document.createElement('div');
      title.className = 'entry-title-display';
      title.textContent = en.title;

      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      const d = new Date(en.ts || Date.now());
      meta.textContent = d.toLocaleString();

      const cat = loadCategories().find((c) => c.id === en.category);
      if (cat) {
        const badge = document.createElement('span');
        badge.className = 'entry-category-badge';
        badge.textContent = cat.name;
        badge.style.background = cat.color || '#666';
        header.appendChild(badge);
      }

      header.appendChild(title);
      header.appendChild(meta);

      const body = document.createElement('div');
      body.className = 'entry-body-display';
      body.textContent = en.body;

      card.appendChild(header);
      card.appendChild(body);

      entriesList.appendChild(card);
    });
    // update stats after rendering
    renderStats();
  }

  function addEntry() {
    const title = (entryTitle.value || '').trim();
    const body = (entryBody.value || '').trim();
    const category = entryCategory.value || '';
    if (!title || !body) {
      if (!title) entryTitle.focus(); else entryBody.focus();
      return;
    }
    const items = loadEntries();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    items.push({ id, title, body, category, ts: Date.now() });
    saveEntries(items);
    entryTitle.value = '';
    entryBody.value = '';
    entryCategory.value = '';
    renderEntries();
  }

  // wire up
  if (saveEntryBtn) saveEntryBtn.addEventListener('click', addEntry);
  if (entryTitle) entryTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addEntry(); });

  // populate categories select whenever categories re-render
  const originalRenderCategories = renderCategories;
  renderCategories = function() {
    originalRenderCategories();
    populateCategorySelect();
    renderEntries();
  };

  // initial population
  populateCategorySelect();
  renderEntries();

  // --- Stats for Tracker & Progress ---
  function renderStats() {
    const entries = loadEntries();
    const cats = loadCategories();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // counts per category
    const counts = {};
    entries.forEach((e) => {
      if (!e.category) return;
      counts[e.category] = (counts[e.category] || 0) + 1;
    });

    // filter categories that have entries
    const catCounts = cats.map((c) => ({ id: c.id, name: c.name, color: c.color, count: counts[c.id] || 0 }));
    const used = catCounts.filter((c) => c.count > 0);

    // most logged
    const mostEl = document.getElementById('stat-most');
    const leastEl = document.getElementById('stat-least');
    const last7El = document.getElementById('stat-7d');
    const last30El = document.getElementById('stat-30d');

    if (mostEl) {
      if (!used.length) {
        mostEl.querySelector('.stat-value').textContent = '—';
      } else {
        const top = used.slice().sort((a,b) => b.count - a.count)[0];
        mostEl.querySelector('.stat-value').innerHTML = `<span class=\"stat-badge\" style=\"background:${top.color}\">${top.name}</span> <span>${top.count}</span>`;
      }
    }

    if (leastEl) {
      if (!used.length) {
        leastEl.querySelector('.stat-value').textContent = '—';
      } else {
        const low = used.slice().sort((a,b) => a.count - b.count)[0];
        leastEl.querySelector('.stat-value').innerHTML = `<span class=\"stat-badge\" style=\"background:${low.color}\">${low.name}</span> <span>${low.count}</span>`;
      }
    }

    // counts in time windows
    const last7 = entries.filter((e) => (now - (e.ts || 0)) <= 7 * day).length;
    const last30 = entries.filter((e) => (now - (e.ts || 0)) <= 30 * day).length;
    if (last7El) last7El.querySelector('.stat-value').textContent = String(last7);
    if (last30El) last30El.querySelector('.stat-value').textContent = String(last30);
    // render chart after stats
    renderChart(catCounts, entries);
  }

  function renderChart(catCounts, entries) {
    const chart = document.getElementById('category-chart');
    if (!chart) return;
    chart.innerHTML = '';

    if (!catCounts.length) {
      chart.textContent = 'No categories available.';
      return;
    }

    // compute counts map (ensure zeros included)
    const counts = {};
    entries.forEach((e) => { if (e.category) counts[e.category] = (counts[e.category] || 0) + 1; });

    // map categories with counts
    const rows = catCounts.map((c) => ({ id: c.id, name: c.name, color: c.color || '#777', count: counts[c.id] || 0 }));
    // sort descending
    rows.sort((a,b) => b.count - a.count);

    const max = rows.length ? Math.max(...rows.map(r => r.count), 1) : 1;

    rows.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'chart-row';

      const label = document.createElement('div');
      label.className = 'chart-label';
      label.textContent = r.name;

      const wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';

      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      const pct = Math.round((r.count / max) * 100);
      // minimal visible width for non-zero
      const widthPct = r.count === 0 ? 4 : Math.max(6, pct);
      bar.style.width = widthPct + '%';
      bar.style.background = r.color;

      wrap.appendChild(bar);

      const val = document.createElement('div');
      val.className = 'chart-value';
      val.textContent = String(r.count);

      row.appendChild(label);
      row.appendChild(wrap);
      row.appendChild(val);

      chart.appendChild(row);
      // animate width on next frame
      requestAnimationFrame(() => { bar.style.width = (r.count === 0 ? '4%' : Math.max(6, pct) + '%'); });
    });
  }

  // Call stats when categories change too (renderCategories wrapper calls renderEntries which calls renderStats)
  renderStats();
})();
