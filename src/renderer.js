const screenElement = document.getElementById("terminal-screen");
const tabListElement = document.getElementById("tab-list");
const newLocalTabButton = document.getElementById("new-local-tab");
const actionButtons = document.querySelectorAll("[data-action]");
const openSidebarButton = document.getElementById("open-sidebar");
const closeSidebarButton = document.getElementById("close-sidebar");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const settingsPanel = document.getElementById("settings-panel");
const themeGrid = document.getElementById("theme-grid");
const terminalSettingsForm = document.getElementById("terminal-settings-form");
const terminalFontFamilyInput = document.getElementById("terminal-font-family");
const terminalFontSizeInput = document.getElementById("terminal-font-size");
const terminalFontSizeRangeInput = document.getElementById("terminal-font-size-range");
const terminalLineHeightInput = document.getElementById("terminal-line-height");
const terminalLineHeightRangeInput = document.getElementById("terminal-line-height-range");
const terminalFontWeightInput = document.getElementById("terminal-font-weight");
const terminalCursorStyleInput = document.getElementById("terminal-cursor-style");
const terminalCursorBlinkInput = document.getElementById("terminal-cursor-blink");
const resetTerminalSettingsButton = document.getElementById("reset-terminal-settings");
const sshForm = document.getElementById("ssh-form");
const sshList = document.getElementById("ssh-list");
const sshStoragePathElement = document.getElementById("ssh-storage-path");
const importSshButton = document.getElementById("import-ssh-button");
const exportSshButton = document.getElementById("export-ssh-button");
const newSshButton = document.getElementById("new-ssh-button");
const backToSshListButton = document.getElementById("back-to-ssh-list");
const sshListView = document.getElementById("ssh-list-view");
const sshFormView = document.getElementById("ssh-form-view");
const sshFormTitle = document.getElementById("ssh-form-title");
const sshSubmitButton = document.getElementById("ssh-submit-button");
const sshPasswordInput = document.getElementById("ssh-password");
const toggleSshPasswordButton = document.getElementById("toggle-ssh-password");
const settingsNavButtons = document.querySelectorAll(".settings-nav-button");
const settingsSections = document.querySelectorAll("[data-panel-content]");

const THEME_STORAGE_KEY = "vaz-terminal-theme";
const TERMINAL_SETTINGS_STORAGE_KEY = "vaz-terminal-terminal-settings";
const DEFAULT_THEME_ID = localStorage.getItem(THEME_STORAGE_KEY) || "aurora";
const DEFAULT_TERMINAL_SETTINGS = {
  fontFamily: '"Cascadia Mono", Consolas, monospace',
  fontSize: 12,
  lineHeight: 1,
  fontWeight: 500,
  cursorStyle: "block",
  cursorBlink: true,
  letterSpacing: 0
};

const THEME_OPTIONS = [
  ["aurora", "Aurora", "Azul tecnico", "#0a1b30", "#08111d", "#05243a", "#edf6ff", "#43d4ff", "#9eb2c7"],
  ["ember", "Ember", "Laranja quente", "#24100c", "#120909", "#4e2410", "#fff1e8", "#ff9b54", "#d2b19d"],
  ["forest", "Forest", "Verde profundo", "#07140f", "#0a1a13", "#0f3425", "#ecfff5", "#59f1ac", "#a7cdb9"],
  ["violet", "Violet", "Noturno elegante", "#100d1f", "#0a1324", "#2b1d52", "#f1edff", "#a88bff", "#b8b0d8"],
  ["nord", "Nord", "Frio suave", "#0f1722", "#131d2b", "#223a53", "#e7f0fb", "#88c0d0", "#9db3c7"],
  ["dracula", "Dracula", "Roxo classico", "#161320", "#191622", "#3d2d63", "#f8f8f2", "#bd93f9", "#b7b7c8"],
  ["solarized-dark", "Solarized Dark", "Bege e ciano", "#07242c", "#082129", "#123744", "#e6e0c9", "#2aa198", "#9db1ad"],
  ["gruvbox", "Gruvbox", "Vintage quente", "#1f1b16", "#181512", "#4d3828", "#f2e5bc", "#d79921", "#c7b28d"],
  ["midnight", "Midnight", "Azul fechado", "#050913", "#09101b", "#162744", "#e8f1ff", "#6ca0ff", "#97a9c8"],
  ["ocean", "Ocean", "Ciano marinho", "#04151b", "#0a1821", "#0f3a48", "#e6fbff", "#45d7ff", "#96c7d1"],
  ["matrix", "Matrix", "Terminal hacker", "#020804", "#020f07", "#063117", "#b8ffcb", "#41ff75", "#7bb78f"],
  ["rose", "Rose", "Rosado escuro", "#1a0d16", "#1d1020", "#4f2237", "#ffeaf3", "#ff78b2", "#d6aabf"],
  ["slate", "Slate", "Cinza moderno", "#111317", "#171b21", "#283241", "#edf2f7", "#7aa2f7", "#9daab8"],
  ["sunset", "Sunset", "Magenta e cobre", "#22110f", "#24100d", "#5f2b28", "#fff0e8", "#ff8c69", "#d4afa2"],
  ["iceberg", "Iceberg", "Gelo azulado", "#0d141b", "#101b24", "#213747", "#eef8ff", "#8bd3ff", "#abc0d0"],
  ["neon", "Neon", "Ciano vibrante", "#091018", "#081019", "#163a57", "#effbff", "#00e5ff", "#9cc7d0"],
  ["amethyst", "Amethyst", "Ametista", "#130f1f", "#120f22", "#34265c", "#f5eeff", "#c28fff", "#c5b3da"],
  ["sand", "Sand", "Areia noturna", "#1d1710", "#1e160d", "#4a3620", "#fff4df", "#ffbf69", "#cfb998"],
  ["terminal-green", "Terminal Green", "Classico verde", "#041008", "#05120a", "#0a2d16", "#d8ffd8", "#6dff7a", "#92b693"],
  ["carbon", "Carbon", "Preto discreto", "#0c0c0d", "#111214", "#24262a", "#f1f1f1", "#9ca3af", "#a3a3a3"],
  ["ruby", "Ruby", "Vermelho escuro", "#1c0a0d", "#210b10", "#4f1f2a", "#ffeef1", "#ff6b81", "#d1a2aa"],
  ["lagoon", "Lagoon", "Azul tropical", "#07151a", "#091a21", "#11495a", "#e8fdff", "#3de1c9", "#9ec8cb"],
  ["copper", "Copper", "Cobre tecnico", "#20140f", "#1b110d", "#5c341c", "#fff2ea", "#d08c60", "#ccb0a0"],
  ["pastel-night", "Pastel Night", "Suave e limpo", "#11131d", "#141728", "#2a3458", "#f6f7ff", "#93a6ff", "#b7bedf"]
].map(([id, name, description, from, mid, to, text, accent, muted]) => ({
  id,
  name,
  description,
  swatch: `linear-gradient(135deg, ${from}, ${mid} 58%, ${to})`,
  from,
  mid,
  to,
  text,
  accent,
  muted
}));

