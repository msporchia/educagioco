/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO DELLE DOMANDE — che l'elenco sia davvero tutto.

   Il catalogo è la lista delle classi di domande che il gioco sa fare,
   con la difficoltà che gli abbiamo assegnato. Serve a **giudicarle**:
   fin qui si potevano guardare solo una alla volta e a caso, quindi per
   capire se una tipologia era tarata bene bisognava insistere finché non
   ricapitava.

   Un elenco del genere ha un solo modo grave di sbagliare, e non è
   sbagliare un numero: è **essere incompleto**. Una riga che manca non
   si vede — nessuno cerca quello che non sa che esiste — e chi guarda
   crede di aver visto tutto. Quindi qui si controlla, in ordine:

     1. che ogni classe che un gioco può pescare sia elencata, e nessuna
        di più: il confronto è con `classiDi()`, che è quello che pesca
        davvero;
     2. che ogni riga sappia **rigenerare la sua domanda**, e che la
        domanda che esce sia proprio quella (la chiave che dichiara);
     3. che la difficoltà sia quella vera — `postoDelGrado` e non
        un'etichetta a mano — e che le fasce coprano tutto senza buchi;
     4. che gli spenti si vedano ma non spariscano, perché un catalogo
        che nasconde quello che il genitore ha spento non gli fa più
        vedere cosa ha spento.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { classiDi, LIVELLO_MIN, LIVELLO_MAX } from '../../src/quiz/nucleo/classi.js'
import { esempioDa } from '../../src/quiz/nucleo/esempi.js'
import { catalogoDi, giroDellaFascia, contaGiudizi, fasciaDi, FASCE }
  from '../../src/quiz/nucleo/catalogo.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

/* i moduli si raccolgono dalla cartella, come nel banco: uno nuovo entra
   in questo controllo il giorno in cui il suo file compare */
const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
  }
controlla('i moduli si raccolgono da soli', moduli.length > 0)

const cat = catalogoDi(moduli)
const righe = cat.flatMap(m => m.classi)

/* ══════════ 1. l'elenco è completo ══════════ */
{
  uguale('un blocco per modulo', cat.length, moduli.length)

  /* nessun grado resta fuori: `classiDi` è quello che pescano i giochi */
  const gradiPescabili = classiDi(moduli, {}).map(c => `${c.modulo.id}:${c.grado}`).sort()
  const gradiElencati = [...new Set(righe.map(r => `${r.modulo}:${r.grado}`))].sort()
  uguale('ogni grado che un gioco può pescare è elencato',
         gradiElencati.join(' '), [...new Set(gradiPescabili)].join(' '))

  /* e ogni tipologia dichiarata ha la sua riga, a ogni grado dove esce */
  const male = []
  for (const m of moduli) {
    for (let g = 1; g <= m.gradi; g++) {
      const attese = m.tipiDi(g).map(t => t.chiave).sort()
      const qui = righe.filter(r => r.modulo === m.id && r.grado === g)
      if (!attese.length) {
        if (qui.length !== 1 || qui[0].tipo !== null)
          male.push(`${m.id} g${g}: senza tipologie dovrebbe avere una riga sola`)
        continue
      }
      const avute = qui.map(r => r.tipo).sort()
      if (avute.join(' ') !== attese.join(' '))
        male.push(`${m.id} g${g}: ${avute.join(' ')} invece di ${attese.join(' ')}`)
    }
  }
  controlla('ogni tipologia è elencata a ogni grado dove esce', male.length === 0,
            male.slice(0, 3).join(' · '))

  const chiavi = righe.map(r => r.chiave)
  uguale('e nessuna riga è doppia', new Set(chiavi).size, chiavi.length)
  nota(`${righe.length} classi di domande da ${moduli.length} moduli`)
}

/* ══════════ 2. ogni riga sa rigenerare la sua domanda ══════════ */
{
  const mute = []
  const sbagliate = []
  for (const r of righe) {
    let e = null
    try { e = esempioDa(r.sorgente, new Sorte(r.grado * 313 + 7)) }
    catch (err) { mute.push(`${r.chiave}: ${err.message}`); continue }
    if (!e?.domanda?.testo) { mute.push(`${r.chiave}: senza consegna`); continue }
    /* la riga dice «Le parti uguali»: quello che si apre dev'essere
       quella, se no il catalogo racconta una cosa e ne mostra un'altra */
    if (r.tipo && e.domanda.chiave !== r.tipo)
      sbagliate.push(`${r.chiave} apre ${e.domanda.chiave}`)
  }
  controlla('ogni riga del catalogo sa aprire la sua domanda', mute.length === 0,
            mute.slice(0, 3).join(' · '))
  controlla('e la domanda che apre è proprio la sua', sbagliate.length === 0,
            sbagliate.slice(0, 3).join(' · '))
}

