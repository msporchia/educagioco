# Piano: giocatori dinamici, Educagioco, pubblicazione

Deciso il 3 agosto 2026, **rivisto il 7 agosto**, non ancora iniziato. Questo
file esiste perché il lavoro è diviso in tappe che si faranno in giorni diversi:
qui c'è cosa si è deciso e soprattutto *perché*, così fra tre settimane non si
ricomincia a ragionare da capo.

Il motivo di tutto: il gioco lo useranno anche bambini che non sono i miei. Oggi
i due nomi sono cablati nel codice, e la domanda vera non è come toglierli — è
cosa succede ai progressi già dentro i telefoni quando si pubblica la versione
nuova.

**Il via è stato dato il 7 agosto**, ma il lavoro è fermo prima di T1 per la
questione aperta sull'export (vedi in fondo): finché non si sa se il salvataggio
è affidabile *sul telefono*, non ha senso costruirci sopra un travaso.

## Le decisioni

- **Gli id dei giocatori esistenti non cambiano.** Il roster introduce un id
  stabile, ma per i profili che già esistono l'id *è* il nome di adesso: le
  chiavi `profilo:<nome>` di prima non si toccano, non si copia un
  byte, non si cancella niente. Regalo compreso nel prezzo: se una build va
  storta e si ripubblica quella di ieri, quella ritrova le sue chiavi dov'erano.
- **Nessun nome dei bambini nel codice.** La migrazione non cerca nessun nome:
  enumera le chiavi che iniziano per `profilo:` e ricostruisce il roster da
  quelle. Serve aggiungere `chiavi()` a `store/storage.js`, che oggi non ce l'ha.
  Stessa cosa per l'import, che ricostruisce il roster dalle chiavi del file
  JSON. I nomi restano dove è giusto che stiano: dentro i telefoni. È anche la
  condizione perché il repo possa diventare pubblico.
- **Creare, rinominare ed eliminare un giocatore sta dietro il PIN**, in
  `GenitoriView`. Unica eccezione: a roster vuoto la domanda «come ti chiami?»
  arriva subito, senza PIN, altrimenti l'app appena installata è inutilizzabile.
- **Nello switch della home resta solo il nome**, niente avatar né emoji.
- **L'app si chiama Educagioco**, con un dado **disegnato a path**. L'icona di
  oggi non si vede sui telefoni perché è l'emoji 🎲 dentro un `<text>` SVG: il
  glifo non viene rasterizzato e resta solo lo sfondo sfumato.
- **La firma del backup non si tocca** (deciso il 3 agosto, poi cambiato l'8:
  vedi sotto). Era una stringa interna al JSON, e cambiarla avrebbe reso
  illeggibili i salvataggi già scaricati.
- **Si pubblica su GitHub Pages**, rendendo pubblico questo stesso repo. Il NAS
  viene dismesso, ma solo dopo che il travaso dei profili è stato verificato.
- **La storia di git si butta** (deciso il 7 agosto). Non si riscrive la storia
  con `git filter-repo`: si riparte da un commit solo, e si forza il push. È più
  semplice e più sicuro — con la riscrittura l'hostname del NAS resta comunque
  dentro i blob finché qualcuno non fa girare il garbage collector, e un
  `--replace-text` che manca una variante la lascia lì per sempre. Costo: si
  perdono i messaggi di commit, che qui sono cinque righe di `new version` e non
  valgono la spesa. Sparisce con questo anche la dipendenza da `git-filter-repo`,
  che non è installato.

## Quello che è stato verificato (non dedotto)

- **Il file HTML da solo funziona.** Aperto `giochi.html` da `file://` con
  Chrome: IndexedDB scrive, localStorage scrive, un profilo seminato sopravvive
  al reload. Come regalo di riserva per chi non ha connessione va benissimo; su
  telefono no, perché non si installa e non si aggiorna.
- **Non esiste nessun service worker.** Il riferimento a `dist/sw.js` in
  `pubblica.sh` è un ciclo che non copia niente. Quindi oggi non c'è offline
  vero, e non c'è nemmeno il rischio classico di una cache vecchia che serve
  codice vecchio a dati nuovi.
