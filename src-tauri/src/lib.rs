use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use tauri::Manager;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

mod flowseal;

/// Не показывать консольное окно дочернего процесса (важно для release-сборки).
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn hidden_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

/// Выполняет тяжёлую синхронную работу в фоновом потоке,
/// чтобы не блокировать интерфейс.
async fn run_blocking<T, F>(f: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| format!("Ошибка фонового потока: {e}"))?
}

// ───────────────────────────── Типы ─────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LogEntry {
    id: u64,
    timestamp: u64,
    category: String,
    message: String,
}

#[derive(Debug, Deserialize)]
struct Feed {
    #[serde(default)]
    entry: Vec<FeedEntry>,
}

#[derive(Debug, Deserialize)]
struct FeedEntry {
    title: String,
    link: FeedLink,
    updated: String,
    content: Option<FeedContent>,
}

#[derive(Debug, Deserialize)]
struct FeedLink {
    #[serde(rename = "@href")]
    href: String,
}

#[derive(Debug, Deserialize)]
struct FeedContent {
    #[serde(rename = "$text")]
    text: Option<String>,
}

#[derive(Debug, Serialize)]
struct ReleaseInfo {
    version: String,
    name: String,
    url: String,
    notes: String,
    published_at: Option<String>,
}

#[derive(Debug, Serialize)]
struct ZapretStatus {
    zapret: bool,
    windivert: bool,
}

#[derive(Debug, Serialize)]
struct BackupInfo {
    name: String,
    path: String,
    size_bytes: u64,
    file_count: usize,
}

#[derive(Debug, Serialize)]
struct StrategyInfo {
    current: Option<String>,
    available: Vec<String>,
}

#[derive(Debug, Serialize)]
struct AppInfo {
    flowseal_path: String,
    lists_exists: bool,
    bin_exists: bool,
    utils_exists: bool,
    backups_path: String,
    backups_exists: bool,
    flowseal_exists: bool,
    app_version: String,
}

// ───────────────────────── Вспомогательные функции ─────────────────────────

fn flowseal_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let info = flowseal::get_flowseal_info(app);

    if !info.exists {
        return Err(
            "Папка Flowseal не найдена. Укажи её расположение в настройках.".to_string(),
        );
    }

    Ok(PathBuf::from(info.path))
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))
}

fn backups_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("Backups"))
}

fn validate_backup_name(name: &str) -> Result<(), String> {
    let path = Path::new(name);

    if !name.starts_with("backup-")
        || path.components().count() != 1
        || !matches!(path.components().next(), Some(Component::Normal(_)))
    {
        return Err("Некорректное имя резервной копии".to_string());
    }

    Ok(())
}

fn copy_dir_all(source: &Path, destination: &Path) -> Result<(), String> {
    fs::create_dir_all(destination).map_err(|e| format!("Не удалось создать папку: {e}"))?;

    for entry in fs::read_dir(source).map_err(|e| format!("Не удалось прочитать папку: {e}"))? {
        let entry = entry.map_err(|e| e.to_string())?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        let file_type = entry.file_type().map_err(|e| e.to_string())?;

        if file_type.is_dir() {
            copy_dir_all(&source_path, &destination_path)?;
        } else if file_type.is_file() {
            fs::copy(&source_path, &destination_path)
                .map_err(|e| format!("Ошибка копирования файла: {e}"))?;
        } else {
            return Err(format!(
                "Неподдерживаемый тип файла: {}",
                source_path.display()
            ));
        }
    }

    Ok(())
}


