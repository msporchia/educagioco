/* ═══════════════════════════════════════════════════════════════════
   I VESTITI DELLA PISTA

   Una tappa non è un livello nuovo del motore: è **lo stesso motore con
   altri numeri e un altro vestito**. Qui ci sono solo i vestiti — cielo,
   prato, strada, alberi — e nient'altro: chi disegna riceve i colori e
   non sa che esistano le tappe, chi gioca non sa che esistano i colori.

   Le tinte non sono decorazione. Nove tappe con lo stesso sfondo sono la
   stessa schermata nove volte, e un bambino che rigioca la quarta deve
   riconoscerla in mezzo secondo — dal colore, non leggendo il titolo.

   `bordo` è quello che sfila a lato della strada: è la cosa che *si vede*
   passare, e senza qualcosa che passa vicino la velocità non si sente.
   ═══════════════════════════════════════════════════════════════════ */

export const VESTI = {
  prato: {
    nome: 'Il prato', icona: '🌿', accento: '#3fa34d',
    cielo: ['#4aa6e8', '#a5dcf6', '#ecf7dc'],
    terra: ['#7cb572', '#5d9b58'], colline: ['#a8cf9a', '#7cb572'],
    strada: '#e2c391', banchina: '#a9855c', righe: '#fffaf0',
    bordo: 'albero', chioma: ['#4f9a4a', '#5cae53', '#469143'], buio: false,
  },
  grano: {
    nome: 'I campi', icona: '🌾', accento: '#d9a441',
    cielo: ['#5fb0e6', '#bfe2f2', '#fdf3c8'],
    terra: ['#e3c667', '#c8a641'], colline: ['#e8d68a', '#cfb35c'],
    strada: '#d8b578', banchina: '#a07f45', righe: '#fffdf2',
    bordo: 'covone', chioma: ['#c9a13c', '#dbb44f', '#b98f30'], buio: false,
  },
  bosco: {
    nome: 'Il bosco', icona: '🌲', accento: '#2f7d4f',
    cielo: ['#3f86b8', '#8fc4d8', '#d9e8c8'],
    terra: ['#4f8a52', '#33633c'], colline: ['#6b9c6a', '#4a7a4c'],
    strada: '#c9ab7e', banchina: '#7f6440', righe: '#f5efdc',
    bordo: 'pino', chioma: ['#27613a', '#2f7346', '#1f5330'], buio: false,
  },
  fiume: {
    nome: 'Il ponte lungo', icona: '🌉', accento: '#3b8fb0',
    cielo: ['#57a8d8', '#a9d8ee', '#e6f3f6'],
    terra: ['#4fa0c4', '#2e7799'], colline: ['#8fc6d8', '#63a4bd'],
    strada: '#c8b8a0', banchina: '#8d7c66', righe: '#fffdf6',
    bordo: 'lampione', chioma: ['#d7e7ee', '#c2dbe6', '#e4f0f4'], buio: false,
  },
  deserto: {
    nome: 'Le dune', icona: '🏜️', accento: '#d98a3a',
    cielo: ['#7cbfe0', '#f0d9a8', '#f8e9c4'],
    terra: ['#e6c384', '#cfa25c'], colline: ['#efd7a0', '#dbb877'],
    strada: '#e8d3a6', banchina: '#b08e56', righe: '#fffbee',
    bordo: 'cactus', chioma: ['#5f9b5a', '#6faa63', '#528a4f'], buio: false,
  },
  notte: {
    nome: 'La notte', icona: '🌙', accento: '#6f7fd8',
    cielo: ['#101a34', '#22315c', '#3d4a7a'],
    terra: ['#233151', '#17203a'], colline: ['#2c3b63', '#1d2946'],
    strada: '#4a4a5e', banchina: '#2e2e3d', righe: '#d8d8f0',
    bordo: 'lampione', chioma: ['#ffe9a3', '#ffd97a', '#fff3c8'], buio: true,
  },
  neve: {
    nome: 'Il valico', icona: '🏔️', accento: '#5f9fd0',
    cielo: ['#8dc0e2', '#c6e0f0', '#eef6fb'],
    terra: ['#e8f1f7', '#c9dbe8'], colline: ['#f2f8fc', '#d4e4ef'],
    strada: '#cfd8de', banchina: '#9aa7b1', righe: '#ffffff',
    bordo: 'pino', chioma: ['#2c5d43', '#376b4d', '#24513a'], buio: false,
  },
  lava: {
    nome: 'La terra che brucia', icona: '🌋', accento: '#d1522f',
    cielo: ['#4a1e26', '#8d3a2c', '#d2743a'],
    terra: ['#5a2b28', '#3a1a1c'], colline: ['#6e3630', '#4a2422'],
    strada: '#6b5850', banchina: '#3f3230', righe: '#ffd8a8',
    bordo: 'roccia', chioma: ['#c2512c', '#e0692f', '#a53f22'], buio: true,
  },
  cima: {
    nome: 'La cima', icona: '⛰️', accento: '#8a6fd0',
    cielo: ['#3a2f6e', '#7b6cc0', '#e0c8f0'],
    terra: ['#6b6494', '#4b466e'], colline: ['#8a82b8', '#645c92'],
    strada: '#d9d0ea', banchina: '#8d84a8', righe: '#ffffff',
    bordo: 'totem', chioma: ['#f0d8ff', '#d8bcf0', '#ffeaff'], buio: true,
  },
}

export const veste = chiave => VESTI[chiave] || VESTI.prato

export function guastiDelleVesti(vesti = VESTI) {
  const guasti = []
  const BORDI = ['albero', 'pino', 'covone', 'cactus', 'lampione', 'roccia', 'totem']
  for (const [chiave, v] of Object.entries(vesti)) {
    const dove = `la veste "${chiave}"`
    if (!v.nome || !v.icona) guasti.push(`${dove}: senza nome o senza icona`)
    if (!/^#[0-9a-f]{6}$/i.test(v.accento || '')) guasti.push(`${dove}: accento "${v.accento}" non è un colore`)
    if (v.cielo?.length !== 3) guasti.push(`${dove}: il cielo vuole tre tinte, non ${v.cielo?.length}`)
    for (const campo of ['terra', 'colline', 'chioma'])
      if (!Array.isArray(v[campo]) || v[campo].length < 2)
        guasti.push(`${dove}: ${campo} vuole almeno due tinte`)
    for (const campo of ['strada', 'banchina', 'righe'])
      if (!/^#[0-9a-f]{6}$/i.test(v[campo] || '')) guasti.push(`${dove}: ${campo} non è un colore`)
    if (!BORDI.includes(v.bordo)) guasti.push(`${dove}: il bordo "${v.bordo}" non lo sa disegnare nessuno`)
    /* la riga di mezzeria si legge sulla strada, non ci si confonde: due
       tinte quasi uguali fanno sparire le corsie proprio dove si sceglie */
    if (v.strada?.toLowerCase() === v.righe?.toLowerCase())
      guasti.push(`${dove}: le righe hanno lo stesso colore della strada`)
  }
  return guasti
}
