/* La conversione 2D → 3D: da quello che la fattoria di sempre ha salvato (campagne.fattoria, letto con da2d/motore/fattoria.js) allo stato della fattoria 3D. Funzione
   pura (nessun profilo, nessun DOM; l'orologio arriva da fuori) che non lancia mai: un dato guasto o vuoto torna `null` e la 3D parte
   da zero. Le regole le ha decise l'utente (D1, docs/fattoria3d/parita/decisioni.md): fedele in tutto tranne nei piazzamenti, e MAI
   monete (le monete vengono solo dagli esercizi). Dal 22/10/2026 (D2) la scala dei livelli è la stessa della 2D: la mappatura è 1 a 1.
   Il perché di ogni scelta e la tabella cosa → cosa: docs/fattoria3d/parita/migrazione.md. */
import { Fattoria } from '../da2d/motore/fattoria.js'
import { PER_ID as COSE_2D } from '../da2d/dati/catalogo.js'
import { PER_COLTURA as COLTURE_2D, PER_RICETTA as RICETTE_2D, quantoCresciuto, MINUTO } from '../da2d/dati/coltivazioni.js'
import { livelloPer as livello2D, avanzamento as avanzamento2D, categoriaDi } from '../da2d/dati/livelli.js'
import { PIAZZOLE_INIZIALI } from '../da2d/dati/mondo.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { VOCE_DECORI } from '../dati/parita2d.js'
import { COLTURE } from '../dati/colture.js'
import { RICETTE, TIPI_DI_MACCHINA } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI } from '../dati/animali.js'
import { MANGIMI_SENZA_RICETTA } from '../dati/cortile2.js'
import { sogliaDi as soglia3D, livelloDelPezzo, livelloDellaColtura } from '../dati/livelli.js'
import { lottiPerPiazzole } from '../dati/regole.js'
import { LOTTI_INIZIALI, lottoPerId, VICINI_4, vicinoDi } from '../dati/mondo.js'
import { biomaDi } from '../dati/biomi.js'
import { BESTIE, idDa2D, COMPAGNO_DI, bestiaInForma } from '../dati/bestie.js'
import { PER_ID as ADDOBBI_3D, staA } from '../dati/addobbi.js'
import { POSTI_MASSIMI } from '../dati/posti.js'
import { SILOS, TIPI_DI_SILO, PASSI_PER_EDIFICIO, EDIFICI_PER_SILO } from '../dati/silos.js'
import { statoIniziale, normalizza } from './stato.js'

/** Il tetto di una scorta portata: nessuno ne ha tante, ma un dato guasto non deve gonfiare lo stato. */
const TETTO = 9999
const ESPERIENZA_MASSIMA = 1e9
/** Il numero di questa conversione: 1 non portava gli ingrandimenti dei silos, i posti della fila, le zucche e la peschiera; 2 non portava
    gli addobbi delle bestie. Uno stato convertito da una versione più vecchia si ritocca all'apertura (`ritoccaLaConversione`). */
export const MIGRAZIONE = 3

// ── la 2D → il pezzo o l'edificio 3D più vicino ──
// Le macchine: stesso mestiere, a volte altro nome (la Cucina 2D è la `conserviera`, il Pastificio 2D la `pasticceria`).
const MACCHINE = {
  mulino: 'mulino', fienile: 'fienile', panificio: 'panificio', caseificio: 'caseificio', telaio: 'telaio', cucina: 'conserviera',
  zuccherificio: 'zuccherificio', gelateria: 'gelateria', pastificio: 'pasticceria', sartoria: 'sartoria', tintoria: 'tintoria',
  friggitoria: 'friggitoria', sushi_bar: 'sushi_bar', mongolfiera: 'mongolfiera',
}
// I recinti che la 3D ha già (la peschiera non c'è: «da regalare»). Il pentolone è una macchina.
const RECINTI = { ovile: 'recinto', pollaio: 'pollaio', stalla: 'stalla', porcile: 'porcile', stagno_anatre: 'anatre', recinto_capre: 'capre', pentolone: 'pentolone',
  conigliera: 'conigliera', arnie: 'arnie', alpaca: 'alpaca', asini: 'asini' }      // giro G5; la peschiera no: la pesca ne prende il posto