const TERMINAL_THEMES = Object.fromEntries(
  THEME_OPTIONS.map((theme) => [
    theme.id,
    {
      background: "rgba(0, 0, 0, 0)",
      foreground: theme.text,
      cursor: theme.accent,
      cursorAccent: theme.mid,
      selectionBackground: `${theme.accent}33`,
      black: theme.mid,
      red: "#ff7d7d",
      green: theme.accent,
      yellow: "#ffd36e",
      blue: theme.accent,
      magenta: "#d28fff",
      cyan: theme.accent,
      white: theme.text,
      brightBlack: theme.muted,
      brightRed: "#ffb0b0",
      brightGreen: theme.accent,
      brightYellow: "#ffe6a6",
      brightBlue: theme.accent,
      brightMagenta: "#e4b4ff",
      brightCyan: "#abf5ff",
      brightWhite: "#ffffff"
    }
  ])
);

const tabs = new Map();
let activeTabId = null;
let activeSettingsPanel = "themes";
let activeSshView = "list";
let sshAccesses = [];
let sshStoragePath = "";
let editingSshAccessId = null;

const SSH_STATE_LABELS = {
  connecting: "Conectando",
  auth: "Aguardando senha",
  connected: "Conectado",
  failed: "Falha",
  authFailed: "Credenciais invalidas"
};

function getStoredTerminalSettings() {
  try {
    const rawSettings = localStorage.getItem(TERMINAL_SETTINGS_STORAGE_KEY);
    if (!rawSettings) {
      return { ...DEFAULT_TERMINAL_SETTINGS };
    }

    const parsedSettings = JSON.parse(rawSettings);
    return {
      ...DEFAULT_TERMINAL_SETTINGS,
      ...parsedSettings,
      fontSize: Number(parsedSettings.fontSize ?? DEFAULT_TERMINAL_SETTINGS.fontSize),
      lineHeight: Number(parsedSettings.lineHeight ?? DEFAULT_TERMINAL_SETTINGS.lineHeight),
      fontWeight: Number(parsedSettings.fontWeight ?? DEFAULT_TERMINAL_SETTINGS.fontWeight),
      cursorBlink: Boolean(parsedSettings.cursorBlink ?? DEFAULT_TERMINAL_SETTINGS.cursorBlink)
    };
  } catch {
    return { ...DEFAULT_TERMINAL_SETTINGS };
  }
}

