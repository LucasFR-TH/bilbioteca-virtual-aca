/**
 * public/js/main.js — Interacciones del cliente
 */

// ── Sidebar toggle en mobile ──────────────────
const sidebar = document.getElementById("sidebar");
document.addEventListener("click", (e) => {
  if (sidebar && sidebar.classList.contains("open")) {
    if (!sidebar.contains(e.target) && !e.target.closest(".sidebar-toggle")) {
      sidebar.classList.remove("open");
    }
  }
});

// ── Toggle subcarpetas en el árbol ────────────
document.querySelectorAll(".root-node").forEach(node => {
  node.addEventListener("click", (e) => {
    const parent   = node.closest(".tree-root");
    const children = parent?.querySelector(".tree-children");
    const arrow    = node.querySelector(".toggle-arrow");
    if (children) {
      const isOpen = children.style.display !== "none";
      children.style.display  = isOpen ? "none" : "block";
      if (arrow) arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
    }
  });
});

// Inicializar flechas
document.querySelectorAll(".toggle-arrow").forEach(a => {
  a.style.transform = "rotate(90deg)";
  a.style.transition = "transform 0.2s";
  a.style.display = "inline-block";
});

// ── Búsqueda en tiempo real (filter-input) ────
const filterInput = document.querySelector(".filter-input");
if (filterInput) {
  filterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.target.closest("form")?.submit();
  });
}

// ── Confirmar acciones destructivas ──────────
document.querySelectorAll("[data-confirm]").forEach(el => {
  el.addEventListener("click", (e) => {
    if (!confirm(el.dataset.confirm)) e.preventDefault();
  });
});

// ── Animación de entrada de cards ─────────────
const cards = document.querySelectorAll(".doc-card, .category-card, .cat-page-card, .folder-root-card");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }, i * 40);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = "0";
    card.style.transform = "translateY(10px)";
    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    observer.observe(card);
  });
}
