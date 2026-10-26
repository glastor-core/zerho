// Zerho Client Controller
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebarMobile();
  initTocScrollSpy();
  initSearchModal();
  initCodeGroups();
});

// Polyglot Synchronized Code Groups
function initCodeGroups() {
  const PREF_KEY = "zerho-code-pref";
  const savedPref = localStorage.getItem(PREF_KEY);

  function activateTab(tabElement, sync = true) {
    const group = tabElement.closest(".code-group");
    if (!group) return;

    const targetTab = tabElement.getAttribute("data-tab");
    if (!targetTab) return;

    // Update active tab in this group
    const tabs = group.querySelectorAll(".code-group-tab");
    tabs.forEach((tab) => {
      const isMatch = tab === tabElement;
      tab.classList.toggle("active", isMatch);
      tab.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    // Update active panel in this group
    const panels = group.querySelectorAll(".code-group-panel");
    panels.forEach((panel) => {
      const isMatch = panel.getAttribute("data-tab-panel") === targetTab;
      panel.classList.toggle("active", isMatch);
      panel.style.display = isMatch ? "block" : "none";
    });

    if (sync) {
      localStorage.setItem(PREF_KEY, targetTab);
      // Synchronize all other code groups on the page that have a matching tab label
      document.querySelectorAll(".code-group").forEach((otherGroup) => {
        if (otherGroup === group) return;
        const matchingTab = Array.from(otherGroup.querySelectorAll(".code-group-tab")).find(
          (t) =>
            t.getAttribute("data-tab")?.trim().toLowerCase() === targetTab.trim().toLowerCase(),
        );
        if (matchingTab && !matchingTab.classList.contains("active")) {
          activateTab(matchingTab, false);
        }
      });
    }
  }

  // Restore preferred tab globally if remembered
  if (savedPref) {
    document.querySelectorAll(".code-group").forEach((group) => {
      const matchingTab = Array.from(group.querySelectorAll(".code-group-tab")).find(
        (t) => t.getAttribute("data-tab")?.trim().toLowerCase() === savedPref.trim().toLowerCase(),
      );
      if (matchingTab) {
        activateTab(matchingTab, false);
      }
    });
  }

  // Event delegation for tab clicks & copy button
  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".code-group-tab");
    if (tab) {
      e.preventDefault();
      activateTab(tab, true);
      return;
    }

    const copyBtn = e.target.closest(".code-group-copy-btn");
    if (copyBtn) {
      e.preventDefault();
      const group = copyBtn.closest(".code-group");
      if (!group) return;
      const activePanel = group.querySelector(".code-group-panel.active") ||
        group.querySelector(".code-group-panel");
      if (!activePanel) return;
      const rawTextarea = activePanel.querySelector(".raw-code");
      const codeText = rawTextarea
        ? rawTextarea.value
        : (activePanel.querySelector("code")?.innerText || "");

      const icon = copyBtn.querySelector(".copy-icon");
      const feedback = copyBtn.querySelector(".copy-feedback");

      if (codeText) {
        navigator.clipboard.writeText(codeText).then(() => {
          if (icon && feedback) {
            icon.style.display = "none";
            feedback.style.display = "inline";
            setTimeout(() => {
              icon.style.display = "inline";
              feedback.style.display = "none";
            }, 2000);
          }
        });
      }
    }
  });
}

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
      if (
        !sidebar.contains(e.target) && !menuBtn.contains(e.target) &&
        sidebar.classList.contains("mobile-open")
      ) {
        sidebar.classList.remove("mobile-open");
      }
    });
  }
}

