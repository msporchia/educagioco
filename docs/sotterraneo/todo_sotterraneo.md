# Il sotterraneo: il todo unico

Tutto quello che è rimasto a metà, i bug noti e le voci da guardare col dito, scritto da due sessioni insieme (21 ottobre 2026):
**«Mondo sotterraneo e oggetti di scena»** (il mondo di sopra, le quest, i dungeon che si rigenerano, le tane) e **«Mostri renderizzati per
sotterraneo»** (eroi, mostri ed effetti in 3D vero, lo scontro, i boss). Ognuna scrive la sua sezione; le voci comuni stanno in fondo.
Le voci più vecchie restano in [da-fare.md](da-fare.md) e [da-fare-3d-e-mondo.md](da-fare-3d-e-mondo.md): qui sono ripresi solo i
rimasti aperti. Quando una voce si chiude si toglie da qui (la storia sta in `git log`).

## 1. Il mondo di sopra (sessione Mondo)

### A metà: cosa non è ancora fatto

- **Il viaggio indietro fra le terre**: le terre successive ci sono ([terre-successive.md](terre-successive.md)), ma dal villaggio di
  una terra dopo non si torna a quelle già viste (il motore lo sa già, `passaTerra(a, t)`; manca il modo nel gioco: la porta nei due
  versi o la pietra del villaggio). Restano anche la medaglia per una terra nuova (il primato `sotTerra` c'è) e il minatore che
  racconta i volti nuovi; le terre dopo la prima vanno tarate col banco (`--terra 2`) insieme al resto.
- **Gli screen delle sette zone con i nemici** chiesti da Marco: ora c'è `scatta-app.mjs --tana <luogo>` (`--tana lista`); mancano le
  foto per zona e lo scontro all'aperto.
- **La torcia nel dungeon** (quasi chiuso, `corsa.js:264`): nello screenshot di Marco (torre, piano 3 di 3) si vede un cerchio di ~3 celle:
  è lo stato «senza torcia accesa» (`RAGGIO` 3,2; con la torcia `RAGGIO_TORCIA` 9,5), non un difetto dell'eroe 3D. Da confermare con Marco se la
  torcia era spenta o finita (`torciaResta` 0). Sopra, nel mondo, la torcia non fa niente (è sempre giorno): decidere se deve servire.
- **Le quest**: restano le quest scritte a mano nelle zone, scorta ed eventi. La cacciatrice e il carovaniere hanno il modello 3D ma
  non stanno nel mondo: dove metterli (il forte e il rifugio non ci sono più; in `PERSONE` cambia la firma del mondo) e cosa chiedono
  (quest scritte a mano) è da decidere ([mondo-aperto-quest.md](mondo-aperto-quest.md#chi-le-dà)). Le basi delle taglie (`BASI`,
  tetto 40 gemme) e quanto guadagna chi le fa tutte stanno nella taratura, sotto.
- **I dungeon che si rigenerano** ([dungeon-che-si-rigenerano.md](dungeon-che-si-rigenerano.md)): la cava (13) esce più tenera delle
  miniere (12); i nomi dei sei boss nuovi sono scelti (Roccaverde, Piumanera, Sibilla, Vulcanor, Gelomagno, Falcenera; le chiavi nei
  dati restano quelle di prima, sono salvataggi).
- **Abitanti da dipingere**: orso, corvo, avvoltoio, brigante, lupo capobranco e gli altri; oggi sono specie del catalogo scelte per
  habitat ([mondo-aperto-mostri.md](mondo-aperto-mostri.md)).
- **La pergamena del portale** ([da-fare.md](da-fare.md)): il modello 3D c'è (`poc/roba-3d/pozioni.js`); il resto è fermo, ognuno per
  una ragione (22 ottobre):
  - *lo sprite 2D*: nel foglio `scudi.png` ci sono pergamene non ritagliate, ma lo sprite si dichiara in `dati/cose.js`, che era in
    mano allo slot dell'elmo; si fa dopo, con una riga nel foglietto e `atlante.py`;
  - *la casella nella barra*: non c'è (si apre dallo zaino). Sei caselle invece di cinque scendono da ~42 a ~34 px a 390 di larghezza
    (~31 a 360), e la barra vuole caselle tutte uguali ([barra.md](barra.md)); la torcia ne è già uscita perché «non così utile». Da
    decidere con Marco: la sesta casella, o una che cede il posto (💎 apre lo stesso zaino della bisaccia);
  - *il banco*: nessun documento dice quando un giocatore tipo la compra e la apre ([risalite.md](risalite.md) usa solo il portale
    fisso), e serve alla taratura, che è rimandata;
  - *l'abisso «dall'inizio del tratto»*: la regola non è scritta (ripartire dal primo piano del tratto o dal piano lasciato, con quale
    sosta); oggi la pergamena là è «torno su per stasera» e si riprende come dopo la risalita ([portale-e-sosta.md](portale-e-sosta.md)).
- **L'icona del villaggio** (`ICONE_MONDO.villaggio`, generata): nessuna schermata la chiede (`iconaDi` la dà solo se qualcuno passa
  `'villaggio'`, e oggi nessuno lo fa; le 14 icone dei dungeon invece servono al Diario e alla carta di ripresa). Si tiene: quando le città
  saranno più d'una ci vorrà.

### Bug noti

- **Il mercante a cui vendere non si trovava** (Marco, dopo il villaggio nuovo): il rigattiere e l'erborista avevano il `piede` sulla riga di
  dietro del loro lotto, e dal sud la tenda della bottega li copriva (`data-vis=1` ma invisibili). Portati sul fronte della piazza
  ((15,7) e (7,8) in `dati/mondo-aperto.js`, 21 ottobre): da riguardare sul telefono.
- **I ritratti 3D nel mondo** (22 ottobre): in `integrazione/sotterraneo-mondo` il ritratto del dialogo e quello della bottega non
  arrivano, e `__anteprime3d.stato()` dice `rotto: true` (il contesto WebGL delle anteprime perso, `webglcontextlost`) con la macchina
  carica (load 20–25); nelle discese (`-elmo`) le anteprime vanno. Da rilanciare a macchina libera; se resta rosso, guardare chi perde il
  contesto quando il mondo e le anteprime ne tengono due. Nello stesso test la palude è passata da 154 a 191 chiamate (soglia 200)
  dopo il merge di `main` del 22 ottobre: da guardare prima che la soglia scatti.
- **Fumetto del portale**: `TypeError charAt` su `f.nome` mancante quando la sosta si svuota («torno giù»): corretto con `minuscolo`
  tollerante (21 ottobre); non riprodotto nel browser, solo dedotto dal file pubblicato. Se ricompare, incollare l'errore.
- **Test del browser lenti sotto carico**: `sotterraneo-mondo`, `-bacheca`, `-mostri-sopra`, `-mondo-meta` vanno in timeout con la macchina
  carica (load 40–90 con più agenti); da soli passano. Girarli uno o due alla volta (`--alla-volta=2`).
- **`integrazione/sotterraneo-mondo` fallisce al passo della pietra** (`[data-pietra-domanda] .qz-tasto` non compare entro 30 s) anche senza
  la modifica del rigattiere, con load average 16–23; da solo, a macchina libera, passava. Da rilanciare quando il carico è basso; se
  fallisce ancora è una regressione dei gesti (drag/tocco) o della pietra del villaggio nuovo.
- **`misure/sotterraneo` è rossa per taratura** (22 ottobre, non ritarata per ordine di Marco): a 4/10 il nano al fondo vince 14/20 (non «quasi
  sempre»), e fra i quattro eroi la torre vince il 31% e il fondo il 43% (bersaglio: quasi mai). Da risolvere insieme alla taratura qui sotto.
- **I test del browser col dito e la mappa che scorre**: chiuso un dialogo o aperto un foglio, la mappa torna a posto scorrendo per circa un
  secondo; un tocco dato prima cade sul prato. `-cura` e `-missioni` ora aspettano che la cosa stia ferma (`toccaIl` locale); lo stesso
  `toccaIl` copiato in altri test non lo fa, se uno diventa instabile si sa dove guardare. `-bottega-avanti` passava in questo giro ma a volte
  fallisce per un prezzo casuale.
- **`node_modules` condiviso svuotato** da un `npm ci` interrotto (21 ottobre, ripristinato copiando un'installazione): i worktree degli
  agenti lo collegano con un symlink al checkout principale; chi lancia `npm ci` lì rompe tutti.

### Taratura (dopo, a lavoro finito: Marco ha detto di non ritarare ora)

- Svenimenti per strada nel mondo a percorso, a 9/10 di risposte giuste: cantine 94%, tana dei ragni 25%, miniere 19%, sale allagate
  16% (bersaglio ≤ 10% e vita all'ingresso ≥ 60%); dalle tane 50–100%, fino a 56 domande. Leve: `cellePerBranco` per zona, la
  cintura di sicurezza fino alle cantine, i prati a 1–2 invece di 1–3, `SOPRA.fraBranchi` (ora 14), `SOPRA.dalloTana`.
- **`STORIA_DALLA_ZONA`** (in `dati/dungeon-del-mondo.js`, spento): la prima volta delle sette porte nel 3D ai livelli dei dungeon
  (4/8/10/12 invece di 3/7/8/10 per torre, sale allagate, porta dell'inferno, miniere). Cambia livelli, forza e domande della storia:
  si accende con la taratura, non prima.
- Il signore del cimitero stende quasi sempre l'eroe nudo di livello 1 che ci va prima della cripta (91–100%).
- Le risalite col portale gemello, la torcia (a 4/10 il curioso vince il fondo 4 volte su 6), il bottino delle botti, la pergamena, le
  basi delle taglie, `PIU_FORTE` dei dungeon. → [giocatori-tipo.md](giocatori-tipo.md), `npm run taratura`.

### Da guardare col dito sul telefono (Redmi Note 7 della bambina, fascia bassa)

- **Prestazioni**: gli fps del mondo e dello scontro sul prato (prima 48 fermo e 15 in attacco nello scontro delle discese, poi
  alleggerito: da rimisurare col contatore fps, una misura fermi, tre attacchi, dieci secondi camminando); il tempo di caricare una zona
  (stimato 0,1–0,5 s sul Note 7); i ~250 chiamate dello scontro sul prato e del mondo con due branchi vicini (mostri 3D, tetto 8); il
  bosco da solo supera i 400k triangoli per il decoro.
- **Si legge?** Il villaggio tondo a zoom normale, le luci azzurre della scia sul sole e sui ciottoli, i segni delle tane, il 💤 e i
  galloni dei mostri, il capitano (piccolo, blu poco marcato), le insegne e le panche, il fascio sulla meta.
- **Gesti**: drag della vista e pinch per lo zoom (compito C, su `main`) contro il tocco per camminare; lo scontro sul prato sopra il
  pannello delle azioni.
- **Il tasto «portami lì» è stato tolto** (decisione di Marco): se i più piccoli non trovano la strada, la leva è il velo, non il
  tasto.

### Fatto il 21 ottobre (da togliere al prossimo giro)

La telecamera dello scontro sul prato con `coperto` e l'inclinazione a 36° (`ae9915b5`); lo scontro che prende i mostri vicini («o dentro o
fuori») e i branchi a 14 celle (`292a98f5`); il villaggio tondo (24×20); la scia sulla strada; drag e pinch; le tane con il loro segno.

### Decisioni prese da Marco (22 ottobre)

- **La torcia sopra non serve**: si consuma e si usa solo dentro i dungeon, sopra è sempre giorno.
- **Il pannello dei genitori**: niente di nuovo da spegnere, come nel 2D. Il 3D è già dietro l'interruttore dei giochi in prova (`sperimentali`,
  [../genitori/interruttori.md](../genitori/interruttori.md)); le terre non hanno un interruttore.
- **I nomi dei boss nuovi** li sceglie Claude: basta che suonino epici.
- **L'elmo è uno slot tutto suo** (drop, botteghe, zaino, `copri` dell'eroe 3D): in lavorazione (22 ottobre).
- **Nessuna riga di novità per i bambini** per ora.
- **La taratura solo a lavoro finito.**
- **Le terre finiscono alla quinta**: lì la porta resta chiusa; finite le tappe di una terra si ricompare in un nuovo villaggio con tutto
  potenziato (+14 livelli a terra). Aperto: il viaggio indietro (sopra, «A metà»).
- **Missioni nelle terre nuove**: oggi restano dell'eroe e valgono in ogni terra; rifarle da capo per ogni terra è un todo, non essenziale ora.
- **Medaglia per una terra nuova**: no.
- **Pubblicare** periodicamente con `./pubblica.sh` (mai push su GitHub per ora), senza rifare ogni volta tutti i test; la prova completa a
  macchina libera si fa a lavori finiti.
- **Modelli 3D da migliorare** (dopo): drago dello scudo (sembra una lucertola) e leoni con la stessa sagoma; ciondolo su mago e nano; puntine
  dei castoni e fiamme delle collane; fiamme della torcia a coni; rosso delle cure rosato; collane e scudi sopra i 1500 triangoli (fino a
  1960); cappucci calati poco visibili; scorpione (coda piatta), golem (testa nascosta nello schianto) e pipistrello visto dall'alto.

## 2. Eroi, mostri ed effetti in 3D (sessione Mostri renderizzati)

### A metà

| Voce | Chi | Stato |
|---|---|---|
| La roba 3D per figura: un modello per ognuna delle 238 figure di `roba.json` (`poc/roba-3d/`: lame, bastoni, scudi, vesti, gioielli), con aloni di rarità ed elemento (`aloni.js`) | Mostri | spade/asce e bastoni/archi fatti, scudi, gioielli e vesti in corso |
| Collegarla al gioco: `modelloDiRoba(chiave)` (chiave → figura → modello, ripiego sul modello della base e poi sullo sprite), `npm run roba3d`, eroe in scena, zaino, botteghe, ritratto | Mostri | in corso (agente) |
| Gli anelli sono solo 4 e si vedono nelle anteprime, non sull'eroe | Mostri | deciso |
| La torcia mostra un cerchio di ~3 celle invece del cono da 9,5: il raggio lo decide il motore (`corsa.js:264`, `RAGGIO` 3,2 se `torciaAccesa` è falso), non la luce 3D; 3 celle è lo stato «senza torcia» (`torciaResta` 0, niente alla cintura). Da confermare con lo screenshot se la torcia era finita | Mostri | quasi chiuso, serve la conferma di Marco |

### Da fare dopo

| Voce | Chi | Stato |
|---|---|---|
| Un elmo vero nello slot testa: fatto il 22/10, la casella `testa` e sei copricapi, solo nel 3D ([elmo.md](elmo.md)); restano lo sprite per il 2D, un copricapo leggendario, i copricapi nel mondo di sopra | Mostri | fatto, da guardare col dito |
| Costi in chiamate: scontro sul prato ~231, mondo con due branchi ~250 (soglia del test 260) | Mostri | tenere d'occhio |
| Peso e fluidità sul telefono (nessuna misura fatta) | Mostri | da guardare col dito |
| Prove del browser complete (`npm run test:browser`) e `test:misure` non lanciate dopo il 3D | Mostri | da fare prima del prossimo giro grande |
| Le persone 3D di sopra: quadri e righe come colori nei vertici (oggi trame, cinque mesh in più), peso sul telefono | Mostri | da guardare col dito |

### Mostri 3D senza modello

Fatto: le sei specie (pianta, piranha, golem di muschio, scorpione, mostro viola, pipistrello occhio) hanno i modelli di `poc/mostri-3d/varie.js`.

Le specie scelte per l'habitat ma da dipingere (`dipingere` in `dati/mondo-aperto-mostri.js`: orso, corvo, avvoltoio, brigante, lupo
capobranco, rospo, airone, coccodrillo e gli altri) non sono ancora specie: oggi sono altre del catalogo, quindi non hanno nemmeno uno sprite.

