// I mercanti della terra di sopra: chi vende cosa, e quanta roba ha sul banco secondo le discese finite. Dove
// stanno sulla mappa lo dice il foglietto (dati/terra-mappa.js, MERCANTI); come si compra motore/bottega.js.
// Il perché: docs/sotterraneo/bottega.md, "I mercanti di sopra".
import { COSE, CURE, IN_VENDITA, baseDi } from './cose.js'
import { CAMPAGNA, QUANTE_TAPPE } from './campagna.js'

// `vende`: le caselle (dove) e le chiavi che vende; `sempre`: quello che non finisce mai (in cima al banco);
// `passo`: le caselle della riga della storia (dati/storia.js) che porta, e `altre` quante cose in più pesca che
// non costano più di quel pezzo (motore/storia.js, bancoDelPasso); `righe`: chi pesca e basta, quante ne pesca
// per discese finite; `compra`: chi si prende la roba a metà prezzo. `dice` è la sua battuta, in voce sua.
// `schede`: le linguette in cima alla bottega (viste/Bottega.vue), ognuna coi posti (`dove`) o gli usi (`usa`) che
// raccoglie; `vendi` è quella delle tasche, solo per chi compra (docs/sotterraneo/bottega.md, "La bottega e lo zaino")
export const MERCANTI = [
  // la roba del passo dopo, non quella della miniera: chi ha le gemme non scende col meglio
  { chiave: 'armaiolo', nome: 'L\'armaiolo', em: '⚒️', sprite: 'armaiolo',
    dice: 'Lame affilate e scudi robusti: li ho battuti tutti con questo martello.',
    schede: [{ chiave: 'armi', nome: 'Armi', em: '⚔️', dove: ['mano'] },
             { chiave: 'difese', nome: 'Scudi e armature', em: '🛡️', dove: ['mancina', 'corpo'] }],
    vende: { dove: ['mano', 'mancina', 'corpo'] }, sempre: [],
    passo: ['mano', 'mancina', 'corpo'], altre: 2 },

  { chiave: 'erborista', nome: 'L\'erborista', em: '🌿', sprite: 'erborista',
    dice: 'Le mie pozioni ti rimettono in piedi. E di torce ne ho sempre, non restare al buio.',
    schede: [{ chiave: 'pozioni', nome: 'Pozioni', em: '🧪', usa: ['cura', 'cresci'] },
             { chiave: 'torce', nome: 'Torce', em: '🔥', usa: ['luce'] }],
    vende: { chiavi: ['elisir-toro'] }, sempre: [...CURE, 'torcia'],
    righe: [0, 0, 1, 1, 1, 1, 1, 1] },

  // l'unico che compra: tre botteghe che comprano farebbero di ogni banco un posto dove svuotare le tasche
  { chiave: 'rigattiere', nome: 'Il rigattiere', em: '🧺', sprite: 'rigattiere',
    dice: 'Roba vecchia, roba che luccica… E se hai qualcosa che non ti serve, te la prendo io.',
    schede: [{ chiave: 'gioielli', nome: 'Gioielli', em: '💍', dove: ['dito'], usa: ['porta'] },
             { chiave: 'vendi', nome: 'Vendi', em: '💎', vendi: true }],
    vende: { dove: ['dito'], chiavi: ['chiave'] }, sempre: [], compra: true,
    passo: ['dito'], altre: 1 },
]

export const mercanteDi = chiave => MERCANTI.find(m => m.chiave === chiave) || null

export const vendeLa = (m, k) => !!COSE[k] && IN_VENDITA.includes(baseDi(k)) &&
  ((m.vende.dove || []).includes(COSE[k].dove) || (m.vende.chiavi || []).includes(baseDi(k)))

// la linguetta di una cosa: la prima che ne raccoglie il posto o l'uso
export const schedaDi = (m, k) => (COSE[k]
  ? m.schede.find(s => !s.vendi && ((s.dove || []).includes(COSE[k].dove) || (s.usa || []).includes(COSE[k].usa))) || null
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
    for (const c of m.passo || []) if (!(m.vende.dove || []).includes(c)) g.push(`${m.chiave}: porta il passo su ${c}, ma non lo vende`)
    for (const k of m.sempre) if (!COSE[k] || !COSE[k].prezzo) g.push(`${m.chiave}: "${k}" sempre sul banco, ma non si vende`)
    // ogni cosa del banco sta sotto una linguetta, e quella delle tasche ce l'ha solo chi compra
    if (!m.schede || !m.schede.some(s => !s.vendi)) g.push(`${m.chiave}: senza linguette`)
    for (const k of IN_VENDITA)
      if ((vendeLa(m, k) || m.sempre.includes(k)) && m.schede && !schedaDi(m, k)) g.push(`${m.chiave}: "${k}" non sta sotto nessuna linguetta`)
    if ((m.schede || []).some(s => s.vendi) !== !!m.compra) g.push(`${m.chiave}: la linguetta «Vendi» va a chi compra, e solo a lui`)
    const pescabili = IN_VENDITA.filter(k => vendeLa(m, k) && !m.sempre.includes(k))
    if (Math.max(0, ...(m.righe || [])) > pescabili.length)
      g.push(`${m.chiave}: vuole ${Math.max(...m.righe)} righe e ha ${pescabili.length} cose da pescare`)
  }
  // tutto quello che ha un prezzo lo vende qualcuno: una cosa che non si compra da nessuna parte è catalogo morto
  for (const k of IN_VENDITA)
    if (!MERCANTI.some(m => vendeLa(m, k) || m.sempre.includes(k))) g.push(`"${k}" non lo vende nessuno`)
  if (!MERCANTI.some(m => m.compra)) g.push('nessuno compra la roba: le tasche piene non si svuotano')
  return g
}
