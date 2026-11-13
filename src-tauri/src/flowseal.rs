
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, serde::Serialize)]
pub struct FlowsealInfo {
    pub path: String,
    pub exists: bool,
    pub lists_exists: bool,
    pub bin_exists: bool,
    pub utils_exists: bool,
    pub service_exists: bool,
}

fn is_valid_flowseal_dir(path: &Path) -> bool {
    path.is_dir()
        && path.join("service.bat").is_file()
        && path.join("bin").is_dir()
        && path.join("lists").is_dir()
        && path.join("utils").is_dir()
}

fn get_saved_path(app: &AppHandle) -> Option<PathBuf> {
    let app_data = app.path().app_data_dir().ok()?;
    let saved_file = app_data.join("flowseal-path.txt");

    let saved_path = fs::read_to_string(saved_file).ok()?;
    let path = PathBuf::from(saved_path.trim());

    if is_valid_flowseal_dir(&path) {
        Some(path)
    } else {
        None
    }
}

fn find_flowseal_dir() -> Option<PathBuf> {
    let mut candidates = vec![
        PathBuf::from(r"C:\zapret-discord-youtube-1.10.3"),
    ];

    if let Some(profile) = std::env::var_os("USERPROFILE") {
        let user = PathBuf::from(profile);

        candidates.push(user.join("zapret-discord-youtube"));
        candidates.push(user.join("Desktop").join("zapret-discord-youtube"));
        candidates.push(user.join("Downloads").join("zapret-discord-youtube"));
    }

    for drive in ["C:", "D:", "E:"] {
        candidates.push(
            PathBuf::from(drive).join("zapret-discord-youtube"),
        );
    }

    candidates.into_iter().find(|path| is_valid_flowseal_dir(path))
}

pub fn get_flowseal_info(app: &AppHandle) -> FlowsealInfo {
    let path = get_saved_path(app).or_else(find_flowseal_dir);
    let flowseal = path.unwrap_or_default();

    FlowsealInfo {
        path: flowseal.to_string_lossy().to_string(),
        exists: is_valid_flowseal_dir(&flowseal),
        lists_exists: flowseal.join("lists").is_dir(),
        bin_exists: flowseal.join("bin").is_dir(),
        utils_exists: flowseal.join("utils").is_dir(),
        service_exists: flowseal.join("service.bat").is_file(),
    }
}

#[tauri::command]
pub fn set_flowseal_path(
    app: AppHandle,
    path: String,
) -> Result<FlowsealInfo, String> {
    let selected_path = PathBuf::from(path);

    if !is_valid_flowseal_dir(&selected_path) {
        return Err(
            "Выбранная папка не похожа на папку Flowseal. Проверь наличие service.bat, bin, lists и utils."
                .to_string(),
        );
    }

    let canonical_path = selected_path
        .canonicalize()
        .map_err(|e| format!("Не удалось проверить путь: {e}"))?;

    let app_data = app.path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось определить AppData: {e}"))?;

    fs::create_dir_all(&app_data)
        .map_err(|e| format!("Не удалось создать папку настроек: {e}"))?;

    fs::write(
        app_data.join("flowseal-path.txt"),
        canonical_path.to_string_lossy().as_bytes(),
    )
    .map_err(|e| format!("Не удалось сохранить путь: {e}"))?;

    Ok(get_flowseal_info(&app))
}
