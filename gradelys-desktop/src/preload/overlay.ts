import { contextBridge, ipcRenderer } from 'electron';
import type {
  DrawCommand,
  IPC_CHANNELS,
  OverlayPreloadAPI,
  Rect,
} from '../../shared/types';

const CHANNELS = {
  OVERLAY_RENDER: 'overlay:render-commands' satisfies typeof IPC_CHANNELS.OVERLAY_RENDER,
  OVERLAY_CLEAR: 'overlay:clear' satisfies typeof IPC_CHANNELS.OVERLAY_CLEAR,
} as const;

const api: OverlayPreloadAPI = {
  onRenderCommands: (
    cb: (payload: { commands: DrawCommand[]; displayBounds: Rect }) => void
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: { commands: DrawCommand[]; displayBounds: Rect }
    ): void => {
      cb(payload);
    };
    ipcRenderer.on(CHANNELS.OVERLAY_RENDER, listener);
    return () => {
      ipcRenderer.removeListener(CHANNELS.OVERLAY_RENDER, listener);
    };
  },
  onClear: (cb: () => void): (() => void) => {
    const listener = (): void => {
      cb();
    };
    ipcRenderer.on(CHANNELS.OVERLAY_CLEAR, listener);
    return () => {
      ipcRenderer.removeListener(CHANNELS.OVERLAY_CLEAR, listener);
    };
  },
};

contextBridge.exposeInMainWorld('gradelysOverlay', api);
