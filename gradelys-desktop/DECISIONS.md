# Décisions d'architecture et checklist de sécurité — Gradelys Desktop

Ce document consigne les choix d'implémentation effectués pour `gradelys-desktop/` et les routes associées `/quick` et `/api/assistant`, ainsi que la vérification point par point de la checklist de sécurité.

---

## 1. Décisions techniques

1. **Architecture hybride Web + Electron (`gradelys-desktop/` dans le monorepo)**
   - Le dépôt web (`Next.js 14 App Router`) est déjà en production sur Vercel. L'ajout de `gradelys-desktop/` à la racine permet de partager les évolutions de `/quick` et `/api/assistant` dans le même dépôt, tout en excluant `gradelys-desktop` du `tsconfig.json` racine afin d'isoler strictement les dépendances Node/Electron.

2. **Authentification intégrée dans `/quick` (`QuickLoginView`)**
   - Plutôt que de naviguer la fenêtre flottante vers `/login` (ce qui ferait perdre le cadrage compact 420×560 et la barre de déplacement `-webkit-app-region: drag`, et compliquerait le filtrage strict de navigation), `/quick` affiche directement un formulaire compact email / mot de passe connecté à `@supabase/ssr` (`signInWithPassword`) et réutilise `useAuthStore` + la partition dédiée `persist:gradelys`.
   - Le lien « Créer un compte sur gradelys.com » s'ouvre dans le navigateur externe par défaut via `setWindowOpenHandler` (`action: 'deny'` + `shell.openExternal` limité à `https:`).

3. **Fournisseur IA interchangeable (`AI_PROVIDER`)**
   - Le projet web existant utilise déjà Gemini via API REST (`src/lib/gemini/client.ts`) et possède `OPENAI_API_KEY` pour certaines routes.
   - `/api/assistant` réutilise `GEMINI_API_KEY` par défaut (`AI_PROVIDER=gemini`, modèle `gemini-3.7-flash` configurable via `GEMINI_ASSISTANT_MODEL`) avec appels REST natifs sans dépendance SDK supplémentaire, tout en supportant `AI_PROVIDER=openai` (`OPENAI_API_KEY` / `OPENAI_ASSISTANT_MODEL`) et `AI_PROVIDER=anthropic` (`ANTHROPIC_API_KEY` / `ANTHROPIC_ASSISTANT_MODEL`) avec la même déclaration de tools (`capture_ecran` et `dessiner_sur_ecran`).
   - Les appels utilisent `fetch` côté Node.js (`runtime = "nodejs"`).

