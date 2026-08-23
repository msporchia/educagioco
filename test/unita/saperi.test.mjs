/* ═══════════════════════════════════════════════════════════════════
   COSA SA IL BAMBINO — il catalogo e chi lo cita

   I macrogruppi di `src/data/saperi.js` sono un'anagrafe: da soli non
   fanno niente: contano perché qualcuno li cita. Un modulo di quiz li
   cita tipologia per tipologia (`sa:` dentro `tipi`) — o, se le
   tipologie non le dichiara ancora, grado per grado (`saperi:` accanto
   alla scaletta) — e un gioco lo dichiara nel suo manifesto (`chiede:`
   in `data/giochi.js`), che è la strada del castello per le divisioni e
   le moltiplicazioni. Le due parti stanno
   in file diversi apposta — la domanda dichiara di cosa ha bisogno, il
   catalogo dice solo come si chiama — e questo test è il punto in cui
   si controlla che si parlino:

     · una chiave citata da un modulo e non elencata nel catalogo è un
       refuso che nessuno vedrebbe mai: spegnere quel macrogruppo non
       toglierebbe niente;
     · un sapere elencato e citato da nessuno è un interruttore finto,
       e qui vale la regola di sempre — peggio che non averlo. Vale nei
       due versi: una chiave che un gioco dichiara e il catalogo non ha
       è un refuso, e un sapere che né un modulo né un gioco nominano è
       un'impostazione che esiste e non si raggiunge — che è il guasto
       vero, perché nessuno ha modo di accorgersene;
     · il DEGRADO deve reggere: spento un sapere, nessuna domanda che
       lo dava per scontato deve più uscire, e i giochi devono avere
       comunque qualcosa da chiedere. Questa è la parte che conta: un
       filtro che lascia passare una conversione a chi non sa cosa è un
       litro è peggio di nessun filtro, perché il genitore crede di
       averla spenta.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { SAPERI, CHIAVI_SAPERI, MATERIE_SAPERI, sapereDi, esisteSapere } from '../../src/data/saperi.js'
import { GIOCHI, serveA, chiedeA } from '../../src/data/giochi.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { classiDi, pescaClasse } from '../../src/quiz/nucleo/classi.js'
import { sorgentiDi, esempioDa, esempioDi } from '../../src/quiz/nucleo/esempi.js'
import { finestraDi } from '../../src/quiz/nucleo/classi.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

/* i moduli si raccolgono dalla cartella, come nel banco: uno nuovo
   entra in questo controllo il giorno in cui il suo file compare */
const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
  }
controlla('i moduli di quiz si raccolgono da soli', moduli.length > 0)

/* ═══════════ 1. il catalogo sta in piedi ═══════════ */
controlla('le chiavi dei saperi sono uniche',
          new Set(CHIAVI_SAPERI).size === CHIAVI_SAPERI.length,
          CHIAVI_SAPERI.filter((x, i) => CHIAVI_SAPERI.indexOf(x) !== i).join(', '))

for (const s of SAPERI) {
  const manca = ['nome', 'ico', 'materia', 'che', 'esempio', 'spegne'].filter(k => !s[k])
  controlla(`${s.chiave}: ha tutto quello che serve a un genitore per decidere`,
            manca.length === 0, 'manca ' + manca.join(', '))
}
uguale('le materie si ricavano dall\'elenco', MATERIE_SAPERI.length > 0, true)
controlla('sapereDi() trova per chiave', sapereDi('divisioni')?.nome === 'Le divisioni')
controlla('una chiave inventata non esiste', !esisteSapere('astrofisica'))

/* ═══════════ 2. le due parti si parlano ═══════════ */
const citati = new Set()
for (const m of moduli) {
  uguale(`${m.id}: un sapere per grado, quanti sono i gradi`, m.saperi.length, m.gradi)
  m.saperi.flat().forEach(c => citati.add(c))
  m.tipi.forEach(t => t.sa.forEach(c => citati.add(c)))
  const ignoti = [...new Set(m.saperi.flat())].filter(c => !esisteSapere(c))
  controlla(`${m.id}: cita solo saperi che esistono`, ignoti.length === 0,
            'sconosciuti: ' + ignoti.join(', '))
}

