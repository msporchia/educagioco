/* Codice Segreto: il ragionamento vero, non un mimo. Il codice non si
   legge da nessuno stato — è nascosto nella pagina come lo è per chi
   gioca, e la clip non lo legge nemmeno per sbirciare — quindi qui si
   ragiona sui pallini letti a schermo esattamente come fa
   `test/integrazione/codice-segreto.test.mjs`: fra i codici ancora
   **compatibili** con tutte le risposte avute si prova quello che
   scartandone di più mostrerebbe il meccanismo meglio, si scartano quelli
   che non spiegherebbero i pallini appena visti, si riprova. Il motore
   vero (`motore/banco.js`: `tuttiICodici`, `compatibili`;
   `motore/indizi.js`: `confronta`) fa il conto; la clip legge solo
   `.cs-pallino.cs-pieno`/`.cs-pallino.cs-vuoto` dall'ultima riga giocata,
   mai il segreto.

   **Il primo tentativo compatibile non bastava**: era sempre lo stesso
   (il primo di `tuttiICodici`, un ordine fisso che non sa niente del
   segreto) e spesso chiudeva in due mosse con un solo pallino misto — si
   vince, ma non si legge il gioco. `sceltaTentativo` guarda invece, fra i
   candidati rimasti, **quale dei loro confronti reciproci darebbe più
   spesso pieni E vuoti insieme**: non è un tentativo ottimo per vincere
   presto (quello ridurrebbe le mosse, non le righe da leggere), è quello
   che sulla carta produce più righe leggibili. Il segreto resta ignoto
   fino all'ultimo: non si legge mai, si sceglie solo guardando cosa i
   candidati direbbero *fra loro*. Restano comunque possibili una vittoria
   al primo colpo (1 su 24 con «facile», pura fortuna, non un difetto di
   questo file) o una fila di righe che chiude presto: è il gioco vero, non
   una coreografia.

   La tappa è la prima (`cuccioli`, chiave stabile e non un indice: la
   campagna è tre scalini di tre tappe, e un indice si sposta se la fila
   cambia) — la più semplice (tre caselle, niente doppioni): misurato su
   duemila partite finte, un ragionatore così chiude entro quattro
   tentativi quasi sempre, che è il tempo che la clip si può permettere.

   `profilo` marca la spiegazione senza parole come già vista
   (`cfg.spiegata`): senza, la prima partita apre da sola un velo
   (`Spiegazione.vue`) che coprirebbe l'intera clip, come il cartello di
   traguardo che `passo.mjs` evita allo stesso modo.

   I gesti sono i bottoni veri: `.cs-tasto[data-simbolo]` per posare un
   disegno, `.cs-conferma` per consegnare la riga. Se uno dei due sparisce,
   o se `.cs-riga.cs-fatta .cs-pallino` cambia forma, la clip smette di
   vincere invece di restare silenziosamente sbagliata. */
import { CAMPAGNA } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { Regole } from '../../src/giochi/codice-segreto/motore/partita.js'
import { tuttiICodici, compatibili } from '../../src/giochi/codice-segreto/motore/banco.js'
import { confronta } from '../../src/giochi/codice-segreto/motore/indizi.js'

/* quattro caselle e i doppioni: con tre caselle si trova in due o tre
   prove e le righe miste (un pieno e un vuoto insieme) quasi non escono,
   cioè non si vede il ragionamento. Qui servono cinque o sei prove, e
   `accelera` le fa stare nel filmato. */
const CHIAVE_TAPPA = 'scogliera'
const INDICE = CAMPAGNA.findIndex(t => t.chiave === CHIAVE_TAPPA)
const REGOLE = INDICE >= 0 ? Regole.perTappa(CAMPAGNA[INDICE]) : null

/* Fra i candidati rimasti, quello che confrontato con gli altri candidati
   darebbe più spesso pieni **e** vuoti insieme — mai il primo della
   lista, che non sa niente del segreto e spesso ne sa già troppo poco per
   raccontarlo. Con due o meno candidati non c'è scelta da fare: o è
   l'ultimo possibile, o sono due e uno vale l'altro. */
function sceltaTentativo (candidati) {
  if (candidati.length <= 2) return candidati[0]
  let migliore = candidati[0], punteggio = -1
  for (const g of candidati) {
    let misti = 0
    for (const s of candidati) {
      const r = confronta(s, g)
      if (r.pieni > 0 && r.vuoti > 0) misti++
    }
    if (misti > punteggio) { punteggio = misti; migliore = g }
  }
  return migliore
}

export default {
  file: 'clip-codice', dove: 'codice', attesa: '.cs-mappa',
  profilo: p => {
    p.campagne = { ...p.campagne,
      codice: { tappa: Math.max(INDICE, 0), libera: false, stelle: {}, cfg: { spiegata: true } } }
    return p
  },
  passi: [[`.cs-tappa[data-tappa="${INDICE}"]`, 500]],
  clip: {
    secondi: 15,
    accelera: 1.6,
    coda: 2200,                   // il «Trovato!» si legge, e basta
    async durante (page) {
      if (!REGOLE) return
      const attesa = ms => page.waitForTimeout(ms)
      const TUTTI = tuttiICodici(REGOLE)

      /* posa un codice, consegna, legge i due numeri dall'ultima riga */
      async function provaCodice (codice) {
        for (const s of codice) {
          await page.locator(`.cs-tasto[data-simbolo="${s}"]`).click({ timeout: 1500 }).catch(() => {})
          await attesa(200)                       // ritmo umano: un disegno alla volta
        }
        await page.locator('.cs-conferma').click({ timeout: 1500 }).catch(() => {})
        await attesa(550)                         // i pallini escono uno dopo l'altro
        const ultima = page.locator('.cs-riga.cs-fatta').last()
        return {
          pieni: await ultima.locator('.cs-pallino.cs-pieno').count().catch(() => 0),
          vuoti: await ultima.locator('.cs-pallino.cs-vuoto').count().catch(() => 0),
        }
      }

      let candidati = TUTTI
      for (let giro = 0; giro < REGOLE.prove; giro++) {
        const codice = sceltaTentativo(candidati)
        /* niente più tasti a schermo vuol dire che il cartello di un
           esito ha già coperto il tavolo (partita vinta o persa) */
        if (!codice || !(await page.locator('.cs-tasto').count())) break
        const prova = await provaCodice(codice)
        if (prova.pieni === REGOLE.caselle) break   // vinto: il cartello arriva da sé
        candidati = compatibili(candidati, { simboli: codice, ...prova })
        if (!candidati.length) break
        await attesa(250)
      }
    },
  },
}
