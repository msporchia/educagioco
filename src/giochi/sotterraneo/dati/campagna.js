/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — sei discese, una sotto l'altra

   Una tappa è **lo stesso sotterraneo con altri numeri**: un piano più
   largo, più stanze, più piani da fare prima di risalire, e domande più
   toste. Non c'è un motore diverso per nessuna di loro.

   ── COSA RESTA FRA UNA DISCESA E L'ALTRA: NIENTE ──────────────────
   È la domanda grossa che il prototipo lasciava aperta, e la risposta
   scelta qui è la più semplice delle due: **dentro** una discesa
   l'equipaggiamento scende con te di piano in piano, e quello è l'arco
   che dà senso a cercare una spada; **fra** una discesa e l'altra si
   riparte nudi. Quello che resta è la campagna — le tappe superate, le
   stelle — e le monete vere, che stanno nel profilo e si spendono
   altrove.

   Il motivo non è pigrizia: un equipaggiamento che persiste vuole
   un'economia (dove si ripara, cosa si rivende, come si evita che la
   tappa 6 sia una passeggiata per chi ha l'ascia) e quella economia è
   un altro gioco. Se un giorno la si vuole, si cambia qui e in
   `Gioco.vue` dove nasce la `Corsa` — il motore non se ne accorge.

   ── LA DIFFICOLTÀ È UNA MANOPOLA SOLA, E SALE IN DUE MODI ─────────
   `dif` sono i due estremi da 0 a 1 (come vuole `quiz/scelta.js`): la
   prima è la difficoltà al primo piano, la seconda quella dell'ultimo.
   Fra i due si sale in linea retta (`durezzaDi`). Poi ogni cosa
   **rincara per conto suo** — un forziere chiede più di una porta — e
   quello sta in `motore/corsa.js` con i suoi motivi. Così un bambino
   prudente vede domande più facili di uno che va a caccia di scrigni,
   e le vede nella stessa tappa.

   ── LE STANZE SONO POCHE ALL'INIZIO, E NON È UN CASO ──────────────
   Il prototipo faceva sedici stanze in un piano 52×52, e la prima cosa
   scritta sotto «cosa manca» era che sono forse troppe per una seduta:
   se il piano non si finisce mai, la scala smette di essere un
   traguardo. Qui `giri` è il numero di tagli del BSP — 2 giri fanno
   quattro stanze, 4 ne fanno sedici — e la campagna comincia da quattro.
   ═══════════════════════════════════════════════════════════════════ */

/* `portata` è dove sta la tappa sulla scala 0-100 di `data/portata.js`,
   e dice a chi va offerta. Qui NON c'è `scuola`, ed è una dichiarazione,
   non una dimenticanza: quello che questa campagna insegna non lo dà
   nessuna scuola, quindi la sua testa non si taglia mai per età — le
   prime tappe restano a disposizione anche di chi arriva grande, che
   altrimenti non imparerebbe mai come si gioca. Si taglia solo in alto. */