- **IndexedDB è legata all'origin, non al path.** Cambiare `name`, `id`,
  `start_url`, `scope` o spostare l'app da `/games/` **non perde niente**. Solo
  un cambio di *hostname* azzera tutto — ed è esattamente quello che succede
  passando dal NAS a GitHub Pages, da cui la necessità del travaso.
- **Tre sole chiavi in tutto lo storage**: `ultimo-giocatore` più i due
  profili. Superficie minima.
- **`storage.js` è importato solo da `profile.js`**: tutti gli altri `save(` in
  `src/` sono `ctx.save()` di canvas.
- **Il repo è privato, 0 fork, 0 star**: buttare la storia e forzare il push
  non rompe cloni di nessuno.

Aggiunte il **7 agosto**, misurate sul codice di oggi e non su quello di quattro
giorni fa:

- **La superficie dei nomi è di sette punti**, tutti fuori dai dati di gioco:
  `PLAYERS` (`store/profile.js:22`), la firma del backup (`:342`, **non si
  tocca**), il titolo in `index.html:6` e in `public/manifest.webmanifest:2`, il
  testo a schermo in `HomeView.vue:100` e `GenitoriView.vue:290`, e i due nomi
  usati come default negli helper (`test/aiuto/browser.mjs:57,77`). Più un
  commento in `store/pin.js:10`, innocuo.
- **Un ottavo punto che il 3 agosto non c'era**: `src/quiz/moduli/grammatica.js:372`
  ha due nomi di casa dentro `NOMI_PROPRI`, l'elenco per l'esercizio sulla
  maiuscola. Lì sono *contenuto*, in fila con Marco, Sara e Anna: si sostituiscono
  con altri due nomi e finisce lì. Vale la pena ricontrollare questo grep prima
  di pubblicare, perché è il tipo di posto in cui un nome rientra senza che
  nessuno se ne accorga.
- **I giochi nuovi non sono toccati dal roster.** Dungeon e Survivors tengono
  l'avanzamento in `profile.campagne[<chiave>]` come vuole `src/giochi/CONVENZIONE.md`,
  quindi non aggiungono né campi né migrazioni. La convenzione ha pagato: se
  fossero stati scritti come i giochi in `views/`, T1 sarebbe cresciuto di due
  campagne.
- **I file di integrazione sono 15, non 13** — nel frattempo sono arrivati
  `generale` e `codice-segreto`. T2 è più grosso di quanto diceva il piano.
- **`esportaTutto()` non perde niente**, provato e non dedotto: seminato un
  profilo pieno (quattro elementi SRS, tutte le campagne, `gen` con ordini e
  stelle, `campagne`, `storie`, animali, badge), fatto il giro vero dalla
  schermata dei genitori — PIN, *Salva su file*, download — e confrontato chiave
  per chiave con quello che sta su disco: **zero chiavi mancanti**, `items`
  integro, `gen` identico ordini e stelle compresi. Su desktop il salvataggio è
  fedele. Resta aperto cosa succede sul telefono: vedi in fondo.
- **Il test che copre il salvataggio guarda due campi in croce.**
  `test/integrazione/genitori.test.mjs:68-70` controlla `coins` e `totals.math` e
  nient'altro: né `items`, né le campagne, né i badge. Un buco proprio lì non
  sarebbe mai stato visto da nessuno, ed è il motivo per cui il dubbio su cosa
  contenga davvero un salvataggio non si poteva sciogliere leggendo i test.

## Il punto più delicato: il campo `v` è morto

```js
// src/store/profile.js, dentro selectPlayer()
const p = { ...vuoto, ...raw }
p.v = vuoto.v          // ← timbra la versione senza averla MAI letta
```

`v: 6` esiste dal principio ma non lo legge nessuno: non c'è un solo
`if (p.v < …)` in tutto `src/`. Ogni avvio riscrive il numero con quello
corrente, quindi **appena i telefoni aprono una build nuova, l'informazione «da
quale versione veniva questo profilo» è persa per sempre.**

Conseguenza pratica: una migrazione una-tantum va agganciata *prima* del
rilascio, mai dopo. Va fatto in T1 anche se il roster da solo non ne avrebbe
bisogno — è l'occasione, e non ne torna un'altra.

## Le tappe