// Le cose di mappa con un equivalente: il vicino (il carretto 2D è una vista del trattore, D10), il mercato, i decori dello stesso mestiere.
const ALTRE = {
  orto: 'campo', mercato: 'bancarella', carretto_mercato: 'trattore',
  fontana: 'fontana', pozzo: 'pozzo', stagno: 'stagno', laghetto: 'laghetto',      // fontana grande, cantina, pozzo coperto, panche e tavolino hanno ora il loro pezzo (DECORO_DA_2D)
  ponte: 'ponte', panchina: 'panchina', tavolo: 'tavolo', spaventapasseri: 'spaventapasseri',
  pasticceria: 'bottega_pasticceria', osteria: 'bottega_osteria', mensa: 'bottega_mensa', merceria: 'bottega_merceria',      // le botteghe del paese (giro G7): la 3D le ha dello stesso nome
  zucca_intagliata: 'zucca_intagliata', zucche_mucchio: 'zucche_mucchio',      // le zucche di Halloween: stesso id, ma stanno nella scheda delle feste, non fra i decori
  peschiera: 'porticciolo',            // la pesca ne ha preso il posto allo stesso livello (A1k): il pezzo più vicino è il porticciolo, uno solo
}
/** I silos della 2D sono edifici che la 3D mette da sé (`_assicuraMagazzini`) secondo gli ingrandimenti: non si portano come pezzi. */
const EDIFICI_DEI_SILOS = new Set(TIPI_DI_SILO.map(t => SILOS[t].edificio))
const PASSI_MASSIMI = PASSI_PER_EDIFICIO * EDIFICI_PER_SILO
const MACCHINA_3D = new Set(TIPI_DI_MACCHINA)

/** Le decorazioni portate in 3D (giro G8) hanno lo stesso id (tranne il `recinto` di legno): id 2D → id 3D. */
const DECORO_DA_2D = Object.fromEntries(Object.entries(VOCE_DECORI).map(([id3d, id2d]) => [id2d, id3d]))

/** Il pezzo 3D che sostituisce una voce 2D, o null (allora è «da regalare»). I fiori e i vasi diventano aiuole. */
export function pezzoPer(id2d) {
  const v = COSE_2D[id2d]
  if (!v) return null
  const t = (v.macchina && (MACCHINE[v.macchina] || RECINTI[v.macchina])) || (v.mongolfiera && 'mongolfiera') || MACCHINE[id2d] || RECINTI[id2d] || ALTRE[id2d] || DECORO_DA_2D[id2d]
    || (categoriaDi(id2d) === 'fiori' ? 'aiuola' : null)
  return t && (PEZZI[t] || EDIFICI[t]) ? t : null
}

// ── le merci ──
const COLTURA_DEL_RACCOLTO = {
  fieno: 'erba', carote: 'carota', zucche: 'zucca', patate: 'patata', cavolfiori: 'cavolfiore', pomodori: 'pomodoro',
  melanzane: 'melanzana', peperoni: 'peperone', cipolle: 'cipolla', fragole: 'fragola',
}
/** Dove sta in 3D un prodotto della 2D: `{ dove: 'merci' | 'prodotti' | 'lana', id }`, o null (non esiste in 3D: «da regalare»). */
export function merceDel(k) {
  if (typeof k !== 'string') return null
  const c = Object.prototype.hasOwnProperty.call(COLTURA_DEL_RACCOLTO, k) ? COLTURA_DEL_RACCOLTO[k] : k
  if (COLTURE[c]) return { dove: 'merci', id: c }
  if (k === 'lana') return { dove: 'lana', id: 'lana' }
  if (RICETTE[k] || PRODOTTI_ANIMALI[k] || MANGIMI_SENZA_RICETTA[k]) return { dove: 'prodotti', id: k }
  return null
}

