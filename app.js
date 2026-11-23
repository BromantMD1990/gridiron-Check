const STORAGE_KEY = 'gridiron-check-2026-owned-v1';
const PAGE_SIZE = 80;
const cardsList = document.querySelector('#cardsList');
const searchInput = document.querySelector('#searchInput');
const setFilter = document.querySelector('#setFilter');
const loadMoreButton = document.querySelector('#loadMore');
const emptyState = document.querySelector('#emptyState');
let checklist;
let allCards = [];
let owned = new Set();
let view = 'all';
let rendered = 0;
let filtered = [];

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
  filtered = allCards.filter(card => {
    const isOwned = owned.has(cardKey(card));
    if (view === 'owned' && !isOwned) return false;
    if (view === 'missing' && isOwned) return false;
    if (selectedSet !== 'all' && card.sectionId !== selectedSet) return false;
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
  const data = { app: 'Gridiron Check', version: 1, set: checklist.product, year: checklist.year, exportedAt: new Date().toISOString(), owned: [...owned] };
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  link.download = 'gridiron-check-sicherung.json'; link.click(); URL.revokeObjectURL(link.href);
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
  checklist.sections.forEach(section => {
    const option = document.createElement('option'); option.value = section.id; option.textContent = `${section.name} (${format(section.cards.length)})`;
    setFilter.append(option);
    section.cards.forEach((card, index) => allCards.push({ ...card, sectionId: section.id, index, set: section.name }));
  });
  try { owned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { owned = new Set(); }
  updateProgress(); updateFiltered();
}

document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
searchInput.addEventListener('input', updateFiltered);
setFilter.addEventListener('change', updateFiltered);
loadMoreButton.addEventListener('click', showMore);
document.querySelector('#resetButton').addEventListener('click', () => { searchInput.value = ''; setFilter.value = 'all'; setView('all'); });
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
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
