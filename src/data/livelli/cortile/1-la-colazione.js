/* 1 ─ LA COLAZIONE. Il primo episodio della casa di Rosa, ed è
      tutorial puro: tre verbi (`vai`, `prendi`, `apri`), più i due che
      questa storia chiede da sé — `posa`, perché la roba va portata
      **in un posto**, e `chiudi`, perché il cane esiste.

      ── PERCHÉ È LUNGO, E PERCHÉ È GIUSTO CHE LO SIA ──
      Le prime stesure di questa campagna erano da due o tre ordini
      l'una, in una stanza di quattro celle. Il conto non tornava: si
      spendeva più tempo a capire chi c'era e cosa si voleva che a
      giocare, e quel costo si ripagava daccapo a ogni livello. Qui la
      casa è **una sola** per tutti gli episodi (`casa.js`) e la storia
      chiede dodici ordini: tre viaggi uguali — prendi, porta, posa —
      più la chiave, più la porta da richiudere. Il piano è lungo ma
      non è difficile da tenere in testa, perché è fatto di TAPPE che
      si controllano una per una: se manca la farina si vede subito
      quale dei tre giri è andato storto.

      ── LA COSA CHE INSEGNA, ED È UNA SOLA ──
      Un ordine può servire a **non far succedere** qualcosa. Undici
      ordini su dodici fanno avanzare la colazione; uno solo — chiudere
      la porta — non porta niente sul tavolo, e senza quello si perde.
      È il primo piano del gioco in cui una mossa serve a difendere
      quello che hai già fatto, ed è per questo che Bombo non morde e
      non va combattuto: se il cane fosse un nemico da attaccare, la
      lezione sarebbe un'altra.

      ── E L'ORDINE CONTA DUE VOLTE ──
      La chiave prima della dispensa (che è la seconda prova del
      tutorial, qui dentro una storia). E la porta chiusa **prima** che
      Bombo arrivi: non basta chiuderla, va chiusa in tempo. Chi la
      chiude per ultima, dopo il giro in dispensa, la chiude su un cane
      che è già dentro — ed è l'errore che questo livello esiste per far
      fare una volta.

      NIENTE VARIANTI, ED È VOLUTO: qui non c'è niente da indovinare,
      c'è da imparare com'è fatta la casa. Le battaglie diverse
      cominciano al secondo episodio, quando la casa è nota. */

import { livello } from '../scrivi.js'
import { campo, fai, se,
         rosa, bombo, bibi, farina, uova, secchio, verdura, chiaveDispensa,
         tavolo, pozzo, nido, filare, riva, portaCasa, portaDispensa, MAPPA } from './casa.js'

const ROSA = rosa()
const FARINA = farina(), UOVA = uova(), SECCHIO = secchio()
const CHIAVE = chiaveDispensa()
const TAVOLO = tavolo(), POZZO = pozzo(), NIDO = nido()
/* il resto della casa: c'è, non si nomina (vedi la legenda più sotto) */
const BIBI = bibi(), VERDURA = verdura(), FILARE = filare(), RIVA = riva()
const P_CASA = portaCasa(), P_DISPENSA = portaDispensa()

/* ── BOMBO ASPETTA CHE CI SIA DA RUBARE ──
   Non è un agguato: è un cane che gira per il cortile e va dove sente
   odore di roba buona. Aspettava **diciotto battiti** e poi partiva, e
   quel numero era tarato su un piano che nel frattempo era cambiato:
   arrivava mentre la farina era ancora chiusa in dispensa o in mano a
   Rosa, non riusciva a prenderla, e dopo un po' si arrendeva. Risultato,
   il cane non entrava mai — e chiudere la porta, che è la lezione di
   questo episodio, non serviva a niente.
   Allora si è passati alla **cosa invece che al tempo**: parte quando
   c'è davvero qualcosa da portar via. Giusto, ma la prima versione
   aspettava la *farina*, che è l'ultima roba a toccare il tavolo: il
   battito in cui lui si rimette in moto è lo stesso in cui la colazione
   è pronta, e la partita finisce lì — vinta, con un cane che non ha
   fatto un passo. Il banco lo diceva ancora («senza "chiudi portaCasa"
   vince lo stesso»), e aveva ragione due volte.
   Adesso aspetta **le uova**, cioè il primo carico posato: da lì gli
   restano i venticinque battiti del giro in dispensa per attraversare
   il cortile ed entrare, e Rosa ha esattamente quel tempo per chiudergli
   la porta in faccia. La roba che si porta via è quella che trova, come
   dice il racconto — non aveva senso che un cane ignorasse le uova per
   aspettare la farina.
   Se la porta è chiusa non entra: non la sfonda, resta fuori — e la
   riga «non riesco ad arrivare» si legge nel registro come la
   conferma che il piano ha retto. */
