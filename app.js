// =============================================
//  STATE & SETTINGS
// =============================================
let state = {
  lastReading:    0,
  currentReading: 0,
  photoBase64:    null,
  saved:          false,
};

let settings = {
  price:              0.30,
  turnusDay:          23,
  email:              '',
  senderName:         'Joannis Nastas',
  senderStreet:       'Birkenstraße 2',
  senderCity:         '67590 Monsheim',
  recipientCompany:   'Contecon Software GmbH',
  recipientPerson:    'David Kisser',
  recipientStreet:    'Brückenstraße 2',
  recipientCity:      '67551 Worms',
  signature:          false, // Neu: Option für Unterschriftsfeld
  theme:              'dark' // Neu: Thema (dark, light, highvoltage)
};

// =============================================
//  DOM REFERENCES
// =============================================
const el = {
  headerDate:           document.getElementById('header-date'),
  settingsBtn:          document.getElementById('settings-btn'),
  reminderBanner:       document.getElementById('reminder-banner'),
  lastReadingDisplay:   document.getElementById('last-reading-display'),
  priceDisplay:         document.getElementById('price-display'),
  cameraContainer:      document.getElementById('camera-container'),
  video:                document.getElementById('camera-preview'),
  captureBtn:           document.getElementById('capture-btn'),
  previewContainer:     document.getElementById('preview-container'),
  imagePreview:         document.getElementById('image-preview'),
  ocrOverlay:           document.getElementById('ocr-overlay'),
  ocrStatus:            document.getElementById('ocr-status'),
  readingInput:         document.getElementById('reading-input'),
  retakeBtn:            document.getElementById('retake-btn'),
  calcSection:          document.getElementById('calculation-section'),
  oldReadingDisplay:    document.getElementById('old-reading-display'),
  newReadingDisplay:    document.getElementById('new-reading-display'),
  consumptionDisplay:   document.getElementById('consumption-display'),
  totalDisplay:         document.getElementById('total-display'),
  calcDetailText:       document.getElementById('calc-detail-text'),
  saveBtn:              document.getElementById('save-btn'),
  pdfBtn:               document.getElementById('generate-pdf-btn'),
  exportCsvBtn:         document.getElementById('export-csv-btn'),
  toast:                document.getElementById('toast'),
  settingsModal:        document.getElementById('settings-modal'),
  closeSettingsBtn:     document.getElementById('close-settings-btn'),
  saveSettingsBtn:      document.getElementById('save-settings-btn'),
  settingPrice:         document.getElementById('setting-price'),
  settingDay:           document.getElementById('setting-day'),
  settingEmail:         document.getElementById('setting-email'),
  settingSenderName:    document.getElementById('setting-sender-name'),
  settingSenderStreet:  document.getElementById('setting-sender-street'),
  settingSenderCity:    document.getElementById('setting-sender-city'),
  settingRecipComp:     document.getElementById('setting-recipient-company'),
  settingRecipPerson:   document.getElementById('setting-recipient-person'),
  settingRecipStreet:   document.getElementById('setting-recipient-street'),
  settingRecipCity:     document.getElementById('setting-recipient-city'),
  settingSignature:     document.getElementById('setting-signature'),
  settingTheme:         document.getElementById('setting-theme'),
  historyBtn:           document.getElementById('history-btn'),
  historyModal:         document.getElementById('history-modal'),
  closeHistoryBtn:      document.getElementById('close-history-btn'),
  historyList:          document.getElementById('history-list'),
  deleteLastBtn:        document.getElementById('delete-last-btn'),
  statYearKwh:          document.getElementById('stat-year-kwh'),
  statYearEuro:         document.getElementById('stat-year-euro'),
  exportBackupBtn:      document.getElementById('export-backup-btn'),
  importBackupBtn:      document.getElementById('import-backup-btn'),
  importFileInput:      document.getElementById('import-file-input'),
};