const intero = (n, tetto = TETTO) => Number.isFinite(n) && n > 0 ? Math.min(tetto, Math.floor(n)) : 0
const aggiungi = (o, k, n) => { if (n > 0) o[k] = Math.min(TETTO, (o[k] || 0) + n) }

/** La terra: `n` lotti nuovi, i più vicini al quadrato di partenza che sono prato o bosco e confinano con uno proprio (mai mare, costa, lago). */
function lottiNuovi(n) {
  const propri = new Set(Object.keys(LOTTI_INIZIALI)), nuovi = []
  const distanza = l => Math.max(Math.abs(l.a - 3), Math.abs(l.b - 3)) * 100 + Math.hypot(l.a - 3, l.b - 3)
  while (nuovi.length < n) {
    let meglio = null
    for (const id of propri) {
      const l = lottoPerId(id)
      for (const [da, db] of VICINI_4) {
        const v = vicinoDi(l, da, db)
        if (propri.has(v.id) || Math.abs(v.a - 3) > 12 || Math.abs(v.b - 3) > 12 || !['prato', 'bosco'].includes(biomaDi(v.a, v.b))) continue
        if (!meglio || distanza(v) < distanza(meglio) || (distanza(v) === distanza(meglio) && v.id < meglio.id)) meglio = v
      }
    }
    if (!meglio) break
    propri.add(meglio.id); nuovi.push(meglio.id)
  }
  return nuovi
}

/** Il livello 3D per un livello 2D: lo stesso (D2: la 3D usa i 70 livelli della 2D). Resta una funzione perché la usano il salvataggio di prima
    (motore/scala-vecchia.js) e i test come «la mappatura»; l'identità è il suo valore, non un caso particolare. */
export function livelloPerProporzione(l2d) {
  return Math.max(1, l2d | 0)
}

/** Rilegge un dato della fattoria 2D come lo rilegge la 2D (i salvataggi di ieri, i campi che mancano), o null se è guasto. */
function leggi2D(dato) {
  if (!dato || typeof dato !== 'object' || Array.isArray(dato)) return null
  // un'esperienza assurda farebbe girare a vuoto la ricerca del livello (raddoppia finché non la supera): niente fattoria vera ne ha
  if ([dato.speso, dato.guadagnato].some(n => typeof n === 'number' && n > ESPERIENZA_MASSIMA)) return null
  try { return new Fattoria({ dato }) } catch (e) { return null }
}

/**
 * Lo stato 3D che corrisponde a una fattoria 2D salvata (`campagne.fattoria.cfg.stato`), o null se non c'è niente da portare.
 * `ora`: l'orologio (i raccolti maturi e il lavoro finito si ritirano, il resto torna ingredienti). Non cambia il dato 2D.
 * Cosa non ha un equivalente sta in `daRegalare` ({ 'cosa:ovile': 1, 'scorta:miele': 4, 'terra': 2, … }), mai tradotto in monete.
 */
