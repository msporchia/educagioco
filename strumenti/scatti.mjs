/* ═══════════════════════════════════════════════════════════════════
   LE FOTO PER LA DOCUMENTAZIONE

     npm run scatti          tutte
     npm run scatti dungeon  solo quelle che contengono "dungeon"

   Escono in `docs/img/`, che è versionata: sono le immagini del README e
   delle pagine dei singoli giochi, quindi devono stare nel repo.

   Non c'entrano niente con gli scatti dei test (`test/scatti/`, che git
   ignora): quelli servono a guardare un difetto, questi a far vedere il
   gioco a chi non ce l'ha davanti. Per questo qui il profilo è **finto e
   pieno**: monete, tutte le tappe aperte, un animale adottato. Un gioco
   fotografato appena installato è tutto grigio e non dice niente.

   Una ricetta può ritoccare il profilo finto con `profilo: p => p`
   (riceve una copia): serve a chi vuole una partita già a metà.

   Una ricetta con `clip: { secondi, durante }` non scatta: **registra**.
   Chrome consegna un fotogramma a ogni cambio di schermo (il
   `screencast` del protocollo, lo stesso che usa DevTools), `durante`
   gioca la partita mentre gira, e `strumenti/clip.py` ne fa un WebP
   animato — `docs/img/<file>.webp`, quello che il README mostra nella
   griglia dei giochi. Una foto ferma di un tower defense dice «ci sono
   delle torri»; tre secondi dicono che sparano.

   Ogni foto è una ricetta: dove entrare, cosa aspettare, dove cliccare
   prima di scattare. Se un passo non riesce si scatta lo stesso e si
   segnala — meglio una foto storta che una serie interrotta a metà.
   ═══════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

/* Il motore della fattoria gira anche qui: è l'unico modo di fotografare
   una fattoria *giocata* senza scrivere a mano un salvataggio, che si
   scosterebbe dal formato vero al primo cambio di campo. */
import { Fattoria } from '../src/giochi/fattoria/motore/fattoria.js'
import { PRIMA, CELLE } from '../src/giochi/fattoria/dati/mondo.js'
import { PER_COLTURA, PER_RICETTA, MINUTO } from '../src/giochi/fattoria/dati/coltivazioni.js'
import { sogliaDi } from '../src/giochi/fattoria/dati/livelli.js'

const LIVELLO_FOTO = 10
const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GIOCO = 'file://' + resolve(RADICE, 'dist/index.html')
const FUORI = resolve(RADICE, 'docs/img')
const TELEFONO = { width: 390, height: 844 }
const ADESSO = Date.now()

/* Un profilo che ha giocato: serve a far vedere i giochi come sono
   davvero, non come appaiono il primo giorno. `tuttoAperto` toglie i
   lucchetti, così si possono fotografare anche le tappe in fondo. */
const PROFILO = {
  coins: 340,
  /* `sperimentali` acceso: i giochi ancora in prova hanno una pagina nel
     README come gli altri, e senza il cancello aperto uscirebbe uno
     scatto della home invece del gioco. */
  settings: { tables: [2, 3, 4, 5], sound: true, music: true,
              giochi: {}, sa: {}, tuttoAperto: true, sperimentali: true },
  totals: { math: 260, mente: 90, en: 140, verbi: 40, frasi: 25, es: 60,
            td: 45, partiteMath: 22, torri: 30, perfette: 7,
            ondate: 40, misure: 30, pozioni: 12, clienti: 26, mercati: 4,
            missioni: 9, stelle: 14, ordini: 60, monete: 900 },
  best: { math: 24, serieMath: 15, onda: 12, serieGiorni: 6, pozioni: 9, clienti: 11 },
  td: { tappa: 6, libera: true, v: 2 },
  mate: { tappa: 5, libera: true },
  calc: { tappa: 4, libera: false },
  eng: { tappa: 6, libera: false },
  esp: { tappa: 4, libera: false },
  mercato: { tappa: 8, libera: false, v: 2 },
  /* il `v` per esteso e non per migrazione: qui il profilo si scrive a
     mano, e un numero che passa dalla tabella delle vecchie tappe
     vorrebbe dire una foto che cambia da sola il giorno in cui la
     tabella cambia */
  lab: { tappa: 5, libera: false, v: 2 },
  gen: { tappa: 8, libera: false, ordini: {}, stelle: {} },
  giorni: { ultimo: '', serie: 4, record: 9, totali: 30 },
  /* Una fattoria già cominciata. Non si scrive a mano: la si **gioca** col
     motore vero, qui in Node, e si fotografa quello che ne esce. Una
     fattoria appena nata è un prato vuoto — è deciso così, la prima
     panchina vale perché è costata — e fotografata racconterebbe che qui
     non c'è niente da fare. */
  campagne: undefined,          // riscritto qui sotto, dopo il motore
}

