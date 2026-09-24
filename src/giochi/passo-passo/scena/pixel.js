/* ═══════════════════════════════════════════════════════════════════
   I PEZZI DISEGNATI A MANO — quello che l'atlante non ha

   L'atlante della fattoria ha il coniglio, i sassi, i cespugli, il
   tronco: quello che si può, si prende da lì (`scena/tela.js`). Non ha
   un albero grande una cella, una carota che si legga a sedici pixel,
   una tana, una buca: quelli stanno qui, **scritti come dato** — una
   riga di lettere per riga di pixel, e una tavolozza che dice cosa vuol
   dire ogni lettera. Si disegnano una volta sola in un canvas a parte e
   da lì in poi sono uno sprite come gli altri.

   Perché così e non con dei `fillRect` sparsi: un disegno scritto in
   lettere si guarda e si corregge a occhio, e ha la stessa grana dei
   pezzi dell'atlante (un pixel è un pixel, niente curve lisce). Un
   cerchio disegnato col canvas accanto a un cespuglio in pixel art si
   vede subito che viene da un altro mondo.

   La tavolozza è quella dell'Overworld dell'atlante, dove si poteva:
   l'erba `#35a541`, l'acqua `#1e7cb8`, la schiuma bianca. Chi cambia un
   colore qui lo cambia in tutti i livelli.
   ═══════════════════════════════════════════════════════════════════ */

export const COLORI = {
  erba: ['#3aa844', '#349e3f'],           // i due verdi della scacchiera
  erbaCiuffo: '#2a8a3a',
  erbaLuce: '#6add4b',
  acqua: '#1e7cb8',
  acquaFonda: '#165c88',
  acquaRiflesso: '#5aaee0',
  schiuma: '#ffffff',
  ghiaccio: '#c6e9f8',
  ghiaccioOmbra: '#9fcfe8',
  ghiaccioBordo: '#82bcdc',
  ghiaccioLuce: '#ffffff',
}

/* i verdi e le foglie di ogni stagione: solo il vestito */
export const STAGIONI = {
  primavera: { erba: ['#3aa844', '#349e3f'], ciuffo: '#2a8a3a', fiori: ['#ffffff', '#ffd84a', '#ff8fb8'], foglie: null, neve: false },
  estate:    { erba: ['#44ad3f', '#3ca339'], ciuffo: '#2f8a30', fiori: ['#ffe066', '#ffffff'], foglie: null, neve: false },
  autunno:   { erba: ['#6fa83c', '#679e37'], ciuffo: '#55862c', fiori: null, foglie: ['#e0832a', '#c95f1f', '#e8b43a'], neve: false },
  inverno:   { erba: ['#4f9f6c', '#489566'], ciuffo: '#3c8058', fiori: null, foglie: null, neve: true },
}

const TAVOLOZZA = {
  '.': null,
  // la carota
  k: '#5c2a0c', o: '#f68a22', O: '#ffc46e', d: '#ce6016',
  g: '#5cbe46', G: '#287830', h: '#aaeb78',
  // l'albero
  n: '#163a28', v: '#22683e', V: '#348c48', L: '#6ebe60', t: '#744a2a', T: '#4e301c',
  w: '#ffffff', W: '#d6e8f4',
  // la tana
  r: '#2e8034', R: '#54b24c', q: '#84d268', e: '#684024', E: '#926238',
  b: '#1c100a', B: '#3a2214', m: '#7a4e28', M: '#aa763e', y: '#ffd65a', f: '#ff78a0',
  // la staccionata
  s: '#8a5a30', S: '#b07a44', z: '#5a381c',
  // il masso (n è il contorno scuro dell'albero, che va bene anche qui)
  c: '#5a5048',
  // il fumetto, il cuore, la stellina
  x: '#2b3320', q: '#3a3a3a', p: '#b0204a', P: '#ff5a86', Y: '#fff2a0',
}

/* il masso ha i suoi grigi: la stessa lettera vuol dire un'altra cosa
   in un altro disegno, e si dice qui accanto */
export const TAVOLOZZA_MASSO = { n: '#4a3020', M: '#b88a58', L: '#e2c294', m: '#86603a', c: '#5e4028' }

