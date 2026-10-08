/* Il quadro di un'età: cosa vede, cosa gli si chiede, cosa gli si dà per
   scontato. Descrive e non decide: nessuna regola nasce qui, si chiamano le
   stesse funzioni del gioco (confini delle fasce in quiz/nucleo/catalogo.js,
   portata in data/portata.js, eccezioni in data/partenze.js). Non importa
   Vue né lo store: le classi di domande si iniettano (il registro dei
   moduli vuole Vite), è l'unico motivo per cui gira in Node. Vedi
   docs/genitori/quadro.md, ritocchi.md e manopola.md. */
import { GIOCHI } from './giochi.js'
import { TAPPE_DEL_GIOCO } from './portata-giochi.js'
import { giocoDaOffrire, arcoDelGioco } from './portata.js'
import { SAPERI, sapereDi } from './saperi.js'
import { PARTENZE, eccezioniPerEta } from './partenze.js'
import { FASCE_ETA, doveCadeCon, gruppoDi } from '../quiz/nucleo/catalogo.js'
import { finestraDi, anniDelLivello } from '../quiz/nucleo/classi.js'
import { PASSO } from '../quiz/nucleo/modulo.js'
import { contoDi, consiglioDa } from '../quiz/consiglio.js'

// { torri: false } vuol dire spento, l'assenza vuol dire acceso (il patto di `settings`)
const spente = mappa => Object.keys(mappa || {}).filter(k => mappa[k] === false)

// cosa si offrirebbe a chi arriva adesso (provato: false), non lo stato di un profilo vero: vedi quadro.md
export const QUI = 'qui'            // ce l'ha in home
export const PASSATO = 'passato'    // troppo facile per lui, ormai
export const AVANTI = 'avanti'      // arriva più avanti
export const SPENTO = 'spento'      // l'ha spento un grande, non l'età

export function giochiDiUnEta ({ eta, giochi = {}, sa = {}, sperimentali = false } = {}) {
  const spenti = spente(sa)
  // giochi[k] === true: tienilo in casa anche se l'età dice di no (fissaGioco, vedi ritocchi.md)
  const forzati = new Set(Object.keys(giochi || {}).filter(k => giochi[k] === true))
  // quello che a quest'età si spegnerebbe da sé, per distinguere «l'hai spento tu» da «è l'età»
  const attese = eccezioniPerEta(eta)
  const dEta = new Set(spente(attese.giochi))
  const saDEta = new Set(spente(attese.sa))
  // spenti in questo profilo, per esteso o perché l'età li spegne e il profilo non li nomina
  const off = new Set([...spente(giochi),
    ...[...dEta].filter(k => typeof (giochi || {})[k] !== 'boolean')])

  return GIOCHI
    .filter(g => !g.sperimentale || sperimentali) // i giochi in prova sono un interruttore di casa
    .map(g => {
      const arco = arcoDelGioco(TAPPE_DEL_GIOCO[g.chiave] || [])
      const tappe = TAPPE_DEL_GIOCO[g.chiave]
      const inPortata = !tappe || giocoDaOffrire(tappe, { eta, spenti, provato: false })
      // di chi è la mano cambia la frase: se il sapere che manca è spento anche nei difetti dell'età, è l'età
      const mancano = (g.serve || []).filter(x => spenti.includes(x))
      const manca = mancano.length > 0
      const mancaPerEta = manca && mancano.every(x => saDEta.has(x))

      // due volte: con le eccezioni di questo bambino (quello che si vede) e con quelle attese (il paragone)
      const statoCon = spentoQui => {
        if ((manca && !mancaPerEta) || (spentoQui && !dEta.has(g.chiave))) return SPENTO
        if (manca || spentoQui || !inPortata)
          return ((g.piccoli && !g.cresce) || (arco && arco.anniA < eta)) ? PASSATO : AVANTI
        return QUI
      }
      let stato = statoCon(off.has(g.chiave))
      // la forzatura vince sull'età, non sui saperi spenti: sarebbe una carta che apre domande da indovinare
      if (forzati.has(g.chiave) && !manca) stato = QUI

      const difetto = statoCon(dEta.has(g.chiave)) // «come dice l'età»: con le SUE eccezioni, non senza nessuna
      const attesoSpento = dEta.has(g.chiave) // la posizione della tacca è rispetto all'atteso, non a «non ce l'ha»
      // solo un `true` per esteso è «ce l'ha comunque»: l'assenza non forza niente, e la tacca resta nel mezzo
      const scelto = forzati.has(g.chiave) ? 'si'
        : (off.has(g.chiave) && !attesoSpento) ? 'no' : 'difetto'
      // chiede: nel manifesto — le domande in casa danno per scontato il pezzo, e senza degradano invece di sparire
      const chiede = (g.chiede || []).map(k => {
        const s = sapereDi(k)
        if (!s) return null
        const via = spenti.includes(k)
        const viaPerEta = saDEta.has(k)
        const come = via === viaPerEta ? 'difetto' : (via ? 'no' : 'si')
        return { chiave: k, nome: s.nome, ico: s.ico, che: s.che, spegne: s.spegne,
                 spento: via, attesoSpento: viaPerEta, scelto: come,
                 aMano: come !== 'difetto' }
      }).filter(Boolean)

      return { chiave: g.chiave, nome: g.nome, ico: g.ico, che: g.che, stato,
               difetto, scelto, attesoSpento, chiede,
               manca: mancano.map(k => sapereDi(k)?.nome || k).join(' e '),
               aMano: scelto !== 'difetto', // coincide con l'atteso non è una scelta: colorarla direbbe il falso
               da: arco ? arco.anniDa : null, a: arco ? arco.anniA : null }
    })
}

