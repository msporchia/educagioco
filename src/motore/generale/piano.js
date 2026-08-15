/* ═══════════════════════════════════════════════════════════════════
   IL PIANO — comporlo, pesarlo, e rifiutarlo prima di giocarlo

   `piano` è `{ idUnità: [ordini] }`. Il piano completo è quello scritto
   dal livello più quello del giocatore, che ha l'ultima parola sulle
   sue unità.

   ── IL RIFIUTO ──
   Un ordine che l'interfaccia non lascerebbe comporre può arrivare lo
   stesso: da un piano salvato ieri, da un livello ritoccato. Il motore
   non lo esegue e poi spiega — rifiuta il piano prima di cominciare, e
   dice quali ordini non stanno in piedi.

   ── I DIVIETI DI ANNIDAMENTO SONO DIDATTICA, NON TECNICA ──
   «Dentro un ramo non ci va un altro blocco» era, all'origine, un
   limite del motore: la vecchia esecuzione teneva due soli segnaposti
   (a che punto della fila, dentro quale ramo) e più di così non ci
   stava. Adesso le azioni si contengono a vicenda e l'annidamento
   sarebbe gratis — il divieto resta perché un bivio dentro un bivio a
   sei anni non si legge più, non perché il motore non ce la faccia. È
   una regola che si può ammorbidire livello per livello senza toccare
   niente di sotto.
   ═══════════════════════════════════════════════════════════════════ */
import { campoDi } from './campo.js'
import { VERBI, eBlocco, eCondizione, eRipeti, eRoutine,
         ramoDi, corpoDi, dentroA, saFare } from './vocabolario.js'
import { valutabile } from './domande/quali.js'

const clona = x => JSON.parse(JSON.stringify(x))

/* ── GLI ORDINI DEI NEMICI VENGONO DALLA SCENA CHE SI STA GIOCANDO ──
   Accetta il mondo, non il livello: nel mondo c'è la variante, e una
   variante può riscrivere il piano di chi non è tuo — è così che «da
   che parte entra l'orco» smette di essere sempre la stessa cosa.
   Prendendoli dal livello si giocavano quattro scene diverse con lo
   stesso piano nemico, e le tre varianti non smentivano più niente. */
export function pianoCompleto (mondoOLivello, delGiocatore) {
  const livello = mondoOLivello.livello || mondoOLivello
  const campoOra = mondoOLivello.campo || campoDi(livello)
  const p = {}
  const fazioni = campoOra.fazioni
  for (const nome in fazioni)
    for (const id in (fazioni[nome].ordini || {}))
      p[id] = clona(fazioni[nome].ordini[id])
  for (const id in (delGiocatore || {})) p[id] = clona(delGiocatore[id])
  return p
}

/* le unità di cui il giocatore firma gli ordini: quelle della sua
   fazione che il livello non ha già istruito */
export function mieUnita (livello) {
  const out = []
  const campo = campoDi(livello)
  for (const nome in campo.fazioni) {
    const fz = campo.fazioni[nome]
    if (fz.autore !== 'giocatore') continue
    campo.unita.filter(u => u.fazione === nome && !(fz.ordini || {})[u.id])
      .forEach(u => out.push(u.id))
  }
  return out
}

/* le unità di cui il giocatore può LEGGERE gli ordini scritti da altri */
export function altruiUnita (livello) {
  const out = []
  const fazioni = campoDi(livello).fazioni
  for (const nome in fazioni)
    for (const id in (fazioni[nome].ordini || {})) out.push(id)
  return out
}

/* ── E TUTTI QUELLI CHE STANNO IN CAMPO E NON COMANDI ──
   Non è lo stesso elenco, e confonderli nascondeva della gente: quello
   di sopra dice «di chi puoi leggere il piano», e chi un piano non ce
   l'ha — una guardia che dorme, un animale in gabbia che aspetta — non
   ci compariva. Ma la fila delle pastiglie in fondo allo schermo è
   **chi c'è**, non «chi ha degli ordini»: un personaggio che non si
   trova lì è un personaggio che non si può toccare, e la sua scheda
   (quanto vede, cosa sa fare, cosa non gli riesce) non la legge
   nessuno. Succedeva davvero, ed è stato notato giocando: «l'orco non
   me lo mostrava fra i tab». */
export function altriInCampo (livello) {
  const campo = campoDi(livello)
  return campo.unita
    .filter(u => (campo.fazioni[u.fazione] || {}).autore !== 'giocatore')
    .map(u => u.id)
}

/* ── E FRA QUELLI, CHI TI È CONTRO ──
   Non tutti quelli che non comandi sono avversari: il gatto da portare
   in salvo, la papera che segue il pane, la principessa da tirare fuori
   stanno in campo e non ti vogliono male. `ostile` è dichiarato dalla
   fabbrica con cui l'unità è nata (`chi.terzo` non lo è) e viaggia sulla
   schiera; qui si traduce in una domanda su un'unità, che è come la fa
   chi disegna. */
