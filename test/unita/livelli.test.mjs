/* ═══════════════════════════════════════════════════════════════════
   TUTTI I LIVELLI DEL GENERALE, SULLO STESSO BANCO
   ── QUANTO COSTA ──
   Un decimo di secondo per NOVE livelli, tutte le scene, tutte le
   soluzioni e le mutazioni che il banco genera da sé. Qui c'era
   scritto «un tempo massimo di sei secondi», sei secondi di budget: una dichiarazione
   rimasta da quando questo banco faceva un'altra cosa. Costava caro —
   `--svelti` la leggeva e saltava proprio il test che serve mentre si
   lavora sul motore. Un tempo dichiarato è una promessa: quando non è
   più vera va tolta, non alzata.

   Un test solo, non uno per scenario. Raccoglie i livelli da dove
   stanno — i sei (e più) scenari delle storie in `src/data/livelli/` e
   quelli di prova in `src/data/generale.js` — e li passa al
   verificatore, che è uguale per tutti (`test/aiuto/livello.mjs`).

   I file non si elencano a mano: si leggono dalla cartella, come fa
   `data/mappe-storie.js` col glob di Vite. Uno scenario nuovo entra nel
   banco di prova il giorno in cui il suo file compare, senza che
   nessuno debba ricordarsi di aggiungere una riga qui.

   Quello che uno scenario ha di suo — «senza la chiavetta non si
   vince», «non basta mandarli avanti in fila» — non sta qui: sta nel
   campo `verifiche` del livello, e il verificatore lo esegue. Il
   contratto di quel campo è scritto in testa a `test/aiuto/livello.mjs`.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, riassunto } from '../aiuto/verifica.mjs'
import { provaLivello } from '../aiuto/livello.mjs'
import { chi, cose, OPZIONI, controllaOpzioni } from '../../src/data/livelli/scrivi.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/data/livelli')
const PROVA = resolve(RADICE, 'src/data/generale.js')

/* un modulo può esportare il livello come default o con un nome: si
   prende il primo oggetto che assomiglia a un livello — la stessa
   regola di `data/mappe-storie.js`, che è quella che vale nel gioco */
const estrai = mod => [mod.default, mod.LIVELLO, mod.livello, ...Object.values(mod)]
  .find(v => v && typeof v === 'object' && !Array.isArray(v) && (v.scena || v.griglia || v.unita)) || null

const livelli = []

/* si scende anche nelle cartelle: da quando ogni campagna ha la sua
   (`tutorial/`, `todo/`), i livelli non stanno più tutti in fila */
const tuttiIFile = dove => existsSync(dove)
  ? readdirSync(dove).sort().flatMap(x => {
      const pieno = resolve(dove, x)
      /* i moduli con cui i livelli si SCRIVONO non sono livelli, ed è
         giusto che non lo siano: stanno in questo elenco perché il
         banco non li scambi per uno scenario rotto */
      const SUPPORTO = new Set(['scorciatoie.js', 'livello.js', 'scrivi.js'])
      /* `todo/` è la cartella delle cinque storie vecchie, che aspettano
         di essere riscritte nel formato nuovo: il banco non le prova,
         perché non sono in gioco */
      if (x === 'todo') return []
      return statSync(pieno).isDirectory() ? tuttiIFile(pieno)
           : x.endsWith('.js') && !SUPPORTO.has(x) ? [pieno] : []
    })
  : []

if (existsSync(CARTELLA))
  for (const f of tuttiIFile(CARTELLA)) {
    const liv = estrai(await import(pathToFileURL(f).href))
    const corto = f.slice(CARTELLA.length + 1).replace(/\.js$/, '')
    if (liv) livelli.push({ nome: corto, liv })
    else controlla(`${corto}: esporta un livello`, false, 'non esporta niente che assomigli a un livello')
  }

if (existsSync(PROVA)) {
  const dati = await import(pathToFileURL(PROVA).href)
  const LIVELLI = dati.LIVELLI || dati.livelli || dati.default || []
  /* le prove del tutorial stanno in `livelli/tutorial/` e sono già
     state raccolte lì sopra: qui si prende l'ORDINE, che è la cosa che
     solo questo elenco sa, e non si conta due volte lo stesso livello */
  const gia = new Set(livelli.map(x => x.liv && x.liv.id))
  LIVELLI.forEach((liv, i) => {
    if (gia.has(liv.id)) return
    livelli.push({ nome: `prova ${i + 1}. ${liv.nome || liv.id}`, liv })
  })
}