/* ══════════ 3. il livello è dichiarato, e le fasce coprono tutto ══════════ */
{
  /* Il numero più importante del catalogo: quanto è complicata una
     domanda, da 0 a 100, sulla stessa scala di tutte le altre materie.
     Non è derivato dalla posizione in scaletta — lo era, e metteva i
     grado-1 di sedici moduli nello stesso punto — quindi qui si
     controlla che ci sia, che stia in piedi, e che il modulo lo
     dichiari invece di ricadere sul ripiego. */
  const storte = righe.filter(r => !Number.isFinite(r.livello) ||
                                   r.livello < LIVELLO_MIN || r.livello > LIVELLO_MAX)
  uguale('ogni riga dice quanto è complicata', storte.map(r => r.chiave).join(' ') || '—', '—')
  controlla('e lo dice anche in anni, che è la lingua dei genitori',
            righe.every(r => r.anni >= 4 && r.anni <= 12))

  const muti = cat.filter(m => !m.livelloDichiarato).map(m => m.id)
  uguale('nessun modulo si affida al ripiego', muti.join(',') || '—', '—')

  /* Dentro un modulo la scaletta non deve scendere: un grado più avanti
     non può essere più facile del precedente, quello vorrebbe dire che
     la scaletta è in ordine sbagliato. Le tipologie che dichiarano un
     livello loro sono l'eccezione prevista e restano fuori dal conto. */
  const inversioni = []
  for (const m of cat) {
    const perGrado = new Map()
    for (const c of m.classi) if (!c.suo)
      perGrado.set(c.grado, Math.min(perGrado.get(c.grado) ?? 999, c.livello))
    const gradi = [...perGrado.keys()].sort((a, b) => a - b)
    for (let i = 1; i < gradi.length; i++)
      if (perGrado.get(gradi[i]) < perGrado.get(gradi[i - 1]))
        inversioni.push(`${m.id} g${gradi[i - 1]}→g${gradi[i]}`)
  }
  uguale('la scaletta di un modulo non torna indietro', inversioni.join(' ') || '—', '—')

  uguale('ogni riga cade in una fascia', righe.filter(r => !r.fascia).length, 0)
  const senzaBuchi = righe.every(r => fasciaDi(r.livello).chiave === r.fascia)
  controlla('e la fascia è quella del suo livello', senzaBuchi)

  for (const f of FASCE) {
    const giro = giroDellaFascia(moduli, f.chiave)
    controlla(`la fascia «${f.nome}» ha qualcosa da mostrare`, giro.length > 0)
    controlla(`e nel giro di «${f.nome}» c'è solo roba sua`,
              giro.every(c => c.fascia === f.chiave))
    /* ordinate dal più facile al più difficile: è il modo in cui si
       scorrono, e senza ordine il giro sembra casuale come prima */
    const ordinate = giro.every((c, i) => i === 0 || giro[i - 1].livello <= c.livello)
    controlla(`e «${f.nome}» è in ordine di livello`, ordinate)
    nota(`${f.nome}: ${giro.length} classi, da ${giro[0]?.livello} a ${giro.at(-1)?.livello}`)
  }
}

/* ══════════ 4. gli spenti si vedono, non spariscono ══════════ */
{
  const spenti = ['orologio', 'problemi']
  const conSpenti = catalogoDi(moduli, { spenti })
  uguale('spegnere non toglie righe dall\'elenco',
         conSpenti.flatMap(m => m.classi).length, righe.length)

  const orologio = conSpenti.find(m => m.id === 'orologio')
  controlla('ma le sue righe sono segnate spente',
            orologio.classi.every(c => c.spenta) && orologio.spente === orologio.classi.length)

  const problemi = conSpenti.find(m => m.id === 'problemi')
  controlla('e vale anche per un gruppo citato da più tipologie',
            problemi.classi.every(c => c.spenta))

  /* il giro invece le salta: lì non si guarda cosa esiste, si guardano
     le domande che arriverebbero davvero */
  const giro = giroDellaFascia(moduli, 'facili', { spenti })
  controlla('il giro di una fascia salta le spente',
            giro.every(c => c.modulo !== 'orologio' && c.modulo !== 'problemi'))

  /* spegnere una singola tipologia segna solo quella */
  const unaSola = catalogoDi(moduli, { spenti: ['prob:inutili'] })
    .find(m => m.id === 'problemi')
  uguale('spenta una tipologia sola, si segna solo lei',
         unaSola.classi.filter(c => c.spenta).map(c => c.tipo).join(), 'prob:inutili')
}

/* ══════════ 5. quello che è stato detto giocando ══════════ */
{
  const quaderno = [
    { verdetto: 'difficile', chiave: 'prob:inutili' },
    { verdetto: 'difficile', chiave: 'prob:inutili' },
    { verdetto: 'facile', chiave: 'prob:somma' },
    { verdetto: 'storta', chiave: 'prob:inutili' },
    { verdetto: 'boh', chiave: 'prob:somma' },      // un verdetto che non esiste
    { chiave: 'prob:somma' },                        // una voce senza verdetto
    { verdetto: 'facile' },                          // e una senza chiave
  ]
  const conti = contaGiudizi(quaderno)
  uguale('i giudizi si contano per tipologia', conti.get('prob:inutili').difficile, 2)
  uguale('e il terzo verdetto pure', conti.get('prob:inutili').storta, 1)
  uguale('quanti in tutto su quella tipologia', conti.get('prob:inutili').quanti, 3)
  uguale('le voci storte non contano', conti.get('prob:somma').quanti, 1)

  const conGiudizi = catalogoDi(moduli, { giudizi: quaderno })
  const riga = conGiudizi.find(m => m.id === 'problemi').classi.find(c => c.tipo === 'prob:inutili')
  uguale('e arrivano sulla riga giusta del catalogo', riga.detti.difficile, 2)
  const senza = conGiudizi.find(m => m.id === 'problemi').classi.find(c => c.tipo === 'prob:due')
  uguale('una riga mai giudicata non porta niente', senza.detti, null)
  uguale('senza quaderno non c\'è niente da mostrare', righe[0].detti, null)
}

riassunto('il catalogo delle domande')