/* ── la fattoria da fotografare ──
   Un campo di grano pronto, uno a metà crescita, il mulino al lavoro, un
   pollaio contento e qualche cosa attorno: sono le quattro cose che la
   fattoria ha da mostrare, e nessuna si vede in un prato appena aperto. Le celle sono dentro la terra
   di partenza (`PRIMA`…`ULTIMA` di `dati/mondo.js`), dove il bosco non
   nasce mai — quindi è sempre libera. */
function fattoriaGiocata() {
  const f = new Fattoria()
  /* Il livello prima di posare: mulino e pollaio si aprono al 3 e all'8,
     e il bobtail va anche reclamato (`bestiaAperta`). Senza, `posa` e
     `compraBestia` tornano `non-sbloccato` in silenzio e la foto esce
     un prato con un campo. */
  f.speso = sogliaDi(LIVELLO_FOTO)
  f.reclamaTutto()
  /* Cinque celle dentro l'angolo della terra di partenza: la telecamera si
     centra sul mezzo delle terre, e partendo dall'angolo il campo di grano
     — la cosa da guardare — finiva tagliato dal bordo sinistro. */
  const c = PRIMA * CELLE + 5
  f.posa('fienile', c + 7, c + 1)
  f.posa('arbusto_tondo', c + 8, c + 4)
  f.posa('arbusto_tondo', c + 10, c + 4)
  f.posa('ceppo', c + 1, c + 9)
  f.posa('fiori1', c, c + 8)

  const campoPronto = f.posa('orto', c, c + 1).cosa
  const campoAMeta = f.posa('orto', c + 3, c + 1).cosa
  const mulino = f.posa('mulino', c + 1, c + 5).cosa
  f.posa('silo', c + 10, c + 7)
  const pollaio = f.posa('pollaio', c + 5, c + 5).cosa

  const grano = PER_COLTURA.grano
  f.seminaCampo(campoPronto, 'grano', ADESSO - (grano.minuti + 1) * MINUTO)
  f.seminaCampo(campoAMeta, 'mais', ADESSO - 4 * MINUTO)
  f.metti('grano', 9)
  f.avvia(mulino, 'mangime', ADESSO - MINUTO)
  /* Il pollaio a metà lavoro: è lo stato «contento», col cuore, ed è il
     modo di far vedere in una foto sola che un recinto **si legge da
     lontano** senza aprire niente. */
  f.avvia(pollaio, 'uova', ADESSO - PER_RICETTA.uova.minuti * 0.5 * MINUTO)

  f.compraBestia('cane-bobtail', 0, 'Watson', { x: c + 5, y: c + 8 })
  return f.serializza()
}

PROFILO.campagne = {
  dungeon: { tappa: 7, libera: true, stelle: {}, cfg: {} },
  survivors: { tappa: 6, libera: true, stelle: {}, cfg: {} },
  codice: { tappa: 5, libera: true, stelle: {}, cfg: {} },
  corsa: { tappa: 5, libera: false, stelle: {}, cfg: {} },
  fattoria: { tappa: 0, libera: false, stelle: {}, cfg: { stato: fattoriaGiocata() } },
}

/* ── giocare un pezzo di castello ──
   `window.__td` è la porta che il gioco apre per le prove: da lì si sceglie
   una torre, si leggono le cifre attese dell'operazione in colonna e si
   premono i tasti. Serve perché la torre si paga col conto: senza risolverlo
   non si costruisce niente, e il campo resta un prato. */
async function scegliTorre (page) {
  await page.evaluate(async () => {
    const T = window.__td
    T.inizia(0)
    await new Promise(r => setTimeout(r, 1200))
    T.scegliTorre('add')
  })
  await page.waitForTimeout(700)
}

