/* ═══════════════════════════════════════════════════════════════════
   DIFENDI IL CASTELLO — i conti che tengono in piedi le tappe.

   Qui non c'è più nemmeno una tappa scritta a mano. Il racconto — nome,
   percorso, mostri, torri, fin dove arriva la scaletta delle operazioni —
   sta in `data/campagne-castello.js`; questo file ci mette sopra i
   numeri, e i numeri escono tutti da **una promessa sola**:

     una tappa costa il numero di calcoli che promette.

   `calcoli` è il primo dato della tappa e non è una misura: è il
   bersaglio. Sei operazioni in colonna per la prima, trenta per
   l'ultima, un calcolo per acquisto — una torre costruita o un gradino
   salito. Da lì si derivano ondate, energia e postazioni.

   ── perché era rovesciato, e perché adesso non lo è più ──

   Prima il numero di calcoli era un *effetto*. Le postazioni si
   sceglievano perché l'energia si spendesse tutta (`RESPIRO_SPESA`),
   quindi più energia entrava, più c'era da comprare, più conti da fare:
   ne uscivano da ventuno a cinquantadue operazioni per tappa. Il
   modello era coerente e il risultato era un compito. Il numero di
   calcoli che un bambino fa in una partita non è un dettaglio da
   lasciare in fondo alla catena: è **la cosa che il gioco fa davvero**,
   e va decisa per prima.

   Adesso la catena va nell'altro verso, e ha quattro anelli:

     `pianoDi`      la lista dei `calcoli` acquisti che fa chi gioca
                    bene, e quanto costa in tutto
     `ondateDi`     quante ondate servono perché le entrate paghino
                    quel piano — tutto tranne le due torri di partenza
     `partenzaDi`   quello che le ondate non arrivano a pagare, messo
                    in mano all'inizio
     `postiDi`      quante piazzole: quelle che il piano occupa, più
                    una di respiro, e mai meno delle torri che la tappa
                    offre

   Il conto torna per costruzione: energia in entrata = costo del piano,
   quindi chi gioca bene fa esattamente `calcoli` acquisti e finisce con
   le tasche vuote. La promessa di prima — «l'energia si spende tutta» —
   non è stata tolta, è diventata una conseguenza invece di un vincolo.

   Quanto sono duri i nemici resta l'unica cosa che non si deduce: la
   trova `npm run tara` giocando ogni tappa migliaia di volte con il
   motore vero, e finisce in `taratura-castello.js`.

   ── il carattere delle torri, e i prezzi ──

   Le quattro torri **non valgono lo stesso e non costano lo stesso**.
   Prima costavano uguale, e misurate col motore vero
   (`npm run dps`) le bombe di livello alto valevano otto arcieri e il
   napalm tredici: la regola del gioco era «costruisci bombe», e chi
   giocava lo aveva capito prima di chi l'aveva scritto.

   Adesso ogni torre ha un **listino** (`CARATTERE.prezzo`): tutto
   quello che la riguarda — costruirla e farla salire — costa il prezzo
   base per quel numero. Le torri più avanti nella scuola (la magica
   con la sottrazione, le bombe con la divisione) sono **più forti e più
   care già alla prima pietra**; l'arciere è quello debole che costa
   poco. Un arciere costa 24, una bomba 56: con quello che costa una
   bomba si fanno due arcieri, o un arciere portato al livello tre — e
   sono tre scelte che si pesano, non una giusta e due sbagliate.

   ── la regola ──
   **Quanto rende un ⚡ speso** — la vita che la torre ferma diviso quello
   che è costata — è lo stesso per tutte, a parità di livello, a meno di
   un premio per chi arriva dopo nella scuola (`CARATTERE.resa`):

     🏹 arciere    listino 0,6   resa 1      la torre di partenza
     ❄️ ghiaccio   listino 0,5   resa 1      non ferisce: aiuta chi ferisce
     🔮 magica     listino 1     resa 1,1    a zona, e la magia
     💣 bombe      listino 1,4   resa 1,2    la più cara e la più forte

   Il premio c'è perché le torri avanzate arrivano dopo — nella scuola e
   nella partita — e costano di più: se rendessero esattamente come
   l'arciere, con meno torri in campo sarebbero solo più scomode. Ma è
   un dieci-venti per cento e non un per otto: con le immunità (vedi
   `data/mostri.js`) nessuna torre, da sola, vince una tappa.

   **Quanto rende** lo stima `dpsDi`, e lo **misura** `npm run dps` col
   motore vero: il danno al secondo di una torre ad area conta tutti
   quelli che prende — in genere due o tre per colpo, e `BERSAGLI` dice
   quanti, misurato — quindi il suo colpo singolo è più debole di quello
   dell'arciere a parità di prezzo, ed è giusto: lo stesso danno spalmato
   su un gruppo. Il cecchino fa pochi colpi forti e la raffica tanti
   deboli, ma il danno al secondo è lo stesso.

   ── e la promessa dei calcoli ──
   Un acquisto resta un calcolo, qualunque cosa compri. Con prezzi
   diversi, «energia totale ÷ costo medio di un acquisto» dipende da
   **cosa** si compra, quindi il modello non usa più un prezzo medio: il
   piano (`pianoDi`) sa **che torre** costruisce il giocatore modello a
   ogni passo (`sequenzaTorri`) e quanto costa, e le ondate si contano
   su quello. Chi compra solo bombe fa meno calcoli e più difficili
   (sono divisioni); chi compra solo arcieri ne fa di più e più facili.
   È una scelta anche questa, e sta dentro la stessa tappa.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from './ops.js'
import { MOSTRI, ABILITA, CAPO, feritoDa, firmaImmunita, guastiDelleImmunita, mostroDiOnda }
  from './mostri.js'
import { RACCONTO, LIBERE_RACCONTO } from './campagne-castello.js'
import { VITE, FIRMA, OLTRE } from './taratura-castello.js'

export const CFG = {
  cuori: 5,
  nemiciBase: 4, nemiciPiu: 3,     // quanti nemici ha l'ondata numero o
  vitaBase: 42, vitaPiu: 0.38,     // quanto è robusto ciascuno
  velBase: 26, velPiu: 1.6,
  respiro: 1,

  /* ── l'economia ──
     Questi sono i prezzi **base**: ogni torre li moltiplica per il suo
     listino (`CARATTERE`), quindi un arciere nuovo costa 24 e una bomba
     56. La scala dei potenziamenti è quasi piatta: salire costa più o
     meno quanto costruire la stessa torre.

     A rincarare è invece **allargarsi**: la prima torre 40, la seconda
     60, la terza 80 (per il listino). È lì che sta la lezione del gioco.
     Salire di un gradino rende il 60% in più di potenza; se costruire
     costasse poco più che potenziare, riempire il campo di torri di
     livello 1 sarebbe la mossa migliore — l'abbiamo misurato, e lo era —
     e la matematica difficile diventerebbe una tassa invece che la
     scelta furba. */
  costruzione: 40, costruzionePiu: 20,
  potenziamento: 36, potenziamentoPiu: 2,
  perNemico: 2,                    // energia per ogni nemico fermato
  fineOnda: 4, ondataPulita: 6,    // premio di fine ondata, doppio se non passa nessuno
  /* ── la fretta ──
     La prossima ondata si può chiamare prima del tempo — anche con la
     precedente ancora in campo, come in Kingdom Rush — e chi lo fa è
     pagato per **il tempo che risparmia**: `perSecondo` ⚡ per ogni
     secondo in meno di attesa e di cammino dei mostri che sono ancora
     in giro, fino a `tetto` (`premioDellaFretta`).

     Il premio è piccolo di proposito, e **il modello non lo conta**:
     le ondate e l'energia di partenza sono tarate su chi si prende il
     suo tempo, e la fretta è un cuscinetto in più per chi rischia —
     due ondate in campo insieme sono più dure di una alla volta. In
     tutta la tappa più lunga, chi chiama sempre al primo istante si
     porta a casa al più **due acquisti** in più: `unita/castello` lo
     conta. Se valesse di più diventerebbe un obbligo, e il modello
     delle tappe non racconterebbe più la partita di nessuno. */
  fretta: { perSecondo: 0.12, tetto: 6 },
  /* Dopo tanto starsene fermi l'ondata parte da sola — il conto scorre solo a
     mani ferme, mai mentre si calcola. All'inizio la corda è lunga: chi sta
     imparando dove si tocca merita di guardarsi intorno. Si accorcia tappa
     dopo tappa, fino a diventare un ritmo vero. */
  attesaLarga: 45, attesaStretta: 20,
  /* Gli errori si pagano in energia, mai in vite — e adesso che i calcoli
     sono pochi la penale è leggera per forza: con sei operazioni in tutta
     la prima tappa, un errore che costasse un acquisto vorrebbe dire
     perdere un sesto della difesa per un riporto. Sei punti sono un sesto
     di gradino: si sente, non si paga per tutta la partita. */
  malusErrore: 6,
  /* ── spostare una torre ──
     Costa poco ma costa: due punti, quanto un nemico fermato. Finché
     c'era una strada sola era giusto che fosse gratis — spostare voleva
     dire spostarsi lungo la stessa fila di mostri. Con due ingressi è
     un'altra cosa: portare il ghiaccio dalla parte da cui scenderanno
     è **la** mossa, e una mossa che vince non si fa a costo zero. Due
     punti non fermano nessuno: fanno pensare un secondo prima di
     trascinare, che è tutto quello che devono fare. */
  spostamento: 2,
  perMoneta: 5,                    // partita libera: monete ogni N ondate
}

/* ═══════════ la geometria del campo ═══════════

   Dove nascono le piazzole e in che ordine si occupano. Sta **qui**, nei
   dati, e non in `motore/castello/percorso.js` che la usa, per due
   ragioni.

   La prima è la direzione delle dipendenze: `data/` non importa da
   `motore/`, mai. È il motore che chiede ai dati — fa già così per `CFG`,
   `tiroDi`, `vitaNemico` — e mettere qui la geometria non aggiunge un
   legame, usa quello che c'è.

   La seconda è che questa roba **è equilibrio travestito da disegno**, e
   ce l'ha appena dimostrato. Le postazioni si occupavano partendo dal
   castello: con due o tre torri comprate finivano tutte davanti alla
   porta, e il mostro faceva l'85% della strada senza prendere un colpo.
   Spostare l'ordine ha cambiato tutte le vite tarate — e non se n'è
   accorto nessuno, perché `firmaEquilibrio()` guardava prezzi e torri ma
   non il campo su cui si combatte. Adesso le guarda: tre di questi
   quattro numeri sono dati, e cambiarli fa scattare il test da solo.

   ⚠ `v` è il quarto, ed è l'unico che va mosso a mano: copre il
   **codice** di `piazzole()`, che i dati non possono descrivere — il
   passo con cui le postazioni si distribuiscono, il lato alternato, il
   modo in cui si rientra dai bordi. **Chi tocca quella funzione
   incrementa questo numero**, altrimenti ha rimesso esattamente il buco
   che c'era, e la prossima taratura sarà fatta per un campo che non
   esiste più. */