4. **Rate limiting (`Upstash Ratelimit` + fallback mémoire)**
   - `src/lib/assistant/rate-limit.ts` applique les quotas 20 req/min, 200 req/jour et 30 images/jour par utilisateur identifié via Supabase Auth (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`).
   - En l'absence de variables Upstash (ex. développement local), un limiteur en mémoire s'active avec un avertissement unique dans les logs serveur.

5. **Preloads autonomes compatibles `sandbox: true`**
   - Avec `sandbox: true`, Electron n'autorise pas les imports relatifs vers des chunks Vite partagés dans le preload.
   - `src/preload/chat.ts`, `src/preload/overlay.ts` et `src/preload/onboarding.ts` n'importent que des types (`import type { IPC_CHANNELS }`) associés à des constantes littérales vérifiées à la compilation via `satisfies`, ce qui garantit trois fichiers autonomes sans dossier `chunks/`.

6. **Méthodes additionnelles exposées dans `window.gradelysDesktop`**
   - En plus de l'API minimale spécifiée, `src/preload/chat.ts` expose :
     - `setAskBeforeCapture(ask: boolean)` : permet au bouton « Autoriser toujours » du bandeau de persister le choix dans `electron-store` et de mettre à jour immédiatement le menu contextuel du tray.
     - `onOverlayState(cb)` : synchronise l'affichage du bouton « Effacer les dessins » dans `/quick` quand l'overlay est effacé via `Échap` global ou après le timeout de 45 s.
     - `openQuickAssistant()` et `openMainApp()` : permettent de passer d'un clic entre l'application complète (`mainWindow.ts`, `/chat`) et l'assistant rapide flottant (`/quick`) avec capture et overlay.
   - Aucune API Node/Electron ni aucun accès système brut n'est exposé.

7. **Système d'icône Tray sans `setContextMenu` permanent**
   - Pour distinguer proprement clic gauche (afficher/masquer la fenêtre chat) et clic droit (ouvrir le menu contextuel sur Windows comme sur macOS), le `Tray` n'attache pas de menu permanent via `setContextMenu()`, mais ouvre le menu dynamiquement avec `tray.popUpContextMenu()` sur `right-click` (et Ctrl+clic sur macOS).
   - Un anti-rebond de 250 ms (`lastHiddenAt` dans `chatWindow.ts`) évite que le clic gauche sur le tray masque la fenêtre au `blur` puis la réaffiche immédiatement.

8. **Ancre visuelle de la commande `step`**
   - La commande `{ type: 'step', n, label }` positionne le badge numéroté (et son éventuel libellé) en seconde passe au-dessus de toutes les formes géométriques, ancré sur `commands[i + 1]` (ou `commands[i - 1]` en repli, et pointe `to` pour les flèches `arrow`).

9. **Repli `sharp` vers `nativeImage` & compression ultra-légère**
   - Les captures sont redimensionnées dès `desktopCapturer` (`max 1024 px`) puis compressées en mémoire via `sharp` (`^0.35.5`, `.sharpen({ sigma: 0.65 })`, `mozjpeg` 4:2:0 avec `trellisQuantisation`, `1024 px → 896 px → 768 px`, qualité `58 → 46 → 42 → 36`) jusqu'à atteindre la cible de `85 Ko` (`160 Ko` max, `MAX_IMAGE_BYTES = 500 Ko` côté serveur). En cas d'indisponibilité de `sharp`, `encodeWithNativeImage` assure un repli transparent 100 % mémoire.

10. **Icônes officielles & mode Application desktop complète**
    - Un fichier `postcss.config.cjs` vide est présent dans `gradelys-desktop/` afin d'empêcher Vite d'hériter du `postcss.config.js` Tailwind du projet web parent.
    - Les icônes `icon.icns`, `icon.ico`, `icon.png`, `trayTemplate.png`, `trayTemplate@2x.png` et `tray.ico` sont générées directement depuis le logo officiel `public/favicon.png` du site Gradelys.
    - L'application associe désormais une fenêtre desktop principale complète (`mainWindow.ts` sur `/chat`, visible dans le Dock/barre des tâches et accessible via un bouton « Assistant écran » dans la barre latérale) et l'assistant rapide flottant (`/quick`) toujours disponible depuis la barre de menu / zone de notification ou `CommandOrControl+Shift+Space`. Les deux fenêtres partagent la même session persistante `persist:gradelys`.

---

## 2. Checklist de sécurité (Section 5)

- [x] **Isolation des fenêtres (`chatWindow.ts`, `overlayWindow.ts`, `permissions.ts`)** : `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `allowRunningInsecureContent: false`, preload dédié sur chaque `BrowserWindow`.
- [x] **Contrôle strict de navigation (`security.ts`)** : `will-navigate` n'autorise que l'origine `GRADELYS_BASE_URL` (forçée en `https:` en production, défaut `https://gradelys.com`) ; les URLs externes `https:` sont déléguées à `shell.openExternal`, le reste est bloqué.
- [x] **Popups et nouvelles fenêtres bloqués** : `setWindowOpenHandler` retourne toujours `{ action: 'deny' }` (ouverture externe sur `https:` uniquement).
- [x] **Permissions session verrouillées (`configureSessionSecurity`)** : `setPermissionRequestHandler` et `setPermissionCheckHandler` refusent toutes les permissions par défaut, et n'autorisent que `clipboard-sanitized-write`, `notifications`, ainsi que `media` (audio uniquement pour la dictée vocale, strictement limité à l'origine de confiance `GRADELYS_BASE_URL`, avec demande OS macOS `systemPreferences.askForMediaAccess('microphone')` à la demande).
- [x] **Webviews et remote désactivés** : `will-attach-webview` appelle `event.preventDefault()` sur les fenêtres chat et locales ; aucun module `remote`.
- [x] **Validation stricte des origines IPC (`ipc.ts`, `security.ts`)** : `validateChatIpcSender` vérifie `event.senderFrame.url` contre l'origine Gradelys avant d'exécuter `captureScreen`, `drawOverlay`, `clearOverlay`, `getSettings`, `setAskBeforeCapture`, `setPinned`, `hideWindow`, `openQuickAssistant` ou `openMainApp`. `validateOnboardingIpcSender` restreint l'IPC d'onboarding à sa seule page locale. Tests automatisés dans `tests/security.test.ts`.
- [x] **Consentement explicite avant capture (`askBeforeCapture`)** : activé par défaut (`true`) ; affiche dans `/quick` « Gradelys veut regarder ton écran » avec la raison et les boutons `[Autoriser]`, `[Autoriser toujours]`, `[Refuser]`.
- [x] **Garde-fous anti-abus** : client limité à 1 capture toutes les 3 s et 30 captures / heure (`CaptureRateLimiter`), boucle IA limitée à 3 captures max par question, captures conservées exclusivement en RAM et jamais écrites sur disque.
- [x] **Zéro clé secrète dans l'app desktop** : aucune clé API dans `gradelys-desktop/` ; toutes les clés IA et Redis résident côté serveur Vercel (`/api/assistant`).
- [x] **Surface `preload/chat.ts` minimale** : seule `window.gradelysDesktop` est exposée via `contextBridge.exposeInMainWorld`.
- [x] **CSP stricte & protection XSS** : `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:` sur `overlay`, `onboarding` et `offline` ; aucun `innerHTML` / `dangerouslySetInnerHTML` ; en-têtes `X-Frame-Options` et CSP du site web inchangés.
- [x] **Confidentialité des logs** : vérification globale confirmant qu'aucun log desktop (`electron-log`) ni serveur (`/api/assistant`, `/api/assistant/transcribe`) ne contient d'image base64, d'audio ni de texte utilisateur.
- [x] **Dépendances de production saines** : `sharp` mis à jour en `^0.35.5` ; `npm audit --omit=dev` dans `gradelys-desktop/` retourne 0 vulnérabilité.

