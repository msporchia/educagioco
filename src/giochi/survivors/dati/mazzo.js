/* ═══════════════════════════════════════════════════════════════════
   IL MAZZO — le carte che si pagano

   A ogni salita di livello il gioco si ferma e propone tre carte. Non
   sono gratis: **ogni carta ha un prezzo in difficoltà**. La debole
   chiede una domanda facile, la forte una tosta, e il bambino sceglie
   *quanto lavorare*. È questa la decisione che rende la pausa un momento
   di gioco invece di un pedaggio: senza il prezzo, la scelta è «quale
   disegno mi piace», e la domanda è una tassa che si paga comunque.

   Chi sbaglia **non prende niente**: una monetina di consolazione e si
   torna in campo. Prima si dava la carta più debole delle tre, e il
   risultato era che tirando a caso ci si potenziava lo stesso — la
   domanda diventava un pedaggio che si pagava comunque, e chi rispondeva
   bene non ci guadagnava abbastanza. Adesso il potenziamento **si vince
   rispondendo**, e chi sbaglia perde il giro, non la partita: la moneta
   dice «ci hai provato», e il giro dopo arriva presto perché le gemme
   continuano a cadere.

   Le tre fasce non sono un'etichetta: sono **quanto quella carta cambia
   la partita**. Una freccia in più raddoppia il fuoco, la calamita fa
   solo volare le gemme un po' più da lontano.

   Ma la fascia non è tutto il prezzo: conta anche **quanto quella carta
   è già cresciuta**. La prima freccia in più costa quello che dice la
   sua fascia, la quinta costa molto di più — una capacità bassa chiede
   una domanda facile, la stessa capacità in alto ne chiede una tosta.
   Senza questo, prendere nove volte la stessa carta sarebbe nove volte
   lo stesso pedaggio, e la scelta si spegnerebbe dopo il terzo livello.

   Il gioco non sa che materie esistano: passa `prezzo` a
   `src/quiz/scelta.js` e riceve una domanda. Aggiungere una materia non
   vuol dire aprire questo file.

   Un'ultima cosa, ed è l'unica differenza fra la campagna e il gioco
   libero: **nella Sopravvivenza il mazzo non finisce**. Diciotto carte
   per settantacinque copie sono più di quante se ne prendano in una
   tappa di tre minuti, ma una partita libera si interrompe e si riprende
   e dura un pomeriggio — e quando le copie erano finite il livello
   saliva in silenzio. Il come e il perché stanno in fondo, a `resa`.
   ═══════════════════════════════════════════════════════════════════ */

export const FASCE = [
  { chiave: 'debole', nome: 'facile', prezzo: 0.15, colore: '#3fa34d' },
  { chiave: 'media',  nome: 'media',  prezzo: 0.50, colore: '#e08c1a' },
  { chiave: 'forte',  nome: 'tosta',  prezzo: 0.85, colore: '#d1481f' },
]

export const fascia = chiave => FASCE.find(f => f.chiave === chiave) || FASCE[0]

/* Le carte. `max` è quante volte si può cumulare, `chiaro` è cosa dà —
   una riga sola, che si legge sulla carta **prima** di sceglierla e
   torna nel brindisi dopo. Una riga: mentre si sceglie non si corre, ma
   tre righe di istruzioni per tre carte nessuno le legge lo stesso.

   `intera: true` vuol dire **quello che dà non si può dare a metà**: una
   freccia in più è una freccia, un cuore è un cuore, una cometa gira o
   non gira. Sono le carte che nel gioco libero il tetto ce l'hanno
   davvero, perché la mezza copia che le altre ammettono (vedi `resa`,
   in fondo) qui non vuol dire niente — e una freccia in più per sempre
   renderebbe immortali. Chi non lo dichiara cresce a frazioni. */
