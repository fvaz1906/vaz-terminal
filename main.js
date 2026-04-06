const { app, BrowserWindow, clipboard, ipcMain, Menu } = require("electron");
const { spawn } = require("child_process");
const { randomUUID } = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const iconv = require("iconv-lite");
const os = require("os");
const path = require("path");
const { dialog } = require("electron");
const { Client: SshClient } = require("ssh2");

const APP_TITLE = "Vaz Terminal";
const APP_ID = "br.vaztecnologia.vazterminal";
const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 32;
const DEFAULT_HOME_DIR = os.homedir();
const LEGACY_SSH_DATA_DIR = path.join(process.cwd(), "data");
const LEGACY_SSH_DATA_FILE = path.join(LEGACY_SSH_DATA_DIR, "ssh-accesses.json");
const POWERSHELL_STARTUP_COMMAND = [
  "$utf8NoBom = [System.Text.UTF8Encoding]::new($false)",
  "[Console]::InputEncoding = $utf8NoBom",
  "[Console]::OutputEncoding = $utf8NoBom",
  "$OutputEncoding = $utf8NoBom",
  "chcp 65001 > $null",
  "$culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')",
  "[System.Threading.Thread]::CurrentThread.CurrentCulture = $culture",
  "[System.Threading.Thread]::CurrentThread.CurrentUICulture = $culture",
  "$Host.UI.RawUI.WindowTitle = '" + APP_TITLE + "'"
].join("; ");
const CMD_STARTUP_COMMAND = "chcp 65001>nul & title " + APP_TITLE;
const POWERSHELL_COMMANDS = [
  "cat",
  "cd",
  "clear",
  "cls",
  "copy",
  "dir",
  "echo",
  "exit",
  "Get-ChildItem",
  "Get-Content",
  "help",
  "ls",
  "mkdir",
  "move",
  "ni",
  "pwd",
  "remove-item",
  "ren",
  "rm",
  "rmdir",
  "set-location",
  "type"
];
const CMD_COMMANDS = [
  "cd",
  "chcp",
  "cls",
  "copy",
  "del",
  "dir",
  "echo",
  "exit",
  "mkdir",
  "move",
  "rd",
  "ren",
  "rmdir",
  "type"
];

let ptyModule = null;
let ptyLoadError = null;
const sessions = new Map();
let pathCommandCachePromise = null;

try {
  ptyModule = require("node-pty");
} catch (error) {
  ptyLoadError = error;
}

async function ensureSshStorage() {
  const sshDataDir = getSshDataDir();
  const sshDataFile = getSshDataFile();
  await fsp.mkdir(sshDataDir, { recursive: true });

  if (!fs.existsSync(sshDataFile)) {
    if (fs.existsSync(LEGACY_SSH_DATA_FILE)) {
      await fsp.copyFile(LEGACY_SSH_DATA_FILE, sshDataFile);
      return;
    }

    await fsp.writeFile(
      sshDataFile,
      JSON.stringify({ version: 1, exportedAt: null, accesses: [] }, null, 2),
      "utf8"
    );
  }
}

function getSshDataDir() {
  return path.join(app.getPath("userData"), "data");
}

function getSshDataFile() {
  return path.join(getSshDataDir(), "ssh-accesses.json");
}

async function readSshStorage() {
  await ensureSshStorage();
  const raw = await fsp.readFile(getSshDataFile(), "utf8");

  try {
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || 1,
      exportedAt: parsed.exportedAt || null,
      accesses: Array.isArray(parsed.accesses) ? parsed.accesses : []
    };
  } catch {
    return {
      version: 1,
      exportedAt: null,
      accesses: []
    };
  }
}

