/* ═══════════════════════════════════════════════════════════════════
   GLI OGGETTI A TERRA — le cose che si trovano in giro

   Questo gioco era «sto fermo e guardo»: le gemme camminavano da sole
   verso l'eroe, i mostri arrivavano comodi da tutti i lati, e l'arco
   tirava da solo. Il dito serviva a scansare, e neanche sempre. Adesso
   **le cose si trovano in giro**: una gemma resta dov'è caduta, e ogni
   tanto sul campo compare un oggetto che sta lì per qualche secondo e
   poi svanisce — chi lo vuole ci va.

   Tre oggetti, e ognuno dà una cosa sola:

     cuore     ti torna un cuore, subito (il tetto non cambia)
     calamita  per qualche secondo tutte le gemme in campo volano da te
     cassa     si apre un'offerta di carte, **pagata con la domanda come
               sempre**: una risposta sbagliata non paga, e niente si
               regala senza esercizio (vedi `CALIBRAZIONE.md`). La
               cassa non è un potenziamento gratis, è un'occasione in
               più di guadagnarselo

   `peso` è quanto spesso esce fra i tre. Il cuore ha un peso suo solo
   quando manca un cuore: a cuori pieni non uscirebbe per niente, e un
   oggetto che non fa niente è una corsa a vuoto.

   Da dove arrivano: **a tempo** (`CFG.oggetti.ogni`, in `taratura.js`) e
   **dai mostri grossi** — cinghiale, roccia e colosso ne lasciano uno
   con una certa probabilità (`daiGrossi`). A tempo perché le prime tappe
   non hanno bestie grosse e senza questa riga il prato verde non avrebbe
   niente da raggiungere; dai grossi perché ammazzare un colosso deve
   valere qualcosa di più della sua gemma.

   Le forme le disegna `scena/campo.js`; il motore legge solo `peso`
   e `secondi`.
   ═══════════════════════════════════════════════════════════════════ */

export const OGGETTI = {
  cuore:    { nome: 'cuore',    peso: 2,   colore: '#ff5470' },
  calamita: { nome: 'calamita', peso: 2.5, colore: '#ff8a3c', secondi: 4 },
  cassa:    { nome: 'cassa',    peso: 1.5, colore: '#d9a45c' },
}

export const CHIAVI_OGGETTI = Object.keys(OGGETTI)

/* Quale oggetto esce, dato il caso e se manca un cuore: il cuore non si
   offre a chi li ha tutti, o si corre per niente. */
export function pescaOggetto(rnd, { feribile = true } = {}) {
  const buoni = CHIAVI_OGGETTI.filter(k => feribile || k !== 'cuore')
  let totale = 0
  for (const k of buoni) totale += OGGETTI[k].peso
  let s = rnd() * totale
  for (const k of buoni) { s -= OGGETTI[k].peso; if (s <= 0) return k }
  return buoni[buoni.length - 1]
}

export function guastiDegliOggetti(tabella = OGGETTI) {
  const guasti = []
  const nomi = new Set()
  for (const [chiave, o] of Object.entries(tabella)) {
    const dove = `oggetto "${chiave}"`
    if (nomi.has(o.nome)) guasti.push(`${dove}: nome ripetuto ("${o.nome}")`)
    nomi.add(o.nome)
    if (!(o.peso > 0)) guasti.push(`${dove}: peso ${o.peso}`)
    if (!/^#[0-9a-f]{6}$/i.test(o.colore || '')) guasti.push(`${dove}: colore "${o.colore}"`)
  }
  for (const k of ['cuore', 'calamita', 'cassa'])
    if (!tabella[k]) guasti.push(`manca l'oggetto "${k}", che il motore conosce per nome`)
  /* la calamita deve durare abbastanza da vedersi, e non tanto da
     diventare un'aspirapolvere permanente */
  const c = tabella.calamita
  if (c && !(c.secondi >= 2 && c.secondi <= 8))
    guasti.push(`la calamita dura ${c?.secondi} secondi: o non si vede o è un muro`)
  /* a cuori pieni il cuore non deve uscire: una corsa per niente */
  const senza = new Set()
  let s = 0.01
  for (let i = 0; i < 40; i++) { senza.add(pescaOggetto(() => s, { feribile: false })); s = (s + 0.0249) % 1 }
  if (senza.has('cuore')) guasti.push('a cuori pieni esce lo stesso un cuore')
  if (senza.size < 2) guasti.push('a cuori pieni resta un oggetto solo da trovare')
  return guasti
}
