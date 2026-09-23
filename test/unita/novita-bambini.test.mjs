/* ═══════════════════════════════════════════════════════════════════
   LE NOVITÀ PER I BAMBINI — la regola, le righe, il segno

   Tre facce dello stesso patto (`guide/novita-bambini.js`):

   - **la regola**: dopo il segno, solo i giochi che ha in home, e al
     massimo `PER_GIOCO` righe per gioco — chi torna dopo un anno non
     viene sommerso, e il file non va potato a mano;
   - **le righe**: una riga di testo semplice, su un gioco che esiste;
   - **il segno**: un bambino nuovo parte dall'ultima, uno di ieri da
     zero, e «Letto» lo porta in fondo.

   Senza browser: `store/storage.js` degrada da sé all'archivio in
   memoria, che qui è un archivio come un altro.
   ═══════════════════════════════════════════════════════════════════ */
import { NOVITA, ULTIMA, PER_GIOCO, daLeggere } from '../../src/guide/novita-bambini.js'
import { CHIAVI_GIOCHI } from '../../src/data/giochi.js'
import { state, init, creaGiocatore, selectPlayer, resetPlayer,
         novitaLette, segnaNovitaLette } from '../../src/store/profile.js'
import { save, load, remove, chiavi, flush } from '../../src/store/storage.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ── 1. la regola, su righe finte ──
   Le righe vere cambiano ogni volta che c'è qualcosa da dire; la regola
   no, e si prova su righe che non cambiano mai. */
const FINTE = [
  { id: 1, gioco: 'torri', testo: 'uno' },
  { id: 2, gioco: 'torri', testo: 'due' },
  { id: 3, testo: 'tre, per tutti' },
  { id: 4, gioco: 'torri', testo: 'quattro' },
  { id: 5, gioco: 'torri', testo: 'cinque' },
  { id: 6, gioco: 'torri', testo: 'sei' },
  { id: 7, gioco: 'fattoria', testo: 'sette' },
]
const tutti = () => true
const ids = gruppi => gruppi.flatMap(g => g.voci).map(v => v.id)

let g = daLeggere(0, tutti, FINTE)
uguale('mai letto niente: un gruppo per gioco, più quello di tutti', g.length, 3)
uguale('in cima il gioco della riga più fresca', g[0].gioco, 'fattoria')
const castello = g.find(x => x.gioco === 'torri')
uguale('di un gioco si leggono solo le ultime', castello.voci.length, PER_GIOCO)
uguale('dalla più fresca', castello.voci[0].id, 6)
controlla('e le più vecchie restano fuori', !castello.voci.some(v => v.id === 1))
stessaLista('le novità di tutti stanno in un gruppo senza gioco',
            ids(g.filter(x => x.gioco === null)), [3])

stessaLista('letto fino alla quinta: restano la settima e la sesta',
            ids(daLeggere(5, tutti, FINTE)), [7, 6])
uguale('letto tutto: niente', daLeggere(7, tutti, FINTE).length, 0)
uguale('un segno che non è un numero vale zero',
       daLeggere(undefined, tutti, FINTE).length, 3)

g = daLeggere(0, k => k !== 'torri', FINTE)
controlla('chi il castello non ce l\'ha non ne legge le righe',
          !g.some(x => x.gioco === 'torri'))
controlla('ma quelle di tutti sì', g.some(x => x.gioco === null))

/* chi torna dopo un anno: cinquanta righe su cinque giochi */
const GIOCHI_FINTI = ['torri', 'mate', 'fattoria', 'pozioni', 'corsa']
const TANTE = Array.from({ length: 50 }, (_, i) =>
  ({ id: i + 1, gioco: GIOCHI_FINTI[i % 5], testo: 'riga' }))
uguale('cinquanta righe su cinque giochi: se ne leggono quattro a gioco',
       ids(daLeggere(0, tutti, TANTE)).length, 5 * PER_GIOCO)

/* ── 2. le righe vere ── */
const LUNGA = 70
const numeri = NOVITA.map(n => n.id)
uguale('gli id non si ripetono', new Set(numeri).size, numeri.length)
controlla('e sono interi positivi', numeri.every(i => Number.isInteger(i) && i > 0))
uguale('ULTIMA è il più alto', ULTIMA, Math.max(0, ...numeri))
for (const n of NOVITA) {
  const chi = `la novità ${n.id}`
  controlla(`${chi} ha una data vera`,
            /^\d{4}-\d{2}-\d{2}$/.test(n.quando || '') && !isNaN(Date.parse(n.quando)), n.quando)
  controlla(`${chi} parla di un gioco che esiste`,
            n.gioco == null || CHIAVI_GIOCHI.includes(n.gioco), n.gioco)
  controlla(`${chi} è una riga, non un papiro`,
            typeof n.testo === 'string' && n.testo.length > 0 && n.testo.length <= LUNGA,
            `${n.testo?.length} caratteri, il tetto è ${LUNGA}`)
  controlla(`${chi} è testo semplice: niente HTML e niente **`, !/[<>]|\*\*/.test(n.testo))
}

/* ── 3. il segno, sul profilo vero ── */
async function pulisci() {
  for (const k of await chiavi('')) await remove(k)
  state.giocatori = []
  state.player = ''
}
await pulisci()
await init()

const nuovo = await creaGiocatore('Nuovo')
uguale('un bambino appena creato parte dall\'ultima', novitaLette(), ULTIMA)
uguale('quindi non ha niente da leggere', daLeggere(novitaLette()).length, 0)

const fuori = await creaGiocatore('Fuori', false)
uguale('anche quello creato senza entrarci',
       (await load('profilo:' + fuori))?.settings?.novitaLette, ULTIMA)

/* un bambino di ieri: il profilo c'è, il segno no — è la casa che
   giocava prima che le novità esistessero, e le vede tutte */
save('profilo:ieri', { v: 7, coins: 0, settings: { eta: 8 } })
await flush()
await selectPlayer('ieri')
uguale('un bambino di ieri parte da zero', novitaLette(), 0)
uguale('e la sua età resta dov\'era', state.profile.settings.eta, 8)

await segnaNovitaLette()
uguale('«Letto» lo porta all\'ultima', novitaLette(), ULTIMA)
await selectPlayer(nuovo)
await selectPlayer('ieri')
uguale('e il segno resta, riaprendo il profilo', novitaLette(), ULTIMA)

/* cancellare i progressi è ricominciare le tappe, non tornare a non
   aver mai visto i giochi */
state.profile.settings.novitaLette = 0
await resetPlayer()
uguale('dopo aver cancellato i progressi non tornano le novità di prima',
       novitaLette(), ULTIMA)

nota(`${NOVITA.length} novità nell'elenco, al massimo ${PER_GIOCO} per gioco a schermo`)
riassunto('Le novità per i bambini')