export const CAROTA = [
  '..G.g.G..',
  '...GgG...',
  '..gGhGg..',
  '...kkk...',
  '..kOook..',
  '..kOoodk.',
  '..kOoodk.',
  '...kOodk.',
  '...kodk..',
  '...kodk..',
  '....kk...',
  '....k....',
]

export const ALBERO = [
  '.....nnnnn......',
  '...nnVVVVvnn....',
  '..nVVLLVVVVvn...',
  '.nVLLVVVVVVvvn..',
  '.nVLVVVVVVVvvn..',
  'nVVVVVVVVVvvvvn.',
  'nVVVVVVVVvvvvvn.',
  'nvVVVVVVvvvvvvn.',
  '.nvvVVVvvvvvvn..',
  '.nnvvvvvvvvvnn..',
  '..nnnvvvvvnnn...',
  '....nnntTnn.....',
  '......ttT.......',
  '......ttT.......',
  '.....tttTT......',
]

/* lo stesso albero d'inverno: la neve sta sopra, dove la chioma prende
   il cielo */
export const ALBERO_NEVE = [
  '.....nWWWn......',
  '...nWwwwWWnn....',
  '..nWwwWWVVVvn...',
  '.nVLLVVVVVVvvn..',
  '.nWWwVVVVWWvvn..',
  'nVWwwVVVWwwWvvn.',
  'nVVVVVVVVvvvvvn.',
  'nvVWWWVVvvWWvvn.',
  '.nvvVVVvvvvvvn..',
  '.nnvvvvvvvvvnn..',
  '..nnnvvvvvnnn...',
  '....nnntTnn.....',
  '......ttT.......',
  '......ttT.......',
  '.....tttTT......',
]

/* d'autunno lo stesso albero con le foglie accese: la forma è quella,
   cambia la tavolozza */
export const ALBERO_AUTUNNO = { righe: ALBERO, tavolozza: { n: '#4a2410', v: '#a44a18', V: '#d8702a', L: '#f2b04a' } }

export const TANA = [
  '.....rrrrrr.....',
  '...rrRRRRRRrr...',
  '..rRRqqRRRRRRr..',
  '.rRqqRRRRwRRRRr.',
  '.rRRRRRRwyRRRRr.',
  'rRRRRmmmmmmRRRRr',
  'rRRRmMMMMMMmRRRr',
  'rRRmMbbbbbbMmRRr',
  'rRRmMbBBBBbMmRfr',
  'rRRmMbBBBBbMmRRr',
  'eRRmMbBBBBbMmRRe',
  'eERmMbBBBBbMmREe',
  '.eEmMbBBBBbMmEe.',
  '..eeeeeeeeeeee..',
]

/* il cespuglio: basso e tondo, senza tronco, con le bacche — l'albero
   è alto e ha il tronco, e i due si devono distinguere al primo colpo
   d'occhio anche se per le regole sono la stessa cosa (alti tutti e due) */
export const CESPUGLIO = [
  '................',
  '................',
  '....nnnnnnn.....',
  '..nnVVVLLVVnn...',
  '.nVVLLVVVVVVVn..',
  'nVVLVVVfVVVVvvn.',
  'nVVVVVVVVVfVvvn.',
  'nVfVVVVVVVVvvvn.',
  'nvVVVVfVVvvvvfn.',
  'nvvVVVVVvvvvvvn.',
  '.nvvvvvvvvfvvn..',
  '..nnvvvvvvvnn...',
  '....nnnnnnn.....',
]
export const TAVOLOZZA_BACCHE = { f: '#e8384f' }
export const TAVOLOZZA_FIORI = { f: '#fff4a8' }

/* il masso da spingere: tondo, con la luce da una parte e l'ombra
   dall'altra. Deve sembrare una cosa che rotola, e il sasso piantato
   (quello dell'atlante, col muschio e i fiori) una cosa che sta lì da
   sempre: la differenza fra i due è la regola, e si deve vedere */
export const MASSO = { tavolozza: TAVOLOZZA_MASSO, righe: [
  '....nnnnnn....',
  '..nnMMMMMMnn..',
  '.nMMLLMMMMMMn.',
  '.nMLLMMMMMMmn.',
  'nMMLMMMMMMMmmn',
  'nMMMMMMMMMmmmn',
  'nMMMMMMMMmmcmn',
  'nMMMMMMmmmmcmn',
  '.nmMMMmmmmmmn.',
  '.nnmmmmmmmmnn.',
  '..nnnnnnnnnn..',
] }