// detto al positivo (vedi quadro.md), i più recenti per primi: vedi quadro.md#quello-che-dà-per-scontato-che-sappia-sa
const DA_QUANDO = new Map(SAPERI.map(s => {
  const p = PARTENZE.find(x => !x.saperi.includes(s.chiave)) // la prima partenza che non lo tiene spento
  return [s.chiave, p ? p.anni : Infinity]
}))

export function saperiDiUnEta (sa = {}, { classi = [], eta = null } = {}) {
  const spenti = new Set(spente(sa))
  const finestra = finestraDi(eta)
  // quali gruppi cita ogni classe, e quali citazioni non sono oltre il tetto: la differenza è il taglio
  const citati = new Set()
  const vivi = new Set()
  for (const c of classi)
    for (const chiave of (c.sa || [])) {
      citati.add(chiave)
      if (!finestra || c.livello <= finestra[1]) vivi.add(chiave)
    }
  return SAPERI
    .filter(s => !spenti.has(s.chiave) && s.difetto !== false)
    .filter(s => !citati.has(s.chiave) || vivi.has(s.chiave))
    .map(s => ({ chiave: s.chiave, nome: s.nome, ico: s.ico, materia: s.materia,
                 da: DA_QUANDO.get(s.chiave) ?? 0 }))
    .sort((a, b) => b.da - a.da)
}

// `classi`: le righe piatte del catalogo; senza (Node, niente registro) metà domande resta vuota, meglio di un errore
// chi pesca davvero dai moduli di quiz (`quiz: true`): vedi docs/genitori/quadro.md#se-nessun-gioco-le-chiede-niente-elenco
const PASSO_ETA = 0.5
const MAX_ETA = 12

export function domandeDiUnEta ({ eta, giochi = {}, sa = {}, sperimentali = false } = {}) {
  const chiedono = elenco => elenco
    .filter(g => g.stato === QUI && GIOCHI.some(x => x.chiave === g.chiave && x.quiz))
  const qui = chiedono(giochiDiUnEta({ eta, giochi, sa, sperimentali }))
  if (qui.length) return { chiedono: true, quali: qui.map(g => g.nome), da: null }

  // nessuno: da che età ne arriverebbe uno, mezzo anno per volta come si muove la manopola
  for (let e = (Number(eta) || 0) + PASSO_ETA; e <= MAX_ETA; e += PASSO_ETA) {
    const suoi = eccezioniPerEta(e)
    const trovati = chiedono(giochiDiUnEta({ eta: e, giochi: suoi.giochi, sa: suoi.sa,
                                             sperimentali }))
    if (trovati.length) return { chiedono: false, quali: trovati.map(g => g.nome), da: e }
  }
  return { chiedono: false, quali: [], da: null }
}

