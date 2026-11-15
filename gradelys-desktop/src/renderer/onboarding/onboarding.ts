import type { OnboardingPreloadAPI } from '../../../shared/types';

declare global {
  interface Window {
    gradelysOnboarding?: OnboardingPreloadAPI;
  }
}

const openSettingsBtn = document.getElementById('open-settings-btn') as HTMLButtonElement | null;
const relaunchBtn = document.getElementById('relaunch-btn') as HTMLButtonElement | null;
const laterBtn = document.getElementById('later-btn') as HTMLButtonElement | null;

openSettingsBtn?.addEventListener('click', async () => {
  await window.gradelysOnboarding?.triggerPermissionPrompt();
  await window.gradelysOnboarding?.openScreenPermissionSettings();
});

relaunchBtn?.addEventListener('click', async () => {
  await window.gradelysOnboarding?.relaunchApp();
});

laterBtn?.addEventListener('click', () => {
  window.gradelysOnboarding?.closeWindow();
});

