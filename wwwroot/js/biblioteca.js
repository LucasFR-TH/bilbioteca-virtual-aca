/**
 * public/js/main.js
 * Biblioteca Digital — Interacciones del cliente
 */

// ── Sidebar toggle (mobile) ─────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const overlay       = document.createElement('div');

overlay.className = 'sidebar-overlay';
overlay.style.cssText = `
  display:none; position:fixed; inset:0; background:rgba(0,0,0,.5);
  z-index:99; backdrop-filter:blur(2px);
`;

document.body.appendChild(overlay);

function openSidebar()  { sidebar?.classList.add('open'); overlay.style.display = 'block'; }
function closeSidebar() { sidebar?.classList.remove('open'); overlay.style.display = 'none'; }

sidebarToggle?.addEventListener('click', () =>
  sidebar?.classList.contains('open') ? closeSidebar() : openSidebar()
);

overlay.addEventListener('click', closeSidebar);

// ── Árbol de carpetas (toggle con animación) ────────────────
document.querySelectorAll('.tree-node.root-node').forEach(node => {
  node.addEventListener('click', e => {
    if (e.target.closest('a') && !e.target.classList.contains('toggle-arrow')) return;
    e.preventDefault();
    const root = node.closest('.tree-root');
    root?.classList.toggle('open');
  });

  // Abrir nodo si hay hijo activo
  const root = node.closest('.tree-root');
  if (root?.querySelector('.tree-node.active')) root.classList.add('open');
});

// ── Confirm antes de eliminar ──────────────────────────────
document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => {
    const msg = el.dataset.confirm || '¿Estás seguro?';
    if (!confirm(msg)) e.preventDefault();
  });
});

// ── Preview iframe — spinner ────────────────────────────────
const iframe  = document.querySelector('.preview-iframe');
const loading = document.querySelector('.preview-loading');

if (iframe && loading) {
  iframe.addEventListener('load', () => {
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 300);
  });
}

// ── Toast (notificación rápida) ─────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all .3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Mostrar flash de URL si viene ?success=1
if (new URLSearchParams(location.search).get('success')) {
  showToast('✓ Operación realizada correctamente', 'success');
}

// ── Animación stagger en grillas ────────────────────────────
document.querySelectorAll('.doc-grid .doc-card, .category-grid .category-card').forEach((el, i) => {
  el.style.animationDelay = `${i * 0.05}s`;
});

// ── Auto-completar driveUrl desde driveId ───────────────────
const driveIdInput  = document.querySelector('input[name="driveId"]');
const driveUrlInput = document.querySelector('input[name="driveUrl"]');

driveIdInput?.addEventListener('input', () => {
  const id = driveIdInput.value.trim();
  if (driveUrlInput && id) {
    driveUrlInput.value = `https://drive.google.com/file/d/${id}/view`;
  }
});

// ── Búsqueda — limpiar con Escape ──────────────────────────
document.querySelectorAll('.search-input, .home-search-input').forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; input.blur(); }
  });
});

// ── Clipboard — copiar link de Drive ───────────────────────
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      showToast('🔗 Link copiado al portapapeles', 'info', 2000);
    });
  });
});

// ── Keyboard shortcut: '/' abre búsqueda global ────────────
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' &&
      document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    const searchInput = document.querySelector('.search-input, .home-search-input');
    searchInput?.focus();
  }
});
