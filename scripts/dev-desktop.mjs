#!/usr/bin/env node
/**
 * Single-command local development launcher for Gradelys Desktop.
 * Starts Next.js on http://localhost:3000 (or reuses an existing local server),
 * waits until it responds, then launches Electron pointed at http://localhost:3000.
 */
import { spawn } from "node:child_process";
import process from "node:process";

const LOCAL_URL = "http://localhost:3000";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

async function isServerReady(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${url}/quick`, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status > 0 && res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 45_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReady(url)) return true;
    await new Promise((r) => setTimeout(r, 700));
  }
  return false;
}

async function main() {
  let nextProc = null;
  const alreadyRunning = await isServerReady(LOCAL_URL);

  if (alreadyRunning) {
    console.log(`[gradelys] Serveur local déjà actif sur ${LOCAL_URL} (réutilisation).`);
  } else {
    console.log(`[gradelys] Démarrage du serveur web local sur ${LOCAL_URL}...`);
    nextProc = spawn(npmCmd, ["run", "dev"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    nextProc.on("exit", (code) => {
      if (code !== null && code !== 0) {
        console.error(`[gradelys] Le serveur web local s'est arrêté (code ${code}).`);
        process.exit(code);
      }
    });

    const ready = await waitForServer(LOCAL_URL);
    if (!ready) {
      console.error("[gradelys] Délai dépassé en attendant http://localhost:3000/quick.");
      nextProc.kill("SIGTERM");
      process.exit(1);
    }
  }

  console.log(`[gradelys] Lancement de Gradelys Desktop connecté à ${LOCAL_URL}...`);
  const electronProc = spawn(npmCmd, ["--prefix", "gradelys-desktop", "run", "dev"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      GRADELYS_BASE_URL: LOCAL_URL,
    },
  });

  const cleanup = () => {
    if (electronProc && !electronProc.killed) {
      electronProc.kill("SIGTERM");
    }
    if (nextProc && !nextProc.killed) {
      nextProc.kill("SIGTERM");
    }
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  electronProc.on("exit", (code) => {
    if (nextProc && !nextProc.killed) {
      nextProc.kill("SIGTERM");
    }
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[gradelys] Erreur fatale:", err);
  process.exit(1);
});