export const GEOMETRIA = {
  v: 7,                  // ↑ di uno a ogni modifica di `piazzole()`
  dallIngresso: true,    // le piazzole si occupano da dove entrano i mostri
  scostamento: 34,       // quanto stanno staccate dal ciglio della strada
  margine: 22,           // e quanto restano lontane dal bordo del campo
}

/* ═══════════ quanto è grande il campo ═══════════

   Un numero solo, uguale su ogni schermo, ed è una promessa: **la
   battaglia è la stessa sul telefono e sul computer**.

   Prima non lo era. Il campo prendeva le misure dal riquadro che si
   trovava — 390×420 su un telefono, 520×420 su un monitor — e i
   percorsi, che sono in coordinate 0–1, ci si stiravano dentro. Ma il
   raggio di una torre non si stira: è in unità. Su un campo più largo
   la stessa strada diventava più lunga a parità di raggio, i mostri
   passavano nei buchi, e l'unico rimedio era tappare la larghezza a
   520px con un `max-width` — un cerotto che si portava dietro la sua
   riga di commento e il suo `npm run simula` a dimostrarlo.

   Adesso il mondo è questo, sempre, e a piegarsi è lo schermo: la
   telecamera in `grafica/tela.js` lo incornicia dove c'è posto. Su un
   telefono ci sta giusto, su un computer resta un margine ai lati, e
   in tutti e due i casi le torri battono la stessa strada.

   Verticale, perché il gioco è verticale: i mostri entrano dall'alto e
   scendono verso il castello, che sta in basso — vicino al pollice,
   dove si difende.

   ── perché la scala è dichiarata, e perché vale 1,3 ──
   `S` dice quanti pixel del mondo vale un'unità di disegno, ed è la
   misura in cui sono scritti i raggi delle torri, le piazzole e le
   velocità. Prima usciva da una formula (`min(W,H)/420`) e cambiava con
   lo schermo; adesso è un numero, perché **è equilibrio**: un campo
   grande con torri che vedono poco è un campo dove i mostri passano.

   1,3 non è scelto a occhio. Il campo di prima misurava 390×420 pixel
   con S=0,93, cioè **419×451 unità**; questo ne misura 420×760 con
   S=1,3, cioè **323×585 unità**. Stessa area — 189.000 unità quadre in
   tutti e due i casi — in una forma diversa: più stretto e più alto. È
   la stessa quantità di gioco, girata in verticale, ed è per questo che
   le fasce del validatore (`strumenti/valida-percorsi.mjs`) sono
   rimaste quelle di prima: le strade misurano ancora fra i 600 e i 1000
   unità, e una torre ne presidia ancora due raggi scarsi. */
export const MONDO = { W: 420, H: 760, S: 1.3 }

/* ═══════════ il carattere di ogni torre ═══════════

   `prezzo` è il listino: moltiplica tutto quello che quella torre costa,
   costruirla e farla salire. `resa` è quanto rende un ⚡ speso lì,
   rispetto all'arciere, a parità di livello: la regola è in testa al
   file. Si legge per aspetto, come le immunità — l'operazione che compra
   una torre può cambiare, il suo mestiere no. */
export const CARATTERE = {
  arciere:  { prezzo: 0.6, resa: 1.0 },
  ghiaccio: { prezzo: 0.5, resa: 1.0 },
  magica:   { prezzo: 1.0, resa: 1.1 },
  bombe:    { prezzo: 1.4, resa: 1.2 },
}
const carattereDi = k => CARATTERE[TORRI[k]?.aspetto] || { prezzo: 1, resa: 1 }
/* il listino di una torre; senza torre, il prezzo base */
export const listinoDi = k => (k ? carattereDi(k).prezzo : 1)
export const resaDi = k => carattereDi(k).resa

/* ── come cresce una torre quando sale di livello ──

   Non tutte allo stesso modo, ed è il punto. Ognuna cresce nel suo
   mestiere:

     arciere   spara sempre più spesso — a fine scaletta tira una freccia
               ogni 0,3 secondi invece che ogni 0,62: è una raffica
     magica    allarga l'onda: colpisce gruppi sempre più grossi
     bombe     il colpo più forte, e dal settimo livello ne lancia due per
               volta — ma **due più piccole** (`perSalva`): prima la salva
               doppia raddoppiava il danno da un gradino all'altro, ed era
               metà del motivo per cui le bombe valevano otto arcieri
     ghiaccio  non fa danno: cresce nel gelo, vedi `geloDi`

   Quanto crescono non è più a occhio: tutte e tre le torri che feriscono
   devono salire **con la stessa pendenza** — un livello 7 vale rispetto
   al suo livello 1 quanto vale l'arciere — se no il listino direbbe una
   cosa al primo gradino e un'altra al decimo. Lo controlla
   `unita/rami-castello` con la stima, e `npm run dps` col motore.
   I numeri qui sotto li usa sia il gioco sia il modello che tara le
   tappe: non esiste un secondo posto dove sono scritti. */
export const CRESCITA = {
  arciere:  { danno: 0.45, cadenza: 0.12,  area: 0 },
  magica:   { danno: 0.62, cadenza: 0,     area: 0.08 },
  ghiaccio: { danno: 0,    cadenza: 0,     area: 0 },
  bombe:    { danno: 0.62, cadenza: 0,     area: 0.04, salveDa: 7, salve: 2, perSalva: 0.55 },
}
const crescitaDi = k => CRESCITA[TORRI[k].aspetto] || CRESCITA.arciere

/* ═══════════ i due rami ═══════════

   A metà scaletta una torre sceglie che cosa diventare, e la scelta non
   costa un calcolo in più: è quello che il calcolo del gradino compra.

   ── la regola che tiene in piedi tutto ──
   **I due rami valgono lo stesso, e quanto il tronco.** Cambia la forma
   del danno — tutto in un colpo o spalmato, su uno o su molti, subito o
   nel tempo — non la quantità. Adesso che le torri non si equivalgono
   più fra loro verrebbe da chiedersi se anche i rami possano smettere di
   equivalersi, e la risposta è no, per una ragione che con le torri non
   vale: **la torre si sceglie guardando il listino, il ramo no**. Il ramo
   si prende a metà scaletta, allo stesso prezzo di un gradino qualunque,
   e se uno dei due valesse di più sarebbe un tranello — chi sceglie bene
   troverebbe le tappe facili e chi sceglie male impossibili, e il
   taratore (che i rami non li sceglie) non saprebbe quale delle due
   partite sta misurando. Con i rami a pari valore il modello può
   continuare a **ignorarli**, ed è quello che fa.

   Pari valore **misurato**, e non sulla carta: `npm run dps` gioca ogni
   ramo davanti a un'ondata vera. Prima il veleno era scritto «al
   secondo» e contato «in tutto», e il napalm — che lo spalma su un'area
   — valeva il triplo del mortaio.

     cecchino   pochi colpi forti: 1,7 ÷ 1,7, e vede il 30% più lontano
     raffica    due frecce su due nemici: 0,55 × 2 ÷ 1,1
     veleno     un colpo più debole, e il male che continua: `veleno` è
                quanto fa **in tutto**, spalmato su `durata` secondi
     catena     meno sul primo, e rimbalza sui vicini (metà, poi un quarto)
     mortaio    arriva molto più lontano, e quando arriva pesa
     napalm     scoppia più largo e lascia tutti a bruciare

   Il ghiaccio non fa danno: i suoi due rami si dividono fra
   largo-e-gentile e stretto-e-cattivo, e la brina rende fragile chi ha
   gelato — l'unico modo in cui una torre che non ferisce può far male. */
export const RAMI = {
  cecchino: { danno: 1.8,  ricarica: 1.7, raggio: 1.3 },
  raffica:  { danno: 0.55, ricarica: 1.1, salve: 2 },
  veleno:   { danno: 0.5,  veleno: 0.75,  durata: 3 },
  catena:   { danno: 0.95, rimbalzi: 2 },
  bufera:   { freno: 1.0,  raggio: 1.5,   durata: 1.4 },
  brina:    { freno: 1.1,  fragile: 1.08, raggio: 0.9 },
  mortaio:  { danno: 1.6,  ricarica: 1.5, raggio: 1.3, area: 0.85 },
  napalm:   { danno: 0.55, veleno: 0.55,  durata: 3, area: 1.1 },
}

/* Da che gradino si sceglie. Quarto: prima ci sono tre salite per
   capire *che cosa fa* la torre così com'è, e chi non ha ancora capito
   non ha niente da decidere. */
export const RAMI_DA = 4

/* Come tira la torre `k` al livello `lv`, per il ramo che ha preso: è
   l'unica funzione che il gioco interroga quando spara, e la stessa che
   il modello usa per i conti. */
export function tiroDi(k, lv, ramo = null) {
  const c = crescitaDi(k), n = Math.max(0, lv - 1), T = TORRI[k]
  const r = RAMI[ramo] || {}
  const salve = r.salve || (c.salveDa && lv >= c.salveDa ? c.salve : 1)
  /* chi lancia due colpi per crescita li fa più piccoli: la salva intera
     vale poco più di un colpo solo, e il gradino non raddoppia */
  const perColpo = salve > 1 && !r.salve ? (c.perSalva || 1) : 1
  const danno = T.danno * (1 + n * c.danno) * perColpo
  const durata = r.durata || 0
  return {
    danno: danno * (r.danno ?? 1),
    ricarica: T.ricarica / (1 + n * c.cadenza) * (r.ricarica ?? 1),
    area: T.area * (1 + n * c.area) * (r.area ?? 1),
    salve,
    /* quanto male continua a fare dopo il colpo, **al secondo**, e per
       quanto: in tutto fa `veleno` volte il colpo, spalmato sulla durata */
    veleno: r.veleno && durata ? danno * r.veleno / durata : 0,
    durata,
    rimbalzi: r.rimbalzi || 0,
  }
}

/* di quanto il ramo allarga la gittata: sta fuori da `tiroDi` perché il
   raggio lo chiede la torre una volta, non a ogni colpo */
export const raggioDi = ramo => (RAMI[ramo] || {}).raggio || 1

/* quanto rende salire di un gradino, per quella torre: serve a raccontare
   il potenziamento e a controllare che convenga sempre */
export const forzaDi = (k, lv) => dpsDi(k, lv) / dpsDi(k, 1)

/* Il gelo, che è il modo in cui il ghiaccio «fa danno» pur non facendone:
   salendo di livello frena di più *e* dura di più. Il freno si ferma al
   75%: un nemico bloccato del tutto non è più un nemico, è un bersaglio
   fermo, e la partita si spegne. La bufera gela più largo e più a
   lungo ma frena meno; la brina frena di più e rende fragile. */
