import { invoke } from "@tauri-apps/api/core";
import "./styles.css";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { check } from "@tauri-apps/plugin-updater";

const app = document.querySelector<HTMLDivElement>("#app");


if (app) {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">Z</div>
          <div>
            <div class="brand-name">ZAPRET</div>
            <div class="brand-caption">CONTROL CENTER</div>
          </div>
        </div>

        <div class="menu-label">МЕНЮ</div>

        <nav class="navigation">
  <button class="nav-item active" data-page="home">
    <span class="nav-icon">⌂</span>
    Главная
  </button>

  <button class="nav-item" data-page="strategies">
    <span class="nav-icon">◈</span>
    Стратегии
  </button>

  <button class="nav-item" data-page="settings">
    <span class="nav-icon">⚙</span>
    Настройки
  </button>

  <button class="nav-item" data-page="logs">
  <span class="nav-icon">◷</span>
  <span>Журнал</span>
</button>

  <button class="nav-item" data-page="updates">
    <span class="nav-icon">↻</span>
    Обновления
  </button>
</nav>

        <div class="sidebar-bottom">
          <div class="version">ZAPRET CONTROL <span>v1.0.0</span></div>
          <div class="version-note">Неофициальный интерфейс</div>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div>
            <div class="breadcrumb">УПРАВЛЕНИЕ / <span>ГЛАВНАЯ</span></div>
            <h1>Панель управления</h1>
          </div>
          <div class="system-badge">
            <span class="status-dot"></span>
            Windows
          </div>
        </header>

        <section class="welcome">
          <div>
            <div class="welcome-label">ZAPRET CONTROL CENTER</div>
            <h2>Всё под контролем.</h2>
            <p>Управляй подключениями и состоянием Zapret в одном месте.</p>
          </div>
          <div class="welcome-symbol">Z</div>
        </section>

        <section class="section">
          <div class="section-heading">
            <div>
              <h2>Управление сервисами</h2>
              <p>Независимое управление отдельными сервисами</p>
            </div>
            <span class="section-count">02 СЕРВИСА</span>
          </div>

          <div class="service-grid">
            <article class="service-card">
              <div class="service-top">
                <div class="service-icon discord-icon">D</div>
                <span class="service-status inactive" id="discord-status">
                  ВЫКЛЮЧЕНО
                </span>
              </div>
              <h3>Discord</h3>
              <p>Управление обработкой соединений Discord.</p>
              <div class="card-bottom">
                <span>Состояние</span>
                <button class="switch" id="discord-switch" aria-label="Discord" aria-pressed="false">
                  <span></span>
                </button>
              </div>
            </article>

            <article class="service-card">
              <div class="service-top">
                <div class="service-icon youtube-icon">▶</div>
                <span class="service-status inactive" id="youtube-status">
                  ВЫКЛЮЧЕНО
                </span>
              </div>
              <h3>YouTube</h3>
              <p>Управление обработкой соединений YouTube.</p>
              <div class="card-bottom">
                <span>Состояние</span>
                <button class="switch" id="youtube-switch" aria-label="YouTube" aria-pressed="false">
                  <span></span>
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-heading">
            <div>
              <h2>Общее управление</h2>
              <p>Полное включение или выключение Zapret</p>
            </div>
          </div>

          <div class="global-card">
            <div class="global-info">
              <div class="global-icon">◉</div>
              <div>
                <h3>Zapret</h3>
                <p>Общее состояние службы</p>
              </div>
            </div>
            <div class="global-control">
              <span id="global-status">ВЫКЛЮЧЕНО</span>
              <button class="switch" id="global-switch" aria-label="Общий Zapret" aria-pressed="false">
                <span></span>
              </button>
            </div>
          </div>
        </section>

<section class="section updates-page" id="updates-page" hidden>
  <div class="section-heading">
    <div>
      <h2>Центр обновлений</h2>
      <p>Управление версиями Zapret Control и Flowseal</p>
    </div>
  </div>

  <!-- ZAPRET CONTROL -->
  <div class="settings-card app-update-card">
    <div class="settings-card-heading">
      <div class="global-icon">Z</div>
      <div>
        <h3>Zapret Control</h3>
        <p>Обновление приложения управления</p>
      </div>
    </div>

    <div class="settings-check-row">
      <span>Установленная версия</span>
      <span id="app-current-version">Загрузка...</span>
    </div>

    <div class="update-release-info">
      <h3 id="app-update-title">Проверка обновлений</h3>
      <p id="app-update-description">
        Проверь наличие новой версии приложения.
      </p>

      <span id="app-update-badge" class="update-badge" hidden>
        ДОСТУПНО ОБНОВЛЕНИЕ
      </span>
    </div>

    <div class="app-update-progress" id="app-update-progress" hidden>
      <div class="app-update-progress-info">
        <span id="app-update-progress-status">Подготовка...</span>
        <span id="app-update-progress-percent">0%</span>
      </div>

      <div class="app-update-progress-track">
        <div
          class="app-update-progress-fill"
          id="app-update-progress-fill"
        ></div>
      </div>

      <p id="app-update-progress-details"></p>
    </div>

    <div class="update-actions">
      <button class="update-button" id="app-update-check">
        Проверить обновления
      </button>

      <button class="update-button" id="app-update-install" hidden>
        Скачать и установить
      </button>
    </div>

    <div class="update-notes" id="app-update-notes" hidden></div>
  </div>

  <!-- FLOWSEAL -->
  <div class="settings-card">
    <div class="settings-card-heading">
      <div class="global-icon">↻</div>
      <div>
        <h3>Zapret Discord-Youtube (Flowseal)</h3>
        <p>Проверка официальных релизов Flowseal</p>
      </div>
    </div>

    <div class="update-release-info">
      <h3 id="update-version">Проверка обновлений</h3>
      <p id="update-description">
        Загрузка установленной версии...
      </p>

      <span id="update-badge" class="update-badge" hidden>
        ДОСТУПНО ОБНОВЛЕНИЕ
      </span>

      <p id="latest-version"></p>
    </div>

    <div class="update-actions">
      <button class="update-button" id="check-updates">
        Проверить обновления
      </button>
    </div>

    <button class="notes-toggle" id="toggle-notes" hidden>
      Что нового в версии
    </button>

    <div class="update-notes" id="update-notes" hidden></div>

    <div class="update-info">
      <p>
        Официальный пакет Flowseal можно будет скачать непосредственно
        в приложении. Установка и изменение конфигурации остаются
        под твоим контролем.
      </p>
    </div>
  </div>
</section>
<section class="section">
  <div class="section-heading">
    <div>
      <h2>Резервное копирование</h2>
      <p>Сохранение пользовательских списков Flowseal (папка lists)</p>
    </div>
  </div>

  <div class="global-card backup-card">
  <div class="backup-header">
    <div class="global-info">
      <div class="global-icon">▣</div>
      <div>
        <h3>Резервная копия</h3>
        <p id="backup-status">Загрузка резервных копий...</p>
      </div>
    </div>

    <button class="update-button" id="create-backup">
      Создать копию
    </button>
  </div>

  <div class="backup-restore">
    <h3>Восстановление</h3>
    <p>Выбери копию, из которой нужно восстановить списки.</p>

    <select id="backup-select" disabled>
      <option value="">Загрузка списка...</option>
    </select>

    <div class="backup-actions">
      <button class="update-button" id="restore-backup" disabled>
        Восстановить
      </button>

      <button class="update-button" id="delete-backup" disabled>
        Удалить копию
      </button>
    </div>
  </div>
</div>
</section>
        <section class="section">
          <div class="section-heading">
            <div>
              <h2>Состояние системы</h2>
              <p>Информация о текущем состоянии приложения</p>
            </div>
          </div>

          <div class="system-card">
  <div class="system-row">
    <span class="system-indicator"></span>
    <span>Приложение запущено</span>
    <span class="system-value">АКТИВНО</span>
  </div>
  <div class="system-row">
    <span class="system-indicator muted" id="zapret-indicator"></span>
    <span>Службы Zapret и WinDivert</span>
    <span class="system-value muted-text" id="zapret-system-status">ПРОВЕРКА...</span>
  </div>
</div>
        </section>
<section class="section strategies-page" id="strategies-page" hidden>
  <div class="section-heading">
    <div>
      <h2>Стратегии Flowseal</h2>
      <p>Информация об установленной и доступных стратегиях</p>
    </div>
    <button class="update-button" id="refresh-strategies">
      Обновить список
    </button>
  </div>

  <div class="global-card strategy-current-card">
    <div class="global-info">
      <div class="global-icon">◈</div>
      <div>
        <h3>Текущая стратегия</h3>
        <p id="current-strategy">Загрузка...</p>
        <span id="strategy-file-status"></span>
      </div>
    </div>
  </div>

  <div class="section-heading strategy-list-heading">
    <div>
      <h2>Доступные файлы</h2>
      <p id="strategies-count">Поиск стратегий...</p>
    </div>
  </div>

  <div class="strategy-list" id="strategy-list"></div>
</section>
<section class="section settings-page" id="settings-page" hidden>
  <div class="section-heading">
    <div>
      <h2>Настройки приложения</h2>
      <p>Информация о расположении файлов и состоянии компонентов</p>
    </div>

    <button class="update-button" id="refresh-settings">
      Проверить
    </button>
  </div>

  <div class="settings-card theme-settings">
  <div class="settings-card-heading">
    <div class="global-icon">◐</div>
    <div>
      <h3>Оформление</h3>
      <p>Выбери внешний вид приложения</p>
    </div>
  </div>

  <div class="theme-control">
    <label for="theme-select">Тема приложения</label>

    <select id="theme-select">
      <option value="dark">Тёмная</option>
      <option value="light">Светлая</option>
      <option value="system">Системная</option>
    </select>
  </div>

  <p class="theme-description" id="theme-description">
    Используется тёмное оформление.
  </p>
</div>

  <div class="settings-card">
    <div class="settings-card-heading">
      <div class="global-icon">▣</div>
      <div>
        <h3>Установка Flowseal</h3>
        <p>Расположение основной папки</p>
      </div>
    </div>

    <div class="settings-path" id="flowseal-path">Загрузка...</div>
    <button class="update-button folder-button" id="open-flowseal-folder">
  <span>↗</span> Открыть папку Flowseal
</button>

    <div class="settings-divider"></div>

    <h3 class="settings-subtitle">Состояние папок</h3>

    <div class="settings-check-row">
  <span>Папка Flowseal</span>
  <span id="check-flowseal">Проверка...</span>
</div>

    <div class="settings-check-row">
      <span>Папка bin</span>
      <span id="check-bin">Проверка...</span>
    </div>

    <div class="settings-check-row">
      <span>Папка lists</span>
      <span id="check-lists">Проверка...</span>
    </div>

    <div class="settings-check-row">
      <span>Папка utils</span>
      <span id="check-utils">Проверка...</span>
    </div>
  </div>

  <div class="settings-card">
    <div class="settings-card-heading">
      <div class="global-icon">▤</div>
      <div>
        <h3>Резервные копии</h3>
        <p>Расположение сохранённых копий списков</p>
      </div>
    </div>

    <div class="settings-path" id="settings-backups-path">
      Загрузка...
    </div>
    <button class="update-button folder-button" id="open-backups-folder">
  <span>↗</span> Открыть папку резервных копий
</button>

    <div class="settings-check-row">
      <span>Папка резервных копий</span>
      <span id="check-backups">Проверка...</span>
    </div>
  </div>

  <div class="settings-card">
    <div class="settings-card-heading">
      <div class="global-icon">ⓘ</div>
      <div>
        <h3>Версии</h3>
        <p>Информация о программном обеспечении</p>
      </div>
    </div>

    <div class="settings-check-row">
      <span>Zapret Control</span>
      <span>v1.0.0</span>
    </div>

    <div class="settings-check-row">
      <span>Flowseal</span>
      <span id="settings-flowseal-version">Загрузка...</span>
    </div>
  </div>
</section>
<section class="logs-page" id="logs-page" hidden>
  <div class="page-heading">
  <div>
    <h2>Журнал событий</h2>
    <p>История действий и ошибок приложения</p>
  </div>

  <div class="logs-actions">
    <button class="update-button" id="export-logs">
      Экспорт .txt
    </button>

    <button class="update-button" id="refresh-logs">
      Обновить
    </button>
  </div>
</div>

  <div class="settings-card">
    <div class="settings-card-heading">
      <h3>История событий</h3>

      <button class="update-button" id="clear-logs">
        Очистить журнал
      </button>
    </div>

    <div class="logs-filter">
      <select id="logs-filter">
        <option value="all">Все события</option>
        <option value="info">Информация</option>
        <option value="success">Успешно</option>
        <option value="error">Ошибки</option>
      </select>
    </div>

    <div id="logs-list" class="logs-list">
      Загрузка журнала...
    </div>

    <div id="logs-empty" class="logs-empty" style="display: none;">
      Событий пока нет
    </div>
  </div>
</section>
        <footer>Zapret Control <span>•</span> Локальное управление</footer>
      </main>
    </div>
  `;

  // Настройки темы приложения

  type ThemeChoice = "dark" | "light" | "system";

  const themeSelect = document.getElementById(
    "theme-select"
  ) as HTMLSelectElement | null;

  const themeDescription = document.getElementById(
    "theme-description"
  );

  const themeMedia = window.matchMedia("(prefers-color-scheme: light)");

  function applyTheme(choice: ThemeChoice) {
    const resolvedTheme =
      choice === "system"
        ? themeMedia.matches ? "light" : "dark"
        : choice;

    document.documentElement.dataset.theme = resolvedTheme;

    if (themeDescription) {
      const descriptions: Record<ThemeChoice, string> = {
        dark: "Используется тёмное оформление.",
        light: "Используется светлое оформление.",
        system: `Тема автоматически определяется Windows: ${resolvedTheme === "light" ? "светлая" : "тёмная"
          }.`,
      };

      themeDescription.textContent = descriptions[choice];
    }
  }

  function saveTheme(choice: ThemeChoice) {
    try {
      localStorage.setItem("zapret-control-theme", choice);
    } catch (error) {
      console.error("Не удалось сохранить тему:", error);
    }

    applyTheme(choice);
  }

  function loadTheme(): ThemeChoice {
    try {
      const savedTheme = localStorage.getItem("zapret-control-theme");

      if (
        savedTheme === "dark" ||
        savedTheme === "light" ||
        savedTheme === "system"
      ) {
        return savedTheme;
      }
    } catch (error) {
      console.error("Не удалось прочитать тему:", error);
    }

    return "dark";
  }

  const initialTheme = loadTheme();

  if (themeSelect) {
    themeSelect.value = initialTheme;
    applyTheme(initialTheme);

    themeSelect.addEventListener("change", () => {
      saveTheme(themeSelect.value as ThemeChoice);
    });
  }

  themeMedia.addEventListener("change", () => {
    if (themeSelect?.value === "system") {
      applyTheme("system");
    }
  });

  const navItems = document.querySelectorAll<HTMLButtonElement>(".nav-item");
  const mainContent = document.querySelector(".main-content");
  const topbarTitle = mainContent?.querySelector("header h1");
  const breadcrumb = mainContent?.querySelector(".breadcrumb span");
  const strategiesPage = document.getElementById("strategies-page");
  const settingsPage = document.getElementById("settings-page");
  const logsPage = document.getElementById("logs-page");
  const updatesPage = document.getElementById("updates-page");
  const strategyList = document.getElementById("strategy-list");
  const currentStrategy = document.getElementById("current-strategy");
  const strategyFileStatus = document.getElementById("strategy-file-status");
  const strategiesCount = document.getElementById("strategies-count");
  const refreshStrategies = document.getElementById("refresh-strategies");

  const homeElements = mainContent
    ? Array.from(mainContent.children).filter(element =>
      element.id !== "updates-page" &&
      element.id !== "settings-page" &&
      element.id !== "strategies-page" &&
      element.id !== "settings-page" &&
      element.tagName !== "HEADER" &&
      element.tagName !== "FOOTER"
    ) as HTMLElement[]
    : [];


  function showPage(page: string) {
    const allowedPages = [
      "home",
      "strategies",
      "settings",
      "logs",
      "updates",
    ];

    if (!allowedPages.includes(page)) {
      page = "home";
    }

    try {
      localStorage.setItem("zapret-control-last-page", page);
    } catch (error) {
      console.error("Не удалось сохранить последнюю страницу:", error);
    }
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.page === page);
    });

    const isStrategies = page === "strategies";
    const isSettings = page === "settings";
    const isLogs = page === "logs";
    const isHome = page === "home";
    const isUpdates = page === "updates";

    homeElements.forEach(element => {
      element.hidden = !isHome;
    });

    if (strategiesPage) {
      strategiesPage.hidden = !isStrategies;
    }

    if (settingsPage) {
      settingsPage.hidden = !isSettings;
    }

    if (logsPage) {
      logsPage.hidden = !isLogs;
    }

    if (updatesPage) {
      updatesPage.hidden = !isUpdates;
    }

    if (topbarTitle) {
      topbarTitle.textContent = isStrategies
        ? "Стратегии Flowseal"
        : isSettings
          ? "Настройки"
          : isLogs
            ? "Журнал событий"
            : isUpdates
              ? "Центр обновлений"
              : "Панель управления";
    }

    if (breadcrumb) {
      breadcrumb.textContent = isStrategies
        ? "СТРАТЕГИИ"
        : isSettings
          ? "НАСТРОЙКИ"
          : isLogs
            ? "ЖУРНАЛ"
            : isUpdates
              ? "ОБНОВЛЕНИЯ"
              : "ГЛАВНАЯ";
    }

    if (isStrategies) {
      void loadStrategies();
    }

    if (isSettings) {
      void loadSettings();
    }

    if (isLogs) {
      void loadLogs();
    }
  }


  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;

      if (
        page === "home" ||
        page === "strategies" ||
        page === "settings" ||
        page === "logs" ||
        page === "updates"
      ) {
        showPage(page);
      } else {
        showNotification("Этот раздел пока находится в разработке");
      }
    });
  });

  interface StrategyInfo {
    current: string | null;
    available: string[];
  }

  async function loadStrategies() {
    if (!strategyList || !currentStrategy || !strategiesCount) return;

    currentStrategy.textContent = "Загрузка...";
    strategiesCount.textContent = "Получение списка файлов...";
    strategyList.replaceChildren();

    if (strategyFileStatus) {
      strategyFileStatus.textContent = "";
    }

    try {
      const result = await invoke<StrategyInfo>("get_strategies");

      const current = result.current?.trim() || null;

      currentStrategy.textContent = current || "Не удалось определить";

      const currentFile = current
        ? result.available.find(name =>
          name.replace(/\.bat$/i, "").toLowerCase() === current.toLowerCase()
        )
        : undefined;

      if (strategyFileStatus) {
        strategyFileStatus.textContent = current
          ? currentFile
            ? "Файл текущей стратегии найден"
            : "Файл текущей стратегии не найден в папке Flowseal"
          : "Информация о текущей стратегии недоступна";

        strategyFileStatus.className = currentFile
          ? "strategy-file-found"
          : "strategy-file-missing";
      }

      strategiesCount.textContent =
        `Найдено файлов: ${result.available.length}`;

      if (result.available.length === 0) {
        strategyList.textContent = "Файлы стратегий не найдены.";
        return;
      }

      for (const name of result.available) {
        const card = document.createElement("div");
        card.className = "strategy-item";

        const nameElement = document.createElement("span");
        nameElement.className = "strategy-name";
        nameElement.textContent = name;

        const isCurrent = Boolean(
          current &&
          name.replace(/\.bat$/i, "").toLowerCase() === current.toLowerCase()
        );

        const status = document.createElement("span");
        status.className = isCurrent
          ? "strategy-current-label"
          : "strategy-available-label";
        status.textContent = isCurrent ? "ТЕКУЩАЯ" : "ДОСТУПНА";

        card.append(nameElement, status);
        strategyList.appendChild(card);
      }
    } catch (error) {
      console.error("Ошибка загрузки стратегий:", error);
      await writeLog("error", `Ошибка загрузки стратегий: ${error}`);

      currentStrategy.textContent = "Недоступно";
      strategiesCount.textContent = "Не удалось загрузить список";

      strategyList.textContent =
        "Не удалось получить данные Flowseal. Проверь наличие папки установки и доступ к ней.";

      if (strategyFileStatus) {
        strategyFileStatus.textContent = "Проверка стратегий не выполнена";
        strategyFileStatus.className = "strategy-file-missing";
      }

      showNotification("Не удалось загрузить список стратегий", true);
    }
  }

  interface SettingsInfo {
    flowseal_path: string;
    flowseal_exists: boolean;
    lists_exists: boolean;
    bin_exists: boolean;
    utils_exists: boolean;
    backups_path: string;
    backups_exists: boolean;
  }

  let settingsInfo: SettingsInfo | null = null;

  function setCheckStatus(id: string, exists: boolean) {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = exists ? "НАЙДЕНА" : "НЕ НАЙДЕНА";
    element.className = exists
      ? "settings-status-found"
      : "settings-status-missing";
  }

  async function loadSettings() {
    try {
      const info = await invoke<SettingsInfo>("get_app_info");

      settingsInfo = info;

      const openFlowsealButton = document.getElementById(
        "open-flowseal-folder"
      );

      const openBackupsButton = document.getElementById(
        "open-backups-folder"
      );

      if (openFlowsealButton instanceof HTMLButtonElement) {
        openFlowsealButton.disabled = !info.flowseal_exists;
      }

      if (openBackupsButton instanceof HTMLButtonElement) {
        openBackupsButton.disabled = !info.backups_exists;
      }

      const flowsealPath = document.getElementById("flowseal-path");
      const backupsPath = document.getElementById("settings-backups-path");

      if (flowsealPath) {
        flowsealPath.textContent = info.flowseal_path;
      }

      if (backupsPath) {
        backupsPath.textContent = info.backups_path;
      }

      setCheckStatus("check-flowseal", info.flowseal_exists);
      setCheckStatus("check-bin", info.bin_exists);
      setCheckStatus("check-lists", info.lists_exists);
      setCheckStatus("check-utils", info.utils_exists);
      setCheckStatus("check-backups", info.backups_exists);

      const versionElement = document.getElementById(
        "settings-flowseal-version"
      );

      if (versionElement) {
        try {
          const version = await invoke<string>("get_installed_version");
          versionElement.textContent = version;
        } catch (error) {
          console.warn("Не удалось определить версию Flowseal:", error);
          versionElement.textContent = "Не определена";
          versionElement.title = String(error);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);
      await writeLog("error", `Ошибка загрузки настроек: ${error}`);
      showNotification(`Ошибка диагностики: ${error}`, true);

      const flowsealPath = document.getElementById("flowseal-path");

      if (flowsealPath) {
        flowsealPath.textContent = "Не удалось получить информацию";
      }
    }
  }

  // Открытие папки Flowseal
  document.getElementById("open-flowseal-folder")?.addEventListener(
    "click",
    async () => {
      if (!settingsInfo) return;

      try {
        await openPath(settingsInfo.flowseal_path);
      } catch (error) {
        console.error("Ошибка открытия папки Flowseal:", error);
        showNotification(`Не удалось открыть папку Flowseal: ${error}`, true);
      }
    }
  );

  // Открытие папки резервных копий
  document.getElementById("open-backups-folder")?.addEventListener(
    "click",
    async () => {
      if (!settingsInfo) return;

      if (!settingsInfo.backups_exists) {
        showNotification("Папка резервных копий ещё не создана", true);
        return;
      }

      try {
        await openPath(settingsInfo.backups_path);
      } catch (error) {
        console.error("Ошибка открытия папки резервных копий:", error);
        showNotification(`Не удалось открыть папку резервных копий: ${error}`, true);
      }
    }
  );

  document.getElementById("refresh-settings")?.addEventListener(
    "click",
    () => {
      void loadSettings();
    }
  );

  refreshStrategies?.addEventListener("click", () => {
    void loadStrategies();
  });

  const switches = [
    { id: "discord-switch", statusId: "discord-status" },
    { id: "youtube-switch", statusId: "youtube-status" },
  ];

  for (const item of switches) {
    const button = document.getElementById(item.id);
    const status = document.getElementById(item.statusId);

    button?.addEventListener("click", () => {
      const enabled = button.classList.toggle("enabled");

      button.setAttribute("aria-pressed", String(enabled));

      if (status) {
        status.textContent = enabled ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО";
        status.classList.toggle("active", enabled);
        status.classList.toggle("inactive", !enabled);
      }
    });
  }


  const updateButton = document.getElementById("check-updates");
  const updateVersion = document.getElementById("update-version");
  const updateDescription = document.getElementById("update-description");
  const updateBadge = document.getElementById("update-badge");
  const latestVersion = document.getElementById("latest-version");
  const toggleNotes = document.getElementById("toggle-notes");
  let installedVersion: string | null = null;

  function showNotification(message: string, isError = false) {
    const notification = document.getElementById("app-notification");
    const notificationMessage = document.getElementById("notification-message");

    if (!notification || !notificationMessage) return;

    notificationMessage.textContent = message;

    notification.classList.toggle("error", isError);
    notification.classList.add("visible");

    setTimeout(() => {
      notification.classList.remove("visible");
    }, 3500);
  }

  async function writeLog(
    category: "info" | "success" | "error",
    message: string
  ) {
    try {
      await invoke("add_event_log", {
        category,
        message,
      });
    } catch (error) {
      console.error("Не удалось записать событие в журнал:", error);
    }
  }

  let lastZapretStatusError = "";
  let isCheckingZapretStatus = false;


  async function loadZapretStatus() {
    if (isCheckingZapretStatus) return;

    const statusText = document.getElementById("zapret-system-status");
    const indicator = document.getElementById("zapret-indicator");

    if (!statusText || !indicator) return;

    isCheckingZapretStatus = true;

    try {
      const status = await invoke<{
        zapret: boolean;
        windivert: boolean;
      }>("get_zapret_status");

      const isRunning = status.zapret && status.windivert;

      lastZapretStatusError = "";

      const globalSwitch = document.getElementById("global-switch");
      const globalStatus = document.getElementById("global-status");

      if (globalSwitch && globalStatus) {
        globalSwitch.classList.toggle("enabled", status.zapret);
        globalSwitch.setAttribute("aria-pressed", String(status.zapret));

        globalStatus.textContent = status.zapret
          ? "ВКЛЮЧЕНО"
          : "ВЫКЛЮЧЕНО";

        globalStatus.classList.toggle("active", status.zapret);
        globalStatus.classList.toggle("inactive", !status.zapret);
      }

      statusText.textContent = isRunning
        ? "РАБОТАЕТ"
        : "НЕ РАБОТАЕТ";

      statusText.classList.toggle("muted-text", !isRunning);
      statusText.classList.toggle("active-text", isRunning);

      indicator.classList.toggle("muted", !isRunning);
      indicator.classList.toggle("active", isRunning);

    } catch (error) {
      statusText.textContent = "ОШИБКА ПРОВЕРКИ";
      statusText.classList.remove("active-text");
      statusText.classList.add("muted-text");

      indicator.classList.remove("active");
      indicator.classList.add("muted");

      console.error("Ошибка проверки Zapret:", error);

      const errorMessage = String(error);

      if (errorMessage !== lastZapretStatusError) {
        lastZapretStatusError = errorMessage;

        await writeLog(
          "error",
          `Ошибка проверки состояния Zapret: ${errorMessage}`
        );
      }
    } finally {
      isCheckingZapretStatus = false;
    }
  }


  const globalSwitch = document.getElementById("global-switch");

  globalSwitch?.addEventListener("click", async () => {
    if (!(globalSwitch instanceof HTMLButtonElement)) return;

    const enabled = !globalSwitch.classList.contains("enabled");

    globalSwitch.disabled = true;

    const globalStatus = document.getElementById("global-status");

    if (globalStatus) {
      globalStatus.textContent = "ВЫПОЛНЯЕТСЯ...";
    }

    try {
      await invoke("set_zapret_enabled", { enabled });
      showNotification(
        enabled ? "Zapret успешно включён" : "Zapret успешно выключен"
      );
      await writeLog(
        "success",
        enabled ? "Zapret успешно включён" : "Zapret успешно выключен"
      );
      await loadZapretStatus();
    } catch (error) {
      console.error("Ошибка управления Zapret:", error);
      await writeLog("error", `Ошибка изменения состояния Zapret: ${error}`);
      showNotification(`Не удалось изменить состояние Zapret: ${error}`, true);
      await loadZapretStatus();
    } finally {
      globalSwitch.disabled = false;
    }
  });


  interface BackupInfo {
    name: string;
    path: string;
    size_bytes: number;
    file_count: number;
  }

  interface LogEntry {
    id: number;
    timestamp: number;
    category: string;
    message: string;
  }

  const backupButton = document.getElementById("create-backup");
  const backupStatus = document.getElementById("backup-status");
  const backupSelect = document.getElementById("backup-select") as HTMLSelectElement | null;
  const restoreButton = document.getElementById("restore-backup");
  const deleteButton = document.getElementById("delete-backup");
  const logsList = document.getElementById("logs-list");
  const logsEmpty = document.getElementById("logs-empty");
  const logsFilter = document.getElementById("logs-filter") as HTMLSelectElement | null;
  const refreshLogsButton = document.getElementById("refresh-logs");
  const exportLogsButton = document.getElementById("export-logs");
  const clearLogsButton = document.getElementById("clear-logs");

  function formatBackupSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} Б`;
    }

    const units = ["КБ", "МБ", "ГБ"];
    let size = bytes / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 2,
    }).format(size)} ${units[unitIndex]}`;
  }

  function formatFileCount(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;

    let word = "файлов";

    if (mod10 === 1 && mod100 !== 11) {
      word = "файл";
    } else if (
      mod10 >= 2 &&
      mod10 <= 4 &&
      (mod100 < 12 || mod100 > 14)
    ) {
      word = "файла";
    }

    return `${count} ${word}`;
  }


  async function loadBackups() {
    if (!backupSelect) return;

    try {
      const backups = await invoke<BackupInfo[]>("list_backups");

      backupSelect.innerHTML = "";

      if (backups.length === 0) {
        backupSelect.add(new Option("Нет доступных копий", ""));
        backupSelect.disabled = true;

        if (restoreButton instanceof HTMLButtonElement) {
          restoreButton.disabled = true;
        }

        if (backupStatus) {
          backupStatus.textContent = "Резервные копии ещё не создавались";
        }

        if (deleteButton instanceof HTMLButtonElement) {
          deleteButton.disabled = true;
        }

        return;
      }

      backupSelect.add(new Option("Выбери резервную копию", ""));

      for (const backup of backups) {
        const timestamp = backup.name.match(/^backup-(\d+)/)?.[1];

        let label = backup.name;

        if (timestamp) {
          const date = new Date(Number(timestamp) * 1000);
          label += ` — ${date.toLocaleString("ru-RU")}`;
        }

        label += ` · ${formatBackupSize(backup.size_bytes)}`;
        label += ` · ${formatFileCount(backup.file_count)}`;

        backupSelect.add(new Option(label, backup.name));
      }

      backupSelect.disabled = false;

      if (restoreButton instanceof HTMLButtonElement) {
        restoreButton.disabled = true;
      }

      if (deleteButton instanceof HTMLButtonElement) {
        deleteButton.disabled = true;
      }

      const latestBackup = backups[0];
      const latestTimestamp = latestBackup.name.match(/^backup-(\d+)/)?.[1];

      const latestDate = latestTimestamp
        ? new Date(Number(latestTimestamp) * 1000).toLocaleString("ru-RU")
        : "неизвестна";

      if (backupStatus) {
        backupStatus.textContent =
          `Доступно копий: ${backups.length} · ` +
          `Последняя: ${latestDate} · ` +
          `${formatBackupSize(latestBackup.size_bytes)} · ` +
          `${formatFileCount(latestBackup.file_count)}`;
      }
    } catch (error) {
      console.error("Ошибка загрузки резервных копий:", error);

      if (backupStatus) {
        backupStatus.textContent = "Не удалось загрузить список копий";
      }

      showNotification(`Ошибка загрузки копий: ${error}`, true);
    }
  }


  async function loadLogs() {
    if (!logsList) return;

    try {
      const entries = await invoke<LogEntry[]>("get_event_log");

      const selectedFilter = logsFilter?.value ?? "all";

      const filteredEntries = entries.filter(entry =>
        selectedFilter === "all" || entry.category === selectedFilter
      );

      logsList.innerHTML = "";

      if (filteredEntries.length === 0) {
        logsList.style.display = "none";

        if (logsEmpty) {
          logsEmpty.textContent = entries.length === 0
            ? "Событий пока нет"
            : "Нет событий выбранного типа";

          logsEmpty.style.display = "block";
        }

        return;
      }

      logsList.style.display = "flex";

      if (logsEmpty) {
        logsEmpty.style.display = "none";
      }

      for (const entry of filteredEntries) {
        const item = document.createElement("div");
        item.className = `log-entry log-${entry.category}`;

        const date = new Date(entry.timestamp * 1000);

        const time = document.createElement("div");
        time.className = "log-time";
        time.textContent = date.toLocaleString("ru-RU");

        const category = document.createElement("div");
        category.className = "log-category";
        category.textContent = entry.category;

        const message = document.createElement("div");
        message.className = "log-message";
        message.textContent = entry.message;

        item.append(time, category, message);
        logsList.appendChild(item);
      }
    } catch (error) {
      console.error("Ошибка загрузки журнала:", error);
      logsList.textContent = "Не удалось загрузить журнал";
      showNotification(`Ошибка журнала: ${error}`, true);
    }
  }

  async function exportLogs() {
    try {
      const entries = await invoke<LogEntry[]>("get_event_log");

      if (entries.length === 0) {
        showNotification("Журнал пуст — экспортировать нечего", true);
        return;
      }

      const categoryNames: Record<string, string> = {
        info: "ИНФОРМАЦИЯ",
        success: "УСПЕШНО",
        error: "ОШИБКА",
      };

      const lines = entries
        .map(entry => {
          const date = new Date(entry.timestamp * 1000).toLocaleString("ru-RU");
          const category = categoryNames[entry.category] ?? entry.category;

          return `[${date}] [${category}] ${entry.message}`;
        })
        .join("\n");

      const content = "\uFEFFЖУРНАЛ СОБЫТИЙ ZAPRET CONTROL\n\n" + lines;

      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `zapret-log-${new Date().toISOString().slice(0, 10)}.txt`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      showNotification("Экспорт журнала подготовлен");
    } catch (error) {
      console.error("Ошибка экспорта журнала:", error);
      showNotification(`Не удалось экспортировать журнал: ${error}`, true);
    }
  }

  exportLogsButton?.addEventListener("click", () => {
    void exportLogs();
  });

  refreshLogsButton?.addEventListener("click", () => {
    void loadLogs();
  });

  logsFilter?.addEventListener("change", () => {
    void loadLogs();
  });

  clearLogsButton?.addEventListener("click", async () => {
    if (!window.confirm("Очистить весь журнал событий?")) {
      return;
    }

    try {
      await invoke("clear_event_log");
      await loadLogs();
      showNotification("Журнал событий очищен");
    } catch (error) {
      console.error("Ошибка очистки журнала:", error);
      showNotification(`Не удалось очистить журнал: ${error}`, true);
    }
  });

  backupSelect?.addEventListener("change", () => {
    const hasSelection = Boolean(backupSelect.value);

    if (restoreButton instanceof HTMLButtonElement) {
      restoreButton.disabled = !hasSelection;
    }

    if (deleteButton instanceof HTMLButtonElement) {
      deleteButton.disabled = !hasSelection;
    }
  });

  // Создание резервной копии
  backupButton?.addEventListener("click", async () => {
    if (!(backupButton instanceof HTMLButtonElement)) return;

    backupButton.disabled = true;
    backupButton.textContent = "Создание копии...";

    if (backupStatus) {
      backupStatus.textContent = "Копирование файлов...";
    }

    try {
      const backupPath = await invoke<string>("create_backup");

      await writeLog("success", `Создана резервная копия: ${backupPath}`);

      if (backupStatus) {
        backupStatus.textContent = `Последняя копия: ${backupPath}`;
      }

      showNotification("Резервная копия успешно создана");

      await loadBackups();
    } catch (error) {
      console.error("Ошибка создания резервной копии:", error);

      await writeLog("error", `Ошибка создания резервной копии: ${error}`);

      if (backupStatus) {
        backupStatus.textContent = "Не удалось создать резервную копию";
      }

      showNotification(`Ошибка резервного копирования: ${error}`, true);
    } finally {
      backupButton.disabled = false;
      backupButton.textContent = "Создать копию";
    }
  });

  // Восстановление резервной копии
  restoreButton?.addEventListener("click", async () => {
    if (
      !(restoreButton instanceof HTMLButtonElement) ||
      !backupSelect?.value
    ) {
      return;
    }

    const backupName = backupSelect.value;

    const confirmed = window.confirm(
      `Восстановить резервную копию ${backupName}?\n\n` +
      "Текущие списки Flowseal будут заменены. " +
      "Перед заменой приложение автоматически сохранит их копию."
    );

    if (!confirmed) return;

    restoreButton.disabled = true;
    restoreButton.textContent = "Восстановление...";

    if (backupButton instanceof HTMLButtonElement) {
      backupButton.disabled = true;
    }

    if (backupStatus) {
      backupStatus.textContent = "Восстановление списков...";
    }

    try {
      const result = await invoke<string>("restore_backup", {
        backupName
      });

      await writeLog("success", `Восстановлена резервная копия: ${backupName}`);

      if (backupStatus) {
        backupStatus.textContent = result;
      }

      showNotification("Восстановление завершено");

      await loadBackups();
    } catch (error) {
      console.error("Ошибка восстановления:", error);

      await writeLog("error", `Ошибка восстановления копии ${backupName}: ${error}`);

      if (backupStatus) {
        backupStatus.textContent = "Не удалось восстановить копию";
      }

      showNotification(`Ошибка восстановления: ${error}`, true);
    } finally {
      restoreButton.disabled = !backupSelect?.value;
      restoreButton.textContent = "Восстановить";

      if (backupButton instanceof HTMLButtonElement) {
        backupButton.disabled = false;
      }
    }
  });

  deleteButton?.addEventListener("click", async () => {
    if (
      !(deleteButton instanceof HTMLButtonElement) ||
      !backupSelect?.value
    ) {
      return;
    }

    const backupName = backupSelect.value;

    const confirmed = window.confirm(
      `Удалить резервную копию ${backupName}?\n\n` +
      "Это действие нельзя отменить."
    );

    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteButton.textContent = "Удаление...";

    try {
      await invoke<string>("delete_backup", {
        backupName
      });

      await writeLog("success", `Удалена резервная копия: ${backupName}`);

      showNotification("Резервная копия удалена");
      await loadBackups();
    } catch (error) {
      console.error("Ошибка удаления копии:", error);
      await writeLog("error", `Ошибка удаления копии ${backupName}: ${error}`);
      showNotification(`Не удалось удалить копию: ${error}`, true);
    } finally {
      deleteButton.textContent = "Удалить копию";
      deleteButton.disabled = !backupSelect?.value;
    }
  });

  // Загружаем список при открытии приложения
  void loadBackups();


  loadZapretStatus();
  setInterval(loadZapretStatus, 5000);

  toggleNotes?.addEventListener("click", () => {
    if (!updateNotes || !toggleNotes) return;

    const isHidden = updateNotes.hidden;

    updateNotes.hidden = !isHidden;
    toggleNotes.textContent = isHidden
      ? "Скрыть изменения"
      : "Что нового в версии";
  });

  async function loadInstalledVersion() {
    if (!updateDescription) return;

    try {
      const version = await invoke<string>("get_installed_version");

      installedVersion = version;
      updateDescription.textContent =
        `Установленная версия: ${version}`;

    } catch (error) {
      console.warn("Ошибка определения версии:", error);

      installedVersion = "";
      updateDescription.textContent =
        "Не удалось определить установленную версию";

      updateDescription.title = String(error);
    }
  }


  async function setupAppUpdater() {
    const currentVersion = document.querySelector<HTMLElement>(
      "#app-current-version"
    );
    const title = document.querySelector<HTMLElement>(
      "#app-update-title"
    );
    const description = document.querySelector<HTMLElement>(
      "#app-update-description"
    );
    const badge = document.querySelector<HTMLElement>(
      "#app-update-badge"
    );
    const notes = document.querySelector<HTMLElement>(
      "#app-update-notes"
    );

    const checkButton = document.querySelector<HTMLButtonElement>(
      "#app-update-check"
    );
    const installButton = document.querySelector<HTMLButtonElement>(
      "#app-update-install"
    );

    const progress = document.querySelector<HTMLElement>(
      "#app-update-progress"
    );
    const progressStatus = document.querySelector<HTMLElement>(
      "#app-update-progress-status"
    );
    const progressPercent = document.querySelector<HTMLElement>(
      "#app-update-progress-percent"
    );
    const progressFill = document.querySelector<HTMLElement>(
      "#app-update-progress-fill"
    );
    const progressDetails = document.querySelector<HTMLElement>(
      "#app-update-progress-details"
    );

    if (
      !currentVersion ||
      !title ||
      !description ||
      !badge ||
      !notes ||
      !checkButton ||
      !installButton ||
      !progress ||
      !progressStatus ||
      !progressPercent ||
      !progressFill ||
      !progressDetails
    ) {
      console.warn("Не найдены элементы интерфейса обновлений");
      return;
    }

    let availableUpdate: Awaited<ReturnType<typeof check>> = null;

    function formatBytes(bytes: number): string {
      if (bytes < 1024) return `${bytes} Б`;
      if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} КБ`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
    }

    currentVersion.textContent = "v0.1.0";

    checkButton.addEventListener("click", async () => {
      checkButton.disabled = true;
      checkButton.textContent = "Проверка...";
      installButton.hidden = true;
      badge.hidden = true;
      notes.hidden = true;
      progress.hidden = true;
      availableUpdate = null;

      title.textContent = "Проверяем обновления";
      description.textContent = "Подключение к серверу обновлений...";

      try {
        const update = await check();

        if (!update) {
          title.textContent = "У вас последняя версия";
          description.textContent =
            "Обновления Zapret Control пока не требуются.";

          return;
        }

        availableUpdate = update;

        title.textContent = `Доступна версия v${update.version}`;
        description.textContent =
          `Установлена версия v${update.currentVersion}`;

        badge.hidden = false;
        installButton.hidden = false;

        notes.textContent =
          update.body?.trim() || "Описание изменений отсутствует.";

        notes.hidden = false;
      } catch (error) {
        console.error("Ошибка проверки обновлений:", error);

        title.textContent = "Не удалось проверить обновления";
        description.textContent = String(error);
      } finally {
        checkButton.disabled = false;
        checkButton.textContent = "Проверить обновления";
      }
    });

    installButton.addEventListener("click", async () => {
      if (!availableUpdate) return;

      const confirmed = window.confirm(
        `Скачать и установить Zapret Control v${availableUpdate.version}?\n\n` +
        "Приложение будет закрыто для установки обновления."
      );

      if (!confirmed) return;

      installButton.disabled = true;
      checkButton.disabled = true;

      progress.hidden = false;
      progressStatus.textContent = "Подготовка загрузки...";
      progressPercent.textContent = "0%";
      progressFill.style.width = "0%";
      progressDetails.textContent = "";

      let downloadedBytes = 0;
      let totalBytes: number | undefined;

      try {
        await availableUpdate.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started": {
              totalBytes = event.data.contentLength;

              progressStatus.textContent = "Загрузка обновления...";
              break;
            }

            case "Progress": {
              downloadedBytes += event.data.chunkLength;

              if (totalBytes && totalBytes > 0) {
                const percent = Math.min(
                  100,
                  Math.round((downloadedBytes / totalBytes) * 100)
                );

                progressPercent.textContent = `${percent}%`;
                progressFill.style.width = `${percent}%`;

                progressDetails.textContent =
                  `${formatBytes(downloadedBytes)} из ${formatBytes(totalBytes)}`;
              } else {
                progressDetails.textContent =
                  `Загружено ${formatBytes(downloadedBytes)}`;
              }

              break;
            }

            case "Finished": {
              progressPercent.textContent = "100%";
              progressFill.style.width = "100%";
              progressStatus.textContent =
                "Загрузка завершена. Подготовка установки...";
              break;
            }
          }
        });

        progressStatus.textContent =
          "Обновление передано установщику.";

        progressDetails.textContent =
          "Если приложение не закрылось автоматически, проверь результат установки.";

      } catch (error) {
        console.error("Ошибка установки обновления:", error);

        progressStatus.textContent = "Ошибка обновления";
        progressDetails.textContent = String(error);

        installButton.disabled = false;
        checkButton.disabled = false;
      }
    });
  }


  function compareVersions(installed: string, latest: string): number {
    const a = installed.split(".").map(Number);
    const b = latest.split(".").map(Number);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const partA = a[i] || 0;
      const partB = b[i] || 0;

      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }

    return 0;
  }

  const updateNotes = document.getElementById("update-notes");





  const formatReleaseNotes = (html: string): string => {
    const parsed = new DOMParser().parseFromString(html, "text/html");

    const allowedTags = new Set([
      "UL", "OL", "LI", "P", "H2", "H3", "H4",
      "STRONG", "EM", "A", "CODE", "BLOCKQUOTE", "HR", "BR"
    ]);

    const cleanNode = (node: Node, target: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(node.textContent || ""));
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as HTMLElement;

      if (!allowedTags.has(element.tagName)) {
        element.childNodes.forEach(child => cleanNode(child, target));
        return;
      }

      const cleanElement = document.createElement(element.tagName.toLowerCase());

      if (element.tagName === "A") {
        const href = element.getAttribute("href");

        if (href) {
          try {
            const url = new URL(href, "https://github.com");

            if (url.protocol === "https:") {
              cleanElement.setAttribute("href", url.href);
            }
          } catch {
            // Некорректные ссылки пропускаем.
          }
        }
      }

      element.childNodes.forEach(child => cleanNode(child, cleanElement));
      target.appendChild(cleanElement);
    };

    const container = document.createElement("div");

    parsed.body.childNodes.forEach(node => cleanNode(node, container));

    return container.innerHTML;
  };

  let releaseUrl: string | null = null;

  updateButton?.addEventListener("click", async () => {
    if (!updateButton) return;

    if (releaseUrl) {
      try {
        await openUrl(releaseUrl);
      } catch (error) {
        console.error("Не удалось открыть релиз:", error);
        showNotification("Не удалось открыть GitHub", true);
      }
      return;
    }
    updateButton.textContent = "Проверка...";
    updateButton.setAttribute("disabled", "true");

    try {
      const release = await invoke<{
        version: string;
        name: string;
        url: string;
        notes: string;
        published_at: string | null;
      }>("check_for_updates");
      await writeLog(
        "success",
        `Проверка обновлений завершена. Последняя версия: ${release.version}`
      );

      releaseUrl = release.url;

      if (updateVersion) {
        updateVersion.textContent = release.name;
      }

      if (latestVersion) {
        latestVersion.textContent = `Последняя версия: ${release.version}`;
      }

      if (updateDescription) {
        if (!installedVersion) {
          updateDescription.textContent = "Не удалось определить установленную версию";
        } else {
          const comparison = compareVersions(installedVersion, release.version);

          if (updateBadge) {
            updateBadge.hidden = comparison >= 0;
          }

          if (comparison < 0) {
            updateDescription.textContent = `Установлена версия ${installedVersion}. Доступно обновление!`;
          } else if (comparison === 0) {
            updateDescription.textContent = `Установлена последняя версия ${installedVersion}`;
          } else {
            updateDescription.textContent = `Установленная версия ${installedVersion} новее найденной`;
          }
        }
      }

      if (updateNotes) {
        updateNotes.hidden = true;

        updateNotes.innerHTML = formatReleaseNotes(
          release.notes || "Описание изменений отсутствует."
        );

        if (toggleNotes) {
          toggleNotes.hidden = false;
          toggleNotes.textContent = `Что нового в версии ${release.version}`;
        }
        updateNotes.style.whiteSpace = "pre-wrap";
      }

      updateButton.textContent = "Открыть релиз";
      updateButton.removeAttribute("disabled");
      updateButton.title = `Открыть релиз ${release.version} на GitHub`;
    } catch (error) {
      if (updateVersion) {
        await writeLog("error", `Ошибка проверки обновлений: ${error}`);
        updateVersion.textContent = "Ошибка проверки";
      }

      if (updateDescription) {
        updateDescription.textContent = String(error);
      }

      updateButton.textContent = "Повторить";
      updateButton.removeAttribute("disabled");
      updateButton.title = "Повторить проверку обновлений";
    }
  });

  // Восстановление последней открытой страницы

  let initialPage = "home";

  try {
    const savedPage = localStorage.getItem("zapret-control-last-page");

    if (
      savedPage === "home" ||
      savedPage === "strategies" ||
      savedPage === "settings" ||
      savedPage === "logs" ||
      savedPage === "updates"
    ) {
      initialPage = savedPage;
    }
  } catch (error) {
    console.error("Не удалось восстановить последнюю страницу:", error);
  }

  showPage(initialPage);
  void setupAppUpdater();

  void (async () => {
    await loadInstalledVersion();
    updateButton?.click();
  })();

}