/* ═══════════════════════════════════════════════════════════════════
   GLI ANIMALI E DOVE VIVONO — il primo modulo di scienze.

   A scuola ci passano mesi, in seconda e in terza: gli ambienti del
   mondo e chi ci abita. È materia che si presta male a un quiz e bene a
   un gioco, e la differenza sta tutta in come si fa la domanda.

   IL PERICOLO, DETTO SUBITO. «Dove vive il koala?» è il tipo di domanda
   che `LEGGIMI.md` mette in guardia: la risposta non si ricava da
   niente, chi sbaglia non ha ragionato storto — non se lo ricordava. Il
   banco la trova ineccepibile (forma giusta, falsi distinti, varietà
   alta) e non insegna niente.

   Quello che la salva è che qui **il passo da fare c'è**, e a scuola è
   proprio quello: un animale si porta addosso il posto dove vive. Il
   pelo bianco e il grasso sotto la pelle dicono il freddo, la gobba
   dice il deserto, le zampe palmate dicono l'acqua. Per questo la
   scaletta non è «altri dieci animali» ma cambia il verso della
   domanda quattro volte, e finisce dove non c'è più nessun animale da
   ricordare — solo un indizio da leggere:

     1. i posti che ha visto        la fattoria, il mare, il bosco
     2. i posti del mondo           savana, deserto, ghiacci, giungla
     3. il verso opposto            chi ci vive, e chi non c'entra
     4. l'indizio nel corpo         «ha il pelo bianco e spesso: dove vive?»

   IL CRITERIO È QUELLO CHE INSEGNA LA SCUOLA, NON LA BIOLOGIA. Il
   cammello è il deserto e basta; l'orso polare sta fra i ghiacci e non
   «nel mare», anche se ci nuota. Senza questa riga scritta, ogni caso
   dubbio si ridiscute da capo — e i casi dubbi sono tanti, perché la
   natura non è fatta a caselle.

   E CHI È DUBBIO PORTA DUE CASE, MA SE NE CHIEDE UNA SOLA. Il gatto
   vive in città e in fattoria, e tutte e due sono vere: la prima
   versione di questa tabella lo avrebbe buttato via, insieme al
   coniglio, all'orso e al leopardo — e buttare via il gatto per far
   quadrare una tabella è la coda che scodinzola il cane.

   Un animale dichiara **tutte** le sue case, e la prima è quella che
   si chiede. Le altre non spariscono: servono a **non farsi trovare
   fra i falsi**. Il gatto esce sempre con «città» come risposta
   giusta, e la fattoria non compare fra le altre tre.

   Le due metà servono a due cose diverse. La prima casa dà la
   coerenza: un bambino che rivede il gatto ritrova la risposta di
   ieri, e non gli si chiede di indovinare quale delle due vere
   abbiamo in mente oggi. Le altre danno l'onestà: nessuna domanda
   mette mai in fila due risposte difendibili. E `giusta` resta un
   indice solo, quindi nessun gioco deve imparare a gestire due
   risposte giuste.

   Chi resta fuori adesso è solo chi è ambiguo **sulla specie** e non
   sull'ambiente: la 🐢 di terra e quella di mare sono due animali
   diversi con un'emoji sola, e nessun elenco di case lo risolve. Il
   serpente e la lucertola restano fuori per la ragione opposta: vivono
   quasi ovunque, e un animale che sta in sei case su dieci non fa una
   domanda, fa un sorteggio.

   I disegni dei posti sono in `grafica/pittori/ambienti.js`; gli
   animali restano emoji, che il telefono disegna meglio di chiunque.
   Le due cose stanno insieme grazie a `conNome` — figura sopra, parola
   sotto — che qui è lecito perché il nome del posto non anticipa
   niente: la domanda non è «quale disegno è la savana».
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, emoji, conNome } from '../nucleo/domanda.js'
import { AMBIENTI, NOMI_AMBIENTI, PITTORI_AMBIENTI, scenaAmbiente } from '../grafica/pittori/ambienti.js'

/* ── da che grado entra un posto ──
   I cinque di casa prima, i cinque del mondo dopo. Non è solo la
   risposta giusta a cambiare: al grado 1 anche i **falsi** vengono da
   qui, perché «il maiale vive nella giungla?» non è una domanda facile
   per un bambino di cinque anni, è una domanda su una parola che non
   ha mai sentito. */