async function costruisciEChiama (page) {
  await page.evaluate(async () => {
    const attesa = ms => new Promise(r => setTimeout(r, ms))
    const T = window.__td
    T.inizia(0)
    await attesa(1200)
    for (let i = 0; i < 3; i++) {
      T.scegliTorre('add')
      await attesa(120)
      if (!T.op.value) break                 // finita l'energia: va bene lo stesso
      const tasti = [...document.querySelectorAll('.tastiera button')]
      T.op.value.passi.forEach(p => tasti.find(x => +x.textContent === p.atteso)?.click())
      await attesa(250)
    }
    T.chiamaOnda()
    await attesa(2600)                       // i mostri entrano in campo e camminano
  })
  await page.waitForTimeout(500)
}

/* ── la manopola dell'età ──
   Si fotografa **dal primo avvio**, non dalle impostazioni: lì è la
   schermata intera invece di un riquadro in mezzo a venti carte, ed è
   anche il momento in cui la si incontra davvero. Vuole un archivio
   vuoto (`vuoto: true`), se no si entra col profilo di prova già fatto
   e l'onboarding non parte. */
async function manopolaEta (page) {
  await page.fill('input.nome', 'Anna')
  await page.click('button.via')
  await page.waitForSelector('.manopola-posto', { timeout: 6000 })
  /* la manopola nasce sui quattro anni: otto passi da mezzo anno la
     portano a otto, che è l'età in cui la casa è più piena e il quadro
     sotto ha più da dire */
  for (let i = 0; i < 8; i++) {
    await page.click('button[aria-label="mezzo anno in più"]')
    await page.waitForTimeout(100)
  }
  await page.evaluate(() => document.querySelector('.manopola-posto')
    ?.scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(500)
}

/* le quattro cifre del codice, che di partenza è 0000 */
const PIN = [['.tasto >> text="0"', 120], ['.tasto >> text="0"', 120],
             ['.tasto >> text="0"', 120], ['.tasto >> text="0"', 900]]

/* ── una domanda precisa, per il README ──
   Si passa dal ▶ del quadro dei genitori, che apre la domanda vera nella
   stessa messa in scena dei giochi (`quiz/Prova.vue`). La riga di una
   tipologia sta due aperture più sotto — il blocco, poi il pezzo di
   scuola — e quali dipende dall'età: invece di scriverlo qui si aprono
   uno alla volta finché compare il ▶ di quella tipologia. La domanda
   cambia a ogni giro (la pesca è a caso): la tipologia no. */
function unaDomanda (chiave) {
  return async page => {
    await page.click('.schede button[data-scheda="giochi"]')
    await page.waitForTimeout(600)
    const trovata = await page.evaluate(async chiave => {
      const attesa = ms => new Promise(r => setTimeout(r, ms))
      // la chiave di una riga è `modulo:grado:tipologia`: si cerca per
      // come finisce, così il grado in cui sta può cambiare
      const tasto = () => document.querySelector(`[data-prova$=":${chiave}"]`)
      const blocchi = () => [...document.querySelectorAll('.voce.apribile')]
      for (let i = 0; i < blocchi().length && !tasto(); i++) {
        const b = blocchi()[i]
        if (!b.classList.contains('aperta')) { b.click(); await attesa(200) }
        const righe = () => [...b.querySelectorAll('.voce-riga.apribile')]
        for (let j = 0; j < righe().length && !tasto(); j++) {
          const r = righe()[j]
          if (!r.classList.contains('aperta')) { r.click(); await attesa(150) }
        }
      }
      if (!tasto()) return false
      tasto().click()
      return true
    }, chiave)
    if (!trovata) throw new Error('nel quadro non c\'è ' + chiave)
    await page.waitForSelector('[data-prova] .domanda, [data-prova]', { timeout: 4000 })
    await page.waitForTimeout(900)
  }
}
/* nove anni: a quell'età le tre tipologie della vetrina stanno tutte nel
   quadro, e nessuna è ancora «superflua» */
const NOVE_ANNI = p => { p.settings.eta = 9; return p }

/* le ricette. `dove` è il frammento dell'indirizzo, `passi` quello che
   si fa prima di scattare. Un passo è [selettore, attesa dopo]. */
const RICETTE = [
  { file: 'home', dove: '', attesa: '.carte' },

  { file: 'asteroidi-mappa', dove: 'mate', attesa: '.scaletta' },
  { file: 'asteroidi-gioco', dove: 'mate', attesa: '.scaletta',
    passi: [['.pianeta:not(.chiuso)', 7500]] },
  /* la fila è una sola: la seconda foto è la stessa mappa più in basso,
     dove si vede che pianeti e stazioni si alternano */
  { file: 'asteroidi-stazioni', dove: 'mate', attesa: '.scaletta',
    passi: [['.stazione:not(.chiuso)', 7500]] },

  { file: 'inglese-mappa', dove: 'inglese', attesa: '.mappa' },
  { file: 'inglese-gioco', dove: 'inglese', attesa: '.mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },
  { file: 'spagnolo-gioco', dove: 'spagnolo', attesa: '.mappa',
    passi: [['.tappa:not(.chiusa)', 1600]] },

  { file: 'castello-mappa', dove: 'torri', attesa: '.tappe' },
  /* Il castello va giocato per davvero prima di fotografarlo: appena
     entrati il prato è vuoto, e un tower defense senza torri né mostri non
     fa capire niente. Si passa da `window.__td`, la stessa porta che usano
     le prove, per costruire tre torri e chiamare l'ondata. */
  { file: 'castello-gioco', dove: 'torri', attesa: '.tappe',
    passi: [['.tap:not(.chiusa)', 1500], costruisciEChiama] },
  /* la schermata che si vede a ogni torre: il conto da fare per pagarla */
  { file: 'castello-calcolo', dove: 'torri', attesa: '.tappe',
    passi: [['.tap:not(.chiusa)', 1500], scegliTorre] },

  { file: 'pozioni-mappa', dove: 'pozioni', attesa: '.pz-mappa' },
  { file: 'pozioni-gioco', dove: 'pozioni', attesa: '.pz-mappa',
    passi: [['.pz-tappa:not(.pz-chiusa)', 1600]] },

  { file: 'bancarella-mappa', dove: 'bancarella', attesa: '.giornata, .tappe, .mappa' },
  { file: 'bancarella-gioco', dove: 'bancarella', attesa: '.giornata, .tappe, .mappa',
    passi: [['.tappa:not(.chiusa), .giornata', 1800]] },

  { file: 'dungeon-mappa', dove: 'dungeon', attesa: '.dng-tappe' },
  { file: 'dungeon-gioco', dove: 'dungeon', attesa: '.dng-tappe',
    passi: [['.dng-tappa.dng-adesso, .dng-tappa', 2000]] },

  { file: 'survivors-mappa', dove: 'survivors', attesa: '.sv-mappa' },
  { file: 'survivors-gioco', dove: 'survivors', attesa: '.sv-mappa',
    passi: [['.sv-tappa.sv-adesso, .sv-tappa', 2200]] },

  { file: 'sotterraneo-mappa', dove: 'sotterraneo', attesa: '.sot-tappe' },
  /* il campo dopo un paio di secondi: appena entrati la luce è ancora
     tutta addosso all'eroe, e lo scatto racconterebbe una stanza sola */
  { file: 'sotterraneo-gioco', dove: 'sotterraneo', attesa: '.sot-tappe',
    passi: [['.sot-tappa:not([disabled])', 2200]] },

  { file: 'corsa-mappa', dove: 'corsa', attesa: '.co-mappa' },
  /* La corsa si fotografa **dopo qualche secondo**: al primo istante i
     cancelli sono ancora un puntino all'orizzonte, e lo scatto
     racconterebbe una strada vuota invece della scelta fra tre numeri,
     che è il gioco. */
  { file: 'corsa-gioco', dove: 'corsa', attesa: '.co-mappa',
    passi: [['.co-tappa.co-adesso, .co-tappa', 4200]] },

  /* ── i due dei piccoli ──
     Si fotografano **dentro una tappa**, non alla mappa: quello che
     hanno da far vedere è che si gioca senza leggere niente — icone in
     cima, roba grossa da toccare sotto — e una mappa di tappe è la
     stessa fila di tutti gli altri giochi. */
  { file: 'conta-mappa', dove: 'conta', attesa: '.ct-tappe' },
  /* La tappa scelta non è la prima: «Il primo gregge» mette in campo
     fino a cinque cose e sceglie la specie da sé, e capita che siano
     tre sassi in mezzo a un prato vuoto. «Gli intrusi» ne mette di più
     e mostra la cosa che vale la pena guardare — che non tutto quello
     che si vede va contato. */
  { file: 'conta-gioco', dove: 'conta', attesa: '.ct-tappe',
    passi: [['.ct-tappa[data-tappa="7"]', 1600]] },

  { file: 'prima-dopo-mappa', dove: 'prima', attesa: '.pd-tappe' },
  { file: 'prima-dopo-gioco', dove: 'prima', attesa: '.pd-tappe',
    passi: [['.pd-tappa:not([disabled])', 1600]] },

  { file: 'codice-mappa', dove: 'codice', attesa: '.tappe, .mappa, .cs-tappe' },
  { file: 'codice-gioco', dove: 'codice', attesa: '.tappe, .mappa, .cs-tappe',
    passi: [['.tappa:not(.chiusa), .cs-tappa', 3000]] },

  { file: 'generale-mappa', dove: 'generale', attesa: '.tappa' },
  /* il Generale si entra dall'elenco delle prove: si apre la prima e si
     chiude il cartello che la spiega, se no la foto è un menù, che è la
     cosa meno interessante che ha da mostrare. (Qui c'erano la scelta
     dell'avventura e il capitolo, schermate che non si sono mai aperte:
     la foto aspettava un selettore che non compariva.) */
  { file: 'generale-gioco', dove: 'generale', attesa: '.tappa',
    passi: [['.tappa:not(.chiusa)', 2200], ['.foglio .capo button', 900]] },

  /* La fattoria si fotografa **giocata** (vedi `fattoriaGiocata()`): un
     campo di grano pronto col cestino sopra, uno che cresce, il mulino al
     lavoro. Appena aperta è un prato vuoto, e lo è per scelta. */
  { file: 'fattoria-gioco', dove: 'fattoria', attesa: '.fa-tela',
    passi: [['.fa-tela', 1500]] },

  /* tre domande di tre materie, per il README: una col disegno del tempo,
     una di matematica disegnata, una di ragionamento a parole. Si ritaglia
     la carta: la cornice attorno è il pannello dei grandi, non il gioco. */
  { file: 'domanda-orologio', dove: 'genitori', attesa: '.tastierino', profilo: NOVE_ANNI,
    ritaglio: '[data-prova] .qz-carta',
    passi: [...PIN, unaDomanda('ora:quarti')] },
  { file: 'domanda-frazioni', dove: 'genitori', attesa: '.tastierino', profilo: NOVE_ANNI,
    ritaglio: '[data-prova] .qz-carta',
    passi: [...PIN, unaDomanda('fraz:leggi')] },
  { file: 'domanda-logica', dove: 'genitori', attesa: '.tastierino', profilo: NOVE_ANNI,
    ritaglio: '[data-prova] .qz-carta',
    passi: [...PIN, unaDomanda('log:ordine')] },

  { file: 'albo', dove: 'albo', attesa: '.testata' },
  { file: 'eta', dove: '', vuoto: true, attesa: '.benvenuto', passi: [manopolaEta] },
  { file: 'genitori', dove: 'genitori', attesa: '.tastierino', passi: [...PIN] },
  { file: 'genitori-giochi', dove: 'genitori', attesa: '.tastierino',
    passi: [...PIN, ['.schede button[data-scheda="giochi"]', 800]] },
  /* Il tasto ▶ accanto a ogni voce: si vede una domanda vera di quella
     tipologia prima di decidere se spegnerla. Raccontarlo a parole non
     rende: si fotografa il tasto, e poi la domanda che ne esce. */
  { file: 'domanda-prova', dove: 'genitori', attesa: '.tastierino',
    profilo: NOVE_ANNI, passi: [...PIN, unaDomanda('geo:simmetria')] },
]

/* ── registrare ──
   Il fotogramma arriva solo quando lo schermo cambia, quindi l'ultimo
   può essere di molto prima della fine: si chiude l'elenco con una riga
   che ripete l'ultimo al momento dello stop, se no la coda ferma — il
   cartello di fine tappa, la torre appena posata — sparirebbe. */
/* ── i tocchi si vedono ──
   Nel filmato il dito non c'è, e senza un segno le cose sembrano
   succedere da sole: un cerchio che compare dove si tocca e sfuma è la
   convenzione delle anteprime delle app, e basta a leggere «ha toccato
   qui, e si è aperto questo». Lo disegna la pagina stessa, sopra tutto e
   senza prendersi i tocchi. Vede due specie di tocco: quelli veri
   (`page.mouse`, `locator.click`, che passano da `pointerdown`) e i
   `.click()` fatti da script dentro la pagina, che un `pointerdown` non
   ce l'hanno — lì il cerchio va al centro dell'elemento. Quello che una
   ricetta fa passando da un gancio (`window.__td.apriPiazzola`) non tocca
   niente e non lascia segni: se il gesto conta, la ricetta lo fa col dito.
   `clip: { tocchi: false }` lo spegne; `clip: { coda: 1500 }` chiude la
   registrazione un secondo e mezzo dopo la fine della partita, invece di
   aspettare `secondi`. E `clip: { accelera: 1.5 }` fa
   scorrere il filmato più svelto del vero (`strumenti/clip.py`): per i
   giochi che hanno dei tempi morti, che dal vivo sono il ritmo e in otto
   secondi di README sono schermo vuoto. */
async function mostraITocchi (page) {
  await page.evaluate(() => {
    if (window.__tocchiVisibili) return
    window.__tocchiVisibili = true
    const stile = document.createElement('style')
    stile.textContent = `
      .clip-tocco { position: fixed; z-index: 2147483647; pointer-events: none;
        width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%;
        background: rgba(25,25,45,.28); border: 3px solid #fff;
        box-shadow: 0 0 0 2px rgba(25,25,45,.45), 0 2px 8px rgba(0,0,0,.25);
        animation: clip-tocco .7s ease-out forwards }
      @keyframes clip-tocco { 0% { transform: scale(.6); opacity: 1 }
        40% { transform: scale(1); opacity: .9 } 100% { transform: scale(1.35); opacity: 0 } }`
    document.head.appendChild(stile)
    const cerchio = (x, y) => {
      const d = document.createElement('div')
      d.className = 'clip-tocco'
      d.style.left = x + 'px'
      d.style.top = y + 'px'
      document.body.appendChild(d)
      setTimeout(() => d.remove(), 800)
    }
    addEventListener('pointerdown', e => { if (e.isTrusted) cerchio(e.clientX, e.clientY) }, true)
    addEventListener('click', e => {
      if (e.isTrusted || e.detail !== 0) return
      const q = e.target.getBoundingClientRect?.()
      if (q && q.width) cerchio(q.x + q.width / 2, q.y + q.height / 2)
    }, true)
  })
}

async function registra (page, r) {
  if (r.clip.tocchi !== false) await mostraITocchi(page)
  const cdp = await page.context().newCDPSession(page)
  const cartella = mkdtempSync(join(tmpdir(), 'clip-'))
  const elenco = []
  let chiuso = false
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    /* dopo lo stop ne arrivano ancora, già in coda: la cartella a quel
       punto può non esserci più */
    if (chiuso) return
    const file = String(elenco.length + 1).padStart(4, '0') + '.jpg'
    writeFileSync(join(cartella, file), Buffer.from(data, 'base64'))
    elenco.push({ file, t: metadata.timestamp })
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast',
    { format: 'jpeg', quality: 90, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 })
  const partita = r.clip.durante ? r.clip.durante(page).catch(e => e) : null
  /* `secondi` è il tetto; con `coda` la registrazione si chiude anche
     prima, quel tanto dopo che la partita è finita — un cartello di
     vittoria fermo per metà filmato non racconta niente */
  const tetto = page.waitForTimeout(r.clip.secondi * 1000)
  if (partita && r.clip.coda != null)
    await Promise.race([tetto, partita.then(() => page.waitForTimeout(r.clip.coda))])
  else await tetto
  await cdp.send('Page.stopScreencast')
  chiuso = true
  await cdp.detach().catch(() => {})
  const esito = await Promise.race([partita, null])
  if (elenco.length) elenco.push({ file: elenco.at(-1).file, t: Date.now() / 1000 })
  writeFileSync(join(cartella, 'fotogrammi.json'), JSON.stringify(elenco))
  const py = spawnSync('python3', [resolve(RADICE, 'strumenti/clip.py'), cartella,
    resolve(FUORI, r.file + '.webp'), String(r.clip.larghezza || 280),
    String(r.clip.accelera || 1)], { encoding: 'utf8' })
  rmSync(cartella, { recursive: true, force: true })
  if (py.status !== 0) throw new Error(py.stderr.trim().split('\n').at(-1))
  const riga = py.stdout.trim().replace(/^[^:]*: /, '')
  /* una partita che si rompe a metà la clip la esce lo stesso, ma è un
     intoppo: va nel conto di quelle storte, non solo nella riga */
  if (esito instanceof Error)
    throw Object.assign(new Error('la partita: ' + esito.message.split('\n')[0].slice(0, 60)), { riga })
  return riga
}

/* ── le clip del README ──
   Una per gioco, ognuna in un file suo in `strumenti/clip/` (la partita
   da giocare davanti alla telecamera è lunga, e diciassette in fila qui
   dentro coprirebbero le foto). Il contratto è quello di una ricetta, col
   campo `clip` in più. */
const CLIP = resolve(RADICE, 'strumenti/clip')
// un file che comincia con «_» è un appunto di lavoro, non una clip
for (const f of readdirSync(CLIP).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
  const r = (await import(join(CLIP, f))).default
  if (r?.file && r?.clip) RICETTE.push(r)
  else console.warn(`  strumenti/clip/${f}: non esporta una ricetta con \`file\` e \`clip\`, saltato`)
}

const filtro = process.argv.slice(2).filter(a => !a.startsWith('-'))
const scelte = filtro.length
  ? RICETTE.filter(r => filtro.some(f => r.file.includes(f)))
  : RICETTE

if (!existsSync(resolve(RADICE, 'dist/index.html'))) {
  console.error('manca dist/index.html — lancia prima `npm run build`')
  process.exit(1)
}
mkdirSync(FUORI, { recursive: true })

function trovaChrome () {
  if (process.env.CHROME) return process.env.CHROME
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium',
                   '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'])
    if (existsSync(p)) return p
  return undefined
}