fn calculate_backup_stats(path: &Path) -> Result<(u64, usize), String> {
    let mut total_size: u64 = 0;
    let mut file_count: usize = 0;

    for entry in fs::read_dir(path)
        .map_err(|e| format!("Не удалось прочитать папку резервной копии: {e}"))?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();

        let metadata = fs::symlink_metadata(&entry_path)
            .map_err(|e| format!("Не удалось получить информацию о файле: {e}"))?;

        let file_type = metadata.file_type();

        if file_type.is_dir() {
            let (size, count) = calculate_backup_stats(&entry_path)?;

            total_size = total_size
                .checked_add(size)
                .ok_or_else(|| "Переполнение счётчика размера резервной копии".to_string())?;

            file_count = file_count
                .checked_add(count)
                .ok_or_else(|| "Переполнение счётчика файлов резервной копии".to_string())?;

        } else if file_type.is_file() {
            total_size = total_size
                .checked_add(metadata.len())
                .ok_or_else(|| "Переполнение счётчика размера резервной копии".to_string())?;

            file_count = file_count
                .checked_add(1)
                .ok_or_else(|| "Переполнение счётчика файлов резервной копии".to_string())?;

        } else {
            return Err(format!(
                "Обнаружен неподдерживаемый тип объекта: {}",
                entry_path.display()
            ));
        }
    }

    Ok((total_size, file_count))
}


// ───────────────────────── Службы Windows ─────────────────────────

struct ServiceState {
    installed: bool,
    running: bool,
}

/// Состояние службы через sc.exe. Быстро, без PowerShell.
/// Код состояния 4 = RUNNING (не зависит от языка Windows).
fn query_service(name: &str) -> Result<ServiceState, String> {
    let output = hidden_command("sc.exe")
        .args(["query", name])
        .output()
        .map_err(|e| format!("Не удалось проверить службу {name}: {e}"))?;

    // 1060 — служба не установлена.
    if output.status.code() == Some(1060) {
        return Ok(ServiceState {
            installed: false,
            running: false,
        });
    }

    if !output.status.success() {
        return Ok(ServiceState {
            installed: true,
            running: false,
        });
    }

    let text = String::from_utf8_lossy(&output.stdout);

    let running = text.lines().any(|line| {
        line.split_once(':')
            .is_some_and(|(_, rest)| rest.split_whitespace().next() == Some("4"))
    });

    Ok(ServiceState {
        installed: true,
        running,
    })
}

fn query_zapret_status() -> Result<ZapretStatus, String> {
    let zapret = query_service("zapret")?;
    let windivert = query_service("WinDivert")?;

    Ok(ZapretStatus {
        zapret: zapret.running,
        windivert: windivert.running,
    })
}

const TOGGLE_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
try {
    $action = '__ACTION__'
    $target = if ($action -eq 'start') { 'Running' } else { 'Stopped' }
    $service = Get-Service -Name 'zapret' -ErrorAction Stop

    if ($service.Status.ToString() -ne $target) {
        $sc = Join-Path $env:WINDIR 'System32\sc.exe'
        $process = Start-Process -FilePath $sc -ArgumentList @($action, 'zapret') -Verb RunAs -WindowStyle Hidden -PassThru

        if (-not $process.WaitForExit(60000)) {
            throw 'Время ожидания подтверждения прав администратора истекло'
        }

        # 1056 — уже запущена, 1062 — уже остановлена
        $code = $process.ExitCode
        if ($code -ne 0 -and $code -ne 1056 -and $code -ne 1062) {
            throw "sc.exe завершился с кодом $code"
        }
    }

    $deadline = (Get-Date).AddSeconds(15)
    do {
        $service = Get-Service -Name 'zapret' -ErrorAction Stop
        if ($service.Status.ToString() -eq $target) { exit 0 }
        Start-Sleep -Milliseconds 300
    } while ((Get-Date) -lt $deadline)

    throw "Служба не перешла в состояние $target"
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
"#;

fn set_zapret_enabled_blocking(enabled: bool) -> Result<ZapretStatus, String> {
    let state = query_service("zapret")?;

    if !state.installed {
        return Err(
            "Служба zapret не установлена. Установи её через service.bat (Install Service) в папке Flowseal."
                .to_string(),
        );
    }

    let action = if enabled { "start" } else { "stop" };
    let script = TOGGLE_SCRIPT.replace("__ACTION__", action);

    let output = hidden_command("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("Не удалось запустить управление Zapret: {e}"))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Не удалось изменить состояние Zapret: {}",
            error.trim()
        ));
    }

    query_zapret_status()
}

// ───────────────────────── Команды: обновления ─────────────────────────

