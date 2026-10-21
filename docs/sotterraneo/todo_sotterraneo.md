# Il sotterraneo: il todo unico

Tutto quello che è rimasto a metà, i bug noti e le voci da guardare col dito, scritto da due sessioni insieme (21 ottobre 2026):
**«Mondo sotterraneo e oggetti di scena»** (il mondo di sopra, le quest, i dungeon che si rigenerano, le tane) e **«Mostri renderizzati per
sotterraneo»** (eroi, mostri ed effetti in 3D vero, lo scontro, i boss). Ognuna scrive la sua sezione; le voci comuni stanno in fondo.
Le voci più vecchie restano in [da-fare.md](da-fare.md) e [da-fare-3d-e-mondo.md](da-fare-3d-e-mondo.md): qui sono ripresi solo i
rimasti aperti. Quando una voce si chiude si toglie da qui (la storia sta in `git log`).

## 1. Il mondo di sopra (sessione Mondo)

### A metà: cosa non è ancora fatto

- **Le terre successive** (compito E, mai cominciato): la porta delle terre in fondo alla landa (si apre ripulendo le tombe del vento),
  il nuovo villaggio con la sua tinta di terreno e cielo, `terra` e `mondi[t]` nell'avventura, `terraOra()` in `Gioco.vue` (oggi
  sempre 1) da sostituire con `terraDi`, i testi del minatore e del capitano che annunciano la porta. Il parametro `livelloDellaTerra`
  c'è già nel generatore (stessa mappa e firma, fasce +14 a terra, tetto cinque terre). → [mondo-a-percorso.md](mondo-a-percorso.md),
  [mondo-a-percorso-lavori.md](mondo-a-percorso-lavori.md) (compito E).
- **Gli screen delle sette zone con i nemici** chiesti da Marco: ora c'è `scatta-app.mjs --tana <luogo>` (`--tana lista`); mancano le
  foto per zona e lo scontro all'aperto.
- **La torcia nel dungeon** (da indagare): nello screenshot di Marco, piano 3 di 3 della torre, con la torcia, si vede solo un cerchio
  di ~3 celle attorno all'eroe e un velo blu più in là. Il cono atteso con la torcia è 9,5 celle (`RAGGIO_TORCIA`, [luce.md](luce.md)):
  verificare se la torcia è accesa/carica (agli sgoccioli scende a 7), se il 3D la legge ancora dopo i cambi di `scena3d/` di questi
  giorni (inclinazione a 36°, eroe 3D), e se la luce a terra a 36° nasconde il cono. Sopra, nel mondo, la torcia non fa niente (è
  sempre giorno): decidere se deve servire (cerchio dei mostri più largo, niente agguati).
- **Il signore morto non si salva**: `stato.signoriMorti` non va nel salvataggio; di una zona lontana mai rivista il teschio nella
  veduta resta acceso. Le braci disegnate di una tana restano accese a signore morto.
- **Le quest**: restano le quest scritte a mano nelle zone, scorta ed eventi; cacciatrice e carovaniere come persone nuove; la X e il
  viandante non hanno un disegno 3D (sono segni sul prato); «vai alla pietra» dal diario; la freccia sulla strada vera e non in linea
  d'aria; tarare le basi delle taglie (`BASI`, tetto 40 gemme) e quanto guadagna chi le fa tutte.
- **I dungeon che si rigenerano** ([dungeon-che-si-rigenerano.md](dungeon-che-si-rigenerano.md)): la prima volta delle sette porte nel
  3D non usa ancora i livelli della zona (`STORIA_DALLA_ZONA` spento, 4/8/10/12 invece di 3/7/8/10); la cava (13) esce più tenera
  delle miniere (12); i nomi dei sei boss nuovi (Barbamuschio, Piumanera, Sibilla, Brontolava, Brinaldo, Falcenera) vanno confermati; i
  pezzi col nome dei boss non hanno ancora una figura ritagliata (puntano a un aspetto dei fogli già esistente).
- **Abitanti da dipingere**: orso, corvo, avvoltoio, brigante, lupo capobranco e gli altri; oggi sono specie del catalogo scelte per
  habitat ([mondo-aperto-mostri.md](mondo-aperto-mostri.md)).
- **La pergamena del portale** ([da-fare.md](da-fare.md)): sprite disegnato, casella nella barra, banco, abisso «dall'inizio del
  tratto».
- **Il villaggio**: le icone delle città (`ICONE_MONDO`) non le chiede nessuna schermata; la carta «riprendi» della home non mostra
  l'icona del 3D (`sotterraneo3d` non ha un manifesto con `ripresa()`).
- **Il vecchio mondo ad anelli è stato cancellato** ma qualche documento vecchio lo nomina ancora (`mondo-aperto-progetto.md`,
  `mondo-aperto-fasi.md`): va segnato «superato da mondo-a-percorso.md» in cima o riscritto.

### Bug noti

