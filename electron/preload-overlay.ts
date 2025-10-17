import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('__NAI_MAPPER__', {
  open: () => {
    console.warn('Selector mapper not implemented in this build.');
  }
});