#[tauri::command]
async fn check_for_updates() -> Result<ReleaseInfo, String> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(5))
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Не удалось создать HTTP-клиент: {e}"))?;

    let response = client
        .get("https://github.com/Flowseal/zapret-discord-youtube/releases.atom")
        .header("User-Agent", "ZapretControl")
        .send()
        .await
        .map_err(|e| format!("Не удалось подключиться к GitHub: {e}"))?
        .error_for_status()
        .map_err(|e| format!("GitHub вернул ошибку: {e}"))?;

    let xml = response
        .text()
        .await
        .map_err(|e| format!("Не удалось прочитать ответ GitHub: {e}"))?;

    let feed: Feed = quick_xml::de::from_str(&xml)
        .map_err(|e| format!("Не удалось разобрать список релизов: {e}"))?;

    let release = feed
        .entry
        .into_iter()
        .next()
        .ok_or_else(|| "GitHub не вернул ни одного релиза".to_string())?;

    let title = release.title.trim().to_string();

    Ok(ReleaseInfo {
        version: title.clone(),
        name: title,
        url: release.link.href,
        notes: release
            .content
            .and_then(|content| content.text)
            .unwrap_or_else(|| "Описание изменений отсутствует".to_string()),
        published_at: Some(release.updated),
    })
}

#[tauri::command]
async fn check_app_updates() -> Result<ReleaseInfo, String> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(5))
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Не удалось создать HTTP-клиент: {e}"))?;

    let response = client
        .get("https://github.com/tvoyk4nt/zapret-control/releases.atom")
        .header("User-Agent", "ZapretControl")
        .send()
        .await
        .map_err(|e| format!("Не удалось подключиться к GitHub: {e}"))?
        .error_for_status()
        .map_err(|e| format!("GitHub вернул ошибку: {e}"))?;

    let xml = response
        .text()
        .await
        .map_err(|e| format!("Не удалось прочитать ответ GitHub: {e}"))?;

    let feed: Feed = quick_xml::de::from_str(&xml)
        .map_err(|e| format!("Не удалось разобрать список релизов: {e}"))?;

    let release = feed
        .entry
        .into_iter()
        .next()
        .ok_or_else(|| "GitHub не вернул ни одного релиза".to_string())?;

    let title = release.title.trim().to_string();

    Ok(ReleaseInfo {
        version: title.clone(),
        name: title,
        url: release.link.href,
        notes: release
            .content
            .and_then(|content| content.text)
            .unwrap_or_else(|| "Описание изменений отсутствует".to_string()),
        published_at: Some(release.updated),
    })
}

#[tauri::command]
async fn get_installed_version(app: tauri::AppHandle) -> Result<String, String> {
    run_blocking(move || {
        let dir = flowseal_dir(&app)?;
        let service_path = dir.join("service.bat");

        if !service_path.is_file() {
            return Err("Файл service.bat отсутствует в папке Flowseal".to_string());
        }

        let content = fs::read_to_string(&service_path)
            .map_err(|e| format!("Не удалось прочитать service.bat: {e}"))?;

        for line in content.lines() {
            let line = line.trim();

            if let Some(value) = line.strip_prefix("set \"LOCAL_VERSION=") {
                let version = value.trim_end_matches('"').trim().to_string();

                if version.is_empty() {
                    return Err("Версия Flowseal в service.bat пустая".to_string());
                }

                return Ok(version);
            }
        }

        Err("Не удалось найти LOCAL_VERSION в service.bat".to_string())
    })
    .await
}

// ───────────────────────── Команды: Zapret ─────────────────────────

#[tauri::command]
async fn get_zapret_status() -> Result<ZapretStatus, String> {
    run_blocking(query_zapret_status).await
}

#[tauri::command]
async fn set_zapret_enabled(enabled: bool) -> Result<ZapretStatus, String> {
    run_blocking(move || set_zapret_enabled_blocking(enabled)).await
}

// ───────────────────────── Команды: резервные копии ─────────────────────────

