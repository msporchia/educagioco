// Come cresce l'eroe (docs/sotterraneo/livelli.md): l'esperienza dell'avventura, il livello che ne viene, i punti
// dati alle quattro caratteristiche e quanto rendono. Funzioni pure: le usano il Corredo (i numeri dell'eroe, sotto e
// sopra), la Corsa (l'esperienza dei mostri battuti) e la pagina dell'eroe. Gira in Node.
import { CHIAVI_CARATTERISTICHE, PUNTI_PER_LIVELLO, DOTE_OGNI, VITA_PER_TEMPRA, TEMPRA_PER_DIFESA,
         GEMME_PER_RIASSEGNARE, livelloDi, sogliaDi, SCARTO_AMMESSO, stannoInsieme, chiTrattiene, COME_LI_DA } from '../dati/livelli.js'
import { rileggiAlbero } from './abilita.js'
import { TASCHE_EXTRA_MAX } from '../dati/mondo.js'

// in `cfg.avventure[eroe].crescita`: l'esperienza e i punti dati, caratteristica per caratteristica (quelli di
// partenza della classe e la sua dote non ci stanno: si contano dal livello). `albero` e `caselle`: le abilità
// imparate e quelle portate nello scontro (motore/abilita.js)
// imparate e quelle portate nello scontro (motore/abilita.js). `v`: 2 da quando le caratteristiche sono forza, destrezza,
// intelligenza e tempra (9 ottobre 2026); prima erano forza, tempra, scorza e fortuna
export const VERSIONE_CRESCITA = 2
// `elisir`: i punti di vita massima bevuti con gli elisir del toro, per sempre (come le tasche comprate): un salvataggio
// di prima non ce l'ha, e vale zero
export const CRESCITA_NUOVA = () => ({ v: VERSIONE_CRESCITA, esp: 0, forza: 0, destrezza: 0, intelligenza: 0, tempra: 0,
  albero: {}, caselle: [null, null, null], tasche: 0, elisir: 0 })
export const ELISIR_MAX = 90   // trenta elisir: più di quanti se ne troveranno mai, e un dato storto non gonfia la vita

const intero = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0)

// un dato storto è un eroe nuovo; più punti dati di quelli che il livello concede si tolgono dalla fine.
// `classe`: i nodi dell'albero di un'altra classe si buttano. Una crescita di prima delle caratteristiche nuove
// tiene esperienza e albero, e i punti tornano tutti da dare: la scorza e la fortuna non ci sono più
export function rileggiCrescita(dato, classe = null) {
  const c = CRESCITA_NUOVA()
  if (!dato || typeof dato !== 'object') return c
  c.esp = intero(dato.esp)
  c.tasche = Math.min(TASCHE_EXTRA_MAX, intero(dato.tasche))   // le tasche comprate in più (dati/mondo.js)
  c.elisir = Math.min(ELISIR_MAX, intero(dato.elisir))
  // di prima: la versione vecchia, o senza versione ma con la scorza o la fortuna (si scrivevano sempre tutte e quattro)
  const diPrima = dato.v != null ? dato.v !== VERSIONE_CRESCITA : ('scorza' in dato || 'fortuna' in dato)
  if (diPrima) return { ...c, ...rileggiAlbero(dato, c.esp, classe) }
  let resta = (livelloDi(c.esp) - 1) * PUNTI_PER_LIVELLO
  for (const k of CHIAVI_CARATTERISTICHE) {
    c[k] = Math.min(intero(dato[k]), resta)
    resta -= c[k]
  }
  return { ...c, ...rileggiAlbero(dato, c.esp, classe) }
}

export const livelloDella = cr => livelloDi(cr ? cr.esp : 0)
export const datiDella = cr => CHIAVI_CARATTERISTICHE.reduce((n, k) => n + ((cr && cr[k]) || 0), 0)
export const puntiDaDare = cr => Math.max(0, (livelloDella(cr) - 1) * PUNTI_PER_LIVELLO - datiDella(cr))

// la dote della classe: ogni DOTE_OGNI livelli un punto da sé nella sua caratteristica (il cavaliere la tempra…)
export const doteDi = (eroe, livello) => Math.floor((Math.max(1, livello) - 1) / DOTE_OGNI)