export const geloDi = (lv, ramo = null) => {
  const r = RAMI[ramo] || {}
  return {
    freno: Math.min(0.75, (0.56 + (lv - 1) * 0.02) * (r.freno ?? 1)),
    durata: (1.6 + (lv - 1) * 0.18) * (r.durata ?? 1),
    /* la brina non ferisce: rende fragile. Chi è gelato da lei prende
       più danno da tutti gli altri, ed è il modo in cui una torre che
       non fa male diventa la più importante del campo. */
    fragile: r.fragile || 1,
  }
}

/* ═══════════ quanto vale una torre ═══════════

   Il danno al secondo **efficace**: contando tutti quelli che prende.
   Prima era «danno × salve ÷ ricarica, e un po' in più per chi ha
   un'area» — `(1 + area/90)` — e sottostimava le torri ad area della
   metà. Adesso l'area vale **un bersaglio in più ogni `BERSAGLI.area`
   unità di raggio**, e il numero non è scelto: è quello che fa dire
   alla stima quello che `npm run dps` misura come **vita fermata** su
   un'ondata vera. Viene **circa due bersagli** per la magica e le bombe
   di livello 1 — la stima che si faceva a occhio, e che adesso è una
   misura. Su nemici che non muoiono mai l'area ne prende tre o quattro
   (lo dice la colonna `bersagli` dello strumento), ma i nemici veri
   muoiono: il gruppo si sfoltisce, e il secondo colpo trova meno gente
   del primo.

   Il veleno conta per quello che fa davvero: un nemico avvelenato di
   nuovo prima che il male finisca non ne prende due dosi (vale la più
   forte), quindi chi colpisce più spesso della durata avvelena di
   continuo e basta. I rimbalzi della catena contano metà del colpo per
   il primo e un quarto per il secondo, quando trovano un vicino — in
   un'ondata quasi sempre.

   Il ghiaccio non fa danno, e la stima non finge di saperlo misurare: il
   suo valore è **quello che la regola gli assegna** — quanto costa, per
   quanto deve rendere — e a controllare che il gelo lo valga davvero è
   `npm run dps`, che lo mette accanto a un arciere e misura la vita in
   più che ferma. */
export const BERSAGLI = { area: 45, rimbalzo: 0.5 }
const bersagliDi = area => 1 + (area || 0) / BERSAGLI.area

export function dpsDi(k, lv = 1, ramo = null) {
  if (!TORRI[k].danno) {
    return resaDi(k) * listinoDi(k) / listinoDi('add') * dpsDi('add', lv)
  }
  const t = tiroDi(k, lv, ramo)
  const colpo = t.danno * t.salve / t.ricarica
  const male = t.veleno * t.salve * Math.min(t.durata, t.ricarica) / t.ricarica
  /* i rimbalzi saltano da un nemico solo a un altro solo: stanno fuori
     dall'area, che moltiplica il colpo e il veleno */
  const rimbalzi = t.rimbalzi ? t.danno * BERSAGLI.rimbalzo / t.ricarica : 0
  return (colpo + male) * bersagliDi(t.area) + rimbalzi
}

/* l'arciere di livello 1: l'unità di misura di tutto */
const DPS = dpsDi('add', 1)

/* ── quanto rende un ⚡ speso in una torre, rispetto all'arciere ──
   È il numero che la regola in testa al file fissa, e che i test
   contano: a parità di livello deve stare vicino a `resa`. */
export const resaPerEnergia = (k, lv = 1) =>
  (dpsDi(k, lv) / listinoDi(k)) / (dpsDi('add', lv) / listinoDi('add'))

/* La resa media delle torri che una tappa mette a disposizione, per ⚡
   speso, con l'arciere di livello 1 come unità. Prima era la resa **per
   torre**, e diceva che il ghiaccio abbassava la tappa: con i prezzi
   uguali era vero, adesso il ghiaccio costa la metà di una magica e la
   domanda giusta è quanto rende quello che si spende. Resta la misura
   con cui `faticaDi` confronta tappe che danno torri diverse. */
export function resaTipi(tipi, lv = 1) {
  const lista = tipi && tipi.length ? tipi : ['add']
  return lista.reduce((s, k) => s + dpsDi(k, lv) / listinoDi(k), 0) / lista.length /
         (DPS / listinoDi('add'))
}

/* La potenza di una difesa: la somma di quello che vale ogni torre in
   campo, per il suo tipo e il suo livello. `torri` è una lista di
   `{ tipo, lv }`. Da quando le torri costano diverso non si può più
   dire «ogni torre vale la media delle quattro»: il giocatore modello
   ne costruisce una fila precisa (`sequenzaTorri`), e la potenza è
   quella di *quella* fila. */
export const potenzaDi = torri => torri.reduce((s, t) => s + dpsDi(t.tipo, t.lv), 0)

export const nemiciDiOnda = o => CFG.nemiciBase + o * CFG.nemiciPiu
export const vitaDiOnda = (o, durezza) => CFG.vitaBase * durezza * (1 + o * CFG.vitaPiu)
export const intervalloDiOnda = o => Math.max(0.45, 1.4 - o * 0.05)
const intervallo = intervalloDiOnda
/* quanto dura un'ondata: i nemici escono a intervalli, più il tempo che
   l'ultimo impiega ad attraversare il campo */
const durataOnda = o => nemiciDiOnda(o) * intervallo(o) + 6

/* ── quanto è duro un nemico, qui e ora ──
   Le due funzioni che il motore interroga a ogni nemico generato. Sono
   qui e non nel motore perché sono equilibrio, non regole del campo: il
   motore sa far camminare un mostro, non sa quanto deve essere robusto.
   Chi tara le tappe cambia queste, e cambia il gioco. */
/* La vita di un nemico è tarata **ondata per ondata**, non da una
   formula: la formula sapeva fare una cosa sola — crescere — e una
   tappa tarata sulla sua ondata più dura risultava larga di manica in
   tutte le altre. I numeri li trova `strumenti/tara-castello.mjs`
   giocando la tappa migliaia di volte, e stanno in `taratura-castello.js`.
   Dove la tabella non arriva — le partite libere, che non finiscono
   mai — resta la progressione `oltre` di ciascuna. */
export function vitaNemico(tappa, onda) {
  const v = tappa.vite
  if (!v || !v.length) return vitaDiOnda(onda, tappa.durezza)
  if (onda <= v.length) return v[onda - 1]
  /* oltre la tabella c'è solo la partita libera, che non finisce mai e
     quindi non si può tabellare: si continua con la stessa progressione
     con cui saliva, e prima o poi vince lei — è il punto di quella
     modalità.
     Si riparte **dallo stesso mostro**: da quando la taratura spiana
     mostro per mostro la tabella non sale più in fila — un golem che
     solo le bombe aprono ha meno vita di un pipistrello — e ripartire
     dall'ultima ondata (o dalla più alta) faceva un gradino a caso
     proprio sulla ventunesima. Il mostro si porta fino in fondo alla
     tabella al passo con cui ci sale **tutta la tabella** — il rapporto
     fra l'ultimo giro di mostri e quello prima, in media geometrica, e
     mai più svelto di `oltre` — e da lì sale di `oltre` a ondata come
     tutti. Col passo del mostro da solo non andava: un orco che la
     tabella aveva visto a 16 e poi a 290 si portava dietro quel salto,
     e alla ventitreesima era un muro. */
  const passo = tappa.oltre || 1.2
  const n = v.length
  const chi = o => (tappa.capi && o % tappa.capi === 0 ? 'capo'
                                                        : mostroDiOnda(tappa.mostri || [], o))
  let ultima = 0
  for (let j = 1; j <= n; j++) if (chi(j) === chi(onda)) ultima = j
  if (!ultima) return Math.round(Math.max(...v) * Math.pow(passo, onda - n))
  const giro = Math.max(1, (tappa.mostri || []).length)
  const livello = (da, a) => {
    const xs = []
    for (let j = Math.max(1, da); j <= a; j++) if (chi(j) !== 'capo') xs.push(Math.log(v[j - 1]))
    return xs.length ? Math.exp(xs.reduce((s, x) => s + x, 0) / xs.length) : null
  }
  const fine = livello(n - giro + 1, n), prima = livello(n - 2 * giro + 1, n - giro)
  const ritmo = fine && prima ? Math.min(passo, Math.max(1, Math.pow(fine / prima, 1 / giro))) : passo
  return Math.round(v[ultima - 1] * Math.pow(ritmo, n - ultima) * Math.pow(passo, onda - n))
}
export const velocitaNemico = (tappa, onda) =>
  (CFG.velBase + onda * CFG.velPiu) * (0.85 + 0.15 * tappa.durezza)

/* ── i prezzi ──
   Il prezzo base per il listino della torre: `quante` sono le torri già
   in campo (allargarsi rincara), `lv` il livello da cui si sale. Senza
   torre, il prezzo base — è quello che le frasi dei test e dei documenti
   chiamano «una torre». Arrotondati, perché a schermo si leggono. */
export const costoNuovaTorre = (quante, k = null) =>
  Math.round(listinoDi(k) * (CFG.costruzione + CFG.costruzionePiu * quante))
export const costoSalita = (lv, k = null) =>
  Math.round(listinoDi(k) * (CFG.potenziamento + CFG.potenziamentoPiu * (lv - 1)))

/* ── il premio della fretta ──
   I secondi risparmiati chiamando l'ondata prima del tempo, in ⚡: vedi
   `CFG.fretta`. Intero, perché a schermo si legge sul tasto. */
export const premioDellaFretta = secondi =>
  Math.max(0, Math.min(CFG.fretta.tetto, Math.floor(secondi * CFG.fretta.perSecondo)))

/* ═══════════ dal bersaglio alla tappa ═══════════

   Le quattro funzioni che rovesciano il modello. Si leggono in fila:
   una tappa dichiara `calcoli` e `cap`, e da lì esce tutto il resto.  */

/* ── il piano ──
   I `calcoli` acquisti di chi gioca bene, nell'ordine in cui li fa:
   prima una torre per ingresso, poi sempre il gradino più
   conveniente fra salire la torre più bassa e costruirne una nuova. È
   la stessa strategia di `difesaCon` e del giocatore finto del
   simulatore — **è la stessa funzione** (`prossimoAcquisto`), o il
   bersaglio si centrerebbe su un bambino che non esiste. Qui le
   postazioni non fanno da tetto: il piano dice di quante c'è bisogno, e
   `postiDi` gliene dà almeno tante. */
/* Quante torri si comprano prima di cominciare a salire: **due, o una
   per ingresso se gli ingressi sono di più**. Due è la regola di sempre
   — con una torre sola la prima ondata è una lotteria — e una per
   bocca è quello che serve da quando le bocche possono essere tre: se
   una resta senza nessuno davanti, l'ondata che ne esce passa intera.
   Non è una scelta di stile del giocatore modello, è il minimo per non
   regalare cuori. */
