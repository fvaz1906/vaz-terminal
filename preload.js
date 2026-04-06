const { clipboard, contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopWindow", {
  minimize: () => ipcRenderer.invoke("app:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("app:toggle-maximize"),
  close: () => ipcRenderer.invoke("app:close")
});

contextBridge.exposeInMainWorld("terminalApi", {
  getProfiles: () => ipcRenderer.invoke("terminal:get-profiles"),
  start: (payload) => ipcRenderer.invoke("terminal:start", payload),
  closeSession: (payload) => ipcRenderer.invoke("terminal:close-session", payload),
  autocomplete: (payload) => ipcRenderer.invoke("terminal:autocomplete", payload),
  showContextMenu: (payload) => ipcRenderer.invoke("terminal:show-context-menu", payload),
  write: (payload) => ipcRenderer.send("terminal:input", payload),
  resize: (payload) => ipcRenderer.send("terminal:resize", payload),
  onData: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("terminal:data", listener);
    return () => ipcRenderer.removeListener("terminal:data", listener);
  },
  onExit: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("terminal:exit", listener);
    return () => ipcRenderer.removeListener("terminal:exit", listener);
  },
  onMeta: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("terminal:meta", listener);
    return () => ipcRenderer.removeListener("terminal:meta", listener);
  }
});

contextBridge.exposeInMainWorld("sshStorageApi", {
  list: () => ipcRenderer.invoke("ssh-storage:list"),
  save: (payload) => ipcRenderer.invoke("ssh-storage:save", payload),
  remove: (payload) => ipcRenderer.invoke("ssh-storage:delete", payload),
  importFile: () => ipcRenderer.invoke("ssh-storage:import"),
  exportFile: () => ipcRenderer.invoke("ssh-storage:export")
});

contextBridge.exposeInMainWorld("clipboardApi", {
  readText: () => clipboard.readText(),
  writeText: (text) => clipboard.writeText(text || "")
});