const DA_GRADO = {
  fattoria: 1, citta: 1, mare: 1, bosco: 1, stagno: 1,
  savana: 2, deserto: 2, giungla: 2, banchisa: 2, montagna: 2,
}

/* ── la tabella ──
   `g` è il grado da cui l'animale entra in scena, e segue quanto è
   comune, non quanto è esotico: la mucca e il gatto subito, il leone e
   il pinguino quando arrivano i posti del mondo, il bradipo e il
   castoro alla fine. */
export const BESTIE = [
  /* fattoria */
  { em: '🐄', nome: 'la mucca', dove: 'fattoria', g: 1 },
  { em: '🐖', nome: 'il maiale', dove: 'fattoria', g: 1 },
  { em: '🐔', nome: 'la gallina', dove: 'fattoria', g: 1 },
  { em: '🐑', nome: 'la pecora', dove: 'fattoria', g: 1 },
  { em: '🐴', nome: 'il cavallo', dove: 'fattoria', g: 1 },
  { em: '🐐', nome: 'la capra', dove: ['fattoria', 'montagna'], g: 2 },
  { em: '🐰', nome: 'il coniglio', dove: ['fattoria', 'bosco'], g: 2 },
  { em: '🦃', nome: 'il tacchino', dove: 'fattoria', g: 3 },

  /* città */
  { em: '🐕', nome: 'il cane', dove: ['citta', 'fattoria'], g: 1 },
  { em: '🐈', nome: 'il gatto', dove: ['citta', 'fattoria'], g: 1 },
  { em: '🐁', nome: 'il topo', dove: ['citta', 'fattoria'], g: 2 },
  { em: '🕊️', nome: 'il piccione', dove: 'citta', g: 3 },

  /* mare */
  { em: '🐟', nome: 'il pesce', dove: ['mare', 'stagno'], g: 1 },
  { em: '🐬', nome: 'il delfino', dove: 'mare', g: 1 },
  { em: '🐋', nome: 'la balena', dove: 'mare', g: 1 },
  { em: '🦈', nome: 'lo squalo', dove: 'mare', g: 2 },
  { em: '🐙', nome: 'il polpo', dove: 'mare', g: 3 },
  { em: '🦀', nome: 'il granchio', dove: 'mare', g: 3 },

  /* bosco */
  { em: '🦌', nome: 'il cervo', dove: 'bosco', g: 1 },
  { em: '🦊', nome: 'la volpe', dove: 'bosco', g: 1 },
  { em: '🐻', nome: "l'orso", dove: ['bosco', 'montagna'], g: 2 },
  { em: '🐿️', nome: 'lo scoiattolo', dove: 'bosco', g: 2 },
  { em: '🦉', nome: 'il gufo', dove: 'bosco', g: 3 },
  { em: '🐗', nome: 'il cinghiale', dove: ['bosco', 'montagna'], g: 3 },
  { em: '🦔', nome: 'il riccio', dove: 'bosco', g: 3 },

  /* stagno */
  { em: '🦆', nome: "l'anatra", dove: ['stagno', 'fattoria'], g: 1 },
  { em: '🐸', nome: 'la rana', dove: 'stagno', g: 1 },
  { em: '🦢', nome: 'il cigno', dove: 'stagno', g: 3 },
  { em: '🦫', nome: 'il castoro', dove: 'stagno', g: 3 },

  /* savana */
  { em: '🦁', nome: 'il leone', dove: 'savana', g: 2 },
  { em: '🐘', nome: "l'elefante", dove: 'savana', g: 2 },
  { em: '🦒', nome: 'la giraffa', dove: 'savana', g: 2 },
  { em: '🦓', nome: 'la zebra', dove: 'savana', g: 2 },
  { em: '🦏', nome: 'il rinoceronte', dove: 'savana', g: 3 },
  { em: '🦛', nome: "l'ippopotamo", dove: 'savana', g: 3 },

  /* deserto */
  { em: '🐪', nome: 'il cammello', dove: 'deserto', g: 2 },
  { em: '🦂', nome: 'lo scorpione', dove: 'deserto', g: 3 },

  /* giungla */
  { em: '🐒', nome: 'la scimmia', dove: 'giungla', g: 2 },
  { em: '🐅', nome: 'la tigre', dove: 'giungla', g: 2 },
  { em: '🦜', nome: 'il pappagallo', dove: 'giungla', g: 2 },
  { em: '🦍', nome: 'il gorilla', dove: 'giungla', g: 3 },
  { em: '🦥', nome: 'il bradipo', dove: 'giungla', g: 3 },
  { em: '🐆', nome: 'il leopardo', dove: ['savana', 'giungla'], g: 3 },

  /* ghiacci */
  { em: '🐧', nome: 'il pinguino', dove: 'banchisa', g: 2 },
  { em: '🐻‍❄️', nome: "l'orso polare", dove: 'banchisa', g: 2 },
  { em: '🦭', nome: 'la foca', dove: 'banchisa', g: 3 },

  /* montagna */
  { em: '🦅', nome: "l'aquila", dove: ['montagna', 'bosco'], g: 2 },
  { em: '🦙', nome: 'il lama', dove: 'montagna', g: 3 },
]