export const MAZZO = [
  /* ── deboli: comodità, non potenza ── */
  { chiave: 'mela',     nome: 'Mela curativa',   icona: '🍎', fascia: 'debole', max: 9, intera: true,
    chiaro: 'ti torna un cuore, subito' },
  { chiave: 'magnete',  nome: 'Calamita',        icona: '🧲', fascia: 'debole', max: 4,
    chiaro: 'le gemme volano da te da più lontano' },
  { chiave: 'stella',   nome: 'Stella fortunata',icona: '⭐', fascia: 'debole', max: 4,
    chiaro: 'ogni tanto una freccia fa il doppio del male' },
  /* Il dardo gelato ha preso il posto di «corpo piccolo», che rimpiccioliva
     l'eroe senza che si vedesse: un potenziamento che non si sente non è un
     premio. Questo invece si vede — il mostro diventa azzurro e arranca. */
  { chiave: 'dardo',    nome: 'Dardo di ghiaccio', icona: '🧊', fascia: 'debole', max: 4,
    chiaro: 'ogni tanto una freccia congela chi colpisce' },
  { chiave: 'fantasma', nome: 'Piedi fantasma',  icona: '👻', fascia: 'debole', max: 3,
    chiaro: 'dopo un colpo resti intoccabile più a lungo' },

  /* ── medie: cambiano come si gioca ── */
  { chiave: 'stivali',  nome: 'Stivali leggeri', icona: '👟', fascia: 'media', max: 5,
    chiaro: 'corri di più' },
  { chiave: 'lunghe',   nome: 'Frecce lunghe',   icona: '🎯', fascia: 'media', max: 4,
    chiaro: 'le frecce arrivano molto più lontano' },
  { chiave: 'gelo',     nome: 'Scudo di ghiaccio', icona: '❄️', fascia: 'media', max: 4,
    chiaro: 'chi ti si avvicina rallenta' },
  { chiave: 'spine',    nome: 'Armatura a spine', icona: '🦔', fascia: 'media', max: 3,
    chiaro: 'chi ti tocca si punge' },
  { chiave: 'gemme',    nome: 'Gemme doppie',    icona: '💎', fascia: 'media', max: 3,
    chiaro: 'ogni gemma vale di più: sali di livello prima' },
  { chiave: 'palla',    nome: 'Cometa in orbita', icona: '☄️', fascia: 'media', max: 4, intera: true,
    chiaro: 'una cometa ti gira intorno e travolge chi tocca' },
  { chiave: 'occhi',    nome: 'Occhi acuti',     icona: '👀', fascia: 'media', max: 3, intera: true,
    chiaro: 'le frecce passano attraverso i mostri' },

  /* ── forti: si sente subito ── */
  { chiave: 'frecce',   nome: 'Frecce gemelle',  icona: '🏹', fascia: 'forte', max: 5, intera: true,
    chiaro: 'una freccia in più a ogni tiro' },
  { chiave: 'mani',     nome: 'Mani veloci',     icona: '⚡', fascia: 'forte', max: 5,
    chiaro: 'spari molto più spesso' },
  { chiave: 'grandi',   nome: 'Frecce grosse',   icona: '💥', fascia: 'forte', max: 4,
    chiaro: 'le frecce fanno molto più male' },
  { chiave: 'cuore',    nome: 'Cuore grande',    icona: '❤️', fascia: 'forte', max: 3, intera: true,
    chiaro: 'un cuore in più, e te lo riempie' },
  { chiave: 'fuoco',    nome: 'Anello di fuoco', icona: '🔥', fascia: 'forte', max: 4,
    chiaro: 'ogni tanto esplodi tutto intorno a te' },
  { chiave: 'fulmine',  nome: 'Fulmine',         icona: '🌩️', fascia: 'forte', max: 4,
    chiaro: 'ogni tanto un mostro viene incenerito' },
]

export const carta = chiave => MAZZO.find(c => c.chiave === chiave) || null

