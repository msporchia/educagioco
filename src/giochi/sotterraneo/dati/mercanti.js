// I mercanti della terra di sopra: chi vende cosa, e quanta roba ha sul banco secondo le discese finite. Dove
// stanno sulla mappa lo dice il foglietto (dati/terra-mappa.js, MERCANTI); come si compra motore/bottega.js.
// Il perché: docs/sotterraneo/bottega.md, "I mercanti di sopra".
import { COSE, CURE_IN_VENDITA, IN_VENDITA, COPRICAPI, baseDi, tipoDellaCasella } from './cose.js'
import { CAMPAGNA, QUANTE_TAPPE } from './campagna.js'
import { portaLa } from './eroi.js'

// `vende`: le caselle (dove) e le chiavi che vende; `sempre`: quello che non finisce mai (in cima al banco);
// `passo`: le caselle della riga della storia (dati/storia.js) che porta, e `altre` quante cose in più pesca che
// non costano più di quel pezzo (motore/storia.js, bancoDelPasso); `righe`: chi pesca e basta, quante ne pesca
// per discese finite; `compra`: chi si prende la roba a metà prezzo. `dice` è la sua battuta, in voce sua.
// `vende.famiglie`: se c'è, dei pezzi di quei posti vende solo quelle famiglie (l'incantatrice: bacchette e stoffa);
// `vende.senza`: quelle che non vende (il fabbro, che lavora il ferro: né bacchette né stoffa). `schede[].famiglie`: la
// linguetta serve solo a chi porta una di quelle famiglie, e agli altri non si mostra (schedeDi)
// `schede`: le linguette in cima alla bottega (viste/Bottega.vue), ognuna coi posti (`dove`) o gli usi (`usa`) che
// raccoglie; `vendi` è quella delle tasche e `riacquista` quella delle ultime cose vendute, solo per chi compra
// (docs/sotterraneo/bottega-finestra.md, "La bottega e lo zaino"). `copricapi`: la linguetta dei copricapi, che c'è solo dove sono accesi
// (il 3D, Corredo.copricapi: docs/sotterraneo/elmo.md)
export const MERCANTI = [
  // la roba del passo dopo, non quella della miniera: chi ha le gemme non scende col meglio
  // le chiavi restano quelle di prima (salvataggi, sprite); i nomi sono parole che un bambino conosce
  { chiave: 'armaiolo', nome: 'Il fabbro', em: '⚒️', sprite: 'armaiolo',
    dice: 'Lame, scudi, corazze ed elmi, battuti uno per uno su questa incudine. Guarda pure.',
    schede: [{ chiave: 'armi', nome: 'Armi', em: '⚔️', dove: ['mano'] },
             { chiave: 'difese', nome: 'Scudi e armature', em: '🛡️', dove: ['mancina', 'corpo'] },
             { chiave: 'elmi', nome: 'Elmi', em: '🪖', dove: ['testa'], famiglie: ['ferro'], copricapi: true }],
    vende: { dove: ['mano', 'mancina', 'corpo', 'testa'], senza: ['bacchette', 'stoffa'] }, sempre: [],
    passo: ['mano', 'mancina', 'corpo'], altre: 2 },

  // il fabbro lavora il ferro, lei la magia: le bacchette e i bastoni, le vesti di stoffa e l'energia (docs/sotterraneo/bottega.md)
  { chiave: 'incantatrice', nome: 'L\'incantatrice', em: '🔮', sprite: 'incantatrice',
    dice: 'Bacchette per le mani, stoffa per le spalle, cappelli per la testa, e una boccetta blu per quando la magia si spegne.',
    schede: [{ chiave: 'bacchette', nome: 'Bacchette e bastoni', em: '🪄', dove: ['mano'], famiglie: ['bacchette'] },
             { chiave: 'vesti', nome: 'Vesti', em: '🧥', dove: ['corpo'], famiglie: ['stoffa'] },
             { chiave: 'cappelli', nome: 'Cappelli', em: '🎩', dove: ['testa'], famiglie: ['stoffa'], copricapi: true },
             { chiave: 'energia', nome: 'Energia', em: '🧪', usa: ['energia'] },
             // la pergamena del portale, solo dopo la sua missione (`dopo`: si mostra quando quella missione è consegnata)
             { chiave: 'pergamene', nome: 'Pergamene', em: '📜', usa: ['portale'], dopo: 'quaderno' }],
    vende: { dove: ['mano', 'corpo', 'testa'], famiglie: ['bacchette', 'stoffa'] }, sempre: ['pozione-blu', 'ampolla-blu', 'pergamena-portale'],
    passo: ['mano', 'corpo'], altre: 1 },

  { chiave: 'erborista', nome: 'La guaritrice', em: '🌿', sprite: 'erborista',
    dice: 'Pozioni per chi sanguina, torce per chi ha paura del buio. Laggiù servono tutte e due.',
    schede: [{ chiave: 'pozioni', nome: 'Pozioni', em: '🧪', usa: ['cura', 'cresci'] },
             { chiave: 'torce', nome: 'Torce', em: '🔥', usa: ['luce'] }],
    vende: { chiavi: [] }, sempre: [...CURE_IN_VENDITA, 'torcia'],
    righe: [0, 0, 0, 0, 0, 0, 0, 0] },

  // l'unico che compra: tre botteghe che comprano farebbero di ogni banco un posto dove svuotare le tasche
  { chiave: 'rigattiere', nome: 'Il mercante', em: '🧺', sprite: 'rigattiere',
    dice: 'Anelli, collane, amuleti, roba che luccica. E quello che non ti serve, te lo compro io.',
    schede: [{ chiave: 'gioielli', nome: 'Gioielli', em: '💍', dove: ['dito', 'collo'], usa: ['porta'] },
             { chiave: 'vendi', nome: 'Vendi', em: '💎', vendi: true },
             { chiave: 'riacquista', nome: 'Riacquista', em: '🔄', riacquista: true }],
    vende: { dove: ['dito', 'collo'], chiavi: ['chiave'] }, sempre: [], compra: true,
    passo: ['collo', 'dito', 'dito2'], altre: 1 },
]

