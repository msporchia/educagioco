# Il mondo aperto: i mostri di sopra a schermo

La fase 5, la metà della **scena** ([mondo-aperto-fasi.md](mondo-aperto-fasi.md#7-le-fasi)), sul contratto del motore
([mondo-aperto-mostri.md](mondo-aperto-mostri.md#il-contratto)): nel Sotterraneo 3D i branchi delle regioni si vedono, si svegliano,
vengono incontro e si combattono sul prato, con lo scontro delle discese. Il motore (`motore/aperta.js`, `dati/mondo-aperto-mostri.js`)
non è cambiato; il Sotterraneo 2D e le discese nemmeno.

| file | cosa tiene |
|---|---|
| `viste/mondo-mostri.js` | lo stato del motore per l'eroe e il giro, il passo di ogni fotogramma, i passi, il tocco, cosa si disegna e cosa si salva |
| `motore/aperta-scena.js` | puro: la ✕ a metà (`fotoDelloScontro`, `lasciaLoScontro`, `rimettiLoScontro`), dove toccare un mostro, il conto delle taglie |
| `motore/forze-sopra.js` | puro e piccolo (lo legge `Gioco.vue` anche nel 2D): le ferite di sopra per la barra, chi le cura, «al villaggio» |
| `scena3d/mondo/mostri.js` | puro: il cerchio di luce, la figura di un mostro a un istante, la lista da posare, il bottino per terra |
| `scena3d/mondo/palco.js` | il palco dello scontro posato sul prato, coi pezzi dello scontro delle discese; il pittore per `Gioco.vue` |
| `viste/ScontroSopra.vue` | il pannello dello scontro delle discese sopra il mondo, le feste, gli avvisi, il foglio del risveglio |

`viste/Mondo3d.vue` li tiene insieme (le porte `scontro` e `raccogli`, `apriPalco`, `dopoLoScontro`, `statoSopra`), `Campagna.vue` li
passa, `Gioco.vue` gioca lo scontro.

## Cosa si vede

- **Il cerchio di luce**: si disegnano i mostri vivi entro `SOPRA.vista` = 9,5 celle dall'eroe (`mostriVicini`), e solo dove la nebbia è
  già aperta; nell'ultima cella e mezza (`ORLO`) svaniscono a retino. Il terreno resta visto dappertutto dove si è stati: il cerchio
  vale per i mostri, come nelle terre selvagge (`RAGGIO_APERTO`).
- **Ancorati come le persone** (`persone.js`, la stessa InstancedMesh: nessuna chiamata in più), col contorno e l'ombra a contatto,
  alla scala delle discese (`fattoreDelMostro`). Chi dorme respira piano (la posa da fermo a 1,5 fotogrammi al secondo) col 💤 sopra;
  sveglio respira a 4, e quando corre ha i passi a 8 e guarda dove va. I fotogrammi vanno col tempo, mai coi fotogrammi.
- **Il signore della regione** è 1,4 volte la sua specie, con la corona e il nome sopra la testa («👑 Il signore dei campi»); **i
  caporali** 1,15 volte, coi galloni d'oro come giù. Provato il nome anche sui caporali: «Un cinghiale runico caporale» si legge male.
- **Il bottino rimasto per terra** (`stato.perTerra`): il suo sprite, piccolo, che ondeggia sul prato.

## Come si gioca

- **Il passo**, a ogni fotogramma (`mostriDelPasso`): `muoviMostri` col tempo vero, `incontro`, e `cammina` a ogni cella nuova
  dell'eroe (non i salti: la pietra, il risveglio). A 60 e a 120 Hz lo stesso cammino (lo prova l'unità). I mostri aspettano fermi
  sotto la domanda di una pietra o della X, in un dialogo, nella veduta e con un pannello di `Gioco.vue` sopra il mondo (la bottega, lo
  zaino, la pagina dell'eroe, la scelta dell'eroe, una festa, il diario): la prop `fermo`.
- **Il tocco**: ogni mostro nel cerchio ha il suo bersaglio sopra la tela (`[data-mostro-sopra]`, sul rettangolo della figura, come le
  persone), e un tocco sul prato entro 1,3 celle dai suoi piedi vale lui (dopo le persone). A portata (`SOPRA.tocco`, 1,6 celle) lo
  scontro si apre subito, col tocco (la sorpresa); più lontano l'eroe gli va incontro e lo scontro si apre arrivato. Un tocco altrove
  scorda la meta.
- **L'annuncio**: passando da una regione a un'altra, la riga in fondo dice `annuncioDi(...).testo` («🟢 I campi · livello 1–3») col
  bordo del colore per questo eroe (`forzaDi` di `Gioco.vue`), per 3,4 secondi; in città il suo nome, come prima.

## Lo scontro sul prato

- **Lo gioca `Gioco.vue`**, come uno scontro di giù: `apriLoScontro` dà la `Corsa` del palco, che diventa la `corsa` di sempre (la
  scelta del colpo, le domande, il racconto, le pozioni, le abilità, la fuga, l'apertura e l'agguato). Il mondo resta montato sotto
  (`v-if="!corsa || sopra"`): il pannello è quello delle discese (`viste/ScontroSopra.vue`, gli stessi pezzi), le scritte sopra le
  figure sono `viste/Scontro3d.vue` dentro il mondo (lo slot `scontro`). Le risposte giuste pagano come giù; le «sconfiggi N» dei dungeon
  sopra non contano (`missioni: []`): sono di una discesa. La pausa è quella di giù, senza «lascio perdere questa discesa» né «scelgo
  un altro eroe».
- **Lo disegna il mondo** (`scena3d/mondo/palco.js`): un gruppo posato con la cella dell'eroe del palco (`EROE_SUL_PALCO`) sui suoi piedi,
  e dentro le figure, la roba, l'eroe, il racconto dei colpi e il palco coi posti e il bersaglio delle discese (`cose.js`, `eroe.js`,
  `racconto.js`, `scontro.js`), gli anelli e le scintille. Una cella del palco si calpesta se si calpesta il mondo sotto il suo centro
  (`palcoNelMondo`): i combattenti si dispongono dove si cammina, mai in un fiume o in una casa. Le figure partono da dove stavano nel
  mondo e corrono ai loro posti; ognuna, e ogni anello, sta sulla quota del terreno sotto di lei. Niente luci puntiformi: sopra è
  giorno, e una luce in più ricompilerebbe ogni materiale del mondo; il lampo del colpo resta sulle figure e nelle scintille. La
  telecamera del mondo inquadra il palco (almeno 9,5 celle) sopra il pannello e trema ai colpi. Il palco nasce una volta, con gli
  shader, e si riaccende a ogni scontro.
- **Perché sul mondo e non sulla scena delle discese**: col palco disegnato da `scena3d/indice.js` (una stanza di prato) il mondo si
  sarebbe buttato e rifatto a ogni scontro (un secondo e più sul telefono) e lo scontro non sarebbe stato dove si è.
- **Il dito** nello scontro: il tocco sul prato va al palco (`scontro.tocca`: il bersaglio, il racconto accorciato, i 320 ms ciechi); i
  bersagli del mondo e le bussole si nascondono.
- **Finito** (il foglio chiuso e il racconto detto, `chiudiSopra`): `esitoDelloScontro` con la terra di adesso; roba e crescita
  nell'avventura, le forze nella sosta se si è saliti dal portale (e `stato.forze` torna null), se no in `stato.forze`; le taglie (sotto);
  `sotMostri` conta i caduti; poi il mondo (`dopoLoScontro`) chiude il palco, salva e riprende.

## Svenire, le ferite, chi cura

- **Svenuti**: il foglio «Ti hanno portato in salvo» (`[data-risveglio-sopra]`, la città di `cittaDelRisveglio`) dice cosa si perde;
  «mi rialzo» chiude lo scontro e l'eroe si sveglia accanto alla pietra della città, con metà delle gemme e in tasca solo i pezzi rari e
  leggendari (il motore, `perdeSvenendo`). Entrando in città il giro sale come sempre, e chi vive sopra rinasce (`nuovoGiro`).
- **Le ferite di sopra** (`mondo.sopra.forze`) sono le `forze` di `Gioco.vue` anche senza il portale (`forzeDiSopra`): la barra le dice,
  il mana torna camminando (`cammina`), e la guaritrice, l'incantatrice e la fontana le curano come la sosta (`curaDa` → `curaDiSopra` su
  `stato.forze`, poi il mondo salva). **Scendere le guarisce** (`avvia` le azzera): la discesa nasce in piedi, e senza questa riga,
  risalendo, si sarebbero ritrovate le ferite di prima.

## La ✕ in mezzo allo scontro

**La scelta** (il motore la lasciava aperta): la ✕, o la schermata che se ne va, in mezzo a uno scontro di sopra **vale come una fuga
senza il graffio**: i caduti restano morti (coi loro passi per tornare), chi resta tiene le sue ferite, la roba e l'esperienza presa
restano nell'avventura; e i rimasti si ricordano in `mondo.sopra.scontro` (`{ campo: [[indice, ossa]], x, y }`). Rientrando stanno
accanto all'eroe, svegli e feriti (`rimettiLoScontro`), e lo scontro si riapre da sé al primo passo del motore. Perché: uscire non
butta la partita ([../core/ripresa.md](../core/ripresa.md)) e non regala una fuga, senza salvare una `Corsa` a metà (turni, stati,
racconto: nemmeno la sosta di giù salva uno scontro aperto). Riaperto è un incontro nuovo: chi è più svelto può colpire per primo, come
rientrando in una discesa. La foto di chi è in campo si scrive anche quando lo scontro si apre: se il telefono si spegne a metà, rientrando
si ricomincia lo stesso scontro. Un salvato di un altro eroe o di un altro giro non rimette nessuno.

## Il salvataggio

`mondo.sopra` è `inSalvo(stato)` del motore più lo scontro aperto o lasciato; si scrive con il resto di `mondo` (arrivando, scoprendo al
più ogni tre secondi, quando cambiano le forze camminando, a ogni scontro aperto e chiuso, uscendo). Nessun campo nel profilo.

## Le taglie

Accese (`MOTORI['mostri-sopra']`, [mondo-aperto-quest.md](mondo-aperto-quest.md#laggancio-coi-mostri-di-sopra)). A ogni scontro chiuso
`taglieDelloScontro(esito.uccisi, …)`: la **caccia aperta** somma i caduti di quella specie in quella regione (`taglieDaContare` del
motore) al suo conto in `conti[id]`, e a `quanti` è fatta; **il signore** è fatto quando cade il signore della regione; **la tana**
quando tutto il branco del signore è a terra. Le fatte passano da `azioneMissione(id, 'fatta')` e la riga sopra il mondo le dice
(«Fatto: … Passa dalla bacheca.»). Il diario mostra la caccia col suo «N di M».

## Il bottino per terra

Quello che dopo uno scontro non stava in tasca resta sul prato (`stato.perTerra`, `[data-per-terra]`): un tocco, l'eroe ci va e
`raccogliDaTerra` lo prende come giù (addosso se è meglio, in tasca se c'è posto); senza posto lo si dice e resta lì.

## Quanto costa

Chrome senza schermo (SwiftShader: chiamate e triangoli contano, i ms no), 390×844, pixel ratio 1:

| | chiamate | triangoli |
|---|---|---|
| davanti al branco delle vespe, nei campi | 111–115 | 295–303k |
| lo scontro lì, sul prato | 102 | 288k |

I mostri nel cerchio non aggiungono chiamate (le figure sono quelle delle persone); il palco ne aggiunge al più sei, ma la telecamera
più vicina vede meno pezzi. **Il vecchio telefono** (fascia bassa, 4 core, CPU ×5: contano i rapporti) col comando di
[../core/vecchio-telefono.md](../core/vecchio-telefono.md#lo-scontro): il banco della tela nello scontro sul prato 290 ms, il mondo fermo
nello stesso posto 281 (+3%). Il mondo in emulazione costa però circa tre volte lo scontro delle discese (~100 ms): è il mondo, non i
mostri, e va guardato sul Note 7.

## Cosa resta aperto

- **Col dito sul telefono**: lo scontro sul prato col pannello (i mostri dietro il pannello quando il palco cade in basso), il tocco su un
  mostro che cammina (il bersaglio si sposta), il 💤 e i galloni che si leggano, gli fps del mondo e dello scontro sul Note 7 (fascia
  bassa) col contatore.
- **Su un pendio** il palco segue il terreno figura per figura, ma i chiarori per terra (`aloni`) stanno alla quota dell'eroe.
- **Le tarature**: quanto spesso si combatte girando il mondo, le basi delle taglie, la ricomparsa a 400 passi (il motore,
  [mondo-aperto-mostri.md](mondo-aperto-mostri.md#cosa-resta-aperto)).

Nei test: `unita/sotterraneo-mostri-sopra-scena` (il cerchio e l'orlo, la figura di chi dorme e di chi corre, il signore più grande, chi
non si disegna, il palco sui piedi dell'eroe, lo stesso cammino a 60 e a 120 Hz, il branco che arriva addosso, fermi sotto una domanda, il
tocco lontano e a portata, la ✕ a metà e i rimasti che tornano svegli e feriti, svenuti la ✕ non salva, le forze di sopra e chi cura, la
caccia aperta, il signore e la tana, il diario) e `integrazione/sotterraneo-mostri-sopra` (col dito vero: l'annuncio dei campi col suo
colore, il branco che si sveglia, lo scontro sul prato e quanto costa, il bersaglio toccato nella scena, la vittoria coi caduti morti nel
salvataggio, la ✕ e lo scontro che si riapre rientrando, lo svenimento con metà gemme e il raro in tasca, il risveglio al villaggio, la
guaritrice che cura le ferite di sopra, la caccia aperta che si chiude, il bottino raccolto toccandolo). Bersagli: `[data-mostro-sopra]`
(`data-i`, `data-tipo`, `data-sveglio`, `data-caporale`, `data-signore`, il nome `[data-nome-signore]`), `[data-avviso-terra][data-annuncio]`
(il colore), `[data-scontro-sopra]` col `[data-pannello3d]`, `[data-scontro-3d]`, `[data-risveglio-sopra]` (`data-citta`) e
`[data-azione="risveglio"]`, `[data-per-terra]` (`data-i`, `data-cosa`); `window.__mondo3d` (`stato()`, `inScontro()`, `palco()`,
`mostri()`, `vicinoAl(i, d)`, `senzaMostri()` per le prove che non sono uno scontro, come `integrazione/sotterraneo-bacheca`) e
`window.__sotterraneo3d` (`palco`, `corsa`, `banco(n)`, `grafica().palco`).