export const primeQuante = tappa => Math.max(2, ingressiDi(tappa))

/* ── che torre costruisce il giocatore modello ──
   Una fila di tipi, la stessa per il piano, per la difesa di
   `difesaCon` e per il simulatore. Due regole, in quest'ordine:

     1. **le prime torri coprono le prime ondate.** Sono una per
        ingresso, e devono sparare — il ghiaccio su una strada dove non
        spara nessuno non ferma niente. Fra le coppie (o le terne) di
        torri che sparano si prende quella che ferisce **più ondate di
        fila dall'inizio**, poi quella che ferisce più mostri della fila,
        e a pari merito quella che costa meno; in testa va quella che
        ferisce la prima ondata. L'ordine conta: con due torri in campo
        e i soldi per una terza ancora lontani, un golem alla seconda
        ondata che nessuna delle due apre è un'ondata intera che passa.
        Il preavviso lo dice prima, e chi vede arrivare un golem non
        apre con due arcieri;
     2. **poi si copre il resto, strada per strada.** Si scorrono le
        ondate in ordine, e per ognuna si guarda la strada da cui
        scende: se lì nessuna torre ferisce quel mostro, si aggiunge la
        prima torre della tappa che lo ferisce, **su quella strada**. È
        una torre **urgente** (`urgenti`): si compra prima di salire di
        livello, perché senza di lei un'ondata passa intera. Il
        preavviso le dice tre ondate prima, e chi lo legge fa lo stesso;
     3. **poi a giro**, la torre che ce n'è di meno, così il campo
        finisce per avere un po' di tutto — ghiaccio compreso.

   Non è il giocatore migliore possibile, ed è apposta: è un bambino
   diligente che legge chi arriva, non uno che ottimizza. La tappa è
   tarata su di lui. */
/* Quante ondate di una libera sono tarate: le prime venti, come una
   tappa. Lo legge `insiemeDa`, e da lì il motore e il giocatore
   modello: la regola «da quando le ondate arrivano da tutte le bocche»
   dipende da quante ondate ha la tappa, e una libera ne ha infinite —
   la taratura la gioca a venti, e il gioco deve giocarla come la
   taratura, se no il sotterraneo tarato con le bocche insieme dalla
   nona le trovava dalla sesta e cedeva lì (misurato: persa all'ondata 6
   senza un regalo). */
export const ONDATE_TARATE = 20

/* ── da che bocca arriva l'ondata `o` ──
   Con una strada sola non c'è niente da decidere. Con due, si
   alternano: la prima da una parte, la seconda dall'altra, e ogni terza
   **da tutte e due insieme** (`-1`, che il campo legge come «alternali
   uno per uno») — ma non prima di `daQuandoInsieme`. Sta qui e non nel
   motore perché la deve sapere anche il giocatore modello, per scegliere
   le torri da mettere davanti a ogni bocca; il motore la chiede a lui
   (`Ondate.viaDi`). */
export function boccaDellOnda(o, vie, daQuandoInsieme = Infinity) {
  if (vie < 2) return 0
  if (o % 3 === 0 && o >= daQuandoInsieme) return -1
  return Math.floor((o - 1 - Math.floor((o - 1) / 3)) % vie)
}

/* ── da quale ondata arrivano da tutte le bocche insieme ──
   Non dalla terza: si comincia a un terzo della tappa, e mai prima
   della quinta ondata (il perché sta in `Ondate.daQuandoInsieme`, che
   chiede questo numero qui). Una partita libera non ha un numero di
   ondate e si conta come se ne avesse `ONDATE_TARATE`, così il gioco e
   la taratura giocano la stessa partita. Sta qui perché lo deve sapere
   anche il giocatore modello: la fila delle torri lo contava sempre
   dalla quinta, e nelle libere — che mettono insieme le bocche dalla
   nona — comprava per la sesta una torre sulla strada sbagliata. Una
   tappa che non sa ancora quante ondate ha (mentre `ondateDi` la sta
   contando) resta alla quinta: le tappe sono tutte sotto le quindici. */
export function insiemeDa(ondate) {
  if (!ondate) return 5
  return Math.max(5, Math.ceil(Math.min(ondate, ONDATE_TARATE) / 3))
}

/* tutte le file di `n` torri prese da `lista` (anche ripetute) */
function file(lista, n) {
  if (n <= 0) return [[]]
  return lista.flatMap(x => file(lista, n - 1).map(resto => [x, ...resto]))
}

/* ── l'apertura ──
   Le prime torri vanno una per bocca: la piazzola numero `j` sta sulla
   strada `j % bocche`, perché le piazzole si occupano a giro fra le
   strade (`Percorso.piazzole`). Quindi non basta che la coppia ferisca
   chi arriva: deve ferirlo **la torre che sta dalla sua parte**. Nel
   Canneto il rovo della seconda ondata scende dall'altra bocca, e se da
   quella parte c'è la bomba che lui ignora passa intero.
   Si guardano le prime cinque ondate — prima della quinta non arrivano
   mai da tutte le bocche insieme — e si prende la fila di torri che ne
   copre di più **dall'inizio**, poi quella che ferisce più mostri della
   fila, poi quella che costa meno. */
function apertura(tappa, sparano, fila) {
  const quante = primeQuante(tappa)
  const vie = ingressiDi(tappa)
  const tocca = (tipi, m) => tipi.some(k => feritoDa(m, k))
  const copre = tipi => {
    let n = 0
    for (let o = 1; o <= Math.min(5, fila.length * 2); o++) {
      const m = fila[(o - 1) % fila.length]
      const via = boccaDellOnda(o, vie)
      if (!tocca(tipi.filter((_, j) => vie < 2 || j % vie === via), m)) break
      n++
    }
    return n
  }
  const ferisce = tipi => fila.filter(m => tocca(tipi, m)).length
  const diverse = tipi => new Set(tipi).size
  const costo = tipi => tipi.reduce((s, k, i) => s + costoNuovaTorre(i, k), 0)
  /* e la prima torre deve ferire la prima ondata da sola: chi sbaglia un
     conto sulla prima torre (una penale, e la seconda non ci sta più
     nei soldi di partenza) deve avere comunque in campo qualcosa che
     tocca chi arriva */
  const primaTocca = tipi => (fila.length && feritoDa(fila[0], tipi[0]) ? 1 : 0)
  return file(sparano, quante)
    .sort((a, b) => copre(b) - copre(a) || primaTocca(b) - primaTocca(a) ||
                    ferisce(b) - ferisce(a) || diverse(b) - diverse(a) ||
                    costo(a) - costo(b))[0] || []
}

/* Torna la fila dei tipi; accanto, `strade` (su che strada va ogni
   torre: il simulatore la posa lì) e `urgenti` (quali si comprano prima
   di salire). Il piano i posti non li guarda — conta i prezzi — ma il
   simulatore sì, ed è per questo che la strada sta nella fila. */
export function sequenzaTorri(tappa, quante = 32) {
  const tipi = tappa.torri && tappa.torri.length ? tappa.torri : ['add']
  const sparano = tipi.filter(k => TORRI[k].danno)
  const fila = tappa.mostri || []
  const vie = ingressiDi(tappa)
  const scelte = [], strade = []
  const urgenti = new Set()
  if (sparano.length) {
    apertura(tappa, sparano, fila).forEach((k, j) => {
      scelte.push(k); strade.push(vie < 2 ? 0 : j % vie); urgenti.add(j)
    })
  }
  /* le ondate in fila, due giri della fila dei mostri: tanto basta perché
     ogni mostro sia sceso da ogni strada almeno una volta */
  if (sparano.length)
    for (let o = 1; o <= fila.length * vie * 2 && scelte.length < quante; o++) {
      const m = fila[(o - 1) % fila.length]
      const bocca = boccaDellOnda(o, vie, insiemeDa(tappa.ondate))
      for (let v = 0; v < vie; v++) {
        if (bocca >= 0 && v !== bocca) continue
        if (scelte.some((k, j) => strade[j] === v && feritoDa(m, k))) continue
        const k = sparano.find(x => feritoDa(m, x))
        if (!k || scelte.length >= quante) continue
        urgenti.add(scelte.length); scelte.push(k); strade.push(v)
      }
    }
  const quanteDi = k => scelte.filter(x => x === k).length
  while (scelte.length < quante) {
    const k = [...tipi].sort((a, b) => quanteDi(a) - quanteDi(b) ||
                                       tipi.indexOf(a) - tipi.indexOf(b))[0]
    /* sulla strada che ne ha di meno */
    const perStrada = v => strade.filter(x => x === v).length
    const v = Array.from({ length: vie }, (_, i) => i).sort((a, b) => perStrada(a) - perStrada(b))[0]
    scelte.push(k); strade.push(v)
  }
  scelte.strade = strade
  scelte.urgenti = urgenti
  return scelte
}

/* ── quante ondate copre l'apertura ──
   Le prime ondate di fila che le torri di apertura del giocatore
   modello feriscono, ognuna dalla sua strada. Il validatore e
   `unita/castello` pretendono che siano almeno `APERTURA_COPRE`: la
   terza torre costa tanto (allargarsi rincara, e le torri che
   servono ai corazzati sono le più care) e prima della quarta ondata
   non ci sono i soldi per comprarla — un mostro che le prime due non
   toccano, lì, è un'ondata intera che passa, e la taratura non può
   farci niente: nessuna vita è abbastanza bassa per chi non si può
   ferire. */
export const APERTURA_COPRE = 4
export function coperturaApertura(tappa) {
  const fila = tappa.mostri || []
  if (!fila.length) return 0
  const vie = ingressiDi(tappa)
  const prime = sequenzaTorri(tappa, primeQuante(tappa))
  let n = 0
  for (let o = 1; o <= fila.length * 2; o++) {
    const m = fila[(o - 1) % fila.length]
    const via = boccaDellOnda(o, vie)
    if (!prime.some((k, j) => (vie < 2 || j % vie === via) && feritoDa(m, k))) break
    n++
  }
  return n
}

/* ── la mossa dopo ──
   `torri` è quello che c'è in campo, `[{ tipo, lv }]`. Torna la mossa
   che il giocatore modello farebbe adesso — `{ che: 'nuova', tipo,
   costo }` o `{ che: 'salita', indice, costo }` — o `null` se non c'è
   più niente da comprare.

   Prima le torri di apertura e quelle che coprono un mostro scoperto;
   poi il più conveniente fra salire la torre più bassa e costruire la
   prossima della fila. `largo` è chi non potenzia mai (il termine di
   paragone di `difesaLarga` e del profilo `largo` del simulatore). */