/* ── gli indizi del corpo (grado 4) ──
   Qui non c'è nessun animale da ricordare: c'è un fatto sul corpo o
   sulle abitudini, e il posto si ricava. È la domanda che giustifica
   tutto il modulo, e l'unica dove chi sbaglia ha davvero ragionato
   storto invece di non ricordare.

   Ognuno è scritto per essere **vero di quel posto e falso degli
   altri nove**: «ha il pelo folto» da solo andrebbe bene per la
   montagna e per il bosco, e allora il pelo folto non basta. */
const INDIZI = {
  banchisa: 'ha il pelo bianco e uno strato di grasso sotto la pelle, per non sentire il gelo',
  deserto: 'sopporta giorni senza bere e cammina sulla sabbia bollente senza scottarsi',
  mare: 'non ha zampe, respira in superficie e non esce mai dall\'acqua salata',
  giungla: 'sta sugli alberi di un posto dove piove quasi ogni giorno e non fa mai freddo',
  savana: 'vive nell\'erba alta e gialla, dove piove solo in una stagione e l\'acqua è lontana',
  montagna: 'si arrampica sulle rocce ripide e respira bene anche dove l\'aria è sottile',
  bosco: 'fa la scorta di ghiande e nocciole per l\'inverno fra gli alberi che perdono le foglie',
  stagno: 'ha le zampe palmate e non si allontana mai dall\'acqua dolce e ferma',
  fattoria: 'lo nutre l\'uomo, che in cambio prende il suo latte, le sue uova o la sua lana',
  citta: 'vive fra le case e le strade, e mangia quello che le persone lasciano indietro',
}

/* ── che cos'è un posto, detto a un bambino ──
   Va nell'`aiuto`, cioè si legge dopo aver sbagliato: è lì che la
   domanda diventa una lezione invece di un verdetto. */
const COS_E = {
  savana: 'la savana è la pianura d\'erba alta e gialla dell\'Africa, con pochi alberi',
  deserto: 'il deserto è sabbia e sassi, caldissimo di giorno, dove non piove quasi mai',
  giungla: 'la giungla è la foresta dove piove ogni giorno e gli alberi sono altissimi',
  banchisa: 'i ghiacci sono il mare gelato dei poli, dove è sempre inverno',
  mare: 'il mare è acqua salata, e non se ne vede la fine',
  bosco: 'il bosco è la foresta dei posti come il nostro, dove d\'inverno cade la neve',
  montagna: 'la montagna è roccia ripida e aria fredda, sopra i boschi',
  stagno: 'lo stagno è acqua dolce e ferma, con le canne intorno',
  fattoria: 'la fattoria è il posto degli animali che l\'uomo alleva',
  citta: 'la città è dove viviamo noi, fra le case e le strade',
}

const SCALETTA = [
  'I posti che si conoscono: la fattoria, il mare, il bosco',
  'I posti del mondo: savana, deserto, giungla, ghiacci',
  'Chi ci vive, e chi non c\'entra',
  'Com\'è fatto un animale dice dove vive',
]

/* LA CHIAVE DI UNA DOMANDA È LA SUA TIPOLOGIA, non il posto di cui
   parla. Avevo scritto `bio:savana`, che sembrava più utile — il
   ripasso avrebbe seguito *quale ambiente* non sa — e
   `test/unita/saperi` l'ha bocciato: la chiave deve essere quella del
   tipo che l'ha chiesta, se no un genitore che spegne una tipologia
   spegne qualcosa che nei progressi si chiama in un altro modo, e le
   due metà non si parlano più. Il posto resta nell'`aiuto` e nel
   `perche`, che è dove serve al bambino. */
