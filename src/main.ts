import { invoke } from "@tauri-apps/api/core";
import "./styles.css";
import { openUrl } from "@tauri-apps/plugin-opener";
import { open, save } from "@tauri-apps/plugin-dialog";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">
<img src="/icons/icon.png" alt="Zapret Control"></div>
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
          <div class="version">ZAPRET CONTROL <span data-app-version>Загрузка...</span></div>
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
              <span id="global-status">ПРОВЕРКА...</span>
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

          <div class="settings-card app-update-card">
  <div class="settings-card-heading">
    <div class="global-icon">Z</div>
    <div>
      <h3>Zapret Control</h3>
      <p>Приложение управления</p>
    </div>
  </div>

  <div class="settings-check-row">
    <span>Установленная версия</span>
    <span data-app-version>Загрузка...</span>
  </div>

  <div class="update-release-info">
    <h3 id="app-update-title">Проверка обновлений</h3>
    <p id="app-update-description">
      Нажми кнопку, чтобы проверить новую версию приложения.
    </p>

    <span id="app-update-badge" class="update-badge" hidden>
      ДОСТУПНО ОБНОВЛЕНИЕ
    </span>

    <p id="app-latest-version"></p>
  </div>

  <div class="update-actions">
    <button class="update-button" id="check-app-updates">
      Проверить обновления
    </button>
  </div>

  <button class="notes-toggle" id="toggle-app-notes" hidden>
    Что нового в версии
  </button>

  <div class="update-notes" id="app-update-notes" hidden></div>

  <div class="update-info">
    <p>
      Обновления Zapret Control загружаются вручную с GitHub.
      Установка выполняется пользователем.
    </p>
  </div>
