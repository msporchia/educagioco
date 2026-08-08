/* ═══════════════════════════════════════════════════════════════════
   GLI SCENARI — il vestito di una tappa

   Il gioco non cambia mai: cambia il posto dove si gioca. Nove tappe
   sullo stesso prato verde sono la stessa schermata nove volte, e a metà
   non ci si torna più; nove posti diversi sono un viaggio.

   Qui c'è **solo il colore**: chi disegna (`scena/campo.js`) sa fare un
   terreno, dei ciuffi e dei puntini, e prende da qui di che tinta. Non
   c'è nessuna regola di gioco in questo file — la palude non rallenta e
   la notte non acceca: sono vestiti, non trappole. Un bambino che perde
   perché il fondo è scuro non impara niente.

     terra    il fondo pieno
     chiazza  le macchie appena diverse che danno il senso del movimento
     ciuffo   i due colori dei ciuffi
     puntini  i tre colori dei fiorellini (o dei sassi, o delle stelle)
     buio     true se il fondo è scuro: il cruscotto si schiarisce
   ═══════════════════════════════════════════════════════════════════ */

export const SCENARI = {
  prato:   { nome: 'il prato',    icona: '🌿', accento: '#3fa34d', buio: false,
             terra: '#6dbd5c', chiazza: '#78c964', ciuffo: ['#4f9c53', '#8ed97a'],
             puntini: ['#fff6d8', '#ffd9e8', '#ffe9a0'] },
  bosco:   { nome: 'il bosco',    icona: '🌲', accento: '#2f7d4f', buio: false,
             terra: '#4e8f52', chiazza: '#5a9c5b', ciuffo: ['#376b3d', '#78c26b'],
             puntini: ['#d9c9a0', '#c46b4a', '#e8dcae'] },
  palude:  { nome: 'la palude',   icona: '🐸', accento: '#5c7a3a', buio: false,
             terra: '#67794a', chiazza: '#5b7048', ciuffo: ['#4a5c35', '#8fa25c'],
             puntini: ['#9fd6a0', '#7a8f5a', '#c3d98a'] },
  grotta:  { nome: 'la grotta',   icona: '🪨', accento: '#6b6675', buio: true,
             terra: '#4a4550', chiazza: '#544e5c', ciuffo: ['#3a3540', '#6d667a'],
             puntini: ['#8f88a0', '#b9a9d6', '#6d667a'] },
  deserto: { nome: 'il deserto',  icona: '🏜️', accento: '#c98f36', buio: false,
             terra: '#e0c07a', chiazza: '#e8cd8e', ciuffo: ['#c0a05e', '#f0dda8'],
             puntini: ['#fff0c4', '#d6b06a', '#c98f36'] },
  neve:    { nome: 'la neve',     icona: '❄️', accento: '#5aa6d6', buio: false,
             terra: '#dfeaf5', chiazza: '#eaf3fb', ciuffo: ['#b9cede', '#ffffff'],
             puntini: ['#ffffff', '#cfe4f5', '#a9c8e0'] },
  notte:   { nome: 'la notte',    icona: '🌙', accento: '#5b6bc0', buio: true,
             terra: '#2b3566', chiazza: '#333e73', ciuffo: ['#212a54', '#4a5893'],
             puntini: ['#fff6a0', '#cfd8ff', '#8f9ee0'] },
}

export const CHIAVI_SCENARI = Object.keys(SCENARI)

export const scenario = chiave => SCENARI[chiave] || SCENARI.prato

export function guastiDegliScenari(scenari = SCENARI) {
  const guasti = []
  const colore = c => /^#[0-9a-f]{6}$/i.test(c || '')
  for (const [chiave, s] of Object.entries(scenari)) {
    const dove = `scenario "${chiave}"`
    if (!s.nome || !s.icona) guasti.push(`${dove}: senza nome o senza icona`)
    if (!colore(s.terra)) guasti.push(`${dove}: terra "${s.terra}"`)
    if (!colore(s.chiazza)) guasti.push(`${dove}: chiazza "${s.chiazza}"`)
    if (!colore(s.accento)) guasti.push(`${dove}: accento "${s.accento}"`)
    if (!(Array.isArray(s.ciuffo) && s.ciuffo.length === 2 && s.ciuffo.every(colore)))
      guasti.push(`${dove}: i ciuffi vogliono due colori`)
    if (!(Array.isArray(s.puntini) && s.puntini.length === 3 && s.puntini.every(colore)))
      guasti.push(`${dove}: i puntini vogliono tre colori`)
    if (typeof s.buio !== 'boolean') guasti.push(`${dove}: "buio" non è né vero né falso`)
  }
  return guasti
}
