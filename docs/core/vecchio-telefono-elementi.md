# Chi pesa, un elemento alla volta

La misura coi modelli veri ([vecchio-telefono-veri.md](vecchio-telefono-veri.md)) parte da scene già sopra i 33 ms sul Redmi Note 7:
dice «troppo», non **chi**. Questa prova smonta ogni scena grande nei suoi elementi (pavimento, muri, luci, nebbia, mostri…) e ne
misura uno alla volta, così ogni riga ha un costo e la sua semplificazione pronta. I ms veri li dà il telefono; sul computer si guarda
solo che giri e che chiamate, triangoli e shader per elemento abbiano senso.

## Sul telefono

Zona dei grandi → Impostazioni → Avanzate → Misura questo telefono → **Chi pesa**. Un quarto d'ora circa; il resoconto si manda
come gli altri (al ricevitore da solo se la pagina viene da `strumenti/ricevi-log.mjs`, se no «Manda» a pezzi o «Copia»), e
l'ultimo resta («L'ultima «chi pesa»», `store/benchmark.js` chiave `elementi`).

Sul computer imitato: `node strumenti/vecchio-telefono.mjs benchmark --veri --solo elementi` (o `--solo elementi-sot` per una scena).
I ms del computer non valgono (carico, SwiftShader): conta la struttura.

## Le scene e le misure

Per ogni scena (`grafica/benchmark/veri/elementi-dati.js`, `SCENE_ELEMENTI`) tre gruppi, ognuno col suo riferimento del calore e la
pausa prima (così il calore si rimisura a metà):

| gruppo | scene | cosa |
|---|---|---|
| `elementi-<scena>` | `el-<scena>:0`, le basi `:b0`…, `+k` | tutto spento (il giro del gioco senza disegnare: il fondo del JS), poi un elemento acceso alla volta. Le luci e i ritocchi da soli non costano niente (non hanno niente da illuminare): si misurano sopra una base (`sopra`), misurata anche lei |
| `elementi-<scena>-togli` | `:tutto`, `-k` | la scena intera, poi un elemento tolto alla volta |
| `elementi-<scena>-leve` | `:com-era`, `:semplice` | la scena intera com'è, e con le leve semplici (`&spegni=ombre,rilievo,nebbiaFitta,quantaPolvere:0.4`) |

Scene di ~4 s dopo un rodaggio di 1,5-3,5 s (`TEMPI.elementi` in `veri.js`). La prova gira nella fascia del telefono; le leve
sono ancora fuori dalla fascia bassa, quindi «com'è» è il gioco di oggi.