// =============================================
//  INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  loadSettings();
  applyTheme();
  setHeaderDate();
  checkReminder();
  loadLocalReading();
  updatePriceDisplay();
  updateStats();

  el.captureBtn.addEventListener('click', capturePhoto);
  el.retakeBtn.addEventListener('click', startCamera);
  el.readingInput.addEventListener('input', onReadingInput);
  el.saveBtn.addEventListener('click', saveLocalReading);
  el.pdfBtn.addEventListener('click', generateAndMailPDF);
  el.exportCsvBtn.addEventListener('click', exportCSV);
  el.settingsBtn.addEventListener('click', openSettings);
  el.closeSettingsBtn.addEventListener('click', closeSettings);
  el.saveSettingsBtn.addEventListener('click', saveSettings);
  el.historyBtn.addEventListener('click', openHistory);
  el.closeHistoryBtn.addEventListener('click', closeHistory);
  el.deleteLastBtn.addEventListener('click', deleteLastEntry);
  el.exportBackupBtn.addEventListener('click', exportBackup);
  el.importBackupBtn.addEventListener('click', () => el.importFileInput.click());
  el.importFileInput.addEventListener('change', importBackup);

  startCamera();
});

// =============================================
//  SETTINGS
// =============================================
function loadSettings() {
  const saved = localStorage.getItem('wallbox_settings');
  if (saved) settings = { ...settings, ...JSON.parse(saved) };
}

function openSettings() {
  el.settingPrice.value        = settings.price;
  el.settingDay.value          = settings.turnusDay;
  el.settingEmail.value        = settings.email;
  el.settingSenderName.value   = settings.senderName;
  el.settingSenderStreet.value = settings.senderStreet;
  el.settingSenderCity.value   = settings.senderCity;
  el.settingRecipComp.value    = settings.recipientCompany;
  el.settingRecipPerson.value  = settings.recipientPerson;
  el.settingRecipStreet.value  = settings.recipientStreet;
  el.settingRecipCity.value    = settings.recipientCity;
  el.settingSignature.checked  = settings.signature;
  el.settingTheme.value        = settings.theme || 'dark';
  el.settingsModal.classList.remove('hidden');
}

function closeSettings() {
  el.settingsModal.classList.add('hidden');
}

function saveSettings() {
  settings.price            = parseFloat(String(el.settingPrice.value).replace(',', '.')) || 0.30;
  settings.turnusDay        = parseInt(el.settingDay.value) || 23;
  settings.email            = el.settingEmail.value.trim();
  settings.senderName       = el.settingSenderName.value.trim();
  settings.senderStreet     = el.settingSenderStreet.value.trim();
  settings.senderCity       = el.settingSenderCity.value.trim();
  settings.recipientCompany = el.settingRecipComp.value.trim();
  settings.recipientPerson  = el.settingRecipPerson.value.trim();
  settings.recipientStreet  = el.settingRecipStreet.value.trim();
  settings.recipientCity    = el.settingRecipCity.value.trim();
  settings.signature        = el.settingSignature.checked;
  settings.theme            = el.settingTheme.value;

  localStorage.setItem('wallbox_settings', JSON.stringify(settings));
  closeSettings();
  applyTheme();
  updatePriceDisplay();
  updateStats();
  checkReminder();
  if (!el.calcSection.classList.contains('hidden') && !state.saved) onReadingInput();
  showToast('Einstellungen gespeichert', 'success');
}

// =============================================
//  HELPERS & DASHBOARD
// =============================================
function updateStats() {
  const history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const yearEntries = history.filter(r => new Date(r.isoDate).getFullYear() === currentYear);
  const totalKwh = yearEntries.reduce((sum, r) => sum + r.consumption, 0);
  const totalEuro = yearEntries.reduce((sum, r) => sum + r.total, 0);
  
  el.statYearKwh.textContent = totalKwh.toFixed(1).replace('.', ',') + ' kWh';
  el.statYearEuro.textContent = totalEuro.toFixed(2).replace('.', ',') + ' €';
}

function openHistory() {
  renderHistory();
  el.historyModal.classList.remove('hidden');
}

