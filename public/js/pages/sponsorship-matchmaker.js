(() => {
  const container = document.getElementById("sponsorship-matchmaker");
  const matchmaker = window.CreatorOSSponsorshipMatchmaker;

  if (!container || !matchmaker || typeof matchmaker.render !== "function") {
    if (container) {
      container.innerHTML = '<div role="alert">Sponsorship recommendations are unavailable.</div>';
      container.removeAttribute("aria-busy");
    }
    return;
  }

  matchmaker.render(container);
  container.removeAttribute("aria-busy");
})();
