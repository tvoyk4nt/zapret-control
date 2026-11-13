use serde::{Deserialize, Serialize};
use tauri::Manager;

use std::fs;
use std::path::PathBuf;

const FLOWSEAL_DIR: &str = r"C:\zapret-discord-youtube-1.10.3";

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LogEntry {
    id: u64,
    timestamp: u64,
    category: String,
    message: String,
}

fn get_log_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    fs::create_dir_all(&app_data)
        .map_err(|e| format!("Не удалось создать AppData: {e}"))?;

    Ok(app_data.join("events.json"))
}

#[derive(Debug, Deserialize)]
struct Feed {
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
}

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
        .map_err(|e| format!("Не удалось подключиться к GitHub: {e}"))?;

    let response = response
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

    Ok(ReleaseInfo {
        version: release.title.clone(),
        name: release.title,
        url: release.link.href,
        notes: release
            .content
            .and_then(|content| content.text)
            .unwrap_or_else(|| "Описание изменений отсутствует".to_string()),
        published_at: Some(release.updated),
    })
}


#[tauri::command]
fn get_installed_version() -> Result<String, String> {
    let flowseal_dir = std::path::Path::new(FLOWSEAL_DIR);

    // Проверяем наличие основной папки
    if !flowseal_dir.is_dir() {
        return Err(format!(
            "Папка Flowseal не найдена: {}",
            FLOWSEAL_DIR
        ));
    }

    let service_path = flowseal_dir.join("service.bat");

    // Проверяем наличие service.bat
    if !service_path.is_file() {
        return Err(
            "Файл service.bat отсутствует в папке Flowseal".to_string()
        );
    }

    // Читаем файл
    let content = std::fs::read_to_string(&service_path)
        .map_err(|e| {
            format!("Не удалось прочитать service.bat: {e}")
        })?;

    // Ищем версию
    for line in content.lines() {
        let line = line.trim();

        if let Some(value) = line.strip_prefix("set \"LOCAL_VERSION=") {
            let version = value
                .trim_end_matches('"')
                .trim()
                .to_string();

            if !version.is_empty() {
                return Ok(version);
            }

            return Err(
                "Версия Flowseal в service.bat пустая".to_string()
            );
        }
    }

    Err("Не удалось найти LOCAL_VERSION в service.bat".to_string())
}


#[tauri::command]
fn get_zapret_status() -> Result<ZapretStatus, String> {
    let output = std::process::Command::new("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "$z = Get-Service -Name 'zapret' -ErrorAction SilentlyContinue; \
             $w = Get-Service -Name 'WinDivert' -ErrorAction SilentlyContinue; \
             '{0},{1}' -f [bool]($z -and $z.Status -eq 'Running'), \
             [bool]($w -and $w.Status -eq 'Running')"
        ])
        .output()
        .map_err(|e| format!("Не удалось проверить службы: {e}"))?;

    if !output.status.success() {
        return Err("Ошибка при проверке служб Windows".to_string());
    }

    let result = String::from_utf8_lossy(&output.stdout);
    let mut parts = result.trim().split(',');

    let zapret = parts.next() == Some("True");
    let windivert = parts.next() == Some("True");

    Ok(ZapretStatus {
        zapret,
        windivert,
    })
}


fn copy_dir_all(
    source: &std::path::Path,
    destination: &std::path::Path,
) -> Result<(), String> {
    std::fs::create_dir_all(destination)
        .map_err(|e| format!("Не удалось создать папку: {e}"))?;

    for entry in std::fs::read_dir(source)
        .map_err(|e| format!("Не удалось прочитать папку lists: {e}"))?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());

        let file_type = entry.file_type().map_err(|e| e.to_string())?;

        if file_type.is_dir() {
            copy_dir_all(&source_path, &destination_path)?;
        } else if file_type.is_file() {
            std::fs::copy(&source_path, &destination_path)
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

#[tauri::command]
fn create_backup(app: tauri::AppHandle) -> Result<String, String> {
    let source = std::path::Path::new(FLOWSEAL_DIR).join("lists");

    if !source.is_dir() {
        return Err("Папка lists не найдена".to_string());
    }

    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    let backups_dir = app_data.join("Backups");

    std::fs::create_dir_all(&backups_dir)
        .map_err(|e| format!("Не удалось создать папку Backups: {e}"))?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let mut backup_path = backups_dir.join(format!("backup-{timestamp}"));

    let mut counter = 1;

    while backup_path.exists() {
        backup_path = backups_dir.join(format!("backup-{timestamp}-{counter}"));
        counter += 1;
    }

    let destination = backup_path.join("lists");

    if let Err(error) = copy_dir_all(&source, &destination) {
        let _ = std::fs::remove_dir_all(&backup_path);
        return Err(format!("Не удалось создать резервную копию: {error}"));
    }

    Ok(backup_path.to_string_lossy().to_string())
}

fn calculate_backup_stats(path: &std::path::Path) -> Result<(u64, usize), String> {
    let mut total_size: u64 = 0;
    let mut file_count: usize = 0;

    for entry in std::fs::read_dir(path)
        .map_err(|e| format!("Не удалось прочитать папку: {e}"))?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();

        let metadata = std::fs::symlink_metadata(&entry_path)
            .map_err(|e| e.to_string())?;

        let file_type = metadata.file_type();

        if file_type.is_dir() {
            let (size, count) = calculate_backup_stats(&entry_path)?;
            total_size += size;
            file_count += count;
        } else if file_type.is_file() {
            total_size += metadata.len();
            file_count += 1;
        }
    }

    Ok((total_size, file_count))
}

