import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  printDisposal: () => ipcRenderer.invoke('print-disposal'),
  showAlert: (message: string) => ipcRenderer.invoke('show-alert', message),
});