// quanto vale una caratteristica adesso: la partenza della classe, i punti dati e la dote
export function caratteristica(eroe, cr, k) {
  const liv = livelloDella(cr)
  return ((eroe.parte && eroe.parte[k]) || 0) + ((cr && cr[k]) || 0) + (eroe.dote === k ? doteDi(eroe, liv) : 0)
}

// Quello che la crescita aggiunge ai numeri di partenza della classe (vita, att, dif di dati/eroi.js, che già
// contano le caratteristiche di partenza): la vita dei livelli e della tempra, la difesa della tempra, e quanto è salita
// ogni caratteristica (`sopra`). L'attacco no: dipende dall'arma in mano, lo conta il Corredo
export function piuDellaCrescita(eroe, cr) {
  const liv = livelloDella(cr)
  const parte = eroe.parte || {}
  const sopra = Object.fromEntries(CHIAVI_CARATTERISTICHE.map(k => [k, caratteristica(eroe, cr, k) - (parte[k] || 0)]))
  return {
    livello: liv, sopra,
    vita: (liv - 1) * (eroe.vitaPerLivello || 2) + sopra.tempra * VITA_PER_TEMPRA + ((cr && cr.elisir) || 0),
    dif: Math.floor(sopra.tempra / TEMPRA_PER_DIFESA),
  }
}

// Riassegnare (l'utente, 9 ottobre): i punti dati tornano da dare, e costa GEMME_PER_RIASSEGNARE a punto. Torna la
// crescita nuova, o null se non c'è niente da rimettere
export const costoDelRiassegnare = cr => datiDella(cr) * GEMME_PER_RIASSEGNARE
export function riassegna(cr) {
  if (!datiDella(cr)) return null
  return { ...cr, ...Object.fromEntries(CHIAVI_CARATTERISTICHE.map(k => [k, 0])) }
}

// Il bilanciamento fra le caratteristiche (stannoInsieme, chiTrattiene) sta in dati/livelli.js, con COME_LI_DA: lo legge anche il
// costo dell'energia delle abilità. Qui si ridicono per chi le importa da qui
export { SCARTO_AMMESSO, stannoInsieme, chiTrattiene, COME_LI_DA }
export const puoiDare = (cr, k) => CHIAVI_CARATTERISTICHE.includes(k) && puntiDaDare(cr) > 0 && !chiTrattiene(cr, k)

// un punto dato: torna la crescita nuova, o null se non ci sono punti, la caratteristica non esiste o il punto
// lascerebbe indietro un'altra caratteristica
export function dai(cr, k) {
  if (!puoiDare(cr, k)) return null
  return { ...CRESCITA_NUOVA(), ...cr, [k]: ((cr && cr[k]) || 0) + 1 }
}

// i punti da dare, dati tutti come li dà il banco (dati/livelli.js, COME_LI_DA)
export function daiTutti(cr, eroe, come = null) {
  let c = { ...CRESCITA_NUOVA(), ...cr }
  while (puntiDaDare(c) > 0) c = dai(c, prossimoPunto(c, eroe, come))
  return c
}

// dove va il prossimo punto, per il banco: quello del giro, o se la regola non lo lascia la caratteristica più indietro
export function prossimoPunto(cr, eroe, come = null) {
  // l'eroe arriva come chiave (il banco) o come scheda (crescitaA): prima la scheda cadeva sul giro del cavaliere
  const giro = come || COME_LI_DA[(eroe && eroe.chiave) || eroe] || COME_LI_DA.cavaliere
  const k = giro[datiDella(cr) % giro.length]
  if (puoiDare(cr, k)) return k
  return CHIAVI_CARATTERISTICHE.reduce((a, b) => (((cr && cr[b]) || 0) < ((cr && cr[a]) || 0) ? b : a))
}

// la crescita di un eroe arrivato al livello `liv`, coi punti dati come li dà il banco
export function crescitaA(eroe, liv, come = null) {
  return daiTutti({ ...CRESCITA_NUOVA(), esp: sogliaDi(Math.max(1, liv)) }, eroe, come)
}

// la riga della pagina dell'eroe che dice da dove viene la vita bevuta (niente se non ne ha bevuta)
export const trattoDegliElisir = cr => (cr && cr.elisir > 0 ? `🐂 +${cr.elisir} vita, per sempre` : null)