const TIPI = [
  { chiave: 'bio:dove-vive', nome: 'Dove vive questo animale', sa: 'ambienti',
    gradi: { 1: 1, 2: 1, 3: 0.4, 4: 0.2 } },
  { chiave: 'bio:chi-ci-vive', nome: 'Chi vive in questo posto', sa: 'ambienti',
    gradi: { 3: 0.3 } },
  { chiave: 'bio:intruso', nome: 'Chi non vive qui', sa: 'ambienti',
    gradi: { 3: 0.3, 4: 0.3 } },
  { chiave: 'bio:adattamento', nome: 'Il corpo dice il posto', sa: ['ambienti', 'adattamento'],
    gradi: { 4: 0.5 } },
]

/* «vive nella savana», «vive in montagna»: le preposizioni non si
   possono ricavare dal nome, e una frase storta in una domanda per
   bambini si nota più di quanto costi scriverla qui */
export const DOVE = {
  savana: 'nella savana', deserto: 'nel deserto', giungla: 'nella giungla',
  banchisa: 'fra i ghiacci', mare: 'nel mare', bosco: 'nel bosco',
  montagna: 'in montagna', stagno: 'nello stagno',
  fattoria: 'in fattoria', citta: 'in città',
}
const dove = id => DOVE[id]

/* le case di un animale, sempre come elenco: chi ne ha una la scrive
   come stringa perché è il caso normale, e chi legge non deve saperlo */
export const caseDi = b => [].concat(b.dove)
const case_ = caseDi
/* la casa che si chiede: la prima, sempre la stessa */
export const casa = b => case_(b)[0]

/* gli animali e i posti disponibili a un grado */
const bestieDi = grado => BESTIE.filter(b => b.g <= grado)
const postiDi = grado => AMBIENTI.filter(a => DA_GRADO[a.id] <= grado)
/* chi è DI CASA in un posto — la sua prima casa è quella. Serve a
   scegliere una risposta giusta, e non va confuso con `case_(b).includes(id)`,
   che serve a scartare un falso: il gatto è di casa in città, ma in
   fattoria non ci si può chiedere «chi vive qui?» perché ci vive. */
const diCasa = (id, grado) => bestieDi(grado).filter(b => casa(b) === id)

/* la risposta «un posto»: il disegno con sotto il suo nome */
const posto = id => conNome({ scena: scenaAmbiente(id) }, NOMI_AMBIENTI[id])
/* la risposta «un animale»: l'emoji con sotto come si chiama, perché a
   taglia di tasto un bradipo e un koala sono la stessa macchia */