- **sot**: lo scontro delle discese con 1 mostro e gli effetti a ripetizione (`veri/elementi-sot.js`, la discesa di `veri/discese.js`).
  Elementi: pavimento (e l'acqua per terra), pareteLontana (i muri alti), pareteVicina (i parapetti davanti), colonne (e staffe),
  arredo (arredo3d, botti, relitti, fontana, portali, raggi), fiamme, torcia (alone, cono, rimbalzo), fuochi, lampo (lampo e magia),
  palco, nebbia, particelle (polvere e scintille), effetti3d, chiarori (aloni, colonne di luce, anelli), figure (l'atlante), eroe,
  mostri, resto (l'emisferica e quello senza nome), e gli speciali ombra (del cono), normali (le normal map), post. Base delle luci:
  pavimento, pareti e colonne; dell'ombra e delle normal map, la stessa con la torcia.
- **sopra**: il villaggio della prima terra dalla partenza, con 4 persone e 3 mostri finti (`veri/elementi-sopra.js`). Elementi:
  terreno (pezzi, fuori, lontano, campi, piazza), mare, natura, case (tutto il resto dei pezzi), cielo, sole (la luce), velo (la
  nebbia dell'esplorazione), vita, scia, persone, eroe, mostri, resto, e gli speciali ombra (del sole), normali, foschia (la nebbia
  di three). Base: il terreno (l'ombra: terreno, case e sole).

Mancano ancora la Fattoria 3D e gli Asteroidi 3D: [vecchio-telefono-veri.md](vecchio-telefono-veri.md), «Dove eravamo rimasti».

## Come si spegne un elemento

`grafica/elementi3d.js`: ogni cosa porta il nome del suo elemento in `userData.elemento3d` (`segna`, `segnaNuovi` attorno a chi la
crea; i figli lo ereditano; `elemento` no: il gioco lo usa già, è l'elemento di un'arma), e una mesh a più materiali il nome di ogni
materiale (`userData.elementiMateriali`, i muri). A ogni fotogramma `creaElementi` spegne quelli spenti in `ACCESI`: sullo strato 31
(né la telecamera né l'ombra lo guardano; la `visible` del gioco non si tocca) o il materiale invisibile; tutto acceso non tocca
niente. Quello senza nome in cima è il `resto`: nel «tutto spento» le chiamate devono essere 0 (la prova del browser lo controlla).
A mano: `#…&spegni=pavimento,pareteVicina` nelle discese, `&spegni=case,natura` di sopra (`docs/core/comandi.md`).

## Il resoconto

In fondo al corpo, **CHI PESA**: per scena il tutto spento e la scena intera, poi una riga per elemento dalla più cara:
`pavimento: +12 (js +0.5 gpu +11.5) da solo, +1ch +3kt +2sh / -10 tolto (js -0.2 gpu -9.8)`. «Da solo» è la differenza dalla sua
base, «tolto» dalla scena intera; i ms sono tolto il calore. Nella **LETTURA**: `CHI PESA nel …` (i cinque più cari, se il costo è
della GPU o del JS, il fondo, e se i soli sommano molto meno della scena: il resto sta negli incroci, luci per ogni superficie),
`SEMPLIFICARE` (la semplificazione di ognuno dei cinque, `SEMPLICE` in `elementi-dati.js`), `LEVE` (quanto tolgono le leve).
Le scene `el-…` stanno nella riga DATI come le altre.

## Le leve semplici (proposte per la fascia bassa)

Pezzi di `ACCESI` (`scena3d/costanti.js`): spenti, la versione semplice. Non sono ancora in `SPEGNI_BASSA` (`store/qualita.js`): si
mettono dopo gli scatti prima/dopo e il sì di Marco; intanto la prova le confronta (`:com-era` contro `:semplice`).

| leva | cosa | perché |
|---|---|---|
| `ombre` (c'era) | niente ombra del cono né del sole | l'ombra ridisegna ogni muro, colonna e modello una volta in più, e ogni pixel illuminato legge la mappa |
| `rilievo` | pavimento, pareti, colonne, terreno, piazza e campi di sopra senza normal map né ruvidezza | due trame in più per pixel e la base tangente; il pavimento copre metà schermo |
| `nebbiaFitta` | una fetta di nebbia sola, con la densità delle fette che sostituisce (`creaNebbia(…, forza)`) | ogni fetta è un piano a tutto schermo col rumore e le otto luci a mano, in somma |
| `quantaPolvere:0,4` | due granelli su cinque | punti additivi che sommano le luci uno per uno |

## Cause probabili (dal codice) e cosa si farebbe

- **Pavimento**: una geometria sola (2 triangoli per cella), MeshStandard con mappa, normal map e ruvidezza, il rumore per le macchie
  e le pozze e la maschera della vista; e ogni luce della scena per ogni pixel. Leva `rilievo`; poi colore per vertice e trama cotta
  (una lettura sola), o Lambert.
- **Pareti**: una geometria con facce a griglia spostate dal rumore (stili roccia: centinaia di facce per cella), quattro materiali con
  normal map e un vertex shader che legge l'altezza da una trama. `rilievo`; poi lo stile «lastroni» nella bassa.
- **Luci (torcia, fuochi, lampo, palco)**: three le somma tutte in ogni frammento di ogni materiale Standard, anche spente (sul Redmi
  da 6 a 12 fuochi +124 ms). La bassa ne ha già meno (`fuochi:2`, `lampi`, `palco`); oltre: un fuoco, o luci cotte nel colore.
- **Ombra del cono**: un passaggio in più con tutti i muri e i modelli, e la lettura della mappa per pixel. `ombre`.
- **Nebbia**: fette additive a tutto schermo col rumore (ottave) e le luci a mano. `nebbiaFitta`, poi via.
- **Particelle ed effetti**: punti additivi grandi (overdraw), effetti 3D a più mesh trasparenti. `quantaPolvere`; poi effetti con
  meno particelle e sprite piatti.
- **Mostri ed eroe**: chiamate (35 per mostro prima della saldatura): l'altro lavoro (`salda3d.js`, la pelle).
- **Terreno di sopra**: quattro trame del suolo lette per pixel più il rumore e la normal map della roccia. `rilievo`; poi una trama.
- **Ombra del sole** (2048) sul mondo: ridisegna case e alberi. `ombre`.

## Il tetto di tempo e il lettore (tutte le prove coi modelli veri)

Una scena finiva solo quando arrivavano fotogrammi: se il telefono non ne dava più, o una preparazione non tornava, la prova restava
ferma senza dirlo (il Note 7 il 23/10 alla scena 50 di 138, «base sole,terreno» del mondo di sopra). Adesso (`veri.js`, `TETTO`,
`conTetto`): ogni scena ha un tetto (le due fasi a `fine` più 15 s: ~39 s per le scene di «Chi pesa»), il caricamento di un gruppo
30 s, una scena che si misura da sé (l'ingresso) 150 s, il riferimento del calore la pausa più 45 s. Scaduto, la scena è «non regge:
tempo scaduto (… oltre N s)», il gruppo si butta e si rifà da capo per la scena dopo, e la prova va avanti; una preparazione che
arriva dopo il tetto si butta appena arriva. Il tetto non può niente se la pagina intera è ferma (un fotogramma che non torna dalla GPU
blocca anche i timer): per questo c'è il lettore.

**Il lettore**, in alto a sinistra mentre una prova gira (`Benchmark.vue`): gli fps dell'ultimo mezzo secondo (un requestAnimationFrame
suo, come `ContaFps.vue`) e i secondi nella scena di adesso, anche nelle pause e nelle attese; lo stesso nel riquadro in basso
(«scena 50 di 138 · …», «sono 7 s in questa scena · 30 fps»). Se i fotogrammi non arrivano per 5 s scrive «il telefono non risponde»;
se si ferma tutta la pagina lo scrive il CSS, perché il battito che ogni mezzo secondo rimette la scritta invisibile non arriva più
(l'opacità la anima il compositore). Nei test: `[data-benchmark-lettore]`, `[data-benchmark-secondi]`, `[data-benchmark-muto]`;
`unita/benchmark-tetto` (una scena che non finisce, un gruppo che non si carica).

## Il codice e le prove

`grafica/elementi3d.js`; `grafica/benchmark/veri/elementi-dati.js` (le scene, `LEVE`, `SEMPLICE`, `sceneDegliElementi`,
`tappeDegliElementi`), `elementi-sot.js`, `elementi-sopra.js` (`mettiElementi`); `TAPPE_ELEMENTI` in `veri.js` (solo se `solo` li
chiede: per id o per gruppo); `grafica/benchmark/log-elementi.js` (`righeElementi`, `tabellaElementi`, `letturaElementi`).
Nei test: `[data-azione="benchmark-elementi"]`, `[data-azione="benchmark-ultima"][data-tipo="elementi"]`. `unita/elementi-3d`,
`unita/benchmark-elementi`, `integrazione/benchmark-elementi` (qualche scena per scena, corte: il tutto spento a 0 chiamate).