export const eOstile = (livello, id) => {
  const campo = campoDi(livello)
  const u = campo.unita.find(z => z.id === id)
  const f = u && campo.fazioni[u.fazione]
  return f ? f.ostile !== false : true
}

export const pianoVuoto = livello =>
  Object.fromEntries(mieUnita(livello).map(id => [id, []]))

/* quanti ordini pesa un piano: quelli dentro un `quando` e quelli dentro
   i rami di una condizione contano, se no nascondere una fila dentro un
   evento o dentro un bivio sarebbe gratis. E il blocco stesso pesa uno:
   decidere è una cosa che hai scritto tu. */
export function contaOrdini (piano) {
  let n = 0
  const conta = l => (l || []).forEach(o => {
    n++
    if (eBlocco(o)) { dentroA(o).forEach(conta); return }
    if (o && o.allora) conta(o.allora)
  })
  for (const id in (piano || {})) conta(piano[id])
  return n
}

/* tutte le voci di una fila, blocchi compresi e con dentro i loro rami:
   il validatore le guarda una per una */
const tutteLeVoci = l => (l || []).flatMap(o => eBlocco(o)
  ? [o, ...dentroA(o).flatMap(tutteLeVoci)]
  : [o, ...tutteLeVoci(o && o.allora)])

export function guaiDi (mondo, piano) {
  const out = []
  /* le azioni del piano si registrano PRIMA di guardarlo: `esegui
     [azione 2]` è un ordine buono solo se azione 2 esiste, e chi la
     dichiara è il piano stesso. Chiunque validi — il gioco mentre si
     scrive, il test prima di giocare — parte da qui. */
  mondo.registraRoutine(piano)
  for (const id in (piano || {})) {
    const u = mondo.perId[id]
    if (!u) { out.push({ unita: id, motivo: `«${id}» non è sul campo` }); continue }
    for (const o of tutteLeVoci(piano[id])) {
      /* ── un blocco non è un ordine ──
         Ha una condizione e due rami, e si controlla per quello che è:
         la condizione deve parlare di qualcosa che c'è, i rami devono
         essere liste, e dentro un ramo non ci va né un altro blocco né
         un `quando` — quello apre un piano nuovo, e un piano nuovo non
         sta dentro un bivio. */
      if (eCondizione(o)) {
        const dove = `${id}: condizione`
        if (!valutabile(mondo, o.cond))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — la condizione parla di una cosa che non c'è` })
        for (const r of ['vero', 'falso'])
          if (o[r] !== undefined && !Array.isArray(o[r]))
            out.push({ unita: id, ordine: o,
                       motivo: `${dove} — il ramo «${r}» non è una lista di ordini` })
        const dentro = [...ramoDi(o, 'vero'), ...ramoDi(o, 'falso')]
        if (dentro.some(eBlocco))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ramo non ci va un altro blocco: ` +
                             'scrivi un\'azione e chiamala con «esegui»' })
        if (dentro.some(q => q && q.verbo === 'quando'))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ramo non ci va un «quando senti»: ` +
                             'quello è un piano che parte da capo, e sta accanto agli altri' })
        continue
      }
      /* ── l'azione ──
         Una definizione, non un ordine: sta accanto alla fila, ha un
         nome e una lista dentro. Le regole sono due, e sono le stesse
         di tutti gli altri blocchi: dentro non ci va un «quando senti»
         (quello è un piano che parte da sé, e non si nasconde dentro
         una chiamata) né un'altra definizione di azione — le azioni si
         CHIAMANO fra loro, non si contengono. */
      if (eRoutine(o)) {
        const dove = `${id}: azione`
        if (!o.nome) out.push({ unita: id, ordine: o, motivo: `${dove} — senza nome non si può chiamare` })
        if (o.corpo !== undefined && !Array.isArray(o.corpo))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il corpo non è una lista di ordini` })
        if (corpoDi(o).some(eRoutine))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un'azione non se ne scrive un'altra: si chiama` })
        /* un «quando senti» DENTRO un'azione invece ci sta, ed è una
           cosa che serve: l'ascolto si arma quando l'azione viene
           chiamata, cioè «da adesso in poi ascolto anche questo». È il
           modo di non sentire un segnale prima di essere nel punto in
           cui quel segnale vuol dire qualcosa. Dentro il ramo di un
           bivio resta vietato: lì un piano che parte da capo non ci
           sta, perché il ramo è una strada, non un posto. */
        continue
      }
      /* ── il ciclo ──
         Una lista di ordini e un'uscita. Le regole sono le stesse dei
         rami: dentro non ci va un altro blocco (un ciclo dentro un
         ciclo non lo si legge più) né un «quando senti», che è un piano
         a parte. E l'uscita non è facoltativa: senza, il giro non
         finisce mai e gli ordini dopo non partono. */
      if (eRipeti(o)) {
        const dove = `${id}: ripeti`
        if (o.corpo !== undefined && !Array.isArray(o.corpo))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il corpo non è una lista di ordini` })
        if (!valutabile(mondo, o.finche))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — senza «smetti quando» è un giro che non finisce mai` })
        const dentro = corpoDi(o)
        if (dentro.some(eBlocco))
          out.push({ unita: id, ordine: o, motivo: `${dove} — dentro un ciclo non ci va un altro blocco` })
        if (dentro.some(q => q && q.verbo === 'quando'))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ciclo non ci va un «quando senti»` })
        continue
      }
      if (o && o.blocco)
        { out.push({ unita: id, ordine: o, motivo: `${id}: «${o.blocco}» non è un blocco` }); continue }
      const V = VERBI[o && o.verbo]
      const dove = `${id}: ${o && o.verbo}`
      if (!V) { out.push({ unita: id, ordine: o, motivo: `${dove} — non è un verbo` }); continue }
      /* un'attesa con la domanda non ha bersaglio: si controlla la
         domanda e si passa oltre */
      if (V.vuoleCond && o.cond) {
        if (!valutabile(mondo, o.cond))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — la domanda parla di una cosa che non c'è` })
        continue
      }
      const C = mondo.laCosa(o.complemento)
      if (!C) {
        out.push({ unita: id, ordine: o, motivo: o.complemento
          ? `${dove} «${o.complemento}» — qui non c'è niente che si chiami così`
          : `${dove} — questo ordine non dice su cosa` })
        continue
      }
      for (const q of (o.punti || []))
        if (!mondo.complementi(o.verbo).includes(q))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il punto «${q}» non è sulla mappa` })
      if (!V.accetta.includes(C.tipo))
        out.push({ unita: id, ordine: o, motivo: `${dove} — «${V.nome}» non prende ${C.tipo} («${C.nome}»)` })
      else if (!mondo.complementi(o.verbo).includes(o.complemento))
        out.push({ unita: id, ordine: o, motivo: `${dove} — «${C.nome}» non è in gioco in questo livello` })
      if (!saFare(u, o.verbo))
        out.push({ unita: id, ordine: o, motivo: `${dove} — ${u.nome || id} non sa «${V.nome}»` })
      if (o.finche && !valutabile(mondo, o.finche))
        out.push({ unita: id, ordine: o, motivo: `${dove} — la condizione parla di una cosa che non c'è` })
      /* UN ORDINE NON DECIDE. La guardia `se` non esiste più: chi deve
         scegliere fra due strade scrive un blocco condizione, e le due
         cose non si mescolano più in una riga. */
      if (o.se)
        out.push({ unita: id, ordine: o,
                   motivo: `${dove} — un ordine non porta una condizione addosso: ` +
                           'per scegliere fra due strade serve un blocco condizione' })
      /* l'uscita obbligatoria: un giro senza uscita non finisce mai */
      if (V.vuoleFinche && !valutabile(mondo, o.finche))
        out.push({ unita: id, ordine: o,
                   motivo: `${dove} — «${V.nome}» senza «smetti quando» è un giro che non finisce mai` })
    }
  }
  return out
}