async function writeSshStorage(accesses, exportedAt = null) {
  await ensureSshStorage();
  const payload = {
    version: 1,
    exportedAt,
    accesses
  };
  await fsp.writeFile(getSshDataFile(), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function normalizeSshAccess(entry = {}) {
  return {
    id: entry.id || randomUUID(),
    name: String(entry.name || "").trim(),
    host: String(entry.host || "").trim(),
    port: String(entry.port || "22").trim() || "22",
    user: String(entry.user || "").trim(),
    password: String(entry.password || ""),
    createdAt: entry.createdAt || new Date().toISOString()
  };
}

function sendToWindow(channel, payload) {
  const window = BrowserWindow.getAllWindows()[0];
  if (window && !window.isDestroyed()) {
    window.webContents.send(channel, payload);
  }
}

function sendSshState(sessionId, sshState, sshMessage) {
  sendToWindow("terminal:meta", {
    sessionId,
    sshState,
    sshMessage
  });
}

function normalizeAutocompleteToken(token = "") {
  return String(token).replace(/\//g, "\\");
}

function getAutocompletePieces(rawToken = "") {
  const quote = rawToken.startsWith('"') ? '"' : rawToken.startsWith("'") ? "'" : "";
  const token = quote ? rawToken.slice(1) : rawToken;
  const normalized = normalizeAutocompleteToken(token);
  const lastSeparator = normalized.lastIndexOf("\\");
  const basePath = lastSeparator >= 0 ? normalized.slice(0, lastSeparator + 1) : "";
  const partial = lastSeparator >= 0 ? normalized.slice(lastSeparator + 1) : normalized;

  return {
    quote,
    basePath,
    partial
  };
}

function getLongestCommonPrefix(values = []) {
  if (values.length === 0) {
    return "";
  }

  let prefix = values[0];
  for (let index = 1; index < values.length; index += 1) {
    const currentValue = values[index];
    let cursor = 0;

    while (
      cursor < prefix.length &&
      cursor < currentValue.length &&
      prefix[cursor].toLowerCase() === currentValue[cursor].toLowerCase()
    ) {
      cursor += 1;
    }

    prefix = prefix.slice(0, cursor);
    if (!prefix) {
      break;
    }
  }

  return prefix;
}

function formatCompletionValue(value, quote) {
  if (!quote && /\s/.test(value)) {
    return `"${value}"`;
  }

  return `${quote}${value}`;
}

async function getPathCommands() {
  if (!pathCommandCachePromise) {
    pathCommandCachePromise = (async () => {
      const commandMap = new Map();
      const extensions = (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD;.PS1")
        .split(";")
        .map((item) => item.toLowerCase());
      const pathEntries = (process.env.PATH || "")
        .split(path.delimiter)
        .map((item) => item.trim())
        .filter(Boolean);

      for (const directory of pathEntries) {
        try {
          const entries = await fsp.readdir(directory, { withFileTypes: true });

          for (const entry of entries) {
            if (!entry.isFile()) {
              continue;
            }

            const extension = path.extname(entry.name).toLowerCase();
            if (!extensions.includes(extension)) {
              continue;
            }

            const baseName = path.basename(entry.name, extension);
            const key = baseName.toLowerCase();
            if (!commandMap.has(key)) {
              commandMap.set(key, baseName);
            }
          }
        } catch {}
      }

      return [...commandMap.values()].sort((left, right) => left.localeCompare(right, "pt-BR"));
    })();
  }

  return pathCommandCachePromise;
}

async function getAutocompleteMatches({ profileId, cwd, token, isCommandPosition }) {
  const safeCwd = cwd && path.isAbsolute(cwd) ? cwd : DEFAULT_HOME_DIR;
  const { quote, basePath, partial } = getAutocompletePieces(token);
  const commands = profileId === "cmd" ? CMD_COMMANDS : POWERSHELL_COMMANDS;
  const results = new Map();

  if (basePath || partial) {
    const targetDirectory = path.resolve(safeCwd, basePath || ".");

    try {
      const entries = await fsp.readdir(targetDirectory, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.name.toLowerCase().startsWith(partial.toLowerCase())) {
          continue;
        }

        const candidate = `${basePath}${entry.name}${entry.isDirectory() ? "\\" : ""}`;
        results.set(candidate.toLowerCase(), {
          value: formatCompletionValue(candidate, quote),
          display: entry.isDirectory() ? `${entry.name}\\` : entry.name
        });
      }
    } catch {}
  }

  if (isCommandPosition && !basePath) {
    const pathCommands = await getPathCommands();
    for (const commandName of [...commands, ...pathCommands]) {
      if (!commandName.toLowerCase().startsWith(partial.toLowerCase())) {
        continue;
      }

      results.set(commandName.toLowerCase(), {
        value: commandName,
        display: commandName
      });
    }
  }

  return [...results.values()];
}

function buildLocalProfile(type = "powershell") {
  if (type === "cmd") {
    return {
      id: "cmd",
      label: "CMD",
      kind: "local",
      cwd: DEFAULT_HOME_DIR,
      executable: process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe",
      env: {
        LANG: "pt_BR.UTF-8",
        LC_ALL: "pt_BR.UTF-8"
      },
      args: ["/K", CMD_STARTUP_COMMAND],
      processArgs: ["/K", CMD_STARTUP_COMMAND]
    };
  }

  const systemRoot = process.env.SystemRoot || "C:\\Windows";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  return {
    id: "powershell",
    label: "PowerShell",
    kind: "local",
    cwd: DEFAULT_HOME_DIR,
    executable: path.join(programFiles, "PowerShell", "7", "pwsh.exe"),
    fallbackExecutable: path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
    env: {
      LANG: "pt_BR.UTF-8",
      LC_ALL: "pt_BR.UTF-8"
    },
    args: ["-NoLogo", "-NoExit", "-Command", POWERSHELL_STARTUP_COMMAND],
    processArgs: [
      "-NoLogo",
      "-NoExit",
      "-Command",
      POWERSHELL_STARTUP_COMMAND
    ]
  };
}

function buildSshProfile(sshConfig) {
  const label = sshConfig.name || `${sshConfig.user}@${sshConfig.host}`;
  return {
    id: `ssh:${sshConfig.id || label}`,
    label,
    kind: "ssh",
    host: String(sshConfig.host || "").trim(),
    port: String(sshConfig.port || 22).trim(),
    user: String(sshConfig.user || "").trim(),
    password: String(sshConfig.password || ""),
    executable: "ssh",
    args: ["-p", String(sshConfig.port || 22), `${sshConfig.user}@${sshConfig.host}`],
    processArgs: ["-tt", "-p", String(sshConfig.port || 22), `${sshConfig.user}@${sshConfig.host}`]
  };
}

function getProfiles() {
  return [
    { id: "powershell", label: "PowerShell", type: "local" },
    { id: "cmd", label: "CMD", type: "local" }
  ];
}

function resolveProfile(payload = {}) {
  if (payload.type === "ssh") {
    return buildSshProfile(payload.sshConfig || {});
  }
  return buildLocalProfile(payload.profileId || "powershell");
}

function destroySession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  try {
    if (session.kind === "pty") {
      session.pty.kill();
    } else if (session.kind === "ssh2") {
      session.stream?.close();
      session.connection?.end();
    } else {
      session.process.kill();
    }
  } catch {}

  sessions.delete(sessionId);
}

function attachPtySession(sessionId, terminal, profile) {
  sessions.set(sessionId, {
    sessionId,
    kind: "pty",
    pty: terminal,
    profile
  });

  terminal.onData((data) => {
    sendToWindow("terminal:data", { sessionId, data });
  });

  terminal.onExit(({ exitCode }) => {
    sendToWindow("terminal:exit", { sessionId, exitCode, profileId: profile.id });
    sessions.delete(sessionId);
  });

  sendToWindow("terminal:meta", {
    sessionId,
    mode: "pty",
    note: null
  });

  return {
    ok: true,
    sessionId,
    profile: {
      id: profile.id,
      label: profile.label,
      kind: profile.kind
    },
    mode: "pty"
  };
}

function attachSsh2Session(sessionId, connection, stream, profile) {
  sessions.set(sessionId, {
    sessionId,
    kind: "ssh2",
    connection,
    stream,
    profile
  });

  stream.on("data", (data) => {
    sendToWindow("terminal:data", { sessionId, data: iconv.decode(data, "utf8") });
  });

  if (stream.stderr?.on) {
    stream.stderr.on("data", (data) => {
      sendToWindow("terminal:data", { sessionId, data: iconv.decode(data, "utf8") });
    });
  }

  stream.on("close", () => {
    sendToWindow("terminal:exit", { sessionId, exitCode: 0, profileId: profile.id });
    sessions.delete(sessionId);
    try {
      connection.end();
    } catch {}
  });

  connection.on("close", () => {
    if (!sessions.has(sessionId)) {
      return;
    }

    sendToWindow("terminal:exit", { sessionId, exitCode: 0, profileId: profile.id });
    sessions.delete(sessionId);
  });

  sendToWindow("terminal:meta", {
    sessionId,
    mode: "pty",
    note: null
  });

  return {
    ok: true,
    sessionId,
    profile: {
      id: profile.id,
      label: profile.label,
      kind: profile.kind
    },
    mode: "pty"
  };
}

function attachProcessSession(sessionId, child, profile) {
  sessions.set(sessionId, {
    sessionId,
    kind: "process",
    process: child,
    profile
  });

  child.stdout.on("data", (data) => {
    sendToWindow("terminal:data", { sessionId, data: iconv.decode(data, "utf8") });
  });

  child.stderr.on("data", (data) => {
    sendToWindow("terminal:data", { sessionId, data: iconv.decode(data, "utf8") });
  });

  child.on("error", (error) => {
    sendToWindow("terminal:data", { sessionId, data: `\r\n[erro] ${error.message}\r\n` });
  });

  child.on("exit", (exitCode) => {
    sendToWindow("terminal:exit", { sessionId, exitCode, profileId: profile.id });
    sessions.delete(sessionId);
  });

  sendToWindow("terminal:meta", {
    sessionId,
    mode: "process",
    note: ptyLoadError
      ? "Modo de compatibilidade ativo. TTY completo via node-pty ainda nao esta disponivel."
      : null
  });

  return {
    ok: true,
    sessionId,
    profile: {
      id: profile.id,
      label: profile.label,
      kind: profile.kind
    },
    mode: "process"
  };
}

function classifySshErrorMessage(message = "") {
  const normalizedMessage = String(message).toLowerCase();

  if (
    normalizedMessage.includes("all configured authentication methods failed") ||
    normalizedMessage.includes("authentication failure") ||
    normalizedMessage.includes("permission denied")
  ) {
    return {
      state: "authFailed",
      message: "Falha de credenciais na conexao SSH."
    };
  }

  if (
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("refused") ||
    normalizedMessage.includes("no route to host") ||
    normalizedMessage.includes("unable to parse") ||
    normalizedMessage.includes("cannot parse")
  ) {
    return {
      state: "failed",
      message: "Falha ao conectar no servidor SSH."
    };
  }

  return {
    state: "failed",
    message: "Conexao SSH encerrada com erro."
  };
}

function createSshConnectionSession(sessionId, profile, cols, rows) {
  return new Promise((resolve) => {
    const connection = new SshClient();
    let settled = false;
    let shellStream = null;

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };

    const fail = (errorMessage, sshState = "failed", sshMessage = errorMessage) => {
      sendSshState(sessionId, sshState, sshMessage);
      try {
        connection.end();
      } catch {}
      finish({
        ok: false,
        error: sshMessage || errorMessage
      });
    };

    sendSshState(sessionId, "connecting", "Conectando ao servidor SSH...");

    connection.on("ready", () => {
      connection.shell(
        {
          term: "xterm-256color",
          cols,
          rows
        },
        (error, stream) => {
          if (error) {
            fail(error.message, "failed", "Nao foi possivel abrir o shell SSH.");
            return;
          }

          shellStream = stream;
          sendSshState(sessionId, "connected", "Conexao SSH estabelecida.");
          finish(attachSsh2Session(sessionId, connection, stream, profile));
        }
      );
    });

    connection.on("keyboard-interactive", (_name, _instructions, _lang, prompts, finishPrompt) => {
      if (prompts?.length) {
        sendSshState(sessionId, "auth", "Aguardando senha da conexao SSH.");
      }
      finishPrompt(prompts.map(() => profile.password || ""));
    });

    connection.on("error", (error) => {
      if (!settled) {
        const classified = classifySshErrorMessage(error.message);
        fail(error.message, classified.state, classified.message);
        return;
      }

      const classified = classifySshErrorMessage(error.message);
      sendSshState(sessionId, classified.state, classified.message);
      if (shellStream) {
        sendToWindow("terminal:data", {
          sessionId,
          data: `\r\n[ssh] ${classified.message}\r\n`
        });
      }
    });

    connection.on("close", () => {
      if (!settled) {
        fail("Conexao encerrada.", "failed", "Conexao SSH encerrada antes de autenticar.");
      }
    });

    connection.connect({
      host: profile.host,
      port: Number(profile.port || 22),
      username: profile.user,
      password: profile.password || undefined,
      tryKeyboard: true,
      readyTimeout: 10000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3
    });
  });
}

function createTerminalSession(payload = {}) {
  const sessionId = payload.sessionId || randomUUID();
  const profile = resolveProfile(payload);
  const cols = payload.cols || DEFAULT_COLS;
  const rows = payload.rows || DEFAULT_ROWS;
  const cwd = profile.cwd || process.cwd();

  destroySession(sessionId);

  if (profile.kind === "ssh") {
    return createSshConnectionSession(sessionId, profile, cols, rows);
  }

  if (ptyModule) {
    try {
      const terminal = ptyModule.spawn(profile.executable, profile.args, {
        name: "xterm-256color",
        cols,
        rows,
        cwd,
        env: {
          ...process.env,
          ...(profile.env || {}),
          TERM: "xterm-256color"
        }
      });
      return attachPtySession(sessionId, terminal, profile);
    } catch (error) {
      if (profile.fallbackExecutable) {
        try {
          const terminal = ptyModule.spawn(profile.fallbackExecutable, profile.args, {
            name: "xterm-256color",
            cols,
            rows,
            cwd,
            env: {
              ...process.env,
              ...(profile.env || {}),
              TERM: "xterm-256color"
            }
          });
          return attachPtySession(sessionId, terminal, profile);
        } catch (fallbackError) {
          ptyLoadError = fallbackError;
        }
      } else {
        ptyLoadError = error;
      }
    }
  }

  try {
    const child = spawn(profile.fallbackExecutable || profile.executable, profile.processArgs || profile.args, {
      cwd,
      env: {
        ...process.env,
        ...(profile.env || {}),
        FORCE_COLOR: "1"
      },
      stdio: "pipe",
      windowsHide: true
    });

    return attachProcessSession(sessionId, child, profile);
  } catch (error) {
    return {
      ok: false,
      error: [
        "Nao foi possivel iniciar a sessao.",
        error.message,
        ptyLoadError ? `Detalhe do node-pty: ${ptyLoadError.message}` : null
      ]
        .filter(Boolean)
        .join("\n")
    };
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    title: APP_TITLE,
    icon: path.join(__dirname, "assets", "icon.png"),
    frame: false,
    backgroundColor: "#07111f",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, "src", "index.html"));
}