| | Cosa | Chi | Dopo |
|---|---|---|---|
| T0 | Export dai telefoni + commit di partenza | Marco | — |
| T1 | ✅ **fatto** — roster, id stabili, gancio su `v` | agente | T0 |
| T2 | ~metà — helper fatti, restano i nomi finti nei test | agente | T1 |
| T3 | ✅ **fatto** — aggiungi/rinomina/elimina, CSS, i due bug | agente | T1 |
| T4 | ~metà — nome fatto, resta l'icona | agente | — |
| T5 | Service worker + deploy su Pages | — | T1-T4 |
| T6 | Repo pubblico, storia buttata, README | — | T5 |
| T7 | Travaso dei profili | Marco | T6 |
| T8 | Robustezza dello storage | — | **forse prima di tutto** |

**Attenzione all'ordine, dal 7 agosto**: T8 non è più in coda per forza. Se il
salvataggio dal telefono risulta incompleto (questione aperta, in fondo), diventa
la prima cosa da fare — perché è la rete di sicurezza di T0 e di T7, e un travaso
fatto su un backup bugiardo perde i progressi veri.

**E attenzione al working tree**: al 7 agosto ci sono due giochi in corso non
committati (dungeon, survivors) più i dati del castello. T1 tocca solo
`store/profile.js` e `store/storage.js`, che sono puliti, e può partire quando si
vuole. **T2 e T3 no**: `GenitoriView.vue`, `genitori.test.mjs` e
`generale.test.mjs` sono modificati in questo momento, e lavorarci sopra vuol
dire farlo senza rete. Prima di T2 va fatto il commit di quello che è in sospeso —
che è poi la seconda metà di T0.

**T0 — prima di ogni riga di codice.** Da tutti e due i telefoni: Genitori →
PIN → *Salva su file*, e i JSON si tengono da parte. Più un commit dei file in
sospeso, così il rollback è un `git revert` e non un lavoro di archeologia.

**T1 — il motore.** `PLAYERS` diventa `state.giocatori`, persistito nella chiave
`giocatori`. Migrazione: roster presente → si usa; assente ma esistono chiavi
`profilo:*` → si ricostruisce da quelle; niente di niente → stato «nessun
giocatore». `esportaTutto` e `importaTutto` smettono di ciclare su `PLAYERS`
(oggi un backup con giocatori sconosciuti verrebbe scartato in silenzio). Più
`chiavi()` in `storage.js` e il gancio su `v`. Test di unità sulla migrazione,
che per `profile.js` oggi non esistono affatto.

**T2 — i test.** Non sono «alcuni test da aggiustare»: tutti e 15 i file di
integrazione aprono una pagina con IndexedDB vuota, quindi l'onboarding li
bloccherebbe **tutti** al primo `waitForSelector('.carte')`, non solo quelli che
chiamano `azzera`. La soluzione sta negli helper — `azzera` e `semina` scrivono
roster e `ultimo-giocatore` *prima* del reload — non nei singoli test. Attenzione
a `.carte`, che esiste anche in `GenitoriView`: se l'onboarding riusasse quella
classe, cinque attese passerebbero **false** e i test fallirebbero più tardi, in
modo incomprensibile. Poi: riscrivere lo scenario «due profili separati» in
`app.test.mjs`, e aggiungere in `avvio.test.mjs` il caso del primo avvio
assoluto. I nomi di prova nei test diventano finti.

In più, deciso il 7 agosto: **allargare il controllo sul salvataggio** in
`genitori.test.mjs`, che oggi si ferma a `coins` e `totals.math`. Il giro
export → cancella → import deve tornare **identico** su `items`, sulle campagne,
su `gen.stelle` e sui badge — cioè su tutto quello che un genitore chiamerebbe
«i progressi». Non è un test in più fra tanti: è l'unico posto che dice se la
rete di sicurezza tiene, e va scritto comunque, qualunque cosa venga fuori dalla
questione aperta.

**T3 — l'interfaccia.** Onboarding a roster vuoto; aggiungi/rinomina/elimina
dietro il PIN; con un giocatore solo lo switch sparisce. Il CSS va corretto:
`.giocatori` è un flex senza `flex-wrap` né `max-width`, e oltre i due bottoni
di oggi sfonda in orizzontale invece di andare a capo. Titolo generato dal
roster, con la congiunzione giusta («A, B e C», non «A e B e C»). Due bug
minori da raccogliere mentre si è lì: il cartello di un traguardo resta a
schermo dopo il cambio giocatore (`Traguardo.vue` sta fuori dal `key` di
`App.vue`), e `settings.sound`/`music` stanno nel profilo ma non li legge
nessuno — l'audio è una variabile globale di modulo, quindi non segue il
giocatore.

