// ZerhoPress Client Controller
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebarMobile();
  initTocScrollSpy();
  initSearchModal();
});

// Theme Management
function initTheme() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const storedTheme = localStorage.getItem("zerho-theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  setTheme(storedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("zerho-theme", theme);
}

// Mobile Sidebar Drawer
function initSidebarMobile() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("siteSidebar");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });

    // Close when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains("mobile-open")) {
        sidebar.classList.remove("mobile-open");
      }
    });
  }
}

// Copy Code Block functionality
window.copyCodeBlock = function(id) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const textarea = wrap.querySelector(".raw-code");
  const feedback = wrap.querySelector(".copy-feedback");
  const icon = wrap.querySelector(".copy-icon");

  if (textarea) {
    navigator.clipboard.writeText(textarea.value).then(() => {
      if (feedback && icon) {
        icon.style.display = "none";
        feedback.style.display = "inline";
        setTimeout(() => {
          icon.style.display = "inline";
          feedback.style.display = "none";
        }, 2000);
      }
    });
  }
};

// Table of Contents ScrollSpy
function initTocScrollSpy() {
  const headings = Array.from(document.querySelectorAll(".markdown-body h2, .markdown-body h3"));
  const tocLinks = Array.from(document.querySelectorAll(".toc-link"));
  if (headings.length === 0 || tocLinks.length === 0) return;

  function onScroll() {
    const scrollPos = window.scrollY + 100;
    let currentId = "";

    for (const h of headings) {
      if (h.offsetTop <= scrollPos) {
        currentId = h.id;
      } else {
        break;
      }
    }

    tocLinks.forEach((link) => {
      if (link.getAttribute("data-id") === currentId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Cmd+K Search Modal
function initSearchModal() {
  const triggerBtn = document.getElementById("searchTriggerBtn");
  const backdrop = document.getElementById("searchModalBackdrop");
  const closeBtn = document.getElementById("searchCloseBtn");
  const input = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("searchResultsList");

  if (!backdrop || !input) return;

  let searchIndex = [];
  let isIndexLoaded = false;
  let selectedIndex = -1;

  async function loadIndex() {
    if (isIndexLoaded) return;
    try {
      const res = await fetch("/search-index.json");
      if (res.ok) {
        searchIndex = await res.json();
        isIndexLoaded = true;
      }
    } catch (e) {
      console.warn("Could not load search index", e);
    }
  }

  function openModal() {
    backdrop.style.display = "flex";
    input.value = "";
    input.focus();
    renderResults([]);
    loadIndex();
  }

  function closeModal() {
    backdrop.style.display = "none";
  }

  if (triggerBtn) {
    triggerBtn.addEventListener("click", openModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Keyboard shortcut: Cmd+K / Ctrl+K
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (backdrop.style.display === "flex") {
        closeModal();
      } else {
        openModal();
      }
    } else if (e.key === "Escape" && backdrop.style.display === "flex") {
      closeModal();
    }
  });

  // Search input handler
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      resultsContainer.innerHTML = `<div class="search-empty">Comienza a escribir para buscar en toda la documentación...</div>`;
      return;
    }

    const matches = searchIndex.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        (item.section && item.section.toLowerCase().includes(query)) ||
        item.content.toLowerCase().includes(query)
      );
    }).slice(0, 8);

    renderResults(matches, query);
  });

  // Keyboard navigation inside modal
  input.addEventListener("keydown", (e) => {
    const items = resultsContainer.querySelectorAll(".search-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateSelected(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateSelected(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].click();
      }
    }
  });

  function updateSelected(items) {
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.classList.add("selected");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("selected");
      }
    });
  }

  function renderResults(matches, query = "") {
    selectedIndex = -1;
    if (matches.length === 0 && query) {
      resultsContainer.innerHTML = `<div class="search-empty">No se encontraron resultados para "<strong>${escapeHtml(query)}</strong>"</div>`;
      return;
    }

    resultsContainer.innerHTML = matches
      .map((item) => {
        const snippet = highlightMatches(item.content.slice(0, 110), query);
        return `
        <a href="${item.url}" class="search-item">
          <div class="search-item-title">${escapeHtml(item.title)} ${item.section ? `<span style="font-size:0.75rem; color:var(--text-muted)"> &rsaquo; ${escapeHtml(item.section)}</span>` : ""}</div>
          <div class="search-item-snippet">${snippet}...</div>
        </a>`;
      })
      .join("");
  }

  function highlightMatches(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return escaped.replace(regex, '<span style="color:var(--brand-primary);font-weight:700;">$1</span>');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
