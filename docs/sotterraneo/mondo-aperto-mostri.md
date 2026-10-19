# Il mondo aperto: i mostri di sopra

La fase 5 del progetto ([mondo-aperto-fasi.md](mondo-aperto-fasi.md#7-le-fasi)), la metà del **motore**: chi vive nelle regioni del
mondo generato ([mondo-aperto-generatore.md](mondo-aperto-generatore.md)), dove dorme, quando si sveglia, chi entra nello scontro e cosa
resta dopo. L'utente, 16 ottobre 2026: «mostri anche sopra: sì», alla Diablo, più ci si allontana dal villaggio più sale il livello.
Puro, senza scena, gira in Node. La scena (fase 5, l'altra metà: [mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)) legge
questo file e basta.

- `motore/aperta.js` — il motore: popolare, muovere, incontrare, lo scontro, l'esito, il salvataggio, l'annuncio, le taglie.
- `motore/palco.js` — il palco dello scontro: un `Livello` di una stanza col branco già fatto (agganci in `livello.js` e `corsa.js`).
- `dati/mondo-aperto-mostri.js` — gli abitanti delle diciotto regioni senza, la curva della forza, le tarature (`SOPRA`).
- `motore/banco-mondo.js` — il banco (`npm run sotterraneo -- --mondo`).

Il Sotterraneo 2D e le discese non cambiano: gli agganci si accendono solo con `tappa.palco` e `m.signore`, che esistono solo sopra
(la taratura `--presto` e `test:misure` danno gli stessi numeri di prima).

## Le regole

- **La mappa non cambia, quello che ci vive sì**: i mostri nascono da `(eroe, giro)`, e il giro sale a ogni ritorno in città (lo conta
  già `viste/Mondo3d.vue`, campo `mondo.giro`). Lo stesso eroe allo stesso giro ritrova gli stessi branchi negli stessi posti.
- **Una regione è una stanza grande**: un mostro non ne esce mai, nemmeno inseguendo. Non entra in città, nella **cintura**, su un ponte o
  su un valico, nell'acqua o sulla roccia: passare un ponte è mettersi in salvo.
- **La cintura di sicurezza** (proposta dell'assistente): niente mostri entro `SOPRA.cintura` = 12 celle dalla zona del villaggio e dalla
  strada fra la piazza e la cripta dei re, perché un bambino piccolo non trovi un branco sulla strada del primo dungeon; attorno alle
  altre città un margine di 5. Lì nessuno si sveglia e chi insegue torna a casa.
- **Dove nasce un branco**: sull'erba della regione, raggiungibile dalla piazza, almeno 2 celle da una strada e 4 da un ingresso, una
  pietra, un antro o chi sta fermo; mai sulle strade vere. Inseguendo però sulla strada ci passa.
- **Quanti**: un branco ogni 110 celle d'erba dove può nascere, a 9 celle l'uno dall'altro e 8 dalla tana; da due a `branco` mostri
  (la curva: 2 al livello 1, 6 dal 10), pesati verso i piccoli come nelle terre selvagge. Al seme 19 sono ~220 mostri in ~77 branchi.
- **La fascia segue il dungeon** (già nella scheda, `dati/mondo-aperto.js`): una regione col dungeon comincia un livello sotto quello
  atteso (`LIVELLI_ATTESI`), le altre a metà fra le vicine, larga tre livelli; anello 1 in 1–6, anello 2 in 6–13. **Dentro la regione
  il livello sale coi passi dalla piazza**: il lato vicino a casa all'inizio della fascia, quello lontano in cima. Il `dif` della
  regione (le domande) è l'inizio di quello del suo dungeon.
- **Quanto è forte un mostro al livello L** (`CURVA_DI_SOPRA`): le discese della storia messe al loro livello atteso (cripta 0,25 · 0,
  scalinata 0,5 · 2, torre 0,5 · 4, grotta 0,8 · 6,5, sommersa 1,1 · 7,7, botola 1,25 · 8,7, miniera 1,8 · 9,5), in linea retta fra due,
  dal 12 la curva delle zone. Una regione un livello sotto il suo dungeon ha quindi mostri un poco più deboli. I numeri, le varianti e
  i gradi li fa `Livello.mostro` del dungeon.
- **La tana**: il centro della regione che il generatore riserva (o, se lì non si può, la cella più lontana dalla piazza). Ci sta **il
  signore**, il caporale della regione col nome («Il signore del bosco vecchio»), due volte le ossa di un caporale e un colpo in più,
  all'inizio della fascia, con 0–1 guardie nelle terre vicine e 1–2 nelle marche (caporali come lui). Battuto lascia **un raro della
  fascia di sicuro** (il tiro del grosso, al livello di un mostro; a volte un leggendario). Signore e caporali non tornano fino al giro dopo.
- **Svegliarsi e inseguire**: l'eroe nella stessa regione, fuori dalla cintura, a `SOPRA.sveglia` = 7 celle: si sveglia il mostro e
  tutto il suo branco, e gli va incontro a 3,1 celle al secondo (l'eroe ne fa 4,5: si può scappare). Oltre 11 celle, o se l'eroe passa
  in un'altra regione o al sicuro, torna a casa a 2,2.
- **Lo scontro**: si apre se un mostro sveglio arriva a 0,9 celle o se l'eroe ne tocca uno a 1,6. Entra il branco di chi apre (entro
  `RAGGIO_SCONTRO` 4,5) e chi è già sveglio e a 2,5 celle, della stessa regione, al più sette (`MOSTRI_IN_CAMPO`); chi apre è il primo.
  È lo scontro dei dungeon, giocato da una `Corsa` vera sul palco, coi suoi turni, l'agguato alle spalle (il verso dell'eroe nel mondo
  è ruotato sul palco), la sorpresa del tocco, la fuga, le pozioni, le abilità. Sopra è giorno: la torcia resta alla cintura.
- **Vinto**: cade quello che cade nei dungeon e si raccoglie da sé (le gemme col loro valore, le cose che vanno addosso o in tasca);
  quello che non ci sta resta per terra nel mondo (`stato.perTerra`). L'esperienza è quella dei dungeon, un quarto se l'eroe supera la
  fascia di più di quattro (`espNellaZona` con la `potenza` della regione).
- **I morti tornano a passi, mai a ore** ([ricomparsa.md](ricomparsa.md)): da `SOPRA.ricomparsa` = 400 a 800 passi dopo (nei dungeon
  200: sopra si cammina di più), a casa, interi, e mai sotto gli occhi dell'eroe (entro 11,5 celle). Un giro nuovo li fa tornare tutti.
- **Svenuto** (la decisione 6 dell'utente): ci si risveglia nella città più vicina a piedi (accanto alla sua pietra) con metà delle gemme e
  mezza vita; **le tasche si vuotano tranne i pezzi rari (gli «epici», temprati, runici…) e i leggendari**; quello addosso resta come giù.
  Tutti i mostri tornano a casa a dormire, interi. Nessun tetto agli svenimenti: sopra non c'è una tappa da perdere.
- **Scappato**: chi resta ha le sue ferite e `SOPRA.calma` = 3 secondi di calma.
- **Nessuna risposta sbagliata paga mai**: lo scontro è quello di sempre, sbagliando il colpo va a vuoto e niente cade.

## Il contratto

Tutto in `motore/aperta.js`. `m` è il mondo di `ilMondo()` (`motore/mondo-sopra.js`); le celle sono `(x, y)` del generatore, le posizioni
in celle con il centro a `+0,5` (nella scena `io.x`, `io.z`).

| funzione | cosa fa |
|---|---|
| `popolaMondo({ mondo, eroe, giro, seme? })` | lo stato nuovo, con tutti i mostri a casa che dormono |
| `riprendiMondo({ mondo, eroe, giro, salvato })` | lo stato da quello salvato (sotto); un salvato storto o di un altro giro: i morti tornano tutti |
| `inSalvo(stato)` | l'oggetto da salvare (pochi kB al più: i soli morti) |
| `nuovoGiro(stato, giro)` | entrando in città: i mostri rinascono, restano passi, forze e cose per terra |
| `mostriVicini(stato, x, y, raggio = 9,5)` | i mostri vivi da disegnare (gli oggetti dello stato: si leggono, non si toccano) |
| `muoviMostri(stato, { x, y }, dt)` | `dt` secondi veri (mai fotogrammi): svegli, inseguono, tornano; torna chi si è appena svegliato |
| `cammina(stato, passi, { x, y, energiaMax })` | i passi dell'eroe sopra: l'orologio, il mana che torna camminando, i morti che tornano; torna i tornati |
| `incontro(stato, { x, y }, { tocco })` | null, o `{ chi, campo, tocco, regione, x, y }`: si apre uno scontro e con chi (`tocco`: l'indice del mostro toccato) |
| `apriLoScontro(stato, inc, { eroe, roba, crescita, forze, verso, missioni, conti })` | la `Corsa` sul palco con lo scontro aperto: `corsa.foglio` è il foglio di sempre |
| `esitoDelloScontro(stato, corsa, { terra })` | `{ come: 'vinto' / 'scappato' / 'svenuto' / 'aperto', roba, crescita, forze, esp, gemme, presi, rimasti, uccisi, risveglio, eventi, avvisi, domande, giuste, passi, conti, missioniFatte, preparati }` |
| `raccogliDaTerra(stato, i, { eroe, roba, crescita })` | prende la cosa `i` di `stato.perTerra` come giù (addosso o in tasca); `{ presa, roba, avvisi }` |
| `annuncioDi(m, x, y, forza)` | dove si è: `{ citta, nome, sicura, testo }` o `{ regione, nome, fascia, colore, segno, testo: '🟢 Il bosco vecchio · livello 4–6' }` |
| `coloreDellaRegione(fascia, forza)` | verde, arancio, rosso, grigio: il conto del pallino ([zone.md](zone.md#il-pallino-e-la-sentinella)) |
| `alSicuro(m, x, y)` | in città, nel villaggio o nella cintura: lì nessuno si sveglia |
| `tanaDi(stato, regione)` | la tana di una regione e il suo signore (`{ x, y, signore: { nome, tipo, vivo } }`) |
| `tagliaDi`, `taglieDaContare(taglie, { specie, regione, signore, anello })` | l'aggancio delle quest di caccia, sotto |
| `perdeSvenendo(roba)`, `cittaDelRisveglio(m, x, y, terra)` | le regole dello svenimento, da sole |

**Un mostro dello stato** (`stato.mostri[i]`, l'indice è il suo nome): `id` (`'bosco:41'`), `regione` (l'indice in `m.regioni`), `branco`,
`tipo` (la specie di `dati/mostri.js`: lo sprite), `livello`, `casa {x, y}`, `fx fy` (dove sta adesso), `sveglio`, `calmo`, `morto`,
`torna` (il passo, o null), `ossa` (le ferite), `scheda` (com'è nato: `nome`, `ossaMax`, `att`, `grado`, `variante`…), `caporale`, `signore`.
Lo stato tiene anche `branchi`, `tane`, `passi`, `forze` (`{ vita, energia }` di sopra, o null: piene), `perTerra`.

**Cosa si salva**, nel campo `mondo` dell'avventura sotto `sopra` (il nome che [mondo-aperto-dati.md](mondo-aperto-dati.md) aveva già
dato alla superficie): `{ v: 1, eroe, giro, passi, morti: [[i, torna o −1]], forze, perTerra: [{ cosa, x, y }] }`. Le posizioni e chi è
sveglio no: rientrando ognuno dorme a casa sua. Nessun campo nel profilo, `MONDO` (`cfg.mondo`) non sale.

## Cosa si aspetta dalla scena

- **A ogni fotogramma**: `muoviMostri` col tempo vero, `cammina` coi passi fatti (le celle percorse, come le conta `Corsa.passi`; fermo,
  in pausa, sotto una domanda o col foglio aperto niente), poi `incontro`. Il tocco su un mostro passa il suo indice (`{ tocco: i }`); se
  è più lontano di 1,6 l'eroe ci cammina e si riprova (come per le persone). Disegna `mostriVicini` nel cerchio di luce (9,5 celle).
- **Lo scontro**: `apriLoScontro` con la roba, la crescita e le forze dell'avventura (venendo su dal portale le forze sono quelle della
  sosta, `forze` di `Gioco.vue`; se no `stato.forze`) e il verso dell'ultimo passo. La `Corsa` che torna si gioca con la stessa
  interfaccia dello scontro dei dungeon (domande, abilità, pozioni, fuga, il foglio `svenuto`): **non** si chiama `corsa.riprendi()`. Il
  palco si disegna sul terreno dove si è; l'eroe e il primo mostro si guardano come nel mondo.
- **Chiuso il foglio**: `esitoDelloScontro` con la `terra` di adesso (`terraDelMondo` coi passaggi aperti). `roba` e `crescita` vanno
  nell'avventura (`nellAvventura`), le forze nella sosta se si è saliti dal portale, se no restano in `stato.forze`; gli `eventi` (livello
  salito, leggendario) e gli `avvisi` si festeggiano come giù. Svenuti: l'eroe va in `risveglio` (la città e la cella), come un viaggio.
- **Le città curano**: la guaritrice e la fontana ([chi-cura.md](chi-cura.md)) rimettono `stato.forze` piene (oggi curano la sosta).
- **Entrando in città** il giro sale (già fatto da `Mondo3d.vue`): `nuovoGiro(stato, giro)`. **Si salva** `inSalvo(stato)` in `mondo.sopra`
  insieme al resto di `mondo`, quando si salva la nebbia e alla fine di ogni scontro.
- **L'annuncio**: entrando in una regione, `annuncioDi(...).testo` nella riga in fondo (oggi si dice il solo nome); `forza` è
  `forzaDelCorredo` dell'eroe ([forza.md](forza.md)).
- **Le cose per terra** (`stato.perTerra`) si disegnano come il bottino dei dungeon e si prendono con `raccogliDaTerra`.

## L'aggancio per le quest di caccia

Ogni esito ha `uccisi`: una **taglia** per mostro morto, `{ specie, regione, anello, livello, caporale, signore, id }`. Chi scrive le quest
([mondo-aperto-quest.md](mondo-aperto-quest.md)) le conta con `taglieDaContare(taglie, { specie, regione, signore, anello })` (ogni filtro
può mancare): «cinque lupi nel bosco dei lupi» è `taglieDaContare(e.uccisi, { specie: 'lupo', regione: 'lupi' })`, «il signore della
palude» `{ signore: true, regione: 'palude' }`. Le «sconfiggi N» di oggi passano lo stesso dentro lo scontro (`missioni`, `conti`): sul
palco valgono come giù, e tornano in `esito.conti` e `esito.missioniFatte`.

## Le misure

`npm run sotterraneo -- --mondo` (`--semi 8 --bravure 0.9`, i quattro eroi): il curioso esce dalla pietra della città che serve il dungeon
k, con la roba e la crescita con cui la sua storia ci arriva (`ingressoDelCurioso`), e va all'ingresso. **Per strada**: dritto, combatte
chi lo raggiunge. **Dalle tane**: passa dalla tana di ogni regione che la strada attraversa e va incontro a ogni branco che vede (il
curioso dei dungeon, che apre tutto). Fra uno scontro e l'altro beve e dà i punti come il banco; niente fonti né città a metà strada.

Il 19 ottobre 2026, 32 tragitti a cella (otto storie per eroe). Cripta · scalinata · torre · grotta · sommersa · botola · miniera ·
abisso; anello 1 le prime quattro, anello 2 le altre.

| a 9/10 | cripta | scal. | torre | grotta | somm. | botola | miniera | abisso |
|---|---|---|---|---|---|---|---|---|
| per strada: scontri · domande | 0 · 0 | 0,3 · 1 | 0,8 · 2 | 1,7 · 4 | 0,6 · 1 | 0,2 · 0 | 1,7 · 6 | 2,1 · 7 |
| svenuti · vita all'ingresso | 0 · 100% | 0 · 93% | 0 · 94% | 0 · 80% | 0 · 90% | 0 · 97% | 3% · 67% | 0 · 87% |
| dalle tane: scontri · domande | 2 · 4 | 4,5 · 10 | 7,5 · 18 | 8,8 · 20 | 3,7 · 12 | 3,4 · 10 | 7,5 · 30 | 12,3 · 49 |
| svenuti · vita all'ingresso | **91%** · 6% | 6% · 60% | 3% · 62% | 0 · 68% | 0 · 62% | 0 · 58% | 3% · 50% | 3% · 54% |
| vita a fine scontro · livelli presi | 31% · 0 | 71% · 0,2 | 72% · 0,6 | 87% · 0,5 | 69% · 0,3 | 69% · 0,2 | 64% · 0,6 | 70% · 0,4 |
| gemme raccolte (dalle tane) | 7 | 35 | 124 | 174 | 192 | 210 | 549 | 829 |

| a 6/10 (lo sbadato) | cripta | scal. | torre | grotta | somm. | botola | miniera | abisso |
|---|---|---|---|---|---|---|---|---|
| per strada: svenuti · vita all'ingresso | 0 · 100% | 0 · 91% | 3% · 90% | 0 · 76% | 0 · 84% | 0 · 97% | 6% · 57% | 0 · 76% |
| dalle tane: svenuti · domande | **100%** · 4 | 13% · 14 | 9% · 26 | 6% · 29 | 13% · 17 | 6% · 15 | 22% · 41 | 25% · **69** |
| dalle tane: pozioni · vita all'ingresso | 0,2 · 0 | 1,3 · 53% | 1,6 · 48% | 2 · 55% | 2,2 · 44% | 1,8 · 46% | 5,8 · 40% | 5,2 · 34% |

Per strada nelle terre vicine si combatte poco (la cintura copre la strada della cripta, e la strada stessa tiene i nidi a due celle):
il mondo pericoloso è fuori strada, dove si va a cercarlo. Provato: il signore in cima alla fascia con una o due guardie anche
nell'anello 1 faceva svenire il curioso che passa dalle tane quattro volte su cinque fino alla torre (adesso all'inizio della fascia,
con al più una guardia nelle terre vicine).

**I bersagli** sono una proposta (nessun documento li aveva per sopra): per strada svenuti ≤ 10% e vita all'ingresso ≥ 60% (si arriva
al dungeon «un poco più facile», non a pezzi); dalle tane svenuti ≤ 35% e domande ≤ 40 a tragitto (un dungeon girato tutto ne chiede fino
a 85, una seduta); la vita a fine scontro 40–85% come il bravo dei dungeon ([giocatori-tipo.md](giocatori-tipo.md)).

**Fuori dai bersagli**, segnalati e non ritarati:

- **Il signore del cimitero vecchio prima della cripta** (dalle tane, cripta: 91% svenuti a 9/10). L'eroe è al livello 1 e nudo (la prima
  arma la lascia il guardiano della cripta); il signore è un caporale scheletro cavaliere con le ossa doppie. È fuori dalla strada e la
  perdita è piccola (nessuna gemma, tasche vuote), ma è un muro. Le leve: la tana del cimitero accesa dopo la prima discesa, o nelle
  terre vicine un signore senza le ossa doppie.
- **Le domande dalle tane nelle marche**: l'abisso 49 a 9/10 e 69 a 6/10, la miniera 41 a 6/10 (bersaglio 40): quattro regioni con i
  loro signori e tutti i branchi in vista. Va bene se è una seduta a sé; se la seduta è tragitto più dungeon, `cellePerBranco` più alto
  nell'anello 2.
- **Per strada, la miniera a 6/10** arriva con il 57% di vita (bersaglio 60%): dal rifugio la strada passa vicino ai branchi della gola e
  della vetta.
- **La vita a fine scontro per strada** arriva al 90% alla torre e alla botola: pochi scontri (meno di uno a tragitto), con un branco
  piccolo; non è uno stravincere da correggere.

## Gli abitanti da dipingere

Le diciotto regioni senza abitanti propri hanno specie del catalogo scelte per habitat (`ABITANTI_DI_SOPRA`); dove l'habitat vorrebbe una
creatura che non c'è, `dipingere` la nomina: lo spaventapasseri vivo e il corvo (i campi, il colle dei corvi), la lepre e il falco (la
brughiera), il ghiro (il frutteto), l'orso (il bosco vecchio, la foresta nera), il rospo e l'airone (il lago), la capra e lo yeti (il
passo), l'avvoltoio (la landa), il brigante (il guado), il coccodrillo (la palude), il lupo capobranco (il bosco dei lupi, dove oggi fa
il caporale il troll). Sono il foglio di creature d'aperta campagna di [da-fare.md](da-fare.md); finché non c'è, una specie sta in più
regioni (gli scheletri nel cimitero e nella valle delle ossa, i lupi in quattro).

