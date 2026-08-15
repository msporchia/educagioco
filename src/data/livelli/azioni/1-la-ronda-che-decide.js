/* 1 ─ L'AZIONE CON UN NOME, e perché serve. Non è un livello della
      campagna del ciclo (`giro/`): apre una campagna a sé, quella in
      cui si impara `esegui` — il sottoprogramma. Ci è finito qui
      perché **due strutture non si annidano direttamente**, ed è
      l'unico modo che il linguaggio offre per comporle.

      ── PERCHÉ NON STA IN `giro/` ──
      Il piano vorrebbe dire «a ogni tappa della ronda, guarda e
      decidi»: un bivio dentro un ciclo. Ma il motore lo impedisce
      apposta (`piano.js`, «dentro un ciclo non ci va un altro
      blocco» — e vale anche al contrario, un ciclo dentro un ramo).
      L'UNICA strada che il linguaggio offre è scrivere la decisione
      come un'azione a sé («decidi») e richiamarla con `esegui` da
      dentro il ciclo: `esegui` non è un blocco, è un verbo come
      `vai`, e nei verbi il motore non vede niente da vietare.

      Per questo il livello chiede TRE cose insieme — il ciclo, il
      bivio, e il sottoprogramma che li tiene insieme — e viola la
      regola «un livello muove un asse solo» se resta fra i
      consolidamenti del ciclo. Da solo, in una campagna sua, invece È
      la lezione: si vede coi propri occhi che a un certo punto il
      piano non basta più scriverlo a blocchi annidati, serve dargli un
      nome e chiamarlo. Un bivio dentro un ciclo non è un costrutto in
      più da imparare: è `esegui` visto da dentro un caso che lo
      richiede davvero.

      ── ⚠ QUESTO LIVELLO NON DIMOSTRA ANCORA QUELLO CHE PROMETTE ──
      Quando è stato scritto, `nonInFila` non scendeva dentro il corpo
      di un ciclo né dentro un'azione richiamata con `esegui`: la
      decisione viveva lì, e la prova non la vedeva. Sembrava un limite
      della prova, e la nota qui diceva «resta muto, apposta».
      Adesso `srotola` ci scende — un ciclo diventa «il corpo una volta
      sola», una chiamata diventa «il corpo dell'azione al posto della
      chiamata» — e la risposta è arrivata: **srotolato, questo piano
      vince tutte e quattro le scene**. Cioè la struttura che il livello
      esiste per insegnare, qui non serve a vincere: una ronda dritta,
      senza ciclo e senza decisione, basta.
      Non è quindi un livello finito, ed è per questo che **non è ancora
      in `LIVELLI`**: prima va ridisegnato perché stare fermi o passare
      una volta sola perda almeno una battaglia, poi si dichiara
      `verifiche: { nonInFila: true }` e si mette in fila. La `fragile`
      qui sotto (il giro di un punto solo) resta buona e necessaria, ma
      da sola non basta: dice che *quella* scorciatoia cade, non che la
      struttura serva.

      ── DUE TAPPE, NON QUATTRO ──
      Un piano non supera gli otto ordini (regola della campagna): con
      quattro angoli visitati uno per uno il conto sfora. Due bastano
      lo stesso, se ogni tappa copre DUE angoli vicini invece di uno —
      la ronda guarda a nordovest e a sudovest da un punto solo sul
      lato di ponente, poi a nordest e a sudest da un punto sul lato
      di levante. Quattro nascondigli restano quattro: cambia solo
      quanti passi separano un punto di guardia dal successivo. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const cava = chi.nostro('cava', 'il cavaliere', { corpo: 'cavaliere', emoji: '🛡️', vista: 4, vita: 8 })
/* un solo orco, passivo: sta di guardia e non insegue nessuno. Il
   pericolo di questo livello non è morire, è INDOVINARE — restare a
   un punto mentre l'orco è a un altro. */
