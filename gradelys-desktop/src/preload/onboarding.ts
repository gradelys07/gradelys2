import { contextBridge, ipcRenderer } from 'electron';
import type { IPC_CHANNELS, OnboardingPreloadAPI } from '../../shared/types';

const CHANNELS = {
  ONBOARDING_OPEN_SETTINGS:
    'onboarding:open-settings' satisfies typeof IPC_CHANNELS.ONBOARDING_OPEN_SETTINGS,
  ONBOARDING_TRIGGER_PROMPT:
    'onboarding:trigger-prompt' satisfies typeof IPC_CHANNELS.ONBOARDING_TRIGGER_PROMPT,
  ONBOARDING_RELAUNCH: 'onboarding:relaunch' satisfies typeof IPC_CHANNELS.ONBOARDING_RELAUNCH,
  ONBOARDING_CLOSE: 'onboarding:close' satisfies typeof IPC_CHANNELS.ONBOARDING_CLOSE,
} as const;

const api: OnboardingPreloadAPI = {
  openScreenPermissionSettings: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.ONBOARDING_OPEN_SETTINGS);
  },
  triggerPermissionPrompt: (): Promise<boolean> => {
    return ipcRenderer.invoke(CHANNELS.ONBOARDING_TRIGGER_PROMPT);
  },
  relaunchApp: (): Promise<void> => {
    return ipcRenderer.invoke(CHANNELS.ONBOARDING_RELAUNCH);
  },
  closeWindow: (): void => {
    ipcRenderer.send(CHANNELS.ONBOARDING_CLOSE);
  },
};

contextBridge.exposeInMainWorld('gradelysOnboarding', api);
