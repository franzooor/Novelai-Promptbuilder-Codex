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
  await mainWindow.loadURL(url);
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

  await naiWindow.loadURL('https://novelai.net/image');
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
  await fsPromises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fsPromises.rename(tempPath, filePath);
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
    keys.map(async (key) => [key, await readStorage(key)])
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

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';
  await ensureDefaults();
  await createMainWindow();
  await createNovelAIWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('nai:inject', async (_event, payload: SendPayload) => {
  const window = await createNovelAIWindow();
  const script = `window.__NAI_BRIDGE.inject(${JSON.stringify(payload)})`;
  await window.webContents.executeJavaScript(script);
});

ipcMain.handle('nai:focus', async () => {
  const window = await createNovelAIWindow();
  if (window.isMinimized()) window.restore();
  window.focus();
});

ipcMain.on('nai:status', (_event, message: string) => {
  mainWindow?.webContents.send('nai:status', message);
});

ipcMain.handle('selectors:load', async () => {
  const file = storagePath('config/selectors.json');
  if (!fs.existsSync(file)) {
    await ensureDefaults();
  }
  return readJson<Record<string, string>>(file, {});
});

ipcMain.handle('storage:read', async (_event, key: string) => readStorage(key));
ipcMain.handle('storage:write', async (_event, key: string, value: unknown) => {
  await writeStorage(key, value);
});

ipcMain.handle('storage:export', async () => {
  const bundle = await bundleAllData();
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export NovelAI Manager Data',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    defaultPath: path.join(app.getPath('documents'), 'novelai-manager-export.json')
  });
  if (canceled || !filePath) return null;
  await atomicWrite(filePath, bundle);
  return filePath;
});

ipcMain.handle('storage:import', async (_event, data?: string) => {
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
});

ipcMain.handle('settings:randomize', async () => null);

ipcMain.on('open-external', (_event, url: string) => {
  void shell.openExternal(url);
});
