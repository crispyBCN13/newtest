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
  let lastX = 0;
  let startTime = 0;
  let width = 0;

  function onStart(clientX) {
    isDown = true;
    startX = clientX;
    lastX = clientX;
    startTime = performance.now();
    width = slider.getBoundingClientRect().width;

    slider.style.transition = "none";
  }

  function onMove(clientX) {
    if (!isDown) return;
    lastX = clientX;

    const dx = clientX - startX;
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

    goTo(nextIndex, { animate: true });
  }

  // Touch events
  slider.addEventListener("touchstart", (e) => onStart(e.touches[0].clientX), { passive: true });
  slider.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
  slider.addEventListener("touchend", onEnd);

  // Mouse (for desktop testing)
  slider.addEventListener("mousedown", (e) => onStart(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
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
})();
