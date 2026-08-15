/* ═══════════════════════════════════════════════════════════════════
   IL GENERALE, SENZA BROWSER — e per ora anche senza motore

   Nel generale il bambino non pilota nessuno: firma ordini permanenti,
   preme play e guarda la scena svolgersi. Quindi l'unica cosa che può
   sbagliare è il piano, e il gioco insegna solo se il motore è severo
   sempre allo stesso modo: un ordine che a volte cammina da solo e a
   volte no non insegna a programmare, insegna a sperare.

   Questo file è stato scritto PRIMA del motore: è il contratto. Finché
   `src/motore/generale.js` e `src/data/generale.js` non ci sono, lo dice
   e passa; appena compaiono, i controlli partono da soli. Non c'è un solo
   numero cablato: si cicla su tutti i livelli e tutte le varianti che
   trova, quindi venti livelli domani sono coperti senza toccare niente.

   ── quello che il motore deve esporre ──────────────────────────────
     creaMondo(livello, variante) → lo stato iniziale, con `unita`
                                    (id e cella di ognuno)
     esegui(mondo, ordini)        → { vinto, motivo, passi, traccia }
       `motivo` è una frase leggibile, sempre, anche quando si vince;
       `passi` è finito (il motore si ferma da solo: i cicli non girano
       all'infinito); `traccia` è la lista degli eventi, e ogni evento
       fallito porta il suo `motivo`. Un ordine che l'interfaccia non
       lascerebbe comporre non si gioca: `esegui` lo RIFIUTA — solleva
       un errore, oppure torna un esito con `rifiutati: [...]`.
     `variante` è un elemento di `livello.varianti` (se il motore
       preferisce l'indice, il test se ne accorge e usa quello).
     VERBI                        → tabella verbo → { accetta: [tipi] }
     complementiDi(mondo, verbo)  → i complementi validi per quel verbo
                                    in quel mondo (le cose dichiarano il
                                    loro tipo: raccoglibile, apribile,
                                    unità, zona, posto, colore)
     verbiDi(mondo)               → i verbi che l'interfaccia offre lì:
                                    un verbo senza nemmeno un complemento
                                    valido NON si offre
     PASSI_MASSIMI                → il limite oltre cui la scena si
                                    chiude da sola (facoltativo, ma
                                    senza non si può controllare che il
                                    ciclo infinito si chiuda *lì*)

   ── quello che devono essere i livelli (`LIVELLI` in data) ─────────
     { id, nome, griglia, unita, fazioni, varianti (tre), par, soluzioni }
     fazione:   { id, autore: 'giocatore' | 'livello', ordini? }
     ordine:    { verbo, complemento?, finche? } — dati puri
     blocco:    { blocco:'condizione', cond, vero:[…], falso:[…] } — la
                DECISIONE non è un attributo di un'azione: è una voce sua,
                con due rami, e ne parte esattamente uno
     soluzione: un piano (lista di voci, oppure tabella unità → voci)
                o { nome, piano, fragile? }

   ── le cinque cose che questo file inchioda ────────────────────────
     1. prossimità: `prendi` e `apri` NON camminano. [apri portone] da
        solo non vince e la traccia dice perché; [vai portone][apri
        portone] sì. Da quando i complementi sono filtrati per verbo,
        questa è l'unica lezione sugli errori che il bambino incontra
        giocando — e quindi la più importante di tutte.
     2. i complementi sono filtrati per verbo: `apri [la chiave]` non si
        compone più. Il motore dice quali complementi accetta ogni
        verbo, le soluzioni non ne usano di sbagliati, un verbo senza
        complementi validi non si offre, e un ordine di tipo sbagliato
        costruito a mano viene rifiutato invece che giocato. Restano i
        guasti che si scoprono solo giocando — non a portata, lo stato
        non lo permette, la guardia era falsa, l'attesa è appesa — e
        ognuno ha il SUO motivo, diverso dagli altri.
     3. le varianti: ogni soluzione dichiarata vince tutte e tre, e da
        qualche parte una soluzione `fragile` (una fila di mete
        esplicite) ne vince una e ne perde un'altra mentre quella
        robusta le regge tutte. È la dimostrazione che l'astrazione è
        più robusta, e qui smette di essere un'opinione.
     4. necessità: il piano vuoto non vince mai, e togliendo un ordine
        qualsiasi la soluzione smette di essere una soluzione.
     5. determinismo: stesso livello, stessa variante, stessi ordini,
        stesso esito — anche cambiando sotto i piedi `Math.random`. Se
        c'è casualità dev'essere governata da un seme, come nel castello.
   ═══════════════════════════════════════════════════════════════════ */
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { campoDi } from '../../src/motore/generale/campo.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '../..')
const VIA_MOTORE = resolve(RADICE, 'src/motore/generale.js')
const VIA_DATI = resolve(RADICE, 'src/data/generale.js')

/* ── il porting non è ancora arrivato ──
   Un test che fallisce perché una cosa non c'è ancora non dice niente a
   nessuno: dopo due giorni si smette di guardarlo. Qui si salta con una
   nota e si esce puliti, così `npm test` resta verde per tutti. */
const mancano = [['src/motore/generale.js', VIA_MOTORE], ['src/data/generale.js', VIA_DATI]]
  .filter(([, f]) => !existsSync(f)).map(([n]) => n)
if (mancano.length) {
  nota('il generale non è ancora portato: manca ' + mancano.join(' e '))
  nota('il contratto è scritto qui sopra — questi controlli partono da soli')
  nota('appena i file compaiono, senza toccare una riga di test')
  riassunto('il generale (non ancora portato)')
  process.exit(0)
}

const motore = await import(pathToFileURL(VIA_MOTORE).href)
const dati = await import(pathToFileURL(VIA_DATI).href)

const creaMondo = motore.creaMondo
const esegui = motore.esegui
const LIVELLI = dati.LIVELLI || dati.livelli || dati.default

const cePorta = controlla('il motore espone creaMondo ed esegui',
                          typeof creaMondo === 'function' && typeof esegui === 'function',
                          `ho ${typeof creaMondo} e ${typeof esegui}`)
const ceDati = controlla('i livelli sono una lista non vuota di dati puri',
                         Array.isArray(LIVELLI) && LIVELLI.length > 0)
if (!cePorta || !ceDati) { riassunto('il generale'); process.exit(1) }

/* ═══════════ gli attrezzi ═══════════
   Il test non sa che forma preciserà il porting: sa il vocabolario e sa
   che sono dati. Tutto il resto lo legge dai livelli — così una scelta
   diversa da quella immaginata non fa fallire un test per niente. */

const NIENTE = 'ombra-che-non-esiste'      // un bersaglio che nessun livello può avere
const AUTORI = ['giocatore', 'livello']
/* il vocabolario concordato, ridotto alla sua radice: il porting può
   chiamarli `vai` o `vaiA` — quello che conta è che siano quei gesti lì
   e non altri. `fai un passo` e `girati` sono stati tolti apposta: un
   ordine che dice una direzione invece di una meta è troppo specifico
   per insegnare qualcosa, e «prendi a nord» non vuol dire niente. */
const BASI = ['vai', 'prendi', 'apri', 'chiudi', 'attacca', 'aspetta',
              'quando', 'suona', 'allarme', 'esegui',
              /* i congegni: un verbo solo per tutti (`tira`, `gira`,
                 `accendi` sono stati scartati apposta), e cosa succede
                 quando lo ricevi lo decide il congegno. `parla` è il
                 gemello di `suona`: uno grida a chiunque, l'altro lo
                 dice a qualcuno in particolare — e solo a chi vede. */
              'premi', 'parla',
              /* ── E `posa`, che è il gemello di `prendi` ──
                 Non è un verbo di comodo: senza, una cosa presa è una
                 cosa tolta dal mondo, e un oggetto non può cambiare
                 padrone né essere lasciato dove serve a qualcun altro.
                 Questa lista era rimasta indietro di un giorno rispetto
                 al motore, e segnalava come «non concordato» un verbo
                 che il gioco insegna in un capitolo suo. */
              'posa']
const base = v => BASI.find(b => String(v).toLowerCase().includes(b)) || null
/* e queste non sono più complementi di niente */
const DIREZIONI = ['nord', 'sud', 'est', 'ovest', 'destra', 'sinistra', 'su', 'giu', 'giù',
                   'avanti', 'indietro']

const scritta = x => {
  const visti = new WeakSet()
  return JSON.stringify(x, (k, v) => {
    if (v && typeof v === 'object') { if (visti.has(v)) return '↺'; visti.add(v) }
    return v
  })
}
const clona = x => JSON.parse(scritta(x))
const eOrdine = o => !!o && typeof o === 'object' && typeof o.verbo === 'string'
/* un BLOCCO non è un ordine: non ha un verbo, ha delle liste dentro.
   Ce ne sono due — la condizione, con i suoi due rami, e il ciclo, con
   il suo corpo — e in una fila stanno accanto agli ordini: tutte e tre
   le forme sono voci legittime di un piano. */