export function statoDa2D(dato, { ora = Date.now() } = {}) {
  try {
    const f = leggi2D(dato)
    if (!f) return null
    const s = statoIniziale(), daRegalare = {}
    const magazzino = {}                                  // tipo 3D → quanti, da mettere in s.magazzino
    const possedute = {}                                  // id 2D → quante (in mappa o nel magazzino)
    for (const c of f.cose) aggiungi(possedute, c.id, 1)
    for (const [id, q] of Object.entries(f.magazzino)) aggiungi(possedute, id, intero(q))
    // i posti della fila comprati, copia per copia: quelli delle macchine in mappa stanno nella cosa, quelli delle macchine messe via in `fileRiposte`
    const filaComprata = {}                               // id 2D → posti comprati in tutto
    for (const c of f.cose) aggiungi(filaComprata, c.id, intero(c.fila))
    for (const [id, lista] of Object.entries(f.fileRiposte || {})) for (const n of lista) aggiungi(filaComprata, id, intero(n))

    // 1. le cose: un pezzo nel magazzino per ognuna; gli edifici sono uno per tipo, i doppioni e ciò che non esiste in 3D restano «da regalare».
    //    Una macchina ha una fila sola: i posti comprati e le copie in più diventano posti della sua fila, fino a sei; quel che non ci sta resta da regalare.
    let campi = 0
    for (const [id, q] of Object.entries(possedute)) {
      if (EDIFICI_DEI_SILOS.has(id)) continue
      const t = pezzoPer(id)
      if (!t) { aggiungi(daRegalare, 'cosa:' + id, q); continue }
      if (EDIFICI[t] || (PEZZI[t] && PEZZI[t].unico)) {
        let avanzo = q
        if (!magazzino[t]) { magazzino[t] = 1; avanzo-- }
        if (MACCHINA_3D.has(t)) {
          const M = s.macchine[t]
          M.posti = Math.min(POSTI_MASSIMI, M.posti + (filaComprata[id] || 0))
          while (avanzo > 0 && M.posti < POSTI_MASSIMI) { M.posti++; avanzo-- }
        }
        aggiungi(daRegalare, 'cosa:' + id, avanzo)
        continue
      }
      if (t === 'campo') campi += q
      else aggiungi(magazzino, t, q)
    }
    // i silos: gli ingrandimenti si portano (la capienza è la stessa della 2D); gli edifici li mette la 3D, quanti ne servono
    for (const t of TIPI_DI_SILO) s.silo[t] = Math.min(PASSI_MASSIMI, intero((f.silos || {})[t]))
    // il campo di partenza della 3D è già in mappa: ne contano uno in meno nel magazzino (i campi rincarano per copia, anche quelle nel magazzino)
    if (campi > 1) magazzino.campo = campi - 1
    for (const [t, n] of Object.entries(magazzino)) s.magazzino[t] = n

    // le botteghe portano con sé la fama (le consegne fatte): i cuori e i banconi sono quelli di prima, i clienti si ricompongono
    for (const [id, b] of Object.entries(f.botteghe || {})) {
      const t = ALTRE[id]
      if (t && magazzino[t] && b && b.consegne > 0) s.botteghe[t] = { consegne: intero(b.consegne), prossimo: 1, banconi: [] }
    }

    // 2. le scorte: raccolti, prodotti e lana uguali; ciò che la 3D non ha resta «da regalare»
    const scorta = (k, n) => {
      const m = merceDel(k)
      if (!m) { aggiungi(daRegalare, 'scorta:' + k, n); return }
      if (m.dove === 'lana') s.lana = Math.min(TETTO, s.lana + n)
      else aggiungi(s[m.dove], m.id, n)
    }
    for (const [k, n] of Object.entries(f.granaio)) scorta(k, intero(n))
    // il lavoro in corso: un raccolto maturo e un lavoro finito si ritirano, un lavoro non finito rende gli ingredienti (niente si perde, niente si regala)
    for (const c of f.cose) {
      const col = c.coltura && COLTURE_2D[c.coltura]
      if (col && quantoCresciuto(c.seminato, col.minuti, ora) >= 1) scorta(col.da, col.resa || 1)
      for (const p of c.coda || []) {
        const r = RICETTE_2D[p.ricetta]
        if (!r) continue
        if (ora >= p.da + r.minuti * MINUTO) scorta(r.da, r.resa || 1)
        else for (const [k, n] of Object.entries(r.prende || {})) scorta(k, intero(n))
      }
    }

    // 3. gli addobbi (il guardaroba della 2D è il cassetto della 3D) e le bestie di casa
    const nelCassetto = (id, n) => { if (ADDOBBI_3D[id]) aggiungi(s.addobbi, id, n); else aggiungi(daRegalare, 'addobbo:' + id, n) }
    for (const [id, n] of Object.entries(f.guardaroba)) nelCassetto(id, intero(n))
    // Le bestie di casa (G6, docs/fattoria3d/bestie-di-casa.md): chi aveva preso beagle, coniglio, pappagallo o gatto rosso li ritrova, col nome e con i bisogni a metà
    // (niente monete, niente premio già preso); il bobtail, il gatto bianco e nero e il gatto nero sono i compagni gratis (Watson, Sherlock, Pepe): portano il nome che avevano.
    // Gli addobbi che portava li porta ancora, se le stanno; se no tornano nel cassetto.
    const bestieDa2D = []
    for (const b of f.bestie) {
      const bid = idDa2D(b.chi) || COMPAGNO_DI[b.chi] || null
      const addosso = Object.values(b.addobbi || {})
      if (!bid) { aggiungi(daRegalare, 'bestia:' + b.chi, 1); for (const id of addosso) nelCassetto(id, 1); continue }
      const su = Object.fromEntries(addosso.filter(id => staA(id, bid)).map(id => [ADDOBBI_3D[id].dove, id]))
      s.casa[bid] = bestiaInForma({ nome: b.nome, pancia: 0.5, pelo: 0.5, gioco: 0.5, premiato: false, addobbi: su }, ora)
      for (const id of addosso) if (!Object.values(su).includes(id)) nelCassetto(id, 1)
      if (BESTIE[bid]) bestieDa2D.push(bid)
    }

    // 4. la terra: tutta quella che aveva (col regalo), rimessa in lotti da 4×4 (`lottiPerPiazzole`: la 2D parte con 324 celle, la 3D con 144, quindi anche chi non
    //    ha comprato niente ha la sua terra); quelli che non trovano posto restano «da regalare»
    const extra = Math.max(0, Object.keys(f.piazzole).length - PIAZZOLE_INIZIALI)
    const daAvere = lottiPerPiazzole(extra)
    const nuovi = lottiNuovi(daAvere)
    for (const id of nuovi) s.lotti[id] = true
    if (nuovi.length < daAvere) aggiungi(daRegalare, 'terra', daAvere - nuovi.length)

    // 5. il livello e l'esperienza: gli stessi della 2D (scala 1 a 1), poi mai sotto quello che serve a tenere ciò che si ha e le colture già aperte
    const esp2D = f.esperienza
    const l2D = livello2D(esp2D)
    let l3D = livelloPerProporzione(l2D)
    const base = l3D
    for (const t of Object.keys(magazzino)) if ((PEZZI[t] && PEZZI[t].produttivo) || EDIFICI[t]) l3D = Math.max(l3D, livelloDelPezzo(t))
    if (campi > 0) l3D = Math.max(l3D, livelloDelPezzo('campo'))
    for (const bid of bestieDa2D) l3D = Math.max(l3D, BESTIE[bid].liv)
    for (const chiave of Object.keys(f.reclamati || {})) {
      const m = /^coltura:(.+)$/.exec(chiave), mm = m && merceDel(m[1])
      if (mm && mm.dove === 'merci') l3D = Math.max(l3D, livelloDellaColtura(mm.id))
    }
    const quanto = l3D === base ? avanzamento2D(esp2D).quanto : 0
    s.esperienza = soglia3D(l3D) + Math.floor(quanto * (soglia3D(l3D + 1) - soglia3D(l3D)))

    // niente da portare (una fattoria 2D appena nata, o svuotata): la 3D parte da zero come sempre
    const niente = !esp2D && !f.cose.length && !Object.keys(f.magazzino).length && !Object.keys(f.granaio).length
      && !f.bestie.length && !Object.keys(f.guardaroba).length && extra === 0
    if (niente) return null

    s.daRegalare = daRegalare
    s.migrato = MIGRAZIONE
    return normalizza(s)
  } catch (e) {
    return null
  }
}