## Architecture Glassmorphism, Dictée & Chat principal unifié (Mises à jour récentes)

- **Design Glassmorphism dynamique (`chatWindow.ts` & `/quick`)** : la fenêtre rapide flottante (`CHAT_WIDTH = 456`) utilise `transparent: true`, `vibrancy: 'under-window'` / `roundedCorners: true` sur macOS et une carte verre dépoli (`backdrop-filter: blur(32px)`). À l'ouverture, seule la barre d'écriture / dictée vocale s'affiche (`~186 px`) ; la fenêtre s'adapte dynamiquement (`chat:resize-height` via `ResizeObserver`) lorsqu'une réponse, une demande d'autorisation ou une capture apparaît, sans jamais bloquer les clics autour d'elle.
- **Synchronisation avec le chat principal Gradelys (`/api/assistant` & `openMainApp(subPath)`)** : chaque session `/quick` utilise le `learning_profile` (`calibratePrompt`) et crée ou met à jour une vraie conversation (`conversations` avec `kind = 'chat'` + `messages`) dans Supabase (sans jamais enregistrer les captures d'écran). Un clic sur *« Ouvrir »* ouvre directement `/chat/<conversationId>` dans la fenêtre principale desktop.
- **Dictée vocale sécurisée (`MediaRecorder` -> `/api/assistant/transcribe`)** : comme `webkitSpeechRecognition` n'est pas fiable dans Electron sans clé propriétaire Chromium, la dictée capture l'audio localement via `MediaRecorder` et l'envoie en HTTPS authentifié vers `/api/assistant/transcribe` (transcrit par Gemini audio `inline_data` ou OpenAI Whisper selon `AI_PROVIDER`). L'entitlement `com.apple.security.device.audio-input` et `NSMicrophoneUsageDescription` sont déclarés pour macOS.
- **Démarrage local en 1 commande (`npm run dev:desktop` -> `scripts/dev-desktop.mjs`)** : évite l'erreur 404 de `https://gradelys.com/quick` avant déploiement Vercel en lançant/réutilisant le serveur local Next.js sur `http://localhost:3000` et en ouvrant Electron avec `GRADELYS_BASE_URL=http://localhost:3000`. Une page locale claire (`offline/index.html?mode=not-deployed`) remplace également le 404 brut si la route distante retourne `>= 400`.
- **Survol universel sur toutes les applications et espaces plein écran** : `chatWindow.ts` (`type: 'panel'` macOS, niveau `pop-up-menu` / `screen-saver`) et `overlayWindow.ts` (`type: 'panel'`, niveau `screen-saver`, `skipTransformProcessType: true`) utilisent `prepareQuickOverlayPolicy()` sur macOS pour basculer temporairement en `accessory` lorsque la fenêtre principale est fermée ou en arrière-plan, afin de ne jamais ramener l'utilisateur vers le Bureau 1 / Dashboard lors de l'ouverture depuis une autre app. `captureActiveDisplay()` cible en priorité l'écran portant la fenêtre flottante.
- **Pédagogie renforcée (`provider.ts`)** : prompt structuré (diagnostic direct, étapes numérotées citant les libellés exacts en gras, explication intuitive du *pourquoi* et vérification), `temperature = 0.3` et guidage explicite des coordonnées `0..1000` pour `dessiner_sur_ecran`.
- **Fluidité overlay/fenêtre & vrais graphiques interactifs (`/quick` & `overlay.ts`)** :
  - `overlay.ts` remplace les `ctx.shadowBlur` par un halo vectoriel double-passe ultra-rapide et arrête la boucle `requestAnimationFrame` après le fondu d'entrée (`200 ms`) ou une courte pulsation plafonnée (`~30 fps` max `1,6 s` pour `<= 6` formes) pour revenir à 0 % CPU/GPU au repos.
  - `chatWindow.ts` porte `CHAT_MAX_HEIGHT` à `640 px` et regroupe les appels `win.setBounds` (`48 ms`) ; côté `/quick`, la classe `quick-mac` désactive le double `backdrop-filter` CSS au profit de la vibrancy macOS native, les deltas SSE sont regroupés (`45 ms`) avec bulles mémorisées (`React.memo`), et les blocs ```` ```chart ```` / ```` ```mermaid ```` s'affichent via `ChartRenderer` / `MermaidDiagram` chargés à la demande (`QuickChartBlock`), tandis que `provider.ts` interdit d'abuser de `dessiner_sur_ecran` pour tracer des graphes.
- **Fiabilité bout-en-bout & fin du blocage sur « Réflexion… » (`provider.ts`, `/api/assistant`, `/quick`, `gradelys-desktop`)** :
  - `readSseStream` vérifie désormais `response.ok` et `Content-Type: text/event-stream`, extrait les messages d'erreur HTTP/JSON/SSE et déclenche un timeout client (`65 s`), tandis que `QuickMessageBubble` n'affiche le spinner « Réflexion… » que tant que `isStreaming` est actif (et affiche l'état réel pendant l'attente d'autorisation ou la capture, ou un message explicite si le flux s'achève sans texte).
  - Les appels amont Gemini/OpenAI/Anthropic utilisent un timeout (`45 s`), flushent systématiquement la fin de flux SSE, filtrent les tokens `thought` internes de Gemini et garantissent qu'aucun événement `done` vide ne soit émis sans erreur ou repli ; le panneau `/quick` limite sa hauteur (`max-h-[632px]`) avec `<main className="min-h-0 flex-1 ...">` pour ne jamais rogner la carte d'autorisation écran.
  - Côté Electron, `isTrustedOrigin` accepte la paire canonique HTTPS `gradelys.com` / `www.gradelys.com` (suite au `308` de production), `capture.ts` borne `desktopCapturer.getSources` (`8 s`) et `sharp` (`4 s` avant repli `nativeImage`), et `permissions.ts` place l'onboarding `alwaysOnTop`.
- **Rendu mathématique KaTeX, annulation d'envoi et médias (`images` / `youtube`) dans `/quick` & `/chat`** :
  - `/quick` active désormais `remark-math` + `rehype-katex` (`katex/dist/katex.min.css`) avec défilement horizontal sur `.katex-display` dans `quick.css`, et un normaliseur sûr (`normalizeMathMarkdown`) convertit `\(...\)` / `\[...\]` hors blocs de code en `$...$` / `$$...$$` dans `/chat` et `/quick`.
  - Le bouton Envoyer bascule en bouton **Arrêter** (`AbortController`) pendant la génération/envoi dans `/chat` (`chat-thread.tsx` et `/chat` d'accueil) ainsi que dans `/quick`, conservant l'éventuel texte déjà reçu sans afficher d'erreur ni bloquer la session.
  - `/quick` partage désormais les composants `ChatImageGallery` (```` ```images ````) et `ChatYouTubeEmbed` (```` ```youtube ````) du chat principal via `/api/media/search` (avec mode compact sans panneau Canvas), et `security.ts` ajoute un garde-fou `will-frame-navigate` restreignant les sous-cadres à `isTrustedEmbedUrl` (origine Gradelys ou `https://www.youtube-nocookie.com/embed/...`).
- **Suppression de la landing page côté desktop & stabilité d'affichage (`middleware.ts`, `auth-provider.tsx`, `chatWindow.ts`, `/quick`)** :
  - `configureSessionSecurity` ajoute le marqueur `GradelysDesktop/<version>` au `User-Agent` de la session persistante `persist:gradelys`, et `src/middleware.ts` redirige automatiquement `/` vers `/chat` (connecté) ou `/login` (non connecté) pour tout client desktop ; la déconnexion et les liens de logo client basculent également vers `/login` sans passer par `/`.
  - `AuthProvider` déduplique les chargements et ignore les événements `INITIAL_SESSION` / `TOKEN_REFRESHED` redondants afin d'éviter les re-rendus et recalculs de taille en cascade ; `chatWindow.ts` et `/quick` alignent la marge verticale exacte (`+ 8 px`), élargissent la temporisation de redimensionnement (`220 ms` / `180 ms`, seuil `10 px` / `8 px`) et ajoutent un court délai de confirmation au `blur` (`120 ms`) pour supprimer tout scintillement ou masquage intempestif.
- **Connexion Google directe sur Desktop (Loopback OAuth RFC 8252)** :
  - Google refusant les authentifications dans les WebViews embarquées (`403 disallowed_useragent`) et la fenêtre Electron bloquant les navigations hors origine Gradelys, `src/main/oauth.ts` démarre un serveur HTTP éphémère strictement lié à `127.0.0.1:<port>` avec un `state` aléatoire (192 bits) vérifié à temps constant (`timingSafeEqual`).
  - `/api/auth/desktop-google` lance le flux PKCE Google dans le navigateur système (où l'utilisateur est déjà connecté) en conservant exactement `redirectTo = <origin>/api/auth/callback` et un cookie HttpOnly `gradelys_desktop_oauth` ; `/api/auth/callback` échange le `code`, évite d'écrire le refresh token desktop dans le navigateur système, et renvoie la session par fragment `#` vers `http://127.0.0.1:<port>/callback` (immédiatement nettoyé via `history.replaceState`), puis `supabase.auth.setSession` écrit la session dans `persist:gradelys` et synchronise `/quick` et la fenêtre principale via `gradelys:auth-changed`.
- **Plein écran natif macOS sans disparition de l'app (`mainWindow.ts`, `shared/windowPolicy.ts`)** :
  - Sur macOS, les transitions d'espace plein écran émettent des événements `hide` transitoires sur `NSWindow` alors que `win.isVisible()` / `win.isFullScreen()` restent `true` ; de plus, ré-appeler `setActivationPolicy('regular')` et `dock.show()` à chaque `focus` provoquait des boucles `focus`/`blur`.
  - `setMacActivationPolicy` déduplique désormais l'état (`currentActivationPolicy`), `shouldSwitchToAccessoryOnMainHide` ignore tout `hide` transitoire pendant les animations plein écran, `shouldUseAccessoryForQuickOverlay` ne bascule en `'accessory'` que si la fenêtre principale est fermée ou réduite, et la fermeture d'une fenêtre plein écran attend `leave-full-screen` avant de la masquer.