// tipologia + gruppo di sapere si sommano (stessa somma di quiz/catalogo.js); PASSO = mezzo anno, segno del profilo
const ritoccoDi = (c, ritocchi) =>
  (ritocchi[c.tipo] || 0) + (c.sa || []).reduce((n, k) => n + (ritocchi[k] || 0), 0)

export function quadroDi ({ eta, giochi = {}, sa = {}, sperimentali = false,
                            ritocchi = {} } = {},
                          { classi = [] } = {}) {
  const spenti = spente(sa)
  const dove = doveCadeCon(eta)

  // di chi è la mano su un pezzo di scuola: il paragone è con l'atteso, non con «nessuna eccezione» (ritocchi.md)
  const saDEta = new Set(spente(eccezioniPerEta(eta).sa))
  const manoSu = (chiave, spento) => {
    const attesoSpento = saDEta.has(chiave)
    const ritocco = ritocchi[chiave] || 0
    return { ritocco, spento, attesoSpento, aMano: spento !== attesoSpento || !!ritocco }
  }
  // una tipologia che l'età spegne e il profilo riaccende non ha riga sua: il colore va sulle sue domande
  const riaccesa = tipo => !!tipo && saDEta.has(tipo) && !spenti.includes(tipo)

  const righe = classi.map(c => ({
    chiave: c.chiave,
    nome: c.nome,
    modulo: c.nomeModulo,
    icona: c.icona,
    livello: c.livello,
    anni: c.anni, // la stessa cosa in anni: la lingua in cui giudica un grande («otto anni e mezzo», non «54»)
    ritocco: ritoccoDi(c, ritocchi), // `anni` resta la taratura di casa, `anniOra` quello che vale per questo bambino
    // la chiave su cui si ritocca è la tipologia, non la classe: chi non ce l'ha sposta il suo pezzo di scuola
    tipo: c.tipo || null,
    anniOra: Math.round(anniDelLivello(c.livello - ritoccoDi(c, ritocchi) * PASSO) * 10) / 10,
    sorgente: c.sorgente, // per rigenerare la domanda (quiz/nucleo/esempi.js) e provarla col dito
    sa: c.sa || [], // i pezzi di scuola dati per scontati: la chiave con cui si raggruppa
    // una classe spenta non cade in nessuna fascia: metterla fra le «troppo facili» direbbe il falso
    dove: (c.sa || []).some(s => spenti.includes(s)) || spenti.includes(c.tipo)
      ? 'spenta' : dove(c.livello - ritoccoDi(c, ritocchi) * PASSO),
    riaccesa: riaccesa(c.tipo),
    aMano: !!ritoccoDi(c, ritocchi) || riaccesa(c.tipo),
  }))

  // quattro elenchi con lo stesso nome delle fasce di quiz/nucleo/catalogo.js: si raggruppa, non si decide
  // senza doppioni: la stessa tipologia a più gradi (giusto nel catalogo) qui è rumore, si tiene la prima (più tosta)
  const senzaDoppioni = elenco => {
    const visti = new Set()
    return elenco.filter(r => !visti.has(r.nome) && visti.add(r.nome))
  }
  const inOrdine = f =>
    senzaDoppioni(righe.filter(r => r.dove === f).sort((a, b) => b.livello - a.livello))

  // i doppioni non si tolgono solo dentro un gruppo: stesso nome in due elenchi opposti farebbe credere a un errore
  const ORDINE_GRUPPI = ['medie', 'toste', 'facili', 'sotto', 'spenta']
  const gia = new Set()
  const gruppi = ORDINE_GRUPPI.map(chiave => {
    const righe = inOrdine(chiave).filter(r => !gia.has(r.nome))
    righe.forEach(r => gia.add(r.nome))
    return [chiave, righe]
  })
  const gruppo = chiave => (gruppi.find(([k]) => k === chiave) || [, []])[1]

  // ogni blocco raccoglie i gruppi (unità sola con «dà per scontato»): vedi quadro.md
  const perSapere = (righe, scegli = gruppoDi) => {
    const dentro = new Map()
    for (const r of righe) {
      const chiave = scegli(r.sa, r.tipo) || 'altro'
      if (!dentro.has(chiave)) dentro.set(chiave, [])
      dentro.get(chiave).push(r)
    }
    return [...dentro.entries()]
      .map(([chiave, classi]) => {
        const s = sapereDi(chiave)
        /* Una sottovoce non sta nel catalogo dei pezzi di scuola — le
           tipologie le dichiarano i moduli — quindi il nome da leggere
           è quello della domanda («Come si vede un solido dall'alto») e
           l'icona quella del gruppo che se la porta dietro. Senza,
           resterebbe la chiave nuda addosso a un pallino. */
        const suo = !s && sapereDi((classi[0]?.sa || [])[0])
        return {
          chiave,
          nome: s?.nome || classi[0]?.nome || chiave,
          ico: s?.ico || suo?.ico || '•',
          quante: classi.length,
          /* il livello più alto che il gruppo tocca in questa fascia:
             serve a metterlo in fila con gli altri, e a dire quale pezzo
             di quel gruppo si sta guardando */
          livello: Math.max(...classi.map(c => c.livello)),
          /* ── QUELLO CHE SERVE ALLA TACCA ──
             Spostare un pezzo di scuola sposta **tutte le sue domande
             insieme**, e quelle non stanno tutte allo stesso punto: la
             tacca deve poter dire quante attraversano il confine, se no
             direbbe «finisce in Difficili» mentre due su tre restano
             dov'erano. `ritocco` è di quanto l'ha già spostato un
             grande — il numero da cui riparte la tacca aprendosi. */
          livelli: classi.map(c => c.livello),
          /* `ritocco`, `spento`, e se è roba dell'età o di un grande */
          ...manoSu(chiave, spenti.includes(chiave)),
          classi,
        }
      })
      /* i più impegnativi per primi, come le classi dentro il gruppo */
      .sort((a, b) => b.livello - a.livello)
  }

  /* ── E IL BLOCCO DI QUELLO CHE È STATO TOLTO ──
     Il gruppo di una riga spenta non è «il più specifico che dichiara»
     ma **quello che l'ha spenta**: se un grande ha tolto «Le figure
     piane», la riga va scritta sotto quel nome — non sotto «Geometria»,
     che è ancora acceso e riaccenderlo non rimetterebbe niente.

     E un pezzo spento che non ha domande resta lo stesso: se sparisse
     da qui non ci sarebbe nessun posto dove riaccenderlo. È la stessa
     ragione per cui, più sotto, quello che nessuna domanda cita finisce
     appeso al gioco che lo chiede. */
  /* E chi l'ha spenta può essere **una sottovoce**, non un gruppo: una
     fascia può togliere «Come si vede un solido dall'alto» lasciando
     acceso «I solidi», e in `settings.sa` finisce la chiave della
     tipologia. Cercando solo fra i gruppi la riga non trovava nessun
     nome e finiva sotto «• altro», che è il posto dove un grande non
     la cerca: la vede sparita e non ha modo di rimetterla. La riga
     sopra (`dove:`) guardava già `c.tipo`, questa no. */
  const spentoDi = (sa, tipo) => (sa || []).find(k => spenti.includes(k)) ||
    (spenti.includes(tipo) ? tipo : null)
  const conSpenti = righe => {
    const fila = perSapere(righe, spentoDi)
    const gia = new Set(fila.map(x => x.chiave))
    const nudi = spenti.filter(k => !gia.has(k) && sapereDi(k))
      .map(k => ({ chiave: k, nome: sapereDi(k).nome, ico: sapereDi(k).ico || '•',
                   quante: 0, livello: 0, livelli: [], ...manoSu(k, true), classi: [] }))
    return [...fila, ...nudi]
  }
  /* L'ordine è quello in cui si leggono: dal già saputo al non ancora,
     e in fondo quello che non gli si chiede più. Le «troppo difficili»
     non ci sono: sono fuori dalla sua portata e non gli arrivano, e un
     elenco di roba che non vedrà non aiuta a decidere niente — quello
     che serve sapere, cioè che salendo arriverebbero, lo dice già la
     manopola salendo. */
  const blocchi = ['facili', 'medie', 'toste', 'sotto', 'spenta'].map(chiave => {
    const righe = gruppo(chiave)
    const saperi = chiave === 'spenta' ? conSpenti(righe) : perSapere(righe)
    return { chiave, righe, saperi, quante: righe.length }
  })

  const elencoGiochi = giochiDiUnEta({ eta, giochi, sa, sperimentali })
  const domande = domandeDiUnEta({ eta, giochi, sa, sperimentali })

  /* ── E SE NESSUNO LE CHIEDE, I BLOCCHI NON CI SONO ──
     Da quattro a cinque anni e mezzo in casa ci sono tre giochi e
     nessuno pesca dai moduli di quiz: elencare lo stesso undici classi
     col tastino per provarle le fa leggere come «ecco cosa gli
     chiederemo», e non gliele chiederemo mai. Era una condizione nel
     template, ed è una regola: sta qui, dove sta anche il conto di chi
     le chiede, se no chi guarda il dato e chi guarda lo schermo
     vedrebbero due cose diverse — ed è proprio la differenza fra le due
     a decidere dove va la riga di un pezzo di scuola (sotto).
     Il censimento crudo resta in `fasce` e in `righe`: quello serve a
     un test, e non è una cosa da mostrare. */
  const blocchiVivi = domande.chiedono ? blocchi : []

  /* ── UNA RIGA SOLA PER PEZZO DI SCUOLA ──
     Un sapere che le domande citano ha già la sua riga fra i blocchi,
     dove sta insieme alla sua difficoltà e alla tacca che la sposta di
     mezzo anno. Quello che un gioco chiede e nessuna domanda cita non
     ha nessun blocco in cui cadere — non ha una difficoltà, ha un
     acceso e uno spento — e resta appeso al gioco che lo chiede, che è
     anche il posto dove un grande lo va a cercare: «cosa chiede il
     castello».

     Due righe per la stessa chiave sarebbero due tacche diverse che
     scrivono la stessa voce del profilo, con due scale diverse: è il
     difetto che i cinque blocchi tutti uguali sono nati per non fare.

     Valgono i blocchi che si mostrano davvero, e non è un cavillo: dove
     le domande non le chiede nessuno l'elenco non c'è, e senza questa
     riga quei saperi tornerebbero irraggiungibili — che è esattamente
     il guasto da cui è nato tutto questo.

     E vale **avere delle domande**, non comparire in un blocco: il
     blocco di quelli tolti raccoglie anche i pezzi di scuola spenti che
     di domande non ne hanno (`conSpenti`, sopra), e senza questa
     distinzione la riga delle divisioni salterebbe da sotto il castello
     al fondo dell'elenco nel momento stesso in cui la si spegne — la si
     tocca in un posto e ricompare in un altro. Quello che un gioco
     dichiara resta dove il gioco lo dichiara, acceso o spento che sia. */
  const conDomande = new Set(blocchiVivi
    .flatMap(b => b.saperi.filter(s => s.quante > 0).map(s => s.chiave)))
  /* `chiede` resta intero, ed è la parte che non si vede aprendo: la
     riga di contesto del gioco dice «senza le divisioni» a qualunque
     età, anche quando la riga da toccare sta di là. È quella frase a
     rispondere alla metà peggiore del guasto — non «non posso
     cambiarle», ma «non so nemmeno che sono spente». */
  for (const g of elencoGiochi)
    g.chiedeQui = g.chiede.filter(s => !conDomande.has(s.chiave))
  /* e il blocco di quelli tolti non ripete chi è già appeso a un gioco:
     è l'altra metà della stessa regola, vista dall'altra parte */
  const appesi = new Set(elencoGiochi.flatMap(g => g.chiedeQui.map(s => s.chiave)))
  for (const b of blocchiVivi)
    if (b.chiave === 'spenta')
      b.saperi = b.saperi.filter(s => s.quante > 0 || !appesi.has(s.chiave))

  return {
    anni: eta,
    giochi: elencoGiochi, // l'elenco intero, ognuno col suo stato: chi mostra decide se aprirlo o riassumerlo
    sa: saperiDiUnEta(sa, { classi, eta }),
    domande,
    gruppi: blocchiVivi,
    // censimento grezzo per un test (nessuna riga persa): i numeri non combaciano coi gruppi, qui niente doppioni tolti
    fasce: FASCE_ETA.map(f => ({ ...f, quante: righe.filter(r => r.dove === f.chiave).length })),
    spente: righe.filter(r => r.dove === 'spenta').length,
    righe,
  }
}

