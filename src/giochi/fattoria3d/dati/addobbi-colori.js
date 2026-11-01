/* I colori degli addobbi e gli addobbi di Natale (dato puro, nessun import: la foglia che leggono tutti, anche `dati/bestie.js` che non può
   importare `dati/addobbi.js`). Vedi docs/fattoria3d/addobbi.md.

   Un addobbo si compra **in un colore** e quel colore resta tuo; un altro colore si paga di nuovo. Un addobbo posseduto o addosso è
   una *chiave* `<id>:<colore>` (`mantellina:blu`); un salvataggio di prima ha l'id solo, e vale il colore di base: il primo della lista
   (è quello che le bestie indossavano, quando il colore era uno solo). Non si riordina e non si toglie un colore dalla lista: chi l'ha comprato lo perde. */

/** La tavolozza: id → [nome, esadecimale]. */
export const COLORI = {
  rosso:   ['Rosso',   0xd8322b], blu:     ['Blu',     0x2f6fd0], verde:   ['Verde',   0x3f9a4a], giallo:  ['Giallo',  0xf2b831],
  rosa:    ['Rosa',    0xf58bb0], fucsia:  ['Fucsia',  0xe8407a], viola:   ['Viola',   0x7b3fb0], arancio: ['Arancio', 0xf2802a],
  nero:    ['Nero',    0x24242a], bianco:  ['Bianco',  0xf4f4ee], marrone: ['Marrone', 0x5a3a1e], oro:     ['Oro',     0xf2c230],
  argento: ['Argento', 0xc9ced6], azzurro: ['Azzurro', 0x4fb4e8], notte:   ['Notte',   0x2a1f3a],
}

/** I colori degli addobbi della 2D: il primo è quello di base (quello che avevano). */
export const COLORI_2D = {
  fiore: ['rosa', 'giallo', 'bianco', 'viola', 'arancio'],
  cappellino: ['blu', 'rosso', 'verde', 'giallo', 'nero'],
  cilindro: ['nero', 'viola', 'blu', 'bianco', 'rosso'],
  corona: ['oro', 'argento', 'rosa', 'azzurro'],
  cappello_strega: ['notte', 'viola', 'verde', 'arancio'],
  occhialini: ['marrone', 'nero', 'rosso', 'azzurro', 'rosa'],
  occhiali: ['nero', 'rosso', 'blu', 'giallo', 'bianco'],
  fiocco: ['fucsia', 'rosso', 'blu', 'giallo', 'viola'],
  sciarpa: ['rosso', 'blu', 'verde', 'giallo', 'viola'],
  campanella: ['rosso', 'blu', 'verde', 'nero', 'rosa'],
  mantellina: ['rosso', 'blu', 'verde', 'viola', 'nero'],
  zainetto: ['giallo', 'rosso', 'blu', 'verde', 'viola'],
}

/** Gli addobbi di Natale (solo 3D): si comprano solo nei giorni di Natale, e comprati restano. `liv`: da che livello. Prezzi nella fascia
    «una cosetta» (🪙6–30, [calibrazione](docs/apprendimento/calibrazione.md)) e livelli dentro i primi dieci, dove si gioca a Natale. */
export const NATALE = [
  { id: 'cappello_elfo',  nome: 'Cappello da elfo',   emoji: '🎄', prezzo: 12, liv: 1, dove: 'testa',   colori: ['verde', 'rosso', 'blu'] },
  { id: 'cappello_babbo', nome: 'Cappello di Babbo Natale', emoji: '🎅', prezzo: 14, liv: 2, dove: 'testa', colori: ['rosso', 'verde', 'blu'] },
  { id: 'campanelli',     nome: 'Campanelli',         emoji: '🔔', prezzo: 10, liv: 3, dove: 'collo',   colori: ['oro', 'argento', 'rosso'] },
  { id: 'sciarpa_righe',  nome: 'Sciarpa a righe',    emoji: '🧣', prezzo: 14, liv: 4, dove: 'collo',   colori: ['rosso', 'verde', 'blu'] },
  { id: 'corna_renna',    nome: 'Corna di renna',     emoji: '🦌', prezzo: 16, liv: 6, dove: 'testa',   colori: ['marrone', 'bianco', 'oro'] },
  { id: 'pacco_regalo',   nome: 'Pacco regalo',       emoji: '🎁', prezzo: 22, liv: 8, dove: 'schiena', colori: ['rosso', 'verde', 'blu', 'viola'] },
]

/** Un id (o una chiave) → la chiave piena, col colore di base se manca; null se l'addobbo o il colore non esistono. */
export function chiaveDi(valore, listaColori) {
  if (typeof valore !== 'string') return null
  const [id, colore] = valore.split(':')
  const lista = listaColori(id)
  if (!lista) return null
  if (colore === undefined) return id + ':' + lista[0]
  return lista.includes(colore) ? id + ':' + colore : null
}
