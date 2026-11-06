// Come ribolle ogni pozione: il modo (scena3d/bollori.js) e i due riflessi che le
// girano sopra. Il colore ce l'ha già, in dati/misure.js. Vedi docs/pozioni/gesti.md.
export const BOLLORI = {
  'Polvere Starnutina': ['frizzante', '#fff2b0', '#ff9ad0'],
  'Pozione del Coraggio': ['scintille', '#ffd24a', '#ff3a2a'],
  'Polvere di Fata': ['stelline', '#ffffff', '#b58cff'],
  'Filtro della Risata': ['schiuma', '#ff7ac8', '#7ae0ff'],
  'Pozione della Forza': ['lava', '#ff9a3a', '#5a1a2a'],
  'Pozione del Gigante': ['grosse', '#c9d4dd', '#55606a'],
  'Unguento di Ferro': ['lava', '#d8dee8', '#3f4756'],
  'Sale del Contrario': ['vortice', '#ffb07a', '#e87ac0'],
  'Polvere dei Tuoni': ['lampi', '#fff27a', '#c9d6ff'],
  'Decotto del Salto': ['grosse', '#d6f55a', '#2f8a4a'],
  'Elisir di Volo': ['nebbia', '#ffffff', '#a8e0ff'],
  'Sciroppo dei Sogni': ['vortice', '#e0b8ff', '#3a3a9a'],
  'Filtro Antipuzza': ['schiuma', '#ffffff', '#ffd0e6'],
  'Elisir di Velocità': ['frizzante', '#ffffff', '#ff9a2a'],
  'Infuso della Memoria': ['cangiante', '#a0d0ff', '#ffe0a0'],
  'Pozione Parlante': ['grosse', '#f2f0a0', '#1f7a5a'],
  'Filtro del Gambero': ['vortice', '#ffd0a0', '#c83a2a'],
  'Pozione del Labirinto': ['lava', '#e8d09a', '#5a4020'],
  'Pozione dell\'Invisibilità': ['nebbia', '#ffffff', '#d0e0f0'],
  'Bevanda dei Pesci': ['bolle', '#a0f0ff', '#2a6ad0'],
  'Acqua del Ghiaccio': ['nebbia', '#ffffff', '#7ac8ff'],
  'Sciroppo Arcobaleno': ['cangiante', '#ffd84a', '#4ad0ff'],
  'Elisir del Fuoco': ['scintille', '#ffe04a', '#d02a1a'],
  'Pozione delle Bolle': ['grosse', '#ffffff', '#b0a0ff'],
  'Filtro delle Stelle': ['stelline', '#ffffff', '#7a8aff'],
  'Pozione della Marea': ['vortice', '#d0f0ff', '#1a4a90'],
  'Elisir del Tempo': ['cangiante', '#f5e6b0', '#7a5a20'],
  'Elisir del Calderone': ['lampi', '#e0a0ff', '#4ad0c0'],
  'Pozione del Maestro': ['stelline', '#fff2b0', '#ff7a4a'],
}

// il riflesso dipende da cosa c'è dentro: la stessa pozione rifatta può cambiare
export function bolloreDi(nome, ingredienti) {
  const [modo, ...riflessi] = BOLLORI[nome] || ['bolle', '#ffffff', '#ffffff']
  const n = ingredienti.reduce((s, g) => s + g.nome.length, 0)
  return { modo, riflesso: riflessi[n % riflessi.length] }
}