- **Il mercante a cui vendere non si trova più** (Marco, dopo il villaggio nuovo): il rigattiere sta nel fondo del villaggio a circa
  (14,5) di `dati/mondo-aperto.js`, dietro la piazza e accanto al capitano; da una telecamera dal sud può stare coperto da una casa o dalla
  tenda del minatore, e il bersaglio da toccare (72×96 px) potrebbe cadere sotto un altro. Da verificare con `scatta-app --gioco
  sotterraneo3d` (`data-vis`, `[data-mercante]`) e, se è nascosto, portarlo sul fronte della piazza o toccarlo anche dietro le case.
- **Rigattiere e armaiolo**: sono stati spostati dal ridisegno del villaggio: controllare che la bottega si apra ancora col dito vero
  (`sotterraneo-bottega-avanti` è instabile da prima).
- **Fumetto del portale**: `TypeError charAt` su `f.nome` mancante quando la sosta si svuota («torno giù»): corretto con `minuscolo`
  tollerante (21 ottobre); non riprodotto nel browser, solo dedotto dal file pubblicato. Se ricompare, incollare l'errore.
- **Test del browser lenti sotto carico**: `sotterraneo-mondo`, `-bacheca`, `-mostri-sopra`, `-mondo-meta` vanno in timeout con la macchina
  carica (load 40–90 con più agenti); da soli passano. Girarli uno o due alla volta (`--alla-volta=2`).
- **Rossi anche prima di questi giorni** (non nostri, da guardare): `sotterraneo-dettaglio`, `-barra`, `-bottega-avanti` (instabile),
  `-cura`, `-missioni` (la guardia con la missione «chiavi»), `integrazione/sotterraneo` (4 caselle nello zaino, ce ne sono 6),
  `misure/sotterraneo` (il fondo a 4/10).
- **`node_modules` condiviso svuotato** da un `npm ci` interrotto (21 ottobre, ripristinato copiando un'installazione): i worktree degli
  agenti lo collegano con un symlink al checkout principale; chi lancia `npm ci` lì rompe tutti.

### Taratura (dopo, a lavoro finito: Marco ha detto di non ritarare ora)

- Svenimenti per strada nel mondo a percorso, a 9/10 di risposte giuste: cantine 94%, tana dei ragni 25%, miniere 19%, sale allagate
  16% (bersaglio ≤ 10% e vita all'ingresso ≥ 60%); dalle tane 50–100%, fino a 56 domande. Leve: `cellePerBranco` per zona, la
  cintura di sicurezza fino alle cantine, i prati a 1–2 invece di 1–3, `SOPRA.fraBranchi` (ora 14), `SOPRA.dalloTana`.
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

### Decisioni aperte

- La torcia sopra serve a qualcosa? (cerchio dei mostri, agguati)
- Dopo l'ultima terra: si ripete a gradini fino a cinque terre o c'è un tetto prima? E il viaggio indietro dalla porta del villaggio.
- Il pannello dei genitori: cosa si può spegnere del 3D e delle terre.
- La riga di novità per i bambini sul mondo nuovo (non scritta: il sotterraneo 3D è in prova).

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
| Un elmo vero nello slot testa (oggi solo `#testa=<id>`) | Mostri | non iniziato |
| Mostri 3D senza modello proprio (ripiegano sullo sprite) | Mostri | da elencare |
| Costi in chiamate: scontro sul prato ~231, mondo con due branchi ~250 (soglia del test 260) | Mostri | tenere d'occhio |
| Peso e fluidità sul telefono (nessuna misura fatta) | Mostri | da guardare col dito |
| Prove del browser complete (`npm run test:browser`) e `test:misure` non lanciate dopo il 3D | Mostri | da fare prima del prossimo giro grande |

### Fatto il 21 ottobre

Eroi, mostri e mosse multiple in 3D, effetti 3D, camera bassa nello scontro, anteprime 3D di caselle, ritratto e fila dei turni.
Come si rifanno: `npm run promuovi3d` (`docs/sotterraneo/mostri-3d.md`, `mosse.md`, `anteprime-3d.md`).

## 3. Voci comuni

- Chi tocca `scena3d/mondo/` e `Mondo3d.vue` (mondo) e chi tocca `scena3d/` delle discese e `mostro3d.js` (mostri 3D) si avvisano al merge
  su `main`; regola per pubblicare: `git merge main` nel proprio ramo, `git merge --ff-only` su `main`, `./pubblica.sh` da un albero pulito.
- I mostri 3D nel mondo di sopra: tetto di 8 modelli (i più vicini all'eroe), gli altri sprite; se costa troppo sul Note 7 è la costante
  da abbassare.
- I file generati non si toccano a mano: `dati/icone-mondo.js` (`npm run scatti icone-mondo`), `scena3d/eroi3d|mostri3d|effetti3d/`
  (`npm run promuovi3d`), le emoji (`npm run emoji`; in un conflitto sulle emoji si rilancia il comando, non si fonde a mano).
