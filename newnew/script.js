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
})();
