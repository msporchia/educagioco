/* ═══════════════════════════════════════════════════════════════════
   IL FORMATO DEI LIVELLI DEL GENERALE

   Un livello è scritto a mano: ASCII art più metadati. Il validatore
   (`strumenti/mappe/nucleo.js`) è quello che sta fra «l'ho scritto» e
   «si può giocare», e serve a due persone diverse: al papà che aggiunge
   una tappa, e all'editor che gliela mostra mentre la disegna.

   Qui si controllano due cose:

     1. i livelli buoni passano — gli esempi del repo e, se c'è già,
        quelli veri di `src/data/generale.js`
     2. ogni difetto viene preso, uno per uno, e **col messaggio
        giusto**: un validatore che dice «errore riga 3» costringe a
        contare i caratteri, che è esattamente il lavoro che doveva
        togliere di mezzo. Per questo ogni controllo non guarda solo che
        il livello sia rifiutato, ma che nel guaio ci sia scritta la
        parola che spiega perché.
   ═══════════════════════════════════════════════════════════════════ */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { validaTutto, valida, leggi, scrivi, MAPPE, livelliDi }
  from '../../strumenti/mappe/valida.mjs'
import { LIVELLI } from '../../strumenti/mappe/esempi/livelli.mjs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/* ── 1. i livelli buoni passano ── */
for (const liv of LIVELLI) {
  const esito = validaTutto(liv)
  controlla(`«${liv.nome}» è un livello ben formato`, esito.ok, esito.errori.join(' · '))
  controlla(`«${liv.nome}» non ha nemmeno avvisi`, esito.avvisi.length === 0,
            esito.avvisi.join(' · '))
}
nota(`esempi controllati: ${LIVELLI.map(l => l.nome).join(', ')}`)

/* ── 2. il giro di ritorno: testo → livello → testo ──
   È il giro che fa l'editor ogni volta che si incolla un livello. Se
   non torna identico, l'editor perde pezzi per strada. */
{
  const testo = scrivi(LIVELLI[0])
  const riletto = leggi(testo)
  uguale('scrivere e rileggere non cambia niente', scrivi(riletto), testo)
  /* Le chiavi di un ordine escono sempre nella stessa fila, comunque
     siano state messe dentro. È quello che permette al costruttore a
     menu dell'editor di sputare lo stesso testo di un ordine scritto a
     mano: senza, il giro «costruisco → copio → rincollo» tornerebbe
     indietro uguale nella sostanza e diverso nel testo. */
  {
    const rimescolato = leggi(testo)
    rimescolato.soluzioni[0].ordini[0] = { bersaglio: 'chiave', chi: 'eroe', fai: 'prendi' }
    controlla('un ordine si scrive sempre chi · quando · fai · bersaglio · finché',
              scrivi(rimescolato).includes("{ chi: 'eroe', fai: 'prendi', bersaglio: 'chiave' }"),
              scrivi(rimescolato).split('\n').filter(r => r.includes('prendi')).join(' ⏐ '))
  }
  controlla('il testo scritto è quello che si incolla in un file .js',
            testo.startsWith('{') && testo.includes("mappa: [") && testo.includes("'##############'"),
            testo.slice(0, 60))
  controlla('un livello riletto è ancora valido', validaTutto(riletto).ok)
  controlla('leggere un testo che non è un livello dà un errore leggibile',
            provaARompere(() => leggi('non { un livello')).includes('leggibile'))
}
function provaARompere(f) { try { f(); return '' } catch (e) { return e.message } }

/* ── 3. ogni difetto ha il suo messaggio ──
   `rotto` parte dal livello buono, gli guasta una cosa sola, e pretende
   che il validatore lo rifiuti *e* dica la parola giusta. */
const BUONO = LIVELLI[0]
const copia = x => JSON.parse(JSON.stringify(x))

function rotto(cosa, guasta, parola) {
  const liv = copia(BUONO)
  guasta(liv)
  const esito = validaTutto(liv)
  if (!controlla(`rifiuta: ${cosa}`, !esito.ok, 'passa senza dire niente')) return
  const detto = esito.errori.join(' ⏐ ')
  controlla(`e lo spiega: ${cosa}`, detto.toLowerCase().includes(parola.toLowerCase()),
            `nessun errore parla di «${parola}» — dice: ${detto}`)
}

rotto('la griglia non è rettangolare',
      l => { l.mappa[3] = l.mappa[3].slice(0, -2) }, 'rettangolare')

rotto('il bordo è aperto',
      l => { l.mappa[0] = '#####.########' }, 'bordo è aperto')

rotto('c\'è un simbolo che non è nella legenda',
      l => { l.mappa[2] = MAPPE.sostituisci(l.mappa[2], 7, 'Q') }, 'non è nella legenda')