export const CAMPAGNA = [
  { chiave: 'cantine', nome: 'Le cantine', icona: '🕯️',
    portata: 25,
    dritta: 'due piani corti: si impara la strada',
    piani: 2, misura: 30, giri: 2, dif: [0.05, 0.22],
    guardiano: 'scheletro', capo: 'scheletro', premio: 10 },

  { chiave: 'pozzo', nome: 'Il pozzo', icona: '🪣',
    portata: 32,
    dritta: 'più stanze, e qualcuno che vende',
    piani: 3, misura: 34, giri: 3, dif: [0.12, 0.34],
    guardiano: 'scheletro', capo: 'orco', premio: 14 },

  { chiave: 'gallerie', nome: 'Le gallerie', icona: '🪨',
    portata: 40,
    dritta: 'ci si picchia sul serio',
    piani: 3, misura: 40, giri: 3, dif: [0.22, 0.5],
    guardiano: 'orco', capo: 'orco', premio: 18 },

  { chiave: 'cisterna', nome: 'La cisterna', icona: '💧',
    portata: 48,
    dritta: 'larga, e in fondo c\'è qualcosa di grosso',
    piani: 4, misura: 44, giri: 3, dif: [0.32, 0.62],
    /* ── i guardiani non sono più tutti l'orco ──
       Quattro tappe di fila avevano lo stesso guardiano a ogni piano, e
       il guardiano è quello che si incontra **per forza**: era la faccia
       che un bambino vedeva più di ogni altra, quattro discese di
       seguito. Adesso la cisterna la guarda un granchio e il labirinto
       un lupo — costano quanto l'orco (`dati/mostri.js` li tiene nella
       stessa fascia, e un controllo lo pretende), e in più stanno nel
       posto giusto: un granchio in una cisterna, un lupo dove ci si
       perde. Misurato col banco: le sei discese si vincono come prima. */
    guardiano: 'granchio', capo: 'gigante', premio: 22 },

  { chiave: 'labirinto', nome: 'Il labirinto', icona: '🌀',
    portata: 56,
    dritta: 'sedici stanze: senza mappina ci si perde',
    piani: 3, misura: 52, giri: 4, dif: [0.42, 0.76],
    /* il troll e non il gigante, e non è una taratura: le ultime tre
       discese finivano tutte con la stessa faccia, e il capo è l'unica
       cosa di una tappa che si è **sicuri** di vedere. Vale un gigante
       a meno di due punti di ossa (`dati/mostri.js`), quindi quello che
       cambia è chi si incontra, non quanto costa */
    guardiano: 'lupo', capo: 'troll', premio: 26 },

  { chiave: 'fondo', nome: 'Il fondo', icona: '🕳️',
    portata: 64,
    dritta: 'stretto, profondo, e le domande non perdonano',
    /* stretto apposta: quattro piani da sedici stanze l'uno portavano la
       discesa oltre le novanta risposte obbligate, cioè fuori da una
       seduta. Il posto largo è il labirinto, qui si scende. */
    piani: 4, misura: 42, giri: 3, dif: [0.52, 0.92],
    /* il gigante **solo in fondo**: metterlo a guardia di ogni piano
       portava la discesa a novantasei risposte obbligate, cioè fuori da
       una seduta. Il numero non si vedeva leggendo la tabella — si vede
       solo contando, ed è il banco a contarlo.
       Per lo stesso motivo a guardia dei piani c'è il serpente e non
       l'orco: sono nella stessa fascia, ma il serpente è quello che si
       abbatte in meno colpi, e qui le domande arrivano già a 0.92 —
       quello che deve essere duro in fondo sono le domande, non il
       numero di volte che bisogna rispondere per passare una porta */
    guardiano: 'serpente', capo: 'gigante', premio: 34 },
]

export const QUANTE_TAPPE = CAMPAGNA.length

/* ═══════════════════════════════════════════════════════════════════
   L'ABISSO — sotto il fondo, e senza fondo

   Non è la settima discesa: è **un posto**, e la differenza non è di
   gusto. Una tappa 7 finirebbe come finisce la 6 — si risale, e
   l'equipaggiamento resta lì — mentre la frase da cui nasce tutto questo
   è «ho trovato un'arma super figa e ora ho finito la tappa e la butta».
   L'abisso toglie il confine amministrativo, non aggiunge contenuto.

   Perciò **non entra nella campagna**: `CAMPAGNA` resta di sei voci,
   `QUANTE_TAPPE` resta 6, `stelle` non cresce (è un oggetto dentro il
   profilo, e una chiave per piano su duecento piani finirebbe in ogni
   `persist()` per sempre) e `profile.campagne['sotterraneo'].tappa` non
   si muove. Si apre su `libera`, che è il campo che `giochi/campagne.js`
   scrive già quando le sei discese sono finite: un cancello che esiste
   invece di uno nuovo.

   L'indice è **−1** e non un settimo posto in fila, per la stessa
   ragione: `tappa` è un indice, e una fila che cresce sposta
   l'avanzamento di tutti senza che scatti niente.
   ═══════════════════════════════════════════════════════════════════ */
export const INDICE_ABISSO = -1

/* ── la difficoltà delle domande, e dove si ferma ──
   `dif` va da 0 a 1 e `quiz/scelta.js` la traduce in un punto dentro la
   finestra **dell'età del bambino**: a 1 si punta due anni sopra la sua
   età, che è il tetto dell'ammissione. Oltre non c'è niente da cercare —
   l'età sta sul bambino e non sulla domanda, ed è una regola di casa —
   quindi `dif` sale scendendo e, arrivata a 1, **ci resta appiccicata**.

   Il conto è corto: 0.92 · 0.94 · 0.96 · 0.98 · 1.00, cioè si arriva al
   tetto al **quinto piano** (`piano === 4`, che si conta da 0). Vale la
   pena scriverlo in faccia, perché è il punto in cui il gioco cambia
   natura: entro la prima serata l'abisso smette di diventare più
   difficile *da studiare*, e da lì in poi diventa solo più difficile da
   sopravvivere. Non è un difetto da rattoppare — la sesta tappa finisce
   già a 0.92, cioè a un soffio dal tetto, e l'headroom sulla scala
   scolastica è tutto lì. */
