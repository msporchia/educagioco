/* Il patto degli atlanti generati.

   Gli atlanti sono **generati** (`strumenti/sprite/atlante.py` e
   `terreni.py`), e chi li genera non gira mai insieme a chi li legge:
   si cambia il generatore, si rilancia, e il gioco lo scopre a schermo.
   Questo file è il posto dove lo scopre prima.

   ── perché esiste, per esteso ──
   Un giro di riordino ha cambiato `pezzoAttore` da «torna le coordinate»
   a «torna il nome del pezzo». Sembrava una pulizia. In `fattoria/scena/
   tela.js` quelle coordinate finiscono dritte in `drawImage`, e
   `drawImage` con un argomento non finito — per specifica — **torna
   senza disegnare e senza lanciare**. Risultato: la fattoria senza più
   nessuno dentro, il terreno al suo posto, i tocchi che funzionano e la
   console pulita. Nessun test era rosso, perché nessun test guardava la
   forma di quello che l'atlante esporta.

   Qui si guarda la forma, e basta: non che il disegno sia bello — quello
   lo guarda un occhio, in `strumenti/banco/mondo.html` — ma che chi legge
   riceva quello che si aspetta di ricevere.
*/
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import * as FATTORIA from '../../src/giochi/fattoria/dati/atlante.js'
import * as SOTTERRANEO from '../../src/giochi/sotterraneo/dati/atlante.js'
import * as CASTELLO from '../../src/giochi/castello/dati/atlante.js'

const ATLANTI = [['fattoria', FATTORIA], ['sotterraneo', SOTTERRANEO], ['castello', CASTELLO]]
const FAMIGLIE = ['attore', 'oggetto', 'tessera', 'fondo', 'figura']

/* ═══════════ 1. quello che ogni atlante ha, uguale ═══════════ */
nota('la testa, uguale per tutti')

for (const [nome, A] of ATLANTI) {
  controlla(`${nome}: il foglio è dentro il modulo`,
            typeof A.ATLANTE === 'string' && A.ATLANTE.startsWith('data:image/png;base64,'),
            'il build deve restare un file solo')
  controlla(`${nome}: la tessera è un numero`, Number.isFinite(A.TESSERA) && A.TESSERA > 0)

  const pezzi = Object.entries(A.PEZZI)
  controlla(`${nome}: ha dei pezzi`, pezzi.length > 0)
  const storti = pezzi.filter(([, r]) =>
    !Array.isArray(r) || r.length !== 4 || r.some(n => !Number.isFinite(n)))
  uguale(`${nome}: ogni pezzo è [x, y, largo, alto] di numeri`, storti.length, 0,
         storti.slice(0, 3).map(([n]) => n).join(' '))

  /* ── le voci ── */
  controlla(`${nome}: ha un catalogo`, Array.isArray(A.VOCI) && A.VOCI.length > 0)
  const male = []
  for (const v of A.VOCI) {
    if (!v.id) male.push('una voce senza id')
    if (!FAMIGLIE.includes(v.famiglia)) male.push(`${v.id}: famiglia "${v.famiglia}"`)
    if (!v.pose || !Object.keys(v.pose).length) male.push(`${v.id}: senza pose`)
    if (!Number.isFinite(v.giri) || v.giri < 1 || v.giri > 4) male.push(`${v.id}: giri ${v.giri}`)
    if (typeof v.specchia !== 'boolean') male.push(`${v.id}: specchia non è un sì/no`)
    for (const [posa, fotogrammi] of Object.entries(v.pose || {})) {
      if (!Array.isArray(fotogrammi) || !fotogrammi.length) male.push(`${v.id}/${posa}: vuota`)
      /* una voce che punta a un pezzo che non c'è è un buco a schermo:
         succede quando si genera per sottoinsiemi e si scarta un ritaglio
         senza scartare la voce che lo nominava */
      for (const p of fotogrammi || [])
        if (!A.PEZZI[p]) male.push(`${v.id}/${posa}: "${p}" non è nell'atlante`)
    }
  }
  uguale(`${nome}: nessuna voce malfatta`, male.length, 0, male.slice(0, 4).join(' · '))

  uguale(`${nome}: voce() trova per id`, A.voce(A.VOCI[0].id).id, A.VOCI[0].id)
  controlla(`${nome}: voce() di uno che non c'è torna null`, A.voce('non-esiste-mai') === null)
  controlla(`${nome}: pezziDi torna dei nomi`,
            A.pezziDi('non-esiste-mai').length === 0,
            'e per chi non c\'è, un elenco vuoto invece di un errore')
}