rotto('l\'eroe non c\'è',
      l => { l.mappa[2] = MAPPE.sostituisci(l.mappa[2], 2, '.') }, "manca l'eroe")

rotto('gli eroi sono due',
      l => { l.mappa[3] = MAPPE.sostituisci(l.mappa[3], 2, '@') }, '2 eroi')

/* il difetto che il papà farà davvero: cancella la chiave dalla mappa e
   si dimentica dei tre ordini che la citano */
rotto('un bersaglio citato dagli ordini non è sulla mappa',
      l => { l.mappa[4] = MAPPE.sostituisci(l.mappa[4], 3, '.') }, 'chiave')

rotto('un ordine cita una cosa che non esiste in nessun modo',
      l => { l.soluzioni[0].ordini[0].bersaglio = 'fontana' }, 'fontana')

rotto('un ordine chiede una cosa che quel verbo non accetta',
      l => { l.ordini[0].bersaglio = 'tesoro' }, 'pattuglia')

rotto('un ordine è firmato a qualcuno che non c\'è',
      l => { l.ordini[0].chi = 'drago' }, 'drago')

rotto('il livello dà ordini alle unità del giocatore',
      l => { l.ordini[0].chi = 'eroe' }, 'del giocatore')

rotto('la soluzione comanda un nemico',
      l => { l.soluzioni[0].ordini[0].chi = 'ladra' }, 'non può dare ordini')

rotto('la soluzione usa un ordine che non è in cassetta',
      l => { l.cassetta = ['vai'] }, 'cassetta')

rotto('una zona è dichiarata ma non è disegnata',
      l => { l.zone.Z = 'cantina' }, 'cantina')

rotto('il calco usa una lettera che nessuno ha battezzato',
      l => { l.calco[1] = MAPPE.sostituisci(l.calco[1], 2, 'Z') }, 'Z')

rotto('il calco non è sovrapponibile alla mappa',
      l => { l.calco.pop() }, 'sovrapponibil')

rotto('una zona copre dei muri',
      l => { l.calco[1] = 'AAAAAAAAAAAAAA' }, 'muri')

rotto('una ronda passa da una zona che non c\'è',
      l => { l.ronde = { giro: ['A', 'Z'] } }, 'ronda')

rotto('il par è zero',
      l => { l.par = 0 }, 'maggiore di zero')

rotto('il par manca del tutto',
      l => { delete l.par }, 'par')

rotto('la soluzione è più lunga del par',
      l => { l.par = 2 }, 'par')

rotto('la soluzione non c\'è',
      l => { l.soluzioni = [] }, 'soluzione')

rotto('una condizione è scritta a caso',
      l => { l.ordini[0].finche = 'quando mi va' }, 'condizione')

rotto('una condizione cita un bersaglio del genere sbagliato',
      l => { l.ordini[0].finche = 'aperto:eroe' }, 'aperto')

rotto('un\'unità non sta in nessuna fazione',
      l => { l.fazioni.banditi.simboli = 'oc' }, 'fazione')

rotto('nessuno comanda il giocatore',
      l => { l.fazioni.nostri.autore = 'livello' }, 'giocatore')

rotto('una fazione ha un autore inventato',
      l => { l.fazioni.nostri.autore = 'computer' }, 'autore')

rotto('la cassetta è vuota',
      l => { l.cassetta = [] }, 'cassetta')

rotto('manca il racconto',
      l => { delete l.racconto }, 'racconto')

rotto('il tesoro è murato',
      l => { l.mappa[1] = '#....#.#####.#'; l.mappa[3] = '#....#.#####.#'
             l.mappa[2] = '#.@..#.#.T.#.#' }, 'murato')

rotto('una variante sposta un simbolo che non è unico',
      l => { l.varianti[0].sposta = { '.': [1, 1] } }, 'una volta sola')

rotto('una variante mette un simbolo dentro un muro',
      l => { l.varianti[0].sposta = { k: [0, 0] } }, 'già')

/* ── il terzo lato del filtro: chi lo esegue ──
   Un verbo che esiste, con un bersaglio del genere giusto, può essere
   lo stesso impossibile: il cane non apre i portoni. È la regola che
   rende diverse fra loro le unità di una tappa. */
rotto('un\'unità a cui si chiede una cosa che non sa fare',
      l => { l.ordini[0] = { chi: 'guardia', fai: 'prendi', bersaglio: 'tesoro' } }, 'non sa')

rotto('e lo dice anche quando è la soluzione a chiederlo',
      l => { l.mappa[5] = MAPPE.sostituisci(l.mappa[5], 2, 'e')
             l.soluzioni[0].ordini[1] = { chi: 'esploratore', fai: 'apri', bersaglio: 'portone' } },
      'esploratore')