function persistTerminalSettings(settings) {
  localStorage.setItem(TERMINAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function syncTerminalSettingsInputs(settings) {
  terminalFontFamilyInput.value = settings.fontFamily;
  terminalFontSizeInput.value = String(settings.fontSize);
  terminalFontSizeRangeInput.value = String(settings.fontSize);
  terminalLineHeightInput.value = String(settings.lineHeight);
  terminalLineHeightRangeInput.value = String(settings.lineHeight);
  terminalFontWeightInput.value = String(settings.fontWeight);
  terminalCursorStyleInput.value = settings.cursorStyle;
  terminalCursorBlinkInput.checked = settings.cursorBlink;
}

function collectTerminalSettingsFromForm() {
  return {
    fontFamily: terminalFontFamilyInput.value || DEFAULT_TERMINAL_SETTINGS.fontFamily,
    fontSize: Math.min(22, Math.max(10, Number(terminalFontSizeInput.value) || DEFAULT_TERMINAL_SETTINGS.fontSize)),
    lineHeight: Math.min(1.6, Math.max(1, Number(terminalLineHeightInput.value) || DEFAULT_TERMINAL_SETTINGS.lineHeight)),
    fontWeight: Number(terminalFontWeightInput.value) || DEFAULT_TERMINAL_SETTINGS.fontWeight,
    cursorStyle: terminalCursorStyleInput.value || DEFAULT_TERMINAL_SETTINGS.cursorStyle,
    cursorBlink: terminalCursorBlinkInput.checked,
    letterSpacing: 0
  };
}

function applyTerminalSettings(settings, options = {}) {
  const normalizedSettings = {
    ...DEFAULT_TERMINAL_SETTINGS,
    ...settings
  };

  persistTerminalSettings(normalizedSettings);
  syncTerminalSettingsInputs(normalizedSettings);

  tabs.forEach((tab) => {
    tab.terminal.options.fontFamily = normalizedSettings.fontFamily;
    tab.terminal.options.fontSize = normalizedSettings.fontSize;
    tab.terminal.options.lineHeight = normalizedSettings.lineHeight;
    tab.terminal.options.fontWeight = normalizedSettings.fontWeight;
    tab.terminal.options.cursorStyle = normalizedSettings.cursorStyle;
    tab.terminal.options.cursorBlink = normalizedSettings.cursorBlink;
    tab.terminal.options.letterSpacing = normalizedSettings.letterSpacing;
    scheduleTabFit(tab.id);
  });

  if (!options.skipFocus && activeTabId) {
    tabs.get(activeTabId)?.terminal.focus();
  }
}

function getTheme(themeId) {
  return THEME_OPTIONS.find((theme) => theme.id === themeId) || THEME_OPTIONS[0];
}

function applyTheme(themeId) {
  const theme = getTheme(themeId);
  document.documentElement.style.setProperty(
    "--app-bg",
    `linear-gradient(135deg, ${theme.from} 0%, ${theme.mid} 55%, ${theme.to} 100%)`
  );
  document.documentElement.style.setProperty(
    "--terminal-bg",
    `linear-gradient(180deg, color-mix(in srgb, ${theme.accent} 6%, transparent), transparent 10%), linear-gradient(180deg, ${theme.mid} 0%, ${theme.from} 100%)`
  );
  document.documentElement.style.setProperty("--border", `color-mix(in srgb, ${theme.accent} 28%, transparent)`);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--text", theme.text);
  document.documentElement.style.setProperty("--muted", theme.muted);
  document.documentElement.style.setProperty(
    "--panel",
    `color-mix(in srgb, ${theme.mid} 78%, rgba(7, 19, 34, 0.78))`
  );
  document.documentElement.style.setProperty(
    "--panel-strong",
    `color-mix(in srgb, ${theme.from} 82%, rgba(5, 16, 30, 0.96))`
  );

  tabs.forEach((tab) => {
    tab.terminal.options.theme = TERMINAL_THEMES[theme.id];
  });

  localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  renderThemeOptions();
}

function renderThemeOptions() {
  const activeTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  themeGrid.innerHTML = "";

  THEME_OPTIONS.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `theme-card${theme.id === activeTheme ? " active" : ""}`;
    button.innerHTML = `
      <span class="theme-swatch" style="background:${theme.swatch}"></span>
      <span class="theme-name">${theme.name}</span>
      <span class="theme-desc">${theme.description}</span>
    `;
    button.addEventListener("click", () => applyTheme(theme.id));
    themeGrid.appendChild(button);
  });
}

function openSidebar() {
  settingsPanel.classList.add("open");
  settingsPanel.setAttribute("aria-hidden", "false");
  sidebarBackdrop.hidden = false;
}

function closeSidebar() {
  settingsPanel.classList.remove("open");
  settingsPanel.setAttribute("aria-hidden", "true");
  sidebarBackdrop.hidden = true;
}

function setSettingsPanel(panelId) {
  activeSettingsPanel = panelId;
  settingsNavButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelId);
  });
  settingsSections.forEach((section) => {
    section.classList.toggle("settings-section-active", section.dataset.panelContent === panelId);
  });

  if (panelId === "ssh") {
    setSshView("list");
  }
}

function resetSshForm() {
  editingSshAccessId = null;
  sshForm.reset();
  document.getElementById("ssh-port").value = "22";
  sshPasswordInput.type = "password";
  toggleSshPasswordButton.setAttribute("aria-label", "Mostrar senha");
  toggleSshPasswordButton.setAttribute("aria-pressed", "false");
  sshFormTitle.textContent = "Novo acesso SSH";
  sshSubmitButton.textContent = "Salvar acesso";
}

function populateSshForm(access) {
  editingSshAccessId = access.id;
  document.getElementById("ssh-name").value = access.name || "";
  document.getElementById("ssh-host").value = access.host || "";
  document.getElementById("ssh-port").value = access.port || "22";
  document.getElementById("ssh-user").value = access.user || "";
  sshPasswordInput.value = access.password || "";
  sshPasswordInput.type = "password";
  toggleSshPasswordButton.setAttribute("aria-label", "Mostrar senha");
  toggleSshPasswordButton.setAttribute("aria-pressed", "false");
  sshFormTitle.textContent = "Editar acesso SSH";
  sshSubmitButton.textContent = "Salvar alterações";
}