/* ═══════════ 2b. le tipologie: quello che è scritto e quello che esce ═══════════
   Un tipo dichiarato è una promessa in tre parti — questa domanda
   esiste, sta in questo gruppo, esce a questi gradi — e tutte e tre si
   possono controllare giocando. Se non si controllassero, il modo di
   sbagliare sarebbe silenzioso e brutto: una tipologia che il genitore
   vede nell'elenco, spegne, e che continua ad arrivare perché la chiave
   scritta nella dichiarazione non è quella che il generatore emette. */
const TIPI = moduli.flatMap(m => m.tipi.map(t => ({ ...t, dove: m.id })))
const chiaviTipi = TIPI.map(t => t.chiave)
controlla('le chiavi delle tipologie sono uniche', new Set(chiaviTipi).size === chiaviTipi.length,
          chiaviTipi.filter((x, i) => chiaviTipi.indexOf(x) !== i).join(', '))
nota(`${TIPI.length} tipologie dichiarate da ${moduli.filter(m => m.tipi.length).length} moduli`)

for (const t of TIPI) {
  const manca = []
  if (!t.nome) manca.push('il nome che legge un genitore')
  if (!Object.values(t.gradi).some(p => p > 0)) manca.push('un grado dove esce')
  const ignoti = t.sa.filter(c => !esisteSapere(c))
  if (ignoti.length) manca.push('un gruppo che esiste (' + ignoti.join(' ') + ')')
  controlla(`${t.chiave} (${t.dove}): dichiarata per bene`, manca.length === 0, 'manca ' + manca.join(', '))
}

for (const m of moduli) {
  if (!m.tipi.length) continue
  const vuoti = []
  for (let g = 1; g <= m.gradi; g++) if (!m.tipiDi(g).length) vuoti.push(g)
  controlla(`${m.id}: nessun grado senza tipologie`, vuoti.length === 0, 'gradi vuoti: ' + vuoti.join(' '))

  /* si gioca: la chiave che esce dev'essere una di quelle dichiarate a
     quel grado, e ogni tipologia dichiarata deve farsi vedere */
  const viste = new Set()
  const fuoriPosto = new Set()
  for (let g = 1; g <= m.gradi; g++) {
    const attese = new Set(m.tipiDi(g).map(t => t.chiave))
    for (let i = 0; i < 300; i++) {
      const d = m.chiedi(g, new Sorte(i * 131 + g))
      viste.add(d.chiave)
      if (!attese.has(d.chiave)) fuoriPosto.add(`g${g}→${d.chiave}`)
    }
  }
  controlla(`${m.id}: ogni domanda ha la chiave del tipo che l'ha chiesta`,
            fuoriPosto.size === 0, [...fuoriPosto].join(' '))
  const mai = m.tipi.map(t => t.chiave).filter(c => !viste.has(c))
  controlla(`${m.id}: ogni tipologia dichiarata esce davvero`, mai.length === 0,
            'mai viste: ' + mai.join(' '))
}

/* ── i giochi che dichiarano cosa danno per scontato ──
   Due dichiarazioni, e sono due affermazioni diverse. `serve:` vuol dire
   «io sono tutto conversioni»: senza quel macrogruppo la carta non si
   accende nemmeno. `chiede:` è quella debole — le domande che il gioco
   si fa in casa danno per scontato quel pezzo, e senza degradano: il
   castello con le divisioni spente chiede moltiplicazioni più
   difficili, e resta il castello. */
for (const g of GIOCHI) {
  const suoi = [...(g.serve || []), ...(g.chiede || [])]
  const ignoti = suoi.filter(c => !esisteSapere(c))
  controlla(`gioco ${g.chiave}: dichiara saperi che esistono`, ignoti.length === 0,
            'sconosciuti: ' + ignoti.join(', '))
  suoi.forEach(c => citati.add(c))
  /* le due liste non si sovrappongono: un pezzo di scuola senza il quale
     il gioco non esiste non è anche uno che il gioco «chiede», e avere
     la stessa chiave nei due elenchi vorrebbe dire due righe diverse
     nella schermata dei grandi che parlano della stessa cosa */
  const doppie = (g.serve || []).filter(c => (g.chiede || []).includes(c))
  controlla(`gioco ${g.chiave}: non dichiara la stessa cosa in tutti e due i modi`,
            doppie.length === 0, doppie.join(', '))
}
uguale('il laboratorio delle pozioni è tutto conversioni',
       serveA('pozioni').includes('conversioni'), true)