app.whenReady().then(() => {
  app.setAppUserModelId(APP_ID);
  ensureSshStorage().catch(() => {});
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("app:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle("app:toggle-maximize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return { isMaximized: false };
  }
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
  return { isMaximized: window.isMaximized() };
});

ipcMain.handle("app:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.handle("terminal:get-profiles", () => {
  return {
    profiles: getProfiles(),
    system: {
      hostname: os.hostname(),
      platform: process.platform,
      cwd: process.cwd()
    }
  };
});

ipcMain.handle("ssh-storage:list", async () => {
  const storage = await readSshStorage();
  return {
    filePath: getSshDataFile(),
    accesses: storage.accesses
  };
});

ipcMain.handle("ssh-storage:save", async (_event, payload = {}) => {
  const storage = await readSshStorage();
  const nextEntry = normalizeSshAccess(payload.access || {});

  const nextItems = [
    ...storage.accesses.filter((item) => item.id !== nextEntry.id),
    nextEntry
  ].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  await writeSshStorage(nextItems, storage.exportedAt);
  return {
    filePath: getSshDataFile(),
    accesses: nextItems
  };
});

ipcMain.handle("ssh-storage:delete", async (_event, payload = {}) => {
  const storage = await readSshStorage();
  const nextItems = storage.accesses.filter((item) => item.id !== payload.id);
  await writeSshStorage(nextItems, storage.exportedAt);
  return {
    filePath: getSshDataFile(),
    accesses: nextItems
  };
});

