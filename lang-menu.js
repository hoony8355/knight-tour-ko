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

  // 버튼 박스 생성
  const container = document.createElement("div");
  container.id = "topRightButtons";
  container.innerHTML = `
    <button id="darkToggle" class="top-button">🌙</button>
    <div class="lang-wrapper">
      <button id="langToggleBtn" class="top-button">🌐</button>
      <ul id="langList" class="lang-list">
        ${Object.entries(hreflangs).map(([code, { label, url }]) => `
          <li><a href="${url}" lang="${code}" ${code === currentLang ? 'class="active-lang"' : ''}>${label}</a></li>
        `).join("")}
      </ul>
    </div>
  `;
  document.body.appendChild(container);

  // 드롭다운 토글
  document.getElementById('langToggleBtn').addEventListener('click', () => {
    const list = document.getElementById('langList');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.lang-wrapper');
    if (!wrapper.contains(e.target)) {
      document.getElementById('langList').style.display = 'none';
    }
  });

  // 다크모드 기능도 함께 처리
  document.getElementById('darkToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
})();