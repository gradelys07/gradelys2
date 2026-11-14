"use client";

export interface PythonRunResult {
  images: string[];
  stdout: string;
  error?: string;
}

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

let scriptPromise: Promise<void> | null = null;
let pyodidePromise: Promise<any> | null = null;
let executionQueue: Promise<any> = Promise.resolve();

function loadPyodideScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide can only run in the browser."));
  }
  const win = window as any;
  if (typeof win.loadPyodide === "function") {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PYODIDE_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => {
        scriptPromise = null;
        reject(new Error("Impossible de charger le moteur Python (Pyodide)."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Impossible de charger le moteur Python (Pyodide)."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function getPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    await loadPyodideScript();
    const loadPyodide = (window as any).loadPyodide;
    if (typeof loadPyodide !== "function") {
      throw new Error("Pyodide loader unavailable.");
    }
    const instance = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    return instance;
  })().catch((err) => {
    pyodidePromise = null;
    throw err;
  });

  return pyodidePromise;
}

async function executePythonInternal(code: string): Promise<PythonRunResult> {
  const pyodide = await getPyodide();

  const needsMatplotlib =
    /\b(matplotlib|plt|pylab)\b/.test(code) ||
    /\.(plot|scatter|bar|barh|hist|pie|imshow|contour|contourf|stem|step|boxplot|violinplot|fill_between|subplots|figure|savefig)\s*\(/.test(
      code
    );
  const needsNumpy = needsMatplotlib || /\b(numpy|np)\b/.test(code);

  const packagesToLoad: string[] = [];
  if (needsNumpy) packagesToLoad.push("numpy");
  if (needsMatplotlib) packagesToLoad.push("matplotlib");

  if (packagesToLoad.length > 0) {
    await pyodide.loadPackage(packagesToLoad);
  }
  await pyodide.loadPackagesFromImports(code);

  pyodide.globals.set("_gradelys_user_code", code);

  const wrapperScript = `
import io
import sys
import base64
import traceback

_gradelys_stdout = io.StringIO()
_gradelys_stderr = io.StringIO()
_gradelys_orig_stdout = sys.stdout
_gradelys_orig_stderr = sys.stderr
_gradelys_images = []
_gradelys_error = None

try:
    import matplotlib
    matplotlib.use("AGG")
    import matplotlib.pyplot as plt
    _gradelys_has_plt = True
    plt.close("all")

    def _gradelys_capture_open_figs():
        for num in list(plt.get_fignums()):
            fig = plt.figure(num)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=140, bbox_inches="tight", facecolor="white")
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode("utf-8")
            _gradelys_images.append("data:image/png;base64," + b64)
        plt.close("all")

    _gradelys_orig_show = plt.show
    def _gradelys_custom_show(*args, **kwargs):
        _gradelys_capture_open_figs()
    plt.show = _gradelys_custom_show
except Exception:
    _gradelys_has_plt = False

sys.stdout = _gradelys_stdout
sys.stderr = _gradelys_stderr

try:
    _gradelys_ns = {}
    exec(_gradelys_user_code, _gradelys_ns)
    if _gradelys_has_plt:
        _gradelys_capture_open_figs()
except Exception:
    _gradelys_error = traceback.format_exc()
finally:
    sys.stdout = _gradelys_orig_stdout
    sys.stderr = _gradelys_orig_stderr
    if _gradelys_has_plt:
        try:
            plt.show = _gradelys_orig_show
            plt.close("all")
        except Exception:
            pass

_gradelys_result = {
    "images": _gradelys_images,
    "stdout": (_gradelys_stdout.getvalue() + _gradelys_stderr.getvalue()).strip(),
    "error": _gradelys_error,
}
`;

  await pyodide.runPythonAsync(wrapperScript);
  const pyResult = pyodide.globals.get("_gradelys_result");
  const jsResult = pyResult.toJs({ dict_converter: Object.fromEntries });
  pyResult.destroy?.();

  return {
    images: Array.isArray(jsResult?.images) ? jsResult.images : [],
    stdout: typeof jsResult?.stdout === "string" ? jsResult.stdout : "",
    error: typeof jsResult?.error === "string" && jsResult.error ? jsResult.error : undefined,
  };
}

export function runPythonCode(code: string): Promise<PythonRunResult> {
  const nextRun = executionQueue.then(
    () => executePythonInternal(code),
    () => executePythonInternal(code)
  );
  executionQueue = nextRun.catch(() => {});
  return nextRun;
}