export function prossimoAcquisto(torri, tappa, { posti = Infinity, largo = false,
                                                  sequenza = null } = {}) {
  const fila = sequenza || sequenzaTorri(tappa)
  const tipo = fila[Math.min(torri.length, fila.length - 1)]
  const strada = fila.strade ? fila.strade[Math.min(torri.length, fila.length - 1)] : 0
  const nuova = torri.length < posti
    ? { che: 'nuova', tipo, strada, costo: costoNuovaTorre(torri.length, tipo) } : null
  let indice = -1
  for (let i = 0; i < torri.length; i++)
    if (torri[i].lv < tappa.cap && (indice < 0 || torri[i].lv < torri[indice].lv)) indice = i
  const salita = indice >= 0
    ? { che: 'salita', indice, costo: costoSalita(torri[indice].lv, torri[indice].tipo) } : null
  if (nuova && (torri.length < primeQuante(tappa) || fila.urgenti?.has(torri.length))) return nuova
  if (largo) return nuova
  if (!salita || !nuova) return salita || nuova
  return salita.costo <= nuova.costo ? salita : nuova
}

/* comprare davvero: la stessa mossa applicata a una lista di torri */
function compra(torri, m) {
  if (m.che === 'nuova') torri.push({ tipo: m.tipo, lv: 1 })
  else torri[m.indice] = { ...torri[m.indice], lv: torri[m.indice].lv + 1 }
}

export function pianoDi(tappa) {
  const sequenza = sequenzaTorri(tappa)
  const torri = [], passi = []
  for (let k = 0; k < tappa.calcoli; k++) {
    const m = prossimoAcquisto(torri, tappa, { sequenza })
    if (!m) break
    passi.push(m.costo); compra(torri, m)
  }
  /* `torri` resta la lista dei livelli, come l'ha sempre letta chi la
     usa; i tipi stanno accanto */
  return { torri: torri.map(t => t.lv), tipi: torri.map(t => t.tipo), passi,
           costo: passi.reduce((s, x) => s + x, 0) }
}

/* quanto lascia in mano un'ondata a chi la chiude senza far passare
   nessuno: i nemici fermati più i due premi di fine ondata. Il bonus
   della fretta non c'è dentro apposta — è un premio, non un dovuto, e
   il modello non deve contare su una scelta che il bambino può non
   fare. */
export const entrataOnda = o => nemiciDiOnda(o) * CFG.perNemico + CFG.fineOnda + CFG.ondataPulita

/* le torri con cui si comincia — una per ingresso: è il pavimento sotto
   a `partenzaDi` e la sola parte del piano che le ondate non possono
   pagare, perché viene prima della prima */
const primeTorri = tappa => {
  const fila = sequenzaTorri(tappa, primeQuante(tappa))
  return fila.reduce((s, k, i) => s + costoNuovaTorre(i, k), 0)
}

/* ── quante ondate ──
   Tante quante ne servono perché le entrate paghino il piano meno le
   due torri di partenza, e non una di più: un'ondata in più sarebbe
   energia che avanza, cioè un acquisto non previsto, cioè un calcolo
   fuori dal bersaglio.

   Ne esce una progressione che le tappe non dichiarano e che segue il
   racconto: quattro ondate nella prima, diciassette nell'ultima, e a
   ogni campagna che comincia si torna corti. Non è una scelta di gusto
   — è il numero di ondate che quella tappa si può permettere. */
export function ondateDi(tappa) {
  const daGuadagnare = pianoDi(tappa).costo - primeTorri(tappa)
  let quante = 0, entrate = 0
  while (entrate + entrataOnda(quante + 1) <= daGuadagnare) entrate += entrataOnda(++quante)
  return Math.max(3, quante)
}

/* ── con quanta energia si comincia ──
   Quello che le ondate non arrivano a pagare, e mai meno di due torri:
   perdere la prima ondata è l'unico modo di perdere che non dipende da
   come si gioca. Chi non ha un bersaglio di calcoli — la partita
   libera — riceve due torri e mezza scaletta **a prezzo base**, come si
   è sempre fatto: la generosità di partenza non deve dipendere da quale
   torre costa quanto. */
export function partenzaDi(tappa) {
  if (!tappa.calcoli) {
    let e = costoNuovaTorre(0) + costoNuovaTorre(1)
    for (let lv = 1; lv < Math.max(2, Math.ceil(tappa.cap / 2)); lv++) e += costoSalita(lv)
    return Math.round(e)
  }
  const ondate = tappa.ondate || ondateDi(tappa)
  let entrate = 0
  for (let o = 1; o <= ondate; o++) entrate += entrataOnda(o)
  return Math.max(primeTorri(tappa), pianoDi(tappa).costo - entrate)
}

/* ── quante postazioni ──

   Il minimo è quello che serve: le piazzole che il piano occupa più una
   di respiro, e mai meno delle torri che la tappa mette a disposizione.
   La seconda condizione non è estetica — ogni mostro è immune a qualcosa,
   e il preavviso lo dice prima: poter tenere in campo una torre che
   quell'ondata non ignora è la scelta che il gioco chiede. Se le
   piazzole fossero meno dei tipi, quella scelta sarebbe finta.

   Sopra al minimo c'è una **quota per campagna**, e cresce: quattro nel
   Bosco, sei nel Sotterraneo, otto nelle Mura. È la lezione del gioco
   disegnata sul terreno. Nel Bosco il campo è stretto apposta: finito lo
   spazio, l'unico modo per difendersi è salire, e una piazzola vuota
   sarebbe solo una distrazione per chi non ha ancora capito a cosa serve
   potenziare. Quando l'ha capito, quella stessa piazzola diventa una
   possibilità — e dalla terza campagna il campo si guarda finalmente come
   un tower defense vero, pieno di torri.

   Regalare piazzole non sposta di un calcolo il bersaglio della tappa, ed
   è misurato: il giocatore modello non ne approfitta perché salire di un
   gradino costa meno che costruire, e l'energia basta esattamente per il
   piano. Le piazzole in più sono una scelta offerta, non energia in più —
   chi si allarga lo paga in livelli. Il test lo ricontrolla tappa per
   tappa.

   Per la stessa ragione «c'è sempre qualcosa da comprare» resta vero per
   costruzione, senza il vecchio margine: le piazzole vuote e i gradini
   che restano costano sempre più di quello che resta in tasca. */
/* Nella Palude si riparte da sei e non da otto: i calcoli sono scesi, e
   con essi le torri che si comprano. Quello che le manca in piazzole lo
   ritrova negli ingressi, che ne aggiungono tre per ciascuno. */
export const PIAZZOLE = { bosco: 4, sotterraneo: 6, mura: 8, palude: 5 }
/* Quante piazzole in più per ogni ingresso oltre il primo. Non è un
   regalo: con due strade la difesa va divisa in due, e le stesse sei
   piazzole vorrebbero dire tre torri per strada — cioè metà difesa su
   una tappa che non è più corta. Tre è quanto basta perché la scelta
   resti «dove metto la prossima» invece di «quale delle due porte
   lascio aperta». */
export const PIAZZOLE_PER_INGRESSO = 3
export const ingressiDi = t => (t.forme || [t.forma || []]).length
/* ── quante difese separate chiede davvero ──
   Non è la stessa cosa del numero di bocche. Due strade che restano
   separate fino alla porta (il pantano, le fogne) chiedono due difese:
   quello che sta di qua non spara di là, e contro ogni ondata lavora
   metà campo. Due strade che si **fondono** — una Y, un anello, un
   canale che si immette — ne chiedono meno: sul tronco comune una torre
   sola lavora per tutti, e più il tronco è lungo più la difesa torna a
   essere una.
   Lo dichiara la tappa (`fronti`) perché è una proprietà del disegno
   che i numeri non sanno leggersi da soli, e chi disegna una mappa sa
   benissimo se le sue strade si incontrano. Senza, vale il numero di
   bocche — che è il caso peggiore, ed è il verso giusto in cui
   sbagliare. */
export const frontiDi = t => t.fronti || ingressiDi(t)
export function postiDi(tappa) {
  const minimo = Math.max(3, pianoDi(tappa).torri.length + 1, (tappa.torri || []).length)
  return Math.max(minimo, PIAZZOLE[tappa.campagna] || 0) +
         (ingressiDi(tappa) - 1) * PIAZZOLE_PER_INGRESSO
}

/* comprare tutto: occupare ogni posto e portare ogni torre in cima. Serve
   a controllare che la tappa abbia sempre più da vendere di quanto il
   bambino possa comprare. */
export function costoDifesaPiena(tappa) {
  const { posti, cap } = tappa
  const fila = sequenzaTorri(tappa, posti)
  let costo = 0
  for (let i = 0; i < posti; i++) {
    costo += costoNuovaTorre(i, fila[i])
    for (let lv = 1; lv < cap; lv++) costo += costoSalita(lv, fila[i])
  }
  return costo
}

/* l'energia in mano all'inizio dell'ondata `o`: la partenza più tutto
   quello che le ondate precedenti hanno lasciato a chi non ne ha fatta
   passare nessuna */
export function energiaAll(o, partenza) {
  let e = partenza
  for (let k = 1; k < o; k++) e += entrataOnda(k)
  return e
}

/* il tetto: quella di chi gioca bene *e* corre, prendendosi il premio
   più grosso della fretta a ogni chiamata. Non è la misura su cui si
   tara — è il margine che resta a chi gioca meglio del modello. */
export function energiaMassima({ ondate, partenza }) {
  return energiaAll(ondate + 1, partenza) + CFG.fretta.tetto * ondate
}

/* ── cosa ci si compra con l'energia che si ha in mano ──
   È il giocatore modello: la mossa di `prossimoAcquisto`, una dopo
   l'altra, finché ce n'è per pagarla. Quando la prossima costa più di
   quello che resta si ferma — come il giocatore del simulatore, che
   aspetta di avere i soldi invece di ripiegare su un'altra cosa. È il
   piano di `pianoDi` con un tetto di postazioni e un portafoglio. */
export function difesaCon(energia, tappa, { largo = false } = {}) {
  const sequenza = sequenzaTorri(tappa, Math.max(32, tappa.posti || 0))
  const torri = []
  let resta = energia, prossima = null
  for (let giro = 0; giro < 400; giro++) {
    const m = prossimoAcquisto(torri, tappa, { posti: tappa.posti, largo, sequenza })
    if (!m || m.costo > resta) { prossima = m; break }
    resta -= m.costo; compra(torri, m)
  }
  return { torri: torri.map(t => t.lv), tipi: torri.map(t => t.tipo),
           potenza: potenzaDi(torri), resta, prossima: prossima ? prossima.costo : Infinity }
}

/* ═══════════ la vecchia curva, e a cosa serve ancora ═══════════

   Da qui alla fine del blocco c'è il modello che *prima* decideva quanto
   fossero duri i nemici: potenza in campo contro vita in arrivo, con un
   margine. Non tara più niente — quel mestiere è passato al simulatore,
   che invece di stimare gioca — ma non è codice morto: da lui esce
   ancora la `durezza` di una tappa, che il gioco usa per due cose

     · la **velocità** dei nemici (`velocitaNemico`)
     · la vita di chi la tabella non ce l'ha, cioè la partita libera
       oltre l'ultima ondata tarata

   e che resta il modo più rapido per farsi un'idea di una tappa senza
   farla giocare. Chi cerca dove si decide la difficoltà non è qui:
   è in `npm run tara`.

   Quanto del danno teorico va davvero a segno: una torre spara solo a chi le
   passa nel raggio, e i primi nemici arrivano prima che tutte siano pronte. */