/* ═══════════ QUANTO COSTA UNA CARTA ═══════════
   Il prezzo di una carta in difficoltà di domanda (0..1) ha tre pezzi,
   e stanno tutti e tre dichiarati qui dentro:

     la fascia    quanto quella carta cambia la partita (0.15 · 0.50 · 0.85)
     il rincaro   la tappa alza l'asticella andando avanti, così la carta
                  facile della nona tappa non è quella della prima
     la maturità  a che punto è **quella carta** — `lv` copie già prese
                  su `max` possibili

   La maturità si mangia una fetta della strada che resta fino a 1:
   `MATURITA` dice quanta ne mangia l'ultima copia possibile. A 0.7 una
   carta media (0.50) all'ultimo livello costa 0.85, cioè quanto una
   tosta appena vista — che è il punto: la quinta copia di «frecce
   gemelle» non si paga come la prima. Contando la strada che resta
   invece di una quota fissa, il prezzo **non esce mai da 0..1** e le
   carte già care (le forti) salgono meno, perché sopra di loro c'è
   meno cielo. */
export const MATURITA = 0.7

/* A che punto è una carta, da 0 (mai presa) a 1 (l'ultima copia
   possibile). Si normalizza sul `max` della carta: la seconda mela su
   nove è appena partita, il secondo «corpo piccolo» su tre è a metà. */
export const maturita = (lv = 0, max = 1) =>
  max > 1 ? Math.max(0, Math.min(1, lv / (max - 1))) : 0

export const prezzoDomanda = (chiaveFascia, rincaro = 0, lv = 0, max = 1) => {
  const base = Math.max(0, Math.min(1, fascia(chiaveFascia).prezzo + rincaro))
  return base + (1 - base) * MATURITA * maturita(lv, max)
}

/* ═══════════ OLTRE IL TETTO — soltanto dove la partita non finisce ═══════════
   Nella Sopravvivenza si sta in campo finché la marea non vince, e
   **le carte finivano prima della marea**. Misurato al banco: un
   giocatore che schiva bene e risponde a tutto porta a zero le tredici
   carte che cambiano davvero la partita intorno al livello 50, dopo
   dodici o tredici minuti, e da lì in poi ogni salita di livello gli
   offriva solo gli avanzi deboli; finiti anche quelli — e ci si arriva,
   perché una partita libera si può interrompere e riprendere
   (`motore/sosta.js`), quindi dura un pomeriggio — `offri()` tornava
   `null`: il livello saliva **in silenzio**, senza pausa, senza domanda
   e senza carta, e le gemme non servivano più a niente.

   Dichiarare vittoria era l'altra strada, e si è scartata: il gioco
   libero ha un record (`gioco.js`, `SENZA_FINE`), e una vittoria gli
   metterebbe un tetto sopra — battere il proprio primato smetterebbe di
   essere il motivo per rigiocare.

   Quindi nel gioco libero **una carta non ha tetto**, e le copie oltre
   il suo `max` rendono ogni volta meno: la prima in più vale
   `RESA_OLTRE` di un grado vero, la seconda `RESA_OLTRE²`, la terza
   `RESA_OLTRE³`… È una serie geometrica, e il suo limite è la ragione
   per cui questo non rende immortali: **tutte le copie in più di una
   carta, quante se ne prendano, non arrivano a valere due gradi veri**
   (`RESA_TOTALE` = 1,5). La potenza dell'eroe smette di raddoppiare
   mentre la marea continua (×1,95 di vita ogni tappa-tipo, vedi
   `taratura.js`): la partita finisce perché la marea vince, non perché
   il mazzo si è svuotato.

   Due cose che restano fuori:

   - **la campagna**, che non passa da qui. Le nove tappe sono tarate
     sui tetti veri e hanno i loro test: `Partita` chiede la resa solo
     quando `regole.infinita`, e dentro una tappa la resa coincide col
     numero di copie. Non cambia un numero.
   - **le carte `intera`**, che danno una cosa che non si può dare a
     metà (vedi il mazzo qui sopra).

   Il prezzo, oltre il tetto, resta quello dell'ultima copia: `maturita`
   si ferma a 1 e la difficoltà di una domanda è una manopola da 0 a 1 —
   non c'è niente sopra «la più tosta». Va bene così: si continua a
   pagare il massimo, e quello che si prende è sempre meno. */
export const RESA_OLTRE = 0.6
export const RESA_TOTALE = RESA_OLTRE / (1 - RESA_OLTRE)

