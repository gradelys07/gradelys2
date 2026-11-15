# Gradelys Desktop

Application de barre de menu (macOS 12+ Apple Silicon & Intel) et zone de notification (Windows 10/11 x64) qui ouvre l'assistant rapide Gradelys dans une fenêtre flottante (420×560), capable d'observer ponctuellement l'écran et d'y dessiner des repères visuels étape par étape.

---

## Architecture

- **Desktop (`gradelys-desktop/`)** : Electron + TypeScript strict (`electron-vite`, `electron-builder`, `electron-updater`, `electron-store`, `sharp` avec repli `nativeImage`), overlay HTML5 `<canvas>` transparent sans framework UI.
- **Web (`../src/app/quick` & `../src/app/api/assistant`)** : Page mini-chat `/quick` chargée dans la `BrowserWindow` via session persistante (`persist:gradelys`) + endpoint SSE stateless `/api/assistant` (auth Supabase existante, validation Zod, rate limiting Upstash Redis, tool calling IA interchangeable via `AI_PROVIDER`).

---

## Prérequis et développement local

- **Node.js** : 20+ (recommandé : 22 LTS)
- **npm** : 10+

### 1. Lancer le backend web en local

À la racine du dépôt web (`..`), copier `.env.example` vers `.env.local`, renseigner au minimum vos clés Supabase et `GEMINI_API_KEY` (ou `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`), puis démarrer Next.js :

```bash
npm install
npm run dev
```

### 2. Lancer l'app desktop en développement

```bash
cd gradelys-desktop
npm install
GRADELYS_BASE_URL=http://localhost:3000 npm run dev
```

En mode packagé (production), `GRADELYS_BASE_URL` pointe par défaut vers `https://gradelys.com` (toute URL distante non HTTPS en production est refusée). **Aucune clé secrète n'est embarquée dans l'app desktop.**

---

## Scripts disponibles (`gradelys-desktop/`)

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Démarre l'app Electron avec rechargement `electron-vite` |
| `npm run build` | Compile main / preload / renderer dans `out/` |
| `npm run typecheck` | Vérifie TypeScript strict (`tsconfig.node.json` et `tsconfig.web.json`) |
| `npm run lint` | Exécute ESLint sur `src/`, `shared/` et `tests/` |
| `npm test` | Exécute les tests unitaires Vitest (coordonnées DPI/Retina, sécurité, rate limiter) |
| `npm run dist:mac` | Compile et génère `.dmg` + `.zip` macOS (`arm64` et `x64`) dans `dist/` |
| `npm run dist:win` | Compile et génère l'installateur NSIS Windows (`x64`) dans `dist/` |
| `npm run dist` | Génère les installateurs pour la plateforme courante |
| `npm audit --omit=dev` | Vérifie l'absence de vulnérabilités sur les dépendances de production |

---

## Variables d'environnement

### Côté Desktop

| Variable | Défaut | Description |
| --- | --- | --- |
| `GRADELYS_BASE_URL` | `https://gradelys.com` (prod) / `http://localhost:3000` (dev) | Origine web autorisée pour `/quick` et l'IPC |

### Côté Web / Vercel (`.env.local` et paramètres Vercel)

| Variable | Défaut | Description |
| --- | --- | --- |
| `AI_PROVIDER` | `gemini` | Fournisseur IA : `gemini`, `openai` ou `anthropic` |
| `GEMINI_API_KEY` | — | Clé API Gemini (réutilisée depuis la config web existante) |
| `GEMINI_ASSISTANT_MODEL` | `gemini-3.7-flash` | Modèle utilisé quand `AI_PROVIDER=gemini` |
| `OPENAI_API_KEY` | — | Clé API OpenAI (si `AI_PROVIDER=openai`) |
| `OPENAI_ASSISTANT_MODEL` | `gpt-4o-mini` | Modèle utilisé quand `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | — | Clé API Anthropic (si `AI_PROVIDER=anthropic`) |
| `ANTHROPIC_ASSISTANT_MODEL` | `claude-3-5-sonnet-latest` | Modèle utilisé quand `AI_PROVIDER=anthropic` |
| `UPSTASH_REDIS_REST_URL` | — | URL REST Upstash Redis (recommandé en production Vercel) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Jeton REST Upstash Redis |
| `ASSISTANT_RATE_PER_MIN` | `20` | Quota requêtes / minute / utilisateur |
| `ASSISTANT_RATE_PER_DAY` | `200` | Quota requêtes / jour / utilisateur |
| `ASSISTANT_IMAGE_PER_DAY` | `30` | Quota captures / jour / utilisateur |

---

## Packaging, signature et publication automatique (GitHub Releases)

La configuration de build se trouve dans `electron-builder.yml` et le workflow CI dans `.github/workflows/release.yml` (déclenché sur chaque tag Git `v*`, ex. `v1.0.0`).

### 1. Configurer le dépôt GitHub pour `electron-updater`

Dans `gradelys-desktop/electron-builder.yml`, remplacez :

```yaml
publish:
  provider: github
  owner: A_RENSEIGNER_OWNER_GITHUB
  repo: A_RENSEIGNER_REPO_GITHUB