{
  const sa = MAPPE.LEGENDA['c'].sa
  controlla('il cane sa correre e abbaiare ma non aprire',
            sa.includes('vai') && sa.includes('chiama') && !sa.includes('apri'), sa.join(' '))
  controlla('l\'eroe sa fare tutto', Object.keys(MAPPE.VERBI)
            .every(v => MAPPE.LEGENDA['@'].sa.includes(v)))
  uguale('i verbi offerti a due unità insieme sono quelli che sanno tutte e due',
         MAPPE.sannoTutti([{ ch: '@' }, { ch: 'c' }]).join(' '), MAPPE.LEGENDA['c'].sa.join(' '))
}

rotto('l\'unica soluzione è segnata fragile',
      l => { l.soluzioni[0].fragile = true }, 'fragile')

rotto('«fragile» non è né sì né no',
      l => { l.soluzioni[0].fragile = 'quasi' }, 'fragile')

/* ── IL SABOTAGGIO, «QUALE» E L'OPPURE ──
   Le tre cose che il motore ha imparato e che questo formato deve dire
   nello stesso modo: si attaccano anche le cose (ma solo quelle
   rompibili), un ordine può dire quale di un gruppo, e una condizione
   può essere un «oppure» scritto con la barra. */

rotto('si attacca una cosa che non si rompe',
      l => { l.mappa[4] = MAPPE.sostituisci(l.mappa[4], 3, 'k')
             l.cassetta.push('attacca')
             l.soluzioni[0].ordini.unshift({ chi: 'eroe', fai: 'attacca', bersaglio: 'chiave' }) },
      'non si rompe')

rotto('un «quale» che nessuno sa cosa voglia dire',
      l => { l.ordini[0] = { chi: 'guardia', fai: 'attacca', bersaglio: 'eroe', quale: 'quellobello' } },
      'quale')

rotto('un «quale» appiccicato a una cosa sola',
      l => { l.ordini[0] = { chi: 'guardia', fai: 'vai', bersaglio: 'tesoro', quale: 'lontano' } },
      'una cosa sola')

rotto('un oppure con niente da una parte',
      l => { l.ordini[0].finche = 'vedi:eroe|' }, 'barra')

rotto('un oppure con una metà scritta a caso',
      l => { l.ordini[0].finche = 'vedi:eroe|quando mi va' }, 'condizione')

{
  const liv = copia(BUONO)
  /* il tamburo al posto della chiave, e lo si sfonda: è il capitolo che
     prima si poteva solo raccontare come «portalo via» */
  liv.mappa[1] = MAPPE.sostituisci(liv.mappa[1], 3, 'd')
  liv.cassetta.push('attacca')
  liv.ordini[0].finche = 'vedi:eroe|rotto:tamburo'
  liv.ordini.push({ chi: 'guardia', quando: 'rotto:tamburo',
                    fai: 'attacca', bersaglio: 'eroe', quale: 'vicino' })
  liv.soluzioni[0].ordini.unshift({ chi: 'eroe', fai: 'attacca', bersaglio: 'tamburo' })
  liv.par = liv.soluzioni[0].ordini.length
  const esito = validaTutto(liv)
  controlla('un tamburo sfondato, un «quale» e un oppure passano insieme',
            esito.ok, esito.errori.join(' ⏐ '))
  uguale('il tamburo è la cosa rompibile della legenda',
         Object.entries(MAPPE.LEGENDA).filter(([, v]) => v.rompibile).map(([k]) => k).join(','), 'd')
  controlla('e i criteri del «quale» sono quelli del motore',
            ['vicino', 'lontano', 'debole', 'forte'].every(k => MAPPE.QUALI[k]),
            Object.keys(MAPPE.QUALI).join(','))
}

/* Una soluzione fragile è quella che vince la base e cade su una
   variante: è il pezzo che dimostra che le tre scene servono. Accanto a
   una buona ci può stare eccome — ed essendo il piano corto, il par
   largo di manica non glielo si rinfaccia. */
{
  const liv = copia(BUONO)
  liv.soluzioni.push({ nome: 'la scorciatoia', fragile: true,
                       ordini: [{ chi: 'eroe', fai: 'vai', bersaglio: 'tesoro' }] })
  const esito = validaTutto(liv)
  controlla('una soluzione fragile accanto a una buona passa', esito.ok, esito.errori.join(' ⏐ '))
  controlla('e a una fragile corta non si dice che il par è largo di manica',
            !esito.avvisi.some(m => m.includes('scorciatoia')), esito.avvisi.join(' ⏐ '))
}