export const DIF_ABISSO = 0.92, DIF_PER_PIANO = 0.02
export const PIANO_DEL_TETTO = Math.ceil((1 - DIF_ABISSO) / DIF_PER_PIANO)  // 4, cioè il quinto

/* ── quante volte ci si può svegliare all'ingresso, quaggiù ──
   `svenimentiDi(tappa) = 4 + tappa.piani` non ha senso su una discesa
   che di piani non ne ha un numero. Il conto diventa: **tre per piano, e
   riparte scendendo**. Scendere è la cosa che si è guadagnata e rinnova
   le occasioni; accamparsi su un piano no.
   Tre è largo apposta: il banco ne misura sei ogni dieci piani, e il suo
   giocatore finto è avaro (non beve quasi mai, non compra niente). Morde
   solo sul piano andato storto — e il freno vero non è questo contatore,
   sono **le gemme**: chi sviene di continuo arriva al mercante con le
   tasche vuote e metà gemme, quindi non compra, quindi si ferma da sé. */
export const SVENIMENTI_PER_PIANO = 3

/* Le forme che il piano prende scendendo. Ciclano invece di crescere, ed
   è la regola che taglia quasi tutte le leve possibili: **quello che
   allunga un piano non lo indurisce**, e un sotterraneo più grande
   *sembra* più difficile mentre è solo più lungo. Sono le stesse tre
   misure che la campagna già usa, così quaranta piani non hanno tutti la
   stessa stanza senza che nessuno abbia dovuto renderli più cari. */
const FORME_DELL_ABISSO = [
  { misura: 34, giri: 3 },
  { misura: 42, giri: 3 },
  { misura: 52, giri: 4 },
]

export const L_ABISSO = {
  chiave: 'abisso', nome: 'L\'abisso', icona: '🕳️',
  abisso: true,
  dritta: 'si scende finché si regge',
  /* non ha un ultimo piano: è la riga che rende `allaScala()` e
     `scendi()` incapaci di chiudere la discesa da soli */
  piani: Infinity,
  misura: FORME_DELL_ABISSO[0].misura, giri: FORME_DELL_ABISSO[0].giri,
  forme: FORME_DELL_ABISSO,
  dif: [DIF_ABISSO, 1],
  /* ── chi guarda la scala, scendendo ──
     Era una scaletta corta e poi il gigante per sempre: `BRANCO` aveva
     quattro mostri e li esauriva entro i primi piani, quindi da lì in
     giù quello che cambiava erano solo le cifre. Stava scritto qui che
     la cura giusta non è una leva che allunga i piani ma **un quinto
     mostro, cioè un bestiario** — ed è quello che è stato fatto: le
     fasce del branco adesso sono cinque e tengono quattordici facce, e
     la scaletta di quaggiù arriva al golem prima del capo.

     I primi due piani li guarda **lo scheletro**, ed è misurato: qui si
     entra nudi, con addosso solo quello che si è imparato, e un orco a
     guardia della prima scala vuol dire svenire due volte prima di aver
     trovato un'arma. L'abisso si apre a chi ha finito sei discese: non
     ha bisogno di essere perdonato, ha bisogno di due piani per
     armarsi.

     Resta vero che dopo la scaletta c'è **un capo per sempre**
     (`guardianoDi` ripiega su `capo`), e resta un limite: la differenza
     è che adesso quello che si incontra *per strada* fra una scala e
     l'altra cambia per tutta la discesa, e prima no. */
  guardiani: ['scheletro', 'scheletro', 'orco', 'granchio', 'orco', 'golem', 'golem'],
  capo: 'gigante',
  /* ── la crescita ritarata, ed è il numero più importante di tutti ──
     `att: m.att + floor(piano / 2)` non ha tetto, la difesa dell'eroe sì
     (fra corazza, scudo e gioiello si arriva sì e no a 9), e
     `danno = m.att − dif`. Misurato: lasciando crescere il piano e basta
     ci si ferma **fra il settimo e l'undicesimo**, sempre, e non perché
     i mostri diventino lunghi da abbattere — perché **fanno troppo
     male**. Al piano 20 un orco picchia 14, e la metà arriva addosso
     anche rispondendo bene, perché il graffio è metà del colpo pieno:
     quattro scambi sono ventotto punti di vita a chi non ha sbagliato
     niente. Un terzo invece di mezzo, e la difesa dei mostri ferma per
     sempre — quella entra in una sottrazione, e allunga invece di
     indurire. */
  attOgni: 3,
  /* niente `portata`: non è una tappa, non sta in `TAPPE_DEL_GIOCO`, e
     il suo cancello non è l'età ma «hai finito le sei discese» — che è
     un criterio migliore, perché è dimostrato invece che stimato */
}

