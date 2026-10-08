// Gli oggetti a terra: una gemma resta dov'è caduta, e ogni tanto sul
// campo compare un oggetto che sta lì per qualche secondo e poi
// svanisce. Quattro oggetti: cuore (ridà una vita), calamita (tira le
// gemme per qualche secondo), cassa (apre un'offerta di carte, pagata con
// la domanda come sempre), bomba (va in tasca, e si lancia col pulsante). Il perché e i numeri: docs/survivors/regole.md
// e docs/survivors/taratura.md. Le forme le disegna scena/campo.js; il
// motore legge solo `peso` e `secondi`.

export const OGGETTI = {
  cuore:    { nome: 'cuore',    peso: 2,   colore: '#ff5470' },
  // tira per `secondi` le gemme entro `raggio`: tutto lo schermo, non
  // tutta la mappa (quelle lasciate lontano restano dove sono)
  calamita: { nome: 'calamita', peso: 2.5, colore: '#ff8a3c', secondi: 4, raggio: 420 },
  cassa:    { nome: 'cassa',    peso: 1.5, colore: '#d9a45c' },
  // la bomba ha un orologio suo (CFG.bomba): non ruba il posto agli altri
  bomba:    { nome: 'bomba',    aTempo: true, colore: '#ff6b3c' },
}

export const CHIAVI_OGGETTI = Object.keys(OGGETTI)

// il cuore non si offre a chi li ha tutti (si correrebbe per niente); la
// cassa non si offre oltre il suo tetto (lo tiene il motore, `cassaAmmessa`)
export function pescaOggetto(rnd, { feribile = true, cassa = true } = {}) {
  const buoni = CHIAVI_OGGETTI.filter(k => !OGGETTI[k].aTempo
                                          && (feribile || k !== 'cuore') && (cassa || k !== 'cassa'))
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
    if (!o.aTempo && !(o.peso > 0)) guasti.push(`${dove}: peso ${o.peso}`)
    if (!/^#[0-9a-f]{6}$/i.test(o.colore || '')) guasti.push(`${dove}: colore "${o.colore}"`)
  }
  for (const k of ['cuore', 'calamita', 'cassa', 'bomba'])
    if (!tabella[k]) guasti.push(`manca l'oggetto "${k}", che il motore conosce per nome`)
  const c = tabella.calamita
  if (c && !(c.secondi >= 2 && c.secondi <= 8))
    guasti.push(`la calamita dura ${c?.secondi} secondi: o non si vede o è un muro`)
  const senza = new Set()
  let s = 0.01
  for (let i = 0; i < 40; i++) { senza.add(pescaOggetto(() => s, { feribile: false })); s = (s + 0.0249) % 1 }
  if (senza.has('cuore')) guasti.push('a cuori pieni esce lo stesso un cuore')
  if (senza.size < 2) guasti.push('a cuori pieni resta un oggetto solo da trovare')
  const tetto = new Set()
  s = 0.01
  for (let i = 0; i < 40; i++) { tetto.add(pescaOggetto(() => s, { cassa: false })); s = (s + 0.0249) % 1 }
  if (tetto.has('cassa')) guasti.push('oltre il tetto esce lo stesso una cassa')
  if (!tetto.size) guasti.push('senza cassa non esce niente')
  return guasti
}
