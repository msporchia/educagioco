/* ═══════════════════════════════════════════════════════════════════
   ALLESTIMENTO — montare la scena, una volta sola, prima di giocare

   Sta separato dal `Mondo` per una ragione che si sente subito
   lavorando: erano due tempi diversi infilati nella stessa classe.

     ALLESTIRE   succede UNA VOLTA, prima che parta niente: si legge la
                 mappa a token, si costruiscono le porte e i congegni, si
                 mettono in piedi le unità, si assegnano i colori ai
                 lucchetti, si censisce tutto quello che ha un nome.
     GIOCARE     succede a ogni battito: chi vede chi, dove credo che sia
                 quella cosa, a chi arriva questo rumore.

   Con le due cose insieme, per provare che una variante mette l'orco
   dalla parte giusta bisognava costruire un mondo intero, e per provare
   che un rumore arriva a chi è vicino bisognava leggere una mappa ASCII.
   Separate, ognuna si prova per quello che è: qui si controlla che la
   scena montata sia quella giusta, di là che le domande abbiano la
   risposta giusta.

   ── E SI COPIA TUTTO QUELLO CHE POI SI MANGIA GIOCANDO ──
   Se si giocasse sul dato del livello, la seconda partita partirebbe da
   un campo già mangiato e nessuno se ne accorgerebbe finché un bambino
   non rigioca la tappa.
   ═══════════════════════════════════════════════════════════════════ */
import { Porta, Oggetto, Posto, Leva, Totem, Lanterna } from './elementi/indice.js'
import { leggiCampo } from './campo.js'
import { Unita } from './unita.js'

/* ── IL SIGILLO SI DERIVA, NON SI DICHIARA ──
   La porta sa già qual è la sua chiave; qui si assegna un colore a ogni
   chiave DISTINTA, nell'ordine in cui compare — e lo stesso colore va
   alla porta e, se esiste come oggetto da raccogliere, alla chiave
   stessa. Chi scrive il livello non deve tenere allineate due
   dichiarazioni, e non può sbagliarsi: è la risposta al problema dei
   lucchetti tutti gialli, che a schermo non si distinguono. */
const SIGILLI = ['rosso', 'blu', 'verde', 'giallo', 'viola', 'arancio']

/* quale scena si sta montando: una variante può ridisegnare la stanza
   per intero, oppure mettere qualcuno in un posto che la mappa aveva già
   preparato — e spesso fa tutte e due */
export function scenaDi (livello, variante) {
  const v = varianteDi(livello, variante)
  const base = livello.scena
  return {
    variante: v,
    scena: {
      righe: (v.scena && v.scena.righe) || base.righe,
      legenda: { ...base.legenda, ...((v.scena && v.scena.legenda) || {}), ...(v.metti || {}) },
    },
  }
}

function varianteDi (livello, variante) {
  if (variante && typeof variante === 'object') return variante
  /* un livello può non avere varianti: quando quello che si chiede non
     si può sbagliare in più modi, tre scene sarebbero tre volte la
     stessa prova */
  const tutte = livello.varianti || []
  if (!tutte.length) return {}
  const v = tutte[variante || 0]
  if (!v) throw new Error('variante sconosciuta')
  return v
}

/* ── DAL LIVELLO ALLA SCENA MONTATA ──
   Restituisce dati, non un mondo: chi lo riceve decide cosa farne. È
   quello che rende questa parte provabile da sola. */