controlla('il castello invece degrada: non le esige, le chiede',
          serveA('torri').length === 0 &&
          chiedeA('torri').includes('divisioni') && chiedeA('torri').includes('moltiplicazioni'))
nota('giochi che dipendono da un macrogruppo: ' +
     GIOCHI.filter(g => g.serve?.length).map(g => `${g.chiave}(${g.serve.join('+')})`).join(' '))
nota('giochi che ne chiedono uno senza esigerlo: ' +
     GIOCHI.filter(g => g.chiede?.length).map(g => `${g.chiave}(${g.chiede.join('+')})`).join(' '))

/* ── E NESSUNO PUÒ RESTARE SENZA QUALCUNO CHE LO CITI ──
   Questo controllo c'era già e passava lo stesso, ed è il modo in cui il
   guasto è vissuto per mesi: cercava la chiave **nel sorgente**, con una
   grep. `'divisioni'` compariva in `store/profile.js` — dentro
   `divisioniAccese()`, che il castello chiama da sempre — quindi il test
   era verde, mentre nella schermata dei grandi quella riga non c'era
   più: da quando il quadro dell'età si compone dai pezzi di scuola che
   le domande citano, un sapere che vive solo dentro un gioco non aveva
   nessuna riga da cui essere toccato. Un'impostazione che esiste e non
   si raggiunge è peggio di un interruttore finto: un genitore non ha
   nemmeno modo di accorgersi che a suo figlio le divisioni sono spente.

   Adesso il canale è dichiarato — un modulo di quiz nei suoi `tipi`, un
   gioco in `chiede:` — e la grep non c'è più. Chi aggiunge un sapere
   deve dire chi lo guarda, e se non c'è nessuno il test lo dice. */
for (const c of CHIAVI_SAPERI)
  controlla(`${c}: qualcuno lo cita davvero`, citati.has(c),
            'nessun modulo di quiz lo cita e nessun gioco lo dichiara: ' +
            'interruttore irraggiungibile')

/* ═══════════ 3. il degrado ═══════════ */

/* la stessa scelta di `quiz/scelta.js`, rifatta qui perché quel file
   gira solo sotto Vite (il registro usa `import.meta.glob`) */
const moduliCon = spenti => moduli.filter(m => m.gradiLiberi(spenti).length)

controlla('senza niente di spento non cambia niente',
          moduliCon([]).length === moduli.length &&
          moduli.every(m => m.gradiLiberi([]).length === m.gradi))

for (const m of moduli) {
  for (let g = 1; g <= m.gradi; g++) {
    const serve = m.serve(g)
    if (!serve.length) continue
    /* il grado chiesto è chiuso: quello che si gioca al posto suo non
       deve mai chiedere lo stesso sapere */
    const vicino = m.gradoVicino(g, serve)
    controlla(`${m.id} grado ${g}: il ripiego non ricasca nello stesso sapere`,
              vicino === null || !serve.some(s => m.serve(vicino).includes(s)),
              `ripiega su ${vicino}`)
    controlla(`${m.id} grado ${g}: si ripiega verso il basso`,
              vicino === null || vicino < g || m.gradiLiberi(serve).every(x => x > g))
  }
}

/* ── spento TUTTO ──
   Il gioco deve avere lo stesso qualcosa da chiedere: una schermata di
   gioco senza domanda è un gioco rotto, e i genitori possono spegnere
   tutto (per sbaglio, o per provare).

   Finché un modulo non dichiarava niente — la logica, le sequenze —
   qualcosa restava sempre in piedi da solo. Da quando ogni tipologia
   sta in un gruppo, spegnerli tutti svuota davvero l'elenco: quello che
   tiene su il gioco non è più un modulo scampato, è il **ripiego** di
   `quiz/scelta.js`, che quando resta a mani vuote torna a pescare fra
   tutte le classi ignorando gli spenti. Qui si controlla proprio quello,
   perché è l'unico posto che lo salva. */