#[tauri::command]
fn list_backups(app: tauri::AppHandle) -> Result<Vec<BackupInfo>, String> {
    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    let backups_dir = app_data.join("Backups");

    if !backups_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();

    for entry in std::fs::read_dir(&backups_dir)
        .map_err(|e| format!("Не удалось прочитать папку Backups: {e}"))?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if !name.starts_with("backup-") {
            continue;
        }

        let metadata = std::fs::symlink_metadata(&path)
            .map_err(|e| e.to_string())?;

        if !metadata.file_type().is_dir() || !path.join("lists").is_dir() {
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
}

#[tauri::command]
fn restore_backup(
    app: tauri::AppHandle,
    backup_name: String,
) -> Result<String, String> {
        let status = get_zapret_status()?;

    if status.zapret {
        return Err(
            "Сначала выключи Zapret на главном экране приложения, затем повтори восстановление."
                .to_string()
        );
    }

    use std::path::{Component, PathBuf};

    // Разрешаем только имя папки вида backup-...
    let backup_component = std::path::Path::new(&backup_name);

    if !backup_name.starts_with("backup-")
        || backup_component.components().count() != 1
        || !matches!(
            backup_component.components().next(),
            Some(Component::Normal(_))
        )
    {
        return Err("Некорректное имя резервной копии".to_string());
    }

    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    let backup_lists = app_data
        .join("Backups")
        .join(&backup_name)
        .join("lists");

    let backup_metadata = std::fs::symlink_metadata(&backup_lists)
        .map_err(|_| "В резервной копии не найдена папка lists".to_string())?;

    if !backup_metadata.file_type().is_dir() {
        return Err("Папка lists в резервной копии некорректна".to_string());
    }

    let source = PathBuf::from(FLOWSEAL_DIR).join("lists");

    if !source.is_dir() {
        return Err("Текущая папка lists не найдена".to_string());
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();

    // Сначала подготавливаем новую папку рядом с оригинальной.
    let temporary = source.with_file_name(format!("lists-restore-temp-{timestamp}"));
    let previous = source.with_file_name(format!("lists-before-restore-{timestamp}"));

    copy_dir_all(&backup_lists, &temporary)
        .map_err(|e| {
            let _ = std::fs::remove_dir_all(&temporary);
            format!("Не удалось подготовить восстановление: {e}")
        })?;

    // Перед заменой обязательно сохраняем текущее состояние.
    if let Err(error) = create_backup(app.clone()) {
        let _ = std::fs::remove_dir_all(&temporary);
        return Err(format!(
            "Не удалось создать страховочную копию. Восстановление отменено: {error}"
        ));
    }

    // Убираем текущую папку в сторону, затем ставим восстановленную.
    if let Err(error) = std::fs::rename(&source, &previous) {
        let _ = std::fs::remove_dir_all(&temporary);
        return Err(format!("Не удалось подготовить замену папки lists: {error}"));
    }

    if let Err(error) = std::fs::rename(&temporary, &source) {
        let rollback = std::fs::rename(&previous, &source);
        let _ = std::fs::remove_dir_all(&temporary);

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

    // Удаляем временно сохранённую старую папку.
    if let Err(error) = std::fs::remove_dir_all(&previous) {
        return Ok(format!(
            "Списки восстановлены. Старую папку не удалось удалить: {} ({error})",
            previous.display()
        ));
    }

    Ok(format!("Резервная копия {backup_name} успешно восстановлена"))
}

#[tauri::command]
fn delete_backup(
    app: tauri::AppHandle,
    backup_name: String,
) -> Result<String, String> {
    use std::path::Component;

    let backup_component = std::path::Path::new(&backup_name);

    if !backup_name.starts_with("backup-")
        || backup_component.components().count() != 1
        || !matches!(
            backup_component.components().next(),
            Some(Component::Normal(_))
        )
    {
        return Err("Некорректное имя резервной копии".to_string());
    }

    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    let backup_path = app_data
        .join("Backups")
        .join(&backup_name);

    let metadata = std::fs::symlink_metadata(&backup_path)
        .map_err(|_| "Резервная копия не найдена".to_string())?;

    if !metadata.file_type().is_dir() {
        return Err("Указанная резервная копия некорректна".to_string());
    }

    let lists_path = backup_path.join("lists");

    let lists_metadata = std::fs::symlink_metadata(&lists_path)
        .map_err(|_| "В резервной копии не найдена папка lists".to_string())?;

    if !lists_metadata.file_type().is_dir() {
        return Err("Папка lists в резервной копии некорректна".to_string());
    }

    std::fs::remove_dir_all(&backup_path)
        .map_err(|e| format!("Не удалось удалить резервную копию: {e}"))?;

    Ok(format!("Резервная копия {backup_name} удалена"))
}

#[tauri::command]
fn get_strategies() -> Result<StrategyInfo, String> {
    use std::process::Command;

    let zapret_dir = std::path::Path::new(FLOWSEAL_DIR);

    if !zapret_dir.is_dir() {
        return Err("Папка Flowseal не найдена".to_string());
    }

    // Получаем список доступных BAT-файлов.
    let mut available = Vec::new();

    for entry in std::fs::read_dir(zapret_dir)
        .map_err(|e| format!("Ошибка чтения папки Flowseal: {e}"))?
    {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        let is_bat = path.extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("bat"));

        let name = entry.file_name().to_string_lossy().to_string();

        if is_bat && !name.to_lowercase().starts_with("service") {
            available.push(name);
        }
    }

    available.sort_by_key(|name| name.to_lowercase());

    // Только читаем текущую стратегию из реестра.
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $v = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\zapret' -Name 'zapret-discord-youtube' -ErrorAction SilentlyContinue).'zapret-discord-youtube'; if ($v) { [Console]::Write($v) }"
        ])
        .output()
        .map_err(|e| format!("Не удалось прочитать реестр: {e}"))?;

    let current = if output.status.success() {
        let value = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    } else {
        None
    };

    Ok(StrategyInfo {
        current,
        available,
    })
}

