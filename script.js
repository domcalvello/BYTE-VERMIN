(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const siteHeader = document.querySelector("[data-site-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const specimenButtons = document.querySelectorAll("[data-open-specimen]");
  const modal = document.querySelector("[data-specimen-modal]");
  const modalPanel = modal.querySelector(".modal-panel");
  const modalImage = modal.querySelector("[data-modal-image]");
  const modalSpecimen = modal.querySelector("[data-modal-specimen]");
  const modalTitle = modal.querySelector("[data-modal-title]");
  const modalSeries = modal.querySelector("[data-modal-series]");
  const modalThreat = modal.querySelector("[data-modal-threat]");
  const modalStatus = modal.querySelector("[data-modal-status]");
  const modalCloseControls = modal.querySelectorAll("[data-modal-close]");
  const logoScroll = document.querySelector("[data-logo-scroll]");
  const logoCanvas = document.querySelector("[data-logo-scroll-canvas]");
  const logoFallback = document.querySelector("[data-logo-scroll-fallback]");
  const logoProgress = document.querySelector("[data-logo-scroll-progress]");
  let lastFocusedElement = null;

  function setupLogoScroll() {
    if (!logoScroll || !logoCanvas || !logoFallback) {
      return;
    }

    const context = logoCanvas.getContext("2d", { alpha: false });

    if (!context) {
      return;
    }

    const frameCount = 50;
    const frames = new Array(frameCount);
    const loading = new Set();
    let activeFrame = prefersReducedMotion.matches ? frameCount - 1 : 0;
    let visible = false;
    let drawQueued = false;

    const frameSource = (index) =>
      `images/frames/bvscroll-frame-${String(index + 1).padStart(4, "0")}.webp`;

    function drawFrame(index) {
      const image = frames[index];

      if (!image || !image.complete || !image.naturalWidth) {
        return false;
      }

      const width = logoCanvas.clientWidth;
      const height = logoCanvas.clientHeight;
      const useContainedFrame = window.innerWidth <= 620 ||
        (window.innerHeight <= 500 && window.innerWidth <= 980);
      const scale = useContainedFrame
        ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;

      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);
      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
      logoFallback.classList.add("is-canvas-ready");
      return true;
    }

    function nearestLoadedFrame(index) {
      if (frames[index]) {
        return index;
      }

      for (let distance = 1; distance < frameCount; distance += 1) {
        if (frames[index - distance]) {
          return index - distance;
        }

        if (frames[index + distance]) {
          return index + distance;
        }
      }

      return 0;
    }

    function requestDraw() {
      if (drawQueued) {
        return;
      }

      drawQueued = true;
      window.requestAnimationFrame(() => {
        drawQueued = false;
        drawFrame(nearestLoadedFrame(activeFrame));
      });
    }

    function loadFrame(index) {
      if (index < 0 || index >= frameCount || frames[index] || loading.has(index)) {
        return;
      }

      loading.add(index);
      const image = new Image();
      image.decoding = "async";
      image.src = frameSource(index);
      image.addEventListener("load", () => {
        frames[index] = image;
        loading.delete(index);

        if (index === activeFrame || !logoFallback.classList.contains("is-canvas-ready")) {
          requestDraw();
        }
      });
      image.addEventListener("error", () => loading.delete(index));
    }

    function loadAround(index) {
      [index, index + 1, index - 1, index + 2, index - 2].forEach(loadFrame);
    }

    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(logoCanvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.round(logoCanvas.clientHeight * pixelRatio));

      if (logoCanvas.width !== width || logoCanvas.height !== height) {
        logoCanvas.width = width;
        logoCanvas.height = height;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }

      requestDraw();
    }

    function updateFrame() {
      if (!visible && !prefersReducedMotion.matches) {
        return;
      }

      const bounds = logoScroll.getBoundingClientRect();
      const distance = Math.max(1, logoScroll.offsetHeight - window.innerHeight);
      const progress = prefersReducedMotion.matches
        ? 1
        : Math.min(1, Math.max(0, -bounds.top / distance));

      activeFrame = Math.round(progress * (frameCount - 1));
      loadAround(activeFrame);
      requestDraw();

      if (logoProgress) {
        logoProgress.textContent = `${String(Math.max(1, Math.round(progress * 100))).padStart(3, "0")}%`;
      }
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;

      if (visible) {
        updateFrame();
      }
    }, { rootMargin: "100% 0px" });

    observer.observe(logoScroll);
    window.addEventListener("scroll", updateFrame, { passive: true });
    window.addEventListener("resize", resizeCanvas, { passive: true });

    const initialFrame = prefersReducedMotion.matches ? frameCount - 1 : 0;
    loadFrame(initialFrame);
    resizeCanvas();

    if (!prefersReducedMotion.matches) {
      const queueRemainingFrames = () => {
        for (let index = 0; index < frameCount; index += 1) {
          window.setTimeout(() => loadFrame(index), index * 45);
        }
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(queueRemainingFrames, { timeout: 1800 });
      } else {
        window.addEventListener("load", queueRemainingFrames, { once: true });
      }
    }
  }

  setupLogoScroll();

  function setMenu(open) {
    if (!siteHeader || !navToggle) {
      return;
    }

    siteHeader.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });
      window.history.pushState(null, "", targetId);
    });
  });

  function openSpecimen(card, trigger) {
    lastFocusedElement = trigger;

    const imagePath = card.dataset.image;
    const imageAlt = card.dataset.alt || "";
    const specimenNumber = card.dataset.specimen || "";

    modalSpecimen.textContent = `Specimen ${specimenNumber}`;
    modalTitle.textContent = card.dataset.name || "SPECIMEN";
    modalSeries.textContent = card.dataset.series || "SERIES 1";
    modalThreat.textContent = card.dataset.threat || "THREAT LOGGED";
    modalStatus.textContent = card.dataset.status || "DATA CONTAINED";
    modalImage.hidden = false;
    modalImage.src = imagePath;
    modalImage.alt = imageAlt;

    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalPanel.focus();
  }

  function closeSpecimen() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  specimenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".toy-card");

      if (card) {
        openSpecimen(card, button);
      }
    });
  });

  modalCloseControls.forEach((control) => {
    control.addEventListener("click", closeSpecimen);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);

      if (!modal.hidden) {
        closeSpecimen();
      }
    }
  });

  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      if (prefersReducedMotion.matches) {
        return;
      }

      button.classList.add("is-glitching");
      window.setTimeout(() => {
        button.classList.remove("is-glitching");
      }, 150);
    });
  });
})();