function setSshView(viewId) {
  activeSshView = viewId;
  sshListView.classList.toggle("ssh-view-active", viewId === "list");
  sshFormView.classList.toggle("ssh-view-active", viewId === "form");

  if (viewId === "form") {
    document.getElementById("ssh-name").focus();
    return;
  }

  resetSshForm();
}

function renderSshAccesses() {
  sshStoragePathElement.hidden = true;

  sshList.innerHTML = "";

  if (sshAccesses.length === 0) {
    const empty = document.createElement("p");
    empty.className = "ssh-empty";
    empty.textContent = "Nenhum acesso SSH salvo ainda.";
    sshList.appendChild(empty);
    return;
  }

  sshAccesses.forEach((access) => {
    const item = document.createElement("article");
    item.className = "ssh-item";
    item.innerHTML = `
      <div class="ssh-item-top">
        <div>
          <strong>${access.name}</strong>
          <span>${access.user}@${access.host}:${access.port}</span>
          <span>${access.password ? "Senha salva no JSON do projeto" : "Sem senha salva"}</span>
        </div>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "ssh-item-actions";

    const connectButton = document.createElement("button");
    connectButton.type = "button";
    connectButton.className = "ssh-item-connect";
    connectButton.textContent = "Conectar";
    connectButton.addEventListener("click", async () => {
      closeSidebar();
      await createTab({
        label: access.name,
        startPayload: {
          type: "ssh",
          sshConfig: access
        }
      });
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "ssh-item-edit";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => {
      populateSshForm(access);
      setSshView("form");
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ssh-item-delete";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", async () => {
      const result = await window.sshStorageApi.remove({ id: access.id });
      sshAccesses = result.accesses;
      sshStoragePath = result.filePath;
      renderSshAccesses();
    });

    actions.append(connectButton, editButton, deleteButton);
    item.appendChild(actions);
    sshList.appendChild(item);
  });
}

function updatePromptFromOutput(tab, data) {
  const normalized = data.replace(/\r/g, "");
  const lines = normalized.split("\n");

  for (const line of lines) {
    const match = line.match(/((?:PS )?[A-Za-z]:\\.*?>)\s?$/);
    if (match) {
      tab.lastPrompt = `${match[1]} `;
    }
  }
}

function redrawCompatibilityInput(tab) {
  const prompt = tab.lastPrompt || "";
  const cursorIndex = Math.max(0, Math.min(tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length, tab.compatibilityBuffer.length));
  const moveLeft = tab.compatibilityBuffer.length - cursorIndex;
  tab.compatibilityCursorIndex = cursorIndex;
  tab.terminal.write(`\r\x1b[2K${prompt}${tab.compatibilityBuffer}`);
  if (moveLeft > 0) {
    tab.terminal.write(`\x1b[${moveLeft}D`);
  }
}

function setCompatibilityBuffer(tab, nextBuffer, cursorIndex = nextBuffer.length) {
  tab.compatibilityBuffer = nextBuffer;
  tab.compatibilityCursorIndex = Math.max(0, Math.min(cursorIndex, nextBuffer.length));
}

function insertIntoCompatibilityBuffer(tab, text) {
  const cursorIndex = Math.max(0, Math.min(tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length, tab.compatibilityBuffer.length));
  const nextBuffer =
    tab.compatibilityBuffer.slice(0, cursorIndex) + text + tab.compatibilityBuffer.slice(cursorIndex);
  setCompatibilityBuffer(tab, nextBuffer, cursorIndex + text.length);
  redrawCompatibilityInput(tab);
}

function moveCompatibilityCursor(tab, delta) {
  const nextIndex = Math.max(
    0,
    Math.min(tab.compatibilityBuffer.length, (tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length) + delta)
  );
  if (nextIndex === tab.compatibilityCursorIndex) {
    return;
  }
  tab.compatibilityCursorIndex = nextIndex;
  redrawCompatibilityInput(tab);
}

function getPromptDirectory(prompt = "") {
  const match = prompt.match(/(?:PS )?([A-Za-z]:\\.*)> ?$/);
  return match ? match[1] : "";
}

function getCompatibilityTokenContext(buffer = "") {
  const match = buffer.match(/^(.*?)([^\s]*)$/s);
  return {
    leading: match?.[1] || "",
    token: match?.[2] || ""
  };
}

async function runCompatibilityAutocomplete(tab) {
  const bufferBeforeCursor = tab.compatibilityBuffer.slice(0, tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length);
  const { leading, token } = getCompatibilityTokenContext(bufferBeforeCursor);
  if (!token) {
    return;
  }

  const result = await window.terminalApi.autocomplete({
    profileId: tab.profile?.id || "powershell",
    cwd: getPromptDirectory(tab.lastPrompt),
    token,
    isCommandPosition: leading.trim().length === 0
  });

  if (result?.completion) {
    const suffix = tab.compatibilityBuffer.slice(tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length);
    const nextBuffer = `${leading}${result.completion}${suffix}`;
    setCompatibilityBuffer(tab, nextBuffer, `${leading}${result.completion}`.length);
    redrawCompatibilityInput(tab);
    return;
  }

  if (result?.suggestions?.length) {
    tab.terminal.write(`\r\n${result.suggestions.join("    ")}\r\n`);
    redrawCompatibilityInput(tab);
  }
}

function submitCompatibilityCommand(tab) {
  const rawCommand = tab.compatibilityBuffer;
  const command = rawCommand.trim().toLowerCase();

  if (rawCommand.trim()) {
    tab.compatibilityHistory = [...tab.compatibilityHistory.filter((item) => item !== rawCommand), rawCommand];
  }

  tab.historyIndex = tab.compatibilityHistory.length;
  setCompatibilityBuffer(tab, "");

  if (command === "clear" || command === "cls") {
    tab.terminal.clear();
    tab.terminal.reset();
    if (tab.lastPrompt) {
      tab.terminal.write(tab.lastPrompt);
    }
    return;
  }

  tab.terminal.write("\r\n");
  tab.pendingEcho = `${rawCommand}\r\n`;
  window.terminalApi.write({ sessionId: tab.id, data: `${rawCommand}\r\n` });
}

async function copyTerminalSelection(tab) {
  const selection = tab.terminal.getSelection();
  if (!selection) {
    return false;
  }

  await window.clipboardApi.writeText(selection);
  tab.terminal.clearSelection();
  return true;
}

async function pasteIntoCompatibilityTab(tab, text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (const character of normalized) {
    if (character === "\n") {
      submitCompatibilityCommand(tab);
      continue;
    }

    insertIntoCompatibilityBuffer(tab, character);
  }
}

async function pasteIntoTab(tab, text) {
  const normalized = String(text || "");
  if (!normalized) {
    return;
  }

  if (tab.mode === "process") {
    await pasteIntoCompatibilityTab(tab, normalized);
    return;
  }

  window.terminalApi.write({
    sessionId: tab.id,
    data: normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "\r")
  });
}

async function handleTerminalClipboardShortcut(tab, domEvent) {
  const key = domEvent.key.toLowerCase();
  const hasModifier = domEvent.ctrlKey || domEvent.metaKey;
  const wantsCopy =
    (hasModifier && key === "c" && tab.terminal.hasSelection()) ||
    (domEvent.ctrlKey && key === "insert") ||
    (hasModifier && domEvent.shiftKey && key === "c");
  const wantsPaste =
    (hasModifier && key === "v") ||
    (domEvent.shiftKey && key === "insert") ||
    (hasModifier && domEvent.shiftKey && key === "v");

  if (wantsCopy) {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    const copied = await copyTerminalSelection(tab);
    if (copied || key === "insert" || domEvent.shiftKey) {
      return true;
    }
  }

  if (wantsPaste) {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    const text = await window.clipboardApi.readText();
    if (text) {
      await pasteIntoTab(tab, text);
    }
    return true;
  }

  return false;
}

function bindTerminalContextMenu(target, tab) {
  if (!target) {
    return;
  }

  target.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      void window.terminalApi
        .showContextMenu({
          x: event.x ?? event.clientX,
          y: event.y ?? event.clientY,
          selectionText: tab.terminal.getSelection()
        })
        .then(async (result) => {
          if (result?.action === "paste" && result.text) {
            await pasteIntoTab(tab, result.text);
            tab.terminal.focus();
          }
        });
    },
    true
  );
}

function getSshStatusClass(state) {
  switch (state) {
    case "connecting":
      return "ssh-connecting";
    case "auth":
      return "ssh-auth";
    case "connected":
      return "ssh-connected";
    case "failed":
    case "authFailed":
      return "ssh-failed";
    default:
      return "";
  }
}

function setSshConnectionState(tab, state, message = "") {
  if (!tab || tab.profile?.kind !== "ssh") {
    return;
  }

  const nextMessage = message || SSH_STATE_LABELS[state] || "";
  if (tab.sshState === state && tab.sshMessage === nextMessage) {
    return;
  }

  tab.sshState = state;
  tab.sshMessage = nextMessage;

  if (nextMessage && tab.lastSshNotice !== nextMessage) {
    tab.terminal.writeln("");
    tab.terminal.writeln(`\x1b[33m[ssh] ${nextMessage}\x1b[0m`);
    tab.lastSshNotice = nextMessage;
  }

  renderTabList();
}

function detectSshConnectionState(tab, data) {
  if (!tab || tab.profile?.kind !== "ssh") {
    return;
  }

  const normalized = String(data || "").replace(/\r/g, "");

  if (/are you sure you want to continue connecting/i.test(normalized)) {
    setSshConnectionState(tab, "auth", "Confirmacao do host solicitada.");
    return;
  }

  if (/(password|passphrase).*:/i.test(normalized)) {
    setSshConnectionState(tab, "auth", "Aguardando senha da conexao SSH.");
    return;
  }

  if (/permission denied|authentication failed|access denied/i.test(normalized)) {
    setSshConnectionState(tab, "authFailed", "Falha de credenciais na conexao SSH.");
    return;
  }

  if (
    /could not resolve hostname|connection refused|connection timed out|no route to host|host key verification failed|connection closed|connection reset/i.test(
      normalized
    )
  ) {
    setSshConnectionState(tab, "failed", "Falha ao conectar no servidor SSH.");
    return;
  }

  const promptDetected = /(^|\n)[^\n]*[@][^\n]*[#$>] ?$/m.test(normalized) || /last login/i.test(normalized);
  if (promptDetected) {
    setSshConnectionState(tab, "connected", "Conexao SSH estabelecida.");
  }
}

function renderTabList() {
  tabListElement.innerHTML = "";

  tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-chip${tab.id === activeTabId ? " active" : ""}`;
    button.title =
      tab.profile?.kind === "ssh" && tab.sshMessage ? `${tab.baseLabel || tab.label} · ${tab.sshMessage}` : tab.label;

    if (tab.profile?.kind === "ssh") {
      const status = document.createElement("span");
      status.className = `tab-chip-status ${getSshStatusClass(tab.sshState)}`.trim();
      button.appendChild(status);
    }

    const label = document.createElement("span");
    label.className = "tab-chip-label";
    label.textContent =
      tab.profile?.kind === "ssh" && tab.sshMessage ? `${tab.baseLabel || tab.label} · ${tab.sshMessage}` : tab.label;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "tab-close";
    closeButton.textContent = "X";
    closeButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await closeTab(tab.id);
    });

    button.append(label, closeButton);
    button.addEventListener("click", () => activateTab(tab.id));
    tabListElement.appendChild(button);
  });
}

function resizeTab(tab) {
  tab.fitAddon.fit();
  window.terminalApi.resize({
    sessionId: tab.id,
    cols: tab.terminal.cols,
    rows: tab.terminal.rows
  });
}

function resizeActiveTab() {
  const tab = tabs.get(activeTabId);
  if (!tab) {
    return;
  }

  resizeTab(tab);
}

function scheduleTabFit(tabId) {
  const runFit = () => {
    const tab = tabs.get(tabId);
    if (!tab || activeTabId !== tabId) {
      return;
    }
    resizeTab(tab);
  };

  requestAnimationFrame(runFit);
  setTimeout(runFit, 30);
  setTimeout(runFit, 120);
}

function activateTab(tabId) {
  activeTabId = tabId;
  tabs.forEach((tab) => {
    tab.pane.classList.toggle("active", tab.id === tabId);
  });
  renderTabList();
  scheduleTabFit(tabId);
}

function createTerminalInstance(themeId) {
  const terminalSettings = getStoredTerminalSettings();
  return new window.Terminal({
    allowTransparency: true,
    convertEol: true,
    cursorBlink: terminalSettings.cursorBlink,
    cursorInactiveStyle: "outline",
    cursorStyle: terminalSettings.cursorStyle,
    fontFamily: terminalSettings.fontFamily,
    fontSize: terminalSettings.fontSize,
    fontWeight: terminalSettings.fontWeight,
    lineHeight: terminalSettings.lineHeight,
    letterSpacing: terminalSettings.letterSpacing,
    theme: TERMINAL_THEMES[themeId]
  });
}

function handleCompatibilityKeyEvent(tab, domEvent) {
  if (domEvent.type !== "keydown") {
    return true;
  }

  if (tab.mode !== "process") {
    return true;
  }

  const key = domEvent.key;
  const isCtrl = domEvent.ctrlKey || domEvent.metaKey;

  if (isCtrl && key.toLowerCase() === "c") {
    if (tab.terminal.hasSelection()) {
      return true;
    }
    tab.terminal.write("^C\r\n");
    setCompatibilityBuffer(tab, "");
    window.terminalApi.write({ sessionId: tab.id, data: "\u0003" });
    return false;
  }

  if (key === "Backspace") {
    const cursorIndex = tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length;
    if (cursorIndex > 0) {
      const nextBuffer =
        tab.compatibilityBuffer.slice(0, cursorIndex - 1) + tab.compatibilityBuffer.slice(cursorIndex);
      setCompatibilityBuffer(tab, nextBuffer, cursorIndex - 1);
      redrawCompatibilityInput(tab);
    }
    return false;
  }

  if (key === "Delete") {
    const cursorIndex = tab.compatibilityCursorIndex ?? tab.compatibilityBuffer.length;
    if (cursorIndex < tab.compatibilityBuffer.length) {
      const nextBuffer =
        tab.compatibilityBuffer.slice(0, cursorIndex) + tab.compatibilityBuffer.slice(cursorIndex + 1);
      setCompatibilityBuffer(tab, nextBuffer, cursorIndex);
      redrawCompatibilityInput(tab);
    }
    return false;
  }

  if (key === "Enter") {
    submitCompatibilityCommand(tab);
    return false;
  }

  if (key === "ArrowUp") {
    if (tab.compatibilityHistory.length > 0) {
      tab.historyIndex = Math.max(0, tab.historyIndex - 1);
      setCompatibilityBuffer(tab, tab.compatibilityHistory[tab.historyIndex] || "");
      redrawCompatibilityInput(tab);
    }
    return false;
  }

  if (key === "ArrowDown") {
    if (tab.compatibilityHistory.length > 0) {
      tab.historyIndex = Math.min(tab.compatibilityHistory.length, tab.historyIndex + 1);
      setCompatibilityBuffer(tab, tab.compatibilityHistory[tab.historyIndex] || "");
      redrawCompatibilityInput(tab);
    }
    return false;
  }

  if (key === "ArrowLeft") {
    moveCompatibilityCursor(tab, -1);
    return false;
  }

  if (key === "ArrowRight") {
    moveCompatibilityCursor(tab, 1);
    return false;
  }

  if (key === "Home") {
    tab.compatibilityCursorIndex = 0;
    redrawCompatibilityInput(tab);
    return false;
  }

  if (key === "End") {
    tab.compatibilityCursorIndex = tab.compatibilityBuffer.length;
    redrawCompatibilityInput(tab);
    return false;
  }

  if (key === "Tab") {
    void runCompatibilityAutocomplete(tab);
    return false;
  }

  if (!isCtrl && !domEvent.altKey && key.length === 1) {
    insertIntoCompatibilityBuffer(tab, key);
    return false;
  }

  return true;
}

function wireProcessKeyboard(tab) {
  tab.terminal.textarea?.addEventListener(
    "keydown",
    (domEvent) => {
      if (tab.mode === "process" && domEvent.key === "Tab") {
        domEvent.preventDefault();
      }
    },
    true
  );

  if (typeof tab.terminal.attachCustomKeyEventHandler === "function") {
    tab.terminal.attachCustomKeyEventHandler((domEvent) => handleCompatibilityKeyEvent(tab, domEvent));
  }
}

async function createTab({ label, startPayload }) {
  const tabId = crypto.randomUUID();
  const pane = document.createElement("div");
  pane.className = "terminal-pane";
  screenElement.appendChild(pane);

  const fitAddon = new window.FitAddon.FitAddon();
  const terminal = createTerminalInstance(localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID);
  terminal.loadAddon(fitAddon);
  terminal.open(pane);

  const tab = {
    id: tabId,
    label,
    baseLabel: label,
    pane,
    terminal,
    fitAddon,
    mode: "pty",
    compatibilityBuffer: "",
    compatibilityCursorIndex: 0,
    compatibilityHistory: [],
    historyIndex: 0,
    lastPrompt: "",
    pendingEcho: "",
    resizeObserver: null,
    profile: null,
    sshState: null,
    sshMessage: "",
    lastSshNotice: "",
    isClosing: false
  };

  if (startPayload?.type === "ssh") {
    tab.profile = {
      id: `ssh:${tabId}`,
      label,
      kind: "ssh"
    };
    tab.sshState = "connecting";
    tab.sshMessage = SSH_STATE_LABELS.connecting;
  }

  tabs.set(tabId, tab);

  pane.addEventListener(
    "keydown",
    (event) => {
      void handleTerminalClipboardShortcut(tab, event);
    },
    true
  );

  bindTerminalContextMenu(pane, tab);
  bindTerminalContextMenu(terminal.element, tab);
  bindTerminalContextMenu(terminal.textarea, tab);
  bindTerminalContextMenu(terminal.element?.querySelector(".xterm-screen"), tab);

  const resizeObserver = new ResizeObserver(() => {
    scheduleTabFit(tabId);
  });
  resizeObserver.observe(screenElement);
  resizeObserver.observe(pane);
  tab.resizeObserver = resizeObserver;

  terminal.onData((data) => {
    if (tab.mode === "pty") {
      window.terminalApi.write({ sessionId: tab.id, data });
    }
  });

  wireProcessKeyboard(tab);
  activateTab(tabId);

  const result = await window.terminalApi.start({
    sessionId: tabId,
    cols: terminal.cols,
    rows: terminal.rows,
    ...startPayload
  });

  if (!result.ok) {
    terminal.writeln("\x1b[31mNao foi possivel iniciar a sessao.\x1b[0m");
    terminal.writeln(result.error);
  } else {
    tab.label = result.profile.label;
    tab.baseLabel = result.profile.label;
    tab.profile = result.profile;
    if (tab.profile.kind === "ssh") {
      tab.sshState = "connecting";
      tab.sshMessage = SSH_STATE_LABELS.connecting;
      terminal.writeln(`\x1b[33m[ssh] ${SSH_STATE_LABELS.connecting}...\x1b[0m`);
    }
    renderTabList();
  }

  scheduleTabFit(tabId);
  terminal.focus();
}

async function closeTab(tabId) {
  const tab = tabs.get(tabId);
  if (!tab || tab.isClosing) {
    return;
  }

  tab.isClosing = true;

  await window.terminalApi.closeSession({ sessionId: tabId });
  tab.resizeObserver?.disconnect();
  tab.terminal.dispose();
  tab.pane.remove();
  tabs.delete(tabId);

  if (activeTabId === tabId) {
    const nextTab = tabs.keys().next().value || null;
    activeTabId = nextTab;
    if (nextTab) {
      activateTab(nextTab);
    }
  }

  renderTabList();

  if (tabs.size === 0) {
    await createTab({
      label: "PowerShell",
      startPayload: { profileId: "powershell" }
    });
  }
}

actionButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const action = button.dataset.action;

    if (action === "minimize") {
      await window.desktopWindow.minimize();
      return;
    }

    if (action === "maximize") {
      await window.desktopWindow.toggleMaximize();
      return;
    }

    if (action === "close") {
      await window.desktopWindow.close();
    }
  });
});

