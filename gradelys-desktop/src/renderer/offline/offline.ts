const retryBtn = document.getElementById('retry-btn') as HTMLButtonElement | null;
const badgeEl = document.getElementById('offline-badge');
const titleEl = document.getElementById('offline-title');
const descEl = document.getElementById('offline-desc');

function resolveParams(): { retryUrl: string; mode: string } {
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get('retryUrl');
  const mode = params.get('mode') || 'offline';
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      const isLocal =
        parsed.protocol === 'http:' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
      if (parsed.protocol === 'https:' || isLocal) {
        return { retryUrl: parsed.toString(), mode };
      }
    } catch {
      // Fallback below
    }
  }
  return { retryUrl: 'https://gradelys.com/quick', mode };
}

const { retryUrl, mode } = resolveParams();
if (mode === 'not-deployed') {
  if (badgeEl) badgeEl.textContent = '✨';
  if (titleEl) titleEl.textContent = "Assistant rapide pas encore en ligne";
  if (descEl) {
    descEl.textContent =
      "La page /quick n'est pas encore déployée sur gradelys.com (erreur 404). Déploie sur Vercel ou lance « npm run dev:desktop » en local pour tester tout de suite.";
  }
}

retryBtn?.addEventListener('click', () => {
  retryBtn.disabled = true;
  retryBtn.textContent = 'Connexion…';
  window.location.replace(retryUrl);
});