export const RESA = 0.55
/* quanto la difesa deve sovrastare i nemici perché la tappa sia una difesa e
   non un'esecuzione: sotto 1 sarebbe impossibile, troppo sopra è noiosa */
export const MARGINE = 1.35

/* Il margine dell'ondata `o`: quante volte il danno che si riesce a mettere
   in campo copre la vita dei nemici che arrivano. Sotto 1 la tappa è persa
   per forza, e non per come si gioca — è il numero da tenere d'occhio. */
export function margineDi(tappa, o) {
  const { cap, posti, partenza, durezza, torri } = tappa
  const { potenza } = difesaCon(energiaAll(o, partenza), tappa)
  /* ── e quanta di quella potenza lavora davvero ──
     Con due ingressi le torri stanno su due strade e l'ondata ne
     percorre una: contro di lei combatte metà difesa — meno di metà se
     le strade si fondono, e per questo il numero da usare è `frontiDi`
     e non le bocche. Il modello non lo sapeva, e per le tappe a due
     bocche prometteva una difesa doppia di quella vera — le vite tarate venivano fuori troppo alte
     e la «fatica» della campagna smetteva di crescere. Le piazzole in
     più (`PIAZZOLE_PER_INGRESSO`) servono proprio a ripagare questa
     divisione, non a regalare difesa. */
  const danno = potenza / frontiDi(tappa) * durataOnda(o) * RESA
  return danno / (nemiciDiOnda(o) * vitaDiOnda(o, durezza))
}

/* La durezza della tappa: il numero più alto che lascia ancora vera la
   promessa, ondata per ondata. Chi arriva all'ondata o con l'energia che il
   gioco gli ha dato deve poterla smaltire con il margine. */
export function durezzaDi(tappa) {
  let peggiore = Infinity
  for (let o = 1; o <= tappa.ondate; o++)
    peggiore = Math.min(peggiore, margineDi({ ...tappa, durezza: 1 }, o) / MARGINE)
  // niente pavimento arbitrario: se una tappa dà torri deboli — il ghiaccio non
  // fa danno — i suoi nemici devono essere più molli, altrimenti la promessa
  // salta proprio dove il bambino ha meno mezzi
  return Math.round(peggiore * 20) / 20
}

/* Quanto è dura *davvero* una tappa: i nemici misurati sulla difesa che quella
   tappa mette a disposizione. È questo che deve crescere lungo la campagna, non
   la robustezza dei nemici in sé — una tappa di soli arcieri e una piena di
   ghiaccio non si confrontano con lo stesso metro, e nemmeno una a un ingresso
   e una a due: là la stessa durezza si paga il doppio, perché contro ogni
   ondata combatte metà difesa. */
export const faticaDi = t => t.durezza * frontiDi(t) / resaTipi(t.torri)

/* Quante operazioni chiede una tappa a chi la gioca fino in fondo: una per
   ogni torre costruita e una per ogni gradino salito. È il numero che deve
   tornare uguale a `calcoli`, ed è il controllo che tiene onesta tutta la
   derivazione — se qui esce un numero diverso da quello promesso, è il
   modello a essere sbagliato, non il dato. */
export function operazioniDi(t) {
  const finale = difesaCon(energiaAll(t.ondate + 1, t.partenza), t)
  return finale.torri.length + finale.torri.reduce((s, lv) => s + lv - 1, 0)
}

/* Le monete di fine tappa, moltiplicate poi per il livello del giocatore.
   Non sono una cifra scelta a occhio: sono il lavoro fatto, contato con lo
   stesso metro degli altri giochi — una moneta ogni dieci risposte giuste.
   Così una tappa lunga paga più di una corta senza doverlo decidere. */
export const premioTappa = i => Math.max(1, Math.round(operazioniDi(TAPPE[i]) / 10))

/* La difesa di chi non potenzia mai: solo torri di livello 1, finché ci
   stanno e finché l'energia regge. È il termine di paragone — se questa
   rende quanto l'altra, la matematica difficile non serve a niente. */
export const difesaLarga = (energia, tappa) => difesaCon(energia, tappa, { largo: true })

/* i secondi di calma prima che l'ondata parta da sola: tanti nella prima
   tappa, sempre meno via via che il gioco chiede di stare sul pezzo */
export const attesaDi = (i, quante) =>
  Math.round(CFG.attesaLarga - (CFG.attesaLarga - CFG.attesaStretta) * (i / Math.max(1, quante - 1)))

/* la chiave con cui una tappa si ritrova nella tabella delle vite: la
   campagna insieme al nome, perché due campagne possono raccontare due
   «gole» diverse e non devono pescare le stesse vite */
export const chiaveTappa = t => (t.campagna ? `${t.campagna}/${t.nome}` : t.nome)

/* ── le tappe ──
   Il racconto arriva da `campagne-castello.js`; qui si appendono i
   numeri, in quest'ordine perché ognuno serve al successivo. */
export const TAPPE = RACCONTO.map((t, i) => {
  const ondate = ondateDi(t)
  const posti = postiDi(t)
  const partenza = partenzaDi({ ...t, ondate })
  const base = { ...t, ondate, posti, partenza, attesa: attesaDi(i, RACCONTO.length) }
  // `vite` è la taratura trovata sul campo; `durezza` resta la vecchia
  // curva, che serve ancora alla velocità e a chi la taratura non ce l'ha
  return { ...base, durezza: durezzaDi(base), vite: VITE[chiaveTappa(t)] }
})

/* L'impronta dei numeri su cui la taratura è stata fatta. Se cambiano i
   prezzi, le torri o le tappe, questa cambia e non combacia più con
   quella scritta nel file generato: il test lo dice, e si rifà la
   taratura invece di andare avanti con numeri di ieri. */
export function firmaEquilibrio() {
  const roba = JSON.stringify([
    CFG, CRESCITA, GEOMETRIA, MONDO, CARATTERE, RAMI, RAMI_DA, PIAZZOLE_PER_INGRESSO,
    Object.entries(TORRI).map(([k, T]) => [k, T.danno, T.ricarica, T.area, T.raggio, !!T.gela]),
    // chi arriva e cosa fa: le immunità decidono quale torre lavora, le
    // abilità quanta vita porta davvero un'ondata, il capo come ne
    // finisce una
    Object.entries(MOSTRI).map(([id, m]) => [id, m.immune, m.abilita || null, !!m.vola]),
    ABILITA, CAPO,
    // Il tracciato entra per intero, che la tappa dichiari `forma` o
    // `forme`: le spezzate decidono quanta strada ogni torre tiene sotto
    // tiro, e con `t.forma` da solo le sette tappe a più bocche
    // finivano nella firma come `null` — si poteva ridisegnare la
    // palude senza che la taratura risultasse stantia. `fronti` sta qui
    // esplicito e non solo di rimbalzo via `durezza`.
    RACCONTO.map(t => [chiaveTappa(t), t.calcoli, t.cap, t.torri, t.mostri,
                       !!t.abilita, !!t.capo, !!t.rami, t.forme || [t.forma], t.fronti ?? null]),
    // `durezza` c'è dentro perché muove la **velocità** dei nemici: una
    // tappa tarata su mostri più lenti non è la stessa tappa
    TAPPE.map(t => [t.ondate, t.posti, t.partenza, t.attesa, t.durezza]),
    // e le quattro libere, ognuna col suo tracciato: sono tarate come le
    // tappe, e ridisegnarne una senza ritarare sarebbe lo stesso buco
    LIBERE.map(l => [l.chiave, l.campagna, l.cap, l.posti, l.torri, l.mostri, l.rami,
                     l.forme, l.fronti ?? null, l.partenza, l.attesa, l.capi, !!l.abilita]),
  ])
  let h = 5381
  for (let i = 0; i < roba.length; i++) h = ((h * 33) ^ roba.charCodeAt(i)) >>> 0
  return h.toString(16)
}
export const firmaTaratura = () => FIRMA

/* ═══════════════ I REGALI DELLA PARTITA LIBERA ═══════════════

   Ogni `OGNI_REGALO` ondate la partita libera regala un potenziamento, si
   scegle fra quelli qui sotto, e **resta per sempre**: il grado preso
   vale anche nelle partite dopo, e lo stesso regalo si può riprendere
   quante volte si vuole. Il posto nel profilo è
   `campagne.torri.regali` (`{ id: quanti }`), e a scriverlo è
   `giochi/campagne.js` come tutto il resto dell'avanzamento.

   ── perché esistono, e perché stanno solo qui ──

   La partita libera cede **sempre alla stessa ondata**, e non è
   un'impressione: oltre la ventesima la tabella delle vite finisce e
   la vita continua a salire di `OLTRE` (1,3) per ondata, cioè +30% a
   giro. Una difesa che è già al massimo della scaletta — quattro torri
   di livello 10 — non ha più niente da comprare, quindi la ventunesima
   ondata non si può vincere giocando meglio: si può solo non giocarla.
   Un record che non si muove è un record che non si guarda più.

   Il regalo è quello che manca: **qualcosa che cambia fra una partita e
   l'altra**. Non un'ondata a regalo — la scala è a gradoni, e il
   record si sposta di colpo quando i gradi bastano a passare il mostro
   del muro — ma una fila di record che sale a ogni manciata di
   partite: misurato, vedi `docs/castello.md` e
   `strumenti/regali-castello.mjs`.

   ── e perché **non** stanno nella campagna ──

   Una tappa della campagna è tarata ondata per ondata (`npm run tara`),
   e la taratura è fatta su una difesa che si conosce. Un bonus
   definitivo la renderebbe più facile a ogni partita giocata altrove,
   cioè renderebbe la promessa dei `calcoli` una cosa che dipende da
   quanto si è giocato prima. Perciò i regali li prende solo la tappa
   che lo dichiara (`regali: true`, e ce l'hanno solo le quattro
   `LIBERE`), e il motore ignora quelli che gli arrivano per una tappa
   che non li prevede. I gradi presi sono **uno** per il castello e
   non uno per terreno: un regalo è una cosa che ci si porta dietro, e
   quattro tasche separate avrebbero voluto dire ricominciare da zero
   ogni volta che si cambia terreno.

   ── una scelta fatta a occhi aperti ──

   Un regalo **non passa da un esercizio**: si prende per essere
   arrivati fin lì, non per aver fatto un conto in più. Va contro la
   regola generale del progetto (vedi `CALIBRAZIONE.md`: quello che si
   riceve si paga in esercizio) e la riga per cui è accettabile è
   questa: le ondate che l'hanno fatto arrivare erano **tutte pagate in
   operazioni in colonna**, e il regalo non si spende — non compra
   monete, non compra tappe, non esce dalla partita libera. È un modo
   di dire «hai retto venti ondate», non una valuta.

   ── come sono dimensionati ──

   **Piccoli: +5% a quello che toccano**, perché non si perdono mai. Se
   ne prendono quattro a partita (uno ogni cinque ondate, e il muro sta
   dopo la ventesima), quindi cento gradi sono venticinque partite, e
   chi gioca spesso ne ha centinaia. Un gradino che sulla carta sembra
   enorme (+30%, com'era all'inizio) dopo un mese è una difesa che non
   cede più, e un bambino lo legge come «+30%? tantissimo» anche quando
   al muro non sposta niente. Col passo piccolo, **dentro lo stesso
   regalo i gradi si sommano** (+5%, +10%, +15%…: il ventesimo grado
   raddoppia quello che tocca) e regali diversi si moltiplicano fra
   loro, perché toccano cose diverse (il danno, la cadenza, il raggio).

   Il prezzo è che il record si muove più tardi: sopra la ventesima
   ondata guadagnare un'ondata vuol dire reggere il 30% di vita in più,
   e dieci gradi non bastano quasi mai. Misurato sulle quattro libere
   (`strumenti/regali-castello.mjs`, e il banco in
   `unita/regali-castello`): venti gradi spostano il record di un'ondata
   (cinque nel delta), cinquanta di tre-nove, cento di sette-nove, e il
   rendimento cala da sé — la vita cresce a moltiplicare, i gradi a
   sommare. Un tetto per regalo non serve: il tetto lo mette già la
   curva. `docs/castello.md` porta la tabella. */