const orco = chi.orco({ vista: 3, vita: 3 })
const dove = cose.segnaposto()

/* UNA SALA APERTA con quattro angoli, e due punti di guardia a metà
   fianco: da quello di ponente si vedono i due angoli di ponente
   (nordovest e sudovest, tre passi ciascuno), da quello di levante i
   due di levante — ma un punto di ponente non vede niente di là dalla
   sala, troppa distanza. Il cavaliere parte al centro, equidistante
   dai due punti. */
const SALA = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|o1|..|..|..|..|..|..|..|..|..|o2|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|p1|..|..|..|..|@@|..|..|..|..|p2|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|o4|..|..|..|..|..|..|..|..|..|o3|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##',
], { '@@': cava, o1: dove, o2: dove, o3: dove, o4: dove, p1: dove, p2: dove })

export const RONDA_DECIDE = livello({
  id: 'azioni-ronda-decide', nome: 'La ronda che decide',
  idea: 'A ogni tappa: guarda, e solo se serve agisci',
  dritta: "Obiettivo: <b>l'orco deve cadere</b>.",
  racconto: "L'orco è fermo a uno dei quattro angoli, e non si muove finché non lo vedi. Da quale angolo <b>cambia a ogni battaglia</b>, e una tappa sola non basta a coprirli tutti.",
  aiuti: ["Da una tappa non si vedono gli angoli dell'altro lato, troppo lontani.",
          "Gira tutte e due le tappe, una dopo l'altra, sempre uguale.",
          "A ogni tappa rifai la stessa domanda: lo vedo? Solo se sì, agisci."],
  ambiente: 'cortile',

  scena: SALA,
  celle: true,
  complementi: ['orchi'],
  condizioni: [se.vedi('orchi'), se.nonVedi('orchi'), se.caduto('orco'), se.vivo('orco')],
  verbi: ['vai', 'attacca', 'esegui'],
  vince: [se.caduto('orco')],
  mostraNemici: true,

  varianti: [
    { nome: "l'orco a nordovest", metti: { o1: orco } },
    { nome: "l'orco a nordest", metti: { o2: orco } },
    { nome: "l'orco a sudest", metti: { o3: orco } },
    { nome: "l'orco a sudovest", metti: { o4: orco } },
  ],

  /* IL PAR CONTA TUTTO QUELLO CHE C'È SCRITTO: l'azione «decidi» (il
     bivio dentro, tre righe) più il ciclo (il blocco, i due «vai»
     alle due tappe, i due «esegui» che li seguono) — otto in tutto,
     il tetto della campagna. Giocato, si legge come due righe sole. */
  soluzioni: [
    { nome: 'gira le due tappe e decidi a ognuna', piano: { cava: [
      fai.azione('decidi', [
        fai.bivio(se.vedi('orchi'), [fai.attacca('orchi')], []),
      ]),
      fai.ripeti([
        fai.vai('1,4'), fai.esegui('decidi'),
        fai.vai('11,4'), fai.esegui('decidi'),
      ], se.caduto('orco')),
    ] } },

    /* FRAGILE: un modo elegante di stare fermi. Presidia una tappa
       sola — vince le due battaglie in cui l'orco è da quel lato,
       nelle altre due non lo trova mai. È questa, non `nonInFila`
       (muto qui, vedi il commento in testa), a dimostrare che la
       ronda vera serve: un giro di un punto solo è un ciclo che gira
       senza mai decidere niente di diverso, e infatti perde. */
    { nome: 'di guardia a una tappa sola', fragile: true, piano: { cava: [
      fai.azione('decidi', [
        fai.bivio(se.vedi('orchi'), [fai.attacca('orchi')], []),
      ]),
      fai.ripeti([
        fai.vai('1,4'), fai.esegui('decidi'),
      ], se.caduto('orco')),
    ] } },
  ],
})

export default RONDA_DECIDE