const bestia = b => conNome({ emoji: b.em }, b.nome.replace(/^(il |la |lo |l')/, ''))

/* due esempi di chi ci vive, per spiegare un falso: «nel bosco vivono
   il cervo e la volpe» dice più di «sbagliato», e si legge solo se il
   bambino ha scelto proprio quello */
function chiCiVive(id, grado, sorte) {
  const gente = diCasa(id, Math.max(grado, 2))
  if (!gente.length) return `${NOMI_AMBIENTI[id]}: non è il suo posto`
  const due = sorte.alcuni(gente, Math.min(2, gente.length)).map(b => b.nome)
  return `${NOMI_AMBIENTI[id]}: ci vivono ${due.join(' e ')}`
}

class Animali extends Modulo {
  constructor() {
    super({
      id: 'animali',
      nome: 'Animali e ambienti',
      icona: '🦁',
      materia: 'scienze',
      chiaro: 'dove vive un animale, e come si capisce guardandolo',
      scaletta: SCALETTA,
      /* La scala è quella comune di `nucleo/classi.js`: 12,5 punti per
         anno di scuola. I posti di casa li sa un bambino di cinque
         anni; i grandi ambienti del mondo sono seconda; il verso
         opposto e l'intruso chiedono di tenere in testa un insieme, e
         l'indizio nel corpo è ragionamento su un fatto, cioè terza
         piena. */
      livelli: [12, 25, 38, 50],
      tipi: TIPI,
      pittori: PITTORI_AMBIENTI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'bio:chi-ci-vive': return this.chiViveQui(grado, sorte)
      case 'bio:intruso': return this.intruso(grado, sorte)
      case 'bio:adattamento': return this.adattamento(grado, sorte)
      default: return this.doveVive(grado, sorte)
    }
  }

  /* ── l'animale, e quattro posti ── */
  doveVive(grado, sorte) {
    /* si scartano gli animali che a questo grado non lascerebbero
       abbastanza posti liberi per tre falsi: succede solo con le case
       multiple, e una domanda a due risposte qui sarebbe un indizio */
    const liberi = postiDi(grado).length
    const b = sorte.uno(bestieDi(grado).filter(x =>
      DA_GRADO[casa(x)] <= grado && liberi - case_(x).length >= 3))
    const sua = casa(b)
    const falsi = sorte.distrattori(postiDi(grado).map(a => a.id), 3,
      id => case_(b).includes(id))
    return domanda({
      testo: 'Dove vive?',
      soggetto: conNome({ emoji: b.em }, b.nome),
      buona: posto(sua),
      falsi: falsi.map(id => ({ ...posto(id), perche: chiCiVive(id, grado, sorte) })),
      chiave: 'bio:dove-vive',
      aiuto: COS_E[sua],
      sorte,
    })
  }

  /* ── il posto, e quattro animali ──
     Il verso opposto non è la stessa domanda girata: per rispondere non
     basta sapere dov'è di casa *questo* animale, bisogna scorrere
     quattro animali e trovare quello che ci sta. */
  chiViveQui(grado, sorte) {
    const posti = postiDi(grado).filter(a => diCasa(a.id, grado).length)
    const a = sorte.uno(posti)
    const buona = sorte.uno(diCasa(a.id, grado))
    const falsi = sorte.distrattori(bestieDi(grado), 3, b => case_(b).includes(a.id))
    return domanda({
      testo: 'Chi vive qui?',
      soggetto: conNome({ scena: scenaAmbiente(a.id) }, NOMI_AMBIENTI[a.id]),
      buona: bestia(buona),
      falsi: falsi.map(b => ({ ...bestia(b),
        perche: `${b.nome} vive ${case_(b).map(dove).join(' o ')}` })),
      chiave: 'bio:chi-ci-vive',
      aiuto: COS_E[a.id],
      sorte,
    })
  }

  /* ── tre di qui e uno no ──
     L'intruso costringe a guardare tutti e quattro invece di cercare
     quello che si sa: è la stessa forma dell'intruso di `lessico.js`, e
     regge per lo stesso motivo — il falso è sempre una cosa vera, solo
     nel posto sbagliato. */
  intruso(grado, sorte) {
    const posti = postiDi(grado).filter(a => diCasa(a.id, grado).length >= 3)
    const a = sorte.uno(posti)
    const dentro = sorte.alcuni(diCasa(a.id, grado), 3)
    const fuori = sorte.uno(bestieDi(grado).filter(b => !case_(b).includes(a.id)))
    return domanda({
      testo: `Tre di questi vivono ${dove(a.id)}. Chi no?`,
      buona: bestia(fuori),
      falsi: dentro.map(b => ({ ...bestia(b), perche: `${b.nome} vive ${dove(a.id)}` })),
      chiave: 'bio:intruso',
      aiuto: COS_E[a.id],
      sorte,
    })
  }

  /* ── l'indizio nel corpo ──
     Nessun animale in scena: solo un fatto, e il posto da ricavare. È
     la domanda che si può sbagliare ragionando, che è il contrario di
     una domanda che si può solo non ricordare. */
  adattamento(grado, sorte) {
    const posti = postiDi(grado).filter(a => INDIZI[a.id])
    const a = sorte.uno(posti)
    const falsi = sorte.distrattori(posti.map(x => x.id), 3, id => id === a.id)
    return domanda({
      testo: `Un animale ${INDIZI[a.id]}.\nDove vive?`,
      buona: posto(a.id),
      falsi: falsi.map(id => ({ ...posto(id), perche: `${NOMI_AMBIENTI[id]}: ${COS_E[id].split(' è ')[1] || 'non torna'}` })),
      chiave: 'bio:adattamento',
      aiuto: COS_E[a.id],
      sorte,
    })
  }
}

export default new Animali()
