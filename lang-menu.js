(function () {
  const hreflangs = {
    "ko": { label: "한국어", url: "https://hoony8355.github.io/knight-tour-ko/" },
    "en": { label: "English", url: "https://hoony8355.github.io/knight-tour-ko/en/" },
    "ja": { label: "日本語", url: "https://hoony8355.github.io/knight-tour-ko/ja/" },
    "es": { label: "Español", url: "https://hoony8355.github.io/knight-tour-ko/es/" },
    "zh-CN": { label: "简体中文", url: "https://hoony8355.github.io/knight-tour-ko/zh-cn/" },
    "fr": { label: "Français", url: "https://hoony8355.github.io/knight-tour-ko/fr/" },
    "de": { label: "Deutsch", url: "https://hoony8355.github.io/knight-tour-ko/de/" },
    "id": { label: "Bahasa Indonesia", url: "https://hoony8355.github.io/knight-tour-ko/id/" },
    "vi": { label: "Tiếng Việt", url: "https://hoony8355.github.io/knight-tour-ko/vi/" }
  };

  const currentLang = document.documentElement.lang;

  const container = document.createElement("div");
  container.id = "langMenuContainer";
  container.innerHTML = `
    <button id="langToggleBtn" style="font-size: 1.2em; background: none; border: none; cursor: pointer;">🌐</button>
    <ul id="langList" style="display: none; position: absolute; right: 0; background: white; list-style: none; padding: 0; margin: 0; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-size: 0.9em;">
      ${Object.entries(hreflangs).map(([code, { label, url }]) => `
        <li><a href="${url}" lang="${code}" style="${code === currentLang ? 'font-weight:bold;background:#eee' : ''}">${label}</a></li>
      `).join("")}
    </ul>
  `;

  const target = document.getElementById('darkToggle');
  if (target && target.parentNode) {
    target.parentNode.insertBefore(container, target.nextSibling);
  } else {
    document.body.appendChild(container);
  }

  document.getElementById('langToggleBtn').addEventListener('click', () => {
    const list = document.getElementById('langList');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      document.getElementById('langList').style.display = 'none';
    }
  });

  // ✅ 영어/한국어 외 언어에서만 퍼즐 버튼 추가
  if (!["ko", "en"].includes(currentLang)) {
    const nav = document.createElement("div");
    nav.className = "custom-nav-buttons";
    nav.style = "text-align: center; margin-top: 1.5rem;";

    nav.innerHTML = `
      <a href="/knight-tour-ko/en/board/"
         style="margin: 0.4rem 0.3rem; display: inline-block; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold; background-color: var(--button-bg, #e0e0e0); color: var(--button-color, #222); transition: all 0.2s ease;"
         onmouseover="this.style.backgroundColor='var(--button-hover-bg, #d0d0d0)'"
         onmouseout="this.style.backgroundColor='var(--button-bg, #e0e0e0)'">
        🧩 Puzzle Board
      </a>
      <a href="/knight-tour-ko/en/builder/"
         style="margin: 0.4rem 0.3rem; display: inline-block; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold; background-color: var(--button-alt-bg, #d0eaff); color: var(--button-alt-color, #003366); transition: all 0.2s ease;"
         onmouseover="this.style.backgroundColor='var(--button-alt-hover-bg, #b5dcff)'"
         onmouseout="this.style.backgroundColor='var(--button-alt-bg, #d0eaff)'">
        ✏️ Create Puzzle
      </a>
    `;

    const h1 = document.querySelector("h1");
    if (h1 && h1.parentNode) {
      h1.parentNode.insertBefore(nav, h1.nextSibling);
    } else {
      document.body.appendChild(nav);
    }
  }
})();
