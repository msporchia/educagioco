/* ═══════════════════════════════════════════════════════════════════
   LE GUIDE, VISTE COME DATO

   `guide/contenuti.js` è dato puro, e i due modi in cui può marcire non
   danno nessun errore a schermo:

   1. **una chiave di `AIUTI` che non è una schermata.** Il `?` si chiede
      scrivendo `guida="<chiave>"` sulla `Barra`, e se quella chiave non
      esiste più il tasto semplicemente non compare: nessun errore,
      nessun rosso, solo un aiuto che si è spento da solo.
   2. **un blocco con una chiave che nessuno disegna.** `Blocchi.vue`
      conosce `titolo`, `testo`, `righe`, `passi`, `collegamenti`,
      `chiuso` e `se`: una chiave scritta per distrazione non si
      vedrebbe e basta.
   3. **un collegamento che non porta da nessuna parte.** Da quando una
      guida può mandare fuori dall'app — il codice, il modulo per
      segnalare — un indirizzo storto è un tasto che apre una pagina
      vuota, e `Blocchi.vue` disegna solo `http(s)`.

   Qui si guarda anche che ogni gioco dica **cosa allena**: è la parte
   che serve al grande e che è facile dimenticare scrivendone uno nuovo.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'
import { GUIDE, AIUTI } from '../../src/guide/contenuti.js'
import { serveIlNastro } from '../../src/guide/aiuto.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* Le schermate si leggono come testo: `schermate.js` importa dei `.vue`
   e da Node non si può caricare. Basta il nome — è quello che conta. */
const chiaviSchermata = () => {
  const app = readFileSync(new URL('../../src/App.vue', import.meta.url), 'utf8')
  const nuove = readFileSync(new URL('../../src/giochi/schermate.js', import.meta.url), 'utf8')
  const dentro = t => [...t.matchAll(/^\s*([a-z]+):\s*[A-Z]\w*,?\s*$/gm)].map(m => m[1])
  const inRiga = t => [...t.matchAll(/\b([a-z]+):\s*[A-Z]\w+/g)].map(m => m[1])
  return new Set([...dentro(nuove), ...inRiga(nuove), ...inRiga(app)])
}

const SCHERMATE = chiaviSchermata()
const NOTE = new Set(['titolo', 'testo', 'righe', 'passi', 'collegamenti', 'chiuso', 'dove', 'se'])
const DOVE = new Set(['android', 'ios', 'computer', 'installata', 'da-installare'])

/* ── 1. ogni aiuto è appeso a una schermata che esiste ── */
for (const chiave of Object.keys(AIUTI)) {
  /* `lingua` è l'unico nome che non è una schermata: inglese e spagnolo
     sono lo stesso componente e la stessa spiegazione, e passano
     entrambi `guida="lingua"`. */
  if (chiave === 'lingua') continue
  controlla(`«${chiave}» è una schermata vera`, SCHERMATE.has(chiave),
    [...SCHERMATE].join(','))
}

