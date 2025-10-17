import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  nativeTheme,
  nativeImage
} from 'electron';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import type { SendPayload } from '../src/types/models';
import type { PersistedBundle } from '../src/bridge';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let naiWindow: BrowserWindow | null = null;

const getPreloadPath = (name: string) => path.join(__dirname, `${name}.js`);

const getAppUrl = () => {
  if (isDev) {
    return process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
  }
  return `file://${path.join(__dirname, '../renderer/index.html')}`;
};

const embeddedIcon = nativeImage.createFromDataURL(
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
);

const getErrorDetail = (error: unknown) => {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch (serializationError) {
    console.error('[main] Failed to serialise error detail', serializationError);
    return undefined;
  }
};

const logError = (message: string, error: unknown) => {
  const detail = getErrorDetail(error) ?? String(error);
  console.error(`[main] ${message}\n${detail}`);
};

const showErrorDialog = async (title: string, message: string, detail?: string) => {
  if (!app.isReady()) {
    return;
  }

  try {
    await dialog.showMessageBox({
      type: 'error',
      title,
      message,
      detail,
      buttons: ['OK']
    });
  } catch (dialogError) {
    console.error('[main] Failed to show error dialog', dialogError);
  }
};

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: getPreloadPath('preload-app'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: embeddedIcon
  });

  const url = getAppUrl();
  try {
    await mainWindow.loadURL(url);
  } catch (error) {
    logError('Failed to load main window URL', error);
    await showErrorDialog(
      'Unable to load application',
      'An unexpected error occurred while loading the application window.',
      getErrorDetail(error)
    );
  }
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' }).catch(() => undefined);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const createNovelAIWindow = async () => {
  if (naiWindow && !naiWindow.isDestroyed()) {
    return naiWindow;
  }

  naiWindow = new BrowserWindow({
    title: 'NovelAI',
    width: 1100,
    height: 900,
    webPreferences: {
      preload: getPreloadPath('preload-nai'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  try {
    await naiWindow.loadURL('https://novelai.net/image');
  } catch (error) {
    logError('Failed to load NovelAI window', error);
    await showErrorDialog(
      'NovelAI window failed to load',
      'The NovelAI window could not be loaded. Please check your internet connection or try again later.',
      getErrorDetail(error)
    );
  }
  naiWindow.on('closed', () => {
    naiWindow = null;
  });
  return naiWindow;
};

const dataRoot = path.join(app.getPath('userData'), 'storage');
const defaultDataDir = path.join(app.getAppPath(), 'src', 'data');

const ensureDir = async (dir: string) => {
  await fsPromises.mkdir(dir, { recursive: true });
};

const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    return fallback;
  }
};

const atomicWrite = async (filePath: string, data: unknown) => {
  await ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp`;
  try {
    await fsPromises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fsPromises.rename(tempPath, filePath);
  } catch (error) {
    logError(`Failed to persist data to ${filePath}`, error);
    try {
      await fsPromises.rm(tempPath, { force: true });
    } catch (cleanupError) {
      logError('Failed to clean up temporary storage file', cleanupError);
    }
    await showErrorDialog(
      'Failed to save data',
      'The application was unable to save data to disk. Some changes may not be preserved.',
      getErrorDetail(error)
    );
    throw error;
  }
};

const storagePath = (key: string) => path.join(dataRoot, key);

const loadDefaultPresets = async () => {
  try {
    const content = await fsPromises.readFile(path.join(defaultDataDir, 'presets.json'), 'utf-8');
    return JSON.parse(content) as PersistedBundle;
  } catch (error) {
    console.error('Failed to load default presets', error);
    return {} as PersistedBundle;
  }
};

const ensureDefaults = async () => {
  const presets = await loadDefaultPresets();
  const defaults: Record<string, unknown> = {
    'libraries/custom-tags.json': [],
    'libraries/favorites.json': [],
    'characters/profiles.json': [],
    'history/history.json': [],
    'config/settings.json': {},
    'libraries/templates.json': presets.templates ?? [],
    'libraries/negative-presets.json': presets.negative ?? [],
    'libraries/style-presets.json': presets.styles ?? []
  };

  const selectorsPath = storagePath('config/selectors.json');
  if (!fs.existsSync(selectorsPath)) {
    try {
      const selectors = await fsPromises.readFile(path.join(defaultDataDir, 'selectors.json'), 'utf-8');
      await atomicWrite(selectorsPath, JSON.parse(selectors));
    } catch (error) {
      console.warn('Unable to seed selectors', error);
    }
  }

  await Promise.all(
    Object.entries(defaults).map(async ([key, value]) => {
      const targetPath = storagePath(key);
      if (!fs.existsSync(targetPath)) {
        await atomicWrite(targetPath, value);
      }
    })
  );
};

const readStorage = async (key: string) => {
  const file = storagePath(key);
  if (!fs.existsSync(file)) {
    await ensureDefaults();
  }
  return readJson(file, null);
};

const writeStorage = async (key: string, value: unknown) => {
  const file = storagePath(key);
  await atomicWrite(file, value);
};

const bundleAllData = async (): Promise<PersistedBundle> => {
  const keys = [
    'libraries/custom-tags.json',
    'libraries/favorites.json',
    'characters/profiles.json',
    'history/history.json',
    'config/settings.json',
    'libraries/templates.json',
    'libraries/negative-presets.json',
    'libraries/style-presets.json'
  ];
  const entries = await Promise.all(
    keys.map(async (key) => {
      try {
        return [key, await readStorage(key)] as const;
      } catch (error) {
        logError(`Failed to read storage key ${key}`, error);
        throw error;
      }
    })
  );
  const bundle: PersistedBundle = {} as PersistedBundle;
  for (const [key, value] of entries) {
    switch (key) {
      case 'libraries/custom-tags.json':
        bundle.customTags = (value as unknown[]) ?? [];
        break;
      case 'libraries/favorites.json':
        bundle.favorites = (value as string[]) ?? [];
        break;
      case 'characters/profiles.json':
        bundle.characters = (value as PersistedBundle['characters']) ?? [];
        break;
      case 'history/history.json':
        bundle.history = (value as PersistedBundle['history']) ?? [];
        break;
      case 'config/settings.json':
        bundle.settings = value as PersistedBundle['settings'];
        break;
      case 'libraries/templates.json':
        bundle.templates = (value as PersistedBundle['templates']) ?? [];
        break;
      case 'libraries/negative-presets.json':
        bundle.negativePresets = (value as PersistedBundle['negativePresets']) ?? [];
        break;
      case 'libraries/style-presets.json':
        bundle.stylePresets = (value as PersistedBundle['stylePresets']) ?? [];
        break;
      default:
        break;
    }
  }
  return bundle;
};

const applyBundle = async (bundle: PersistedBundle) => {
  const tasks: Array<Promise<void>> = [];
  if (bundle.customTags) tasks.push(writeStorage('libraries/custom-tags.json', bundle.customTags));
  if (bundle.favorites) tasks.push(writeStorage('libraries/favorites.json', bundle.favorites));
  if (bundle.characters) tasks.push(writeStorage('characters/profiles.json', bundle.characters));
  if (bundle.history) tasks.push(writeStorage('history/history.json', bundle.history));
  if (bundle.settings) tasks.push(writeStorage('config/settings.json', bundle.settings));
  if (bundle.templates) tasks.push(writeStorage('libraries/templates.json', bundle.templates));
  if (bundle.negativePresets) tasks.push(writeStorage('libraries/negative-presets.json', bundle.negativePresets));
  if (bundle.stylePresets) tasks.push(writeStorage('libraries/style-presets.json', bundle.stylePresets));
  await Promise.all(tasks);
};

app.whenReady()
  .then(async () => {
    nativeTheme.themeSource = 'dark';
    try {
      await ensureDefaults();
    } catch (error) {
      logError('Failed to seed default data', error);
      await showErrorDialog(
        'Failed to initialise storage',
        'The application could not prepare its storage directory. Some features may not work as expected.',
        getErrorDetail(error)
      );
    }
    await createMainWindow();
    await createNovelAIWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createMainWindow();
      }
    });
  })
  .catch(async (error) => {
    logError('Application failed to start', error);
    await showErrorDialog(
      'Failed to start',
      'The application encountered an unexpected error during startup.',
      getErrorDetail(error)
    );
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('nai:inject', async (_event, payload: SendPayload) => {
  try {
    const window = await createNovelAIWindow();
    const script = `window.__NAI_BRIDGE.inject(${JSON.stringify(payload)})`;
    await window.webContents.executeJavaScript(script);
  } catch (error) {
    logError('Failed to inject payload into NovelAI window', error);
    await showErrorDialog(
      'Injection failed',
      'The application could not communicate with the NovelAI window.',
      getErrorDetail(error)
    );
    throw error;
  }
});

ipcMain.handle('nai:focus', async () => {
  try {
    const window = await createNovelAIWindow();
    if (window.isMinimized()) window.restore();
    window.focus();
  } catch (error) {
    logError('Failed to focus NovelAI window', error);
    await showErrorDialog(
      'Unable to focus NovelAI window',
      'The NovelAI window could not be brought to the front.',
      getErrorDetail(error)
    );
    throw error;
  }
});

ipcMain.on('nai:status', (_event, message: string) => {
  mainWindow?.webContents.send('nai:status', message);
});

ipcMain.handle('selectors:load', async () => {
  try {
    const file = storagePath('config/selectors.json');
    if (!fs.existsSync(file)) {
      await ensureDefaults();
    }
    return await readJson<Record<string, string>>(file, {});
  } catch (error) {
    logError('Failed to load selectors configuration', error);
    await showErrorDialog(
      'Failed to load selectors',
      'The application could not load selector settings. Default values will be used.',
      getErrorDetail(error)
    );
    return {};
  }
});

ipcMain.handle('storage:read', async (_event, key: string) => {
  try {
    return await readStorage(key);
  } catch (error) {
    logError(`Failed to read storage key ${key}`, error);
    await showErrorDialog(
      'Failed to read data',
      'The application could not read data from disk. Some information may be unavailable.',
      getErrorDetail(error)
    );
    return null;
  }
});

ipcMain.handle('storage:write', async (_event, key: string, value: unknown) => {
  try {
    await writeStorage(key, value);
    return true;
  } catch (error) {
    logError(`Failed to write storage key ${key}`, error);
    await showErrorDialog(
      'Failed to save data',
      'The application could not save data to disk. Please check your permissions and try again.',
      getErrorDetail(error)
    );
    return false;
  }
});

ipcMain.handle('storage:export', async () => {
  try {
    const bundle = await bundleAllData();
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export NovelAI Manager Data',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: path.join(app.getPath('documents'), 'novelai-manager-export.json')
    });
    if (canceled || !filePath) return null;
    await atomicWrite(filePath, bundle);
    return filePath;
  } catch (error) {
    logError('Failed to export storage data', error);
    await showErrorDialog(
      'Export failed',
      'The application could not export your data. Please try again.',
      getErrorDetail(error)
    );
    return null;
  }
});

ipcMain.handle('storage:import', async (_event, data?: string) => {
  try {
    let bundle: PersistedBundle | null = null;
    if (data && data.trim().length) {
      bundle = JSON.parse(data) as PersistedBundle;
    } else {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import NovelAI Manager Data',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      });
      if (canceled || filePaths.length === 0) return null;
      const content = await fsPromises.readFile(filePaths[0], 'utf-8');
      bundle = JSON.parse(content) as PersistedBundle;
    }
    if (bundle) {
      await applyBundle(bundle);
    }
    return true;
  } catch (error) {
    logError('Failed to import storage data', error);
    await showErrorDialog(
      'Import failed',
      'The selected file could not be imported. Please ensure it is a valid NovelAI export.',
      getErrorDetail(error)
    );
    return false;
  }
});

ipcMain.handle('settings:randomize', async () => null);

ipcMain.on('open-external', (_event, url: string) => {
  void shell.openExternal(url);
});

process.on('uncaughtException', async (error) => {
  logError('Uncaught exception', error);
  await showErrorDialog(
    'Unexpected error',
    'An unexpected error occurred in the application. Please restart and try again.',
    getErrorDetail(error)
  );
});

process.on('unhandledRejection', async (reason) => {
  logError('Unhandled promise rejection', reason);
  await showErrorDialog(
    'Unexpected error',
    'An unexpected error occurred in the application. Please restart and try again.',
    getErrorDetail(reason)
  );
});
