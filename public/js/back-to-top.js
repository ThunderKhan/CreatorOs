(() => {
  "use strict";

  const BUTTON_ID = "creatoros-back-to-top";
  const SHOW_AFTER_PX = 320;

  if (document.getElementById(BUTTON_ID)) return;

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.setAttribute("title", "Back to top");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 19V5"></path>
      <path d="m6 11 6-6 6 6"></path>
    </svg>
  `;

  document.body.appendChild(button);

  const updateVisibility = () => {
    button.classList.toggle("is-visible", window.scrollY > SHOW_AFTER_PX);
  };

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });

  window.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();
})();