openSidebarButton.addEventListener("click", openSidebar);
closeSidebarButton.addEventListener("click", closeSidebar);
sidebarBackdrop.addEventListener("click", closeSidebar);

newLocalTabButton.addEventListener("click", async () => {
  await createTab({
    label: "PowerShell",
    startPayload: { profileId: "powershell" }
  });
});

settingsNavButtons.forEach((button) => {
  button.addEventListener("click", () => setSettingsPanel(button.dataset.panel));
});

terminalFontSizeRangeInput.addEventListener("input", () => {
  terminalFontSizeInput.value = terminalFontSizeRangeInput.value;
  applyTerminalSettings(collectTerminalSettingsFromForm());
});

terminalFontSizeInput.addEventListener("input", () => {
  terminalFontSizeRangeInput.value = terminalFontSizeInput.value;
  applyTerminalSettings(collectTerminalSettingsFromForm());
});

terminalLineHeightRangeInput.addEventListener("input", () => {
  terminalLineHeightInput.value = terminalLineHeightRangeInput.value;
  applyTerminalSettings(collectTerminalSettingsFromForm());
});

terminalLineHeightInput.addEventListener("input", () => {
  terminalLineHeightRangeInput.value = terminalLineHeightInput.value;
  applyTerminalSettings(collectTerminalSettingsFromForm());
});

