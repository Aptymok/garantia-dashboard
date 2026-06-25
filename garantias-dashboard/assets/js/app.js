const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const LS_KEY = "garantias-dashboard-config-v1";
const state = { rows: [], columns: [], config: loadConfig() };

function loadConfig() {
  const base = window.GARANTIAS_DEFAULT_CONFIG || {};
  try {
    return { ...base, ...(JSON.parse(localStorage.getItem(LS_KEY) || "{}")) };
  } catch {
    return { ...base };
  }
}

function saveConfig(config) {
  state.config = { ...state.config, ...config };
  localStorage.setItem(LS_KEY, JSON.stringify(state.config));
  applyConfig();
}

function applyConfig() {
  $("#excelUrlInput").value = state.config.excelUrl || "";
  $("#sheetNameInput").value = state.config.sheetName || "Seguimiento";
  $("#tableNameInput").value = state.config.tableName || "tblGarantias";
  $("#configExcelUrl").value = state.config.excelUrl || "";
  $("#configCopilotUrl").value = state.config.copilotUrl || "";
  $("#configFlowUrl").value = state.config.flowUrl || "";
  $("#configFlowKey").value = state.config.flowKey || "";
  $("#copilotFrame").src = state.config.copilotUrl || "about:blank";
  const flowStatus = $("#flowStatus");
  if (state.config.flowUrl) {
    flowStatus.textContent = "Endpoint activo";
    flowStatus.classList.add("ok");
  } else {
    flowStatus.textContent = "Sin endpoint";
    flowStatus.classList.remove("ok");
  }
}

function setRoute(route) {
  $$(".nav-item").forEach(btn => btn.classList.toggle("is-active", btn.dataset.route === route));
  $$(".route").forEach(page => page.classList.toggle("is-visible", page.dataset.page === route));
  document.querySelector(".shell").dataset.view = route;
}

function parseDelimited(text) {
  const clean = text.trim();
  if (!clean) return { columns: [], rows: [] };
  const delimiter = clean.includes("\t") ? "\t" : ",";
  const lines = clean.split(/\r?\n/).filter(Boolean);
  const columns = splitLine(lines[0], delimiter).map(normalizeHeader);
  const rows = lines.slice(1).map(line => {
    const values = splitLine(line, delimiter);
    return columns.reduce((acc, col, index) => {
      acc[col] = values[index] ?? "";
      return acc;
    }, {});
  });
  return { columns, rows };
}

