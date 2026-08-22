/* ═══════════════════════════════════════════════════════════════════
   QUANTO HA GIOCATO, E A COSA — il registro delle sessioni

   Un genitore vuole potersi fare un'idea di quanto sta davanti allo
   schermo e a cosa: «oggi mezz'ora, quasi tutta fattoria» è una frase
   che nessuna schermata di questo gioco sapeva dire. I contatori del
   profilo raccontano *quanto ha fatto* (stanze, mostri, tappe), mai
   *quanto tempo*.

   Qui si registra la cosa più semplice che serva: **ogni sessione di
   gioco**, cioè quale gioco, quando è cominciata e quanti secondi è
   durata. Cinque minuti di Survivors alle 13:24, otto di sotterraneo
   alle 15:48.

   ── PERCHÉ LE SESSIONI E NON UN TOTALE AL GIORNO ──────────────────
   Un totale per giorno sarebbe metà del codice e basterebbe ai grafici
   di oggi. Ma la cosa che verrà chiesta dopo — e che è già stata
   nominata — è **un tetto giornaliero per gioco**: al massimo un quarto
   d'ora di fattoria, cinque minuti di dungeon. Quel tetto ha bisogno di
   sapere quanto è stato consumato *oggi, di quel gioco*, e con le
   sessioni la risposta è una somma; con un totale unico bisognerebbe
   rifare il dato. Il tetto **non c'è e non si fa adesso**: qui si
   raccoglie soltanto quello che gli servirebbe.

   ── DOVE STA, E PERCHÉ NON DENTRO IL PROFILO ──────────────────────
   In archivio, sotto `sessioni:<id del giocatore>`. Il profilo si
   riscrive **intero** a ogni `persist()` — a ogni moneta, a ogni
   risposta — e un elenco che cresce di dieci righe al giorno finirebbe
   in quella scrittura per sempre. Qui invece si scrive una volta a
   sessione, quando finisce.

   ── LE TRE COSE CHE SI SBAGLIANO ──────────────────────────────────
   1. **Il telefono che si blocca.** Un bambino posa il telefono col
      gioco aperto e torna dopo tre ore: senza chiudere la sessione
      quando la pagina va in secondo piano, il registro direbbe tre ore
      di sotterraneo. Chi ci chiama (`App.vue`) sospende e riprende, e
      qui c'è comunque un tetto per sessione (`MAX_SESSIONE`) come rete.
   2. **I tocchi di passaggio.** Aprire un gioco e uscire subito capita
      dieci volte di fila mentre si sceglie: sotto `MINIMA` non si
      scrive niente, se no il registro è fatto di righe da due secondi.
   3. **Il giorno è quello di casa, non UTC.** Una partita delle 23:40
      appartiene a oggi anche se in UTC è già domani, e `chiaveGiorno`
      usa l'ora locale apposta.
   ═══════════════════════════════════════════════════════════════════ */

import { load, save, flush, remove } from './storage.js'

/* sotto cinque secondi non è una partita, è un tocco di passaggio */
export const MINIMA = 5
/* nessuna sessione dura più di due ore: oltre, è un telefono dimenticato
   acceso e il numero sarebbe una bugia grossa in un elenco di verità
   piccole */
export const MAX_SESSIONE = 2 * 3600
/* quanto indietro si tiene: tre mesi coprono «oggi», «settimana» e
   «mese» con margine, e un registro che cresce all'infinito su un
   telefono è una cosa che nessuno va mai a pulire */
export const GIORNI_TENUTI = 100

const CHIAVE = id => `sessioni:${id}`

/* ── il giorno di una sessione, in ora locale ──
   `2026-08-22`, che è anche l'ordine giusto per confrontarle come
   stringhe. */
