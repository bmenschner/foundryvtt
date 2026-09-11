// Als Script-Makro in Foundry 14 ausführen. Importiert ausschließlich neue Arbeitskopien.
if (!game.user.isGM) throw new Error('Nur die Spielleitung kann Karten importieren.');
if (Number(game.release.generation) !== 14) throw new Error('Dieses Makro ist für Foundry 14 vorbereitet.');
const base = 'modules/grimmes-erwachen/assets/rendered-v2';
const response = await fetch(`${base}/Bibliotheken.json`, {cache: 'no-store'});
if (!response.ok) throw new Error('Das Kartenpaket fehlt unter ' + base);
const catalog = await response.json();
// Vor dem ersten Schreibzugriff alle Hintergründe auf Erreichbarkeit prüfen.
for (const map of catalog.maps) {
  const check = await fetch(`${base}/${map.file}`, {method: 'HEAD', cache: 'no-store'});
  if (!check.ok) throw new Error('Hintergrund fehlt: ' + map.file);
}
let folder = game.folders.find(f => f.type === 'Scene' && f.name === 'Grimmes Erwachen – neue Karten zur Bearbeitung');
if (!folder) folder = await Folder.create({name: 'Grimmes Erwachen – neue Karten zur Bearbeitung', type: 'Scene'});
let created = 0;
for (const map of catalog.maps) {
  if (game.scenes.some(s => s.getFlag('grimmes-erwachen', 'renderV2Key') === map.key)) continue;
  const levelId = foundry.utils.randomID();
  const width = map.sceneDimensions?.width ?? Math.round(map.widthMeters * 100);
  const height = map.sceneDimensions?.height ?? Math.round(width * map.pixelHeight / map.pixelWidth);
  if (![width,height].every(n=>Number.isSafeInteger(n) && n>0)) throw new Error('Ungültige Szenengröße: ' + map.key);
  await Scene.create({
    name: map.name + ' – neue Karte', folder: folder.id,
    width, height, padding: 0,
    grid: {type: 1, size: 100, distance: 1, units: 'm', alpha: 0.18},
    levels: [{_id: levelId, name: 'Spielplan', background: {src: `${base}/${map.file}`}}],
    initialLevel: levelId,
    tokenVision: false, fogExploration: false,
    environment: {darknessLevel: 0, globalLight: {enabled: true}},
    flags: {'grimmes-erwachen': {renderV2Key: map.key, needsWallReview: true}}
  });
  created++;
}
ui.notifications.info(`${created} neue Karten importiert. Raster: 1 m. Wände, Türen und Sicht bitte am neuen Grundriss einrichten.`);
