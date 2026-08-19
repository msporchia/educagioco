/* ═══════════════════════════════════════════════════════════════════
   LE GUIDE, VISTE COME DATO

   `guide/contenuti.js` è dato puro, e i due modi in cui può marcire non
   danno nessun errore a schermo:

   1. **una chiave di `AIUTI` che non è una schermata.** Il `?` si chiede
      scrivendo `guida="<chiave>"` sulla `Barra`, e se quella chiave non
      esiste più il tasto semplicemente non compare: nessun errore,
      nessun rosso, solo un aiuto che si è spento da solo.
   2. **un blocco con una chiave che nessuno disegna.** `Blocchi.vue`
      conosce `titolo`, `righe`, `passi`, `se`: un `testo:` scritto per
      distrazione non si vedrebbe e basta.

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
const NOTE = new Set(['titolo', 'righe', 'passi', 'se'])
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
uguale('la prima è come si installa', GUIDE[0].id, 'installare')


/* ── 5. quando si offre di installarlo ──
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
