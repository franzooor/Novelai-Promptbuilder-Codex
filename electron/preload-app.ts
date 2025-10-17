import { contextBridge, ipcRenderer } from 'electron';
import type { SendPayload } from '../src/types/models';

contextBridge.exposeInMainWorld('bridge', {
  sendToNAI: (payload: SendPayload) => ipcRenderer.invoke('nai:inject', payload),
  focusNovelAI: () => ipcRenderer.invoke('nai:focus'),
  randomizeSettings: (profile: string | null) => ipcRenderer.invoke('settings:randomize', profile),
  storage: {
    read: (key: string) => ipcRenderer.invoke('storage:read', key),
    write: (key: string, value: unknown) => ipcRenderer.invoke('storage:write', key, value),
    exportBundle: () => ipcRenderer.invoke('storage:export'),
    importBundle: (data: string) => ipcRenderer.invoke('storage:import', data)
  },
  onNaiStatus: (cb: (status: string) => void) => {
    const listener = (_: unknown, message: string) => cb(message);
    ipcRenderer.on('nai:status', listener);
    return () => ipcRenderer.removeListener('nai:status', listener);
  }
});