terminalSettingsForm.addEventListener("change", () => {
  applyTerminalSettings(collectTerminalSettingsFromForm());
});

resetTerminalSettingsButton.addEventListener("click", () => {
  applyTerminalSettings(DEFAULT_TERMINAL_SETTINGS);
});

newSshButton.addEventListener("click", () => {
  resetSshForm();
  setSshView("form");
});

backToSshListButton.addEventListener("click", () => {
  setSshView("list");
});

toggleSshPasswordButton.addEventListener("click", () => {
  const isHidden = sshPasswordInput.type === "password";
  sshPasswordInput.type = isHidden ? "text" : "password";
  toggleSshPasswordButton.setAttribute("aria-label", isHidden ? "Ocultar senha" : "Mostrar senha");
  toggleSshPasswordButton.setAttribute("aria-pressed", String(isHidden));
  sshPasswordInput.focus();
});

sshForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(sshForm);
  const entry = {
    id: editingSshAccessId || undefined,
    name: String(formData.get("name") || "").trim(),
    host: String(formData.get("host") || "").trim(),
    port: String(formData.get("port") || "22").trim(),
    user: String(formData.get("user") || "").trim(),
    password: String(formData.get("password") || "")
  };

  if (!entry.name || !entry.host || !entry.user) {
    return;
  }

  const result = await window.sshStorageApi.save({ access: entry });
  sshAccesses = result.accesses;
  sshStoragePath = result.filePath;
  renderSshAccesses();
  setSshView("list");
});