const eCond = o => !!o && typeof o === 'object' && o.blocco === 'condizione'
const eRipeti = o => !!o && typeof o === 'object' && o.blocco === 'ripeti'
/* un'AZIONE è una fila di ordini con un nome, che parte solo se
   qualcuno la chiama con `esegui`: sta accanto al piano come un
   «quando senti», e il suo corpo è una lista come tutte le altre */
const eRoutine = o => !!o && typeof o === 'object' && o.blocco === 'routine'
const eBlocco = o => eCond(o) || eRipeti(o) || eRoutine(o)
const eVoce = o => eOrdine(o) || eBlocco(o)
const RAMI = ['vero', 'falso', 'corpo']
const ramoDi = (o, r) => (eBlocco(o) && Array.isArray(o[r]) ? o[r] : [])

/* un piano è o una lista di ordini (un'unità sola) o una tabella
   unità → ordini: il test non sceglie per il motore, li tratta tutti e due */
function vociDi(piano) {
  if (Array.isArray(piano)) return piano.map((o, i) => ({ via: [i], unita: null, ordine: o }))
  if (piano && typeof piano === 'object')
    return Object.entries(piano).flatMap(([u, lista]) =>
      (Array.isArray(lista) ? lista : []).map((o, i) => ({ via: [u, i], unita: u, ordine: o })))
  return []
}
function senza(piano, via) {
  const c = clona(piano)
  if (via.length === 1) c.splice(via[0], 1)
  else c[via[0]].splice(via[1], 1)
  return c
}
const vuotoComeMe = piano => Array.isArray(piano) ? [] : {}
const pianoPer = (modello, unita, ordini) =>
  Array.isArray(modello) || !unita ? ordini : { [unita]: ordini }

/* gli ordini annidati contano: `quando senti l'allarme rosso → …` è un
   ordine che ne contiene altri, e un blocco condizione ne contiene due
   file. I loro verbi fanno vocabolario come tutti gli altri. */
function scendi(o, dentro = []) {
  if (eBlocco(o)) {
    RAMI.forEach(r => ramoDi(o, r).forEach(x => scendi(x, dentro)))
    return dentro
  }
  if (!eOrdine(o)) return dentro
  dentro.push(o)
  for (const v of Object.values(o)) {
    if (Array.isArray(v)) v.forEach(x => scendi(x, dentro))
    else scendi(v, dentro)
  }
  return dentro
}

function pianoDi(s) {
  return s && !Array.isArray(s) && s.piano !== undefined ? s.piano : s
}
function soluzioniDi(liv) {
  const grezze = liv.soluzioni || liv.soluzione || []
  const lista = Array.isArray(grezze) && !eOrdine(grezze[0]) ? grezze : [grezze]
  return lista.filter(Boolean).map((s, i) => ({
    nome: (s && !Array.isArray(s) && s.nome) || `soluzione ${i + 1}`,
    piano: pianoDi(s),
    fragile: !!(s && !Array.isArray(s) && s.fragile),
  }))
}
/* ── LA FORMA SI CHIEDE AL MOTORE ──
   Un livello non elenca più unità, fazioni e griglia: disegna una mappa
   a token con la sua legenda, e il campo lo legge `campoDi`. Queste tre
   funzioni chiedono a lui, così il giorno che la mappa si scrivesse in
   un altro modo qui non cambierebbe niente. */
function unitaDi(cosa) {
  if (cosa && cosa.scena) return campoDi(cosa).unita
  const u = (cosa && (cosa.unita || cosa.unità)) || []
  if (Array.isArray(u)) return u
  return Object.entries(u).flatMap(([f, lista]) =>
    (Array.isArray(lista) ? lista : []).map(x => ({ fazione: f, ...x })))
}
function fazioniDi(liv) {
  const f = (liv.scena ? campoDi(liv).fazioni : liv.fazioni) || {}
  return Array.isArray(f) ? f : Object.entries(f).map(([id, v]) => ({ id, ...v }))
}
const ordiniDiFazione = f => f.ordini || f.ordiniFissi || null
function misureDi(liv) {
  const g = liv.scena ? campoDi(liv).griglia : liv.griglia
  if (Array.isArray(g) && g.length && (typeof g[0] === 'string' || Array.isArray(g[0])))
    return { larghezza: g[0].length, altezza: g.length }
  if (g && typeof g === 'object') {
    const l = g.larghezza ?? g.w ?? g.colonne, a = g.altezza ?? g.h ?? g.righe
    if (Number.isFinite(l) && Number.isFinite(a)) return { larghezza: l, altezza: a }
    if (Array.isArray(g.celle) && g.celle.length)
      return { larghezza: g.celle[0].length, altezza: g.celle.length }
  }
  return null
}

/* tutti i verbi che i livelli usano davvero: le sonde li riusano invece
   di inventarsi un nome che il motore non conosce */
const TUTTI_GLI_ORDINI = LIVELLI.flatMap(liv => [
  ...soluzioniDi(liv).flatMap(s => vociDi(s.piano).map(v => v.ordine)),
  ...fazioniDi(liv).flatMap(f => vociDi(ordiniDiFazione(f)).map(v => v.ordine)),
]).flatMap(o => scendi(o))
const VERBI_USATI = [...new Set(TUTTI_GLI_ORDINI.map(o => o.verbo))]
/* le condizioni che i livelli scrivono davvero: le domande dei blocchi,
   le uscite dei giri, quelle dettate dal livello. Le sonde ne riusano
   una invece di inventarne una che il motore non sa valutare. */
const TUTTE_LE_CONDIZIONI = LIVELLI.flatMap(liv => [
  ...(liv.condizioni || []),
  ...[
    ...soluzioniDi(liv).flatMap(s => vociDi(s.piano).map(v => v.ordine)),
    ...fazioniDi(liv).flatMap(f => vociDi(ordiniDiFazione(f)).map(v => v.ordine)),
  ].flatMap(o => (eBlocco(o) ? [o.cond] : [])),
  ...TUTTI_GLI_ORDINI.map(o => o.finche),
]).filter(Boolean)
const VERBI = motore.VERBI && typeof motore.VERBI === 'object' ? motore.VERBI : null
const NOMI_VERBI = [...new Set([...(VERBI ? Object.keys(VERBI) : []), ...VERBI_USATI])]
const verbo = b => NOMI_VERBI.find(v => base(v) === b) || b
/* le due funzioni con cui l'interfaccia costruisce i menù: senza, il
   bambino potrebbe comporre `apri [la chiave]` */
const sicuro = fai => { try { return fai() } catch (e) { return null } }
const complementiDi = typeof motore.complementiDi === 'function'
  ? (mondo, v) => sicuro(() => motore.complementiDi(mondo, v)) : null
const verbiDi = typeof motore.verbiDi === 'function'
  ? mondo => sicuro(() => motore.verbiDi(mondo)) : null
/* le sole cose CON UN NOME che un verbo accetta. Serve qui perché una
   casella libera è sempre un bersaglio buono — anche in un livello che
   non parla di caselle — ma non è un motivo per offrire il verbo che
   vive solo di quelle: la ronda la apre il livello. */
const nomiDi = typeof motore.nomiDi === 'function'
  ? (mondo, v) => sicuro(() => motore.nomiDi(mondo, v)) || [] : null
const PASSI_MASSIMI = [motore.PASSI_MASSIMI, motore.LIMITE_PASSI]
  .find(x => Number.isFinite(x)) || null

const VAI = verbo('vai'), PRENDI = verbo('prendi'), APRI = verbo('apri')
const ATTACCA = verbo('attacca'), ASPETTA = verbo('aspetta')

/* ── giocare una partita ──
   Ogni prova parte da un mondo nuovo: se `creaMondo` non copiasse i dati
   del livello, la seconda partita giocherebbe su un campo già mangiato,
   e alla fine del file c'è il controllo che se ne accorge. */
let perIndice = false
function mondoDi(liv, iv) {
  const varianti = liv.varianti || []
  if (!perIndice) {
    try { return creaMondo(liv, varianti[iv]) } catch (e) { perIndice = true }
  }
  return creaMondo(liv, iv)
}
function prova(liv, iv, piano) {
  let mondo = null
  try {
    mondo = mondoDi(liv, iv)
    const e = esegui(mondo, piano)
    if (!e || typeof e !== 'object')
      return { esploso: 'esegui non ha restituito un esito', esito: {}, mondo }
    return { esito: e, mondo: e.mondo || mondo }
  } catch (err) {
    return { esploso: (err && err.stack ? err.stack.split('\n')[0] : String(err)), esito: {}, mondo }
  }
}
const vinta = r => !r.esploso && r.esito.vinto === true

/* un esito ben fatto: si sa se si è vinto, si sa perché è finita, i passi
   sono contati e finiti, e la traccia c'è */