fn create_backup_impl(app: &tauri::AppHandle) -> Result<String, String> {
    let source = flowseal_dir(app)?.join("lists");

    if !source.is_dir() {
        return Err("Папка lists не найдена".to_string());
    }

    let backups = backups_dir(app)?;

    fs::create_dir_all(&backups)
        .map_err(|e| format!("Не удалось создать папку Backups: {e}"))?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let mut backup_path = backups.join(format!("backup-{timestamp}"));
    let mut counter = 1;

    while backup_path.exists() {
        backup_path = backups.join(format!("backup-{timestamp}-{counter}"));
        counter += 1;
    }

    let destination = backup_path.join("lists");

    if let Err(error) = copy_dir_all(&source, &destination) {
        let _ = fs::remove_dir_all(&backup_path);
        return Err(format!("Не удалось создать резервную копию: {error}"));
    }

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn create_backup(app: tauri::AppHandle) -> Result<String, String> {
    run_blocking(move || create_backup_impl(&app)).await
}

#[tauri::command]
async fn list_backups(app: tauri::AppHandle) -> Result<Vec<BackupInfo>, String> {
    run_blocking(move || {
        let backups_path = backups_dir(&app)?;

        if !backups_path.exists() {
            return Ok(Vec::new());
        }

        let mut backups = Vec::new();

        for entry in fs::read_dir(&backups_path)
            .map_err(|e| format!("Не удалось прочитать папку Backups: {e}"))?
        {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();

            if !name.starts_with("backup-") {
                continue;
            }

            let metadata = fs::symlink_metadata(&path).map_err(|e| e.to_string())?;

            if !metadata.file_type().is_dir() {
    continue;
}

let lists_path = path.join("lists");

let lists_metadata = match fs::symlink_metadata(&lists_path) {
    Ok(metadata) => metadata,
    Err(_) => continue,
};

if !lists_metadata.file_type().is_dir() {
    continue;
}

            let (size_bytes, file_count) = calculate_backup_stats(&path)?;

            backups.push(BackupInfo {
                name,
                path: path.to_string_lossy().to_string(),
                size_bytes,
                file_count,
            });
        }

        backups.sort_by(|a, b| b.name.cmp(&a.name));

        Ok(backups)
    })
    .await
}

#[tauri::command]
async fn restore_backup(app: tauri::AppHandle, backup_name: String) -> Result<String, String> {
    run_blocking(move || {
        if query_zapret_status()?.zapret {
            return Err(
                "Сначала выключи Zapret на главном экране приложения, затем повтори восстановление."
                    .to_string(),
            );
        }

        validate_backup_name(&backup_name)?;

        let backup_lists = backups_dir(&app)?.join(&backup_name).join("lists");

        let backup_metadata = fs::symlink_metadata(&backup_lists)
            .map_err(|_| "В резервной копии не найдена папка lists".to_string())?;

        if !backup_metadata.file_type().is_dir() {
            return Err("Папка lists в резервной копии некорректна".to_string());
        }

        let source = flowseal_dir(&app)?.join("lists");

        if !source.is_dir() {
            return Err("Текущая папка lists не найдена".to_string());
        }

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos();

        // Новая папка готовится рядом с оригинальной.
        let temporary = source.with_file_name(format!("lists-restore-temp-{timestamp}"));
        let previous = source.with_file_name(format!("lists-before-restore-{timestamp}"));

        if let Err(e) = copy_dir_all(&backup_lists, &temporary) {
            let _ = fs::remove_dir_all(&temporary);
            return Err(format!("Не удалось подготовить восстановление: {e}"));
        }

        // Страховочная копия текущего состояния.
        if let Err(error) = create_backup_impl(&app) {
            let _ = fs::remove_dir_all(&temporary);
            return Err(format!(
                "Не удалось создать страховочную копию. Восстановление отменено: {error}"
            ));
        }

        if let Err(error) = fs::rename(&source, &previous) {
            let _ = fs::remove_dir_all(&temporary);
            return Err(format!(
                "Не удалось подготовить замену папки lists: {error}"
            ));
        }

        if let Err(error) = fs::rename(&temporary, &source) {
            let rollback = fs::rename(&previous, &source);
            let _ = fs::remove_dir_all(&temporary);

            return match rollback {
                Ok(()) => Err(format!(
                    "Не удалось восстановить копию. Исходные файлы возвращены на место: {error}"
                )),
                Err(rollback_error) => Err(format!(
                    "Критическая ошибка замены: {error}. \
                     Не удалось автоматически вернуть исходную папку: {rollback_error}. \
                     Исходная папка сохранена здесь: {}",
                    previous.display()
                )),
            };
        }

        if let Err(error) = fs::remove_dir_all(&previous) {
            return Ok(format!(
                "Списки восстановлены. Старую папку не удалось удалить: {} ({error})",
                previous.display()
            ));
        }

        Ok(format!(
            "Резервная копия {backup_name} успешно восстановлена"
        ))
    })
    .await
}

#[tauri::command]
async fn delete_backup(app: tauri::AppHandle, backup_name: String) -> Result<String, String> {
    run_blocking(move || {
        validate_backup_name(&backup_name)?;

        let backup_path = backups_dir(&app)?.join(&backup_name);

        let metadata = fs::symlink_metadata(&backup_path)
            .map_err(|_| "Резервная копия не найдена".to_string())?;

        if !metadata.file_type().is_dir() {
            return Err("Указанная резервная копия некорректна".to_string());
        }

        let lists_metadata = fs::symlink_metadata(backup_path.join("lists"))
            .map_err(|_| "В резервной копии не найдена папка lists".to_string())?;

        if !lists_metadata.file_type().is_dir() {
            return Err("Папка lists в резервной копии некорректна".to_string());
        }

        fs::remove_dir_all(&backup_path)
            .map_err(|e| format!("Не удалось удалить резервную копию: {e}"))?;

        Ok(format!("Резервная копия {backup_name} удалена"))
    })
    .await
}

// ───────────────────────── Команды: стратегии и настройки ─────────────────────────

/// Текущая стратегия хранится service.bat в реестре.
/// Читаем через reg.exe: быстро и без окон.
fn read_current_strategy() -> Option<String> {
    let output = hidden_command("reg.exe")
        .args([
            "query",
            r"HKLM\SYSTEM\CurrentControlSet\Services\zapret",
            "/v",
            "zapret-discord-youtube",
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8_lossy(&output.stdout);

    for line in text.lines() {
        if let Some((_, value)) = line.split_once("REG_SZ") {
            let value = value.trim();

            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }

    None
}

#[tauri::command]
async fn get_strategies(app: tauri::AppHandle) -> Result<StrategyInfo, String> {
    run_blocking(move || {
        let dir = flowseal_dir(&app)?;
        let mut available = Vec::new();

        for entry in
            fs::read_dir(&dir).map_err(|e| format!("Ошибка чтения папки Flowseal: {e}"))?
        {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            let is_bat = path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("bat"));

            let name = entry.file_name().to_string_lossy().to_string();

            if is_bat && !name.to_lowercase().starts_with("service") {
                available.push(name);
            }
        }

        available.sort_by_key(|name| name.to_lowercase());

        Ok(StrategyInfo {
            current: read_current_strategy(),
            available,
        })
    })
    .await
}

#[tauri::command]
fn get_app_info(app: tauri::AppHandle) -> Result<AppInfo, String> {
    let app_version = app.package_info().version.to_string();
    let flowseal_info = flowseal::get_flowseal_info(&app);
    let backups = backups_dir(&app)?;

    Ok(AppInfo {
        app_version,
        flowseal_path: flowseal_info.path,
        lists_exists: flowseal_info.lists_exists,
        bin_exists: flowseal_info.bin_exists,
        utils_exists: flowseal_info.utils_exists,
        backups_path: backups.to_string_lossy().to_string(),
        backups_exists: backups.is_dir(),
        flowseal_exists: flowseal_info.exists,
    })
}

/// Открытие известных папок в проводнике (без настройки scope у плагина opener).
#[tauri::command]
fn open_folder(app: tauri::AppHandle, target: String) -> Result<(), String> {
    let path = match target.as_str() {
        "flowseal" => PathBuf::from(flowseal::get_flowseal_info(&app).path),
        "backups" => backups_dir(&app)?,
        _ => return Err("Неизвестная папка".to_string()),
    };

    if !path.is_dir() {
        return Err(format!("Папка не найдена: {}", path.display()));
    }

    Command::new("explorer.exe")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Не удалось открыть папку: {e}"))?;

    Ok(())
}

/// Сохранение текстового файла по пути, выбранному в диалоге «Сохранить как».
#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    let file_path = std::path::Path::new(&path);

    // Проверяем, что путь абсолютный
    if !file_path.is_absolute() {
        return Err("Необходимо указать абсолютный путь к файлу".into());
    }

    // Разрешаем только TXT
    let is_txt = file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("txt"))
        .unwrap_or(false);

    if !is_txt {
        return Err("Разрешено сохранять только TXT-файлы".into());
    }

    // Проверяем имя файла
    if file_path.file_name().is_none() {
        return Err("Некорректное имя файла".into());
    }

    // Проверяем существование папки назначения
    let parent = file_path
        .parent()
        .ok_or_else(|| "Не удалось определить папку назначения".to_string())?;

    if !parent.is_dir() {
        return Err("Папка назначения не существует".into());
    }

    // Ограничиваем размер экспорта
    const MAX_EXPORT_SIZE: usize = 10 * 1024 * 1024;

    if content.len() > MAX_EXPORT_SIZE {
        return Err("Размер экспортируемого файла превышает 10 МБ".into());
    }

    fs::write(file_path, content)
        .map_err(|e| format!("Не удалось сохранить файл: {e}"))
}

// ───────────────────────── Журнал событий ─────────────────────────

static EVENT_LOG_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

fn get_log_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_data_dir(app)?;

    fs::create_dir_all(&dir).map_err(|e| format!("Не удалось создать AppData: {e}"))?;

    Ok(dir.join("events.json"))
}