## Cosa resta aperto

- **La scena** è fatta (19 ottobre 2026, [mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)), sul contratto qui sopra e
  senza toccare il motore: i mostri nel cerchio di luce, il tocco, l'annuncio colorato, lo scontro sul prato, il risveglio in città,
  le forze di sopra curate in città. **Lo scontro lasciato con la ✕** vale come una fuga senza il graffio, coi rimasti che aspettano
  accanto all'eroe (`mondo.sopra.scontro`, un campo in più accanto a `inSalvo`).
- **Le tarature** sono quelle di `SOPRA` e `CURVA_DI_SOPRA`, misurate solo col banco: la ricomparsa a 400 passi, la cintura a 12, un branco
  ogni 110 celle, il signore all'inizio della fascia. Il giro della taratura vera (i giocatori tipo che girano il mondo prima di scendere,
  l'esperienza e le gemme in più all'ingresso) è la fase «La taratura» di [mondo-aperto-fasi.md](mondo-aperto-fasi.md).
- **Gli antri** (fase 7) prenderanno la fascia e gli abitanti della loro regione da qui (`abitantiDi`, `crescitaDiSopra`).

Nei test: `unita/sotterraneo-mondo-mostri` (lo stesso (eroe, giro) gli stessi mostri e un giro nuovo altri, la firma della pianta che non
cambia, nessuno in città, cintura, strada, ponte, valico o acqua, inseguendo nessuno esce dalla regione, le fasce che salgono e seguono il
dungeon, una tana col signore per regione, l'annuncio e i colori, uno scontro vinto col bottino e le taglie, la ricomparsa a passi e mai
a secondi né sotto gli occhi, il salvataggio riletto, svenendo restano rari e leggendari e ci si risveglia in città, il signore che non torna).