export const mercanteDi = chiave => MERCANTI.find(m => m.chiave === chiave) || null

// un pezzo di un posto che vende, se la sua famiglia non è esclusa (`senza`) e, dove `famiglie` c'è, è una di quelle
const dellaFamiglia = (v, c) => !(v.senza || []).includes(c.famiglia) && (!v.famiglie || v.famiglie.includes(c.famiglia))
export const vendeLa = (m, k) => !!COSE[k] && (IN_VENDITA.includes(baseDi(k)) || COPRICAPI.includes(baseDi(k))) &&
  (((m.vende.dove || []).includes(COSE[k].dove) && dellaFamiglia(m.vende, COSE[k])) || (m.vende.chiavi || []).includes(baseDi(k)))

// le linguette che un eroe vede: quelle che non chiedono una famiglia, e quelle di una famiglia che porta (a un cavaliere
// la bottega dell'incantatrice non mostra le bacchette)
// (`stati`: le missioni dell'avventura; una linguetta con `dopo` compare solo a quella missione consegnata; `copricapi`: se sono accesi)
export const schedeDi = (m, eroe, stati = null, { copricapi = false } = {}) => m.schede.filter(s => (!s.famiglie || s.famiglie.some(f => portaLa(eroe, { famiglia: f }))) &&
  (!s.dopo || (stati && stati[s.dopo] === 'consegnata')) && (!s.copricapi || copricapi))

// la linguetta di una cosa: la prima che ne raccoglie il posto o l'uso
export const schedaDi = (m, k) => (COSE[k]
  ? m.schede.find(s => !s.vendi && !s.riacquista && ((s.dove || []).includes(COSE[k].dove) || (s.usa || []).includes(COSE[k].usa))) || null
  : null)

// Un pezzo delle righe dopo della storia si compra lo stesso, se hai le gemme: ogni riga avanti al passo costa un
// prezzo pieno in più (una riga avanti il doppio, due il triplo…). `righe` 0 è il pezzo con cui si entra nella
// prossima discesa, a prezzo pieno. Misurato: docs/sotterraneo/bottega.md, «I mercanti di sopra»
export const sovrapprezzo = righe => (righe > 0 ? 1 + righe : 1)
export const prezzoAvanti = (prezzo, righe) => Math.round(prezzo * sovrapprezzo(righe))

