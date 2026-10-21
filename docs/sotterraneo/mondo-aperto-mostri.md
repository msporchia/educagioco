# Il mondo aperto: i mostri di sopra

La fase 5 del progetto ([mondo-aperto-fasi.md](mondo-aperto-fasi.md#7-le-fasi)), la metà del **motore**: chi vive nelle zone del
mondo a percorso ([mondo-a-percorso.md](mondo-a-percorso.md), il generatore in [mondo-aperto-generatore.md](mondo-aperto-generatore.md)),
dove dorme, quando si sveglia, chi entra nello scontro e cosa resta dopo. L'utente, 16 ottobre 2026: «mostri anche sopra: sì», alla
Diablo, più ci si allontana dal villaggio più sale il livello. Puro, senza scena, gira in Node. La scena (fase 5, l'altra metà:
[mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)) legge questo file e [mondo-sopra-contratto.md](mondo-sopra-contratto.md).

- `motore/aperta.js` — il motore: popolare, muovere, incontrare, lo scontro, l'esito, il salvataggio, l'annuncio, le taglie.
- `motore/palco.js` — il palco dello scontro: un `Livello` di una stanza col branco già fatto (agganci in `livello.js` e `corsa.js`).
- `dati/mondo-aperto-mostri.js` — gli abitanti dei diciotto luoghi senza, la curva della forza, le tarature (`SOPRA`).
- `motore/banco-mondo.js` — il banco (`npm run sotterraneo -- --mondo`).

Il Sotterraneo 2D e le discese non cambiano: gli agganci si accendono solo con `tappa.palco` e `m.signore`, che esistono solo sopra
(la taratura `--presto` e `test:misure` danno gli stessi numeri di prima).

## Le regole

- **La mappa non cambia, quello che ci vive sì**: i mostri nascono da `(eroe, giro)`, e il giro sale a ogni ritorno in città (lo conta
  già `viste/Mondo3d.vue`, campo `mondo.giro`). Lo stesso eroe allo stesso giro ritrova gli stessi branchi negli stessi posti.
- **Una zona è una stanza grande**: un mostro non ne esce mai, nemmeno inseguendo (fra due zone c'è un fiume o una cresta: i luoghi
  dentro una zona invece si attraversano senza confine). Non entra nel villaggio, nella **cintura**, su un ponte o su un valico, a meno
  di `SOPRA.daConfine` = 4 celle da loro, nell'acqua o sulla roccia: passare un confine è mettersi in salvo.
- **La cintura di sicurezza** (proposta dell'assistente): niente mostri entro 12 celle dal villaggio, dalla strada fino alla cripta dei re
  e alla pietra dei prati, perché un bambino piccolo non trovi un branco sulla strada del primo dungeon. La scrive il generatore
  (`m.cintura`); lì nessuno si sveglia e chi insegue torna a casa.
- **Le zone si popolano quando il mondo le carica** (`tieniAttorno`: quella dell'eroe e le due accanto) **e si dimenticano quando le
  butta**: i mostri di una zona lontana non sono in memoria. I morti che devono ancora tornare (e i caporali, fino al giro dopo) restano
  per zona (`mortiFuori`, e nel salvataggio): ricaricandola tornano morti, con lo stesso indice (`zona × 1000 + j`).
- **Dove nasce un branco**: sull'erba della zona, almeno 2 celle da una strada e 4 da un ingresso, una pietra o chi sta fermo; mai sulle
  strade vere (inseguendo però ci passa). L'erba di una zona si raggiunge tutta dalla sua strada: il generatore toglie quella che no.
- **Quanti**: un branco ogni `cellePerBranco` celle d'erba dove può nascere, **per zona** (oggi 110 in tutte: la leva), a **14 celle**
  l'uno dall'altro (anche fra un luogo e l'altro della stessa zona, non oltre un confine di zona) e **12 dalla tana**, perché i branchi
  non si pestino i piedi (la distanza, non `cellePerBranco`, è il tetto: abbassare 110 non aggiunge un branco); da due a `branco` mostri (la curva: 2 al livello 1, 6 dal 10), pesati verso i piccoli come nelle terre
  selvagge.
- **La fascia è della zona e sale lungo la strada** (la scheda, `ZONE_DEL_MONDO`: prati 1–3, bosco 3–5 … landa 13–15): all'entrata della
  zona l'inizio della fascia, in fondo la fine (`livelloDi` del generatore, dall'arco della strada maestra). **Ogni terra dopo** la
  stessa mappa a +14 livelli (`terra`, fino al 71). Il `dif` della zona (le domande) è quello della discesa della storia del suo inizio.
- **Quanto è forte un mostro al livello L** (`CURVA_DI_SOPRA`): le discese della storia messe al loro livello atteso (cripta 0,25 · 0,
  scalinata 0,5 · 2, torre 0,5 · 4, grotta 0,8 · 6,5, sommersa 1,1 · 7,7, botola 1,25 · 8,7, miniera 1,8 · 9,5), in linea retta fra due,
  dal 12 la curva delle zone, scritta fino al 15 (fine della prima terra); oltre la segue da sola per le terre dopo. I numeri, le
  varianti e i gradi li fa `Livello.mostro` del dungeon.
- **La tana**: una per luogo, riservata dal generatore (o, se lì non si può, la cella più avanti lungo la strada). Ci sta **il signore**,
  il caporale del luogo col nome («Il signore del bosco vecchio»), due volte le ossa di un caporale e un colpo in più, all'inizio della
  fascia del luogo, con 0–1 guardie nei prati e nel bosco e 1–2 dopo (`guardieDelSignore`, per zona; caporali come lui). Battuto lascia
  **un raro della fascia di sicuro** (il tiro del grosso, al livello di un mostro; a volte un leggendario). Signore e caporali non tornano
  fino al giro dopo.
- **Svegliarsi e inseguire**: l'eroe nella stessa zona, fuori dalla cintura, a `SOPRA.sveglia` = 7 celle: si sveglia il mostro e tutto il
  suo branco, e gli va incontro a 3,1 celle al secondo (l'eroe ne fa 4,5: si può scappare). Oltre 11 celle, o se l'eroe passa in
  un'altra zona o al sicuro, torna a casa a 2,2.
- **Lo scontro**: si apre se un mostro sveglio arriva a 0,9 celle o se l'eroe ne tocca uno a 1,6. Entra il branco di chi apre (entro
  `RAGGIO_SCONTRO` 4,5) e **ogni vivo della stessa zona a `SOPRA.dentro` = 6 celle dall'eroe o da chi apre**, di qualunque branco e anche se
  dorme (o dentro o fuori: se l'eroe è andato così vicino, è colpa sua), al più sette (`MOSTRI_IN_CAMPO`), i più vicini all'eroe; chi apre è
  il primo. **Chi era vicino ma non ci sta** (campo pieno) non resta a guardare dentro il palco: `apriLoScontro` lo porta alla cella
  calpestabile più vicina della sua zona fuori dall'area del palco (17 × 11 celle con l'eroe a `EROE_SUL_PALCO`, più un giro di margine,
  `scostaChiNonEntra`); lì sta fermo (nessuno si muove durante lo scontro) e a scontro chiuso riprende a rincorrere. Provato un mostro
  «inattesa» da non disegnare: costa un campo nello stato e un'eccezione nella scena; scostarlo no.
  È lo scontro dei dungeon, giocato da una `Corsa` vera sul palco, coi suoi turni, l'agguato alle spalle (il verso dell'eroe nel mondo
  è ruotato sul palco), la sorpresa del tocco, la fuga, le pozioni, le abilità. Sopra è giorno: la torcia resta alla cintura.
- **Vinto**: cade quello che cade nei dungeon e si raccoglie da sé (le gemme col loro valore, le cose che vanno addosso o in tasca);
  quello che non ci sta resta per terra nel mondo (`stato.perTerra`). L'esperienza è quella dei dungeon, un quarto se l'eroe supera la
  fascia di più di quattro (`espNellaZona` con la `potenza` del luogo).
- **I morti tornano a passi, mai a ore** ([ricomparsa.md](ricomparsa.md)): da `SOPRA.ricomparsa` = 400 a 800 passi dopo (nei dungeon
  200: sopra si cammina di più), a casa, interi, e mai sotto gli occhi dell'eroe (entro 11,5 celle). Un giro nuovo li fa tornare tutti.
- **Svenuto** (la decisione 6 dell'utente): ci si risveglia nel villaggio, l'unica città (accanto alla sua pietra), con metà delle gemme e
  mezza vita; **le tasche si vuotano tranne i pezzi rari (gli «epici», temprati, runici…) e i leggendari**; quello addosso resta come giù.
  Tutti i mostri tornano a casa a dormire, interi. Nessun tetto agli svenimenti: sopra non c'è una tappa da perdere.
- **Scappato**: chi resta ha le sue ferite e `SOPRA.calma` = 3 secondi di calma.
- **Nessuna risposta sbagliata paga mai**: lo scontro è quello di sempre, sbagliando il colpo va a vuoto e niente cade.

## Il contratto

Tutto in `motore/aperta.js`. `m` è il mondo di `ilMondo()` (`motore/mondo-sopra.js`); le celle sono `(x, y)` del generatore, le posizioni
in celle con il centro a `+0,5` (nella scena `io.x`, `io.z`). Cosa cambia per la scena, e quando si caricano le zone:
[mondo-sopra-contratto.md](mondo-sopra-contratto.md).

| funzione | cosa fa |
|---|---|
| `popolaMondo({ mondo, eroe, giro, seme? })` | lo stato nuovo, coi mostri delle zone caricate a casa che dormono |
| `allineaZone(stato)` | popola le zone che il mondo ha appena caricato, dimentica le buttate; `{ nate, dimenticate }` (la chiamano da sé le tre sotto) |
| `riprendiMondo({ mondo, eroe, giro, salvato })` | lo stato da quello salvato (sotto); un salvato storto, di prima del percorso o di un altro giro: i morti tornano tutti |
| `inSalvo(stato)` | l'oggetto da salvare (pochi kB al più: i soli morti, per zona) |
| `nuovoGiro(stato, giro)` | entrando in città: i mostri rinascono, restano passi, forze e cose per terra |
| `mostriVicini(stato, x, y, raggio = 9,5)` | i mostri vivi da disegnare (gli oggetti dello stato: si leggono, non si toccano) |
| `muoviMostri(stato, { x, y }, dt)` | `dt` secondi veri (mai fotogrammi): svegli, inseguono, tornano; torna chi si è appena svegliato |
| `cammina(stato, passi, { x, y, energiaMax })` | i passi dell'eroe sopra: l'orologio, il mana che torna camminando, i morti che tornano; torna i tornati |
| `incontro(stato, { x, y }, { tocco })` | null, o `{ chi, campo, tocco, regione, zona, x, y }`: si apre uno scontro e con chi (`tocco`: l'indice del mostro toccato) |
| `apriLoScontro(stato, inc, { eroe, roba, crescita, forze, verso, missioni, conti })` | la `Corsa` sul palco con lo scontro aperto: `corsa.foglio` è il foglio di sempre |
| `esitoDelloScontro(stato, corsa)` | `{ come: 'vinto' / 'scappato' / 'svenuto' / 'aperto', roba, crescita, forze, esp, gemme, presi, rimasti, uccisi, risveglio, eventi, avvisi, domande, giuste, passi, conti, missioniFatte, preparati }` |
| `raccogliDaTerra(stato, i, { eroe, roba, crescita })` | prende la cosa `i` di `stato.perTerra` come giù (addosso o in tasca); `{ presa, roba, avvisi }` |
| `annuncioDi(m, x, y, forza)` | nel villaggio `{ citta, nome, sicura, testo }`; fuori `{ zona, nome, luogo, nomeLuogo, fascia, colore, segno, testo: '🟢 Il bosco vecchio · livello 3–5' }` |
| `coloreDellaRegione(fascia, forza)` (`coloreDellaZona`) | verde, arancio, rosso, grigio: il conto del pallino ([zone.md](zone.md#il-pallino-e-la-sentinella)) |
| `alSicuro(m, x, y)` | il villaggio, la cintura, un ponte o un varco, una zona mai caricata: lì nessuno si sveglia |
| `tanaDi(stato, luogo)` | la tana di un luogo e il suo signore (`{ x, y, zona, signore: { nome, tipo, vivo } }`), null se la zona non è caricata |
| `tagliaDi`, `taglieDaContare(taglie, { specie, regione, signore, zona })` | l'aggancio delle quest di caccia, sotto |
| `perdeSvenendo(roba)`, `cittaDelRisveglio(m)` | le regole dello svenimento, da sole |

**Un mostro dello stato** (`stato.mostri[i]`): `id` (`'bosco:1041'`), `zona` (l'indice in `m.zone`), `regione` (il luogo, l'indice in
`m.regioni`), `branco`, `tipo` (la specie di `dati/mostri.js`: lo sprite), `livello`, `casa {x, y}`, `fx fy` (dove sta adesso), `sveglio`,
`calmo`, `morto`, `torna` (il passo, o null), `ossa` (le ferite), `scheda` (com'è nato: `nome`, `ossaMax`, `att`, `grado`, `variante`…),
`caporale`, `signore`. **L'indice è `zona × 1000 + j`**: `stato.mostri` ha i buchi delle zone non caricate e si legge per indice; per
scorrerli c'è `stato.lista`. Lo stato tiene anche `branchi` (per indice), `tane`, `zone` (le popolate), `mortiFuori` (i morti delle zone
dimenticate), `passi`, `forze` (`{ vita, energia }` di sopra, o null: piene), `perTerra`.

**Cosa si salva**, nel campo `mondo` dell'avventura sotto `sopra`: `{ v: 2, eroe, giro, passi, morti: { [zona]: [[j, torna o −1]] }, forze,
perTerra: [{ cosa, x, y }] }`, con anche i morti delle zone lontane. Le posizioni e chi è sveglio no: rientrando ognuno dorme a casa sua.
Un `sopra` di prima (`v: 1`, i morti per indice del mondo ad anelli) vale come storto. Nessun campo nel profilo, `MONDO` non sale.

## Cosa si aspetta dalla scena

- **A ogni cella nuova** `seguiLEroe(m, x, y)` (le zone attorno): i mostri seguono da soli. **A ogni fotogramma**: `muoviMostri` col tempo
  vero, `cammina` coi passi fatti (le celle percorse, come le conta `Corsa.passi`; fermo, in pausa, sotto una domanda o col foglio aperto
  niente), poi `incontro`. Il tocco su un mostro passa il suo indice (`{ tocco: i }`); se è più lontano di 1,6 l'eroe ci cammina e si
  riprova (come per le persone). Disegna `mostriVicini` nel cerchio di luce (9,5 celle).
- **Lo scontro**: `apriLoScontro` con la roba, la crescita e le forze dell'avventura (venendo su dal portale le forze sono quelle della
  sosta, `forze` di `Gioco.vue`; se no `stato.forze`) e il verso dell'ultimo passo. La `Corsa` che torna si gioca con la stessa
  interfaccia dello scontro dei dungeon (domande, abilità, pozioni, fuga, il foglio `svenuto`): **non** si chiama `corsa.riprendi()`.
- **Chiuso il foglio**: `esitoDelloScontro`. `roba` e `crescita` vanno nell'avventura (`nellAvventura`), le forze nella sosta se si è saliti
  dal portale, se no restano in `stato.forze`; gli `eventi` e gli `avvisi` si festeggiano come giù. Svenuti: l'eroe va in `risveglio` (il
  villaggio e la cella accanto alla pietra), come un viaggio.
- **Il villaggio cura**: la guaritrice e l'incantatrice ([chi-cura.md](chi-cura.md)) rimettono `stato.forze` piene.
- **Entrando nel villaggio** il giro sale: `nuovoGiro(stato, giro)`. **Si salva** `inSalvo(stato)` in `mondo.sopra` insieme al resto di
  `mondo`, quando si salva la nebbia e alla fine di ogni scontro.
- **L'annuncio**: quando cambia la zona, `annuncioDi(...).testo` nella riga in fondo; `forza` è `forzaDelCorredo` dell'eroe ([forza.md](forza.md)).
- **Le cose per terra** (`stato.perTerra`) si disegnano come il bottino dei dungeon e si prendono con `raccogliDaTerra`.

## L'aggancio per le quest di caccia

Ogni esito ha `uccisi`: una **taglia** per mostro morto, `{ specie, regione, zona, livello, caporale, signore, id }` (`regione` è il luogo,
con le chiavi di sempre). Chi scrive le quest ([mondo-aperto-quest.md](mondo-aperto-quest.md)) le conta con `taglieDaContare(taglie, {
specie, regione, signore, zona })` (ogni filtro può mancare): «cinque lupi nel bosco dei lupi» è `{ specie: 'lupo', regione: 'lupi' }`,
«il signore della palude» `{ signore: true, regione: 'palude' }`. Le «sconfiggi N» di oggi passano lo stesso dentro lo scontro
(`missioni`, `conti`): sul palco valgono come giù, e tornano in `esito.conti` e `esito.missioniFatte`.

## Le misure

**Quanti, e quanto costano** (`unita/sotterraneo-mondo-mostri`): con i branchi a 14 celle (e 12 dalla tana) 1 123 mostri in 380 branchi
in tutto il mondo (prati 91, bosco 147, brughiera 156, palude 173, ceneri 167, monte 185, landa 204; l'erba di una zona è 11–14 mila
celle), contro i 1 899 in 642 con 9 e 8 (21 ottobre 2026): **in memoria** 225 dal villaggio (prati e bosco) e ~500 con tre zone caricate. Popolare una
zona 10–40 ms in Node; `muoviMostri` con ~900 mostri 35–50 µs a fotogramma, `inSalvo` un centinaio di byte. La leva è `cellePerBranco`.

`npm run sotterraneo -- --mondo` (`--semi 8 --bravure 0.9`, i quattro eroi, 32 tragitti a cella): il curioso parte dalla pietra accesa più
avanti prima del dungeon k (il villaggio per la cripta, la pietra della sua zona se le sta prima, se no quella della zona prima), con la
roba e la crescita con cui la sua storia ci arriva (`ingressoDelCurioso`), e va all'ingresso. **Per strada**: dritto, combatte chi lo
raggiunge. **Dalle tane**: passa dalla tana di ogni luogo che la strada attraversa e va incontro a ogni branco che vede. Fra uno scontro e
l'altro beve e dà i punti come il banco. Il 20 ottobre 2026, sul percorso, **senza ritarare** (la taratura è un giro a parte):

| a 9/10 | cripta | cantine | torre | tana | sale | porta | miniere | abisso |
|---|---|---|---|---|---|---|---|---|
| per strada: scontri · domande | 0 · 0 | 2,4 · 5 | 1,8 · 6 | 3 · 11 | 2,3 · 7 | 3,3 · 12 | 3,6 · 13 | 0,6 · 1 |
| svenuti · vita all'ingresso | 0 · 100% | **94%** · 4% | 6% · 58% | 25% · 39% | 16% · 58% | 6% · 52% | 19% · 46% | 0 · 100% |
| dalle tane: scontri · domande | 2,2 · 5 | 3,6 · 8 | 5,4 · 16 | 7,3 · 25 | 7,4 · 27 | 12,9 · 56 | 9,9 · 37 | 13,3 · 31 |
| svenuti · vita all'ingresso | 50% · 31% | 100% · 0 | 81% · 8% | 88% · 8% | 94% · 4% | 66% · 19% | 81% · 9% | 0 · 93% |
| passi (per strada) | 53 | 56 | 40 | 79 | 46 | 76 | 70 | 31 |

**I bersagli** restano quelli di prima (una proposta): per strada svenuti ≤ 10% e vita all'ingresso ≥ 60%; dalle tane svenuti ≤ 35% e
domande ≤ 40 a tragitto; la vita a fine scontro 40–85% come il bravo dei dungeon ([giocatori-tipo.md](giocatori-tipo.md)). Sul mondo ad
anelli (19 ottobre) per strada si sveniva al più il 3%.

**Fuori dai bersagli**, segnalati per la taratura e non ritarati:

- **Per strada fino alle cantine si sviene quasi sempre** (94%): il curioso della seconda discesa (livello 2, quasi nudo) parte dalla
  pietra dei prati, fuori dalla cintura, e incontra 2–3 branchi della seconda metà dei prati (livello 2–3) prima dell'arco. Le leve: la
  cintura fino alle cantine, `cellePerBranco` più alto nei prati, i prati 1–2 invece di 1–3.
- **Per strada dalla torre in poi** svenuti 6–25% e vita all'ingresso 39–58%: i branchi sono più fitti per cella di strada che sul mondo
  ad anelli (il corridoio è largo e quasi tutta l'erba è nido). La leva è `cellePerBranco` per zona.
- **Dalle tane si sviene 50–100%**: quattro luoghi a zona, ognuno col suo signore, e più branchi in vista.
- **L'abisso** si raggiunge quasi senza scontri: il curioso parte dalla pietra della landa, a 31 passi.

## Gli abitanti da dipingere

I diciotto luoghi senza abitanti propri hanno specie del catalogo scelte per habitat (`ABITANTI_DI_SOPRA`); dove l'habitat vorrebbe una
creatura che non c'è, `dipingere` la nomina: lo spaventapasseri vivo e il corvo (i campi, il colle dei corvi), la lepre e il falco (la
brughiera), il ghiro (il frutteto), l'orso (il bosco vecchio, la foresta nera), il rospo e l'airone (il lago), la capra e lo yeti (il
passo), l'avvoltoio (la landa), il brigante (il guado), il coccodrillo (la palude), il lupo capobranco (il bosco dei lupi, dove oggi fa
il caporale il troll). Sono il foglio di creature d'aperta campagna di [da-fare.md](da-fare.md); finché non c'è, una specie sta in più
luoghi (gli scheletri nel cimitero e nella valle delle ossa, i lupi in quattro).

## Cosa resta aperto

- **La scena sul percorso** (il compito D): `seguiLEroe` a ogni cella, l'annuncio quando cambia la zona, lo stato per indice e non per
  scorrimento ([mondo-sopra-contratto.md](mondo-sopra-contratto.md)). La scena di prima è in [mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md):
  **lo scontro lasciato con la ✕** vale come una fuga senza il graffio, coi rimasti che aspettano accanto all'eroe (`mondo.sopra.scontro`).
- **Le tarature** sono quelle di `SOPRA` e `CURVA_DI_SOPRA`, misurate solo col banco e non ancora rifatte sul percorso (sopra, «Fuori dai
  bersagli»): la ricomparsa a 400 passi, la cintura a 12, un branco ogni 110 celle in ogni zona, il signore all'inizio della fascia. Il
  giro della taratura vera è dopo B e C ([mondo-a-percorso-lavori.md](mondo-a-percorso-lavori.md)).

Nei test: `unita/sotterraneo-mondo-mostri` (lo stesso (eroe, giro) gli stessi mostri e un giro nuovo altri, la firma della pianta che non
cambia, nessuno nel villaggio, nella cintura, su strade, ponti, valichi, acqua o a quattro celle da un confine, inseguendo nessuno esce
dalla zona, la fascia che sale lungo la zona e di zona in zona, la seconda terra +14 con le stesse tane, una tana col signore per luogo,
l'annuncio con la zona, uno scontro vinto col bottino e le taglie, la ricomparsa a passi e mai a secondi né sotto gli occhi, il
salvataggio per zona riletto e quello di prima buttato, i mostri di una zona scaricata dimenticati e i morti ricordati, quanto costa
`muoviMostri`, svenendo restano rari e leggendari e ci si risveglia al villaggio, il signore che non torna).

**Dopo i branchi radi e lo scontro che prende i vicini** (21 ottobre, `--semi 8 --bravure 0.9`, a 9/10, la colonna `cantine`…`fondo` del banco):
per strada gli scontri a tragitto scendono (1,9 · 1,1 · 1,9 · 1,1 · 2,4 · 2,3 invece di 2,6 · 1,8 · 3 · 2,4 · 3,3 · 3,6) e gli svenuti con loro
(94 · 13 · 31 · 0 · 6 · 3 % contro 94 · 13 · 38 · 3 · 6 · 19 %); dalle tane si sviene meno (100 · 63 · 84 · 66 · 31 · 38 % contro 100 · 84 · 94
· 97 · 63 · 84 %) perché ci sono molti meno branchi, benché ogni scontro sia più pieno. Nessuna ritaratura: restano le cantine (94%).