/* La tappa di un indice, l'abisso compreso. Un posto solo, perché
   `CAMPAGNA[-1]` è `undefined` e un `undefined` che arriva dentro una
   `Corsa` non dà nessun errore: dà una discesa senza numeri. */
export const tappaDi = indice => (indice === INDICE_ABISSO ? L_ABISSO : CAMPAGNA[indice])

/* Che forma ha il piano `piano` (da 0). Nella campagna è quella
   dichiarata dalla tappa e non cambia mai; nell'abisso gira fra le tre. */
export function formaDi(tappa, piano) {
  if (!tappa.forme) return { misura: tappa.misura, giri: tappa.giri }
  return tappa.forme[((piano % tappa.forme.length) + tappa.forme.length) % tappa.forme.length]
}

/* Quanto crescono i mostri scendendo. `ossa` è la leva principale — è
   quella che il bottino compensa — e l'attacco la segue più piano: se
   crescessero insieme allo stesso passo il gioco diventerebbe lungo, se
   crescesse solo l'attacco diventerebbe una lotteria. */
export const OSSA_PER_PIANO = 0.22
export const crescitaDi = tappa => ({
  ossa: OSSA_PER_PIANO,
  /* la campagna resta a mezzo apposta: sono quattro piani al massimo,
     quindi il difetto misurato qui sopra non le arriva mai addosso, e
     cambiarglielo sposterebbe l'equilibrio di sei tappe già misurate
     senza comprare niente */
  attOgni: tappa && tappa.attOgni ? tappa.attOgni : 2,
})

/* Quanto è difficile una domanda al piano `piano` (da 0) di una tappa.
   Un solo piano vuol dire un solo numero: si prende il primo, e non la
   media, perché il primo è quello che il bambino vede appena entra. */
export function durezzaDi(tappa, piano) {
  const [da, a] = tappa.dif
  /* l'abisso non ha un ultimo piano su cui interpolare: sale di un passo
     fisso e si ferma al tetto (vedi `PIANO_DEL_TETTO`) */
  if (tappa.abisso) return Math.min(a, da + DIF_PER_PIANO * Math.max(0, piano))
  if (tappa.piani <= 1) return da
  const q = Math.max(0, Math.min(1, piano / (tappa.piani - 1)))
  return da + (a - da) * q
}

/* ── QUANTE VOLTE CI SI PUÒ SVEGLIARE ALL'INGRESSO ─────────────────
   Svenire riportava all'ingresso, e basta: si poteva riprovare
   all'infinito, quindi **la discesa si vinceva comunque** — il banco lo
   dice senza mezzi termini, dodici discese su dodici anche rispondendo
   giusto quattro volte su dieci. Una tappa che si supera a caso non
   misura niente, e la stella in meno non è una risposta: si vede a cose
   fatte, e chi tira a caso non la stava guardando.

   Adesso c'è un fondo. Toccato quello si risale — la tappa non è
   superata e si rigioca da capo, che è la stessa fine di chi decide di
   smettere (`risali`). Il numero cresce coi piani, perché un piano è
   un'occasione in più di prenderle: quattro in regalo più uno per piano,
   cioè da sei nelle cantine a otto nel fondo.

   IL NUMERO È MISURATO, non scelto a occhio. Venti discese per tappa,
   nei due modi di giocare: a otto risposte giuste su dieci si arriva in
   fondo diciotto volte su venti o più (il patto del banco, e resta
   intero); a sei su dieci si arriva circa metà delle volte; a quattro
   su dieci — cioè tirando a caso — non si arriva quasi mai, salvo che
   nelle cantine, che sono la tappa dove si impara la strada e devono
   perdonare. Con un tetto più basso (tre in regalo) cadeva anche chi
   risponde bene, che è il difetto contrario. */
export const SVENIMENTI_IN_REGALO = 4
/* Nell'abisso il conto è un altro e si azzera scendendo: quello che
   torna qui è **quante occasioni ha questo piano**, e chi le conta è la
   `Corsa` (vedi `svenimentiSpesi`). */