/* un difetto che c'è **solo** in una variante: senza il controllo su
   tutte le versioni, questo è il guaio che si scopre giocando */
{
  const liv = copia(BUONO)
  liv.varianti[1] = { nome: 'rotta', mappa: liv.mappa.map((r, i) => i === 4 ? r.replace('k', '.') : r) }
  const esito = validaTutto(liv)
  controlla('un difetto che sta solo in una variante viene preso lo stesso', !esito.ok)
  controlla('e dice in quale variante sta',
            esito.errori.some(m => m.startsWith('variante 2')), esito.errori.join(' ⏐ '))
}

/* ── 4. gli avvisi non bocciano, ma si vedono ── */
{
  const liv = copia(BUONO)
  liv.varianti = []
  const esito = validaTutto(liv)
  controlla('un livello con una versione sola passa ma avvisa', esito.ok)
  controlla('e dice che di versioni ne servono tre',
            esito.avvisi.some(m => m.includes('tre')), esito.avvisi.join(' ⏐ '))
}
{
  const liv = copia(BUONO)
  liv.par = 6
  const esito = validaTutto(liv)
  controlla('un par largo di manica è solo un avviso',
            esito.ok && esito.avvisi.some(m => m.includes('largo di manica')),
            esito.errori.concat(esito.avvisi).join(' ⏐ '))
}
{
  const liv = copia(BUONO)
  liv.calco = liv.calco.map((r, y) => y === 4 ? r : r.replace(/B/g, '.'))
  const esito = validaTutto(liv)
  controlla('una zona in due pezzi è un avviso, non un errore',
            esito.ok || !esito.errori.some(m => m.includes('pezzi')))
}

/* ── 5. i livelli veri, quando ci saranno ──
   `src/data/generale.js` lo sta scrivendo qualcun altro. Finché non c'è
   — o finché non è scritto in questo formato — questo test lo salta e
   resta verde: un test che si lamenta di un file che non esiste ancora
   è solo rumore. */
const GIOCO = resolve(RADICE, 'src/data/generale.js')
if (!existsSync(GIOCO)) {
  nota('`src/data/generale.js` non c\'è ancora: i livelli veri li controllerò quando arrivano')
} else {
  const modulo = await import(GIOCO)
  const livelli = livelliDi(modulo).filter(l => Array.isArray(l.mappa) && typeof l.par === 'number')
  if (!livelli.length) {
    nota('`src/data/generale.js` c\'è ma non esporta livelli in questo formato: salto')
  } else {
    for (const liv of livelli) {
      const esito = validaTutto(liv)
      controlla(`livello vero «${liv.nome || liv.id}» ben formato`, esito.ok, esito.errori.join(' · '))
    }
    nota(`livelli veri controllati: ${livelli.length}`)
  }
}

/* ── 6. le 24 tappe che l'editor si porta dentro ──
   `strumenti/mappe/campagne.js` è un ritratto di
   `src/data/campagne-generale.js`, fatto perché l'editor si apre da
   `file://` e lì i moduli non si caricano. Un ritratto si scolora: qui
   si confronta la firma, ed è l'unico modo di accorgersi che qualcuno
   ha aggiunto una tappa e nell'editor non c'è. */
{
  const { estrai, firmaDi, firmaScritta } = await import('../../strumenti/mappe/estrai-campagne.mjs')
  const dati = await import(resolve(RADICE, 'src/data/campagne-generale.js'))
  const quadro = estrai(dati)
  const quante = quadro.campagne.reduce((n, c) => n + c.tappe.length, 0)
  uguale('l\'editor conosce tutte le tappe delle campagne', firmaScritta(), firmaDi(quadro),
         'campagne.js è vecchio: rilancia `node strumenti/mappe/estrai-campagne.mjs`')
  controlla(`le tappe da disegnare sono ${quante}`, quante === 24, String(quante))
  /* la cassetta della campagna è scritta in un vocabolario più fine di
     questo formato: quello che si traduce dev'essere un verbo vero */
  const fuori = []
  for (const c of quadro.campagne) for (const t of c.tappe)
    for (const v of t.cassetta) if (!MAPPE.VERBI[v]) fuori.push(`${c.id}/${t.id}: «${v}»`)
  controlla('la cassetta tradotta contiene solo verbi che esistono', !fuori.length, fuori.join(' ⏐ '))
  const vuote = quadro.campagne.flatMap(c => c.tappe.filter(t => !t.cassetta.length)
                                                    .map(t => c.id + '/' + t.id))
  nota(vuote.length
    ? `tappe che il formato non sa ancora esprimere (cassetta vuota): ${vuote.join(', ')}`
    : 'tutte le tappe hanno una cassetta traducibile')
}

riassunto('il formato dei livelli del Generale')