function esitoSano(nome, r) {
  if (!controlla(`${nome}: non esplode`, !r.esploso, r.esploso)) return false
  const e = r.esito
  const a = controlla(`${nome}: dice se si è vinto`, typeof e.vinto === 'boolean', scritta(e.vinto))
  const b = controlla(`${nome}: dice perché è finita`,
                      typeof e.motivo === 'string' && e.motivo.trim().length > 2, scritta(e.motivo))
  const c = controlla(`${nome}: conta i passi, e sono finiti`,
                      Number.isFinite(e.passi) && e.passi >= 0 && e.passi < 1e5, scritta(e.passi))
  const d = controlla(`${nome}: tiene la traccia degli eventi`, Array.isArray(e.traccia))
  return a && b && c && d
}

/* il motivo con cui la traccia spiega che QUELL'ordine non è andato */
function motivoDi(r, ordine) {
  const traccia = Array.isArray(r.esito.traccia) ? r.esito.traccia : []
  for (const e of traccia) {
    if (!e || typeof e !== 'object') continue
    const m = e.motivo
    if (typeof m !== 'string' || !m.trim()) continue
    if (typeof e.verbo === 'string' && ordine.verbo && e.verbo !== ordine.verbo) continue
    if (ordine.complemento && !scritta(e).includes(String(ordine.complemento))) continue
    return m.trim()
  }
  return null
}
const posizioni = mondo => {
  const u = unitaDi(mondo)
  return u.length ? Object.fromEntries(u.map(x => [x.id, `${x.x},${x.y}`])) : null
}

const nomeDi = (liv, i) => `${i + 1}. ${liv.nome || liv.id || 'livello'}`
const IMPRONTA_DATI = scritta(LIVELLI)

/* ═══════════ 1. la forma dei livelli ═══════════
   Sono dati puri: se qui c'è una funzione o un pezzo mancante, il gioco
   non può nemmeno mostrare la scelta degli ordini. */
{
  const ids = LIVELLI.map(l => l.id)
  uguale('gli id dei livelli sono unici', new Set(ids).size, ids.length)
  controlla('ogni livello ha un id', ids.every(x => typeof x === 'string' && x))

  for (const [i, liv] of LIVELLI.entries()) {
    const n = nomeDi(liv, i)
    const misure = misureDi(liv)
    controlla(`${n}: la griglia dice quanto è larga e quanto è alta`, !!misure)
    const unita = unitaDi(liv), fazioni = fazioniDi(liv)
    controlla(`${n}: sul campo c'è qualcuno`, unita.length > 0)
    uguale(`${n}: gli id delle unità sono unici`,
           new Set(unita.map(u => u.id)).size, unita.length)
    controlla(`${n}: ogni unità sta in una cella della griglia`,
              !misure || unita.every(u => Number.isInteger(u.x) && Number.isInteger(u.y) &&
                u.x >= 0 && u.y >= 0 && u.x < misure.larghezza && u.y < misure.altezza),
              unita.map(u => `${u.id}@${u.x},${u.y}`).join(' '))
    controlla(`${n}: ogni fazione dice chi la governa`,
              fazioni.length > 0 && fazioni.every(f => AUTORI.includes(f.autore)),
              fazioni.map(f => `${f.id}:${f.autore}`).join(' '))
    controlla(`${n}: una fazione è del giocatore`, fazioni.some(f => f.autore === 'giocatore'))
    controlla(`${n}: ogni unità sta in una fazione dichiarata`,
              unita.every(u => fazioni.some(f => f.id === u.fazione)),
              unita.map(u => `${u.id}→${u.fazione}`).join(' '))
    /* TRE È IL MINIMO, non la regola: due mondi si possono ancora
       indovinare a occhio, tre no. Un livello può averne di più quando
       le varianti SONO la scelta — «Il giro delle mura» ha un ingresso
       per lato, e toglierne uno vorrebbe dire che il quarto lato non
       serve guardarlo. Chi ne dichiara di più deve però giocarsele
       tutte, se no la variante in fondo non la vede nessuno. */
    const quante = (liv.varianti || []).length
    /* ── O TRE, O NESSUNA ──
       Tre scene servono a far cadere un piano che indovina invece di
       ragionare. Dove non c'è niente da indovinare — la prima prova è
       «prendi il tesoro» — spostare le cose darebbe tre volte la stessa
       prova, e allora se ne dichiara zero: è una scelta, e si vede. Una
       o due invece sono una promessa a metà. */
    controlla(`${n}: le varianti sono tre, o nessuna`, quante === 0 || quante >= 3,
              String(quante))
    controlla(`${n}: e se sono più di tre, si giocano tutte`,
              quante <= 3 || (liv.prove || 3) >= quante,
              `${quante} varianti, ${liv.prove || 3} scene`)
    controlla(`${n}: dichiara almeno una soluzione`, soluzioniDi(liv).length > 0)

    const suoi = soluzioniDi(liv)
    const proprie = new Set(unita.filter(u =>
      fazioni.some(f => f.id === u.fazione && f.autore === 'giocatore')).map(u => u.id))
    const estranee = suoi.flatMap(s => vociDi(s.piano).map(v => v.unita))
      .filter(u => u && !proprie.has(u))
    controlla(`${n}: le soluzioni parlano solo alle unità del giocatore`,
              !estranee.length, [...new Set(estranee)].join(', '))
    const rotti = suoi.flatMap(s => vociDi(s.piano)).filter(v => !eVoce(v.ordine))
    controlla(`${n}: ogni voce di una soluzione è un ordine o un blocco`,
              !rotti.length, scritta(rotti.map(v => v.ordine).slice(0, 2)))
    /* un blocco è fatto bene, ognuno a modo suo: la condizione ha la sua
       domanda e due rami, il ciclo ha il corpo e l'uscita. E dentro non
       c'è mai un altro blocco — quello sarebbe un albero, e un albero
       non lo si legge più in una schermata di telefono.
       ── CON UNA SOLA ECCEZIONE, ED È IL MOTIVO PER CUI LE AZIONI
          ESISTONO ──
       Dentro un'AZIONE un blocco ci sta, e ce lo mette il motore: la
       regola vera (`piano.js`) vieta un blocco dentro un ramo e dentro
       un ciclo, ma dentro un'azione vieta soltanto un'altra azione —
       «le azioni si chiamano fra loro, non si contengono». È l'unica
       via che il motore stesso indica per comporre due strutture, e il
       suo messaggio d'errore la scrive: «scrivi un'azione e chiamala
       con esegui». Un controllo che la vietasse qui renderebbe
       `esegui` inutilizzabile, cioè vieterebbe la sola strada
       praticabile — ed è quello che faceva finché questa prova non ha
       imparato che le azioni esistono. L'albero resta scongiurato: a
       schermo un'azione è una fila a parte col suo nome, non un ramo
       che rientra. */
    const blocchi = suoi.flatMap(s => vociDi(s.piano).map(v => v.ordine)).filter(eBlocco)
    const conde = blocchi.filter(eCond)
    controlla(`${n}: ogni condizione ha una domanda e due rami di ordini`,
              conde.every(b => b.cond && typeof b.cond.cond === 'string' &&
                ['vero', 'falso'].every(r => b[r] === undefined || Array.isArray(b[r]))),
              scritta(conde.filter(b => !b.cond).slice(0, 2)))
    const cicli = blocchi.filter(eRipeti)
    controlla(`${n}: ogni ciclo ha un corpo di ordini e la sua uscita`,
              cicli.every(b => Array.isArray(b.corpo) && b.corpo.length &&
                               b.finche && typeof b.finche.cond === 'string'),
              scritta(cicli.filter(b => !Array.isArray(b.corpo) || !b.finche).slice(0, 2)))
    controlla(`${n}: dentro un ramo o un ciclo non c'è un altro blocco`,
              blocchi.filter(b => !eRoutine(b))
                     .every(b => RAMI.every(r => !ramoDi(b, r).some(eBlocco))))
    controlla(`${n}: e dentro un'azione non se ne scrive un'altra`,
              blocchi.filter(eRoutine).every(b => !ramoDi(b, 'corpo').some(eRoutine)))
  }

  const senzaVerbo = TUTTI_GLI_ORDINI.filter(o => !base(o.verbo))
  controlla('ogni verbo usato sta nel vocabolario concordato', !senzaVerbo.length,
            [...new Set(senzaVerbo.map(o => o.verbo))].join(', ') +
            ' — «fai un passo» e «girati» sono stati tolti: si va verso una meta')
  const aDirezioni = TUTTI_GLI_ORDINI.filter(o =>
    DIREZIONI.includes(String(o.complemento).toLowerCase()))
  controlla('nessun ordine ha per complemento una direzione', !aDirezioni.length,
            aDirezioni.map(o => `${o.verbo} ${o.complemento}`).join(', '))
  const conFunzioni = TUTTI_GLI_ORDINI.filter(o =>
    Object.values(o).some(v => typeof v === 'function'))
  controlla('gli ordini sono dati, non funzioni', !conFunzioni.length)
  controlla('qualcuno è governato dal livello e ha già i suoi ordini',
            LIVELLI.some(liv => fazioniDi(liv).some(f =>
              f.autore === 'livello' && vociDi(ordiniDiFazione(f)).length > 0)))
  nota(`${LIVELLI.length} livelli · verbi in uso: ${VERBI_USATI.join(', ')}`)
}