export const svenimentiDi = tappa =>
  tappa.abisso ? SVENIMENTI_PER_PIANO : SVENIMENTI_IN_REGALO + tappa.piani

/* Chi porta la chiave, piano per piano: l'ultimo è il capo della tappa,
   gli altri il suo guardiano di tutti i giorni. La chiave della scala è
   l'unica cosa che in tutto il sotterraneo **non si può aggirare**, e
   per questo chi la porta lo dichiara la tappa e non il caso. */
export const guardianoDi = (tappa, piano) =>
  tappa.guardiani ? (tappa.guardiani[piano] || tappa.capo)
                  : (piano >= tappa.piani - 1 ? tappa.capo : tappa.guardiano)

/* Le stelle: si arriva in fondo, e la seconda e la terza dicono **come**.
   Svenire non fa perdere la discesa (ci si risveglia all'ingresso), ma
   si vede. */
export function stelleDella(esito) {
  if (!esito.vinta) return 0
  if (esito.svenimenti === 0) return 3
  if (esito.svenimenti === 1) return 2
  return 1
}

export function guastiDellaCampagna() {
  const g = []
  const viste = new Set()
  for (const t of CAMPAGNA) {
    if (viste.has(t.chiave)) g.push(`due tappe con la chiave "${t.chiave}"`)
    viste.add(t.chiave)
    if (!t.nome || !t.icona || !t.dritta) g.push(`${t.chiave}: senza nome, icona o dritta`)
    if (t.piani < 1) g.push(`${t.chiave}: zero piani`)
    if (t.misura < 24) g.push(`${t.chiave}: un piano ${t.misura}×${t.misura} non tiene le stanze`)
    if (t.giri < 2 || t.giri > 4) g.push(`${t.chiave}: ${t.giri} giri di taglio, fuori da 2..4`)
    const [da, a] = t.dif
    if (da < 0 || a > 1 || da > a) g.push(`${t.chiave}: difficoltà ${da}..${a} storta`)
    if (t.premio <= 0) g.push(`${t.chiave}: non paga niente`)
  }
  /* la campagna deve **salire**: due tappe di fila alla stessa
     difficoltà si giocano uguali e la seconda sembra una ripetizione */
  for (let i = 1; i < CAMPAGNA.length; i++)
    if (CAMPAGNA[i].dif[1] <= CAMPAGNA[i - 1].dif[1])
      g.push(`${CAMPAGNA[i].chiave} non chiede più di ${CAMPAGNA[i - 1].chiave}`)
  return g.concat(guastiDellAbisso())
}

/* L'abisso non passa dal controllo delle tappe — non ha `piani`, non ha
   `premio`, non ha `portata` — ma le due cose che lo romperebbero in
   silenzio sono le stesse: una forma che il generatore non sa fare, e
   una difficoltà fuori dalla scala dei quiz. */
export function guastiDellAbisso() {
  const g = []
  const a = L_ABISSO
  if (!a.nome || !a.icona || !a.dritta) g.push('l\'abisso: senza nome, icona o dritta')
  for (const f of a.forme || []) {
    if (f.misura < 24) g.push(`l'abisso: un piano ${f.misura}×${f.misura} non tiene le stanze`)
    if (f.giri < 2 || f.giri > 4) g.push(`l'abisso: ${f.giri} giri di taglio, fuori da 2..4`)
  }
  if (!a.forme || !a.forme.length) g.push('l\'abisso: nessuna forma di piano')
  if (a.dif[0] < 0 || a.dif[1] > 1 || a.dif[0] > a.dif[1])
    g.push(`l'abisso: difficoltà ${a.dif[0]}..${a.dif[1]} storta`)
  /* il tetto va toccato, e presto: se il passo fosse così piccolo da non
     arrivarci mai, la promessa scritta qui sopra sarebbe falsa */
  if (durezzaDi(a, PIANO_DEL_TETTO) < a.dif[1])
    g.push(`l'abisso: al piano ${PIANO_DEL_TETTO + 1} la difficoltà non è ancora al tetto`)
  if (!(a.guardiani || []).length || !a.guardiani.every(k => typeof k === 'string' && k))
    g.push('l\'abisso: la scaletta dei guardiani è vuota o storta')
  if (!a.capo) g.push('l\'abisso: nessun capo dopo la scaletta')
  if (a.attOgni < 3) g.push(`l'abisso: l'attacco cresce ogni ${a.attOgni} piani, troppo in fretta`)
  if (a.piani !== Infinity) g.push('l\'abisso ha un ultimo piano: non è più un abisso')
  return g
}