/// Читает журнал. Повреждённый файл не должен ломать приложение.
fn read_entries(path: &Path) -> Result<Vec<LogEntry>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path)
        .map_err(|e| format!("Не удалось прочитать журнал событий: {e}"))?;

    serde_json::from_str::<Vec<LogEntry>>(&content)
        .map_err(|e| format!("Файл журнала событий повреждён: {e}"))
}

#[tauri::command]
fn get_event_log(app: tauri::AppHandle) -> Result<Vec<LogEntry>, String> {
    let _guard = EVENT_LOG_LOCK
        .lock()
        .map_err(|e| format!("Не удалось получить доступ к журналу: {e}"))?;

    let path = get_log_path(&app)?;

    let mut entries = read_entries(&path)?;
    entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp).then(b.id.cmp(&a.id)));

    Ok(entries)
}

#[tauri::command]
fn add_event_log(app: tauri::AppHandle, category: String, message: String) -> Result<(), String> {
    let _guard = EVENT_LOG_LOCK
        .lock()
        .map_err(|e| format!("Не удалось получить доступ к журналу: {e}"))?;

    let path = get_log_path(&app)?;
    let mut entries = read_entries(&path)?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let id = entries
        .iter()
        .map(|entry| entry.id)
        .max()
        .unwrap_or(0)
        .saturating_add(1);

    entries.push(LogEntry {
        id,
        timestamp,
        category,
        message,
    });

    if entries.len() > 1000 {
        let excess = entries.len() - 1000;
        entries.drain(0..excess);
    }

    let content = serde_json::to_string_pretty(&entries)
        .map_err(|e| e.to_string())?;

    fs::write(&path, content)
        .map_err(|e| format!("Не удалось сохранить журнал: {e}"))?;

    Ok(())
}

#[tauri::command]
fn clear_event_log(app: tauri::AppHandle) -> Result<(), String> {
    let _guard = EVENT_LOG_LOCK
        .lock()
        .map_err(|e| format!("Не удалось получить доступ к журналу: {e}"))?;

    let path = get_log_path(&app)?;

    fs::write(&path, "[]").map_err(|e| format!("Не удалось очистить журнал: {e}"))?;

    Ok(())
}

// ───────────────────────── Запуск ─────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            check_for_updates,
            get_installed_version,
            get_zapret_status,
            set_zapret_enabled,
            create_backup,
            list_backups,
            restore_backup,
            delete_backup,
            get_strategies,
            get_app_info,
            open_folder,
            write_text_file,
            flowseal::set_flowseal_path,
            get_event_log,
            add_event_log,
            clear_event_log,
            check_app_updates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}