export const resa = (lv = 0, max = 1) => {
  if (!(lv > max)) return Math.max(0, lv)
  /* la somma delle prime `n` potenze di RESA_OLTRE, in chiuso: scritta a
     ciclo sarebbe la stessa cosa, ma qui si legge che ha un limite */
  const n = lv - max
  return max + RESA_TOTALE * (1 - Math.pow(RESA_OLTRE, n))
}

/* Fin dove si può cumulare una carta. In campagna è il suo `max` e non
   si discute; nel gioco libero non c'è tetto, tranne per le carte che
   danno una cosa intera. */
export const tettoDi = (c, infinita = false) =>
  infinita && !c.intera ? Infinity : c.max

/* ═══════════ IL PREZZO COME SI VEDE ═══════════
   Sulla carta il prezzo si legge dai pallini, e i pallini devono dire
   il prezzo **di adesso**, non quello della fascia: se una carta media
   già a livello 4 costa quanto una tosta, il bambino lo deve vedere
   prima di sceglierla — altrimenti sceglie a scommessa invece che a
   ragione. Cinque pallini, uno ogni due decimi. */
export const PALLINI = 5

export const palliniDelPrezzo = prezzo =>
  Math.max(1, Math.min(PALLINI, Math.round(prezzo * PALLINI)))

/* Nome e colore del prezzo: la fascia più alta che quel prezzo si è già
   guadagnata. Una carta debole cresciuta può dire «media» in arancione,
   ed è giusto così — l'etichetta parla del prezzo, non della potenza. */
export const scalinoDelPrezzo = prezzo => {
  let trovata = FASCE[0]
  for (const f of FASCE) if (prezzo >= f.prezzo - 1e-9) trovata = f
  return trovata
}