function closeHistory() {
  el.historyModal.classList.add('hidden');
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  if (history.length === 0) {
    el.historyList.innerHTML = '<p style="text-align:center; color:var(--text-3); padding:20px;">Noch keine Einträge vorhanden.</p>';
    el.deleteLastBtn.style.display = 'none';
    return;
  }
  
  el.deleteLastBtn.style.display = 'block';
  el.historyList.innerHTML = history.slice().reverse().map((r, idx) => {
    const realIdx = history.length - 1 - idx;
    return `
      <div class="history-item">
        <div class="history-info">
          <span class="history-date">${r.date}</span>
          <span class="history-meta">${r.consumption.toFixed(1)} kWh à ${r.price.toFixed(4).replace('.',',')}€</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="history-amount">${r.total.toFixed(2).replace('.',',')} €</span>
          <button class="icon-btn-sm" onclick="downloadPastPDF(${realIdx})" title="PDF laden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function downloadPastPDF(idx) {
  const history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  if (history[idx]) {
    generateAndMailPDF(history[idx]);
  }
}

function exportBackup() {
  const data = {
    history: JSON.parse(localStorage.getItem('wallbox_history') || '[]'),
    settings: settings,
    lastReading: localStorage.getItem('wallbox_last_reading'),
    version: '1.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `Wallbox_Backup_${new Date().toISOString().slice(0,10)}.json`
  });
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup exportiert', 'success');
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.history || !data.settings) throw new Error('Ungültiges Format');
      
      if (!confirm('Bestehende Daten werden überschrieben. Fortfahren?')) return;
      
      localStorage.setItem('wallbox_history', JSON.stringify(data.history));
      localStorage.setItem('wallbox_settings', JSON.stringify(data.settings));
      if (data.lastReading) localStorage.setItem('wallbox_last_reading', data.lastReading);
      
      showToast('Daten erfolgreich importiert!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch(err) {
      showToast('Fehler beim Import: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function deleteLastEntry() {
  if (!confirm('Letzten Eintrag wirklich unwiderruflich löschen?')) return;
  
  let history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  if (history.length === 0) return;
  
  history.pop();
  localStorage.setItem('wallbox_history', JSON.stringify(history));
  
  // Update state for next scan
  const lastReading = history.length > 0 ? history[history.length - 1].newReading : 0;
  localStorage.setItem('wallbox_last_reading', String(lastReading));
  state.lastReading = lastReading;
  
  loadLocalReading();
  updateStats();
  renderHistory();
  showToast('Eintrag gelöscht', 'info');
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn(e));
}

function vibrate(p = [30]) { if ('vibrate' in navigator) navigator.vibrate(p); }

function showToast(msg, type = 'info', dur = 2800) {
  el.toast.textContent = msg;
  el.toast.className = `toast show ${type}`;
  el.toast.classList.remove('hidden');
  clearTimeout(el.toast._t);
  el.toast._t = setTimeout(() => el.toast.classList.remove('show'), dur);
}

function setHeaderDate() {
  const now  = new Date();
  const date = now.toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'long' });
  const time = now.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
  el.headerDate.innerHTML = `${date}<br>${time}`;
  setTimeout(setHeaderDate, 60000 - now.getSeconds() * 1000);
}

function updatePriceDisplay() {
  el.priceDisplay.textContent = settings.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' €/kWh';
}

function checkReminder() {
  const today = new Date();
  const key   = `${today.getFullYear()}-${today.getMonth() + 1}`;
  const billed = localStorage.getItem('lastBilledMonth');
  if (today.getDate() >= settings.turnusDay && billed !== key)
    el.reminderBanner.classList.remove('hidden');
  else
    el.reminderBanner.classList.add('hidden');
}

function loadLocalReading() {
  const s = localStorage.getItem('wallbox_last_reading');
  if (s !== null) {
    state.lastReading = parseFloat(s);
    el.lastReadingDisplay.textContent = fmt(state.lastReading) + ' kWh';
  } else {
    el.lastReadingDisplay.textContent = '–';
  }
}

function fmt(v, d = 1) { return v.toFixed(d).replace('.', ','); }
function fmtEuro(v)     { return fmt(v, 2) + ' €'; }
function fmtKwh(v)      { return fmt(v, 1) + ' kWh'; }

// =============================================
//  CAMERA
// =============================================
let cameraStream = null;

async function startCamera() {
  state.photoBase64    = null;
  state.currentReading = 0;
  state.saved          = false;
  el.readingInput.value = '';
  el.previewContainer.classList.add('hidden');
  el.cameraContainer.classList.remove('hidden');
  el.calcSection.classList.add('hidden');
  el.saveBtn.disabled = true;
  el.pdfBtn.disabled  = true;
  el.saveBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg> Speichern & Bestätigen`;
  el.saveBtn.style.cssText = '';

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    el.video.srcObject = cameraStream;
  } catch (err) {
    showToast('Kamera nicht verfügbar – Berechtigung prüfen.', 'error', 4000);
  }
}

function stopCamera() {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
}

async function capturePhoto() {
  vibrate([30]);
  const canvas = document.createElement('canvas');
  canvas.width  = el.video.videoWidth;
  canvas.height = el.video.videoHeight;
  canvas.getContext('2d').drawImage(el.video, 0, 0);
  state.photoBase64 = canvas.toDataURL('image/jpeg', 0.55);
  el.imagePreview.src = state.photoBase64;
  stopCamera();
  el.cameraContainer.classList.add('hidden');
  el.previewContainer.classList.remove('hidden');
  el.ocrOverlay.classList.remove('done');
  el.ocrStatus.textContent = 'Erkenne Zählerstand…';
  runOCR(state.photoBase64);
}

// =============================================
//  OCR
// =============================================
async function runOCR(img) {
  try {
    const res = await Tesseract.recognize(img, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text')
          el.ocrStatus.textContent = `Erkenne… ${Math.round(m.progress * 100)}%`;
      }
    });
    const text    = res.data.text.replace(/,/g, '.').replace(/[Oo]/g, '0');
    const matches = [...text.matchAll(/\d{3,6}(\.\d{1,3})?/g)];
    if (matches.length > 0) {
      const best = matches.reduce((a, b) => a[0].length >= b[0].length ? a : b);
      el.readingInput.value = parseFloat(best[0]).toFixed(1);
      el.ocrStatus.textContent = '✓ Erkannt – bitte prüfen';
      el.ocrOverlay.classList.add('done');
      onReadingInput();
    } else {
      el.ocrStatus.textContent = '⚠ Nichts erkannt – manuell eingeben';
    }
  } catch(e) {
    el.ocrStatus.textContent = '✕ OCR fehlgeschlagen – manuell eingeben';
  }
}