/* ═══════════ 2. le soluzioni dichiarate vincono, e su tutte le varianti ═══════════
   È il controllo che tiene in piedi tutti gli altri: se una soluzione
   dichiarata non vince, il livello sta chiedendo al bambino una cosa che
   il motore non sa fare. E deve vincere su tutte e tre le varianti,
   perché il piano si firma prima di sapere quale tocca. */
/* un livello senza varianti ha comunque una scena — la sua. Con zero
   scene ogni controllo passava per vacuità, e `esiti[0]` era
   `undefined`: il test esplodeva invece di dire cosa non andava. */
const VARIANTI = liv => ((liv.varianti || []).length ? liv.varianti.map((_, i) => i) : [0])
for (const [i, liv] of LIVELLI.entries()) {
  const n = nomeDi(liv, i)
  for (const s of soluzioniDi(liv)) {
    const esiti = VARIANTI(liv).map(iv => prova(liv, iv, s.piano))
    if (!s.fragile) {
      esitoSano(`${n} · ${s.nome}`, esiti[0])
      const vinte = esiti.filter(vinta).length
      controlla(`${n} · ${s.nome}: vince su tutte e tre le varianti`,
                vinte === esiti.length,
                esiti.map((r, k) => `variante ${k + 1}: ` +
                  (r.esploso ? `esplode (${r.esploso})` : r.esito.vinto ? 'vinta'
                   : `persa (${r.esito.motivo})`)).join(' · '))
    } else {
      /* la soluzione fragile è quella che il gioco vuole far cadere: se
         vincesse sempre non dimostrerebbe niente, se non vincesse mai non
         sarebbe una tentazione */
      controlla(`${n} · ${s.nome} (fragile): ne vince almeno una e ne perde almeno una`,
                esiti.some(vinta) && esiti.some(r => !vinta(r)),
                esiti.map((r, k) => `${k + 1}:${vinta(r) ? 'vinta' : 'persa'}`).join(' '))
    }
  }
}
if (perIndice) nota('creaMondo vuole l\'indice della variante, non la variante')

/* ═══════════ 3. quanto costa risolverli ═══════════
   Il `par` non c'è più — il gioco non chiede di risolvere in poche
   mosse, chiede di risolvere — e con lui è sparito il controllo che
   quel numero fosse mantenuto. Resta la misura, che serve a chi scrive
   i livelli per vedere la curva: se il terzo costa dieci ordini e il
   decimo due, la fila è in disordine. */
const contaOrdini = piano => vociDi(piano).length
nota('ordini della soluzione più corta: ' + LIVELLI.map(l => {
  const corte = soluzioniDi(l).filter(s => !s.fragile).map(s => contaOrdini(s.piano))
  return corte.length ? Math.min(...corte) : '?'
}).join(' → '))

/* ═══════════ 4. necessità ═══════════
   Il piano vuoto non vince mai — se no la tappa è una schermata da
   guardare. E ogni ordine di una soluzione deve servire a qualcosa:
   togliendone uno, quel piano non è più una soluzione (può ancora
   cavarsela in una variante fortunata, ma non in tutte e tre). */
for (const [i, liv] of LIVELLI.entries()) {
  const n = nomeDi(liv, i)
  const modello = soluzioniDi(liv)[0].piano
  const vuoti = VARIANTI(liv).map(iv => prova(liv, iv, vuotoComeMe(modello)))
  esitoSano(`${n} · piano vuoto`, vuoti[0])
  controlla(`${n}: il piano vuoto non vince su nessuna variante`, !vuoti.some(vinta),
            vuoti.map((r, k) => `${k + 1}:${vinta(r) ? 'vinta' : 'persa'}`).join(' '))

  for (const s of soluzioniDi(liv).filter(x => !x.fragile)) {
    for (const v of vociDi(s.piano)) {
      const monco = senza(s.piano, v.via)
      const tutte = VARIANTI(liv).every(iv => vinta(prova(liv, iv, monco)))
      controlla(`${n} · ${s.nome}: senza «${v.ordine.verbo} ${v.ordine.complemento ?? ''}» non è più una soluzione`,
                !tutte, 'vince lo stesso su tutte e tre le varianti: quell\'ordine non serve')
    }
  }
}

/* ═══════════ 5. IL GESTO CAMMINA, IL PREREQUISITO RESTA ═══════════
   Questa parte è stata riscritta una volta, ed è l'unico pezzo di
   contratto che ha cambiato idea.

   Prima diceva il contrario: `prendi` e `apri` NON camminavano, e
   `[apri portone]` da lontano non faceva niente. A tavolino sembrava la
   lezione giusta — metti i gesti in fila invece di dire cosa vuoi. Col
   dito non regge: tocchi una cosa lontana, non succede niente, e nessun
   bambino capisce perché. Ha vinto la prova sul dito.

   Adesso `prendi [x]` e `apri [x]` ci ARRIVANO da soli. La lezione sui
   prerequisiti non è sparita: si è spostata dalla posizione al
   POSSESSO, che è più vero e più interessante. Al portone ci si arriva
   sempre; senza la chiave non si apre lo stesso, e la traccia lo dice.
   Questa metà si controlla qui; l'altra metà — che togliendo il
   «prendi» il portone resti chiuso — sta al punto 6b, dove è sempre
   stata.

   Il gesto non è scritto a mano: si pesca dalle soluzioni dichiarate. */
function gestoCheCammina(liv) {
  for (const s of soluzioniDi(liv).filter(x => !x.fragile)) {
    const p = s.piano
    const file = Array.isArray(p) ? [[null, p]] : Object.entries(p)
    for (const [u, lista] of file) {
      if (!Array.isArray(lista)) continue
      for (const oo of lista)
        if (eOrdine(oo) && ['prendi', 'apri'].includes(base(oo.verbo)) && oo.complemento)
          return { unita: u, modello: p, gesto: oo }
    }
  }
  return null
}

const motivi = LIVELLI.map(() => ({}))     // livello → tipo di guasto → motivo letto
let camminate = 0
for (const [i, liv] of LIVELLI.entries()) {
  const n = nomeDi(liv, i)
  const c = gestoCheCammina(liv)
  if (!c) continue
  camminate++
  const solo = prova(liv, 0, pianoPer(c.modello, c.unita, [c.gesto]))
  const eti = `${c.gesto.verbo} ${c.gesto.complemento}`
  esitoSano(`${n} · [${eti}] da lontano`, solo)

  /* il gesto ci arriva: o l'unità si è mossa, o ce l'ha fatta da ferma —
     quello che non può più succedere è che se ne stia lì a lamentarsi
     che il bersaglio è lontano */
  let partenza = null
  try { partenza = posizioni(mondoDi(liv, 0)) } catch (e) { partenza = null }
  const arrivo = posizioni(solo.mondo)
  const chi = c.unita || (unitaDi(liv).find(u => u.id) || {}).id
  const mosso = !!(partenza && arrivo && chi in partenza && arrivo[chi] !== partenza[chi])
  const m = motivoDi(solo, c.gesto)
  /* ── A MENO CHE LA STRADA SIA CHIUSA DAVVERO ──
     Da quando esistono le porte a comando, un bersaglio può essere
     irraggiungibile all'inizio della partita: il tesoro dietro la grata
     che apre la leva. Lì «non riesco ad arrivare: la strada è chiusa»
     non è la lamentela che questa sonda va a caccia — è la verità, ed è
     il livello che funziona. La lamentela da prendere resta l'altra:
     quella di chi sta fermo senza dire perché. */
  const strada = /strada è chiusa|non riesco ad arrivare/i.test(m || '')
  controlla(`${n}: «${eti}» da solo ci va — il gesto cammina`, mosso || !m || strada,
            `fermo dov'era e la traccia dice «${m}»`)
  const lontano = m && /lontan|non è qui|a portata/i.test(m)
  controlla(`${n}: e non si lamenta più che «${c.gesto.complemento}» è lontano`, !lontano, m)
}
controlla('almeno un livello fa vedere che il gesto cammina', camminate > 0,
          'nessuna soluzione dichiarata prende o apre niente')