export function guastiDelMazzo(mazzo = MAZZO, fasce = FASCE) {
  const guasti = []
  const viste = new Set()
  for (const c of mazzo) {
    const dove = `carta "${c.chiave}"`
    if (viste.has(c.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(c.chiave)
    if (!c.nome || !c.icona || !c.chiaro) guasti.push(`${dove}: senza nome, icona o spiegazione`)
    if (!(c.max >= 1)) guasti.push(`${dove}: max ${c.max}`)
    if (!fasce.some(f => f.chiave === c.fascia)) guasti.push(`${dove}: fascia "${c.fascia}" sconosciuta`)
    /* il nome sta su una riga sola di un telefono: più lungo di così va a
       capo e la carta cresce fino a mangiarsi le altre due */
    if (c.nome.length > 22) guasti.push(`${dove}: nome lungo ${c.nome.length} caratteri`)
  }
  /* ogni fascia deve avere di che comporre l'offerta anche quando
     qualcuna è già stata presa al massimo: sotto tre carte, la terna
     comincia a ripiegare quasi subito */
  for (const f of fasce) {
    const quante = mazzo.filter(c => c.fascia === f.chiave).length
    if (quante < 3) guasti.push(`la fascia "${f.chiave}" ha solo ${quante} carte`)
  }
  /* le fasce sono una scala di prezzo: se la media non costa più della
     debole, scegliere non vuol dire niente */
  for (let i = 1; i < fasce.length; i++)
    if (!(fasce[i].prezzo > fasce[i - 1].prezzo))
      guasti.push(`la fascia "${fasce[i].chiave}" non costa più di "${fasce[i - 1].chiave}"`)
  if (!(fasce[0].prezzo >= 0 && fasce.at(-1).prezzo <= 1))
    guasti.push('i prezzi escono da 0..1: la difficoltà dei quiz è una manopola da 0 a 1')
  /* la maturità è una fetta della strada che resta: fuori da 0..1 non
     vuol dire niente, e a 0 la scala del livello non esisterebbe */
  if (!(MATURITA > 0 && MATURITA <= 1))
    guasti.push(`la maturità vale ${MATURITA}: non è una fetta di 0..1`)

  /* ── la scala del livello ──
     Per ogni carta, copia dopo copia e con qualunque rincaro della
     campagna (0..0.3, vedi `campagna.js`): il prezzo non torna mai
     indietro e non esce da 0..1. E senza rincaro l'ultima copia deve
     costare **sensibilmente** più della prima, o la scala è un
     arrotondamento e tanto valeva non farla. */
  for (const c of mazzo) {
    if (!fasce.some(f => f.chiave === c.fascia)) continue
    for (const rincaro of [0, 0.15, 0.3]) {
      let prima = -1
      for (let lv = 0; lv < Math.max(1, c.max); lv++) {
        const p = prezzoDomanda(c.fascia, rincaro, lv, c.max)
        if (!(p >= 0 && p <= 1))
          guasti.push(`carta "${c.chiave}" a livello ${lv} (rincaro ${rincaro}): prezzo ${p.toFixed(3)} fuori da 0..1`)
        if (p < prima - 1e-9)
          guasti.push(`carta "${c.chiave}": a livello ${lv} costa meno che a ${lv - 1}`)
        prima = p
      }
    }
    const nuova = prezzoDomanda(c.fascia, 0, 0, c.max)
    const matura = prezzoDomanda(c.fascia, 0, c.max - 1, c.max)
    if (nuova !== fascia(c.fascia).prezzo)
      guasti.push(`carta "${c.chiave}": la prima copia non costa quanto la sua fascia`)
    if (c.max > 1 && !(matura - nuova >= 0.05))
      guasti.push(`carta "${c.chiave}": dalla prima all'ultima copia il prezzo sale di ${(matura - nuova).toFixed(3)}`)
  }

  /* ── il secondo giro del gioco libero ──
     Le copie oltre il tetto devono rendere sempre meno e non sommare
     mai a più di `RESA_TOTALE`: è tutto quello che tiene in piedi la
     promessa «il mazzo non finisce e nessuno diventa immortale». */
  if (!(RESA_OLTRE > 0 && RESA_OLTRE < 1))
    guasti.push(`la resa delle copie in più vale ${RESA_OLTRE}: sopra 1 non è una serie che si chiude`)
  for (const c of mazzo) {
    /* il tetto: vero in campagna per tutti, e vero anche nel gioco
       libero per chi dà una cosa intera */
    if (tettoDi(c, false) !== c.max)
      guasti.push(`carta "${c.chiave}": in campagna il tetto non è il suo max`)
    const senzaFine = tettoDi(c, true)
    if (c.intera ? senzaFine !== c.max : Number.isFinite(senzaFine))
      guasti.push(`carta "${c.chiave}": nel gioco libero il tetto è ${senzaFine}, ` +
                  `e la carta ${c.intera ? 'è' : 'non è'} dichiarata intera`)
    if (c.intera) continue
    /* dentro il tetto la resa è il numero di copie, e questo è il motivo
       per cui la campagna non cambia di un numero */
    for (let lv = 0; lv <= c.max; lv++)
      if (resa(lv, c.max) !== lv) {
        guasti.push(`carta "${c.chiave}": dentro il tetto la resa non è il numero di copie`)
        break
      }
    let prima = 1
    for (let n = 1; n <= 12; n++) {
      const passo = resa(c.max + n, c.max) - resa(c.max + n - 1, c.max)
      if (!(passo > 0)) guasti.push(`carta "${c.chiave}": la ${n}ª copia in più non dà niente`)
      if (!(passo < prima)) guasti.push(`carta "${c.chiave}": la ${n}ª copia in più rende quanto la precedente`)
      prima = passo
    }
    if (!(resa(c.max + 300, c.max) - c.max < RESA_TOTALE + 1e-9))
      guasti.push(`carta "${c.chiave}": prendendola per sempre supera i ` +
                  `${RESA_TOTALE.toFixed(2)} gradi in più`)
  }
  /* ogni fascia deve tenere in piedi la terna **anche quando tutte le
     sue carte intere sono al massimo**: se no, dopo mezz'ora di gioco
     libero l'offerta di quella fascia si ripete sempre uguale */
  for (const f of fasce) {
    const ancora = mazzo.filter(c => c.fascia === f.chiave && !c.intera).length
    if (ancora < 3)
      guasti.push(`la fascia "${f.chiave}" ha solo ${ancora} carte che crescono oltre il tetto`)
  }
  return guasti
}