export const righeDi = (m, finite) => (m.righe ? m.righe[Math.max(0, Math.min(finite, m.righe.length - 1))] : 0)

// quanto è "giù" il banco: la metà della discesa che viene (quello che il mercante dentro le discese pescava a
// metà strada), e finite le sei il fondo. Pesa i prezzi come prima (pescaMerce, prezzoAtteso)
export function profonditaDelBanco(finite) {
  const t = CAMPAGNA[Math.max(0, finite)]
  return t ? (t.dif[0] + t.dif[1]) / 2 : 1
}

export function guastiDeiMercanti() {
  const g = []
  const viste = new Set()
  for (const m of MERCANTI) {
    if (viste.has(m.chiave)) g.push(`due mercanti con la chiave "${m.chiave}"`)
    viste.add(m.chiave)
    if (!m.nome || !m.em || !m.dice || !m.sprite) g.push(`${m.chiave}: senza nome, emoji, frase o sprite`)
    if (!m.righe === !m.passo) g.push(`${m.chiave}: o porta il passo della storia o pesca a righe, non tutti e due`)
    if (m.righe && m.righe.length !== QUANTE_TAPPE + 1)
      g.push(`${m.chiave}: le righe vanno date per 0..${QUANTE_TAPPE} discese finite`)
    for (let i = 1; i < (m.righe || []).length; i++)
      if (m.righe[i] < m.righe[i - 1]) g.push(`${m.chiave}: con più discese finite ha meno roba`)
    for (const c of m.passo || []) if (!(m.vende.dove || []).includes(tipoDellaCasella(c))) g.push(`${m.chiave}: porta il passo su ${c}, ma non lo vende`)
    for (const k of m.sempre) if (!COSE[k] || !COSE[k].prezzo) g.push(`${m.chiave}: "${k}" sempre sul banco, ma non si vende`)
    // ogni cosa del banco sta sotto una linguetta, e quella delle tasche ce l'ha solo chi compra
    if (!m.schede || !m.schede.some(s => !s.vendi && !s.riacquista)) g.push(`${m.chiave}: senza linguette`)
    for (const k of IN_VENDITA)
      if ((vendeLa(m, k) || m.sempre.includes(k)) && m.schede && !schedaDi(m, k)) g.push(`${m.chiave}: "${k}" non sta sotto nessuna linguetta`)
    if ((m.schede || []).some(s => s.vendi) !== !!m.compra) g.push(`${m.chiave}: la linguetta «Vendi» va a chi compra, e solo a lui`)
    if ((m.schede || []).some(s => s.riacquista) !== !!m.compra) g.push(`${m.chiave}: la linguetta «Riacquista» va a chi compra, e solo a lui`)
    const pescabili = IN_VENDITA.filter(k => vendeLa(m, k) && !m.sempre.includes(k))
    if (Math.max(0, ...(m.righe || [])) > pescabili.length)
      g.push(`${m.chiave}: vuole ${Math.max(...m.righe)} righe e ha ${pescabili.length} cose da pescare`)
  }
  // tutto quello che ha un prezzo lo vende qualcuno: una cosa che non si compra da nessuna parte è catalogo morto
  for (const k of COPRICAPI) {
    if (!MERCANTI.some(m => vendeLa(m, k))) g.push(`"${k}" non lo vende nessuno`)
    for (const m of MERCANTI) if (vendeLa(m, k) && !(schedaDi(m, k) || {}).copricapi) g.push(`${m.chiave}: "${k}" fuori dalla linguetta dei copricapi`)
  }
  for (const k of IN_VENDITA)
    if (!MERCANTI.some(m => vendeLa(m, k) || m.sempre.includes(k))) g.push(`"${k}" non lo vende nessuno`)
  if (!MERCANTI.some(m => m.compra)) g.push('nessuno compra la roba: le tasche piene non si svuotano')
  return g
}