const BOMBO = bombo([
  fai.aspettaChe(se.qui(UOVA, TAVOLO)),
  fai.prendi(UOVA),
])

/* ── IL MONDO C'È ANCHE QUANDO NON SERVE ──
   Bibi allo stagno, il filare dell'orto, la riva: questo episodio non
   li usa e non li mette fra i `complementi`, quindi non si possono
   nominare in un ordine — ma stanno lì, perché la casa è la stessa
   tutte le volte. Una mappa che si svuota di quello che l'episodio non
   chiede non è un posto, è un esercizio con lo sfondo. */
const SCENA = campo(MAPPA, {
  RS: ROSA, BM: BOMBO, BI: BIBI,
  FA: FARINA, UO: UOVA, SE: SECCHIO, CH: CHIAVE, VE: VERDURA,
  TV: TAVOLO, PZ: POZZO, ND: NIDO, FL: FILARE, RV: RIVA,
  pc: P_CASA, pd: P_DISPENSA,
})

export const COLAZIONE = livello({
  id: 'cortile-colazione', nome: 'La colazione',
  idea: 'Un ordine può servire a non far succedere qualcosa',
  dritta: "Obiettivo: <b>farina, uova e acqua sul tavolo</b>. E devono restarci.",
  racconto: 'Rosa prepara la colazione: la farina è chiusa in dispensa, le uova sono nel nido e l\'acqua al pozzo. <b>Bombo non morde</b> — ma se trova la porta di casa aperta entra e si porta via quello che c\'è sul tavolo.',
  aiuti: ['La roba si porta dove serve: si prende, ci si va, e si posa.',
          'La chiave della dispensa è appesa in cucina.',
          'Bombo aspetta un po\' prima di provarci. Una porta chiusa lo tiene fuori — se la chiudi in tempo.'],
  ambiente: 'cortile', prove: 1,

  scena: SCENA,
  complementi: ['farina', 'uova', 'secchio', 'chiaveDispensa',
                'tavolo', 'pozzo', 'nido', 'portaCasa', 'portaDispensa'],
  verbi: ['vai', 'prendi', 'posa', 'apri', 'chiudi'],

  /* le tre cose sul tavolo, e ci devono ESSERE: `qui` adesso vale
     anche per le cose, non solo per chi cammina — una cosa in mano a
     qualcuno non è da nessuna parte, si conta quando è posata */
  vince: [se.qui(FARINA, TAVOLO), se.qui(UOVA, TAVOLO), se.qui(SECCHIO, TAVOLO)],
  /* quello che trova, non quello che preferisce: se il cane entra, la
     colazione è saltata comunque */
  perde: [se.ha(BOMBO, UOVA)],
  motivoSconfitta: 'Bombo è entrato in casa e si è preso le uova.',
  mostraNemici: true,

  soluzioni: [
    /* DODICI ORDINI, DUE VIAGGI E UNA GUARDIA. */
    { nome: "quello di fuori, chiudi, e poi la farina", piano: { rosa: [
      /* ── DOVE STA «CHIUDI» È IL LIVELLO ──
         La porta si apre per uscire a prendere uova e acqua, e si
         richiude **appena rientrati**: da quel momento Bombo ha sentito
         odore e sta attraversando il cortile, e il giro in dispensa —
         chiave, porta, farina, ritorno — sono i venticinque battiti che
         gli servirebbero per arrivare al tavolo. Chiudere alla fine, da
         ultimo ordine, vuol dire chiudere una porta da cui il cane è già
         entrato: ed è l'errore che questo livello esiste per far fare
         una volta. */
      fai.apri(P_CASA),
      fai.prendi(UOVA), fai.prendi(SECCHIO),
      fai.vai(TAVOLO), fai.posa(UOVA), fai.posa(SECCHIO),
      fai.chiudi(P_CASA),
      fai.prendi(CHIAVE), fai.apri(P_DISPENSA), fai.prendi(FARINA),
      fai.vai(TAVOLO), fai.posa(FARINA),
    ] } },
  ],

  verifiche: {
    /* la chiave prima della porta che apre, e la porta di casa prima
       di uscire: sono le due dipendenze della storia */
    ordineConta: [['prendi chiaveDispensa', 'apri portaDispensa'],
                  ['apri portaCasa', 'prendi uova']],
    /* e senza chiudere non si vince: è l'ordine che non porta niente
       sul tavolo e serve lo stesso */
    senza: ['portaCasa'],
  },
})

export default COLAZIONE
