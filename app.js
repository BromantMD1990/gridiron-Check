const STORAGE_KEY = 'gridiron-check-2026-owned-v1';
const PAGE_SIZE = 80;
const cardsList = document.querySelector('#cardsList');
const searchInput = document.querySelector('#searchInput');
const setFilter = document.querySelector('#setFilter');
const teamFilter = document.querySelector('#teamFilter');
const loadMoreButton = document.querySelector('#loadMore');
const emptyState = document.querySelector('#emptyState');
const guideDialog = document.querySelector('#cardGuide');
const guideSearch = document.querySelector('#guideSearch');
const guideList = document.querySelector('#guideList');
const scanInput = document.querySelector('#scanInput');
const scanDialog = document.querySelector('#scanDialog');
const scanStatus = document.querySelector('#scanStatus');
const scanSearch = document.querySelector('#scanSearch');
const scanResults = document.querySelector('#scanResults');
let checklist;
let allCards = [];
let owned = new Set();
let view = 'all';
let rendered = 0;
let filtered = [];
let scanMatches = [];
let scanWorkerPromise;
let tesseractScriptPromise;

const guideDescriptions = {
  'Base Set': 'Die regulären Karten der Hauptserie. Sie zeigen Spieler und Rookies im Standarddesign und bilden den Kern der Sammlung.',
  '1957 Rookie Variation': 'Rookie-Karten im Stil des klassischen Topps-Football-Designs von 1957. Das Retro-Layout macht sie von der normalen Base-Karte unterscheidbar.',
  'Clear Variations': 'Eine besondere transparente beziehungsweise klare Designvariante einer Spielerkarte. Achte auf den durchscheinenden Kartenaufbau.',
  'Golden Mirror Image Variations': 'Alternative Bildmotive im Golden-Mirror-Design. Vergleiche das Foto mit der normalen Base-Karte; das Motiv ist der entscheidende Hinweis.',
  'Player Number Variations': 'Sondervariante mit Bezug zur Trikotnummer des Spielers. Die Nummer und das abweichende Design helfen beim Erkennen.',
  'Team Color Border Variations': 'Spielerkarte mit einem Rahmen in den Teamfarben. Prüfe den farbigen Rand und ordne ihn dem Team des Spielers zu.',
  '1000 Yard Club': 'Würdigt Spieler mit einer Saisonleistung von mindestens 1.000 Yards. Der Name verweist auf die offensive Yard-Marke.',
  '4000 Yard Club': 'Würdigt Quarterbacks mit mindestens 4.000 Passing Yards in einer Saison.',
  'All Topps Team': 'Spieler, die für ihre Leistung in ein All-Star-Team der Saison aufgenommen wurden.',
  'Class of 26': 'Eine thematische Auswahl aus dem Draft-Jahrgang 2026; achte auf den Jahrgangsbezug im Kartendesign.',
  'Greatest Hits': 'Highlights und prägende Momente aus der Football-Saison stehen im Mittelpunkt.',
  'All Hail the Champ': 'Tribut an den Champion und den Weg zum Titel.',
  'All Kings': 'Markante Stars werden als „Kings“ inszeniert; ein eigenständiges thematisches Insert-Design.',
  'Big Ticket Players': 'Stellt prominente Spieler als die großen Namen beziehungsweise Zugpferde der Liga heraus.',
  'Big Time Players': 'Insert-Reihe mit Spielern, die in wichtigen Momenten besonders im Fokus stehen.',
  'Billboard Material': 'Auffälliges, plakatives Design, das den Spieler wie auf einem großen Werbeplakat präsentiert.',
  'Companion Cards': 'Zusammengehörige Karten, die als Paar oder Ergänzung gestaltet sind. Prüfe Motiv und Nummern auf passende Gegenstücke.',
  'Conference Kings': 'Stars aus den beiden Conferences werden als Spitzenfiguren ihrer Conference hervorgehoben.',
  'Divisional Dominance': 'Spieler und Teams, die ihre Division prägen, stehen im Mittelpunkt.',
  'Funko Base Cards': 'Football-Spieler im typischen Funko-Pop-Figurenstil statt im üblichen Kartenporträt.',
  'Highlight Reels': 'Karten, die besondere Spielszenen und Highlights visuell aufgreifen.',
  'NFL Stars': 'Eine zusätzliche Stars-Auswahl mit Spielern aus der NFL; je nach Karte auch mit Autogramm- oder Mehrfachsignatur-Versionen.',
  'Pressure Cookers': 'Spieler, die unter Druck entscheidende Leistungen bringen, werden thematisch hervorgehoben.',
  'Ring of Honor': 'Würdigt herausragende Spieler und ihre besonderen Erfolge. Es gibt auch separate Signatures-Karten mit Autogramm.',
  'Rookie Premiere Autographs': 'Rookie-Karte mit Autogramm aus der Rookie-Premiere-Reihe. Suche nach der echten Unterschrift und dem AUTO-Hinweis.',
  'Struttin\'': 'Eigenständiges, stilisiertes Spieler-Insert. Das ungewöhnliche Motiv und der Set-Name sind die Erkennungsmerkmale.',
  'Touchdown': 'Thematische Karten rund um Touchdowns und Scoring-Momente.',
  'Touchdown Machines': 'Spieler, die für ihre Fähigkeit zu punkten stehen, werden als Touchdown-Spezialisten dargestellt.',
  'Topps ProFiles': 'Porträtartige Spieler-Profile, die bekannte Namen der Liga in einer eigenen Insert-Gestaltung zeigen.',
  'Wild Card Moments': 'Unvorhersehbare und besondere Momente aus dem Football stehen im Mittelpunkt.',
  'Victory Ink': 'Karte mit Spieler-Autogramm und feierlicher Victory-Ink-Gestaltung. „Ink“ weist auf die Unterschrift hin.',
  'Island Ink': 'Autogramm-Karte aus der Island-Ink-Reihe. Die Unterschrift ist das wichtigste Erkennungsmerkmal.',
  'Flagship First Signatures': 'Signierte Rookie-Karten, die den ersten Auftritt des Spielers in der Flagship-Serie markieren.',
  'Flagship First Dual Signatures': 'Zwei Unterschriften auf einer Karte aus der Flagship-First-Reihe.',
  'Mascot Autographs': 'Autogramm-Karte mit einem Team-Maskottchen als Motiv beziehungsweise Unterzeichner.',
  'NFL Material Cards': 'Memorabilia-Karte mit einem eingelegten Materialstück. Das Fenster mit Stoff ist der typische Hinweis.',
  'Rookies Material Cards': 'Rookie-Memorabilia-Karte mit einem eingelegten Materialstück.',
  'Real One Relics': 'Memorabilia-Karte aus der Real-One-Reihe mit eingelegtem Materialstück.',
  'Rookie Real One Relics': 'Rookie-Version der Real-One-Relics mit eingelegtem Materialstück.',
  '1991 Topps Football': 'Retro-Insert im Design der Topps-Football-Karten von 1991. Erkennbar am nostalgischen Layout.',
  '1991 Topps Rookies Football': 'Rookie-Variante des 1991er-Retro-Designs mit Spielern aus dem aktuellen Rookie-Jahrgang.',
  'The Flagship Collection Chrome': 'Chrome-Ausführung der Flagship-Collection: glänzende, reflektierende Oberfläche statt Papierfinish.',
  'The Flagship Collection': 'Eine eigene Auswahl im Flagship-Design, getrennt von den regulären Base-Karten.'
};