export function allestisci (livello, variante) {
  const { variante: v, scena } = scenaDi(livello, variante)
  const campo = leggiCampo({ ...livello, scena })
  const griglia = campo.griglia
  const altezza = griglia.length
  const larghezza = griglia[0].length

  const celle = []
  for (let y = 0; y < altezza; y++) {
    const riga = []
    for (let x = 0; x < larghezza; x++) riga.push({ muro: griglia[y][x] === '#', porta: null })
    celle.push(riga)
  }

  /* ── LE COSE DEL CAMPO, TUTTE NELLO STESSO ELENCO ──
     Niente cassetti per famiglia: `apri` non deve sapere in quale
     guardare, e domani si aprirà qualcosa che non è una porta. Le
     famiglie restano solo dove servono a un mestiere preciso — la
     griglia deve sapere quale porta occupa una cella. */
  const cose = {}
  const porte = {}
  for (const k in campo.porte) {
    const p = new Porta(k, campo.porte[k])
    porte[k] = p
    cose[k] = p
    celle[p.y][p.x].porta = k
  }
  for (const k in campo.posti) cose[k] = new Posto(k, campo.posti[k])
  /* i congegni: una leva scatta al primo `premi`, un totem conta */
  for (const k in campo.leve) cose[k] = new Leva(k, campo.leve[k])
  for (const k in campo.totem) cose[k] = new Totem(k, campo.totem[k])
  /* ── UNA SPECIE PARTICOLARE, NON UNA FAMIGLIA A PARTE ──
     La stragrande maggioranza degli oggetti sono un `Oggetto` e basta.
     Una manciata hanno un comportamento in più — la lanterna sa fare
     luce — e lo dichiarano con `specie` (`cose.lanterna()` in `data/
     livelli/scrivi.js`). Non è `genere`: quello dice al LETTORE DELLA
     MAPPA (`campo.js`) in quale cassetto mettere la voce (posti,
     porte, oggetti, unità); `specie` è una distinzione DENTRO la
     famiglia «oggetto», e la fa questa tabella — un `if` sparso qui
     sarebbe la stessa cosa scritta peggio, e la prima che si dimentica
     di aggiornarla. */
  const SPECIE_OGGETTO = { lanterna: Lanterna }
  const oggetti = campo.oggetti.map(o => new (SPECIE_OGGETTO[o.specie] || Oggetto)(o.nome, o))
  oggetti.forEach(o => { cose[o.id] = o })

  /* il nome che si legge in una frase lo dà il livello, e glielo si dà
     adesso: da qui in poi ogni cosa sa dirsi da sé */
  const etichetta = k => (campo.nomi || {})[k] || (livello.nomi || {})[k] || k
  for (const k in cose) cose[k].nome = etichetta(k)
  /* i segnali di sempre hanno un nome che il livello non ripete: «un
     rumore», «tutto libero». Se il livello non ne dichiara uno suo, si
     usa quello comune — e senza questa riga il registro direbbe
     «suono "richiamo"» invece di «suono "un rumore"». */
  const nomeDelSegnale = k => {
    const suo = (livello.segnali || []).find(s => s && typeof s === 'object' && s.id === k)
    return suo ? suo.nome : etichetta(k)
  }

  sigilli(porte, oggetti)

  const unita = campo.unita.map(u => new Unita(u))
  const perId = {}
  unita.forEach(u => { perId[u.id] = u })

  /* ── E I CARTELLINI ──
     Non tutto quello che si nomina è una cosa del campo. Un'unità, una
     schiera, un segnale, «un momento» hanno un nome e un tipo e basta:
     non stanno da nessuna parte e non rispondono a nessun comando. Ma
     senza di loro `attacca [gli orchi]` e `suona [il richiamo]` non si
     possono nemmeno scrivere — sono bersagli a tutti gli effetti. */
  const cartellino = (id, tipo, nome, em) => { if (id != null && !cose[id]) cose[id] = { id, tipo, nome, em } }
  unita.forEach(u => cartellino(u.id, 'unita', u.comeSiChiama, u.emoji))
  for (const k in campo.fazioni) cartellino(k, 'fazione', etichetta(k), '🚩')
  for (const s of (livello.segnali || [])) {
    const id = typeof s === 'string' ? s : s.id
    const suo = typeof s === 'object' ? s : null
    cartellino(id, 'segnale', nomeDelSegnale(id), (suo && suo.em) || '📣')
  }

  /* le caselle libere: un punto di ronda è una cosa a tutti gli
     effetti, solo che non ha un nome. Si contano una volta sola. */
  const caselle = []
  for (let y = 0; y < altezza; y++) for (let x = 0; x < larghezza; x++)
    if (!celle[y][x].muro) caselle.push(x + ',' + y)

  return {
    livello,
    variante: v.nome || '',
    ordiniScena: v.ordini || null,
    campo,
    w: larghezza,
    h: altezza,
    celle,
    porte,
    oggetti,
    cose,
    unita,
    perId,
    caselle,
    etichetta,
    /* ── I SEGNALI LI DICHIARA IL LIVELLO ──
       Prima erano una tabella globale nel motore, e un livello che ne
       voleva uno suo («la campana del carro») otteneva il ripiego: nome
       grezzo e 📣 grigio. */
    segnali: (livello.segnali || []).map(s => (typeof s === 'string' ? s : s.id)),
    /* `voce` è **quanto lontano si sente**, e va copiata come le altre:
       senza questa parola un livello che scrive `cose.segnale('campana',
       …, { voce: 40 })` otteneva in silenzio un rumore da 20 celle, e la
       manopola funzionava solo per i segnali della tabella globale —
       cioè per nessuno di quelli che un livello si dichiara da sé, che
       ormai è il caso normale. Dosare il rumore è una meccanica, non un
       colore: «si può sfondare senza chiave, ma si sente» è la regola
       del mondo che produce una scelta invece di un divieto. */
    vocabolario: Object.fromEntries((livello.segnali || [])
      .filter(s => s && typeof s === 'object')
      .map(s => [s.id, { nome: s.nome, em: s.em, col: s.col, voce: s.voce }])),
    mia: Object.keys(campo.fazioni).find(f => campo.fazioni[f].autore === 'giocatore'),
  }
}

/* ── UN SIGILLO PROMETTE UNA CHIAVE, QUINDI LA CHIAVE DEVE ESISTERE ──
   Il sigillo è la borchia colorata sull'architrave, e vuol dire una
   cosa sola: «da qualche parte c'è una chiave di questo colore». Si
   dava a ogni `chiave` dichiarata, anche a quelle che nessun oggetto
   porta — e il modo normale di scrivere una porta che NON si apre è
   proprio dichiararle una chiave che non esiste (`chiave: 'sbarra'`,
   nel giro delle mura). Il risultato era la promessa al contrario: una
   serratura rossa bella evidente su un portone che nessuna chiave apre,
   e il bambino che gira la mappa a cercarla.
   Adesso il colore lo prendono solo le serrature che hanno davvero la
   loro chiave in giro; le altre non sono «senza sigillo per caso», sono
   **sbarrate**, e lo dice il disegno (vedi `Porta.faccia()`). */
function sigilli (porte, oggetti) {
  const colore = {}
  const cePerDavvero = new Set(oggetti.map(o => o.id))
  let n = 0
  for (const k in porte) {
    const porta = porte[k]
    if (!porta.chiave || !cePerDavvero.has(porta.chiave)) continue
    if (!colore[porta.chiave]) colore[porta.chiave] = SIGILLI[n++ % SIGILLI.length]
    porta.sigillo = colore[porta.chiave]
  }
  oggetti.forEach(o => { if (colore[o.id]) o.sigillo = colore[o.id] })
}