**T4 — icona e nome.** Dado a path, PNG 192 e 512, variante maskable con il 20%
di margine, `apple-touch-icon` 180, favicon inline in `data:` URI perché si veda
anche aprendo il file singolo offline. I PNG si generano con Playwright, che è
già fra le dipendenze di sviluppo: nessuna dipendenza nuova, e il vincolo
dell'HTML unico resta intatto. Rinomina in `index.html`, manifest e home.
Indipendente da tutto il resto: può correre in parallelo.

**T5 — service worker e Pages.** Su GitHub Pages non si possono mandare header
propri: niente `Cache-Control: no-cache` come fa oggi nginx, si prende
`max-age=600`. Quindi il controllo dell'aggiornamento **deve** stare nel service
worker (cache-first con la versione nel nome della cache). È anche ciò che rende
l'app davvero installabile e giocabile offline. Il confronto di versione che fa
oggi l'ultima riga di `pubblica.sh` diventa uno step della action di deploy.

**T6 — repo pubblico.** Storia buttata e ripartenza da un commit solo, poi
force-push (deciso il 7 agosto; prima era `git filter-repo --replace-text`
sull'hostname, che avrebbe richiesto di installare lo strumento e avrebbe lasciato
il NAS dentro i blob irraggiungibili). L'hostname stava in `CLAUDE.md`, in questo
file e in `pubblica.sh`: tutti e tre ripuliti *prima* del commit di partenza,
perché dopo non c'è più una storia da correggere — e adesso `pubblica.sh` lo
legge da `.nas`, che git ignora. README con il taglio
giusto — *un gioco fatto per due bambini, non un esercizio di stile* — con gli
screenshot che ci sono già in radice e la nota che è stato scritto in gran parte
con Claude Code: dirlo chiude l'equivoco prima che si apra. Se ne vanno
`pubblica.sh` e `pubblico/`, che servivano solo al NAS, e i riferimenti al NAS
escono da `CLAUDE.md` e dai documenti.

**T7 — il travaso.** Export dai telefoni sul NAS, import sul dominio nuovo,
verifica che monete e traguardi siano al loro posto. **Il NAS resta acceso in
parallelo qualche settimana**: i dati vecchi restano nel loro origin finché
nessuno li cancella, quindi finché non si stacca la spina il passo è reversibile.

**T8 — robustezza dello storage.** Vedi sotto: diventa più importante quando il
gioco gira su telefoni che non conosciamo.

## Fatto l'8 agosto (T1, più i pezzi che non si potevano staccare)

Nel codice non c'è più il nome di nessun bambino: `git grep` non ne trova
uno. Le 37 prove passano, unità e browser.

- **Il roster.** `state.giocatori` è un elenco di `{ id, nome }` nella chiave
  `giocatori`. `chiavi()` è entrata in `storage.js` e unisce i tre livelli
  dell'archivio, perché un profilo che sta solo in localStorage esiste lo stesso.
  La migrazione enumera `profilo:*` e non cerca nessun nome; i profili di prima
  restano dove sono, con l'id uguale al nome di allora. Chi nasce da oggi ha un
  id opaco (`g1`), così rinominare non lascia in giro una chiave col nome vecchio.
- **Il gancio su `v`** è agganciato: `migraProfilo(p, da)` riceve la versione di
  provenienza letta *prima* che venga timbrata. Oggi non fa niente e lo dice.
- **La firma del backup è cambiata**, contro quanto diceva questo piano. Quella
  vecchia si portava dentro i due nomi di casa, come stringa scritta nel
  sorgente: in un repo pubblico avrebbe pubblicato quello che stiamo togliendo. Adesso si scrive una firma
  neutra e **in lettura si accetta qualunque file con la forma giusta** —
  controllo strutturale invece che sul nome. I salvataggi già scaricati si
  importano ancora: c'è un test che lo prova con una firma inventata.