const restano = moduliCon(CHIAVI_SAPERI)
nota(`spento tutto restano ${restano.length} moduli su ${moduli.length}` +
     (restano.length ? ': ' + restano.map(m => `${m.id}(${m.gradiLiberi(CHIAVI_SAPERI).length}/${m.gradi})`).join(' ') : ''))

const senzaFiltro = classiDi(moduli, { difficolta: 0.5 })
const conTuttoSpento = classiDi(moduliCon(CHIAVI_SAPERI), { spenti: CHIAVI_SAPERI, difficolta: 0.5 })
controlla('spento tutto il ripiego serve davvero (nessuna classe sopravvive)',
          conTuttoSpento.length === 0,
          `${conTuttoSpento.length} classi in piedi: il ripiego non è più l'unica rete`)
controlla('e il ripiego consegna comunque una domanda',
          senzaFiltro.length > 0 && pescaClasse(new Sorte(3), senzaFiltro) !== null)

/* i due casi veri: una bambina che le misure non le ha fatte, e chi non
   legge l'orologio a lancette */
const fuori = (spenti) => moduli.filter(m => !m.gradiLiberi(spenti).length).map(m => m.id)
uguale('spente le misure, il modulo misure esce dal mazzo',
       fuori(['misure', 'conversioni']).includes('misure'), true)
uguale('spento l\'orologio, il modulo orologio esce dal mazzo',
       fuori(['orologio']).includes('orologio'), true)
controlla('spente le sole conversioni, le misure restano (a grado basso)',
          !fuori(['conversioni']).includes('misure'))

/* ═══════════ 4. mille domande con i saperi spenti ═══════════
   La prova che conta: si gioca davvero. Per ogni combinazione si
   pescano moduli e gradi come farebbe `scelta.js`, si genera la
   domanda, e nessuna deve venire da un grado che chiedeva un sapere
   spento. Se il degrado avesse un buco, qui esce. */
const PROVE = [
  ['misure', 'conversioni'],
  ['orologio'],
  ['analisi', 'tempi-verbali', 'accenti'],
  CHIAVI_SAPERI,
]
for (const spenti of PROVE) {
  const sorte = new Sorte(7)
  const vivi = moduliCon(spenti)
  /* nessun modulo in piedi vuol dire che i genitori hanno spento tutto:
     lì entra il ripiego, e le domande tornano ad arrivare da chiunque.
     È voluto, quindi in quel caso non si controlla che siano «pulite» —
     si controlla che ARRIVINO. */
  const ripiego = !vivi.length
  const buoni = ripiego ? moduli : vivi
  let guasti = 0, fatte = 0
  for (let i = 0; i < 400; i++) {
    const m = sorte.uno(buoni)
    const difficolta = sorte.frazione
    const g0 = Math.max(1, Math.min(m.gradi, Math.round(1 + difficolta * (m.gradi - 1))))
    const g = ripiego ? g0 : m.gradoVicino(g0, spenti)
    if (g === null) { guasti++; continue }
    if (!ripiego && m.serve(g).some(s => spenti.includes(s))) { guasti++; continue }
    const d = m.chiedi(g, sorte, ripiego ? [] : spenti)
    if (!d || !d.chiave) guasti++
    fatte++
  }
  controlla(ripiego
    ? 'spenti tutti quanti: il ripiego consegna comunque 400 domande'
    : `spenti [${spenti.join(' ')}]: 400 domande, nessuna di quelle spente`,
            guasti === 0 && fatte === 400, `${guasti} guaste, ${fatte} fatte`)
  nota(`spenti [${spenti.length > 6 ? 'tutti' : spenti.join(' ')}] → ${fatte} domande da ${buoni.length} moduli` +
       (ripiego ? ' (ripiego)' : ''))
}

/* ═══════════ 5. spegnere UNA tipologia ═══════════
   Il caso nuovo: il genitore non spegne «accenti e apostrofi», apre il
   dettaglio e toglie solo la lettera h. Il grado resta aperto — le
   altre tre tipologie ci sono ancora — e questo è proprio il punto in
   cui un filtro sbagliato non si vedrebbe: il gioco continua a fare
   domande, sembra tutto a posto, e ogni tanto ricasca quella spenta. */