// il rosso «va male»: stessa soglia delle «Difficili» di «Come va» (quiz/consiglio.js), risale fino al blocco — vedi quadro.md
const vaMale = (chiavi, risposte) => {
  const c = consiglioDa(contoDi(chiavi.filter(Boolean), risposte))
  return c && c.verso === -1 ? c.detto : null
}

export function vannoMale (blocco, risposte = {}) {
  const fuori = []
  for (const s of (blocco && blocco.saperi) || []) {
    const sue = ((s.classi || [])
      .map(c => ({ riga: c, detto: vaMale([c.tipo], risposte) }))
      .filter(x => x.detto))
    if (sue.length) {
      for (const x of sue)
        fuori.push({ chiave: x.riga.chiave, nome: x.riga.nome,
                     dentro: s.nome, detto: x.detto })
      continue
    }
    const insieme = vaMale((s.classi || []).map(c => c.tipo), risposte)
    if (insieme) fuori.push({ chiave: s.chiave, nome: s.nome, dentro: null, detto: insieme })
  }
  return fuori
}

// cosa si è mosso fra una tacca e l'altra: usato solo dai test (il quadro non mostra i cambiamenti, vedi quadro.md)
export function differenzaFra (prima, dopo) {
  const statoPrima = new Map(prima.giochi.map(x => [x.chiave, x.stato]))

  const dovePrima = new Map(prima.righe.map(r => [r.chiave, r.dove]))
  const mosse = dopo.righe.filter(r => dovePrima.has(r.chiave) && dovePrima.get(r.chiave) !== r.dove)
  const ordine = FASCE_ETA.map(f => f.chiave)
  const salita = r => ordine.indexOf(r.dove) - ordine.indexOf(dovePrima.get(r.chiave))

  return {
    cambiati: dopo.giochi.filter(g => statoPrima.get(g.chiave) !== g.stato)
      .map(g => ({ ...g, prima: statoPrima.get(g.chiave) })),
    piuFacili: mosse.filter(r => salita(r) < 0).map(r => ({ ...r, da: dovePrima.get(r.chiave) })), // scese di blocco
    piuToste: mosse.filter(r => salita(r) > 0).map(r => ({ ...r, da: dovePrima.get(r.chiave) })),
    // i saperi si confrontano al positivo: dati per scontati adesso e non prima, o il contrario
    imparati: dopo.sa.filter(x => !prima.sa.some(y => y.chiave === x.chiave)),
    dimenticati: prima.sa.filter(x => !dopo.sa.some(y => y.chiave === x.chiave)),
  }
}