- **Export e import non ciclano più su un elenco fisso.** L'export prende tutte
  le chiavi dell'archivio, orfani compresi; l'import ricostruisce il roster da
  quello che trova nel file, quindi un salvataggio di un'altra casa entra.
- **Onboarding minimo** (`components/Benvenuto.vue`): a roster vuoto chiede il
  nome, senza PIN. Era l'unico modo di non lasciare l'app rotta al primo avvio.
- **Il nome dell'app è Educagioco** in `index.html` e nel manifest: erano due
  righe con i nomi dentro, e aspettare T4 voleva dire lasciarcele.
- **Quattro cose trovate strada facendo**, che nessun test avrebbe preso:
  un `name` rimasto dopo la rinomina di un parametro — nel browser sarebbe
  passato liscio, salvando un `ultimo-giocatore` vuoto, perché `window.name`
  esiste; il roster salvato in ritardo di 350 ms, per cui chi chiudeva l'app
  appena scritto il nome se lo ritrovava chiesto di nuovo; `state.player`
  scritto a schermo in 17 punti, che a un iscritto di oggi avrebbe detto
  «Impostazioni di g2»; e `torri`/`app` che si costruivano la pagina a mano
  invece di passare dagli helper.
- **Il controllo sul salvataggio è allargato**, come previsto: ora il giro
  export → cancella → import verifica anche `items`, le campagne (vecchie e
  nuove) e i badge, non più solo le monete.

## Fatto l'8 agosto (T3)

La sezione **«Chi gioca»** in `GenitoriView`, dietro il PIN: elenco, aggiungi,
cambia nome, elimina con conferma. Più `rinominaGiocatore` ed `eliminaGiocatore`
nello store, con i loro test.

- **Rinominare non sposta niente**: cambia l'etichetta, la chiave del salvataggio
  resta dov'era. C'è un test che fallisce se un domani la rinomina copiasse i dati.
- **Eliminare cancella davvero**, voce e salvataggio; se si cancella chi sta
  giocando si passa a un altro, e se non resta nessuno si torna al primo avvio —
  che è la verità, non un caso da coprire inventando un giocatore.
- **Aggiungere non entra nel profilo nuovo** (`creaGiocatore(nome, entra)`).
  Scoperto provando: entrare cambia `state.player`, che è nella `key` di
  `App.vue`, quindi la schermata si rimontava e **ributtava il genitore al
  codice** a metà di quello che stava facendo. Al primo avvio invece entra, perché
  lì è l'unico che c'è. Per lo stesso motivo dalla sezione non si cambia
  giocatore: quello si fa dalla home, che è dove ha senso.
- **Il CSS della fila**: `flex-wrap`, e i nomi lunghi si troncano invece di
  sfondare. Con due nomi cablati bastava una fila.
- **I due bug minori sono chiusi.** Il cartello del traguardo aveva la stessa
  `key` della schermata e non spariva più cambiando bambino: faceva i complimenti
  a quello sbagliato. E `settings.sound` non lo leggeva nessuno — l'audio era una
  variabile globale riaccesa a ogni avvio, quindi il muto non sopravviveva alla
  chiusura e spegnerlo per uno lo spegneva per tutti; adesso passa da
  `accendiSuono()` e sta nel profilo.

**Cosa resta.** T2: i test usano `uno`/`due` come id di prova, il che va bene, ma
vanno riguardati i file che erano aperti sul banco (`generale`). T4: l'icona a
dado. T5: service worker e deploy. T6: repo pubblico — e lì ricordarsi che
`giochi.html` e `pubblico/index.html` sono **tracciati** e hanno ancora i nomi
dentro: vanno rigenerati con `./pubblica.sh` prima del commit di partenza.

**Una cosa da sapere prima di rilasciare**: `integrazione/torri-equilibrio` è
instabile di suo. La tappa 15 si decide sull'ultima ondata e ogni tanto si perde
per un soffio — visto una volta su tre esecuzioni, e non c'entra col roster.

## La questione aperta (7 agosto): il salvataggio dal telefono

Marco ha detto che il salvataggio «non salva metà delle cose» — in particolare
non ci troverebbe a che livello sono arrivati né con quali esercizi hanno
problemi. Provato su desktop, **l'export è completo** (vedi sopra). Restano due
spiegazioni, e portano in due posti opposti.