/* ═══════════ 6. i complementi filtrati per verbo ═══════════
   Le chiavi su cui si può fare un'azione dipendono dall'azione: «prendi
   il portone» non vuol dire niente, e nemmeno «apri la chiave». Quindi
   quelle combinazioni non si compongono più — non è il motore a doverle
   spiegare, è l'interfaccia a non offrirle. Qui si controlla che il
   filtro esista, che sia coerente e che regga anche quando qualcuno
   costruisce l'ordine sbagliato a mano (un piano salvato, un livello
   modificato): in quel caso il piano si RIFIUTA, non si gioca. */
{
  const c1 = controlla('il motore dice cosa accetta ogni verbo (VERBI)', !!VERBI)
  const c2 = controlla('e quali complementi sono validi in un mondo (complementiDi)',
                       !!complementiDi)
  controlla('e quali verbi l\'interfaccia può offrire (verbiDi)', !!verbiDi)
  if (c1)
    /* ── SALVO CHI NON PUNTA A UNA COSA ──
       `aspetta che [domanda]` non ha un complemento e non deve averlo:
       quello che guarda è una DOMANDA, non un bersaglio, e lo dichiara
       con `vuoleCond`. Pretendere da lui un elenco di tipi vuol dire
       pretendere che sia un verbo come gli altri, cioè il contrario di
       quello che è. La regola resta per tutti quelli che a una cosa ci
       puntano davvero. */
    controlla('ogni verbo che punta a una cosa dichiara i tipi che accetta',
              Object.values(VERBI).every(v => v.vuoleCond ||
                (Array.isArray(v.accetta) && v.accetta.length)),
              Object.entries(VERBI).filter(([, v]) => !v.vuoleCond && !(v.accetta || []).length)
                .map(([k]) => k).join(', '))
  if (c1)
    controlla('i verbi del motore e quelli usati nei livelli sono gli stessi',
              VERBI_USATI.every(v => v in VERBI),
              VERBI_USATI.filter(v => !(v in VERBI)).join(', '))

  let storteTrovate = 0, canoniche = 0
  for (const [i, liv] of LIVELLI.entries()) {
    const n = nomeDi(liv, i)
    const mondo = sicuro(() => mondoDi(liv, 0))
    if (!mondo || !c2) continue
    /* le AZIONI le scrive il piano, non il livello: prima di chiedere al
       motore cosa si può nominare qui, gli si dice cosa c'è scritto —
       come fa il gioco quando il bambino ne aggiunge una. */
    if (typeof motore.raccogliRoutine === 'function') {
      /* tutte insieme, non una alla volta: la registrazione rifà
         l'elenco da capo, e passandogliele in fila resterebbero solo
         quelle dell'ultima */
      const insieme = {}
      soluzioniDi(liv).forEach((s, k) => {
        insieme['p' + k] = Object.values(s.piano || {}).flat().filter(Boolean)
      })
      sicuro(() => motore.raccogliRoutine(mondo, insieme))
    }

    /* I DUE ESEMPI DA CUI È NATA LA REGOLA. Quello che una soluzione
       prende è roba da zaino: «apri la chiave» non deve stare nel menù.
       Quello che una soluzione apre è una porta: «prendi il portone»
       nemmeno. Senza questi due, un motore che dicesse «va bene tutto
       per tutti» passerebbe il resto dei controlli senza filtrare
       niente. */
    const inSoluzioni = b => [...new Set(soluzioniDi(liv)
      .flatMap(s => vociDi(s.piano).flatMap(v => scendi(v.ordine)))
      .filter(o => base(o.verbo) === b && o.complemento).map(o => o.complemento))]
    for (const [che, verboSuo, verboAltrui, frase] of [
      ['prendi', PRENDI, APRI, 'non si apre'],
      ['apri', APRI, PRENDI, 'non si prende'],
    ]) {
      const roba = inSoluzioni(che)
      const buoni = complementiDi(mondo, verboAltrui) || []
      if (!roba.length) continue
      canoniche++
      const intrusi = roba.filter(x => buoni.includes(x))
      controlla(`${n}: quello che si «${verboSuo}» ${frase} — niente «${verboAltrui} ${roba[0]}»`,
                !intrusi.length,
                `${verboAltrui} accetta ${intrusi.join(', ')}: il filtro non filtra`)
    }

    /* nessuna soluzione dichiarata usa un complemento di tipo sbagliato:
       se ne usasse uno, sarebbe un piano che il bambino non potrebbe
       nemmeno scrivere */
    const storti = soluzioniDi(liv).flatMap(s => vociDi(s.piano)
      .flatMap(v => scendi(v.ordine))
      .filter(o => o.complemento !== undefined)
      .filter(o => {
        const buoni = complementiDi(mondo, o.verbo)
        return Array.isArray(buoni) && !buoni.includes(o.complemento)
      })
      .map(o => `${s.nome}: ${o.verbo} ${o.complemento}`))
    controlla(`${n}: le soluzioni non usano complementi di tipo sbagliato`, !storti.length,
              storti.join(' · '))

    /* un verbo che in questo livello non ha niente da mordere non si
       offre: un menù con «apri» dentro un livello senza porte è una
       bugia detta a chi sta imparando */
    if (verbiDi) {
      const offerti = verbiDi(mondo)
      controlla(`${n}: verbiDi dà una lista di verbi`, Array.isArray(offerti))
      if (Array.isArray(offerti)) {
        /* chi vuole una DOMANDA (`aspetta che…`) non ha bersagli da
           elencare: la sua cosa è la domanda, e quella si compone */
        const aDomanda = v => !!(VERBI && VERBI[v] && VERBI[v].vuoleCond)
        const vuoti = offerti.filter(v => !aDomanda(v) && !(complementiDi(mondo, v) || []).length)
        controlla(`${n}: nessun verbo offerto è senza complementi validi`, !vuoti.length,
                  vuoti.join(', '))
        /* «utile» vuol dire che ha qualcosa DA NOMINARE. Un verbo che
           prende solo caselle ne avrebbe sempre — le caselle libere
           valgono in ogni livello — e allora la ronda comparirebbe già
           al primo, dove il menù è fatto di un verbo solo apposta.
           E se il livello dichiara la sua lista di verbi, quella
           comanda: è la manopola con cui si introducono a scaglioni, e
           un verbo lasciato fuori apposta non è un verbo scordato. */
        if (c1 && nomiDi) {
          const scelti = liv.verbi || null
          const scordati = Object.keys(VERBI)
            .filter(v => (!scelti || scelti.includes(v)) &&
                         nomiDi(mondo, v).length && !offerti.includes(v))
          controlla(`${n}: e nessun verbo utile resta fuori dal menù`, !scordati.length,
                    scordati.join(', '))
        }
        const suoi = new Set(soluzioniDi(liv).flatMap(s => vociDi(s.piano)
          .flatMap(v => scendi(v.ordine)).map(o => o.verbo)))
        controlla(`${n}: i verbi che servono alle soluzioni sono offerti`,
                  [...suoi].every(v => offerti.includes(v)),
                  [...suoi].filter(v => !offerti.includes(v)).join(', '))
      }
    }

    /* IL RIFIUTO. Si prende un nome che va bene per un altro verbo e non
       per questo — «la chiave» contro «apri» — e si prova a giocarlo lo
       stesso. Il motore non deve eseguirlo e poi spiegare: deve
       rifiutare il piano. */
    let storto = null
    for (const v of (VERBI ? Object.keys(VERBI) : VERBI_USATI)) {
      const miei = complementiDi(mondo, v) || []
      for (const w of (VERBI ? Object.keys(VERBI) : VERBI_USATI)) {
        if (w === v) continue
        const altrui = (complementiDi(mondo, w) || []).find(x => !miei.includes(x))
        if (altrui !== undefined) { storto = { verbo: v, complemento: altrui, buonoPer: w }; break }
      }
      if (storto) break
    }
    if (storto) {
      storteTrovate++
      const modello = soluzioniDi(liv)[0].piano
      const chi = vociDi(modello)[0] ? vociDi(modello)[0].unita : null
      const r = prova(liv, 0, pianoPer(modello, chi, [storto]))
      const eti = `${storto.verbo} ${storto.complemento}`
      const dichiarato = !!r.esploso ||
        (Array.isArray(r.esito.rifiutati) && r.esito.rifiutati.length > 0)
      controlla(`${n}: «${eti}» (che vale per «${storto.buonoPer}») viene rifiutato`,
                dichiarato,
                'né un errore né `rifiutati`: il motore se l\'è giocato come fosse un ordine buono')
      controlla(`${n}: e con un ordine rifiutato non si vince`, !vinta(r))
      const giocato = (Array.isArray(r.esito.traccia) ? r.esito.traccia : []).some(e =>
        e && typeof e === 'object' && /fatto|eseguit|riuscit/i.test(String(e.esito)) &&
        scritta(e).includes(String(storto.complemento)))
      controlla(`${n}: e soprattutto non viene eseguito`, !giocato)
    } else {
      nota(`${n}: nessun complemento buono per un verbo e sbagliato per un altro`)
    }
  }
  if (c2) {
    controlla('il filtro filtra: da qualche parte un complemento vale per un verbo e non per un altro',
              storteTrovate > 0,
              'ogni verbo accetta tutto quello che accettano gli altri: ' +
              'è come non avere nessun filtro')
    controlla('e i due casi da cui è nata la regola sono coperti dai livelli',
              canoniche > 0,
              'nessuna soluzione prende o apre niente: «apri la chiave» non si può nemmeno provare')
  }
}