// Copy Code Block functionality
window.copyCodeBlock = function (id) {
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

// Feedback Widget (Edge Deno KV)
window.submitFeedback = async function (helpful) {
  const yesBtn = document.getElementById("fbYes");
  const noBtn = document.getElementById("fbNo");
  const msgEl = document.getElementById("feedbackMsg");

  if (yesBtn) yesBtn.disabled = true;
  if (noBtn) noBtn.disabled = true;

  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        helpful,
      }),
    });
  } catch (e) {
    console.warn("Feedback offline fallback:", e);
  }

  if (msgEl) {
    msgEl.style.display = "inline-flex";
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

// Search Tab Switcher (Quick Search vs Ask AI)
window.__currentSearchTab = "quick";
window.switchSearchTab = function (tab) {
  window.__currentSearchTab = tab;
  const tabQuick = document.getElementById("searchTabQuick");
  const tabAi = document.getElementById("searchTabAi");
  const resultsContainer = document.getElementById("searchResultsList");
  const aiChatView = document.getElementById("aiChatView");
  const input = document.getElementById("searchInput");

  if (!tabQuick || !tabAi) return;

  if (tab === "quick") {
    tabQuick.classList.add("active");
    tabAi.classList.remove("active");
    if (resultsContainer) resultsContainer.style.display = "block";
    if (aiChatView) aiChatView.style.display = "none";
    if (input) {
      input.placeholder = "Buscar temas, funciones o APIs...";
      input.focus();
    }
  } else {
    tabAi.classList.add("active");
    tabQuick.classList.remove("active");
    if (resultsContainer) resultsContainer.style.display = "none";
    if (aiChatView) aiChatView.style.display = "block";
    if (input) {
      input.placeholder = "Pregunta a la IA sobre Zerho o Deno...";
      input.focus();
    }
  }
};

window.openSearchModal = function () {
  const backdrop = document.getElementById("searchModalBackdrop");
  const input = document.getElementById("searchInput");
  if (!backdrop) return;
  backdrop.style.display = "flex";
  if (input) {
    input.value = "";
    input.focus();
  }
  if (typeof window.loadSearchIndex === "function") {
    window.loadSearchIndex();
  }
};

window.closeSearchModal = function () {
  const backdrop = document.getElementById("searchModalBackdrop");
  if (backdrop) backdrop.style.display = "none";
};

// Cmd+K Search Modal with Ask AI
function initSearchModal() {
  const triggerBtn = document.getElementById("searchTriggerBtn");
  const backdrop = document.getElementById("searchModalBackdrop");
  const closeBtn = document.getElementById("searchCloseBtn");
  const input = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("searchResultsList");
  const aiStatusPill = document.getElementById("aiStatusPill");
  const aiContentBody = document.getElementById("aiContentBody");
  const aiSourcesWrap = document.getElementById("aiSourcesWrap");
  const aiSourcesList = document.getElementById("aiSourcesList");

  if (!backdrop || !input) return;

  let searchIndex = [];
  let isIndexLoaded = false;
  let selectedIndex = -1;

  window.loadSearchIndex = async function () {
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
  };

  function openModal() {
    window.openSearchModal();
    renderResults([]);
  }

  function closeModal() {
    window.closeSearchModal();
  }

  if (triggerBtn) triggerBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

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

  // Input listener for Quick Search
  input.addEventListener("input", () => {
    if (window.__currentSearchTab !== "quick") return;

    const query = input.value.trim().toLowerCase();
    if (!query) {
      resultsContainer.innerHTML =
        `<div class="search-empty">Comienza a escribir para buscar en toda la documentación...</div>`;
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

  // Enter handler for Ask AI or selecting search item
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (window.__currentSearchTab === "quick") {
        const items = resultsContainer.querySelectorAll(".search-item");
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          items[selectedIndex].click();
        }
        return;
      }

      // Ask AI query
      const query = input.value.trim();
      if (!query) return;

      aiStatusPill.textContent = "Sintetizando...";
      aiStatusPill.className = "ai-status-pill running";
      aiContentBody.innerHTML =
        `<div class="ai-loading-pulse">Consultando índice semántico y generando respuesta...</div>`;
      if (aiSourcesWrap) aiSourcesWrap.style.display = "none";

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();

        aiStatusPill.textContent = "Completado";
        aiStatusPill.className = "ai-status-pill ready";
        aiContentBody.innerHTML = formatAiMarkdown(data.answer);

        if (data.sources && data.sources.length > 0) {
          aiSourcesList.innerHTML = data.sources
            .map((s) => `<a href="${s.url}" class="ai-source-card">${escapeHtml(s.title)}</a>`)
            .join("");
          aiSourcesWrap.style.display = "block";
        }
      } catch (_err) {
        aiStatusPill.textContent = "Respuesta Local";
        aiStatusPill.className = "ai-status-pill ready";
        aiContentBody.innerHTML = `Para <strong>"${
          escapeHtml(query)
        }"</strong>, te recomiendo consultar la <a href="/guide/getting-started">Guía de Inicio</a> y explorar el <a href="/playground/">Playground Interactivo</a>.`;
      }
    } else if (window.__currentSearchTab === "quick") {
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
      resultsContainer.innerHTML =
        `<div class="search-empty">No se encontraron resultados para "<strong>${
          escapeHtml(query)
        }</strong>"</div>`;
      return;
    }

    resultsContainer.innerHTML = matches
      .map((item) => {
        const snippet = highlightMatches(item.content.slice(0, 110), query);
        return `
        <a href="${item.url}" class="search-item">
          <div class="search-item-title">${escapeHtml(item.title)} ${
          item.section
            ? `<span style="font-size:0.75rem; color:var(--text-muted)"> &rsaquo; ${
              escapeHtml(item.section)
            }</span>`
            : ""
        }</div>
          <div class="search-item-snippet">${snippet}...</div>
        </a>`;
      })
      .join("");
  }

  function highlightMatches(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return escaped.replace(
      regex,
      '<span style="color:var(--brand-primary);font-weight:700;">$1</span>',
    );
  }

  function formatAiMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "<p></p>")
      .replace(/\n/g, "<br>");
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