const exe = trovaChrome()
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
let storte = 0

for (const r of scelte) {
  const page = await browser.newPage({ viewport: TELEFONO, deviceScaleFactor: 2, hasTouch: true })
  /* il roster va scritto prima che parta l'app, come nei test: senza,
     si apre l'onboarding e si fotografa quello dieci volte. `vuoto`
     è l'eccezione: è proprio l'onboarding la cosa da fotografare. */
  if (!r.vuoto) await page.addInitScript(p => {
    try {
      localStorage.setItem('giocatori', JSON.stringify([{ id: 'g1', nome: 'Anna' }]))
      localStorage.setItem('ultimo-giocatore', JSON.stringify('g1'))
      localStorage.setItem('profilo:g1', JSON.stringify(p))
    } catch (e) { /* lo dirà lo scatto */ }
  }, r.profilo ? r.profilo(structuredClone(PROFILO)) : PROFILO)

  let nota = ''
  try {
    await page.goto(GIOCO + (r.dove ? '#' + r.dove : ''))
    await page.waitForSelector(r.attesa, { timeout: 12000 })
    for (const passo of r.passi || []) {
      try {
        if (typeof passo === 'function') await passo(page)
        else {
          const [sel, attesa] = passo
          await page.click(sel, { timeout: 6000 })
          await page.waitForTimeout(attesa)
        }
      } catch (e) {
        nota = '(un passo non è riuscito: ' + String(e.message).split('\n')[0].slice(0, 70) + ')'
        storte++
      }
    }
    await page.waitForTimeout(400)          // le animazioni si posano
  } catch (e) {
    nota = '(' + String(e.message).split('\n')[0].slice(0, 50) + ')'
    storte++
  }
  if (r.clip) {
    try { nota = (nota ? nota + ' ' : '') + await registra(page, r) }
    catch (e) { nota += ` (${String(e.message).slice(0, 80)}) ${e.riga || ''}`; storte++ }
  } else {
    /* `ritaglio`: solo quell'elemento, con un bordo di sfondo attorno.
       Se non c'è si scatta la pagina intera, come sempre. */
    const pezzo = r.ritaglio && await page.$(r.ritaglio)
    const riquadro = pezzo && await pezzo.boundingBox()
    const bordo = 12
    await page.screenshot({ path: resolve(FUORI, r.file + '.png'),
      ...(riquadro ? { clip: { x: Math.max(0, riquadro.x - bordo), y: Math.max(0, riquadro.y - bordo),
                                width: riquadro.width + 2 * bordo, height: riquadro.height + 2 * bordo } } : {}) })
  }
  console.log(`  ${r.file.padEnd(24)} ${nota}`)
  await page.close()
}

await browser.close()
console.log(`\n${scelte.length} foto in docs/img/${storte ? `, ${storte} con qualche intoppo` : ''}`)