for (const m of moduli) {
  for (const t of m.tipi) {
    const spenti = [t.chiave]
    let uscita = 0, fatte = 0
    for (let g = 1; g <= m.gradi; g++) {
      if (!m.puo(g, spenti)) continue
      for (let i = 0; i < 40; i++) {
        const d = m.chiedi(g, new Sorte(i * 977 + g), spenti)
        if (d.chiave === t.chiave) uscita++
        fatte++
      }
    }
    controlla(`spenta «${t.nome}» (${t.chiave}): non arriva più`, uscita === 0,
              `${uscita} domande su ${fatte}`)
  }
}

/* e spegnere il GRUPPO deve togliere tutte le sue tipologie in un colpo */
for (const s of CHIAVI_SAPERI) {
  const suoi = TIPI.filter(t => t.sa.includes(s))
  if (!suoi.length) continue
  const chiavi = new Set(suoi.map(t => t.chiave))
  let uscita = 0
  for (const m of moduli) {
    if (!m.tipi.length) continue
    for (let g = 1; g <= m.gradi; g++) {
      if (!m.puo(g, [s])) continue
      for (let i = 0; i < 40; i++)
        if (chiavi.has(m.chiedi(g, new Sorte(i * 613 + g), [s]).chiave)) uscita++
    }
  }
  controlla(`spento «${s}»: spariscono tutte e ${suoi.length} le sue tipologie`, uscita === 0,
            `${uscita} domande arrivate lo stesso`)
}

/* ═══════════ 6. l'esempio: la domanda che sparisce, fatta vedere ═══════════
   Sulla carta dei genitori c'è un tasto che apre una domanda vera di
   quella voce, generata al momento (`quiz/nucleo/esempi.js`). Prima lì
   c'era una frase scritta a mano, e una frase scritta a mano invecchia
   da sola: il modulo cambia, il grado si sposta, e quella riga resta a
   raccontare una domanda che non esiste più.

   Generata non può mentire, ma può mancare — ed è il modo peggiore di
   rompersi, perché il tasto c'è e non apre niente. Quindi: ogni voce che
   un genitore vede sa produrre il suo esempio, da OGNI sorgente e non da
   una a caso, e quello che esce è la domanda di quella voce e non di
   un'altra pescata lì vicino. */
const primaChiave = new Sorte(20260808)

for (const t of TIPI) {
  const dove = sorgentiDi(moduli, t.chiave)
  controlla(`${t.chiave}: si può far vedere`, dove.length > 0,
            'nessun modulo la genera: il tasto «prova» aprirebbe il vuoto')
  const male = []
  for (const [i, s] of dove.entries()) {
    let e
    try { e = esempioDa(s, new Sorte(i * 977 + 13)) }
    catch (err) { male.push(`${s.modulo.id} g${s.grado} esplode: ${err.message}`); continue }
    const d = e.domanda
    if (!d?.testo) male.push(`${s.modulo.id} g${s.grado} senza consegna`)
    if (!(d?.risposte?.length >= 2)) male.push(`${s.modulo.id} g${s.grado} con meno di due risposte`)
    if (!(d?.giusta >= 0 && d.giusta < d?.risposte?.length)) male.push(`${s.modulo.id} g${s.grado}: la giusta è fuori posto`)
    /* la parte che conta: il tasto dice «prova L'APOSTROFO», e quello
       che si apre dev'essere l'apostrofo */
    if (d?.chiave !== t.chiave) male.push(`${s.modulo.id} g${s.grado} risponde ${d?.chiave}`)
    if (!e.dice || !e.titolo) male.push(`${s.modulo.id} g${s.grado} non dice dove si è finiti`)
  }
  controlla(`${t.chiave}: l'esempio è suo, da tutte e ${dove.length} le sorgenti`,
            male.length === 0, male.join(' · '))
}

/* i gruppi: quelli che le domande le fanno le sanno far vedere, e
   quelli che non le fanno lo dicono invece di aprire il vuoto —
   `divisioni` vive nel castello e il suo tasto non deve comparire */