export const OGNI_REGALO = 5

/* Quante carte si offrono fra cui scegliere: tre, perché su uno schermo
   verticale tre carte si leggono senza scorrere e perché scegliere fra
   sette è un catalogo, non una decisione. Il giro è deterministico
   (vedi `regaliOfferti`), quindi chi non vede la carta che voleva sa
   che tornerà. */
export const QUANTE_CARTE = 3

/* I doni a riposo: i numeri che il motore applica quando non c'è
   nessun regalo. Sono moltiplicatori a 1 e somme a 0 apposta — così
   «zero regali» e «nessun regalo» sono la stessa partita, bit per bit,
   e la campagna non cambia di un capello. */
export const doniZero = () => ({
  danno: { arciere: 1, magica: 1, bombe: 1, ghiaccio: 1 },
  raggio: 1, cadenza: 0, gelo: 0, fragile: 0, veleno: 1,
})

/* Il catalogo. Ogni voce sa **una cosa sola**: di quanto sposta un dono
   per ogni grado preso (`dai`). Il numero sta scritto qui e in nessun
   altro posto: il motore non conosce le percentuali, chiede i doni e
   li applica. I gradi si sommano senza tetto — riprendere lo stesso
   regalo venti volte è previsto, e misurato. */
export const REGALI = [
  /* L'arciere è l'unico che colpisce un nemico solo, ed è la torre a
     cui sono immuni più mostri (goblin, ragno, orco, golem, lupo…:
     guarda `data/mostri.js`). Perciò il suo gradino è il più grosso del
     catalogo (+8% invece di +5%), e non è generosità: misurato al muro,
     +10% di arciere vale un settimo di +10% di bombe. Non di più,
     però: sulla carta si deve leggere come un passo, non come un
     tesoro. */
  { id: 'frecce', emoji: '🏹', nome: 'Frecce affilate', torre: 'add',
    che: 'gli arcieri fanno più male', per: '+8% di danno',
    dai: (d, g) => { d.danno.arciere += 0.08 * g } },
  { id: 'incanto', emoji: '🔮', nome: 'Incanto più forte', torre: 'sub',
    che: "l'onda magica fa più male", per: '+5% di danno',
    dai: (d, g) => { d.danno.magica += 0.05 * g } },
  { id: 'polvere', emoji: '💣', nome: 'Polvere da sparo', torre: 'div',
    che: 'le bombe fanno più male', per: '+5% di danno',
    dai: (d, g) => { d.danno.bombe += 0.05 * g } },
  /* Il ghiaccio non fa danno, quindi il suo regalo non può essere «più
     danno» — e **non può essere solo più gelo**: il freno è già al
     tetto e allungare la durata oltre la strada non aggiunge niente
     (misurato: +72 s di gelo ferma nove nemici in più di +12 s, e poi
     si ferma lì). Quello che scala è la **fragilità**, cioè la regola
     della brina: chi è gelato prende più male da tutti. È il modo in
     cui una torre che non ferisce diventa la più importante del campo,
     e vale tanto quanto le altre perché passa dal danno degli altri. */
  { id: 'gelo', emoji: '❄️', nome: 'Gelo che morde', torre: 'mul',
    che: 'il gelo dura di più, e chi è gelato prende più male da tutti',
    per: '+0,2 s di gelo e +3% di danno su chi è gelato',
    dai: (d, g) => { d.gelo += 0.2 * g; d.fragile += 0.03 * g } },
  { id: 'vista', emoji: '🦅', nome: 'Vista lunga',
    che: 'tutte le torri arrivano più lontano', per: '+5% di raggio',
    dai: (d, g) => { d.raggio += 0.05 * g } },
  /* Vale solo per chi ha scelto il ramo che avvelena o che brucia, e va
     detto sulla carta: un regalo che non fa niente è peggio di un
     regalo che non c'è. Chi è immune alla torre è immune anche al suo
     veleno (`Nemico.avvelena`): il male arriva col colpo, e un colpo
     che rimbalza non lascia niente dentro. */
  { id: 'veleno', emoji: '☠️', nome: 'Veleno tenace', ramo: true,
    che: 'veleno e fuoco fanno più male — solo le torri che ce l\'hanno',
    per: '+8% di veleno',
    dai: (d, g) => { d.veleno += 0.08 * g } },
  /* ── il settimo tocca tutti, e passa dal tempo ──
     Ricaricare più in fretta è danno in più senza dirlo, e vale per
     tutte e quattro le torri — ghiaccio compreso, che così rinfresca il
     gelo più spesso. È il regalo di chi in campo ha un po' di tutto e
     non vuole scegliere, e per questo il suo grado è il più piccolo
     (+3%): anche così, quaranta gradi tutti qui sono la voce che porta
     più lontano (`node strumenti/regali-castello.mjs --soli 40`).

     ── i due che sono stati provati e non ci sono ──
     **«+1 cuore»** non vale niente: l'ondata che ferma la partita non
     fa passare un nemico, ne fa passare **ventotto** — con quaranta
     cuori regalati si guadagna una sola ondata.
     **«+⚡ per ogni nemico fermato»** vale troppo, e in un modo che
     rompe la scala: al muro il metro non è a corto di potenza, è a
     corto di soldi (arriva alla ventesima con la quarta torre a metà
     scaletta), quindi **anche +2,5% di energia** basta a comprargli il
     gradino che gli manca e a saltare tre ondate in un colpo — un
     grado solo, e la stessa cosa a quaranta gradi. Un regalo che vale
     dieci volte gli altri non è un regalo forte: è l'unico che si
     prende. Quello che non sposta niente e quello che sposta tutto
     costano la stessa scelta, e nessuno dei due si tiene. */
  { id: 'cadenza', emoji: '💨', nome: 'Mani veloci',
    che: 'tutte le torri ricaricano più in fretta', per: '+3% di cadenza',
    dai: (d, g) => { d.cadenza += 0.03 * g } },
]

export const regaloDi = id => REGALI.find(r => r.id === id) || null

/* Da `{ id: quanti }` ai doni che il motore applica. Puro, e chiamato
   una volta per partita (più una a ogni regalo preso): quello che gira
   sessanta volte al secondo legge il risultato. */
export function doniDi(regali) {
  const d = doniZero()
  if (!regali) return d
  for (const r of REGALI) {
    const g = Math.max(0, Math.floor(regali[r.id] || 0))
    if (g > 0) r.dai(d, g)
  }
  return d
}

export const quantiRegali = regali =>
  REGALI.reduce((n, r) => n + Math.max(0, Math.floor((regali || {})[r.id] || 0)), 0)

/* ── quali carte si offrono ──
   Tre voci del catalogo, scelte **a giro** e non a sorte: la scelta
   numero `k` parte dalla posizione `k × quante` e prende le tre
   successive. Così in due giri il catalogo passa tutto davanti, nessuna
   voce si nasconde per sempre e non serve un seme da salvare nel
   profilo. */
export function regaliOfferti(k, quante = QUANTE_CARTE) {
  const n = Math.min(quante, REGALI.length)
  return Array.from({ length: n }, (_, i) => REGALI[(k * n + i) % REGALI.length])
}

/* ── i doni addosso a una torre ──
   Le due funzioni che il motore chiama al posto di `tiroDi` e `geloDi`
   quando in campo ci sono dei regali. Stanno qui perché i numeri sono
   equilibrio: in `motore/` non entra una percentuale. */
export function tiroConDoni(k, lv, ramo, doni) {
  const t = tiroDi(k, lv, ramo)
  if (!doni) return t
  const f = doni.danno[TORRI[k].aspetto] ?? 1
  if (f === 1 && doni.veleno === 1 && !doni.cadenza) return t
  return { ...t, danno: t.danno * f, veleno: t.veleno * f * doni.veleno,
           ricarica: t.ricarica / (1 + doni.cadenza) }
}

export function geloConDoni(lv, ramo, doni) {
  const g = geloDi(lv, ramo)
  if (!doni || (!doni.gelo && !doni.fragile)) return g
  return { ...g, durata: g.durata + doni.gelo, fragile: g.fragile + doni.fragile }
}

/* ═══════════════ IL BLOCCHETTO DEI POTENZIAMENTI ═══════════════

   «Ho preso otto potenziamenti, e adesso i miei arcieri fanno +80%»:
   è la frase che un bambino vuole potersi dire guardando il campo, e
   finora doveva ricostruirsela contando i gettoni dei livelli torre per
   torre. Qui la si compone, per il foglio che la schermata apre durante
   la partita (`components/castello/Potenziamenti.vue`).

   Due specie di potenziamenti, e si sommano:

     · i **gradini** saliti dalle torri in campo — uno per ogni conto
       fatto per potenziarle, quindi è anche il numero di operazioni che
       le ha rese così;
     · i **regali** della partita libera, che restano per sempre.

   Per ogni tipo di torre in campo si dice quante sono, quanti gradini
   hanno salito in tutto, che mestiere hanno scelto, e **quanto fanno in
   più di una torre appena costruita** — la media delle loro, contando
   il livello, il ramo e i regali che toccano quella torre. Il numero è
   quello del modello (`dpsDi`): lo stesso che decide i prezzi, quindi
   non può dire una cosa mentre il listino ne dice un'altra.

   Puro, e provato in `unita/blocchetto-castello`. `torri` sono
   `[{ tipo, lv, ramo }]`, `regali` i gradi presi `{ id: quanti }` (vuoto
   nella campagna, dove i regali non valgono). */
