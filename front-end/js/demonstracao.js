/* ARMOIRE — recursos demonstrativos não enviam formulários nem navegam para #. */
(() => {
  "use strict";
  if (window.armoireDemonstracao) return;
  window.armoireDemonstracao = true;
  document.addEventListener("click", evento => {
    if (!evento.target.closest("[data-link-demonstrativo]")) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
  }, true);
  document.addEventListener("submit", evento => {
    if (evento.target.matches(".newsletter-form")) evento.preventDefault();
  }, true);
})();
