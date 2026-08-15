/* 4 ─ IL CICLO CHE SI FERMA SU UN'ALTRA DOMANDA. Finora «smetti
      quando» ha sempre chiesto «lo vedi?». Qui chiede «è aperto?»: lo
      stesso blocco, la stessa forma — `ripeti(corpo, finche)` — ma la
      domanda che decide quando fermarsi è UN'ALTRA.

      UN CANCELLO SOLO, E UNO SCUDIERO NASCOSTO DA UNA DELLE DUE PARTI
      del camminamento. Non comincia a muoversi finché non vede il
      cavaliere — bisogna passargli davanti — e da lì aspetta un tempo
      che CAMBIA A OGNI BATTAGLIA prima di aprire. Nessuno lo annuncia.

      ── IL CICLO GIRA DAVVERO, E NON SI FERMA MAI SU UN ORDINE BLOCCATO ──
      Il corpo del ciclo è SOLO cammino avanti e indietro nel
      camminamento — mai un tentativo di prendere il tesoro mentre il
      cancello è ancora chiuso. `prendi` arriva DOPO il ciclo, quando
      «è aperto» è già vero: a quel punto il tesoro si prende senza
      intoppi. Tentare di prenderlo PRIMA, a cancello chiuso, blocca
      l'ordine su una strada senza uscita — ed è esattamente quello che
      fa la fragile qui sotto, apposta.

      ── DUE MODI DI SBAGLIARE, E SONO DUE COSE DIVERSE ──
      Qui non c'è un bivio: c'è un ciclo, e `nonInFila` adesso lo
      srotola — «il corpo una volta sola, senza ripetere» — e pretende
      che quel piano perda. (Per un pezzo non ci scendeva: guardava solo
      dentro i «quando senti» e i rami dei bivi, quindi su un livello di
      solo ciclo diceva «non c'è niente da srotolare» e taceva. Da
      quando ci scende, questo livello lo dichiara.)
      Le due `fragile` restano, e non sono un doppione: dicono **come**
      si sbaglia, mentre `nonInFila` dice soltanto che la struttura
      serve. Ognuna sul suo fronte:
        · **di guardia al varco vicino** — non gira fino in fondo,
          resta dove parte: vince quando lo scudiero è lì vicino,
          perde quando è nascosto più in là e non lo vede mai.
        · **un giro, poi si passa** — gira davvero (quindi vede sempre
          lo scudiero, ovunque sia) ma poi prova a prendere il tesoro
          una volta sola, senza ripetere la domanda: basta quando
          l'attesa è corta, non quando è lunghissima.
      Il ciclo buono non sbaglia in nessuno dei due modi: gira fino a
      quando la domanda vera — «è aperto?» — dice di sì, e solo allora
      prende. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const cava = chi.nostro('cava', 'il cavaliere', { corpo: 'cavaliere', emoji: '🛡️', vista: 4, vita: 6 })
const tesoro = cose.tesoro()
const cancello = cose.grata('cancello', 'il cancello')
const dove = cose.segnaposto()

/* lo scudiero non si comanda: appena vede il cavaliere comincia ad
   aspettare, e solo dopo apre il cancello. Quanto aspetta lo decide la
   scena, e non lo sa nessuno finché non è aperto. */
const scudieroDi = attesa => chi.terzo('scudiero', 'lo scudiero',
  { corpo: 'guardia', emoji: '💂', vista: 3,
    fa: [fai.aspettaDiVedere('cava'), fai.aspettaUnPo(attesa), fai.apri(cancello)] })

/* IL CAMMINAMENTO E LA SALA SOTTO — il camminamento in alto è tutto
   aperto, da un capo all'altro: pattugliarlo non chiede mai di passare
   dal cancello, quindi non dipende da quanto ci mette ad aprirsi. Il
   cancello sta sotto, unica via per scendere alla sala col tesoro. Lo
   scudiero può nascondersi vicino a casa («s1») o lontano, quasi in
   fondo al camminamento («s2»): da vicino a casa non si vede lontano. */
const CAMMINAMENTO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|@@|..|s1|..|..|..|..|..|s2|..|..|##',
  '##|##|##|##|GG|##|##|##|##|##|##|##|##',
  '##|..|..|..|T$|..|..|..|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { '@@': cava, GG: cancello, 'T$': tesoro, s1: dove, s2: dove })

export const NON_CONTARE = livello({
  id: 'giro-non-contare-aspetta', nome: 'Non contare, aspetta',
  idea: "Il ciclo si ferma su quello che vuoi, non su un conto a occhio",
  dritta: 'Obiettivo: <b>il tesoro deve finire in mano al cavaliere</b>.',
  racconto: "Lo scudiero non comincia ad aspettare finché non ti vede — e può essere appostato vicino a casa o lontano, <b>cambia a ogni battaglia</b>. Da quanto aspetta dopo, non te lo dice nessuno.",
  aiuti: ["Lo scudiero comincia ad aspettare solo dopo averti visto: bisogna passargli davanti.",
          "Da vicino a casa non si vede fino in fondo al camminamento.",
          "C'è una domanda che dice esattamente «è aperto?», e il ciclo la può usare per fermarsi."],
  ambiente: 'camminamento',

  scena: CAMMINAMENTO,
  celle: true,
  complementi: ['tesoro'],
  condizioni: [se.aperto(cancello), se.chiuso(cancello)],
  verbi: ['vai', 'prendi'],
  vince: [se.ha(cava, tesoro)],

  /* LO SCUDIERO CAMBIA POSTO, e QUANTO ASPETTA CAMBIA CON LUI: due
     battaglie vicino a casa, una lontano, tempi diversi ogni volta.
     L'ultima è apposta lunghissima — molto più lunga della pazienza
     con cui `prendi` da solo riprova una strada bloccata (che si
     arrende dopo un po') — perché è la battaglia in cui contare a
     occhio smette di bastare, e solo la domanda vera regge. */
  varianti: [
    { nome: 'vicino a casa, ed è svelto', metti: { s1: scudieroDi(2) } },
    { nome: 'lontano, ci mette un po', metti: { s2: scudieroDi(8) } },
    { nome: 'lontano, lentissimo', metti: { s2: scudieroDi(90) } },
  ],

  /* IL PAR: il ciclo (il blocco e i due «vai» agli estremi) più il
     «prendi» finale, DOPO che il cancello è già aperto. */
  soluzioni: [
    { nome: "gira finché non è aperto, poi prendi", piano: { cava: [
      fai.ripeti([fai.vai('11,1'), fai.vai('1,1')], se.aperto(cancello)),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE (un punto solo): non arriva in fondo al camminamento.
       Vince le due battaglie in cui lo scudiero è vicino a casa,
       perde quella lontana — da qui non lo vede mai, il cancello non
       si apre e il tentativo di prendere il tesoro resta bloccato
       per sempre. */
    { nome: 'di guardia al varco vicino', fragile: true, piano: { cava: [
      fai.ripeti([fai.vai('1,1')], se.aperto(cancello)),
      fai.prendi(tesoro),
    ] } },

    /* FRAGILE (mete contate a mano): un giro solo, andata e ritorno —
       così vede sempre lo scudiero, ovunque sia — poi prende senza
       ripetere la domanda. Basta quando l'attesa è corta; con lo
       scudiero lentissimo il tentativo resta bloccato sul cancello
       ancora chiuso. */
    { nome: 'un giro, poi si passa', fragile: true, piano: { cava: [
      fai.vai('11,1'), fai.vai('1,1'), fai.prendi(tesoro),
    ] } },
  ],
  verifiche: { nonInFila: true },
})

export default NON_CONTARE