#[tauri::command]
fn set_zapret_enabled(enabled: bool) -> Result<ZapretStatus, String> {
    let action = if enabled { "start" } else { "stop" };

    let script = format!(
        "$ErrorActionPreference = 'Stop'; \
         try {{ \
             $target = if ('{action}' -eq 'start') {{ 'Running' }} else {{ 'Stopped' }}; \
             $service = Get-Service -Name 'zapret' -ErrorAction Stop; \
             if ($service.Status.ToString() -ne $target) {{ \
                 $process = Start-Process -FilePath \"$env:WINDIR\\System32\\sc.exe\" \
                     -ArgumentList @('{action}', 'zapret') -Verb RunAs -Wait -PassThru; \
                 if ($process.ExitCode -ne 0) {{ throw \"sc.exe завершился с кодом $($process.ExitCode)\" }} \
             }} \
             $deadline = (Get-Date).AddSeconds(15); \
             do {{ \
                 $service = Get-Service -Name 'zapret' -ErrorAction Stop; \
                 if ($service.Status.ToString() -eq $target) {{ exit 0 }}; \
                 Start-Sleep -Milliseconds 300; \
             }} while ((Get-Date) -lt $deadline); \
             throw \"Служба не перешла в состояние $target\" \
         }} catch {{ [Console]::Error.WriteLine($_.Exception.Message); exit 1 }}"
    );

    let output = std::process::Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("Не удалось запустить управление Zapret: {e}"))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Не удалось изменить состояние Zapret: {error}"));
    }

    get_zapret_status()
}

#[tauri::command]
fn get_app_info(app: tauri::AppHandle) -> Result<AppInfo, String> {
    let flowseal = std::path::PathBuf::from(FLOWSEAL_DIR);

    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    let backups = app_data.join("Backups");

    Ok(AppInfo {
        flowseal_path: flowseal.to_string_lossy().to_string(),
        lists_exists: flowseal.join("lists").is_dir(),
        bin_exists: flowseal.join("bin").is_dir(),
        utils_exists: flowseal.join("utils").is_dir(),
        backups_path: backups.to_string_lossy().to_string(),
        backups_exists: backups.is_dir(),
        flowseal_exists: flowseal.is_dir(),
    })
}

static EVENT_LOG_LOCK: std::sync::Mutex<()> =
    std::sync::Mutex::new(());

#[tauri::command]
fn get_event_log(app: tauri::AppHandle) -> Result<Vec<LogEntry>, String> {
    let _guard = EVENT_LOG_LOCK
    .lock()
    .map_err(|e| format!("Не удалось получить доступ к журналу: {e}"))?;

    let path = get_log_path(&app)?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Не удалось прочитать журнал: {e}"))?;

    let mut entries: Vec<LogEntry> = serde_json::from_str(&content)
        .map_err(|e| format!("Ошибка формата журнала: {e}"))?;

    entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(entries)
}

#[tauri::command]
fn add_event_log(
    app: tauri::AppHandle,
    category: String,
    message: String,
) -> Result<(), String> {
    let _guard = EVENT_LOG_LOCK
    .lock()
    .map_err(|e| format!("Не удалось получить доступ к журналу: {e}"))?;

    let path = get_log_path(&app)?;

    let mut entries = if path.exists() {
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Не удалось прочитать журнал: {e}"))?;

        serde_json::from_str::<Vec<LogEntry>>(&content)
            .map_err(|e| format!("Ошибка формата журнала: {e}"))?
    } else {
        Vec::new()
    };

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let id = entries.iter()
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

    fs::write(&path, "[]")
        .map_err(|e| format!("Не удалось очистить журнал: {e}"))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            get_event_log,
            add_event_log,
            clear_event_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