function describeSet(name) {
  if (guideDescriptions[name]) return guideDescriptions[name];
  if (/AUTORELIC|Autograph.*Relic|Relic.*Autograph/i.test(name)) return 'Kombiniert ein echtes Spieler-Autogramm mit einem eingelegten Memorabilia-Stück. Achte auf Unterschrift und Materialfenster.';
  if (/Dual.*Autograph|Triple.*Autograph/i.test(name)) return 'Mehrere Spieler haben dieselbe Karte signiert. „Dual“ steht für zwei, „Triple“ für drei Unterschriften.';
  if (/Autograph|Signatures|Ink/i.test(name)) return 'Autogramm-Karte: Suche nach der Unterschrift des Spielers und dem AUTO-Hinweis im Set-Namen.';
  if (/Relic|Material|Swatch|Patch/i.test(name)) return 'Memorabilia-Karte mit einem eingelegten Stoff- oder Materialstück. Ein sichtbares Fenster auf der Karte ist der Hinweis.';
  if (/Chrome/i.test(name)) return 'Chrome-Karte mit glänzender, reflektierender Oberfläche. Sie kann zusätzlich als Autogramm- oder Insert-Karte vorkommen.';
  if (/Oversized/i.test(name)) return 'Übergroße Karte. Sie ist deutlich größer als das Standard-Kartenformat.';
  if (/Rookie/i.test(name)) return 'Rookie-Karte eines Spielers in seiner ersten NFL-Saison. Achte auf den Rookie-Hinweis oder das Rookie-Logo.';
  return 'Eigenständiges Insert-Teilset mit einem besonderen Thema und eigenem Design. Der Set-Name auf deiner Karte sollte mit diesem Eintrag übereinstimmen.';
}