/* ── 2. la forma dei blocchi ── */
const tutti = [...GUIDE.map(g => [g.id, g.blocchi]), ...Object.entries(AIUTI).map(([k, a]) => [k, a.blocchi])]
for (const [chi, blocchi] of tutti) {
  controlla(`«${chi}» ha qualcosa da dire`, blocchi.length > 0)
  for (const b of blocchi) {
    if (typeof b === 'string') continue
    const strane = Object.keys(b).filter(k => !NOTE.has(k))
    uguale(`«${chi}» non usa chiavi che nessuno disegna`, strane.join(','), '')
    if (b.se) controlla(`«${chi}» dice un posto che esiste`, DOVE.has(b.se), b.se)
    if (b.dove) {
      controlla(`«${chi}» ripiega su una piattaforma vera`,
        ['android', 'ios', 'computer'].includes(b.dove), b.dove)
      controlla(`«${chi}» dà un titolo al blocco di una piattaforma`, !!b.titolo)
    }
    /* una fisarmonica senza titolo è un tasto muto: il titolo *è* quello
       che si tocca per aprirla */
    if (b.chiuso) controlla(`«${chi}» dà un titolo al blocco che si apre`, !!b.titolo)
    /* Il grassetto `**così**` è l'unico formato che `inGrassetto`
       traduce: un backtick o un asterisco solo, scritti per abitudine da
       chi viene da Markdown, arrivano a schermo tali e quali — ed è
       successo, con `0000` fra apici inversi in mezzo a una risposta. */
    for (const t of [...(b.righe || []), ...(b.passi || []), ...[].concat(b.testo || [])]) {
      controlla(`«${chi}» non porta a schermo formati che nessuno traduce`,
        !/[`_]/.test(t) && !/(^|[^*])\*([^*]|$)/.test(t), String(t).slice(0, 70))
    }
    for (const l of b.collegamenti || []) {
      controlla(`«${chi}» manda fuori a un indirizzo vero`,
        /^https:\/\//.test(l.url || ''), l.url)
      controlla(`«${chi}» dice dove porta il collegamento`, !!l.testo)
    }
  }
}

/* ── 3. ogni gioco dice cosa allena ── */
for (const [chiave, a] of Object.entries(AIUTI)) {
  controlla(`«${chiave}» dice cosa allena`,
    a.blocchi.some(b => b.titolo === 'Cosa allena'))
  controlla(`«${chiave}» ha un titolo e un'emoji`, !!a.titolo && !!a.emoji)
}

/* ── 4. le guide dei grandi si presentano in elenco ── */
for (const g of GUIDE) {
  controlla(`la guida «${g.id}» ha sommario ed emoji`, !!g.sommario && !!g.emoji)
}
/* ── 5. l'ordine, e chi si legge prima di avere un profilo ──
   La prima non è più «come si installa» ed è cambiato apposta: chi apre
   il link ricevuto da un'altra famiglia non sa ancora *cosa* stia
   installando, e otto guide sulle manopole rispondevano a domande che
   non si era ancora fatto. */
uguale('la prima dice cos\'è', GUIDE[0].id, 'cose')
controlla('e come si installa resta in cima', GUIDE.slice(0, 4).some(g => g.id === 'installare'))

/* `subito` è quello che il velo del primo avvio può offrire: parla di
   cose che esistono prima che esista un bambino. Una guida che spiega
   una manopola delle impostazioni marcata `subito` manderebbe a cercare
   una schermata che da lì non si apre. */
const SUBITO = GUIDE.filter(g => g.subito).map(g => g.id)
controlla('qualcosa si legge prima di avere un profilo', SUBITO.length >= 4, SUBITO.join(','))
for (const id of ['cose', 'chi']) {
  controlla(`«${id}» si legge dal primo avvio`, SUBITO.includes(id), SUBITO.join(','))
}
for (const id of ['difficolta', 'giochi', 'monete', 'bambini', 'guasti']) {
  controlla(`«${id}» invece no: parla di manopole che ancora non ci sono`,
    !SUBITO.includes(id))
}

/* ── 5b. installare: i tre modi ci sono tutti ──
   Erano dichiarati con `se`, che **nasconde**: chi leggeva dal computer
   vedeva solo i passi del computer, cioè gli unici che non gli servivano
   — si legge dal computer proprio per installarlo sul telefono di un
   figlio. Con `dove` ci sono tutti e tre, e sta aperto il proprio. */
const installare = GUIDE.find(g => g.id === 'installare')
const piattaforme = installare.blocchi.filter(b => typeof b === 'object' && b.dove)
  .map(b => b.dove).sort()
uguale('i passi ci sono per tutte e tre le piattaforme',
  piattaforme.join(','), 'android,computer,ios')
controlla('e nessuno di loro è nascosto agli altri',
  installare.blocchi.every(b => !(typeof b === 'object' && b.dove && b.se)))

/* ── 5c. il codice di casa ha una voce sua ──
   Le guide spiegavano cosa c'è dietro il codice senza dire mai qual è, e
   chi riceve il gioco da un'altra famiglia non ha nessuno a cui
   chiederlo. Detto dentro un'altra guida non bastava: chi apre l'elenco
   con quella domanda in testa scorre i **titoli**, e se nessuno la
   nomina se ne va. Perciò una riga sua, e il titolo è la domanda. */
const suCodice = GUIDE.find(g => /codice/i.test(g.titolo))
controlla('c\'è una guida che si intitola al codice', !!suCodice, GUIDE.map(g => g.titolo).join(' | '))
controlla('e dice qual è, non solo che esiste',
  JSON.stringify(suCodice?.blocchi || []).includes('0000'))
controlla('la legge anche chi non ha ancora un profilo', !!suCodice?.subito)
/* la risposta sta **nel primo blocco**: una guida che si chiama «qual è
   il codice» e mette la cifra a metà pagina è una guida che fa cercare */
controlla('e la risposta è la prima cosa scritta',
  JSON.stringify(suCodice?.blocchi?.[0] || '').includes('0000'),
  JSON.stringify(suCodice?.blocchi?.[0] || '').slice(0, 90))

/* ── 6. chi l'ha fatto, e dove si guarda il codice ──
   Il gioco si regala a famiglie che non hanno nessun altro canale: senza
   questa guida l'applicazione non dice da chi arriva né dove si legge
   com'è fatta. */
const chi = GUIDE.find(g => g.id === 'chi')
controlla('c\'è la guida su chi l\'ha fatto', !!chi)
const fuori = (chi?.blocchi || []).flatMap(b => (typeof b === 'object' && b.collegamenti) || [])
controlla('e porta al codice', fuori.some(l => /github\.com/.test(l.url)), fuori.map(l => l.url).join(' '))


/* ── 7. quando si offre di installarlo ──
   Tre condizioni, e sbagliarne una si vede solo su un telefono vero:
   ripetuto a chi ha già l'icona è rumore, mostrato sul computer è un
   consiglio che non si può seguire, riproposto a chi ha detto no è
   insistenza. */
uguale('sul telefono, a chi non ce l\'ha, si offre', serveIlNastro({ dove: 'android' }), true)
uguale('e anche su iPhone', serveIlNastro({ dove: 'ios' }), true)
uguale('sul computer no', serveIlNastro({ dove: 'computer' }), false)
uguale('a chi gioca già dall\'icona no', serveIlNastro({ dove: 'ios', dentro: true }), false)
uguale('e a chi ha già detto no, mai più', serveIlNastro({ dove: 'android', chiuso: true }), false)

riassunto('le guide')
