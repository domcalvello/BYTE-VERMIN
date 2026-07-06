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
  let lastFocusedElement = null;

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