### Fatto il 21 ottobre

Eroi, mostri e mosse multiple in 3D, effetti 3D, camera bassa nello scontro, anteprime 3D di caselle, ritratto e fila dei turni.
Come si rifanno: `npm run promuovi3d` (`docs/sotterraneo/mostri-3d.md`, `mosse.md`, `anteprime-3d.md`).

### Fatto il 22 ottobre

Le persone del mondo di sopra in 3D (mercanti, missioni, capitano, minatore, viandanti, sentinelle), coi ritratti 3D nel dialogo,
nel diario e nella bottega: `docs/sotterraneo/persone-3d.md`.

## 3. Voci comuni

- Chi tocca `scena3d/mondo/` e `Mondo3d.vue` (mondo) e chi tocca `scena3d/` delle discese e `mostro3d.js` (mostri 3D) si avvisano al merge
  su `main`; regola per pubblicare: `git merge main` nel proprio ramo, `git merge --ff-only` su `main`, `./pubblica.sh` da un albero pulito.
- I mostri 3D nel mondo di sopra: tetto di 8 modelli (i più vicini all'eroe), gli altri sprite; se costa troppo sul Note 7 è la costante
  da abbassare.
- I file generati non si toccano a mano: `dati/icone-mondo.js` (`npm run scatti icone-mondo`), `scena3d/eroi3d|mostri3d|effetti3d/`
  (`npm run promuovi3d`), le emoji (`npm run emoji`; in un conflitto sulle emoji si rilancia il comando, non si fonde a mano).