const senzaEsempio = []
for (const s of SAPERI) {
  const dove = sorgentiDi(moduli, s.chiave)
  if (!dove.length) { senzaEsempio.push(s.chiave); continue }
  const e = esempioDi(moduli, s.chiave, primaChiave)
  controlla(`${s.chiave}: dal gruppo esce una domanda vera`,
            !!e?.domanda?.testo && e.domanda.risposte?.length >= 2)
  /* e quella domanda è di uno dei moduli che citano il gruppo: se
     uscisse da un altro, spegnere il gruppo non la toglierebbe */
  controlla(`${s.chiave}: l'esempio viene da un modulo che lo cita`,
            citati.has(s.chiave) || senzaEsempio.includes(s.chiave))
}
/* Adesso ogni gruppo sa mostrare una domanda vera, e le ultime due ad
   arrivare sono state le operazioni del castello: finché le
   moltiplicazioni e le divisioni le chiedeva solo la cassa — che
   scende di scalino invece di far sparire una domanda — nessun modulo
   di quiz le nominava, e il loro tasto «prova» non poteva aprire
   niente. Gliele hanno portate i problemi a parole («in ogni scatola
   ce ne sono 6, le scatole sono 4»), che è anche il posto giusto: lì
   la moltiplicazione va prima riconosciuta e poi fatta.

   L'atteso resta scritto come una lista e non come un «sono zero»
   apposta: se domani un gruppo smettesse di avere domande, il guasto
   deve dire QUALE, perché un interruttore che non toglie niente è
   peggio che non averlo. */
uguale('nessun gruppo di sapere è rimasto senza domande da far vedere',
       senzaEsempio.join(','), '')
nota(`esempi: ${TIPI.length} tipologie e ${SAPERI.length - senzaEsempio.length} gruppi su ${SAPERI.length} sanno mostrarsi`)

/* ── E IL ▶ MOSTRA UNA DOMANDA DI QUEL BAMBINO ──
   Un gruppo di sapere è largo: «i numeri e le quantità» va dal colpo
   d'occhio sui pallini (dichiarato quattro anni) ai numeri a tre cifre
   (otto e mezzo). Il tasto di prova pescava fra tutte le sue sorgenti,
   quindi al grande che stava decidendo l'età di un bambino di quattro
   anni poteva uscire la domanda da otto e mezzo — gli si chiedeva di
   giudicare se suo figlio sappia una cosa mostrandogli quello che a suo
   figlio non arriverà per anni.

   Con la finestra, restano le sorgenti che a quell'età arriverebbero
   davvero. È la stessa `finestraDi` della partita: se qui si rifacesse
   il conto, le due copie divergerebbero senza che niente diventi
   rosso. */
{
  const livelloDi = s => s.tipo
    ? s.modulo.livelloDelTipo(s.modulo.tipiDi(s.grado).find(t => t.chiave === s.tipo), s.grado)
    : s.modulo.livelli[s.grado - 1]

  for (const eta of [4, 6, 9]) {
    const finestra = finestraDi(eta)
    const fuori = []
    for (const sap of SAPERI) {
      for (const s of sorgentiDi(moduli, sap.chiave, { eta, finestra })) {
        const l = livelloDi(s)
        if (l < finestra[0] || l > finestra[1])
          fuori.push(`${sap.chiave}: ${s.modulo.id} g${s.grado} a ${l}`)
      }
    }
    uguale(`a ${eta} anni il ▶ non apre niente fuori dalla sua finestra`,
           fuori.join(' · '), '')
  }

  /* e il taglio morde davvero: a quattro anni il gruppo dei numeri ha
     meno sorgenti di quante ne abbia in tutto */
  const tutte = sorgentiDi(moduli, 'numeri').length
  const a4 = sorgentiDi(moduli, 'numeri', { eta: 4, finestra: finestraDi(4) }).length
  controlla('a 4 anni «i numeri e le quantità» mostra solo il suo fondo',
            a4 > 0 && a4 < tutte, `${a4} sorgenti su ${tutte}`)
  nota(`«i numeri e le quantità»: ${tutte} sorgenti in tutto, ${a4} a quattro anni`)

  /* Senza finestra non cambia niente per chi non la passa: la schermata
     dei grandi che guarda il catalogo intero vuole vedere tutto. */
  uguale('senza età si torna a vederle tutte',
         sorgentiDi(moduli, 'numeri', null).length, tutte)
}

riassunto('i macrogruppi di sapere')
