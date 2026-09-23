/* ═══════════════════════════════════════════════════════════════════
   IL RISOLUTORE — la strada più corta, cercata in ampiezza

   Lo stato di una partita è piccolo: dove sta il coniglio, se ha preso
   la carota, dove stanno i massi, quali pozze sono diventate ponti. Su
   una mappa da sette per nove sono al più qualche migliaio di stati, e
   una ricerca in ampiezza li guarda tutti in un lampo. È **esatta**: la
   prima strada che trova è la più corta che esista, non una buona.

   Serve a tre cose, e nessuna delle tre è giocare al posto del bambino:

     1. **i test** — ogni tappa della campagna si vince, con la carota e
        senza, e la strada trovata giocata dal motore vince davvero;
     2. **gli aiuti** — il 💡 non dice la soluzione: trova il pezzo più
        lungo della fila del bambino da cui si può ancora arrivare, e
        da lì la prossima freccia giusta (`suggerisci`);
     3. **il controllo sulle regole** — un livello del ghiaccio che si
        vince anche col ghiaccio trattato da prato non insegna il
        ghiaccio (`serveLaRegola`). È il difetto dei livelli che passano
        tutti i controlli e non valgono niente.

   Le strade si contano in frecce, non in celle: una scivolata lunga sei
   celle è una freccia sola, ed è esattamente quello che il ghiaccio ha
   di bello.
   ═══════════════════════════════════════════════════════════════════ */
import { PASSI, SALTI } from '../dati/mondo.js'
import { Mondo, esegui, TANA, eErrore } from './mondo.js'

/* un tetto di sicurezza, non di gioco: una mappa da 63 celle con tre
   massi non ci arriva nemmeno vicino */
const LIMITE = 400000

/* le mosse che il livello mette in mano: le frecce-salto solo dove il
   livello le dichiara, e mai se la domanda è «senza salti» */
export const mosseDi = (liv, senza = null) =>
  liv.salti && senza !== 'salto' ? [...PASSI, ...SALTI] : PASSI

/* La strada più corta fino alla tana — con la carota, se `carota`.
   `da` è un mondo già avviato (il punto a cui è arrivata la fila del
   bambino): senza, si parte dalla partenza. Torna l'elenco delle mosse,
   o `null` se da lì non si arriva. */
export function risolvi(liv, { carota = true, senza = null, da = null } = {}) {
  const inizio = da ? da.clona() : new Mondo(liv, { senza, eventi: false })
  if (da) inizio.senza = senza ?? da.senza
  const mosse = mosseDi(liv, inizio.senza)
  const visti = new Set([inizio.chiave()])
  /* le strade si ricostruiscono all'indietro dai genitori: tenere una
     copia dell'elenco in ogni nodo costerebbe memoria per niente */
  let fronte = [{ w: inizio, su: null, m: null }]
  while (fronte.length) {
    const dopo = []
    for (const nodo of fronte) {
      for (const m of mosse) {
        const w = nodo.w.clona()
        const esito = w.mossa(m)
        if (eErrore(esito)) continue
        if (esito === TANA) {
          if (!carota || w.presa) return strada({ su: nodo, m })
          continue
        }
        const k = w.chiave()
        if (visti.has(k)) continue
        visti.add(k)
        dopo.push({ w, su: nodo, m })
      }
    }
    if (visti.size > LIMITE) return null
    fronte = dopo
  }
  return null
}

function strada(nodo) {
  const fuori = []
  for (let n = nodo; n && n.m; n = n.su) fuori.push(n.m)
  return fuori.reverse()
}

/* ── L'AIUTO ──
   Il pezzo più lungo della fila del bambino che non sbaglia e da cui si
   arriva ancora, e da lì la prima mossa di una strada più corta. Punta
   alla tana **con la carota** se da qualche parte della fila si può
   ancora prenderla; se no, alla tana e basta.

   Torna una di tre cose:
     { che: 'mossa', cursore, mossa }  metti il cursore lì, e la freccia
                                       giusta è questa (la tocca il bambino)
     { che: 'via' }                    la fila vince già: manca solo ▶
     null                              non c'è niente da dire (non capita
                                       in un livello che si vince) */
export function suggerisci(liv, fila = []) {
  const mete = risolvi(liv, { carota: true }) ? [true, false] : [false]
  for (const carota of mete) {
    for (let k = fila.length; k >= 0; k--) {
      const r = esegui(liv, fila.slice(0, k), { eventi: false })
      if (eErrore(r.esito)) continue
      if (r.esito === TANA) {
        if (!carota || r.carota) return { che: 'via' }
        continue
      }
      const s = risolvi(liv, { carota, da: r.mondo })
      if (s && s.length) return { che: 'mossa', cursore: k, mossa: s[0], resto: s.length }
    }
  }
  return null
}

/* ── LA REGOLA DEL GRADINO SERVE DAVVERO? ──
   Due modi di chiederselo, perché due regole sono diverse dalle altre:

     · il salto e la spinta: **senza, non si arriva proprio** — né con la
       carota né senza. Un livello dei massi che si vince girando attorno
       al masso è un livello del prato con un sasso in più;
     · il ghiaccio e le buche: la strada giusta, giocata in un mondo dove
       il ghiaccio è prato (o la buca è una buca qualsiasi), **non
       vince**. Col ghiaccio spento si arriva quasi sempre, ma per
       un'altra strada: vuol dire che quella vera la regola la usava. */
export function serveLaRegola(liv, regola) {
  const vera = risolvi(liv, { carota: true })
  if (!vera) return false
  if (regola === 'salto' || regola === 'spinta')
    return !risolvi(liv, { carota: false, senza: regola })
  const r = esegui(liv, vera, { senza: regola, eventi: false })
  return !(r.esito === TANA && r.carota)
}

/* ── QUANTO È FATTO UN LIVELLO ──
   Le misure che servono a scriverne uno e a controllarlo: la strada più
   corta con la carota e senza (la differenza è la deviazione che la
   carota chiede), e cosa fa davvero la strada giusta — quante scivolate,
   salti, spinte, buche. È così che si vede se un livello «del ghiaccio»
   il ghiaccio lo usa, o ci passa accanto. */
export function misura(liv) {
  const conCarota = risolvi(liv, { carota: true })
  const senzaCarota = risolvi(liv, { carota: false })
  const usa = { scivola: 0, salto: 0, spinta: 0, affonda: 0, masso: 0, buca: 0, passo: 0 }
  if (conCarota) {
    const r = esegui(liv, conCarota)
    for (const p of r.passi) for (const e of p.eventi) if (e.che in usa) usa[e.che]++
  }
  return {
    conCarota, senzaCarota,
    lunga: conCarota ? conCarota.length : null,
    corta: senzaCarota ? senzaCarota.length : null,
    deviazione: conCarota && senzaCarota ? conCarota.length - senzaCarota.length : null,
    usa,
  }
}