// =============================================
//  CALCULATION
// =============================================
function onReadingInput() {
  const current = parseFloat(String(el.readingInput.value).replace(',', '.'));
  const parentCard = el.readingInput.closest('.reading-card');

  if (isNaN(current) || current <= 0) {
    el.calcSection.classList.add('hidden');
    el.saveBtn.disabled = true;
    if (parentCard) parentCard.classList.remove('invalid');
    return;
  }

  // Plausibilitätsprüfung
  if (current < state.lastReading) {
    el.calcSection.classList.add('hidden');
    el.saveBtn.disabled = true;
    if (parentCard) parentCard.classList.add('invalid');
    el.ocrStatus.textContent = '⚠ Wert niedriger als letzter Stand!';
    return;
  }

  if (parentCard) parentCard.classList.remove('invalid');
  state.currentReading = current;
  const diff  = Math.max(0, current - state.lastReading);
  const total = diff * settings.price;
  el.oldReadingDisplay.textContent = fmtKwh(state.lastReading);
  el.newReadingDisplay.textContent = fmtKwh(current);
  el.consumptionDisplay.textContent = fmtKwh(diff);
  el.totalDisplay.textContent = fmtEuro(total);
  el.calcDetailText.textContent = `${fmt(diff)} kWh × ${settings.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €/kWh`;
  el.calcSection.classList.remove('hidden');
  el.saveBtn.disabled = false;
}

// =============================================
//  SAVE
// =============================================
function saveLocalReading() {
  if (state.saved) return;
  const current = state.currentReading;
  const diff    = Math.max(0, current - state.lastReading);
  const total   = diff * settings.price;
  const today   = new Date();

  const history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  history.push({
    date:        today.toLocaleDateString('de-DE'),
    isoDate:     today.toISOString(),
    oldReading:  state.lastReading,
    newReading:  current,
    consumption: diff,
    price:       settings.price,
    total:       total,
    photo:       state.photoBase64,
  });
  localStorage.setItem('wallbox_history', JSON.stringify(history));
  localStorage.setItem('wallbox_last_reading', String(current));
  localStorage.setItem('lastBilledMonth', `${today.getFullYear()}-${today.getMonth() + 1}`);

  state.saved = true;
  state.lastReading = current;
  el.lastReadingDisplay.textContent = fmtKwh(current);
  updateStats();
  el.reminderBanner.classList.add('hidden');
  el.saveBtn.innerHTML = '✓ Gespeichert';
  el.saveBtn.style.background = '#0d3d26';
  el.saveBtn.style.color = 'var(--accent)';
  el.saveBtn.disabled = true;
  el.pdfBtn.disabled  = false;
  vibrate([30, 50, 80]);
  showToast('Zählerstand gespeichert!', 'success');
}