function renderGuide() {
  const query = guideSearch.value.trim().toLocaleLowerCase('de');
  const sections = (checklist?.sections || []).filter(section => {
    const name = cleanSetName(section.name);
    const description = describeSet(name);
    return !query || `${name} ${description}`.toLocaleLowerCase('de').includes(query);
  });
  guideList.replaceChildren();
  if (!sections.length) {
    const empty = document.createElement('p'); empty.className = 'guide-empty'; empty.textContent = 'Kein passendes Teilset gefunden.'; guideList.append(empty); return;
  }
  const fragment = document.createDocumentFragment();
  sections.forEach(section => {
    const item = document.createElement('article'); item.className = 'guide-item';
    const heading = document.createElement('div'); heading.className = 'guide-item-heading';
    const name = cleanSetName(section.name);
    const title = document.createElement('h3'); title.textContent = name;
    const count = document.createElement('span'); count.textContent = format(section.cards.length);
    const description = document.createElement('p'); description.textContent = describeSet(name);
    heading.append(title, count); item.append(heading, description); fragment.append(item);
  });
  guideList.append(fragment);
}

function cleanSetName(rawName) {
  return rawName.replace(/\s+/g, ' ').replace(/\s+(?:AUTO|RELIC|AUTORELIC|\d+)(?:\s+(?:AUTO|RELIC|AUTORELIC|\d+))*\s*$/gi, '').trim();
}

function scanNormalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en').replace(/[^a-z0-9]/g, '');
}
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tesseractScriptPromise) tesseractScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Texterkennung konnte nicht gestartet werden.'));
    script.onerror = () => reject(new Error('Texterkennung konnte nicht geladen werden. Prüfe deine Internetverbindung.'));
    document.head.append(script);
  });
  return tesseractScriptPromise;
}
async function getScanWorker() {
  if (!scanWorkerPromise) scanWorkerPromise = loadTesseract().then(Tesseract => Tesseract.createWorker('eng', 1, {
    logger: message => {
      if (message.status === 'loading tesseract core') scanStatus.textContent = 'Texterkennung wird geladen…';
      else if (message.status === 'loading language traineddata') scanStatus.textContent = 'Sprachmodell wird geladen…';
      else if (message.status === 'recognizing text') scanStatus.textContent = `Karte wird gelesen… ${Math.round((message.progress || 0) * 100)}%`;
    }
  }));
  try { return await scanWorkerPromise; }
  catch (error) { scanWorkerPromise = null; throw error; }
}
function matchesFromScan(text) {
  const normalizedText = scanNormalize(text);
  if (!normalizedText) return [];
  return allCards.map(card => {
    const player = scanNormalize(card.player);
    const number = scanNormalize(card.number);
    const setName = scanNormalize(cleanSetName(card.set));
    // OCR often misses a character or splits a surname. Token matching makes
    // the suggestion list more useful without ever treating a suggestion as certain.
    const playerTokens = card.player.toLocaleLowerCase('en').split(/[^a-z0-9]+/).filter(token => token.length >= 3);
    const tokenHits = playerTokens.filter(token => normalizedText.includes(scanNormalize(token))).length;
    const playerMatch = player.length >= 6 && normalizedText.includes(player);
    const numberMatch = number.length >= 4 && normalizedText.includes(number);
    const setMatch = setName.length >= 9 && normalizedText.includes(setName);
    const score = (playerMatch ? 8 : 0) + tokenHits * 4 + (numberMatch ? 5 : 0) + (setMatch ? 4 : 0);
    return { card, score, playerMatch, numberMatch, setMatch, tokenHits };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score);
}
function addScannedCard(card) {
  const key = cardKey(card);
  if (!owned.has(key)) {
    owned.add(key); persist(); updateProgress(); updateFiltered();
  }
  scanStatus.textContent = `${card.player} · #${card.number} ist jetzt abgehakt.`;
  const message = document.createElement('p'); message.className = 'scan-success';
  message.textContent = `${card.player} · #${card.number} · ${cleanSetName(card.set)}`;
  const again = document.createElement('button'); again.className = 'scan-again'; again.type = 'button'; again.textContent = 'Nächste Karte scannen';
  again.addEventListener('click', () => scanInput.click());
  scanResults.replaceChildren(message, again);
}
function scanResultRow(card) {
  const row = document.createElement('article'); row.className = 'scan-result-row';
  const details = document.createElement('div'); details.className = 'scan-result-details';
  const player = document.createElement('strong'); player.textContent = card.player;
  const info = document.createElement('span'); info.textContent = `#${card.number} · ${cleanSetName(card.set)}`;
  details.append(player, info);
  const action = document.createElement('button'); action.type = 'button';
  if (owned.has(cardKey(card))) { action.className = 'scan-owned'; action.textContent = 'Schon da'; action.disabled = true; }
  else { action.className = 'scan-mark'; action.textContent = 'Abhaken'; action.addEventListener('click', () => addScannedCard(card)); }
  row.append(details, action);
  return row;
}
function preprocessScanImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(2, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const gray = pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114;
        const enhanced = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = enhanced;
      }
      context.putImageData(pixels, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Das Kartenfoto konnte nicht geöffnet werden.')); };
    image.src = url;
  });
}
function renderScanResults() {
  const query = scanSearch.value.trim().toLocaleLowerCase('de');
  let matches = scanMatches;
  if (query) matches = allCards.filter(card => `${card.player} ${card.number} ${cleanSetName(card.set)}`.toLocaleLowerCase('de').includes(query));
  scanResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('p'); empty.className = 'scan-empty';
    empty.textContent = query ? 'Keine passende Karte gefunden. Ändere den Suchbegriff.' : 'Kein eindeutiger Treffer erkannt. Suche nach Spielername, Kartennummer oder Teilset.';
    scanResults.append(empty); return;
  }
  const intro = document.createElement('p'); intro.className = 'scan-match-intro';
  intro.textContent = query ? 'Suchtreffer – wähle die passende Karte:' : 'Mögliche Treffer – wähle die richtige Karte:';
  scanResults.append(intro);
  const fragment = document.createDocumentFragment();
  matches.slice(0, 40).forEach(match => fragment.append(scanResultRow(match.card || match)));
  scanResults.append(fragment);
  if (matches.length > 40) {
    const more = document.createElement('p'); more.className = 'scan-empty'; more.textContent = 'Viele Treffer. Verfeinere deine Suche mit der Kartennummer oder dem Teilset.'; scanResults.append(more);
  }
}
async function scanCard(file) {
  scanDialog.showModal();
  scanStatus.textContent = 'Texterkennung wird vorbereitet…';
  scanResults.replaceChildren();
  scanSearch.value = '';
  scanMatches = [];
  try {
    const worker = await getScanWorker();
    scanStatus.textContent = 'Karte wird gelesen…';
    const preparedImage = await preprocessScanImage(file);
    const result = await worker.recognize(preparedImage);
    const text = result.data.text || '';
    scanMatches = matchesFromScan(text);
    scanStatus.textContent = scanMatches.length
      ? `${scanMatches.length} Vorschläge. Bitte prüfe den Namen und die Kartennummer und tippe selbst auf „Abhaken“.`
      : 'Kein passender Vorschlag. Prüfe den erkannten Text oder suche die Karte manuell.';
    renderScanResults();
    const recognized = document.createElement('details'); recognized.className = 'scan-ocr-details';
    const summary = document.createElement('summary'); summary.textContent = 'Erkannten Text anzeigen';
    const output = document.createElement('p'); output.textContent = text.trim() || 'Kein Text erkannt.';
    recognized.append(summary, output); scanResults.prepend(recognized);
  } catch (error) {
    console.error('Kartenscan fehlgeschlagen', error);
    scanStatus.textContent = error.message || 'Texterkennung fehlgeschlagen.';
    const hint = document.createElement('p'); hint.className = 'scan-empty'; hint.textContent = 'Du kannst die Karte unten auch manuell suchen.';
    scanResults.replaceChildren(hint);
  }
}