/* ── QUELLO CHE MANCA A UN ORDINE ──
   Non è un guasto di chi ha scritto il livello: è un ordine che il
   bambino sta ancora scrivendo. Serve all'interfaccia per segnare la
   riga e per dire, invece di far partire una scena che non finirà,
   che cosa manca. Una frase sola, in seconda persona. */
export function manca (mondo, o) {
  /* un blocco condizione: gli manca la domanda, o gli manca da dire
     cosa fare. Un ramo vuoto è legittimo — vuol dire «in quel caso non
     fare niente» — ma tutti e due vuoti no: quel blocco non fa niente
     in nessuno dei due casi, e allora non è una decisione. */
  if (eCondizione(o)) {
    if (!valutabile(mondo, o.cond)) return 'la domanda della condizione non è finita'
    if (!ramoDi(o, 'vero').length && !ramoDi(o, 'falso').length)
      return 'i due rami sono vuoti: metti almeno un ordine in uno dei due'
    return ''
  }
  if (eRipeti(o)) {
    if (!corpoDi(o).length) return 'il ciclo è vuoto: mettici dentro almeno un ordine'
    if (!valutabile(mondo, o.finche))
      return 'manca lo «smetti quando»: senza, il giro non finisce mai e gli ordini dopo non partono'
    return ''
  }
  const V = VERBI[o && o.verbo]
  if (!V) return ''
  /* chi vuole una domanda è finito quando la domanda c'è, e non gli si
     chiede nessun bersaglio: la sua «cosa» è la domanda. (La vecchia
     forma con il complemento — «aspetta [il portone]» — resta buona.) */
  if (V.vuoleCond) {
    if (valutabile(mondo, o.cond)) return ''
    if (!mondo.laCosa(o.complemento)) return 'manca la domanda: cosa aspetti che succeda?'
  }
  if (V.vuoleFinche && !valutabile(mondo, o.finche))
    return 'manca il «smetti quando»: senza, il giro non finisce mai e gli ordini dopo non partono'
  if (o.finche && !valutabile(mondo, o.finche)) return 'la domanda dello «smetti quando» non è finita'
  if (!mondo.laCosa(o.complemento)) return 'manca il bersaglio'
  return ''
}