// =============================================
//  CSV EXPORT
// =============================================
function exportCSV() {
  const history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  if (!history.length) { showToast('Noch keine Einträge vorhanden.', 'error'); return; }
  const header = 'Datum;Zaehler Alt (kWh);Zaehler Neu (kWh);Verbrauch (kWh);Preis/kWh (EUR);Summe (EUR)\n';
  const rows   = history.map(r =>
    `${r.date};${r.oldReading.toFixed(1)};${r.newReading.toFixed(1)};${r.consumption.toFixed(1)};${r.price.toFixed(2)};${r.total.toFixed(2)}`
  ).join('\n');
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `Wallbox_Verlauf_${new Date().toLocaleDateString('de-DE').replace(/\./g,'-')}.csv`
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV heruntergeladen', 'success');
}

// =============================================
//  PDF – Einseitig, Auto-Bildgröße
// =============================================
function generateAndMailPDF(customRec = null) {
  const history = JSON.parse(localStorage.getItem('wallbox_history') || '[]');
  if (!history.length && !customRec) { showToast('Keine Daten für PDF vorhanden.', 'error'); return; }

  const rec  = customRec || history[history.length - 1];
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Colours & Config ──────────────────────
  const C_BLACK  = [30,  30,  30];
  const C_MID    = [100, 110, 120];
  const C_ACCENT = [0,   160, 90]; // Green (subtle lines)
  
  const PW  = 210; 
  const PH  = 297; 
  const ML  = 20;  
  const MR  = PW - ML;

  // ── TOP HEADER (Minimalist) ─────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C_BLACK);
  doc.text('WALLBOX ABRECHNUNGS-APP', ML, 12);

  // Simple line separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.1);
  doc.line(ML, 15, MR, 15);

  // ── SENDER BLOCK ─────────────────────────
  let y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C_BLACK);
  doc.text(settings.senderName   || '', ML, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C_MID);
  y += 5;
  doc.text(settings.senderStreet || '', ML, y);
  y += 5;
  doc.text(settings.senderCity   || '', ML, y);

  // ── RECIPIENT BLOCK ──────────────────────
  let ry = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C_BLACK);
  doc.text(settings.recipientCompany || '', MR, ry, { align: 'right' });
  ry += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C_MID);
  if (settings.recipientPerson) {
    doc.text('z.Hd. ' + settings.recipientPerson, MR, ry, { align: 'right' });
    ry += 5;
  }
  doc.text(settings.recipientStreet || '', MR, ry, { align: 'right' });
  ry += 5;
  doc.text(settings.recipientCity   || '', MR, ry, { align: 'right' });

  // ── MAIN DIVIDER ─────────────────────────
  y = 52;
  doc.setDrawColor(...C_ACCENT);
  doc.setLineWidth(0.5);
  doc.line(ML, y, MR, y);
  y += 8;

  // ── DATE ─────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C_MID);
  doc.text(`${settings.senderCity || ''}, ${rec.date}`, MR, y, { align: 'right' });
  y += 10;

  // ── DOCUMENT TITLE ───────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...C_BLACK);
  doc.text('Spesenabrechnung – Wallbox-Ladestrom', ML, y);
  y += 7;

  const period = new Date(rec.isoDate).toLocaleString('de-DE', { month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C_MID);
  doc.text(`Abrechnungszeitraum: ${period}`, ML, y);
  y += 10;

  // ── MAIN TABLE ───────────────────────────
  doc.autoTable({
    startY: y,
    margin: { left: ML, right: ML },
    head: [['Position', 'Details', 'Betrag']],
    body: [
      ['Zählerstand (alt)',  `${rec.oldReading.toFixed(1)} kWh`, ''],
      ['Zählerstand (neu)',  `${rec.newReading.toFixed(1)} kWh`, ''],
      ['Verbrauch (Differenz)', `${rec.consumption.toFixed(1)} kWh`, ''],
      ['Strompreis',         `${rec.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €/kWh`,   ''],
    ],
    foot: [['Gesamtbetrag (netto)', '', `${rec.total.toFixed(2)} €`]],
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: C_BLACK, 
      fontStyle: 'bold', 
      fontSize: 9,
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    footStyles: { 
      fillColor: [248, 248, 248], 
      textColor: C_BLACK, 
      fontStyle: 'bold', 
      fontSize: 11,
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    columnStyles: { 
      0: { cellWidth: 65 }, 
      1: { cellWidth: 65 }, 
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' } 
    },
    alternateRowStyles: { fillColor: [253, 253, 253] },
    bodyStyles: { fontSize: 10, textColor: C_BLACK, cellPadding: 4, lineWidth: 0.1, lineColor: [235, 235, 235] },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── LEGAL NOTE ───────────────────────────
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...C_MID);
  const noteLines = doc.splitTextToSize(
    'Hierbei handelt es sich um eine steuerfreie Erstattung der Stromkosten für das Laden des Dienstfahrzeugs ' +
    'an der privaten Wallbox gemäß §3 Nr. 46 EStG (steuerfreier Arbeitgeberersatz für Ladestrom). ' +
    'Der Zählerstand wurde mittels geeichtem Eltako MID-Zähler ermittelt. Das Beweisfoto ist beigefügt.',
    PW - ML * 2
  );
  doc.text(noteLines, ML, y);
  y += noteLines.length * 4 + 8;

  // ── SIGNATURE BLOCK (Optional) ───────────
  if (settings.signature) {
    y += 10;
    doc.setDrawColor(...C_MID);
    doc.setLineWidth(0.3);
    const sigW = 60;
    doc.line(ML, y, ML + sigW, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C_MID);
    doc.text('Datum, Unterschrift', ML, y);
    doc.text(settings.senderName || '', ML + sigW, y - 5, { align: 'right' });
    y += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C_BLACK);
    doc.text('Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.', ML, y);
    y += 10;
  }

  // ── PROOF PHOTO ──────────────────────────
  if (rec.photo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C_BLACK);
    doc.text('Anlage: Beweisfoto Zählerstand', ML, y);
    y += 4;
    
    try {
      const imgProps = doc.getImageProperties(rec.photo);
      const ratio = imgProps.width / imgProps.height;
      let maxW = 85; 
      let imgW = maxW;
      let imgH = imgW / ratio;
      const availableH = PH - y - 15; 
      if (imgH > availableH) {
        imgH = availableH;
        imgW = imgH * ratio;
      }

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.rect(ML - 0.5, y - 0.5, imgW + 1, imgH + 1);
      doc.addImage(rec.photo, 'JPEG', ML, y, imgW, imgH);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C_MID);
      const textX = ML + imgW + 5;
      doc.text(`Aufgenommen am:`, textX, y + 4);
      doc.text(`${rec.date}`, textX, y + 8);
      doc.text(`Zählerstand:`, textX, y + 16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C_BLACK);
      doc.text(`${rec.newReading.toFixed(1)} kWh`, textX, y + 20);

    } catch(e) {
      doc.setFontSize(9);
      doc.setTextColor(150, 0, 0);
      doc.text('[Foto konnte nicht eingebettet werden]', ML, y + 5);
    }
  }

  // ── FOOTER ───────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.1);
  doc.line(ML, PH - 15, MR, PH - 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C_MID);
  doc.text('Erstellt mit Wallbox Abrechnungs-App', ML, PH - 10);

  // ── SAVE & MAIL ──────────────────────────
  const filename = `Wallbox_Abrechnung_${period.replace(' ', '_')}.pdf`;
  doc.save(filename);

  setTimeout(() => {
    alert(
      'ℹ️ WICHTIG:\n\n' +
      'Die Abrechnung wurde als PDF gespeichert.\n\n' +
      'Da Browser aus Sicherheitsgründen keine automatischen Anhänge erlauben, ' +
      'musst du das PDF manuell an die E-Mail anhängen!'
    );
    const subject = encodeURIComponent(`Spesenabrechnung Wallbox – ${period}`);
    const body    = encodeURIComponent(
      `Hallo${settings.recipientPerson ? ' ' + settings.recipientPerson : ''},\n\n` +
      `anbei sende ich meine Wallbox-Spesenabrechnung für ${period}.\n\n` +
      `  Verbrauch:  ${rec.consumption.toFixed(1)} kWh\n` +
      `  Betrag:     ${rec.total.toFixed(2)} €\n\n` +
      `Das Beweisfoto (Zählerstand) und alle Details sind im angehängten PDF enthalten.\n\n` +
      `Viele Grüße\n${settings.senderName || ''}`
    );
    window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`;
  }, 1200);

  showToast('PDF erstellt – Mail wird geöffnet…', 'success', 3500);
}