export function blocchettoDi(torri = [], regali = null) {
  const doni = doniDi(regali)
  const perTipo = []
  for (const k of Object.keys(TORRI)) {
    const sue = torri.filter(t => t.tipo === k)
    if (!sue.length) continue
    const aspetto = TORRI[k].aspetto
    const regalo = TORRI[k].danno ? (doni.danno[aspetto] ?? 1) * (1 + doni.cadenza) : 1
    const forza = sue.reduce((s, t) => s + dpsDi(k, t.lv, t.ramo) * regalo / dpsDi(k, 1), 0) / sue.length
    const rami = {}
    for (const t of sue) if (t.ramo) rami[t.ramo] = (rami[t.ramo] || 0) + 1
    perTipo.push({
      tipo: k, quante: sue.length,
      gradini: sue.reduce((s, t) => s + t.lv - 1, 0),
      piu: Math.round((forza - 1) * 100),
      livelloMassimo: Math.max(...sue.map(t => t.lv)),
      rami: Object.entries(rami).map(([ramo, quante]) => ({ ramo, quante })),
    })
  }
  const doniPresi = REGALI
    .map(r => ({ r, g: Math.max(0, Math.floor((regali || {})[r.id] || 0)) }))
    .filter(({ g }) => g > 0)
    .map(({ r, g }) => ({ id: r.id, emoji: r.emoji, nome: r.nome, gradi: g,
                          che: r.che, quanto: moltiplicaPer(r.per, g) }))
  const gradini = perTipo.reduce((s, t) => s + t.gradini, 0)
  const regaliPresi = doniPresi.reduce((s, d) => s + d.gradi, 0)
  return { torri: perTipo, regali: doniPresi, gradini, regaliPresi,
           totale: gradini + regaliPresi }
}

/* «+5% di danno» preso tre volte è «+15% di danno»: ogni numero della
   frase moltiplicato per i gradi, con la virgola all'italiana. La frase
   di un regalo è scritta per un grado solo (`per` nel catalogo), e il
   foglio dice quanto fanno tutti insieme. */
function moltiplicaPer(frase, gradi) {
  return frase.replace(/\d+(?:,\d+)?/g, n => {
    const v = Number(n.replace(',', '.')) * gradi
    return String(Math.round(v * 10) / 10).replace('.', ',')
  })
}

/* ═══════════════ LE PARTITE LIBERE ═══════════════

   Una partita libera non finisce: le ondate continuano, i nemici
   crescono di vita e di velocità a ogni giro, e prima o poi si perde —
   è quello il punto. Ce n'è **una per terreno**, e ognuna eredita
   dalla sua campagna: tutti i mostri che ci vivono, le torri e la
   regola dei rami dell'ultima tappa (nel Bosco niente rami, come nella
   campagna), il terreno dell'ultima tappa. Il tracciato invece è suo,
   e sta in `LIBERE_RACCONTO` (`campagne-castello.js`): è il più
   intricato del suo mondo, con due bocche che si fondono.

   ── perché quattro, e perché a più bocche ──
   Ce n'era una, a strada singola, con una nota che diceva che con due
   bocche «la partita libera diventa intarabile»: un'ondata che si
   divide farebbe saltare il gradino fra la tabella e la progressione.
   Era una paura, non una misura. Adesso ogni libera si tara da sola —
   la sua tabella `VITE` di venti ondate, il suo `oltre` — e il gradino
   lo si guarda in `unita/castello`: ognuna regge una partita vera e
   prima o poi cede. Se una non reggesse, il test lo direbbe col nome.

   ── quello che è di tutte e quattro ──
   `cap: 10` e le quattro torri dove la campagna le dà, i regali
   (`regali: true`, e i gradi presi sono **uno** per il castello,
   `campagne.torri.regali`: un regalo preso nel bosco vale anche sulle
   mura), le stesse piazzole della vecchia libera, e la stessa
   generosità di partenza. Le vite di ogni libera stanno sotto la sua
   chiave in `VITE`, e la chiave è stabile come un id di contenuto.

   ── i mostri ──
   Sono **tutti quelli della campagna**, in fila come `mostroDiOnda` li
   pesca. Non `mostroLibero`, che pescava dal bestiario intero — un
   lupo di palude nel bosco di notte è un'altra storia. La fila si
   dispone **a giro di immunità**, come fanno a mano le tappe: due
   ondate di fila non devono lasciar fuori le stesse torri, se no chi ha
   costruito bene per questa non deve pensare per la prossima. Si
   pesca ogni volta dal mucchio più grosso fra quelli con un'immunità
   diversa da quello di prima, e il validatore
   (`strumenti/valida-percorsi.mjs`) ricontrolla la fila che ne esce.
   E la fila comincia da uno che l'arciere ferisce: è la torre che si
   compra per prima, e la prima ondata non deve essere un muro. */
const ultimaDi = campagna => RACCONTO.filter(t => t.campagna === campagna).at(-1)
function mostriDi(campagna) {
  const tutti = [...new Set(RACCONTO.filter(t => t.campagna === campagna).flatMap(t => t.mostri))]
  const mucchi = new Map()
  for (const m of tutti) {
    const k = firmaImmunita(m)
    if (!mucchi.has(k)) mucchi.set(k, [])
    mucchi.get(k).push(m)
  }
  const fila = []
  let prima = null
  while (fila.length < tutti.length) {
    const scelte = [...mucchi.entries()].filter(([k, v]) => v.length && k !== prima)
    const [k, v] = (scelte.length ? scelte : [...mucchi.entries()].filter(([, v]) => v.length))
      .sort((a, b) => b[1].length - a[1].length)[0]
    fila.push(v.shift())
    prima = k
  }
  /* la fila gira in tondo: se l'ultimo ha le stesse immunità del primo,
     lo si infila dove sta bene — fra due che non le hanno */
  const res = firmaImmunita
  const ultimo = fila[fila.length - 1]
  if (fila.length > 2 && res(ultimo) === res(fila[0])) {
    const dove = fila.findIndex((m, i) => i > 0 && i < fila.length - 1 &&
                                          res(fila[i - 1]) !== res(ultimo) && res(m) !== res(ultimo))
    if (dove > 0) { fila.pop(); fila.splice(dove, 0, ultimo) }
  }
  /* e si fa girare finché in testa non c'è uno che l'arciere ferisce:
     girarla non tocca chi sta accanto a chi, quindi il giro resta buono */
  const primo = fila.findIndex(m => feritoDa(m, 'add'))
  return primo > 0 ? [...fila.slice(primo), ...fila.slice(0, primo)] : fila
}

/* ── una fila che regga l'apertura ──
   Il giro delle immunità lo fa `mostriDi`, ma con due bocche non basta:
   le prime quattro ondate le devono ferire le due torri di apertura,
   ognuna dalla sua parte (`coperturaApertura`). Si prova a far girare la
   fila, e se non basta a scambiare la terza e la quarta con una più
   avanti, finché le regole di `guastiDelleImmunita`, la copertura e i
   capi (qui sotto) tornano tutte e tre. Se niente torna si tiene la
   fila com'era, e il validatore lo dice col nome.

   ── i capi ──
   Nella libera il capo arriva ogni `CAPO.ogni` ondate, ed è il mostro
   che la fila mette in quel punto: un'ondata intera in un corpo solo.
   Se lo ferisce **una torre sola**, tutta l'ondata dipende da quella
   torre, al livello che ha a quel punto e dalla parte dove sta — e alla
   decima ondata la difesa è ancora giovane. È successo nel Delta
   quando il drago ha perso l'immunità al gelo: la sua firma è diventata
   quella della blatta, la fila si è ridisposta e il drago è finito in
   terza posizione, cioè capo della decima ondata. Solo le frecce lo
   toccano, e l'arciere dalla sua parte era ancora al primo gradino:
   passava con qualunque vita, la taratura toccava il pavimento e la
   libera cedeva lì. Quindi i capi delle ondate tarate devono poterli
   ferire almeno due torri: è una regola delle libere, perché nella
   campagna il capo chiude la tappa, quando la difesa è finita. */
export function capiAperti(tappa) {
  const sparano = tappa.torri.filter(k => TORRI[k].danno)
  for (let o = CAPO.ogni; o <= ONDATE_TARATE; o += CAPO.ogni) {
    const m = mostroDiOnda(tappa.mostri, o)
    if (sparano.filter(k => feritoDa(m, k)).length < 2) return false
  }
  return true
}
function filaCheRegge(tappa) {
  const va = fila => {
    const t = { ...tappa, mostri: fila }
    return !guastiDelleImmunita(t).length && coperturaApertura(t) >= APERTURA_COPRE &&
           capiAperti(t)
  }
  const base = tappa.mostri
  const n = base.length
  for (let r = 0; r < n; r++) {
    const giro = [...base.slice(r), ...base.slice(0, r)]
    if (va(giro)) return giro
    for (const i of [2, 3, 1])
      for (let j = i + 1; j < n; j++) {
        const f = giro.slice();
        [f[i], f[j]] = [f[j], f[i]]
        if (va(f)) return f
      }
  }
  return base
}

export const LIBERE = LIBERE_RACCONTO.map(r => {
  const ultima = ultimaDi(r.campagna)
  const libera = {
    ...r, ondate: Infinity, posti: 14, cap: 10,
    torri: ultima.torri, ambiente: ultima.ambiente,
    rami: !!ultima.rami,
    /* le abilità ci sono sempre, anche nel Bosco: la partita infinita è
       il posto dove il gioco vive di varietà, e chi ci arriva ha finito
       la campagna. E il capo, ogni `CAPO.ogni` ondate, a ritmo fisso:
       il preavviso lo annuncia come tutto il resto */
    abilita: true, capi: CAPO.ogni,
    /* e i regali: solo qui. Nelle tappe della campagna il campo non
       esiste, quindi il motore non li applica mai — vedi il blocco dei
       regali qui sopra */
    regali: true,
    mostri: mostriDi(r.campagna),
    partenza: partenzaDi({ cap: 4 }), durezza: 1, attesa: 30,
    /* le prime venti ondate sono tarate come una tappa; dopo, la vita
       continua a salire di questo passo e prima o poi vince lei */
    vite: VITE[r.chiave], oltre: (OLTRE && OLTRE[r.chiave]) || 1.2,
  }
  return { ...libera, mostri: filaCheRegge(libera) }
})

export const liberaDi = chiave => LIBERE.find(l => l.chiave === chiave) || null

/* La prima delle quattro, per chi ne vuole una sola: i banchi che
   misurano i regali, e chi chiede «la partita libera» senza dire quale.
   È anche quella che eredita il record della libera di prima
   (`senzaFine` in `data/giochi.js`). */
export const LIBERA = LIBERE[0]
