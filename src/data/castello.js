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

   ── una nota sui prezzi ──

   Costruire e potenziare costano quasi uguale, e le due scale salgono
   piano. Non è pigrizia: se un gradino in cima costasse il triplo di
   uno in fondo, «energia totale ÷ costo medio di un acquisto» cambierebbe
   da tappa a tappa e il bersaglio non si potrebbe più centrare. La
   convenienza di potenziare non sta nel prezzo — sta in quello che
   rende: una torre alta vale quanto tre torri basse e occupa un posto
   solo. È lì che la matematica difficile diventa la scelta furba
   invece della tassa.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from './ops.js'
import { RACCONTO } from './campagne-castello.js'
import { VITE, FIRMA, OLTRE } from './taratura-castello.js'

export const CFG = {
  cuori: 5,
  nemiciBase: 4, nemiciPiu: 3,     // quanti nemici ha l'ondata numero o
  vitaBase: 42, vitaPiu: 0.38,     // quanto è robusto ciascuno
  velBase: 26, velPiu: 1.6,
  respiro: 1,

  /* ── l'economia ──
     La scala dei potenziamenti è quasi piatta apposta: un acquisto è un
     calcolo, e un calcolo deve costare più o meno sempre lo stesso, o
     «energia totale ÷ costo medio» cambierebbe da tappa a tappa e il
     bersaglio dei `calcoli` non si potrebbe centrare.

     A rincarare è invece **allargarsi**: la prima torre 40, la seconda
     60, la terza 80. È lì che sta la lezione del gioco. Salire di un
     gradino rende il 60% in più di potenza; se costruire costasse poco
     più che potenziare, riempire il campo di torri di livello 1 sarebbe
     la mossa migliore — l'abbiamo misurato, e lo era — e la matematica
     difficile diventerebbe una tassa invece che la scelta furba. */
  costruzione: 40, costruzionePiu: 20,
  potenziamento: 36, potenziamentoPiu: 2,
  perNemico: 2,                    // energia per ogni nemico fermato
  fineOnda: 4, ondataPulita: 6,    // premio di fine ondata, doppio se non passa nessuno
  /* Chi chiama l'ondata subito è pagato per la fretta. Il premio è
     piccolo di proposito: in tutta la tappa più lunga vale **un
     acquisto in più**, cioè un calcolo regalato a chi non se la prende
     comoda. Se valesse di più diventerebbe un obbligo, e il modello
     delle tappe — tarato su chi si prende il suo tempo — non
     racconterebbe più la partita di nessuno. */
  bonusPronti: 4, entroSecondi: 8,
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
  v: 3,                  // ↑ di uno a ogni modifica di `piazzole()`
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

/* ── come cresce una torre quando sale di livello ──

   Non tutte allo stesso modo, ed è il punto. Prima ogni torre
   moltiplicava il suo danno con la stessa identica formula: potenziare
   l'arciere e potenziare le bombe si sentivano uguali, e la scelta di
   quale far salire era solo una questione di prezzo.

   Adesso ognuna cresce nel suo mestiere:

     arciere   spara sempre più spesso — a fine scaletta tira una freccia
               ogni 0,3 secondi invece che ogni 0,62: è una raffica
     magica    allarga l'onda: colpisce gruppi sempre più grossi
     bombe     il colpo singolo enorme, e dal settimo livello ne lancia
               due per volta
     ghiaccio  non fa danno: cresce nel gelo, vedi `geloDi`

   Chi cresce nella cadenza fa meno danno per colpo, se no diventerebbe
   la torre e basta. I numeri qui sotto li usa sia il gioco sia il
   modello che tara le tappe: non esiste un secondo posto dove sono
   scritti, quindi non possono divergere. */
export const CRESCITA = {
  arciere:  { danno: 0.45, cadenza: 0.12,  area: 0 },
  magica:   { danno: 0.9,  cadenza: 0,     area: 0.095 },
  ghiaccio: { danno: 0,    cadenza: 0,     area: 0 },
  bombe:    { danno: 0.9,  cadenza: 0,     area: 0.045, salveDa: 7, salve: 2 },
}
const crescitaDi = k => CRESCITA[TORRI[k].aspetto] || CRESCITA.arciere

/* ═══════════ i due rami ═══════════

   A metà scaletta una torre sceglie che cosa diventare, e la scelta non
   costa un calcolo in più: è quello che il calcolo del gradino compra.

   ── la regola che tiene in piedi tutto ──
   **I due rami valgono lo stesso.** Cambia la forma del danno — tutto
   in un colpo o spalmato, su uno o su molti, subito o nel tempo — non
   la quantità. Il perché non è estetico: `pianoDi`, `difesaCon`,
   `durezzaDi` e la tabella delle vite in `taratura-castello.js` sono
   tutti costruiti su `dpsDi(tipo, livello)`. Se un ramo fosse più
   forte, il bambino che sceglie bene troverebbe le tappe facili e
   quello che sceglie male impossibili, e il taratore non saprebbe più
   quale delle due partite sta misurando. Con i rami a pari valore il
   modello può continuare a **ignorarli**, ed è quello che fa.

   I numeri qui sotto vanno letti come moltiplicatori del caso base, e
   il conto da far tornare è quello di `dpsDi`: danno × salve ÷
   ricarica. Il veleno conta come danno, solo che arriva dopo.

     cecchino   1,7 ÷ 1,7 = 1     e vede il 30% più lontano
     raffica    0,55 × 2 ÷ 1,1 = 1  su due bersagli diversi
     veleno     0,4 subito + 0,6 nel tempo = 1
     catena     0,7 sul primo, metà sul rimbalzo: perde sul solo,
                guadagna sul gruppo
     mortaio    1,5 ÷ 1,5 = 1     e arriva molto più lontano
     napalm     0,45 + 0,55 che brucia = 1, su un'area più larga

   Il ghiaccio è fuori dal conto perché non fa danno: i suoi due rami si
   dividono fra largo-e-gentile e stretto-e-cattivo, e la brina in più
   rende fragile chi ha gelato — l'unico modo in cui una torre che non
   ferisce può far male. */
export const RAMI = {
  cecchino: { danno: 1.7,  ricarica: 1.7, raggio: 1.3 },
  raffica:  { danno: 0.55, ricarica: 1.1, salve: 2 },
  veleno:   { danno: 0.4,  veleno: 0.6,   durata: 3 },
  catena:   { danno: 0.7,  rimbalzi: 2 },
  bufera:   { area: 1.55,  freno: 0.78,   raggio: 1.15 },
  brina:    { area: 0.85,  freno: 1.18,   fragile: 1.25 },
  mortaio:  { danno: 1.5,  ricarica: 1.5, raggio: 1.35, area: 0.85 },
  napalm:   { danno: 0.45, veleno: 0.55,  durata: 4, area: 1.25 },
}

/* Da che gradino si sceglie. Quarto: prima ci sono tre salite per
   capire *che cosa fa* la torre così com'è, e chi non ha ancora capito
   non ha niente da decidere. */
export const RAMI_DA = 4

/* Come tira la torre `k` al livello `lv`, per il ramo che ha preso: è
   l'unica funzione che il gioco interroga quando spara, e la stessa che
   il modello usa per i conti — che infatti la chiama senza ramo. */
export function tiroDi(k, lv, ramo = null) {
  const c = crescitaDi(k), n = Math.max(0, lv - 1), T = TORRI[k]
  const r = RAMI[ramo] || {}
  const danno = T.danno * (1 + n * c.danno)
  return {
    danno: danno * (r.danno ?? 1),
    ricarica: T.ricarica / (1 + n * c.cadenza) * (r.ricarica ?? 1),
    area: T.area * (1 + n * c.area) * (r.area ?? 1),
    salve: r.salve || (c.salveDa && lv >= c.salveDa ? c.salve : 1),
    /* quanto male continua a fare dopo il colpo, e per quanto */
    veleno: r.veleno ? danno * r.veleno : 0,
    durata: r.durata || 0,
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
   salendo di livello frena di più *e* dura di più. Prima saliva solo la
   durata, e potenziare il ghiaccio era l'unico potenziamento che non si
   vedeva. Il freno si ferma al 70%: un nemico bloccato del tutto non è
   più un nemico, è un bersaglio fermo, e la partita si spegne. */
export const geloDi = (lv, ramo = null) => {
  const r = RAMI[ramo] || {}
  return {
    freno: Math.min(0.75, (0.45 + (lv - 1) * 0.028) * (r.freno ?? 1)),
    durata: 1.2 + (lv - 1) * 0.15,
    /* la brina non ferisce: rende fragile. Chi è gelato da lei prende
       più danno da tutti gli altri, ed è il modo in cui una torre che
       non fa male diventa la più importante del campo. */
    fragile: r.fragile || 1,
  }
}

/* Quanto vale una torre, in danni al secondo, al livello che ha. Il colpo a
   zona conta di più di quello che dice il danno secco, perché prende più di
   un nemico per volta: il raggio d'esplosione lo si paga in questa
   maggiorazione. */
export function dpsDi(k, lv = 1) {
  const t = tiroDi(k, lv)
  return t.danno * t.salve / t.ricarica * (1 + (t.area || 0) / 90)
}

/* l'arciere di livello 1: l'unità di misura di tutto */
const DPS = dpsDi('add', 1)

/* Le tappe non danno tutte le stesse torri, e le torri non si equivalgono: il
   ghiaccio non fa un danno che sia uno — tiene fermi i nemici, e vale come
   tempo in più per sparare — mentre magica e bombe rendono più dell'arciere.
   Chi gioca le alterna, quindi la potenza vera di una tappa è quella media,
   corretta per il gelo. Senza questo conto il modello prometteva una difesa
   che nelle ultime tappe non c'era.

   ── quanto vale il gelo, e perché questo numero è approssimativo ──

   Valeva 0,45, ed era tarato su un campo che non esiste più. Quando le
   piazzole si occupavano dal castello, gelare un nemico gli toglieva gli
   ultimi metri, cioè niente: il tempo era già finito. Adesso le torri
   stanno in testa al percorso e gelare un nemico appena entrato gli
   allunga **tutta** la strada che ha davanti.

   Misurato con il simulatore — si cerca per bisezione il moltiplicatore di
   vita che il giocatore modello regge ancora, con e senza il ghiaccio fra
   i tipi disponibili — il coefficiente che servirebbe va da 1,3 a 5,0.
   Non è una costante, e non fingiamo che lo sia: quello che decide non è
   quante torri ci sono ma **da che ondata il ghiaccio è in campo**. Dove
   arriva terzo su tre e tardi (La gola, Il camminamento) non sposta
   niente; dove arriva in tempo (Il corridoio, Il torrione) vale dal 30 al
   40% di vita nemica in più sopportata; nella partita libera, dove si
   comprano quattro torri e il gelo c'è quasi da subito, vale il 70%.

   1,5 è il numero onesto: è quello che fa dire al modello «il ghiaccio
   vale grosso modo quanto una torre che spara», ed è quello che undici
   misure su quattordici confermano. Le tre tappe dove il ghiaccio vale di
   più restano sottostimate, e va bene così — sbagliare per difetto qui
   vuol dire credere la difesa più debole di com'è, che è il verso giusto
   in cui sbagliare.

   Il limite vero non è il numero, è la formula: `quotaGelo` conta i tipi
   che la tappa **offre**, non le torri che il bambino **costruisce**. In
   nove tappe su dodici il metro ne compra due e il ghiaccio non lo mette
   mai in campo, eppure il modello gliene sconta un quarto. Per aggiustarlo
   davvero servirebbe che `resaTipi` sapesse la difesa, e non la sa. */
export const VALE_IL_GELO = 1.5
export function resaTipi(tipi, lv = 1) {
  const medio = tipi.reduce((s, k) => s + dpsDi(k, lv), 0) / tipi.length
  const quotaGelo = tipi.filter(k => !TORRI[k].danno).length / tipi.length
  return (medio / DPS) * (1 + quotaGelo * VALE_IL_GELO)
}

/* La potenza di una difesa: ogni torre in campo vale la media di quelle
   che la tappa mette a disposizione, al livello che ha. Da quando ogni
   torre cresce a modo suo il livello non si può più mettere fuori dalla
   media — un arciere di livello 10 e una bombarda di livello 10 non
   valgono più la stessa cosa. */
export const potenzaDi = (tipi, livelli) =>
  livelli.reduce((s, lv) => s + DPS * resaTipi(tipi && tipi.length ? tipi : ['add'], lv), 0)

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
   Dove la tabella non arriva — la partita libera, che non finisce mai —
   resta la vecchia curva. */
export function vitaNemico(tappa, onda) {
  const v = tappa.vite
  if (!v || !v.length) return vitaDiOnda(onda, tappa.durezza)
  if (onda <= v.length) return v[onda - 1]
  /* oltre la tabella c'è solo la partita libera, che non finisce mai e
     quindi non si può tabellare: si continua con la stessa progressione
     con cui saliva, e prima o poi vince lei — è il punto di quella
     modalità */
  return Math.round(v[v.length - 1] * Math.pow(tappa.oltre || 1.2, onda - v.length))
}
export const velocitaNemico = (tappa, onda) =>
  (CFG.velBase + onda * CFG.velPiu) * (0.85 + 0.15 * tappa.durezza)

export const costoNuovaTorre = quante => CFG.costruzione + CFG.costruzionePiu * quante
export const costoSalita = lv => CFG.potenziamento + CFG.potenziamentoPiu * (lv - 1)

/* ═══════════ dal bersaglio alla tappa ═══════════

   Le quattro funzioni che rovesciano il modello. Si leggono in fila:
   una tappa dichiara `calcoli` e `cap`, e da lì esce tutto il resto.  */

/* ── il piano ──
   I `calcoli` acquisti di chi gioca bene, nell'ordine in cui li fa:
   prima due torri per non restare scoperto, poi sempre il gradino più
   conveniente fra salire la torre più bassa e costruirne una nuova. È
   la stessa strategia di `difesaCon` e del giocatore finto del
   simulatore — deve essere la stessa, o il bersaglio si centrerebbe su
   un bambino che non esiste. Qui le postazioni non fanno da tetto: il
   piano dice di quante c'è bisogno, e `postiDi` gliene dà almeno
   tante. */
export function pianoDi({ calcoli, cap }) {
  const torri = [], passi = []
  for (let k = 0; k < calcoli; k++) {
    const nuova = costoNuovaTorre(torri.length)
    const piuBassa = torri.length ? Math.min(...torri) : null
    const salita = piuBassa != null && piuBassa < cap ? costoSalita(piuBassa) : Infinity
    if (torri.length < 2) { passi.push(nuova); torri.push(1); continue }
    if (salita <= nuova) { passi.push(salita); torri[torri.indexOf(piuBassa)]++ }
    else { passi.push(nuova); torri.push(1) }
  }
  return { torri, passi, costo: passi.reduce((s, x) => s + x, 0) }
}

/* quanto lascia in mano un'ondata a chi la chiude senza far passare
   nessuno: i nemici fermati più i due premi di fine ondata. Il bonus
   della fretta non c'è dentro apposta — è un premio, non un dovuto, e
   il modello non deve contare su una scelta che il bambino può non
   fare. */
export const entrataOnda = o => nemiciDiOnda(o) * CFG.perNemico + CFG.fineOnda + CFG.ondataPulita

/* le due torri con cui si comincia: è il pavimento sotto a `partenzaDi`
   e la sola parte del piano che le ondate non possono pagare, perché
   viene prima della prima */
const dueTorri = () => costoNuovaTorre(0) + costoNuovaTorre(1)

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
  const daGuadagnare = pianoDi(tappa).costo - dueTorri()
  let quante = 0, entrate = 0
  while (entrate + entrataOnda(quante + 1) <= daGuadagnare) entrate += entrataOnda(++quante)
  return Math.max(3, quante)
}

/* ── con quanta energia si comincia ──
   Quello che le ondate non arrivano a pagare, e mai meno di due torri:
   perdere la prima ondata è l'unico modo di perdere che non dipende da
   come si gioca. Chi non ha un bersaglio di calcoli — la partita
   libera — riceve due torri e mezza scaletta, come si è sempre fatto. */
export function partenzaDi(tappa) {
  if (!tappa.calcoli) {
    let e = dueTorri()
    for (let lv = 1; lv < Math.max(2, Math.ceil(tappa.cap / 2)); lv++) e += costoSalita(lv)
    return Math.round(e)
  }
  const ondate = tappa.ondate || ondateDi(tappa)
  let entrate = 0
  for (let o = 1; o <= ondate; o++) entrate += entrataOnda(o)
  return Math.max(dueTorri(), pianoDi(tappa).costo - entrate)
}

/* ── quante postazioni ──

   Il minimo è quello che serve: le piazzole che il piano occupa più una
   di respiro, e mai meno delle torri che la tappa mette a disposizione.
   La seconda condizione non è estetica — quasi ogni ondata arriva con un
   punto debole dichiarato in anticipo, e poter mettere in campo la torre
   giusta è la scelta che il gioco chiede. Se le piazzole fossero meno dei
   tipi, quella scelta sarebbe finta.

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
export const PIAZZOLE = { bosco: 4, sotterraneo: 6, mura: 8 }
export function postiDi(tappa) {
  const minimo = Math.max(3, pianoDi(tappa).torri.length + 1, (tappa.torri || []).length)
  return Math.max(minimo, PIAZZOLE[tappa.campagna] || 0)
}

/* comprare tutto: occupare ogni posto e portare ogni torre in cima. Serve
   a controllare che la tappa abbia sempre più da vendere di quanto il
   bambino possa comprare. */
export function costoDifesaPiena({ posti, cap }) {
  let costo = 0
  for (let i = 0; i < posti; i++) {
    costo += costoNuovaTorre(i)
    for (let lv = 1; lv < cap; lv++) costo += costoSalita(lv)
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

/* il tetto: quella di chi gioca bene *e* corre, prendendosi anche il
   bonus della fretta a ogni chiamata. Non è la misura su cui si tara —
   è il margine che resta a chi gioca meglio del modello. */
export function energiaMassima({ ondate, partenza }) {
  return energiaAll(ondate + 1, partenza) + CFG.bonusPronti * ondate
}

/* ── cosa ci si compra con l'energia che si ha in mano ──
   È il giocatore modello: prima due torri per non restare scoperto, poi
   sempre il gradino più conveniente fra salire la torre più bassa e
   costruirne una nuova. È la stessa strategia che il test gioca davvero,
   ed è il piano di `pianoDi` con un tetto di postazioni e un portafoglio. */
export function difesaCon(energia, { cap, posti, torri: tipi }) {
  const torri = []
  let resta = energia
  for (let giro = 0; giro < 200; giro++) {
    const nuova = costoNuovaTorre(torri.length)
    const piuBassa = torri.length ? Math.min(...torri) : null
    const salita = piuBassa != null && piuBassa < cap ? costoSalita(piuBassa) : Infinity
    const possoNuova = torri.length < posti && resta >= nuova
    if (torri.length < 2 && possoNuova) { resta -= nuova; torri.push(1); continue }
    if (salita <= resta && (salita <= nuova || !possoNuova)) {
      resta -= salita; torri[torri.indexOf(piuBassa)]++; continue
    }
    if (possoNuova) { resta -= nuova; torri.push(1); continue }
    break
  }
  return { torri, potenza: potenzaDi(tipi, torri), resta }
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
export function margineDi({ cap, posti, partenza, durezza, torri }, o) {
  const { potenza } = difesaCon(energiaAll(o, partenza), { cap, posti, torri })
  const danno = potenza * durataOnda(o) * RESA
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
   ghiaccio non si confrontano con lo stesso metro. */
export const faticaDi = t => t.durezza / resaTipi(t.torri)

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
export function difesaLarga(energia, { posti, torri: tipi }) {
  const torri = []
  let resta = energia
  while (torri.length < posti && resta >= costoNuovaTorre(torri.length)) {
    resta -= costoNuovaTorre(torri.length); torri.push(1)
  }
  return { torri, potenza: potenzaDi(tipi, torri), resta }
}

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
    CFG, CRESCITA, GEOMETRIA, MONDO, VALE_IL_GELO, RAMI, RAMI_DA,
    Object.entries(TORRI).map(([k, T]) => [k, T.danno, T.ricarica, T.area, T.raggio, !!T.gela]),
    RACCONTO.map(t => [chiaveTappa(t), t.calcoli, t.cap, t.torri, t.mostri,
                       !!t.debolezze, !!t.rami, t.forma]),
    // `durezza` c'è dentro perché muove la **velocità** dei nemici: una
    // tappa tarata su mostri più lenti non è la stessa tappa
    TAPPE.map(t => [t.ondate, t.posti, t.partenza, t.attesa, t.durezza]),
  ])
  let h = 5381
  for (let i = 0; i < roba.length; i++) h = ((h * 33) ^ roba.charCodeAt(i)) >>> 0
  return h.toString(16)
}
export const firmaTaratura = () => FIRMA

/* La partita libera non finisce: le ondate continuano, i nemici crescono
   di vita e di velocità a ogni giro, e prima o poi si perde — è quello il
   punto. Il modello dice dove cede (test unita/castello lo stampa). */
export const LIBERA = {
  nome: 'Partita libera', emoji: '♾️', ondate: Infinity, posti: 14, cap: 10,
  torri: ['add', 'sub', 'mul', 'div'], forma: RACCONTO[3].forma,
  /* la forma è quella del folto, e il terreno va detto: senza, si
     dipingerebbe il bosco di mezzogiorno sopra il tracciato sbagliato */
  ambiente: 'bosco-fitto',
  debolezze: true, rami: true,            // tutto aperto: è la modalità di chi sa già
  mostri: null,                           // i mostri li pesca tutti, vedi data/mostri.js
  partenza: partenzaDi({ cap: 4 }), durezza: 1, attesa: 30,
  /* le prime venti ondate sono tarate come una tappa; dopo, la vita
     continua a salire di questo passo e prima o poi vince lei */
  vite: VITE['Partita libera'], oltre: OLTRE,
}
