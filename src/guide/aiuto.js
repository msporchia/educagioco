/* ═══════════════════════════════════════════════════════════════════
   GLI ATTREZZI DELL'AIUTO

   Tre cose che servono a più di una schermata e non stanno bene in
   nessuna: che telefono è questo, se il gioco è già installato, e come
   si manda qualcosa fuori di qui.

   Niente Vue e niente store: è un file che si può chiamare da
   dovunque, prove comprese.
   ═══════════════════════════════════════════════════════════════════ */

/* L'indirizzo pubblico lo scrive il build (`vite.config.js`), e **non si
   ricava da `location`**: in casa il gioco arriva dal server di casa, e
   condividere quell'indirizzo vuol dire mandare a un'altra famiglia una
   pagina che per loro non esiste. */
export const INDIRIZZO = typeof __INDIRIZZO__ !== 'undefined'
  ? __INDIRIZZO__ : 'https://msporchia.github.io/educagioco/'

/* Che telefono ho in mano. Serve a una cosa sola — far vedere i passi
   giusti per installare — quindi tre risposte e basta. iPadOS recente si
   dichiara Mac: lo si riconosce dal fatto che ha il dito. */
export function piattaforma () {
  if (typeof navigator === 'undefined') return 'computer'
  const ua = navigator.userAgent || ''
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1) return 'ios'
  return 'computer'
}

/* Già installata? Chi ha aggiunto il gioco alla schermata iniziale non
   deve leggersi le istruzioni per farlo: la guida glielo dice e passa
   oltre. `standalone` è il modo di iOS, il media query quello di tutti
   gli altri. */
export function installata () {
  if (typeof window === 'undefined') return false
  if (window.navigator?.standalone) return true
  return !!window.matchMedia?.('(display-mode: standalone)')?.matches
      || !!window.matchMedia?.('(display-mode: fullscreen)')?.matches
      || !!window.matchMedia?.('(display-mode: minimal-ui)')?.matches
}

/* ── IL BANCO DI PROVA NON VA ISTRUITO ──
   Le spiegazioni che compaiono da sole dentro una partita — la riga dei
   primi passi del tower defense — sono giuste per un bambino e rumore
   per un test, che gioca la stessa partita cento volte. Il banco lo
   dichiara una volta (`test/aiuto/browser.mjs`), e il test che vuole
   provare proprio quel comportamento chiede `spiegazioni: true`.

   Sta in localStorage e non fra le impostazioni perché non è una scelta
   di nessuno: è una proprietà di dove sta girando il gioco. */
export function saltaLeSpiegazioni () {
  try { return localStorage.getItem('guide-viste') === '1' } catch { return false }
}

/* ── IL NASTRO DELL'INSTALLAZIONE ──
   Chi riceve il link lo apre nel browser, gioca in una scheda e non
   installa niente: poi un giorno svuota la cache e crede di aver perso i
   progressi. La guida c'è, ma la legge chi la cerca — e chi non sa che
   esiste un'app da installare non cerca niente.

   Tre condizioni, tutte e tre necessarie:
     · non è già installata — a chi gioca dall'icona non si ripete nulla;
     · è un telefono — sul computer una scheda del browser va benissimo,
       e il nastro sarebbe un consiglio che non serve;
     · non l'ha già chiuso — chi ha detto no una volta ha deciso.

   È una funzione pura per poterla provare senza un telefono in mano:
   quello che decide sta qui, chi legge il telefono sta sopra. */
export function serveIlNastro ({ dentro, dove, chiuso } = {}) {
  if (dentro || chiuso) return false
  return dove === 'android' || dove === 'ios'
}

/* ── MANDARE QUALCOSA FUORI ──
   Il foglio di condivisione del telefono è l'unico posto dove WhatsApp,
   la posta e i messaggi stanno già tutti insieme: non serve sapere quale
   usa questa famiglia. Dove non c'è (i computer, quasi tutti) si ripiega
   sugli appunti, che è il pattern già usato per i guasti.

   Torna sempre un esito invece di lanciare: chi chiama deve poter
   scrivere una riga a schermo, e «l'utente ha chiuso il foglio» non è un
   guasto — `AbortError` si ingoia. */
export async function condividi ({ url, testo, titolo, file } = {}) {
  const dati = {}
  if (titolo) dati.title = titolo
  if (testo) dati.text = testo
  if (url) dati.url = url
  if (file) dati.files = [file]

  try {
    if (navigator.share && (!file || navigator.canShare?.({ files: [file] }))) {
      await navigator.share(dati)
      return { come: 'condiviso' }
    }
  } catch (e) {
    if (e?.name === 'AbortError') return { come: 'annullato' }
    /* qualunque altro inciampo: si prova la strada di sotto */
  }

  if (!file) {
    try {
      await navigator.clipboard.writeText(url || testo || '')
      return { come: 'copiato' }
    } catch { /* niente appunti: lo dice chi chiama */ }
  }
  return { come: 'niente' }
}

/* Il file da mandare o da scaricare, a seconda di cosa sa fare il
   telefono. Il download resta la strada di sempre sui computer. */
export function scarica (nome, testo, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([testo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