/** Ha la 3D, oggi, un posto per ciò che sta «da regalare»? Lo mette dove va e lo toglie dal conto; il resto aspetta. Muta `s` (normalizzato). */
function consegnaIlDovuto(s, ora) {
  const tiene = t => s.cose.some(c => c.tipo === t) || s.magazzino[t] > 0
  for (const [k, n] of Object.entries(s.daRegalare)) {
    const [genere, id] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)]
    let resta = n
    if (genere === 'cosa') {
      if (EDIFICI_DEI_SILOS.has(id)) resta = 0                   // i silos li mette la 3D dagli ingrandimenti
      else {
        const t = pezzoPer(id)
        if (t && (EDIFICI[t] || (PEZZI[t] && PEZZI[t].unico))) {
          if (!tiene(t)) { s.magazzino[t] = 1; resta-- }
          if (MACCHINA_3D.has(t)) while (resta > 0 && s.macchine[t].posti < POSTI_MASSIMI) { s.macchine[t].posti++; resta-- }
        } else if (t) { s.magazzino[t] = Math.min(TETTO, (s.magazzino[t] || 0) + resta); resta = 0 }
      }
    } else if (genere === 'scorta') {
      const m = merceDel(id)
      if (m && m.dove === 'lana') { s.lana = Math.min(TETTO, s.lana + resta); resta = 0 }
      else if (m) { aggiungi(s[m.dove], m.id, resta); resta = 0 }
    } else if (genere === 'addobbo') {
      if (ADDOBBI_3D[id]) { s.addobbi[id] = Math.min(99, (s.addobbi[id] || 0) + resta); resta = 0 }
    } else if (genere === 'bestia') {
      const bid = idDa2D(id)
      if (bid && !s.casa[bid]) { s.casa[bid] = bestiaInForma({ nome: '', pancia: 0.5, pelo: 0.5, gioco: 0.5, premiato: false }, ora); resta-- }
      else if (COMPAGNO_DI[id]) resta = 0
    }
    if (resta > 0) s.daRegalare[k] = resta
    else delete s.daRegalare[k]
  }
}

