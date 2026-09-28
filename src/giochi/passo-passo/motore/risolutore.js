/* IL RISOLUTORE — la strada più corta, cercata in ampiezza (esatta: la
   prima strada che trova è la più corta che esista). Serve ai test, agli
   aiuti (`suggerisci`) e al controllo che una regola serva davvero
   (`serveLaRegola`) — mai a giocare al posto del bambino. Le strade si
   contano in frecce, non in celle: una scivolata lunga sei celle è una
   freccia sola. */
import { PASSI, SALTI } from '../dati/mondo.js'
import { carteDi, daScegliere, eApri, eFine, eSe, valoreDi } from '../dati/carte.js'
import { Mondo, esegui, TANA, eErrore } from './mondo.js'

/* un tetto di sicurezza, non di gioco: una mappa da 63 celle con tre
   massi non ci arriva nemmeno vicino */
const LIMITE = 400000

/* le mosse che il livello mette in mano: le frecce-salto solo dove il
   livello le dichiara, e mai se la domanda è «senza salti» */
export const mosseDi = (liv, senza = null) =>
  liv.salti && senza !== 'salto' ? [...PASSI, ...SALTI] : PASSI

/* la strada più corta fino alla tana, con la carota se `carota`; `da`
   è un mondo già avviato, senza si parte dalla partenza. Torna l'elenco
   delle mosse, o `null` se da lì non si arriva. */
export function risolvi(liv, { carota = true, senza = null, da = null, limite = LIMITE } = {}) {
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
    if (visti.size > limite) return null
    fronte = dopo
  }
  return null
}

function strada(nodo) {
  const fuori = []
  for (let n = nodo; n && n.m; n = n.su) fuori.push(n.m)
  return fuori.reverse()
}

/* la quarta stella (vedi docs/passo-passo/stelle-e-aiuti.md): torna
   `{ carte, carota }` (`carota` falso solo se non si può prendere), o
   `null` se il livello non si vince. */
export function minimoDi(liv) {
  if (liv.zaino) {
    const buone = liv.soluzioni.filter(s => {
      const r = esegui(liv, s, { eventi: false })
      return r.esito === TANA && r.carota
    })
    return buone.length ? { carte: Math.min(...buone.map(carteDi)), carota: true } : null
  }
  const conCarota = risolvi(liv, { carota: true })
  if (conCarota) return { carte: conCarota.length, carota: true }
  const senza = risolvi(liv, { carota: false })
  return senza ? { carte: senza.length, carota: false } : null
}

/* le carte che una fila ha usato per arrivare: fino a quella dove il
   giro è finito (`esito.dove`) */
export const carteUsate = (fila, esito) => carteDi(fila.slice(0, esito.dove + 1))

/* il pezzo più lungo della fila del bambino che sta ancora su una
   strada più corta, e da lì la prima mossa di quella strada (vedi
   docs/passo-passo/stelle-e-aiuti.md). Torna una di tre cose:
     { che: 'mossa', cursore, mossa }  metti il cursore lì, e la freccia
                                       giusta è questa
     { che: 'via' }                    la fila vince già: manca solo ▶
     null                              non c'è niente da dire
   Con lo zaino l'aiuto è un altro (`suggerisciNelloZaino`). */
export function suggerisci(liv, fila = []) {
  if (liv.zaino) return suggerisciNelloZaino(liv, fila)
  const intera = esegui(liv, fila, { eventi: false })
  const vince = intera.esito === TANA
  for (const carota of [true, false]) {
    const corta = risolvi(liv, { carota })
    if (!corta) continue
    for (let k = fila.length; k >= 0; k--) {
      const r = esegui(liv, fila.slice(0, k), { eventi: false })
      if (eErrore(r.esito)) continue
      if (r.esito === TANA) {
        if (carota && !r.carota) continue
        if (carteUsate(fila, r) <= corta.length) return { che: 'via' }
        continue
      }
      const s = risolvi(liv, { carota, da: r.mondo })
      if (s && s.length && k + s.length === corta.length)
        return { che: 'mossa', cursore: k, mossa: s[0], resto: s.length,
                 accorcia: vince && (!carota || intera.carota) }
    }
  }
  return null
}