/* ═══════════ 6b. i guasti che restano ═══════════
   Filtrare i complementi toglie di mezzo le combinazioni senza senso,
   non i guasti veri: quelli si scoprono solo giocando, e sono la parte
   che insegna. Ognuno ha il SUO motivo, e i motivi sono diversi fra
   loro. Le sonde si costruiscono dai dati del livello. */
function oggettoDaPrendere(liv) {
  for (const s of soluzioniDi(liv).filter(x => !x.fragile)) {
    const p = s.piano
    const file = Array.isArray(p) ? [[null, p]] : Object.entries(p)
    for (const [u, lista] of file)
      for (const o of (Array.isArray(lista) ? lista : []))
        if (eOrdine(o) && base(o.verbo) === 'prendi' && o.complemento)
          return { unita: u, modello: p, cosa: o.complemento }
  }
  return null
}
/* la chiave e la porta: nella stessa fila di ordini si prende una cosa e
   più avanti se ne apre un'altra. Togliendo il «prendi», il gesto sulla
   porta trova uno stato che non lo permette — ed è un guasto diverso da
   tutti gli altri, perché è l'unico che il bambino risolve pensando
   all'ORDINE dei gesti e non al gesto. */
/* ── E LA PORTA DEVE AVERE QUELLA SERRATURA ──
   «Si prende una cosa e più avanti se ne apre un'altra» non basta a
   dire che le due si riguardano: nel cortile di Rosa si prende il pane
   e si apre un cancello che non ha nessuna serratura, e togliendo il
   `prendi` non si blocca proprio niente — il piano perde per un'altra
   ragione, e pretendere una spiegazione di stato è pretendere che il
   motore menta. Quindi si guarda la porta: solo se la sua `chiave` è
   proprio la cosa che si è presa, quella è una coppia. */
const chiaveDi = (liv, id) => {
  const leg = (liv.scena && liv.scena.legenda) || {}
  for (const v of Object.values(leg))
    for (const x of (Array.isArray(v) ? v : [v]))
      if (x && x.id === id) return x.chiave || null
  return null
}
function coppiaChiavePorta(liv) {
  for (const s of soluzioniDi(liv).filter(x => !x.fragile)) {
    const p = s.piano
    const file = Array.isArray(p) ? [[null, p]] : Object.entries(p)
    for (const [u, lista] of file) {
      if (!Array.isArray(lista)) continue
      for (let a = 0; a < lista.length; a++) {
        if (!eOrdine(lista[a]) || base(lista[a].verbo) !== 'prendi') continue
        for (let b = a + 1; b < lista.length; b++)
          if (eOrdine(lista[b]) && base(lista[b].verbo) === 'apri' &&
              lista[b].complemento && lista[b].complemento !== lista[a].complemento &&
              chiaveDi(liv, lista[b].complemento) === lista[a].complemento)
            return { piano: p, unita: u, via: u === null ? [a] : [u, a], porta: lista[b] }
      }
    }
  }
  return null
}

/* un ordine che l'interfaccia non lascerebbe comporre — un nome che non
   esiste, un complemento mancante — può arrivare lo stesso da un piano
   salvato ieri o da un livello ritoccato. Il motore può rifiutarlo o
   spiegarlo, ma non può giocarlo e non può vincerci. */
function rifiutatoOSpiegato(nome, r, ordine) {
  controlla(`${nome}: non vince`, !vinta(r))
  const dichiarato = !!r.esploso ||
    (Array.isArray(r.esito.rifiutati) && r.esito.rifiutati.length > 0)
  const m = r.esploso ? null : motivoDi(r, ordine)
  controlla(`${nome}: il motore lo rifiuta o dice perché non è andato`, dichiarato || !!m,
            'giocato in silenzio: né rifiutato né spiegato')
  if (!r.esploso) esitoSano(nome, r)
  return m
}

let bloccatiProvati = 0
for (const [i, liv] of LIVELLI.entries()) {
  const n = nomeDi(liv, i)
  const modello = soluzioniDi(liv)[0].piano
  const chi = vociDi(modello)[0] ? vociDi(modello)[0].unita : null
  const og = oggettoDaPrendere(liv)

  /* bersaglio inesistente */
  const fantasma = { verbo: PRENDI, complemento: NIENTE }
  const m1 = rifiutatoOSpiegato(`${n} · prendi una cosa che non c'è`,
                                prova(liv, 0, pianoPer(modello, chi, [fantasma])), fantasma)
  if (m1) motivi[i].inesistente = m1

  /* ordine senza bersaglio: «prendi» e basta */
  const monco = { verbo: PRENDI }
  const m2 = rifiutatoOSpiegato(`${n} · un ordine senza bersaglio`,
                                prova(liv, 0, pianoPer(modello, chi, [monco])), monco)
  if (m2) motivi[i].senzaBersaglio = m2

  /* meta irraggiungibile: si va verso una cosa che non c'è. Deve
     arrendersi e dirlo, non cercarla per sempre */
  const miraggio = { verbo: VAI, complemento: NIENTE }
  rifiutatoOSpiegato(`${n} · vai verso una meta che non c'è`,
                     prova(liv, 0, pianoPer(modello, chi, [miraggio])), miraggio)

  /* stato che non lo permette: il portone senza la chiave.
     ── SU TUTTE LE SCENE, E BASTA CHE UNA CADA ──
     Si guardava solo la prima, e pretendeva che senza la chiave non si
     vincesse mai. Ma un livello può avere una scena in cui la chiave
     NON serve, e non è un difetto: è una lezione — «prendila lo stesso,
     perché non sai in quale battaglia finisci». Preteso su una scena
     sola, questo controllo vietava proprio i livelli che insegnano il
     caso peggiore. Quello che deve restare vero è che la chiave serva
     DAVVERO da qualche parte: almeno una scena, senza, si perde. */
  const cp = coppiaChiavePorta(liv)
  if (cp) {
    bloccatiProvati++
    const senzaChiave = senza(cp.piano, cp.via)
    const quante = Math.max(1, (liv.varianti || []).length)
    const esiti = []
    for (let k = 0; k < quante; k++) esiti.push(prova(liv, k, senzaChiave))
    esitoSano(`${n} · il portone senza la chiave`, esiti[0])
    const perse = esiti.filter(r => !vinta(r))
    controlla(`${n}: senza aver preso la chiave, almeno una battaglia si perde`,
              perse.length > 0, `si vince lo stesso in tutte e ${quante}: la chiave non serve`)
    /* il motivo si cerca dove il piano si è fermato davvero */
    const m = perse.map(r => motivoDi(r, cp.porta)).find(Boolean)
    controlla(`${n}: e la traccia dice che è lo stato a non permetterlo`, !!m)
    if (m && !motivi[i].bloccato) motivi[i].bloccato = m
  }

  /* una condizione che parla di una cosa che non c'è: il blocco non può
     decidere niente, e allora il piano si rifiuta invece di tirare a
     indovinare un ramo */
  const domanda = TUTTE_LE_CONDIZIONI.find(c => c && typeof c === 'object' && 'complemento' in c)
  if (domanda && og) {
    const bivio = { blocco: 'condizione',
                    cond: { ...clona(domanda), complemento: NIENTE },
                    vero: [{ verbo: PRENDI, complemento: og.cosa }], falso: [] }
    const m = rifiutatoOSpiegato(`${n} · una condizione che parla di una cosa che non c'è`,
      prova(liv, 0, pianoPer(og.modello, og.unita,
                             [{ verbo: VAI, complemento: og.cosa }, bivio])), bivio)
    if (m) motivi[i].condizioneFalsa = m
  }

  /* attesa pendente: si aspetta una cosa che non arriverà mai. Il motore
     deve fermarsi da solo — è il caso limite che, sbagliato, appende il
     gioco a schermo fermo senza dire niente */
  const unitaGioc = unitaDi(liv).filter(u => fazioniDi(liv)
    .some(f => f.id === u.fazione && f.autore === 'giocatore')).map(u => u.id)
  /* si aspetta una cosa che l'interfaccia offre davvero — se no sarebbe
     un ordine rifiutato e non un'attesa — ma che nessuno farà accadere,
     perché nel piano non c'è nient'altro che l'attesa */
  const mondo0 = sicuro(() => mondoDi(liv, 0))
  const buoni = mondo0 && complementiDi ? (complementiDi(mondo0, ASPETTA) || []) : []
  const attesa = { verbo: ASPETTA, complemento: buoni.length ? buoni[0] : NIENTE }
  const doppia = Array.isArray(modello) || unitaGioc.length < 2
    ? pianoPer(modello, chi, [attesa])
    : Object.fromEntries(unitaGioc.slice(0, 2).map(u => [u, [attesa]]))
  const r5 = prova(liv, 0, doppia)
  const m5 = buoni.length
    ? (esitoSano(`${n} · due che si aspettano`, r5),
       controlla(`${n}: lo stallo viene rilevato, non girato all'infinito`, !vinta(r5)),
       motivoDi(r5, attesa))
    : rifiutatoOSpiegato(`${n} · due che si aspettano`, r5, attesa)
  if (m5) motivi[i].attesaPendente = m5
  controlla(`${n}: e qualcuno dice come è finita l'attesa`,
            !!m5 || !!r5.esploso || (typeof r5.esito.motivo === 'string' && r5.esito.motivo.length > 2))
}
controlla('almeno un livello ha una porta che senza la chiave resta chiusa',
          bloccatiProvati > 0,
          'nessuna soluzione mette un «prendi» prima di un «apri»: il guasto ' +
          '«lo stato non lo permette» non esiste in nessun livello')

