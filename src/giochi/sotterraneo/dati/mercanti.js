// I mercanti della terra di sopra: chi vende cosa, e quanta roba ha sul banco secondo le discese finite. Dove
// stanno sulla mappa lo dice il foglietto (dati/terra-mappa.js, MERCANTI); come si compra motore/bottega.js.
// Il perché: docs/sotterraneo/roba.md, "I mercanti di sopra".
import { COSE, CURE, IN_VENDITA } from './cose.js'
import { CAMPAGNA, QUANTE_TAPPE } from './campagna.js'

// `vende`: le caselle (dove) e le chiavi che pesca; `sempre`: quello che non finisce mai (in cima al banco);
// `righe`: quante ne pesca, una voce per discese finite (0..6); `compra`: chi si prende la roba a metà prezzo
export const MERCANTI = [
  { chiave: 'armaiolo', nome: 'L\'armaiolo', em: '⚒️', sprite: 'armaiolo',
    dice: 'Armi, scudi e roba da mettersi addosso.',
    vende: { dove: ['mano', 'mancina', 'corpo'] }, sempre: [],
    righe: [3, 3, 4, 4, 5, 5, 6],
    // il prezzo più alto sul banco: prima della grotta niente terzo gradino, o chi ha le gemme scende già col
    // meglio e la discesa diventa una passeggiata (docs/sotterraneo/roba.md)
    tetto: [10, 18, 22, 28, 36, 36, 36] },

  { chiave: 'erborista', nome: 'L\'erborista', em: '🌿', sprite: 'erborista',
    dice: 'Pozioni e torce: di quelle non resta mai senza.',
    vende: { chiavi: ['elisir-toro'] }, sempre: [...CURE, 'torcia'],
    righe: [0, 0, 1, 1, 1, 1, 1] },

  // l'unico che compra: tre botteghe che comprano farebbero di ogni banco un posto dove svuotare le tasche
  { chiave: 'rigattiere', nome: 'Il rigattiere', em: '🧺', sprite: 'rigattiere',
    dice: 'Anelli, amuleti e chiavi vecchie. E ti compra quello che hai in tasca.',
    vende: { dove: ['dito'], chiavi: ['chiave'] }, sempre: [], compra: true,
    righe: [2, 2, 2, 3, 3, 3, 4] },
]

export const mercanteDi = chiave => MERCANTI.find(m => m.chiave === chiave) || null

// Chi aveva già finito delle discese quando la roba ha cominciato a restare la ritrova come gemme da spendere
// sopra (una volta sola, per discese finite 0..6): le discese dopo contano sulla roba, e a mani nude dalla grotta
// in giù non si passa. Misurato col giocatore finto: oltre questi numeri il banco non ha di meglio da vendere
export const GEMME_DI_BENTORNATO = [0, 40, 80, 120, 160, 160, 160]
export const gemmeDiBentornato = finite =>
  GEMME_DI_BENTORNATO[Math.max(0, Math.min(finite, GEMME_DI_BENTORNATO.length - 1))]

export const vendeLa = (m, k) => !!COSE[k] && IN_VENDITA.includes(k) &&
  ((m.vende.dove || []).includes(COSE[k].dove) || (m.vende.chiavi || []).includes(k))

export const righeDi = (m, finite) => m.righe[Math.max(0, Math.min(finite, m.righe.length - 1))]
export const tettoDi = (m, finite) => (m.tetto ? m.tetto[Math.max(0, Math.min(finite, m.tetto.length - 1))] : Infinity)

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
    if (m.righe.length !== QUANTE_TAPPE + 1) g.push(`${m.chiave}: le righe vanno date per 0..${QUANTE_TAPPE} discese finite`)
    for (let i = 1; i < m.righe.length; i++)
      if (m.righe[i] < m.righe[i - 1]) g.push(`${m.chiave}: con più discese finite ha meno roba`)
    for (const k of m.sempre) if (!COSE[k] || !COSE[k].prezzo) g.push(`${m.chiave}: "${k}" sempre sul banco, ma non si vende`)
    const pescabili = IN_VENDITA.filter(k => vendeLa(m, k) && !m.sempre.includes(k))
    if (Math.max(...m.righe) > pescabili.length)
      g.push(`${m.chiave}: vuole ${Math.max(...m.righe)} righe e ha ${pescabili.length} cose da pescare`)
  }
  // tutto quello che ha un prezzo lo vende qualcuno: una cosa che non si compra da nessuna parte è catalogo morto
  for (const k of IN_VENDITA)
    if (!MERCANTI.some(m => vendeLa(m, k) || m.sempre.includes(k))) g.push(`"${k}" non lo vende nessuno`)
  if (!MERCANTI.some(m => m.compra)) g.push('nessuno compra la roba: le tasche piene non si svuotano')
  return g
}
