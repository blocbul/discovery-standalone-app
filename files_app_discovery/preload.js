const { contextBridge } = require('electron');

// Expose safe API to renderer process
contextBridge.exposeInMainWorld('electron', {
    version: process.version,
    platform: process.platform
});