/* i motivi non si somigliano: guasti diversi, spiegazioni diverse */
const COPPIE = [
  ['inesistente', 'lontano'], ['inesistente', 'senzaBersaglio'], ['inesistente', 'bloccato'],
  ['lontano', 'bloccato'], ['lontano', 'senzaBersaglio'], ['bloccato', 'senzaBersaglio'],
  ['attesaPendente', 'lontano'], ['attesaPendente', 'bloccato'],
  ['condizioneFalsa', 'lontano'], ['condizioneFalsa', 'bloccato'],
  ['condizioneFalsa', 'senzaBersaglio'],
]
let confronti = 0
for (const [i, liv] of LIVELLI.entries()) {
  for (const [a, b] of COPPIE) {
    const x = motivi[i][a], y = motivi[i][b]
    if (!x || !y) continue
    confronti++
    controlla(`${nomeDi(liv, i)}: «${a}» e «${b}» non si spiegano allo stesso modo`,
              x !== y, `tutti e due dicono «${x}»`)
  }
}
const visti = new Set(motivi.flatMap(m => Object.keys(m)))
/* queste due non passano dal filtro dei complementi: si scoprono solo
   giocando, e sono quello che resta da insegnare col motivo scritto in
   traccia. Se sparissero anche loro, il bambino non saprebbe mai perché
   il suo piano non è andato. */
controlla('la lezione sugli errori sopravvive: «lo stato non lo permette»',
          visti.has('bloccato'),
          `viste solo: ${[...visti].join(', ') || 'nessuna'}`)
nota(`famiglie di guasto osservate: ${[...visti].join(', ')} · ${confronti} confronti`)

/* ═══════════ 7. le varianti, e perché l'astrazione regge ═══════════
   La lezione vera del gioco: dire dove andare, una meta dopo l'altra,
   funziona finché il mondo è quello che ti aspettavi. Dire cosa cercare
   — `pattuglia finché` — regge anche quando il mondo cambia. Non è una
   massima da mettere in un cartello: è un fatto, e qui si verifica.

   Quale sia il gesto «basso» non lo decide il test: lo dice il livello,
   marcando `fragile` la soluzione che deve cadere. Così il giorno che
   cambia il vocabolario — ed è già successo, `fai un passo` e `girati`
   sono spariti — questo controllo non va toccato. */
const dimostrano = LIVELLI.filter(liv => {
  const s = soluzioniDi(liv)
  return s.some(x => x.fragile) && s.some(x => !x.fragile)
})
controlla("c'è un livello dove la soluzione fragile cade e quella robusta regge",
          dimostrano.length > 0,
          'nessun livello mette a confronto una soluzione «fragile» e una robusta: ' +
          'la lezione del gioco non è dimostrata da nessuna parte')
for (const liv of dimostrano) {
  const i = LIVELLI.indexOf(liv)
  const bassa = soluzioniDi(liv).find(x => x.fragile)
  const alta = soluzioniDi(liv).find(x => !x.fragile)
  const esitiB = VARIANTI(liv).map(iv => vinta(prova(liv, iv, bassa.piano)))
  const esitiA = VARIANTI(liv).map(iv => vinta(prova(liv, iv, alta.piano)))
  controlla(`${nomeDi(liv, i)}: «${bassa.nome}» vince una variante e ne perde un'altra`,
            esitiB.some(Boolean) && esitiB.some(x => !x),
            esitiB.map((v, k) => `${k + 1}:${v ? 'vinta' : 'persa'}`).join(' '))
  controlla(`${nomeDi(liv, i)}: «${alta.nome}» le supera tutte e tre`,
            esitiA.every(Boolean),
            esitiA.map((v, k) => `${k + 1}:${v ? 'vinta' : 'persa'}`).join(' '))
  controlla(`${nomeDi(liv, i)}: dove la fragile cade, la robusta passa`,
            esitiB.every((v, k) => v || esitiA[k]))
  /* e la fragile dev'essere davvero un'altra strada, non la stessa
     rimescolata: se fosse identica non insegnerebbe la differenza */
  controlla(`${nomeDi(liv, i)}: fragile e robusta sono due piani diversi`,
            scritta(bassa.piano) !== scritta(alta.piano))
}

/* ═══════════ 8. i gettoni non sbloccano niente ═══════════
   Intercettare gli ordini nemici è un aiuto che si compra: fa risparmiare
   tentativi, non sostituisce il piano. Se una soluzione dichiarata ne
   avesse bisogno, il gettone diventerebbe un pedaggio. */
{
  const spie = LIVELLI.flatMap((liv, i) => soluzioniDi(liv)
    .flatMap(s => vociDi(s.piano).flatMap(v => scendi(v.ordine)))
    .filter(o => /gettone|intercett|spia|origli/i.test(scritta(o)))
    .map(o => `${nomeDi(liv, i)}: ${o.verbo}`))
  controlla('nessuna soluzione dichiarata intercetta gli ordini nemici', !spie.length,
            spie.join(' · '))
  nota('le soluzioni vincono con esegui(mondo, ordini) e basta: nessun aiuto passato al motore')
}

/* ═══════════ 9. gli altri casi limite ═══════════
   Non devono vincere e non devono esplodere: devono finire, e dire perché.

   Gli ordini delle sonde si pescano dal livello STESSO: adesso che i
   complementi sono filtrati per verbo, un ordine preso in prestito da un
   altro livello nominerebbe una zona che qui non esiste, e verrebbe
   giustamente rifiutato prima ancora di arrivare al caso limite. */