ipcMain.handle("ssh-storage:import", async () => {
  const result = await dialog.showOpenDialog({
    title: "Importar acessos SSH",
    defaultPath: app.getPath("documents"),
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return {
      canceled: true,
      filePath: getSshDataFile(),
      accesses: (await readSshStorage()).accesses
    };
  }

  const importedRaw = await fsp.readFile(result.filePaths[0], "utf8");
  const imported = JSON.parse(importedRaw);
  const importedAccesses = Array.isArray(imported.accesses) ? imported.accesses : [];
  const normalized = importedAccesses
    .map(normalizeSshAccess)
    .filter((item) => item.name && item.host && item.user);

  await writeSshStorage(normalized, new Date().toISOString());
  return {
    canceled: false,
    filePath: getSshDataFile(),
    importedFrom: result.filePaths[0],
    accesses: normalized
  };
});

ipcMain.handle("ssh-storage:export", async () => {
  const storage = await readSshStorage();
  const result = await dialog.showSaveDialog({
    title: "Exportar acessos SSH",
    defaultPath: path.join(app.getPath("documents"), "ssh-accesses-export.json"),
    filters: [{ name: "JSON", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePath) {
    return {
      canceled: true,
      filePath: getSshDataFile(),
      accesses: storage.accesses
    };
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accesses: storage.accesses
  };

  await fsp.writeFile(result.filePath, JSON.stringify(payload, null, 2), "utf8");
  return {
    canceled: false,
    exportedTo: result.filePath,
    filePath: getSshDataFile(),
    accesses: storage.accesses
  };
});

ipcMain.handle("terminal:start", (_event, payload = {}) => {
  return createTerminalSession(payload);
});

ipcMain.handle("terminal:close-session", (_event, payload = {}) => {
  destroySession(payload.sessionId);
  return { ok: true };
});

ipcMain.handle("terminal:autocomplete", async (_event, payload = {}) => {
  const matches = await getAutocompleteMatches({
    profileId: String(payload.profileId || "powershell"),
    cwd: String(payload.cwd || DEFAULT_HOME_DIR),
    token: String(payload.token || ""),
    isCommandPosition: Boolean(payload.isCommandPosition)
  });

  if (matches.length === 0) {
    return {
      completion: null,
      suggestions: []
    };
  }

  const values = matches.map((item) => item.value);
  const displays = matches.map((item) => item.display);
  const commonPrefix = getLongestCommonPrefix(values);
  const originalToken = String(payload.token || "");

  if (commonPrefix && commonPrefix.length > originalToken.length) {
    return {
      completion: commonPrefix,
      suggestions: matches.length > 1 ? displays : []
    };
  }

  if (matches.length === 1) {
    return {
      completion: values[0],
      suggestions: []
    };
  }

  return {
    completion: null,
    suggestions: displays
  };
});

ipcMain.handle("terminal:show-context-menu", async (event, payload = {}) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return { action: null };
  }

  const selectionText = String(payload.selectionText || "");
  const hasSelection = Boolean(selectionText);
  const clipboardText = clipboard.readText();
  let chosenAction = null;

  const menu = Menu.buildFromTemplate([
    {
      label: "Copiar",
      enabled: hasSelection,
      click: () => {
        clipboard.writeText(selectionText);
        chosenAction = "copy";
      }
    },
    {
      label: "Colar",
      enabled: Boolean(clipboardText),
      click: () => {
        chosenAction = "paste";
      }
    }
  ]);

  return await new Promise((resolve) => {
    menu.popup({
      window,
      x: Number(payload.x) || 0,
      y: Number(payload.y) || 0,
      callback: () => {
        if (chosenAction === "paste") {
          resolve({ action: "paste", text: clipboardText });
          return;
        }

        resolve({ action: chosenAction });
      }
    });
  });
});

ipcMain.on("terminal:input", (_event, payload) => {
  const session = sessions.get(payload.sessionId);
  if (!session) {
    return;
  }

  if (session.kind === "pty") {
    session.pty.write(payload.data);
  } else if (session.kind === "ssh2") {
    session.stream.write(payload.data);
  } else {
    const normalizedData = payload.data === "\r" ? "\r\n" : payload.data;
    session.process.stdin.write(normalizedData, "utf8");
  }
});

ipcMain.on("terminal:resize", (_event, payload = {}) => {
  const session = sessions.get(payload.sessionId);
  if (!session) {
    return;
  }

  const cols = Math.max(40, Number(payload.cols) || DEFAULT_COLS);
  const rows = Math.max(10, Number(payload.rows) || DEFAULT_ROWS);
  if (session.kind === "pty") {
    session.pty.resize(cols, rows);
    return;
  }

  if (session.kind === "ssh2") {
    session.stream?.setWindow(rows, cols, 0, 0);
  }
});

app.on("before-quit", () => {
  [...sessions.keys()].forEach(destroySession);
});
