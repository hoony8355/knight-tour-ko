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
    "vi": { label: "Tiếng Việt", url: "https://hoony8355.github.io/knight-tour-ko/vi/" },
  };

  const currentLang = document.documentElement.lang;
  const container = document.createElement("div");
  container.id = "langMenuContainer";
  container.innerHTML = `
    <div style="position: fixed; top: 10px; right: 60px; z-index: 9999;">
      <button id="langToggleBtn" style="font-size: 1.2em; background: none; border: none; cursor: pointer;">🌐</button>
      <ul id="langList" style="display: none; position: absolute; right: 0; background: white; list-style: none; padding: 0; margin: 0; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-size: 0.9em;">
        ${Object.entries(hreflangs).map(([code, { label, url }]) => `
          <li><a href="${url}" lang="${code}" style="${code === currentLang ? 'font-weight:bold;background:#eee' : ''}">${label}</a></li>
        `).join("")}
      </ul>
    </div>
  `;

  document.body.appendChild(container);

  document.getElementById('langToggleBtn').addEventListener('click', () => {
    const list = document.getElementById('langList');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      const list = document.getElementById('langList');
      if (list) list.style.display = 'none';
    }
  });
})();