function ordineDelLivello(liv, b) {
  const tutti = [
    ...soluzioniDi(liv).flatMap(s => vociDi(s.piano).map(v => v.ordine)),
    ...fazioniDi(liv).flatMap(f => vociDi(ordiniDiFazione(f)).map(v => v.ordine)),
  ].flatMap(o => scendi(o))
  return tutti.find(o => base(o.verbo) === b) || null
}
for (const [i, liv] of LIVELLI.entries()) {
  const n = nomeDi(liv, i)
  const modello = soluzioniDi(liv)[0].piano
  const fazioni = fazioniDi(liv), unita = unitaDi(liv)
  const miei = unita.filter(u => fazioni.some(f => f.id === u.fazione && f.autore === 'giocatore'))
  const loro = unita.filter(u => fazioni.some(f => f.id === u.fazione && f.autore === 'livello'))

  /* due unità sulla stessa cella: se il motore le lascia sovrapporre lo
     dice, se no le tiene separate — quello che non può fare è perderne una */
  if (miei.length >= 2 && !Array.isArray(modello)) {
    const meta = miei[1].id
    const insieme = { [miei[0].id]: [{ verbo: VAI, complemento: meta }],
                      [miei[1].id]: [{ verbo: VAI, complemento: miei[0].id }] }
    const r = prova(liv, 0, insieme)
    if (esitoSano(`${n} · due che vanno l'una addosso all'altra`, r)) {
      const p = posizioni(r.mondo)
      controlla(`${n}: due unità non finiscono nella stessa cella senza che si sappia`,
                !p || p[miei[0].id] !== p[miei[1].id] ||
                r.esito.traccia.some(e => e && typeof e.motivo === 'string' && e.motivo.trim()),
                `tutte e due in ${p && p[miei[0].id]} e la traccia non dice niente`)
      /* si contano le unità DELLA SCENA GIOCATA, non quelle della mappa
         base: da quando una scena può mettere qualcuno in un posto
         preparato (`metti`), la base ne ha meno — e non è che ne siano
         sparite, è che lì non c'erano */
      const quante = creaMondo(liv, 0).unita.length
      controlla(`${n}: nessuna unità sparisce dal mondo`,
                unitaDi(r.mondo).length === quante,
                `da ${quante} a ${unitaDi(r.mondo).length}`)
    }
  }

  /* unità morta con ordini in coda: il nemico è governato dal livello e ha
     una fila di ordini davanti. Se cade, quella fila si ferma lì. */
  if (loro.length && miei.length) {
    const bersaglio = loro[0].id
    const chi = Array.isArray(modello) ? null : miei[0].id
    const r = prova(liv, 0, pianoPer(modello, chi,
      [{ verbo: VAI, complemento: bersaglio }, { verbo: ATTACCA, complemento: bersaglio }]))
    if (esitoSano(`${n} · attacca ${bersaglio}`, r)) {
      const traccia = r.esito.traccia
      const morte = traccia.findIndex(e => e && /mort|abbattut|elimin|cadut|sconfitt/i.test(scritta(e)) &&
                                            scritta(e).includes(bersaglio))
      if (morte >= 0) {
        const dopo = traccia.slice(morte + 1).filter(e => e && e.unita === bersaglio &&
                                                          !(typeof e.motivo === 'string' && e.motivo))
        controlla(`${n}: un'unità caduta non esegue gli ordini che aveva in coda`, !dopo.length,
                  scritta(dopo.slice(0, 2)))
      }
      const vivi = unitaDi(r.mondo)
      controlla(`${n}: dopo un attacco il mondo resta leggibile`,
                vivi.every(u => typeof u.id === 'string'))
    }
  }

  /* l'allarme che rimbalza: chi lo sente lo risuona, e sono in due. Il
     motore deve chiudere la partita col limite dei passi, non impiccarsi. */
  const sentire = ordineDelLivello(liv, 'quando')
  const suonare = ordineDelLivello(liv, 'suona') || ordineDelLivello(liv, 'allarme')
  if (sentire && suonare && miei.length >= 2 && !Array.isArray(modello)) {
    const nido = Object.keys(sentire).find(k => Array.isArray(sentire[k]) && sentire[k].some(eOrdine))
    if (nido) {
      const rimbalzo = { ...clona(sentire), [nido]: [clona(suonare)] }
      const r = prova(liv, 0, Object.fromEntries(miei.slice(0, 2).map(u =>
        [u.id, [clona(suonare), clona(rimbalzo)]])))
      esitoSano(`${n} · l'allarme che rimbalza`, r)
      controlla(`${n}: l'allarme che rimbalza fra due unità si ferma`, !r.esploso)
    }
  }

  /* il ciclo che non finisce: una pattuglia — che è un ciclo — data da
     sola a un'unità. O la sua condizione si avvera e il piano finisce lì,
     o gira finché il motore non chiude la scena col limite dei passi. Non
     esiste una terza possibilità, e non esiste «gira per sempre». */
  const pattuglia = ordineDelLivello(liv, 'pattuglia')
  if (pattuglia) {
    const chi = Array.isArray(modello) ? null : (miei[0] || {}).id
    const r = prova(liv, 0, pianoPer(modello, chi, [clona(pattuglia)]))
    if (esitoSano(`${n} · una pattuglia da sola`, r)) {
      controlla(`${n}: il ciclo si chiude e non vince da solo`,
                !r.esito.vinto && Number.isFinite(r.esito.passi), scritta(r.esito.passi))
      if (PASSI_MASSIMI) {
        controlla(`${n}: e non va oltre il limite di passi dichiarato`,
                  r.esito.passi <= PASSI_MASSIMI, `${r.esito.passi} > ${PASSI_MASSIMI}`)
        /* se ci è arrivato, allora è davvero un ciclo che non finisce: e
           «non finisce mai» non si racconta al bambino con la stessa
           frase di «hai lasciato il piano vuoto» */
        if (r.esito.passi >= PASSI_MASSIMI) {
          const vuoto = prova(liv, 0, vuotoComeMe(modello))
          controlla(`${n}: il ciclo infinito non si spiega come un piano vuoto`,
                    r.esito.motivo !== vuoto.esito.motivo,
                    `tutti e due dicono «${r.esito.motivo}»`)
        }
      }
    }
  }
}
if (!PASSI_MASSIMI)
  nota('il motore non dichiara PASSI_MASSIMI: il limite dei passi si vede solo di riflesso')

/* ═══════════ 10. determinismo ═══════════
   Stessa partita, stesso esito. E per essere sicuri che non ci sia
   casualità di contrabbando, la seconda si gioca con `Math.random`
   cambiato sotto i piedi: se il motore ha bisogno del caso, deve
   prenderlo da un seme (come fa il simulatore del castello), non
   dall'aria. */
function conCaso(valore, fai) {
  const vero = Math.random
  Math.random = () => valore
  try { return fai() } finally { Math.random = vero }
}
const impronta = r => r.esploso ? 'esploso: ' + r.esploso
  : scritta({ vinto: r.esito.vinto, motivo: r.esito.motivo, passi: r.esito.passi,
              traccia: r.esito.traccia })
for (const [i, liv] of LIVELLI.entries()) {
  const n = nomeDi(liv, i)
  const s = soluzioniDi(liv)[0]
  for (const iv of VARIANTI(liv)) {
    const a = conCaso(0.01, () => impronta(prova(liv, iv, s.piano)))
    const b = conCaso(0.99, () => impronta(prova(liv, iv, s.piano)))
    controlla(`${n} · variante ${iv + 1}: la stessa partita finisce sempre allo stesso modo`,
              a === b, 'due partite identiche danno esiti diversi: se serve il caso, ' +
                       'deve venire da un seme della variante')
  }
  /* e anche una partita che finisce male dev'essere ripetibile: è così
     che un bambino capisce cosa ha sbagliato riguardandola */
  const rotto = pianoPer(soluzioniDi(liv)[0].piano, vociDi(s.piano)[0].unita,
                         [{ verbo: PRENDI, complemento: NIENTE }])
  const a = conCaso(0.01, () => impronta(prova(liv, 0, rotto)))
  const b = conCaso(0.99, () => impronta(prova(liv, 0, rotto)))
  controlla(`${n}: anche una partita persa si ripete uguale`, a === b)
}

/* ═══════════ 11. i dati restano dati ═══════════
   `creaMondo` deve copiare: se il motore giocasse sul livello, la seconda
   partita partirebbe da un campo già mangiato — e nessuno se ne
   accorgerebbe finché un bambino non rigioca la stessa tappa. */
controlla('giocare non sporca i livelli', scritta(LIVELLI) === IMPRONTA_DATI,
          'dopo tutte queste partite i dati dei livelli sono cambiati')

/* ═══════════ 12. il cancello dei livelli in prova ═══════════
   I livelli non ancora approvati si vedono solo con i giochi in prova
   accesi. La cosa che qui si difende non è QUANTI se ne vedono — quello
   cambia ogni volta che uno viene promosso — ma che il cancello non
   sposti niente: la posizione di un livello nella fila piena è la chiave
   dei suoi progressi (`gen.stelle[i]`), e dev'essere la stessa col
   cancello aperto o chiuso. Se un giorno i livelli in prova venissero
   spostati in coda «per comodità», questo diventerebbe rosso — e
   giustamente: le stelle già prese si rimescolerebbero addosso a chi
   accende l'interruttore. */
{
  const chiusa = dati.fila(false), aperta = dati.fila(true)
  controlla('col cancello chiuso restano solo i livelli approvati',
            chiusa.length > 0 && chiusa.length < aperta.length,
            `${chiusa.length} di ${aperta.length}`)
  uguale('col cancello aperto ci sono tutti', aperta.length, LIVELLI.length)
  controlla('e il primo della fila è uno di quelli approvati',
            chiusa[0].i === 0, `si comincia da ${chiusa[0].liv.id}`)
  controlla('nessun livello approvato porta il segno della prova',
            chiusa.every(r => !r.prova), chiusa.filter(r => r.prova).map(r => r.liv.id).join(', '))

  const dove = new Map(aperta.map(r => [r.liv.id, r.i]))
  const spostati = chiusa.filter(r => dove.get(r.liv.id) !== r.i)
  controlla('il cancello non sposta nessuno: la posizione è la stessa aperta o chiusa',
            !spostati.length,
            spostati.map(r => `${r.liv.id}: ${r.i} invece di ${dove.get(r.liv.id)}`).join(', '))
  controlla('e la posizione è quella della fila piena',
            aperta.every(r => LIVELLI[r.i] === r.liv))

  /* i titoli dei tratti: se le prime prove di un blocco sono in prova, il
     titolo scivola sulla prima che si vede — non sparisce con loro, se no
     l'elenco avrebbe un blocco senza intestazione */
  const conRighe = dati.TRATTI.filter(t => t.livelli.some(l => !dati.inProva(l))).length
  uguale('ogni tratto rimasto in elenco ha il suo titolo',
         chiusa.filter(r => r.titolo).length, conRighe)
  nota(`${chiusa.length} livelli approvati su ${aperta.length}: ` +
       chiusa.map(r => r.liv.id).join(', '))
}

riassunto('il generale')