/** Uno stato convertito da una conversione più vecchia (`migrato` < MIGRAZIONE) riprende dalla 2D, che non si tocca mai, quello che allora
    non si portava (gli ingrandimenti dei silos, i posti della fila: mai meno di quanti ne ha già) e riceve ciò che sta «da regalare» e oggi c'è.
    Torna lo stesso oggetto se non c'è niente da fare. Mai monete, non lancia mai. */
export function ritoccaLaConversione(stato, dato2D, { ora = Date.now() } = {}) {
  try {
    if (!stato || typeof stato !== 'object' || !(stato.migrato > 0) || stato.migrato >= MIGRAZIONE) return stato
    const s = normalizza(stato)
    const rifatto = statoDa2D(dato2D, { ora })
    if (rifatto) {
      for (const t of TIPI_DI_SILO) s.silo[t] = Math.max(s.silo[t], rifatto.silo[t])
      for (const t of TIPI_DI_MACCHINA) s.macchine[t].posti = Math.max(s.macchine[t].posti, rifatto.macchine[t].posti)
      // le copie in più di una macchina, che allora erano «da regalare», ora sono posti della fila: resta da regalare solo quel che non ci sta
      for (const k of Object.keys(s.daRegalare)) {
        const t = k.startsWith('cosa:') && pezzoPer(k.slice(5))
        if (!t || !MACCHINA_3D.has(t)) continue
        if (rifatto.daRegalare[k] > 0) s.daRegalare[k] = Math.min(s.daRegalare[k], rifatto.daRegalare[k])
        else delete s.daRegalare[k]
      }
    }
    consegnaIlDovuto(s, ora)
    s.migrato = MIGRAZIONE
    return s
  } catch (e) {
    return stato
  }
}

/** Lo stato con cui parte la 3D: il suo, se c'è (ritoccato se viene da una conversione vecchia); se no quello portato dalla fattoria 2D (se c'è);
    se no niente (parte da zero). `leggi(chiave, campo)` legge il profilo. */
export function statoDaCaricare(leggi) {
  const suo = leggi('fattoria3d', 'stato', null)
  if (suo) return suo.migrato > 0 && suo.migrato < MIGRAZIONE ? ritoccaLaConversione(suo, leggi('fattoria', 'stato', null)) : suo
  return statoDa2D(leggi('fattoria', 'stato', null))
}

/** Il cheat `#fattoria3d-da2d`: la conversione rifatta dalla 2D del bambino, ignorando lo stato 3D (che il chiamante mette nel cestino).
    Torna lo stato convertito, o `null` se il bambino non ha una 2D da portare (allora non si butta niente). */
export function statoRifattoDa2D(leggi) {
  return statoDa2D(leggi('fattoria', 'stato', null))
}