**Se il file è giusto ma non sembra.** Quelle due cose nel JSON non si
riconoscono a occhio, ed è normale che non si trovino cercandole:

- **il livello non è un campo e non deve esserlo.** È derivato: `livelloTotale()`
  in `store/progressi.js` lo ricalcola dai `totals` a ogni avvio. Nel file non
  c'è nessun `livello: 7`, e reimportando torna da sé.
- **«con quali esercizi hanno problemi» è `items`**, scritto in SRS:
  `"en:butterfly": {r:1, w:3}` vuol dire una giusta e tre sbagliate, cioè
  esattamente quello — ma bisogna sapere cosa vogliono dire `r`, `w`, `ef` e
  `due`. Se serve, la risposta è una schermata che lo legge, non un export
  diverso.

**Se il file è davvero scarno**, allora è il timeout di 2,5 s in `openDb()` —
cioè T8 — e cambia l'ordine di tutto. Su un telefono lento IndexedDB non risponde
in tempo, l'app riparte su localStorage con un profilo vecchio o vuoto, e
`esportaTutto()` salva fedelmente **quel** profilo: un backup che sembra a posto
e non lo è. Non si riproduce su desktop, dove IndexedDB risponde in millisecondi.

**Come si scioglie**: guardare il JSON scaricato dal telefono. Qualche decina di
KB con `items` pieno → primo caso, nessun bug. Un paio di KB → secondo caso, e
T8 diventa la prima tappa, prima di T1. Finché non si sa, T0 non è una rete di
sicurezza e il travaso di T7 non si può programmare.

## Rischi noti, da non dimenticare

- **Il timeout di 2,5 s in `openDb()`** (`store/storage.js`). Su un telefono
  lento IndexedDB non risponde in tempo, `dbPromise` resta memoizzata su `null`
  per tutta la vita della pagina, l'app **riparte con un profilo vuoto** e gioca
  su localStorage. I dati veri non vengono sovrascritti, ma al riavvio `load()`
  legge IndexedDB per prima e ignora quella copia: la sessione appena giocata
  sembra sparita. È l'unico scenario realistico di progressi persi senza che
  nessuno abbia cancellato niente, e non c'è nessun avviso a schermo. Questo è T8.
- **Rinominare un id in `src/data/`** (`en:dog`, `math:7x8`, `frase:…`) orfanizza
  lo stato SRS: la parola torna «mai vista». Le campagne sono protette da
  `Math.max` e i badge non si perdono, ma stelle e conteggi regrediscono, e il
  bambino se ne accorge. **In questo rilascio non si tocca nessun id.**
- **`VERSION` in `storage.js` non va mai abbassata**: `indexedDB.open`
  fallirebbe e il ripiego su localStorage diventerebbe permanente e silenzioso.
- **Le voci incise con edge-tts** parlano con l'endpoint di lettura di Microsoft
  Edge, fuori dai termini previsti; su un repo pubblico la cosa diventa visibile
  invece che domestica. Nella pratica non succede niente a nessuno, ma è una
  decisione da prendere con gli occhi aperti. Alternativa pulita, se mai
  servisse: reincidere tutto con Piper, modelli a licenza libera che girano in
  locale. Non adesso.
- **La documentazione dell'infrastruttura di casa è stantia**: dà per «da fare»
  l'export/import che è già fatto, e adesso anche il service worker esiste
  davvero. Sta fuori da questo repo ed è giusto che ci resti.

## Cosa non fare

- Non toccare gli id dei contenuti (vedi sopra).
- ~~Non cambiare la firma del backup.~~ Cambiata l'8 agosto: conteneva due nomi
  di casa e stava in un sorgente che sta per diventare pubblico. Il controllo in
  lettura adesso guarda la *forma* del file, non la firma, quindi i salvataggi
  vecchi si aprono ancora.
- Non spegnere il NAS prima che il travaso sia verificato su entrambi i telefoni.
- Non far entrare i nomi dei bambini nel codice: se una tappa sembra chiederlo,
  la soluzione è enumerare le chiavi, non scrivere la stringa.
- **Non trattare i JSON di T0 come una rete di sicurezza finché uno di quei file,
  scaricato da un telefono vero, non è stato guardato dentro.** Un backup di cui
  non si è verificato il contenuto vale zero proprio nel momento in cui servirebbe.