controlla('i livelli si raccolgono da soli', livelli.length > 0)
const ids = livelli.map(x => x.liv.id)
controlla('gli id dei livelli sono unici', new Set(ids).size === ids.length,
          ids.filter((x, i) => ids.indexOf(x) !== i).join(', '))

for (const { nome, liv } of livelli) provaLivello(liv, nome)

/* ── LE OPZIONI SI CONFRONTANO CON UN ELENCO DI QUELLE CHE ESISTONO ──
   I controlli qui sopra provano i livelli che ci sono; questi provano
   il CONTROLLO, cioè che un livello scritto male non riesca a nascere.

   La regola vera sta in `scrivi.js` ed è un elenco di **ammesse** per
   genere (`OPZIONI`): tutto quello che non c'è dentro non passa. Qui
   non si riscrive quell'elenco — sarebbe la stessa cosa detta due
   volte, e la copia invecchierebbe per prima: si prova che il confronto
   faccia il suo mestiere, dalle due parti. Che ogni chiave ammessa
   passi serve quanto l'altra metà: è il controllo che diventa rosso il
   giorno che qualcuno **restringe** l'elenco senza accorgersi che il
   motore quella chiave la legge ancora.

   Nessuna chiave di prova è scritta a mano: quella buona viene
   dall'elenco, quella cattiva è costruita per non poterci stare, e il
   refuso si ottiene storpiandone una vera. Un test scritto sui casi
   storici — «rifiuta *accorre*» — direbbe la verità solo finché quella
   parola resta morta, e non direbbe niente su tutte le altre.

   (Il guasto da cui è nata questa rete: il carceriere della sesta prova
   era `{ accorre: 'richiamo' }`, chiave non più letta da nessuno da
   quando chi corre al rumore si dichiara con `reagisce`. Passava
   liscia, il carceriere non si muoveva, e il livello che insegna «il
   rumore sposta chi lo sente» era l'unico dove il rumore non spostava
   niente: il banco poteva solo dire «perde», mai «perché».) */
{
  const scoppia = fai => { try { fai(); return null } catch (e) { return e.message } }

  /* ── LE VERE PASSANO TUTTE ──
     Si prende l'elenco delle ammesse e lo si scrive per intero: se
     qualcuno restringe la lista senza accorgersi che il motore quella
     chiave la legge ancora, il rosso arriva qui e non tre livelli
     più in là. */
  for (const [genere, ammesse] of Object.entries(OPZIONI)) {
    const finto = Object.fromEntries(ammesse.map(k => [k, 1]))
    controlla(`${genere}: le sue opzioni sono tutte scrivibili`,
              !scoppia(() => controllaOpzioni(genere, 'prova', finto)))
  }

  /* ── E UNA CHE NON È NELL'ELENCO NON PASSA ──
     La chiave di prova non è una storica né una inventata a mano: è
     costruita perché **non possa** stare nell'elenco, così questo
     controllo dice la regola e non un aneddoto. */
  for (const genere of Object.keys(OPZIONI))
    controlla(`${genere}: una chiave fuori elenco non passa in silenzio`,
              !!scoppia(() => controllaOpzioni(genere, 'prova', { ['non-esiste-' + genere]: 1 })))

  /* ── E DICE QUALE INTENDEVI ──
     Un errore che dice solo «non esiste» costringe ad aprire un file;
     uno che dice «forse intendevi vista» si legge e si chiude. Si prova
     su un refuso costruito da una chiave vera, togliendole una lettera:
     vale per qualunque elenco, oggi e domani. */
  const vera = OPZIONI.unita[2]                       // una chiave vera qualsiasi
  const storpiata = vera.slice(0, -1)
  const detto = scoppia(() => controllaOpzioni('unita', 'prova', { [storpiata]: 1 })) || ''
  controlla(`un refuso su «${vera}» suggerisce la chiave giusta`,
            detto.includes(vera), detto.split('\n')[0] || 'accettato in silenzio')

  /* e la stessa regola vale passando dalle fabbriche, che è come la
     incontra chi scrive un livello */
  controlla('la fabbrica di un\'unità applica lo stesso controllo',
            !!scoppia(() => chi.nemico('tale', { ['non-esiste']: 4 })))
  controlla('e quella di una porta pure',
            !!scoppia(() => cose.porta('p', { ['non-esiste']: 'oro' })))
}

nota(`livelli sul banco: ${livelli.length} — ${livelli.map(x => x.nome).join(', ')}`)
const dichiarano = livelli.filter(x => x.liv.verifiche)
nota(`con prove dichiarate: ${dichiarano.length ? dichiarano.map(x => x.nome).join(', ') : 'nessuno'}`)

riassunto('i livelli del Generale')