/* ═══════════ 2. i contratti che un gioco passa a drawImage ═══════════ */
nota('le coordinate, che vanno dritte in drawImage')

/* Questo è il pezzo che si era rotto in silenzio. `pezzoAttore` torna
   **le coordinate**, non il nome: chi lo legge le passa a `drawImage`
   senza guardarle, ed è giusto così — ma allora la forma va tenuta
   ferma da qualche parte, e la parte è questa. */
for (const [nome, A] of [['fattoria', FATTORIA], ['sotterraneo', SOTTERRANEO]]) {
  controlla(`${nome}: dice chi sono i suoi attori`, Array.isArray(A.ATTORI))
  if (!A.ATTORI.length) continue

  const chi = A.ATTORI[0]
  const verso = Object.keys(A.voce(chi).pose)[0]
  const p = A.pezzoAttore(chi, verso, 0)
  controlla(`${nome}: pezzoAttore torna quattro numeri, non un nome`,
            Array.isArray(p) && p.length === 4 && p.every(n => Number.isFinite(n)),
            `ho ricevuto ${JSON.stringify(p)} — se è una stringa, drawImage smette di ` +
            'disegnare senza dire niente')
  uguale(`${nome}: e sono le coordinate di quel pezzo`,
         JSON.stringify(p), JSON.stringify(A.PEZZI[A.pezziDi(chi, verso)[0]]))

  const n = A.fotogrammi(chi, verso)
  controlla(`${nome}: fotogrammi torna quanti sono, un numero`,
            Number.isFinite(n) && n > 0,
            `ho ricevuto ${JSON.stringify(n)} — un elenco qui fa girare a vuoto ogni ciclo`)
  uguale(`${nome}: e sono tanti quanti i pezzi di quella posa`,
         n, A.pezziDi(chi, verso).length)

  controlla(`${nome}: pezzoAttore di un fotogramma che non c'è torna null`,
            A.pezzoAttore(chi, verso, 99) === null)
  controlla(`${nome}: e di uno che non è un attore anche`,
            A.pezzoAttore('non-esiste-mai', 'giu', 0) === null)
}

/* ═══════════ 3. quello che la fattoria dà per scontato ═══════════ */
nota('la fattoria, che è quella che si è spenta')

/* Chi pilota e chi no: lo chiede la schermata che sceglie l'aspetto, e
   un elenco vuoto lì si presenta come una lista di personaggi vuota. */
controlla('ci sono delle persone', FATTORIA.PERSONE.length > 0)
controlla('e delle bestie', FATTORIA.BESTIE.length > 0)
const senzaVersi = [...FATTORIA.PERSONE, ...FATTORIA.BESTIE]
  .filter(chi => !['giu', 'lato', 'su'].every(v => FATTORIA.fotogrammi(chi, v) > 0))
uguale('tutti hanno i tre versi', senzaVersi.length, 0, senzaVersi.join(' '))

/* ═══════════ 4. quello che il castello dà per scontato ═══════════ */
nota('il castello, che compone le strade')

const conAttacchi = CASTELLO.VOCI.filter(v => v.famiglia === 'tessera')
controlla('le tessere portano i loro attacchi',
          conAttacchi.length > 0 && conAttacchi.every(v => v.attacchi))
const lati = ['N', 'S', 'O', 'E']
const attacchiStorti = conAttacchi.filter(v =>
  !lati.every(l => ['·', 'c', 'sx', 'dx'].includes(v.attacchi[l])))
uguale('e ogni lato dice una delle quattro cose', attacchiStorti.length, 0)
controlla('una tessera si può girare', conAttacchi.every(v => v.giri === 4),
          'girare permuta gli attacchi, ed è quello che fa bastare una curva per quattro gomiti')

riassunto('il patto degli atlanti')