importSshButton.addEventListener("click", async () => {
  const result = await window.sshStorageApi.importFile();
  if (result.canceled) {
    return;
  }
  sshAccesses = result.accesses;
  sshStoragePath = result.filePath;
  renderSshAccesses();
  setSshView("list");
});

exportSshButton.addEventListener("click", async () => {
  await window.sshStorageApi.exportFile();
});

window.terminalApi.onData(({ sessionId, data }) => {
  const tab = tabs.get(sessionId);
  if (!tab) {
    return;
  }

  let nextData = data;

  if (tab.mode === "process" && tab.pendingEcho) {
    if (tab.pendingEcho.startsWith(nextData)) {
      tab.pendingEcho = tab.pendingEcho.slice(nextData.length);
      return;
    }

    if (nextData.startsWith(tab.pendingEcho)) {
      nextData = nextData.slice(tab.pendingEcho.length);
      tab.pendingEcho = "";
    } else {
      tab.pendingEcho = "";
    }
  }

  if (!nextData) {
    return;
  }

  detectSshConnectionState(tab, nextData);
  updatePromptFromOutput(tab, nextData);
  tab.terminal.write(nextData);
});

window.terminalApi.onExit(({ sessionId, exitCode }) => {
  const tab = tabs.get(sessionId);
  if (!tab) {
    return;
  }

  if (tab.profile?.kind === "ssh") {
    if (tab.sshState === "connecting" || tab.sshState === "auth") {
      setSshConnectionState(tab, "failed", "Conexao SSH encerrada antes de autenticar.");
    }
    setTimeout(() => {
      void closeTab(sessionId);
    }, 0);
    return;
  }

  tab.terminal.writeln("");
  tab.terminal.writeln(`\x1b[33mSessao finalizada com codigo ${exitCode}.\x1b[0m`);
});

window.terminalApi.onMeta((payload) => {
  const { sessionId, mode } = payload;
  const tab = tabs.get(sessionId);
  if (!tab) {
    return;
  }

  tab.mode = mode || "pty";
  if (tab.mode === "pty") {
    setCompatibilityBuffer(tab, "");
  }

  if (payload?.sshState) {
    setSshConnectionState(tab, payload.sshState, payload.sshMessage);
  }
});

window.addEventListener("resize", () => {
  if (activeTabId) {
    scheduleTabFit(activeTabId);
  }
});

async function bootstrap() {
  await window.terminalApi.getProfiles();
  applyTheme(DEFAULT_THEME_ID);
  applyTerminalSettings(getStoredTerminalSettings(), { skipFocus: true });
  setSettingsPanel(activeSettingsPanel);
  setSshView(activeSshView);
  renderThemeOptions();

  try {
    const sshState = await window.sshStorageApi.list();
    sshAccesses = sshState.accesses;
    sshStoragePath = sshState.filePath;
  } catch {
    sshAccesses = [];
    sshStoragePath = "";
  }
  renderSshAccesses();

  await createTab({
    label: "PowerShell",
    startPayload: { profileId: "powershell" }
  });
}

bootstrap();