export function chiaveGiorno(quando) {
  const d = new Date(quando)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${g}`
}

/* ── PURE: i conti che i grafici mostrano ─────────────────────────
   Stanno qui e non nel componente perché sono la parte che si sbaglia —
   il confine dei giorni, i giochi senza sessioni, la settimana che
   comincia da lunedì — e si provano in Node (`test/unita/sessioni`).
   Una voce è `{ g: chiave, t: quando, s: secondi }`. */

/* i minuti per gioco, in un intervallo. Ordinati dal più giocato:
   l'elenco risponde a «a cosa gioca», e la risposta è la prima riga. */
export function perGioco(voci, { da = 0, a = Infinity } = {}) {
  const somma = new Map()
  for (const v of voci) {
    if (v.t < da || v.t > a) continue
    somma.set(v.g, (somma.get(v.g) || 0) + v.s)
  }
  return [...somma.entries()]
    .map(([gioco, secondi]) => ({ gioco, secondi, minuti: Math.round(secondi / 60) }))
    .sort((x, y) => y.secondi - x.secondi)
}

/* ── i giorni, uno per barra ──
   `quanti` giorni fino a oggi compreso, **anche quelli vuoti**: un
   grafico che salta i giorni senza partite mente sulla forma della
   settimana — tre giorni di fila a zero sono l'informazione, non il
   nulla da nascondere. */
export function perGiorno(voci, { quanti = 7, oggi = Date.now() } = {}) {
  const fuori = []
  const giorno = 86400000
  for (let i = quanti - 1; i >= 0; i--) {
    const quando = oggi - i * giorno
    const k = chiaveGiorno(quando)
    fuori.push({ giorno: k, quando, secondi: 0, minuti: 0 })
  }
  const per = new Map(fuori.map(d => [d.giorno, d]))
  for (const v of voci) {
    const d = per.get(chiaveGiorno(v.t))
    if (d) d.secondi += v.s
  }
  for (const d of fuori) d.minuti = Math.round(d.secondi / 60)
  return fuori
}

/* Il totale di un gioco **oggi**: è il conto che servirà al tetto
   giornaliero, ed è già qui perché è la stessa somma che fa il grafico.
   Il tetto non esiste ancora: questa funzione è la sua metà pronta. */
export function oggiDi(voci, gioco, oggi = Date.now()) {
  const k = chiaveGiorno(oggi)
  let s = 0
  for (const v of voci) if (v.g === gioco && chiaveGiorno(v.t) === k) s += v.s
  return s
}

/* quello che si butta: più vecchio di `GIORNI_TENUTI` */
export function potate(voci, { oggi = Date.now(), giorni = GIORNI_TENUTI } = {}) {
  const limite = oggi - giorni * 86400000
  return voci.filter(v => v.t >= limite)
}

/* ── L'ARCHIVIO ───────────────────────────────────────────────────
   Da qui in giù si tocca il disco, e niente è puro. */

export async function leggiSessioni(id) {
  if (!id) return []
  return (await load(CHIAVE(id)))?.voci || []
}

export async function scriviSessione(id, { gioco, quando, secondi }) {
  if (!id || !gioco) return false
  const s = Math.round(Math.min(MAX_SESSIONE, secondi))
  if (s < MINIMA) return false
  const voci = potate([...(await leggiSessioni(id)), { g: gioco, t: quando, s }])
  save(CHIAVE(id), { voci })
  await flush()
  return true
}

/* Un bambino eliminato si porta via il suo registro: sta fuori dal
   profilo, quindi non se ne va da solo — ed è l'unico modo in cui un
   dato «fuori dai profili» diventa un dato orfano che nessuno guarda
   più e nessuno può cancellare. */
export const scordaSessioni = id => (id ? remove(CHIAVE(id)) : null)

/* ── IL CRONOMETRO ────────────────────────────────────────────────
   Uno solo, e vive quanto la pagina. `App.vue` dice quando si entra in
   un gioco e quando se ne esce; il resto — la pagina che va in secondo
   piano, il bambino che cambia — passa dagli stessi due gesti.

   `orologio` è iniettabile per i test: senza, sarebbe una funzione che
   si può provare solo aspettando davvero cinque secondi. */
let aperta = null      // { gioco, id, da }
let orologio = () => Date.now()

export function usaOrologio(f) { orologio = f || (() => Date.now()) }

export function entra(gioco, id) {
  if (aperta) esci()
  if (!gioco || !id) return null
  aperta = { gioco, id, da: orologio() }
  return aperta
}

/* Chiude quella aperta e la scrive, se è durata abbastanza. Non aspetta
   nessuno: chi esce da un gioco sta già guardando un'altra schermata, e
   una scrittura in archivio non deve stare in mezzo. */
export function esci() {
  const s = aperta
  aperta = null
  if (!s) return null
  const secondi = (orologio() - s.da) / 1000
  scriviSessione(s.id, { gioco: s.gioco, quando: s.da, secondi }).catch(() => {})
  return { ...s, secondi }
}

export const inCorso = () => aperta
