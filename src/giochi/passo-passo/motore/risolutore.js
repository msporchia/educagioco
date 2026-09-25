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
import { carteDi, daScegliere, eApri, eFine, eSe, valoreDi } from '../dati/carte.js'
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
/* `limite` è quanti stati guardare prima di arrendersi: il generatore
   lo abbassa, perché un posto con due pecore che chiede centomila stati
   per essere risolto è un posto che non gli serve */
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

/* ── LA STRADA PIÙ CORTA, IN CARTE ──
   La quarta stella: arrivare con la carota usando meno carte possibile.
   Le carte si contano fino a quella che ha portato a casa — quelle
   rimaste in coda non sono mai partite, e chi segue il 💡 da una fila
   lunga se le troverebbe dietro senza colpa.

   Senza zaino il minimo si **misura**: la fila è fatta solo di frecce, e
   la strada più corta del risolutore (in frecce, non in celle) è il
   programma più corto che esista. Con lo zaino no: il programma più
   corto coi cicli non lo trova una ricerca in ampiezza, quindi il
   minimo è la più corta delle `soluzioni` scritte — e un bambino che
   fa meglio la stella la prende lo stesso, perché si chiede «al più».
   Oggi ogni zaino è largo quanto la sua soluzione: lì la stella la dà
   la carota, e lo zaino è già il par.

   Torna `{ carte, carota }` (`carota` è falso solo se la carota non si
   può prendere), o `null` se il livello non si vince. */
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

/* ── L'AIUTO ──
   Il pezzo più lungo della fila del bambino che sta ancora **su una
   strada più corta**, e da lì la prima mossa di quella strada. Punta
   alla tana **con la carota** se si può prendere; se no, alla tana e
   basta. Non «da cui si arriva ancora», come era prima della quarta
   stella: chi seguiva il 💡 da una fila lunga arrivava a casa per la
   strada lunga, e poi il cartello gli diceva che si poteva fare con
   meno — il gioco che ti aiuta e poi ti rimprovera. Adesso seguire il
   💡 porta sempre alla strada più corta; se la fila arriva già ma è
   lunga, la mossa porta `accorcia` e il 🔎 lo dice.

   Torna una di tre cose:
     { che: 'mossa', cursore, mossa }  metti il cursore lì, e la freccia
                                       giusta è questa (la tocca il bambino)
     { che: 'via' }                    la fila vince già: manca solo ▶
     null                              non c'è niente da dire (non capita
                                       in un livello che si vince)
   Con lo zaino l'aiuto è un altro, e sta più sotto
   (`suggerisciNelloZaino`). */
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

/* ── L'AIUTO, CON LO ZAINO ──
   Qui la strada più corta non basta: scritta freccia per freccia nello
   zaino non ci sta, ed è proprio il punto del livello. Quindi l'aiuto
   guarda due cose, in quest'ordine:

     1. **quello che manca ci sta ancora sciolto?** Se la fila del bambino
        non sbaglia e la strada da dove arriva fino a casa (con la carota)
        entra nei posti rimasti, si consiglia la prossima freccia in fondo.
        È il bambino quasi arrivato, col suo programma che non somiglia a
        nessuna soluzione scritta: non lo si rimanda indietro;
     2. **la soluzione scritta più simile**: quella che ha in comune col
        bambino il pezzo di testa più lungo, e da lì la prima differenza.
        Una differenza può essere di quattro specie, e ognuna dice al
        bambino una cosa diversa:
          { che: 'mossa', cursore, mossa }    qui ci va questa freccia
          { che: 'scatola', cursore, testa }  qui ci va una scatola, con
                                              questa testa (`ripeti-5`,
                                              `ripeti-rosso`, `se-blu`…)
          { che: 'testa', apri, valore }      questa scatola vuole un altro
                                              valore in testa
          { che: 'togli', cursore }           la carta prima del cursore è
                                              di troppo (⌫)

   Una fila che vince già con la carota dice solo ▶ (`{ che: 'via' }`).
   Un livello senza soluzioni scritte (non ce n'è, oggi) si accontenta
   della tana. */
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