```

L'app vérifie les mises à jour au démarrage (après 15 s) puis toutes les 6 heures en production, télécharge en arrière-plan et notifie l'utilisateur (« Mise à jour prête — Redémarrer »).

### 2. Signature et notarisation macOS (pas à pas)

1. Créer un compte **Apple Developer** (99 $/an) sur [developer.apple.com](https://developer.apple.com).
2. Depuis **Xcode** ou Keychain Access sur Mac, créer un certificat **Developer ID Application**, l'exporter avec sa clé privée au format `.p12`, puis l'encoder en base64 :
   ```bash
   base64 -i certificat-mac.p12 | pbcopy
   ```
3. Sur [account.apple.com](https://account.apple.com), créer un **mot de passe spécifique à l'application** (*App-Specific Password*) et relever votre **Team ID** (10 caractères).
4. Ajouter les secrets dans **GitHub → Settings → Secrets and variables → Actions** :
   - `MAC_CSC_LINK` : contenu base64 du `.p12` macOS
   - `MAC_CSC_KEY_PASSWORD` : mot de passe d'export du `.p12`
   - `APPLE_ID` : adresse email du compte Apple Developer
   - `APPLE_APP_SPECIFIC_PASSWORD` : mot de passe spécifique à l'app
   - `APPLE_TEAM_ID` : Team ID Apple Developer
5. Vérifier `build/entitlements.mac.plist` (`allow-jit`, `allow-unsigned-executable-memory`, `disable-library-validation`) et `NSScreenCaptureUsageDescription` déjà configurés dans `electron-builder.yml`.

### 3. Build et signature Windows (pas à pas)

- La cible Windows génère un installateur **NSIS x64** (`oneClick: true`, `perMachine: false`, installation par utilisateur sans droits administrateur).
- **Sans certificat** : le build fonctionne sans blocage en local comme en CI, mais Windows affichera l'écran bleu **Windows Defender SmartScreen** lors des premiers téléchargements. Les utilisateurs devront cliquer sur *« Informations complémentaires » → « Exécuter quand même »*.
- **Avec certificat (optionnel)** : si vous achetez un certificat de signature de code Windows (OV ou EV exportable en `.pfx` / `.p12`), ajoutez ces secrets dans GitHub Actions :
  - `WIN_CSC_LINK` : contenu base64 du certificat `.pfx`
  - `WIN_CSC_KEY_PASSWORD` : mot de passe du certificat

### 4. Déclencher une release complète

```bash
git tag v1.0.0
git push origin v1.0.0
```

Le workflow `.github/workflows/release.yml` compile et publie automatiquement les binaires macOS (`.dmg`, `.zip`, `.blockmap`, `latest-mac.yml`) et Windows (`.exe`, `.blockmap`, `latest.yml`) dans **GitHub Releases**.

---

## Actions à réaliser par vos soins (Section 12)

1. Créer un compte **Apple Developer** (99 $/an) pour signer et notariser le `.dmg` / `.zip`.
2. *(Optionnel)* Acheter un certificat de signature de code Windows pour supprimer l'alerte SmartScreen.
3. *(Optionnel)* Affiner les icônes dans `gradelys-desktop/build/` si vous souhaitez un design différent des icônes générées à partir du logo officiel `public/favicon.png` (`icon.icns`, `icon.ico`, `icon.png`, `trayTemplate.png`, `trayTemplate@2x.png`, `tray.ico`).
4. Renseigner les variables d'environnement sur **Vercel** (`AI_PROVIDER`, clé API IA, `UPSTASH_REDIS_REST_*`, limites) et les **secrets GitHub Actions** (`MAC_CSC_*`, `APPLE_*`, et optionnellement `WIN_CSC_*`).
5. Renseigner `owner` et `repo` GitHub dans `gradelys-desktop/electron-builder.yml`.

---

## Dépannage

- **Permission d'enregistrement d'écran refusée sur macOS**
  - L'écran d'accueil intégré s'ouvre automatiquement si l'autorisation n'est pas accordée.
  - Si vous avez autorisé l'app puis recompilé/remplacé une version non signée, macOS peut conserver une ancienne signature dans TCC. Ouvrez *Réglages Système → Confidentialité et sécurité → Enregistrement de l'écran*, décochez puis recochez **Gradelys** (ou réinitialisez via `tccutil reset ScreenCapture com.gradelys.desktop`) et redémarrez l'application.
- **Alerte Windows SmartScreen**
  - Tant que l'installateur `.exe` n'est pas signé par un certificat reconnu, cliquez sur *« Informations complémentaires »* puis *« Exécuter quand même »*.
- **Raccourci global déjà utilisé par une autre application**
  - Si `CommandOrControl+Shift+Space` (défaut) est déjà réservé par une autre application, une alerte apparaît. Faites un clic droit sur l'icône Gradelys dans la barre de menu / zone de notification → *« Raccourci clavier »* → sélectionnez un autre raccourci (ex. `CommandOrControl+Alt+Space` ou `CommandOrControl+Shift+G`).
- **Dessins d'overlay décalés (multi-écrans / DPI Windows / Retina)**
  - Si un changement de résolution ou de facteur d'échelle vient d'avoir lieu, l'événement `display-metrics-changed` réinitialise automatiquement les fenêtres overlay. Vous pouvez aussi effacer immédiatement l'overlay avec la touche `Échap` ou le bouton *« Effacer les dessins »*, puis relancer la question pour recalculer les coordonnées `0–1000` sur l'écran actif.
- **Logs locaux**
  - Les journaux techniques (sans aucune capture ni texte utilisateur) sont écrits par `electron-log` dans :
    - macOS : `~/Library/Logs/Gradelys/main.log`
    - Windows : `%USERPROFILE%\AppData\Roaming\Gradelys\logs\main.log`
- **Tester les modifications locales avant de pousser sur GitHub / Vercel**
  - Quittez d'abord l'application installée depuis le `.dmg` (icône en haut -> *Quitter Gradelys*) afin que le verrou d'instance unique ne réouvre pas la version de production `https://gradelys.com`.
  - À la racine du repo web, lancez une seule commande : `npm run dev:desktop` (démarre/réutilise `http://localhost:3000` et lance Electron pointé dessus automatiquement).