const format = n => new Intl.NumberFormat('de-DE').format(n);
function cardKey(card) { return `${card.sectionId}:${card.index}`; }
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned])); }
  catch (error) { console.warn('Speichern fehlgeschlagen', error); }
}
function updateProgress() {
  const total = allCards.length;
  const count = owned.size;
  const percent = total ? Math.round(count / total * 100) : 0;
  document.querySelector('#progressText').textContent = `${format(count)} von ${format(total)} Karten`;
  document.querySelector('#percentText').textContent = `${percent}%`;
  document.querySelector('#progressBar').style.width = `${percent}%`;
  document.querySelector('#ownedCount').textContent = format(count);
  document.querySelector('#missingCount').textContent = format(total - count);
  document.querySelector('#allTabCount').textContent = format(total);
  document.querySelector('#ownedTabCount').textContent = format(count);
  document.querySelector('#missingTabCount').textContent = format(total - count);
}
function updateFiltered() {
  const q = searchInput.value.trim().toLocaleLowerCase('de');
  const selectedSet = setFilter.value;
  const selectedTeam = teamFilter.value;
  filtered = allCards.filter(card => {
    const isOwned = owned.has(cardKey(card));
    if (view === 'owned' && !isOwned) return false;
    if (view === 'missing' && isOwned) return false;
    if (selectedSet !== 'all' && card.sectionId !== selectedSet) return false;
    if (selectedTeam !== 'all' && !card.teams.includes(selectedTeam)) return false;
    if (q && !`${card.number} ${card.player} ${card.set}`.toLocaleLowerCase('de').includes(q)) return false;
    return true;
  });
  rendered = 0;
  cardsList.replaceChildren();
  showMore();
}
function rowFor(card) {
  const row = document.createElement('article');
  const isOwned = owned.has(cardKey(card));
  row.className = `card-row${isOwned ? ' owned' : ''}`;
  const toggle = document.createElement('button');
  toggle.className = 'check-control';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', isOwned ? `${card.player} als nicht gesammelt markieren` : `${card.player} als gesammelt markieren`);
  toggle.setAttribute('aria-pressed', String(isOwned));
  toggle.innerHTML = isOwned ? '<svg viewBox="0 0 16 16"><path d="m3 8 3.2 3.2L13 4.5"/></svg>' : '';
  toggle.addEventListener('click', () => {
    const key = cardKey(card);
    if (owned.has(key)) owned.delete(key); else owned.add(key);
    persist(); updateProgress(); updateFiltered();
  });
  const number = document.createElement('span'); number.className = 'card-number'; number.textContent = `#${card.number}`;
  const details = document.createElement('div'); details.className = 'card-details';
  const player = document.createElement('div'); player.className = 'card-player'; player.textContent = card.player;
  const set = document.createElement('div'); set.className = 'card-set'; set.textContent = card.set;
  details.append(player, set);
  const status = document.createElement('span'); status.className = 'row-status'; status.textContent = isOwned ? 'DA' : 'FEHLT';
  row.append(toggle, number, details, status);
  return row;
}
function showMore() {
  const next = filtered.slice(rendered, rendered + PAGE_SIZE);
  const fragment = document.createDocumentFragment();
  next.forEach(card => fragment.append(rowFor(card)));
  cardsList.append(fragment);
  rendered += next.length;
  const remaining = filtered.length - rendered;
  loadMoreButton.hidden = remaining <= 0;
  loadMoreButton.innerHTML = remaining > 0 ? `Mehr Karten anzeigen <span>↓</span> <small>(${format(remaining)} weitere)</small>` : 'Alle Treffer angezeigt';
  loadMoreButton.disabled = remaining <= 0;
  emptyState.hidden = filtered.length > 0;
  document.querySelector('#visibleCount').textContent = `${format(filtered.length)} KARTEN`;
}
function setView(next) {
  view = next;
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const titles = { all: ['CHECKLISTE', 'Alle Karten'], owned: ['DEINE SAMMLUNG', 'Meine Karten'], missing: ['NOCH OFFEN', 'Fehlt noch'] };
  document.querySelector('#listEyebrow').textContent = titles[view][0];
  document.querySelector('#listTitle').textContent = titles[view][1];
  updateFiltered();
}
function exportCollection() {
  const data = { app: 'Topps NFL TC', version: 1, set: checklist.product, year: checklist.year, exportedAt: new Date().toISOString(), owned: [...owned] };
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  link.download = 'topps-nfl-tc-sicherung.json'; link.click(); URL.revokeObjectURL(link.href);
}
async function importCollection(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.owned)) throw new Error('Ungültiges Sicherungsformat');
    const valid = new Set(allCards.map(cardKey));
    owned = new Set(data.owned.filter(key => valid.has(key)));
    persist(); updateProgress(); updateFiltered();
  } catch { alert('Diese Datei konnte nicht als Sammlungssicherung gelesen werden.'); }
}
async function init() {
  const response = await fetch('./checklist.json');
  if (!response.ok) throw new Error('Die Checkliste konnte nicht geladen werden.');
  checklist = await response.json();
  renderGuide();
  checklist.sections.forEach(section => {
    const option = document.createElement('option'); option.value = section.id; option.textContent = `${section.name} (${format(section.cards.length)})`;
    setFilter.append(option);
    section.cards.forEach((card, index) => allCards.push({ ...card, sectionId: section.id, index, set: section.name }));
  });
  checklist.teams.forEach(team => {
    const option = document.createElement('option'); option.value = team; option.textContent = team;
    teamFilter.append(option);
  });
  try { owned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { owned = new Set(); }
  updateProgress(); updateFiltered();
}

document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
function openGuide() { if (!guideDialog.open) guideDialog.showModal(); guideSearch.focus(); }
document.querySelector('#guideButton').addEventListener('click', openGuide);
document.querySelector('#guideClose').addEventListener('click', () => guideDialog.close());
guideSearch.addEventListener('input', renderGuide);
guideDialog.addEventListener('click', event => { if (event.target === guideDialog) guideDialog.close(); });
document.querySelector('#scanButton').addEventListener('click', () => scanInput.click());
document.querySelector('#scanClose').addEventListener('click', () => scanDialog.close());
scanInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (file) await scanCard(file);
  event.target.value = '';
});
scanSearch.addEventListener('input', renderScanResults);
scanDialog.addEventListener('click', event => { if (event.target === scanDialog) scanDialog.close(); });
searchInput.addEventListener('input', updateFiltered);
setFilter.addEventListener('change', updateFiltered);
teamFilter.addEventListener('change', updateFiltered);
loadMoreButton.addEventListener('click', showMore);
document.querySelector('#resetButton').addEventListener('click', () => { searchInput.value = ''; setFilter.value = 'all'; teamFilter.value = 'all'; setView('all'); });
document.querySelector('#backupButton').addEventListener('click', () => {
  if (confirm('OK: Sammlung exportieren · Abbrechen: Sicherung importieren')) exportCollection();
  else document.querySelector('#importInput').click();
});
document.querySelector('#importInput').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  if (confirm('Möchtest du eine Sicherung importieren? Sie ersetzt den aktuellen Sammlungsstand.')) await importCollection(file);
  event.target.value = '';
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchInput.focus(); }
  if (event.key === 'Escape') searchInput.blur();
});
init().catch(error => {
  console.error(error);
  document.querySelector('#cardsList').innerHTML = '<div class="empty-state"><strong>Checkliste nicht verfügbar</strong><p>Bitte lade die App über einen Webserver neu.</p></div>';
});
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