</div>

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
              <p id="update-description">Загрузка установленной версии...</p>

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
                Релиз Flowseal открывается на GitHub. Установка и изменение
                конфигурации остаются под твоим контролем.
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
  Обновить информацию
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

            <div class="folder-actions">
              <button class="update-button folder-button" id="select-flowseal-folder">
                <span>📁</span> Выбрать папку Flowseal
              </button>

              <button class="update-button folder-button" id="open-flowseal-folder">
                <span>↗</span> Открыть папку Flowseal
              </button>
            </div>

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
  <span data-app-version>Загрузка...</span>
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

      <div id="app-notification" class="app-notification" role="status">
        <span id="notification-message"></span>
      </div>
    </div>
  `;

  // Служебные стили: атрибут hidden и всплывающие уведомления.
  if (!document.getElementById("zapret-runtime-styles")) {
    const style = document.createElement("style");
    style.id = "zapret-runtime-styles";
    style.textContent = `
      [hidden] { display: none !important; }

      .app-notification {
        position: fixed;
        right: 24px;
        bottom: 24px;
        max-width: 420px;
        padding: 14px 18px;
        border-radius: 12px;
        background: #1f2a24;
        color: #ffffff;
        border: 1px solid rgba(80, 200, 120, 0.55);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        font-size: 14px;
        line-height: 1.4;
        opacity: 0;
        transform: translateY(12px);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 9999;
      }

      .app-notification.visible {
        opacity: 1;
        transform: none;
      }

      .app-notification.error {
        background: #2a1f1f;
        border-color: rgba(230, 80, 80, 0.65);
      }
    `;
    document.head.appendChild(style);
  }

  // ───────────────────────── Тема ─────────────────────────

  type ThemeChoice = "dark" | "light" | "system";

  const themeSelect = document.getElementById(
    "theme-select"
  ) as HTMLSelectElement | null;
  const themeDescription = document.getElementById("theme-description");
  const themeMedia = window.matchMedia("(prefers-color-scheme: light)");

  function applyTheme(choice: ThemeChoice) {
    const resolvedTheme =
      choice === "system" ? (themeMedia.matches ? "light" : "dark") : choice;

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
    themeSelect.addEventListener("change", () => {
      saveTheme(themeSelect.value as ThemeChoice);
    });
  }

  applyTheme(initialTheme);

  themeMedia.addEventListener("change", () => {
    if (themeSelect?.value === "system") {
      applyTheme("system");
    }
  });

  // ───────────────────────── Общие функции ─────────────────────────

  let notificationTimer: number | undefined;

  function showNotification(message: string, isError = false) {
    const notification = document.getElementById("app-notification");
    const notificationMessage = document.getElementById("notification-message");

    if (!notification || !notificationMessage) return;

    notificationMessage.textContent = message;
    notification.classList.toggle("error", isError);
    notification.classList.add("visible");

    if (notificationTimer !== undefined) {
      window.clearTimeout(notificationTimer);
    }

    notificationTimer = window.setTimeout(() => {
      notification.classList.remove("visible");
    }, 3500);
  }

  async function writeLog(
    category: "info" | "success" | "error",
    message: string
  ) {
    try {
      await invoke("add_event_log", { category, message });
    } catch (error) {
      console.error("Не удалось записать событие в журнал:", error);
    }
  }

  // ───────────────────────── Навигация ─────────────────────────

  type PageName = "home" | "strategies" | "settings" | "logs" | "updates";

  const navItems = document.querySelectorAll<HTMLButtonElement>(".nav-item");
  const mainContent = document.querySelector(".main-content");
  const topbarTitle = mainContent?.querySelector("header h1");
  const breadcrumb = mainContent?.querySelector(".breadcrumb span");
  const strategiesPage = document.getElementById("strategies-page");
  const settingsPage = document.getElementById("settings-page");
  const logsPage = document.getElementById("logs-page");
  const updatesPage = document.getElementById("updates-page");

  const separatePageIds = new Set([
    "updates-page",
    "settings-page",
    "strategies-page",
    "logs-page",
  ]);

  const homeElements = mainContent
    ? (Array.from(mainContent.children).filter(
      element =>
        !separatePageIds.has(element.id) &&
        element.tagName !== "HEADER" &&
        element.tagName !== "FOOTER"
    ) as HTMLElement[])
    : [];

  const pageTitles: Record<PageName, string> = {
    home: "Панель управления",
    strategies: "Стратегии Flowseal",
    settings: "Настройки",
    logs: "Журнал событий",
    updates: "Центр обновлений",
  };

  const pageCrumbs: Record<PageName, string> = {
    home: "ГЛАВНАЯ",
    strategies: "СТРАТЕГИИ",
    settings: "НАСТРОЙКИ",
    logs: "ЖУРНАЛ",
    updates: "ОБНОВЛЕНИЯ",
  };

  function isPageName(value: string | undefined): value is PageName {
    return (
      value === "home" ||
      value === "strategies" ||
      value === "settings" ||
      value === "logs" ||
      value === "updates"
    );
  }

  function showPage(page: PageName) {
    navItems.forEach(item => {
      item.classList.toggle("active", item.dataset.page === page);
    });

    homeElements.forEach(element => {
      element.hidden = page !== "home";
    });

    if (strategiesPage) strategiesPage.hidden = page !== "strategies";
    if (settingsPage) settingsPage.hidden = page !== "settings";
    if (logsPage) logsPage.hidden = page !== "logs";
    if (updatesPage) updatesPage.hidden = page !== "updates";

    if (topbarTitle) topbarTitle.textContent = pageTitles[page];
    if (breadcrumb) breadcrumb.textContent = pageCrumbs[page];

    if (page === "strategies") void loadStrategies();
    if (page === "settings") void loadSettings();
    if (page === "logs") void loadLogs();
    if (page === "home") {
      void loadZapretStatus();
      void loadBackups();
    }
  }

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;

      if (isPageName(page)) {
        showPage(page);
      } else {
        showNotification("Этот раздел пока находится в разработке");
      }
    });
  });

  // ───────────────────────── Стратегии ─────────────────────────

  interface StrategyInfo {
    current: string | null;
    available: string[];
  }

  const strategyList = document.getElementById("strategy-list");
  const currentStrategy = document.getElementById("current-strategy");
  const strategyFileStatus = document.getElementById("strategy-file-status");
  const strategiesCount = document.getElementById("strategies-count");

  let isLoadingStrategies = false;

  async function loadStrategies() {
    if (!strategyList || !currentStrategy || !strategiesCount) return;
    if (isLoadingStrategies) return;

    isLoadingStrategies = true;

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

      const matchesCurrent = (name: string) =>
        Boolean(
          current &&
          name.replace(/\.bat$/i, "").toLowerCase() === current.toLowerCase()
        );

      const currentFile = result.available.find(matchesCurrent);

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

      strategiesCount.textContent = `Найдено файлов: ${result.available.length}`;

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

        const isCurrent = matchesCurrent(name);

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
    } finally {
      isLoadingStrategies = false;
    }
  }

  const refreshStrategiesButton = document.getElementById(
    "refresh-strategies"
  ) as HTMLButtonElement | null;

  refreshStrategiesButton?.addEventListener("click", async () => {
    if (isLoadingStrategies) return;

    refreshStrategiesButton.disabled = true;
    refreshStrategiesButton.textContent = "Обновление...";

    try {
      await loadStrategies();
    } finally {
      refreshStrategiesButton.disabled = false;
      refreshStrategiesButton.textContent = "Обновить список";
    }
  });

  // ───────────────────────── Настройки ─────────────────────────

  interface SettingsInfo {
    flowseal_path: string;
    flowseal_exists: boolean;
    lists_exists: boolean;
    bin_exists: boolean;
    utils_exists: boolean;
    backups_path: string;
    backups_exists: boolean;
    app_version: string;
  }

  let installedAppVersion = "";
  let appReleaseUrl = "";

  async function loadAppVersion(): Promise<void> {
    try {
      const info = await invoke<{ app_version: string }>("get_app_info");

      installedAppVersion = info.app_version;

      document
        .querySelectorAll<HTMLElement>("[data-app-version]")
        .forEach(element => {
          element.textContent = `v${installedAppVersion}`;
        });
    } catch (error) {
      console.error("Не удалось получить версию Zapret Control:", error);

      document
        .querySelectorAll<HTMLElement>("[data-app-version]")
        .forEach(element => {
          element.textContent = "Не определена";
        });
    }
  }

  function setCheckStatus(id: string, exists: boolean) {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = exists ? "НАЙДЕНА" : "НЕ НАЙДЕНА";
    element.className = exists
      ? "settings-status-found"
      : "settings-status-missing";
  }

  let isLoadingSettings = false;

  const refreshSettingsButton = document.getElementById(
    "refresh-settings"
  ) as HTMLButtonElement | null;

  async function loadSettings() {
    if (isLoadingSettings) return;

    isLoadingSettings = true;

    if (refreshSettingsButton) {
      refreshSettingsButton.disabled = true;
      refreshSettingsButton.textContent = "Обновление...";
    }

    try {
      const info = await invoke<SettingsInfo>("get_app_info");

      installedAppVersion = info.app_version;

      document
        .querySelectorAll<HTMLElement>("[data-app-version]")
        .forEach(element => {
          element.textContent = `v${installedAppVersion}`;
        });

      const openFlowsealButton = document.getElementById("open-flowseal-folder");
      const openBackupsButton = document.getElementById("open-backups-folder");

      if (openFlowsealButton instanceof HTMLButtonElement) {
        openFlowsealButton.disabled = !info.flowseal_exists;
      }

      if (openBackupsButton instanceof HTMLButtonElement) {
        openBackupsButton.disabled = !info.backups_exists;
      }

      const flowsealPath = document.getElementById("flowseal-path");
      const backupsPath = document.getElementById("settings-backups-path");

      if (flowsealPath) flowsealPath.textContent = info.flowseal_path;
      if (backupsPath) backupsPath.textContent = info.backups_path;

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
          versionElement.textContent = await invoke<string>(
            "get_installed_version"
          );

          versionElement.title = "";
        } catch (error) {
          console.warn("Не удалось определить версию Flowseal:", error);

          versionElement.textContent = "Не определена";
          versionElement.title = String(error);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);

      await writeLog(
        "error",
        `Ошибка загрузки настроек: ${error}`
      );

      showNotification(`Ошибка диагностики: ${error}`, true);

      const flowsealPath = document.getElementById("flowseal-path");

      if (flowsealPath) {
        flowsealPath.textContent = "Не удалось получить информацию";
      }
    } finally {
      isLoadingSettings = false;

      if (refreshSettingsButton) {
        refreshSettingsButton.disabled = false;
        refreshSettingsButton.textContent = "Обновить информацию";
      }
    }
  }

  document
    .getElementById("select-flowseal-folder")
    ?.addEventListener("click", async () => {
      try {
        const selectedPath = await open({
          directory: true,
          multiple: false,
          title: "Выберите папку Flowseal",
        });

        if (!selectedPath || typeof selectedPath !== "string") {
          return;
        }

        await invoke("set_flowseal_path", { path: selectedPath });
        await writeLog("info", `Выбрана папка Flowseal: ${selectedPath}`);
        await loadSettings();

        showNotification("Путь к Flowseal успешно сохранён");
      } catch (error) {
        console.error("Ошибка выбора папки Flowseal:", error);
        showNotification(`Не удалось сохранить путь: ${error}`, true);
      }
    });

  async function openKnownFolder(target: "flowseal" | "backups") {
    try {
      await invoke("open_folder", { target });
    } catch (error) {
      console.error("Ошибка открытия папки:", error);
      showNotification(`Не удалось открыть папку: ${error}`, true);
    }
  }

  document
    .getElementById("open-flowseal-folder")
    ?.addEventListener("click", () => {
      void openKnownFolder("flowseal");
    });

  document
    .getElementById("open-backups-folder")
    ?.addEventListener("click", () => {
      void openKnownFolder("backups");
    });

  document.getElementById("refresh-settings")?.addEventListener("click", () => {
    void loadSettings();
  });

  document.getElementById("toggle-app-notes")?.addEventListener("click", () => {
    const notes = document.getElementById("app-update-notes");
    const button = document.getElementById("toggle-app-notes");

    if (!notes || !button) return;

    notes.hidden = !notes.hidden;
    button.textContent = notes.hidden
      ? "Что нового в версии"
      : "Скрыть описание";
  });

  // ───────────────────────── Статус Zapret и переключатель ─────────────────────────

  let lastZapretStatusError = "";
  let isCheckingZapretStatus = false;
  let isTogglingZapret = false;

  async function loadZapretStatus() {
    if (isCheckingZapretStatus || isTogglingZapret) return;

    const statusText = document.getElementById("zapret-system-status");
    const indicator = document.getElementById("zapret-indicator");

    if (!statusText || !indicator) return;

    isCheckingZapretStatus = true;

    try {
      const status = await invoke<{ zapret: boolean; windivert: boolean }>(
        "get_zapret_status"
      );

      const isRunning = status.zapret && status.windivert;

      lastZapretStatusError = "";

      const globalSwitchElement = document.getElementById("global-switch");
      const globalStatus = document.getElementById("global-status");

      // Во время переключения интерфейс не трогаем.
      if (globalSwitchElement && globalStatus && !isTogglingZapret) {
        globalSwitchElement.classList.toggle("enabled", status.zapret);
        globalSwitchElement.setAttribute("aria-pressed", String(status.zapret));

        globalStatus.textContent = status.zapret ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО";
        globalStatus.classList.toggle("active", status.zapret);
        globalStatus.classList.toggle("inactive", !status.zapret);
      }

      statusText.textContent = isRunning
        ? "ОБЕ СЛУЖБЫ ЗАПУЩЕНЫ"
        : "НЕ ВСЕ СЛУЖБЫ ЗАПУЩЕНЫ";
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
    if (isTogglingZapret) return;

    const enabled = !globalSwitch.classList.contains("enabled");

    isTogglingZapret = true;
    globalSwitch.disabled = true;

    const globalStatus = document.getElementById("global-status");

    if (globalStatus) {
      globalStatus.textContent = enabled
        ? "ВКЛЮЧЕНИЕ... (подтверди запрос Windows)"
        : "ВЫКЛЮЧЕНИЕ... (подтверди запрос Windows)";
    }

    try {
      await invoke("set_zapret_enabled", { enabled });

      const message = enabled
        ? "Zapret успешно включён"
        : "Zapret успешно выключен";

      showNotification(message);
      await writeLog("success", message);
    } catch (error) {
      console.error("Ошибка управления Zapret:", error);
      await writeLog("error", `Ошибка изменения состояния Zapret: ${error}`);
      showNotification(`Не удалось изменить состояние Zapret: ${error}`, true);
    } finally {
      isTogglingZapret = false;
      globalSwitch.disabled = false;
      await loadZapretStatus();
    }
  });

  // ───────────────────────── Резервные копии ─────────────────────────

  interface BackupInfo {
    name: string;
    path: string;
    size_bytes: number;
    file_count: number;
  }

  const backupButton = document.getElementById("create-backup");
  const backupStatus = document.getElementById("backup-status");
  const backupSelect = document.getElementById(
    "backup-select"
  ) as HTMLSelectElement | null;
  const restoreButton = document.getElementById("restore-backup");
  const deleteButton = document.getElementById("delete-backup");

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
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      word = "файла";
    }

    return `${count} ${word}`;
  }

  function setBackupButtonsDisabled(disabled: boolean) {
    if (restoreButton instanceof HTMLButtonElement) {
      restoreButton.disabled = disabled;
    }

    if (deleteButton instanceof HTMLButtonElement) {
      deleteButton.disabled = disabled;
    }
  }

  function backupDate(name: string): string | null {
    const timestamp = name.match(/^backup-(\d+)/)?.[1];

    return timestamp
      ? new Date(Number(timestamp) * 1000).toLocaleString("ru-RU")
      : null;
  }

  let isLoadingBackups = false;

  async function loadBackups() {
    if (!backupSelect || isLoadingBackups) return;

    isLoadingBackups = true;

    try {
      const backups = await invoke<BackupInfo[]>("list_backups");

      backupSelect.innerHTML = "";

      if (backups.length === 0) {
        backupSelect.add(new Option("Нет доступных копий", ""));
        backupSelect.disabled = true;
        setBackupButtonsDisabled(true);

        if (backupStatus) {
          backupStatus.textContent = "Резервные копии ещё не создавались";
        }

        return;
      }

      backupSelect.add(new Option("Выбери резервную копию", ""));

      for (const backup of backups) {
        let label = backup.name;
        const date = backupDate(backup.name);

        if (date) {
          label += ` — ${date}`;
        }

        label += ` · ${formatBackupSize(backup.size_bytes)}`;
        label += ` · ${formatFileCount(backup.file_count)}`;

        backupSelect.add(new Option(label, backup.name));
      }

      backupSelect.disabled = false;
      setBackupButtonsDisabled(true);

      const latestBackup = backups[0];
      const latestDate = backupDate(latestBackup.name) ?? "неизвестна";

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
    } finally {
      isLoadingBackups = false;
    }
  }

  backupSelect?.addEventListener("change", () => {
    setBackupButtonsDisabled(!backupSelect.value);
  });

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
      const result = await invoke<string>("restore_backup", { backupName });

      await writeLog("success", `Восстановлена резервная копия: ${backupName}`);
      showNotification("Восстановление завершено");

      await loadBackups();

      if (backupStatus) {
        backupStatus.textContent = result;
      }
    } catch (error) {
      console.error("Ошибка восстановления:", error);
      await writeLog(
        "error",
        `Ошибка восстановления копии ${backupName}: ${error}`
      );

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
    if (!(deleteButton instanceof HTMLButtonElement) || !backupSelect?.value) {
      return;
    }

    const backupName = backupSelect.value;

    const confirmed = window.confirm(
      `Удалить резервную копию ${backupName}?\n\nЭто действие нельзя отменить.`
    );

    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteButton.textContent = "Удаление...";

    try {
      await invoke<string>("delete_backup", { backupName });

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

  // ───────────────────────── Журнал событий ─────────────────────────

  interface LogEntry {
    id: number;
    timestamp: number;
    category: string;
    message: string;
  }

  const logsList = document.getElementById("logs-list");
  const logsEmpty = document.getElementById("logs-empty");
  const logsFilter = document.getElementById(
    "logs-filter"
  ) as HTMLSelectElement | null;

  let isLoadingLogs = false;

  const refreshLogsButton = document.getElementById(
    "refresh-logs"
  ) as HTMLButtonElement | null;

  const clearLogsButton = document.getElementById(
    "clear-logs"
  ) as HTMLButtonElement | null;

  async function loadLogs() {
    if (!logsList || isLoadingLogs || isClearingLogs) return;

    isLoadingLogs = true;

    if (refreshLogsButton) {
      refreshLogsButton.disabled = true;
      refreshLogsButton.textContent = "Обновление...";
    }

    if (clearLogsButton) {
      clearLogsButton.disabled = true;
    }

    try {
      const entries = await invoke<LogEntry[]>("get_event_log");
      const selectedFilter = logsFilter?.value ?? "all";

      const filteredEntries = entries.filter(
        entry => selectedFilter === "all" || entry.category === selectedFilter
      );

      logsList.replaceChildren();

      if (filteredEntries.length === 0) {
        logsList.style.display = "none";

        if (logsEmpty) {
          logsEmpty.textContent =
            entries.length === 0
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

        const time = document.createElement("div");
        time.className = "log-time";
        time.textContent = new Date(entry.timestamp * 1000).toLocaleString(
          "ru-RU"
        );

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
    } finally {
      isLoadingLogs = false;

      if (refreshLogsButton) {
        refreshLogsButton.disabled = false;
        refreshLogsButton.textContent = "Обновить";
      }

      if (clearLogsButton) {
        clearLogsButton.disabled = false;
      }
    }
  }

  refreshLogsButton?.addEventListener("click", () => {
    void loadLogs();
  });

  logsFilter?.addEventListener("change", () => {
    void loadLogs();
  });

  let isClearingLogs = false;

  clearLogsButton?.addEventListener("click", async () => {
    if (isClearingLogs || isLoadingLogs) return;

    if (!window.confirm("Очистить весь журнал событий?")) {
      return;
    }

    isClearingLogs = true;

    clearLogsButton.disabled = true;

    if (refreshLogsButton) {
      refreshLogsButton.disabled = true;
    }

    let cleared = false;

    try {
      await invoke("clear_event_log");

      cleared = true;
      showNotification("Журнал событий очищен");
    } catch (error) {
      console.error("Ошибка очистки журнала:", error);
      showNotification(`Не удалось очистить журнал: ${error}`, true);
    } finally {
      isClearingLogs = false;

      clearLogsButton.disabled = false;

      if (refreshLogsButton) {
        refreshLogsButton.disabled = false;
      }
    }

    if (cleared) {
      await loadLogs();
    }
  });

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
        .join("\r\n");

      const content = "\uFEFFЖУРНАЛ СОБЫТИЙ ZAPRET CONTROL\r\n\r\n" + lines;

      const path = await save({
        title: "Экспорт журнала",
        defaultPath: `zapret-log-${new Date().toISOString().slice(0, 10)}.txt`,
        filters: [{ name: "Текстовый файл", extensions: ["txt"] }],
      });

      if (!path) return;

      await invoke("write_text_file", { path, content });

      showNotification("Журнал сохранён");
    } catch (error) {
      console.error("Ошибка экспорта журнала:", error);
      showNotification(`Не удалось экспортировать журнал: ${error}`, true);
    }
  }

  document.getElementById("export-logs")?.addEventListener("click", () => {
    void exportLogs();
  });


  // ───────────────────────── Обновления Flowseal ─────────────────────────

  const updateButton = document.getElementById("check-updates");
  const updateVersion = document.getElementById("update-version");
  const updateDescription = document.getElementById("update-description");
  const updateBadge = document.getElementById("update-badge");
  const latestVersion = document.getElementById("latest-version");
  const toggleNotes = document.getElementById("toggle-notes");
  const updateNotes = document.getElementById("update-notes");

  const appUpdateButton = document.getElementById("check-app-updates");

  appUpdateButton?.addEventListener("click", async () => {
    if (!(appUpdateButton instanceof HTMLButtonElement)) return;

    if (appReleaseUrl) {
      try {
        await openUrl(appReleaseUrl);
      } catch (error) {
        console.error("Не удалось открыть релиз:", error);
        showNotification("Не удалось открыть GitHub", true);
      }
      return;
    }

    appUpdateButton.disabled = true;
    appUpdateButton.textContent = "Проверка...";

    try {
      if (!installedAppVersion) {
        await loadAppVersion();
      }

      if (!installedAppVersion) {
        throw new Error(
          "Не удалось определить установленную версию приложения"
        );
      }

      const release = await invoke<{
        version: string;
        name: string;
        url: string;
        notes: string;
        published_at: string | null;
      }>("check_app_updates");

      if (!release.url) {
        throw new Error("GitHub не вернул ссылку на релиз");
      }

      appReleaseUrl = release.url;

      const version = release.version.replace(/^v/i, "");
      const comparison = compareVersions(installedAppVersion, version);

      const title = document.getElementById("app-update-title");
      const description = document.getElementById("app-update-description");
      const latest = document.getElementById("app-latest-version");
      const badge = document.getElementById("app-update-badge");
      const notes = document.getElementById("app-update-notes");
      const notesButton = document.getElementById("toggle-app-notes");

      if (title) {
        title.textContent = release.name || `Zapret Control ${release.version}`;
      }

      if (latest) {
        latest.textContent = `Последняя версия: ${release.version}`;
      }

      if (badge) {
        badge.hidden = comparison >= 0;
      }

      if (description) {
        if (comparison < 0) {
          description.textContent =
            `Установлена версия ${installedAppVersion}. Доступно обновление!`;
        } else if (comparison === 0) {
          description.textContent =
            `Установлена последняя версия ${installedAppVersion}`;
        } else {
          description.textContent =
            `Установленная версия ${installedAppVersion} новее найденной`;
        }
      }

      if (notes) {
        notes.innerHTML = formatReleaseNotes(
          release.notes || "Описание изменений отсутствует."
        );
        notes.hidden = true;
      }

      if (notesButton) {
        notesButton.hidden = false;
        notesButton.textContent = `Что нового в версии ${release.version}`;
      }

      appUpdateButton.textContent = "Открыть релиз";
      appUpdateButton.disabled = false;
      appUpdateButton.title = `Открыть релиз ${release.version} на GitHub`;

      await writeLog(
        "success",
        `Проверка обновлений Zapret Control завершена: ${release.version}`
      );

    } catch (error) {
      console.error("Ошибка проверки обновлений приложения:", error);

      const title = document.getElementById("app-update-title");
      const description = document.getElementById("app-update-description");
      const badge = document.getElementById("app-update-badge");

      if (title) {
        title.textContent = "Ошибка проверки";
      }

      if (description) {
        description.textContent = String(error);
      }

      if (badge) {
        badge.hidden = true;
      }

      await writeLog(
        "error",
        `Ошибка проверки обновлений приложения: ${error}`
      );

      appUpdateButton.textContent = "Повторить проверку";
      appUpdateButton.disabled = false;
    }
  });
  let releaseUrl: string | null = null;
  let installedVersion: string | null = null;

  async function loadInstalledVersion() {
    const versionElement = document.getElementById(
      "settings-flowseal-version"
    );

    try {
      const version = await invoke<string>("get_installed_version");

      installedVersion = version;

      if (updateDescription) {
        updateDescription.textContent = `Установленная версия: ${version}`;
        updateDescription.title = "";
      }

      if (versionElement) {
        versionElement.textContent = version;
        versionElement.title = "";
      }
    } catch (error) {
      console.warn("Ошибка определения версии Flowseal:", error);

      installedVersion = null;

      if (updateDescription) {
        updateDescription.textContent =
          "Не удалось определить установленную версию";
        updateDescription.title = String(error);
      }

      if (versionElement) {
        versionElement.textContent = "Не определена";
        versionElement.title = String(error);
      }
    }
  }

  function parseVersion(version: string): number[] {
    const match = version.match(/\d+(?:\.\d+)*/);

    return match ? match[0].split(".").map(Number) : [];
  }

  function compareVersions(installed: string, latest: string): number {
    const a = parseVersion(installed);
    const b = parseVersion(latest);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const partA = a[i] ?? 0;
      const partB = b[i] ?? 0;

      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }

    return 0;
  }

  function formatReleaseNotes(html: string): string {
    const parsed = new DOMParser().parseFromString(html, "text/html");

    const allowedTags = new Set([
      "UL", "OL", "LI", "P", "H2", "H3", "H4",
      "STRONG", "EM", "A", "CODE", "BLOCKQUOTE", "HR", "BR",
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
  }

  void loadAppVersion();

  // Ссылки из описания релиза открываем во внешнем браузере.
  updateNotes?.addEventListener("click", event => {
    const link = (event.target as HTMLElement).closest("a");

    if (!link) return;

    event.preventDefault();

    const href = link.getAttribute("href");

    if (href) {
      void openUrl(href).catch(error => {
        console.error("Не удалось открыть ссылку:", error);
        showNotification("Не удалось открыть ссылку", true);
      });
    }
  });

  const appUpdateNotes = document.getElementById("app-update-notes");

  appUpdateNotes?.addEventListener("click", event => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const link = target.closest("a");

    if (!link) return;

    event.preventDefault();

    const href = link.getAttribute("href");

    if (!href) return;

    try {
      const url = new URL(href);

      if (url.protocol !== "https:") {
        return;
      }

      void openUrl(url.href).catch(error => {
        console.error("Не удалось открыть ссылку:", error);
        showNotification("Не удалось открыть ссылку", true);
      });
    } catch (error) {
      console.error("Некорректная ссылка:", error);
    }
  });

  toggleNotes?.addEventListener("click", () => {
    if (!updateNotes) return;

    const wasHidden = updateNotes.hidden;

    updateNotes.hidden = !wasHidden;
    toggleNotes.textContent = wasHidden
      ? "Скрыть изменения"
      : "Что нового в версии";
  });

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

      if (!installedVersion) {
        await loadInstalledVersion();
      }

      if (updateVersion) {
        updateVersion.textContent = release.name;
      }

      if (latestVersion) {
        latestVersion.textContent = `Последняя версия: ${release.version}`;
      }

      if (updateDescription) {
        if (!installedVersion) {
          updateDescription.textContent =
            "Не удалось определить установленную версию";
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
      }

      updateButton.textContent = "Открыть релиз";
      updateButton.removeAttribute("disabled");
      updateButton.title = `Открыть релиз ${release.version} на GitHub`;
    } catch (error) {
      await writeLog("error", `Ошибка проверки обновлений: ${error}`);

      if (updateVersion) {
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

  // ───────────────────────── Запуск ─────────────────────────

  showPage("home");

  void loadInstalledVersion();

  // Статус служб проверяется каждые 5 секунд (команда асинхронная и лёгкая).
  window.setInterval(() => {
    void loadZapretStatus();
  }, 5000);
}