function splitLine(line, delimiter) {
  if (delimiter === "\t") return line.split("\t");
  const out = [];
  let cur = "";
  let quote = false;
  for (const ch of line) {
    if (ch === '"') quote = !quote;
    else if (ch === "," && !quote) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(v => v.replace(/^"|"$/g, "").trim());
}

function normalizeHeader(h) {
  return String(h || "").trim().replace(/^\[|\]$/g, "").toUpperCase();
}

function toNumber(value) {
  const n = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function get(row, names) {
  for (const name of names) {
    const key = normalizeHeader(name);
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  }
  return "";
}

function analyzeRows(rows) {
  const metrics = {
    critical: 0,
    high: 0,
    internal: 0,
    dataRisk: 0
  };
  rows.forEach(row => {
    const prioridad = String(get(row, ["PRIORIDAD"])).toUpperCase();
    const bloque = String(get(row, ["BLOQUE OPERATIVO"])).toUpperCase();
    const riesgo = String(get(row, ["RIESGO DATO"])).toUpperCase();
    if (prioridad.includes("CRITICA") || bloque.includes("30D") || bloque.includes("GARANTIA VENCIDA")) metrics.critical += 1;
    if (prioridad === "ALTA" || bloque.includes("24H")) metrics.high += 1;
    if (prioridad.includes("INTERNA") || bloque.includes("INTERNO VENCIDO")) metrics.internal += 1;
    if (riesgo && riesgo !== "OK") metrics.dataRisk += 1;
  });
  return metrics;
}

function render() {
  const rows = [...state.rows].sort((a, b) => {
    const orderA = toNumber(get(a, ["ORDEN"]));
    const orderB = toNumber(get(b, ["ORDEN"]));
    const daysA = toNumber(get(a, ["DIAS PROVEEDOR", "DIAS ABIERTO"]));
    const daysB = toNumber(get(b, ["DIAS PROVEEDOR", "DIAS ABIERTO"]));
    return orderA - orderB || daysB - daysA;
  });
  const metrics = analyzeRows(rows);
  $("#metricCritical").textContent = metrics.critical;
  $("#metricHigh").textContent = metrics.high;
  $("#metricInternal").textContent = metrics.internal;
  $("#metricDataRisk").textContent = metrics.dataRisk;
  $("#rowCountPill").textContent = `${rows.length} filas`;
  renderPriority(rows.slice(0, 8));
  renderTable(rows.slice(0, 120));
}

function renderPriority(rows) {
  const box = $("#priorityList");
  if (!rows.length) {
    box.className = "priority-list empty";
    box.textContent = "Pega datos o carga la muestra para activar el tablero.";
    return;
  }
  box.className = "priority-list";
  box.innerHTML = rows.map(row => {
    const codigo = get(row, ["CODIGO"]);
    const year = get(row, ["AÑO", "ANIO"]);
    const proveedor = get(row, ["PROVEEDOR"]);
    const bloque = get(row, ["BLOQUE OPERATIVO"]);
    const accion = get(row, ["ACCION RECOMENDADA"]);
    const dias = get(row, ["DIAS PROVEEDOR", "DIAS ABIERTO"]);
    return `<article class="priority-item">
      <strong>${escapeHtml(codigo)} · ${escapeHtml(year)}</strong>
      <span>${escapeHtml(proveedor)}</span>
      <span>${escapeHtml(accion)}</span>
      <em class="tag">${escapeHtml(bloque)} · ${escapeHtml(dias)} días</em>
    </article>`;
  }).join("");
}

function renderTable(rows) {
  const preferred = ["ORDEN", "PRIORIDAD", "BLOQUE OPERATIVO", "RIESGO DATO", "CODIGO", "AÑO", "DIAS ABIERTO", "DIAS PROVEEDOR", "ESTATUS", "PROVEEDOR", "CONTRATO", "TIPO EQUIPO", "MARCA", "MODELO", "SERIE", "INVENTARIO", "FALLA REPORTADA", "ACCION RECOMENDADA"];
  const cols = preferred.filter(col => state.columns.includes(col));
  const finalCols = cols.length ? cols : state.columns.slice(0, 16);
  const thead = $("#casesTable thead");
  const tbody = $("#casesTable tbody");
  thead.innerHTML = finalCols.length ? `<tr>${finalCols.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr>` : "";
  tbody.innerHTML = rows.map(row => `<tr>${finalCols.map(c => `<td>${escapeHtml(row[c] ?? "")}</td>`).join("")}</tr>`).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

async function loadDax() {
  const res = await fetch("dax/garantias_operational_export.template.dax");
  $("#daxEditor").value = await res.text();
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
}

async function runSync() {
  const log = $("#syncLog");
  const flowUrl = state.config.flowUrl;
  if (!flowUrl) {
    log.textContent = "No hay endpoint de Power Automate configurado. Entra a Config y pega la URL del Flow.";
    setRoute("config");
    return;
  }
  let daxQuery = $("#daxEditor").value.trim();
  if (!daxQuery) {
    const res = await fetch("dax/garantias_operational_export.template.dax");
    daxQuery = await res.text();
  }
  const payload = {
    action: "RUN_DAX_EXPORT_TO_SHAREPOINT_EXCEL",
    requestedAt: new Date().toISOString(),
    daxQuery,
    targetWorkbookUrl: $("#excelUrlInput").value,
    targetSheetName: $("#sheetNameInput").value || "Seguimiento",
    targetTableName: $("#tableNameInput").value || "tblGarantias"
  };
  log.textContent = "Enviando solicitud al Flow...";
  try {
    const response = await fetch(flowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(state.config.flowKey ? { "X-Dashboard-Key": state.config.flowKey } : {})
      },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    log.textContent = `HTTP ${response.status}\n\n${text || "Sin cuerpo de respuesta."}`;
  } catch (error) {
    log.textContent = `Error al llamar el Flow:\n${error.message}`;
  }
}

function downloadCsv() {
  if (!state.rows.length) return;
  const cols = state.columns;
  const csv = [cols.join(","), ...state.rows.map(row => cols.map(col => csvCell(row[col])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `garantias_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function loadSample() {
  const res = await fetch("data/sample-report.tsv");
  const text = await res.text();
  $("#dataPaste").value = text;
  const parsed = parseDelimited(text);
  state.columns = parsed.columns;
  state.rows = parsed.rows;
  render();
}

function buildIframe() {
  const url = location.origin + location.pathname.replace(/index\.html$/, "");
  return `<iframe src="${url}" width="100%" height="960" style="border:0;width:100%;min-height:960px;" allow="clipboard-read; clipboard-write; fullscreen; web-share" loading="lazy"></iframe>`;
}

function init() {
  applyConfig();
  loadDax().catch(() => {});
  render();
  $$(".nav-item").forEach(btn => btn.addEventListener("click", () => setRoute(btn.dataset.route)));
  $("#openExcelBtn").addEventListener("click", () => window.open(state.config.excelUrl, "_blank", "noopener"));
  $("#openCopilotBtn").addEventListener("click", () => window.open(state.config.copilotUrl, "_blank", "noopener"));
  $("#openCopilotBtn2").addEventListener("click", () => window.open(state.config.copilotUrl, "_blank", "noopener"));
  $("#runSyncBtn").addEventListener("click", () => { setRoute("sync"); runSync(); });
  $("#syncNowBtn").addEventListener("click", runSync);
  $("#loadSampleBtn").addEventListener("click", loadSample);
  $("#parseDataBtn").addEventListener("click", () => {
    const parsed = parseDelimited($("#dataPaste").value);
    state.columns = parsed.columns;
    state.rows = parsed.rows;
    render();
  });
  $("#clearDataBtn").addEventListener("click", () => {
    $("#dataPaste").value = "";
    state.columns = [];
    state.rows = [];
    render();
  });
  $("#downloadCsvBtn").addEventListener("click", downloadCsv);
  $("#loadDaxBtn").addEventListener("click", loadDax);
  $("#copyDaxBtn").addEventListener("click", async () => {
    await copy($("#daxEditor").value);
    $("#runtimeNotice").innerHTML = "<strong>DAX copiado.</strong><span>Pégalo en Power BI DAX Query View o deja que el Flow lo use.</span>";
  });
  $("#saveConfigBtn").addEventListener("click", () => {
    saveConfig({
      excelUrl: $("#configExcelUrl").value.trim(),
      copilotUrl: $("#configCopilotUrl").value.trim(),
      flowUrl: $("#configFlowUrl").value.trim(),
      flowKey: $("#configFlowKey").value,
      sheetName: $("#sheetNameInput").value.trim() || "Seguimiento",
      tableName: $("#tableNameInput").value.trim() || "tblGarantias"
    });
    $("#configOutput").textContent = "Configuración guardada en este navegador. No se subió a GitHub.";
  });
  $("#resetConfigBtn").addEventListener("click", () => {
    localStorage.removeItem(LS_KEY);
    state.config = loadConfig();
    applyConfig();
    $("#configOutput").textContent = "Configuración restaurada.";
  });
  $("#copyIframeBtn").addEventListener("click", async () => {
    const iframe = buildIframe();
    await copy(iframe);
    $("#configOutput").textContent = iframe;
  });
  const params = new URLSearchParams(location.search);
  if (params.get("view") === "embed") document.body.classList.add("embed-mode");
}

document.addEventListener("DOMContentLoaded", init);