/* con lo zaino l'aiuto parte dalla soluzione scritta più simile (vedi
   docs/passo-passo/zaino.md) e torna una di:
     { che: 'mossa', cursore, mossa }    qui ci va questa freccia
     { che: 'scatola', cursore, testa }  qui ci va una scatola con questa testa
     { che: 'testa', apri, valore }      questa scatola vuole un altro valore
     { che: 'togli', cursore }           la carta prima del cursore è di troppo */
function suggerisciNelloZaino(liv, fila) {
  const r = esegui(liv, fila, { eventi: false })
  if (r.esito === TANA && r.carota) return { che: 'via' }
  const buona = !eErrore(r.esito) && r.esito !== TANA
  const sciolta = carota => {
    if (!buona || daScegliere(fila).length) return null
    const s = risolvi(liv, { carota, da: r.mondo })
    return s && s.length && s.length <= liv.zaino - carteDi(fila)
      ? { che: 'mossa', cursore: fila.length, mossa: s[0] } : null
  }

  const quasi = sciolta(true)
  if (quasi) return quasi

  let meglio = null
  for (const sol of liv.soluzioni) {
    let k = 0
    while (k < fila.length && k < sol.length && fila[k] === sol[k]) k++
    if (!meglio || k > meglio.k) meglio = { sol, k }
  }
  if (meglio && meglio.k < meglio.sol.length) {
    const { sol, k } = meglio
    const loro = fila[k], nostra = sol[k]
    /* la stessa scatola con un altro valore in testa: si cambia quello;
       una scatola d'un'altra specie (un ❓ dove ci va un 🔁) no — lì ci va
       la scatola giusta, e quella sbagliata resta dietro, spenta */
    if (eApri(nostra) && eApri(loro) && eSe(nostra) === eSe(loro))
      return { che: 'testa', apri: k, valore: valoreDi(nostra) }
    if (eFine(nostra)) return { che: 'togli', cursore: k + 1 }
    if (eApri(nostra)) return { che: 'scatola', cursore: k, testa: nostra }
    return { che: 'mossa', cursore: k, mossa: nostra }
  }
  return sciolta(false)
}

/* ── LA CARTA DEL GRADINO SERVE DAVVERO? ──
   È la domanda di `serveLaRegola`, fatta a una carta: il ripeti serve se
   la strada più corta fino a casa — anche senza la carota, che è la più
   corta di tutte — scritta freccia per freccia non sta nello zaino. Se ci
   stesse, il bambino che non ha capito il ciclo vincerebbe lo stesso, e
   il livello insegnerebbe a contare le frecce. */
export function serveLaCarta(liv) {
  if (!liv.zaino) return false
  const corta = risolvi(liv, { carota: false })
  return !!corta && corta.length > liv.zaino
}

/* ── LA REGOLA DEL GRADINO SERVE DAVVERO? ──
   Due modi di chiederselo, perché due regole sono diverse dalle altre:

     · il salto e la spinta: **senza, non si arriva proprio** — né con la
       carota né senza. Un livello dei massi che si vince girando attorno
       al masso è un livello del prato con un sasso in più. Le pecore
       stanno con loro: senza la loro regola non scappano, e nel recinto
       non ci va nessuno;
     · il ghiaccio e le buche: la strada giusta, giocata in un mondo dove
       il ghiaccio è prato (o la buca è una buca qualsiasi), **non
       vince**. Col ghiaccio spento si arriva quasi sempre, ma per
       un'altra strada: vuol dire che quella vera la regola la usava. */
export function serveLaRegola(liv, regola) {
  const vera = risolvi(liv, { carota: true })
  if (!vera) return false
  if (regola === 'salto' || regola === 'spinta' || regola === 'pecore')
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
export function misura(liv, { limite = LIMITE } = {}) {
  const conCarota = risolvi(liv, { carota: true, limite })
  const senzaCarota = conCarota ? risolvi(liv, { carota: false, limite }) : null
  const usa = { scivola: 0, salto: 0, spinta: 0, affonda: 0, masso: 0, buca: 0, passo: 0, fugge: 0 }
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