/* il fumetto del «e adesso?»: la fila è finita e la tana non c'è */
export const FUMETTO = [
  '.xxxxxxxxx.',
  'xwwwwwwwwwx',
  'xwwwqqqwwwx',
  'xwwqwwwqwwx',
  'xwwwwwwqwwx',
  'xwwwwwqwwwx',
  'xwwwwqwwwwx',
  'xwwwwqwwwwx',
  'xwwwwwwwwwx',
  'xwwwwqwwwwx',
  '.xxwxxxxxx.',
  '...xw.x....',
  '....x......',
]

export const CUORE = [
  '.pp.pp.',
  'pPPpPPp',
  'pPPPPPp',
  '.pPPPp.',
  '..pPp..',
  '...p...',
]

export const STELLINA = [
  '..y..',
  '.yYy.',
  'yYYYy',
  '.yYy.',
  '..y..',
]

/* ── le lastre colorate ──
   Una pietra piatta posata sul prato, con dentro la forma del suo colore:
   il cerchio rosso, il quadrato blu, il triangolo giallo. La forma dice il
   colore anche a chi i colori non li distingue tutti — ed è la stessa che
   sta sulle carte (`viste/Lastra.vue`). La luce viene da sinistra in alto,
   come per il masso. */
const lastra = (forma, tavolozza) => ({ tavolozza, righe: [
  '.oooooooooooo.',
  'oLLLLLLLLLLLDo',
  ...forma.map(r => `oL${r}Do`),
  'oLFFFFFFFFFFDo',
  'oDDDDDDDDDDDDo',
  '.oooooooooooo.',
] })
export const LASTRE_DISEGNI = {
  rosso: lastra([
    'FFFFFFFFFF',
    'FFFFSSFFFF',
    'FFFSSSSFFF',
    'FFSSSSSSFF',
    'FFSSSSSSFF',
    'FFFSSSSFFF',
    'FFFFSSFFFF',
  ], { o: '#5a1a14', L: '#ff9a86', F: '#e0483a', D: '#a52a20', S: '#ffffff' }),
  blu: lastra([
    'FFFFFFFFFF',
    'FFFFFFFFFF',
    'FFFSSSSFFF',
    'FFFSSSSFFF',
    'FFFSSSSFFF',
    'FFFSSSSFFF',
    'FFFFFFFFFF',
  ], { o: '#14285a', L: '#9cc4ff', F: '#3a78de', D: '#22489a', S: '#ffffff' }),
  giallo: lastra([
    'FFFFFFFFFF',
    'FFFFSSFFFF',
    'FFFFSSFFFF',
    'FFFSSSSFFF',
    'FFFSSSSFFF',
    'FFSSSSSSFF',
    'FFSSSSSSFF',
  ], { o: '#5a4208', L: '#fff0a0', F: '#f4c430', D: '#b8860e', S: '#6a4a06' }),
}

/* un palo e mezza traversa per lato: la staccionata si compone cella
   per cella guardando le vicine (`scena/tela.js`), come le strade */
export const PALO = [
  '.zz.',
  'zSsz',
  'zSsz',
  'zSsz',
  'zSsz',
  'zSsz',
  'zzzz',
]

/* ── il disegno di un pezzo ──
   Una volta sola per pezzo: il canvas resta in memoria e da lì in poi si
   copia. `document` c'è solo nel browser, e questo file lo tocca solo
   quando qualcuno chiede un pezzo — importarlo in Node non rompe niente. */
const cache = new Map()
export function pezzo(nome, disegno) {
  if (cache.has(nome)) return cache.get(nome)
  /* un disegno è un elenco di righe, o `{ righe, tavolozza }` quando
     qualche lettera deve voler dire un altro colore */
  const righe = Array.isArray(disegno) ? disegno : disegno.righe
  const tav = Array.isArray(disegno) ? TAVOLOZZA : { ...TAVOLOZZA, ...disegno.tavolozza }
  const h = righe.length, w = Math.max(...righe.map(r => r.length))
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  for (let y = 0; y < h; y++) for (let x = 0; x < righe[y].length; x++) {
    const col = tav[righe[y][x]]
    if (!col) continue
    g.fillStyle = col
    g.fillRect(x, y, 1, 1)
  }
  cache.set(nome, c)
  return c
}

