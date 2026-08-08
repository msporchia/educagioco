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
   tre righe di istruzioni per tre carte nessuno le legge lo stesso. */
export const MAZZO = [
  /* ── deboli: comodità, non potenza ── */
  { chiave: 'mela',     nome: 'Mela curativa',   icona: '🍎', fascia: 'debole', max: 9,
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
  { chiave: 'palla',    nome: 'Cometa in orbita', icona: '☄️', fascia: 'media', max: 4,
    chiaro: 'una cometa ti gira intorno e travolge chi tocca' },
  { chiave: 'occhi',    nome: 'Occhi acuti',     icona: '👀', fascia: 'media', max: 3,
    chiaro: 'le frecce passano attraverso i mostri' },

  /* ── forti: si sente subito ── */
  { chiave: 'frecce',   nome: 'Frecce gemelle',  icona: '🏹', fascia: 'forte', max: 5,
    chiaro: 'una freccia in più a ogni tiro' },
  { chiave: 'mani',     nome: 'Mani veloci',     icona: '⚡', fascia: 'forte', max: 5,
    chiaro: 'spari molto più spesso' },
  { chiave: 'grandi',   nome: 'Frecce grosse',   icona: '💥', fascia: 'forte', max: 4,
    chiaro: 'le frecce fanno molto più male' },
  { chiave: 'cuore',    nome: 'Cuore grande',    icona: '❤️', fascia: 'forte', max: 3,
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
  return guasti
}
