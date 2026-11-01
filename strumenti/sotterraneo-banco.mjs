// Il banco del sotterraneo da riga di comando: il giocatore finto (src/giochi/sotterraneo/motore/banco.js) gioca le discese
// senza schermo, su più processi, e si legge quante se ne vincono rispondendo bene 8, 6 e 4 volte su 10. È lo strumento con
// cui si tara l'equilibrio (docs/sotterraneo/scontro-bilancio.md): le stesse misure di `misure/sotterraneo`, ma a scelta e in
// qualche secondo invece di sei minuti.
//
//   npm run sotterraneo                          # la storia: le sette discese, i quattro eroi, roba e livello attesi
//   npm run sotterraneo -- --semi 20             # venti partite per cella (di difetto 10)
//   npm run sotterraneo -- --scarti 0,-1,2       # anche con la roba di una discesa prima e di due avanti
//   npm run sotterraneo -- --livelli -2,3        # anche con l'eroe due livelli sotto e tre sopra
//   npm run sotterraneo -- --eroi mago,nano --discese 2,3   # solo quelli (le discese sono gli indici, 0 è la cripta)
//   npm run sotterraneo -- --verifica           # solo i bersagli di misure/sotterraneo che la discesa non rispetta (con --semi 20 sono gli stessi semi)
//   npm run sotterraneo -- --come tutto          # chi gira tutto, non chi va dritto alla scala
//   npm run sotterraneo -- --torce 40            # con la torcia sempre accesa (e quaranta di scorta): la luce di chi la compra
//   npm run sotterraneo -- --bravure 0.8,0.4     # altre percentuali di risposte giuste
//   npm run sotterraneo -- --diag                # com'è fatta una discesa: domande, svenimenti, pozioni, vita a fine scontro, abilità
//   npm run sotterraneo -- --zone 12,16,20,30    # le zone a quei livelli (--eroe-a 11,12,.. se l'eroe ha un altro livello)
//   npm run sotterraneo -- --vere                # la storia giocata davvero, discesa dopo discesa, con la spesa (--fila tutto)
//   npm run sotterraneo -- --abisso             # fin dove arriva chi esce dalla storia (--nudo: chi parte nudo) e quanto costa un piano; --tetto N: fin dove si guarda (30)
//   npm run sotterraneo -- --risparmio 100,250  # chi arriva con quelle gemme da parte e compra il meglio che può
//   npm run sotterraneo -- --armi               # l'attacco delle armi a una e a due mani nei tre gradini, a livello 1, 11 e 31
//   npm run sotterraneo -- --numeri 1,5,12,20,30  # vita, difesa e attacco dell'eroe atteso a quei livelli, per eroe
//   npm run sotterraneo -- --strada mago:pura --punti intelligenza,destrezza,tempra   # lo stesso con un altro giro dei punti
//   npm run sotterraneo -- --strada cavaliere:spadone --mani 1   # la stessa strada con arma a una mano e scudo (--mani 2: a due mani)
//   npm run sotterraneo -- --strada mago         # le tre strade di una classe a confronto (--strada mago:pura una sola, --strada tutte le dodici)
//   npm run sotterraneo -- --forza 1,5,12,20,30  # la forza dell'eroe atteso a quei livelli, per eroe (deve valere il livello)
//   npm run sotterraneo -- --forza 6,7,8,9,10,11,12 --rapporti   # il suo rapporto (le gobbe che fanno sbagliare la forza)
//   npm run sotterraneo -- --tara 2.spinta=6.5,5.forza=4   # prova un valore di una discesa (indice.campo=valore) senza toccare i sorgenti
//   npm run sotterraneo -- --tara zona.forzaA12=4|5,zona.altare=1.6   # lo stesso per la curva delle zone e la forma di una zona
//   npm run sotterraneo -- --tara livelli.A=50,livelli.B=56,livelli.Q=35,livelli.R=420   # e per la curva dell'esperienza (dati/livelli.js)
//   npm run sotterraneo -- --abisso --tara abisso.forza=3,abisso.spinta=10   # e per l'abisso
//   npm run sotterraneo -- --tara 2.spinta=5|6|7             # con più valori separati da | prova ogni combinazione, una tabella l'una
//   npm run sotterraneo -- --turni [--file]      # la fila dei turni: velocità e doppi turni di ogni classe nelle discese (--file: la fila lettera per lettera)
//   npm run sotterraneo -- --domande             # le domande obbligate per discesa e per piano rispondendo sempre giusto: dritto alla scala e girando tutto, per eroe (il tetto è 85)
//   npm run sotterraneo -- --costi               # l'energia: globo atteso, costo e lanci col globo pieno per classe e riga
//   npm run sotterraneo -- --passi               # i passi che il giocatore finto fa davvero per piano e per discesa (dritto e giro), e quanto globo ridanno
//   npm run sotterraneo -- --luce                # le torce che si trovano senza comprarne: a discesa e da dove, le stanze al buio, dritto e girando
//   npm run sotterraneo -- --mondo               # il mondo a percorso coi mostri: il curioso dalla pietra all'ingresso di ogni dungeon (per strada e passando dalle tane)
//   npm run sotterraneo -- --senza-abilita       # il banco di prima: solo attacco, nessun albero
//   npm run sotterraneo -- --senza-preparati     # il banco senza gli incanti preparati dal campo (resta il mana che torna camminando)
//   npm run sotterraneo -- --contro <commit>     # le stesse misure sul commit, e «prima → dopo» nelle celle
//   npm run sotterraneo -- --contro <commit> --banco-di-adesso   # idem, ma col giocatore finto di adesso (le abilità) anche sul commit
//
// `--contro` prepara da sé un `git worktree` in tmp/ sul commit chiesto, lo misura con questo stesso strumento (le cose che il
// commit non ha, come l'interruttore delle abilità, si ignorano) e lo toglie. `--processi N` limita i processi (di difetto
// quanti i core meno due). Le partite hanno semi fissi: due giri danno le stesse cifre.
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { availableParallelism } from 'node:os'
import { existsSync, rmSync, copyFileSync } from 'node:fs'

const QUI = fileURLToPath(import.meta.url)
const RADICE = resolve(dirname(QUI), '..')
const EROI = ['cavaliere', 'elfa', 'mago', 'nano']
const SRC = 'src/giochi/sotterraneo/'

const argv = process.argv.slice(2)
const valore = (nome, difetto = null) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : difetto }
const numeri = (nome, difetto) => (valore(nome) != null ? valore(nome).split(',').map(Number) : difetto)

/* ═══════════ il lavoratore: un pezzo di misura, in un processo a sé ═══════════ */
if (argv[0] === '--lavoro') {
  const lavoro = JSON.parse(argv[1])
  const mod = nome => import(pathToFileURL(join(lavoro.radice, SRC, nome)).href)
  const banco = await mod('motore/banco.js')
  if (lavoro.senzaAbilita && banco.BANCO) banco.BANCO.abilita = false
  if (lavoro.senzaPreparati && banco.BANCO) banco.BANCO.preparati = false
  // `--tara 2.spinta=6.5,5.forza=4` prova un valore di una discesa senza toccare i sorgenti (le zone lo ereditano)
  if (lavoro.tara) {
    const { CAMPAGNA, L_ABISSO } = await mod('dati/campagna.js')
    const zone = await mod('dati/zone.js')
    const livelli = await mod('dati/livelli.js')
    for (const voce of lavoro.tara.split(',').filter(Boolean)) {
      const [k, campo] = voce.split('=')[0].split('.')
      // `zona.forzaA12=5` ritocca la curva delle zone, `zona.altare=1.4` la forma di una zona (dati/zone.js), `livelli.A=50` la curva dell'esperienza
      if (k === 'livelli') livelli.CURVA_DELL_ESPERIENZA[campo] = Number(voce.split('=')[1])
      else if (k === 'zona') { if (campo in zone.CURVA_DELLE_ZONE) zone.CURVA_DELLE_ZONE[campo] = Number(voce.split('=')[1]); else zone.FORMA_DELLA_ZONA[campo] = Number(voce.split('=')[1]) }
      else if (k === 'abisso') L_ABISSO[campo] = Number(voce.split('=')[1])   // `abisso.forza=3` ritocca l'abisso
      else CAMPAGNA[Number(k)][campo] = Number(voce.split('=')[1])
    }
  }
  let r
  if (lavoro.che === 'storia') r = banco.misuraLaStoria(lavoro.opz)
  else if (lavoro.che === 'zone') r = banco.misuraLeZone(lavoro.opz)
  else if (lavoro.che === 'vere') r = banco.misuraConLaRoba(lavoro.opz)
  else if (lavoro.che === 'risparmio') r = banco.misuraDiChiHaMessoDaParte(lavoro.opz)
  else if (lavoro.che === 'abisso') r = await abisso(lavoro.opz)
  else if (lavoro.che === 'diag') r = await diagnosi(lavoro.opz)
  else if (lavoro.che === 'strada') r = await strada(lavoro.opz)
  else if (lavoro.che === 'passi') r = await passiFatti(lavoro.opz)
  else if (lavoro.che === 'luce') r = await luce(lavoro.opz)
  else if (lavoro.che === 'domande') r = await domandeDi(lavoro.opz)
  else if (lavoro.che === 'mondo') r = (await mod('motore/banco-mondo.js')).misuraIlMondo(lavoro.opz)
  console.log(JSON.stringify(r))

  // la luce di chi non compra torce (docs/sotterraneo/luce.md, «Quante se ne trovano»): quante torce trova una discesa, da dove (la cosa
  // per terra dice `da`: forziere, strada, caporale, grosso; la curiosità le accende senza posarle; le appese ai muri sono il resto), le stanze in cui entra e quante al buio,
  // e quante gliene restano uscendo. Conta dal motore com'è, anche su un commit di prima (`--contro`): la torcia che si accende dalla cintura
  // non è una trovata
  async function luce({ eroe, k, semi, come, bravura }) {
    const { CAMPAGNA } = await mod('dati/campagna.js')
    const { COSE } = await mod('dati/cose.js')
    const { Corsa } = await mod('motore/corsa.js')
    const { robaAttesa, crescitaAttesa } = await mod('motore/storia.js')
    const n = { torce: 0, forziere: 0, mostro: 0, curiosita: 0, stanze: 0, buio: 0, restano: 0, aperti: 0, mostri: 0, piani: 0, partite: semi }
    let da = null
    const trovata = Corsa.prototype.trovata, accendi = Corsa.prototype.accendi, brucia = Corsa.prototype.bruciaLaTorcia
    const dallaCintura = Corsa.prototype.accendiDallaCintura, curiosita = Corsa.prototype.rispostaCuriosita
    Corsa.prototype.trovata = function (r) { da = r && COSE[r.cosa] && COSE[r.cosa].usa === 'luce' ? (r.da === 'forziere' ? 'forziere' : r.da ? 'mostro' : 'terra') : null; try { return trovata.apply(this, arguments) } finally { da = null } }
    Corsa.prototype.accendi = function () { n.torce++; if (da) n[da] = (n[da] || 0) + 1; else if (this._curiosa) n.curiosita++; return accendi.apply(this, arguments) }
    if (dallaCintura) Corsa.prototype.accendiDallaCintura = function () { const ok = dallaCintura.apply(this, arguments); if (ok) n.torce--; return ok }
    if (curiosita) Corsa.prototype.rispostaCuriosita = function () { this._curiosa = true; try { return curiosita.apply(this, arguments) } finally { this._curiosa = false } }
    Corsa.prototype.bruciaLaTorcia = function () {
      const prima = this.stanzaOra
      const r = brucia.apply(this, arguments)
      if (this.stanzaOra !== prima) { n.stanze++; if (!this.torciaAccesa) n.buio++ }
      return r
    }
    for (let s = 0; s < semi; s++) {
      const g = banco.gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11, bravura, eroe, roba: robaAttesa(eroe, k), crescita: crescitaAttesa(eroe, k), come })
      n.restano += (g.corsa.torciaAccesa ? 1 : 0) + g.corsa.torceInScorta
      // i forzieri aperti e i mostri battuti: da dove le torce possono venire
      const livelli = new Set([g.corsa.livello, ...[...(g.corsa.piani || new Map()).values()].map(p => p.livello)])
      for (const L of livelli) n.aperti += L.robe.filter(q => q.che === 'forziere' && q.aperto).length
      n.mostri += g.esito.mostri || 0
      n.piani += g.esito.piani || 0
    }
    return n
  }

  // le domande obbligate di una discesa rispondendo sempre giusto (la misura di `unita/sotterraneo`, «il minimo sta in una seduta»): dritto
  // alla scala (minimo) e girando tutto, in totale e piano per piano, con la roba e la crescita di chi ci arriva andando dritto; la media di più semi
  async function domandeDi({ eroe, k, semi }) {
    const { CAMPAGNA } = await mod('dati/campagna.js')
    const r = { minimo: [], tutto: [], totMinimo: 0, totTutto: 0, vinte: 0 }
    for (let s = 0; s < semi; s++) for (const come of ['minimo', 'tutto']) {
      const g = banco.gioca(CAMPAGNA[k], { seme: [7, 41, 99, 203, 311, 457, 571, 701][s % 8] + 1000 * Math.floor(s / 8), bravura: 1, come, eroe, roba: banco.robaPer(k, { eroe }), crescita: banco.crescitaPer(k, { eroe }) })
      const p = g.perPiano.map(n => n || 0)
      p.forEach((n, i) => { r[come][i] = (r[come][i] || 0) + n })
      r[come === 'minimo' ? 'totMinimo' : 'totTutto'] += g.esito.domande
      if (come === 'minimo' && g.esito.vinta) r.vinte++
    }
    return r
  }

  // l'abisso: fin dove arriva chi ci entra come si entra (la roba e il livello con cui si esce dalla storia, o nudo con `--nudo`) e
  // quanto costa un piano (minimo e tutto, col livello 12)
  async function abisso({ eroe, semi, tetto, nudo }) {
    const { L_ABISSO, CAMPAGNA } = await mod('dati/campagna.js')
    const { robaAttesa, crescitaAttesa } = await mod('motore/storia.js')
    const n = CAMPAGNA.length
    const base = nudo ? {} : { roba: robaAttesa(eroe, n), crescita: crescitaAttesa(eroe, n) }
    const f = banco.finoADove(L_ABISSO, { eroe, semi: Array.from({ length: semi }, (_, i) => [7, 41, 99, 203, 311, 457, 571, 701][i]), tetto, ...base })
    const costi = banco.costoDeiPiani(L_ABISSO, { fino: 11, seme: 41, eroe, ...base })
    return { fondi: f.fondi, costi }
  }

  // com'è una discesa giocata a una bravura: domande, svenimenti, pozioni bevute, vita a fine scontro, abilità e turni per scontro
  // (`strumenta` conta finché `attivo`, e il chiamante lo spegne quando ha giocato la bravura che gli interessa)
  async function strumenta() {
    const { Corsa } = await mod('motore/corsa.js')
    const n = { attivo: true, fini: 0, scontri: 0, pozioni: 0, abilita: 0, turni: 0, aperti: 0, energiaIn: 0, energiaMaxIn: 0, preparati: 0, ceLHo: 0 }
    const scontro = Corsa.prototype.scontro, chiudi = Corsa.prototype.chiudi, usa = Corsa.prototype.usa, prepara = Corsa.prototype.prepara, risposta = Corsa.prototype.rispostaScontro
    // l'energia con cui si entra in uno scontro, e il massimo (docs/sotterraneo/abilita.md, «L'energia»)
    Corsa.prototype.scontro = function () { const r = scontro.apply(this, arguments); if (n.attivo && this.foglio && this.foglio.che === 'scontro') { n.aperti++; n.energiaIn += this.energia; n.energiaMaxIn += this.energiaMax } return r }
    Corsa.prototype.chiudi = function () { if (n.attivo && this.foglio && this.foglio.che === 'scontro') { n.fini += this.vita / this.vitaMax; n.scontri++ } return chiudi.apply(this, arguments) }
    Corsa.prototype.usa = function (i) { if (n.attivo && /pozione/.test(this.zaino[i] || '')) n.pozioni++; return usa.apply(this, arguments) }
    Corsa.prototype.prepara = function (id) { const ok = prepara.apply(this, arguments); if (n.attivo && ok && id) n.abilita++; return ok }
    Corsa.prototype.rispostaScontro = function () { if (n.attivo) n.turni++; return risposta.apply(this, arguments) }
    // gli incanti preparati lanciati dal campo, e quanti scontri cominciano con almeno uno addosso (docs/sotterraneo/orologio.md)
    if (Corsa.prototype.preparaDalCampo) {
      const dal = Corsa.prototype.preparaDalCampo
      Corsa.prototype.preparaDalCampo = function (id) { const ok = dal.apply(this, arguments); if (n.attivo && ok) n.preparati++; return ok }
      const aperti = Corsa.prototype.scontro
      Corsa.prototype.scontro = function () { const r = aperti.apply(this, arguments); if (n.attivo && this.foglio && this.foglio.che === 'scontro' && this.preparati.length) n.ceLHo++; return r }
    }
    return n
  }

  async function diagnosi({ eroe, k, bravura, semi, come }) {
    const { CAMPAGNA } = await mod('dati/campagna.js')
    const { robaAttesa, crescitaAttesa } = await mod('motore/storia.js')
    const n = await strumenta()
    let vinte = 0, domande = 0, svenimenti = 0
    for (let s = 0; s < semi; s++) {
      const g = banco.gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11, bravura, eroe, roba: robaAttesa(eroe, k), crescita: crescitaAttesa(eroe, k), come })
      if (g.esito.vinta) vinte++
      domande += g.esito.domande
      svenimenti += g.esito.svenimenti
    }
    return { vinte, domande, svenimenti, ...n, partite: semi }
  }

  // i passi che il giocatore finto fa davvero (le celle percorse, senza i turni dello scontro): per piano, e per discesa intera
  async function passiFatti({ eroe, k, semi, come, bravura }) {
    const { CAMPAGNA } = await mod('dati/campagna.js')
    const { robaAttesa, crescitaAttesa } = await mod('motore/storia.js')
    let piani = 0, passi = 0, discese = 0
    for (let s = 0; s < semi; s++) {
      const g = banco.gioca(CAMPAGNA[k], { seme: 7000 + s * 89 + k * 11, bravura, eroe, roba: robaAttesa(eroe, k), crescita: crescitaAttesa(eroe, k), come })
      const p = (g.passiPerPiano || []).filter(n => n != null)
      piani += p.length; passi += p.reduce((a, b) => a + b, 0)
      if (g.esito.vinta) discese++
    }
    return { piani, passi, discese, partite: semi }
  }

  // una strada (dati/strade.js) in una discesa: quante volte si arriva in fondo a ogni bravura, e com'è la discesa alla prima
  // (domande, svenimenti, pozioni, vita a fine scontro, abilità e turni per scontro). `piu`: livelli sopra quello atteso
  async function strada({ classe, nome, k, prove, semi, piu, punti, mani }) {
    const n = await strumenta()
    const r = banco.misuraLaStrada({ classe, nome, k, prove, semi, piu, punti, mani, allaPrima: () => { n.attivo = false } })
    return { ...r, ...n }
  }
  process.exit(0)
}

/* ═══════════ il pool: lavori in parallelo ═══════════ */
const POSTI = Number(valore('--processi')) || Math.max(2, availableParallelism() - 2)
async function inParallelo(lavori) {
  const risultati = new Array(lavori.length)
  let prossimo = 0
  const uno = () => new Promise((ok, no) => {
    const i = prossimo++
    if (i >= lavori.length) return ok()
    const p = spawn('node', [QUI, '--lavoro', JSON.stringify(lavori[i])])
    let out = ''
    p.stdout.on('data', d => { out += d })
    p.stderr.on('data', d => process.stderr.write(d))
    p.on('close', codice => {
      if (codice) return no(new Error(`un lavoro è finito male (${codice}): ${JSON.stringify(lavori[i]).slice(0, 200)}`))
      risultati[i] = JSON.parse(out)
      uno().then(ok, no)
    })
  })
  await Promise.all(Array.from({ length: Math.min(POSTI, lavori.length) }, uno))
  return risultati
}

/* ═══════════ le misure: una radice di sorgenti (questa, o quella di un altro commit) → una tabella di celle ═══════════ */
const OPZ = {
  semi: Number(valore('--semi', 10)),
  eroi: valore('--eroi') ? valore('--eroi').split(',') : EROI,
  prove: numeri('--bravure', [0.8, 0.6, 0.4]),
  scarti: argv.includes('--verifica') ? [0, -1, 2] : numeri('--scarti', [0]),
  livelli: argv.includes('--verifica') ? [-2, 3] : numeri('--livelli', []),
  come: valore('--come', 'minimo'),
  zone: numeri('--zone', null),
  eroeA: numeri('--eroe-a', null),
  fila: valore('--fila', 'minimo'),
  senzaAbilita: argv.includes('--senza-abilita'),
  senzaPreparati: argv.includes('--senza-preparati'),
  tara: valore('--tara', ''),
  torce: Number(valore('--torce', 0)),   // `--torce 40`: si scende con la torcia accesa e quaranta di scorta (docs/sotterraneo/luce.md)
  taraOra: valore('--tara', ''),
}
const campagna = async radice => (await import(pathToFileURL(join(radice, SRC, 'dati/campagna.js')).href)).CAMPAGNA
const percento = (v, tot) => Math.round((v / tot) * 100)

// ogni misura torna { righe: [{ titolo, celle: [ numero in 0..100 | testo ] }], intestazione: [..] } per radice; il confronto le mette in colonna
async function misura(radice) {
  const CAMP = await campagna(radice)
  const discese = numeri('--discese', CAMP.map((_, k) => k))
  const nomi = discese.map(k => CAMP[k].chiave.slice(0, 7))
  const tabelle = []
  const base = { radice, senzaAbilita: OPZ.senzaAbilita, senzaPreparati: OPZ.senzaPreparati, tara: OPZ.taraOra }

  // `--numeri 1,5,12,20,30`: vita, difesa e attacco dell'eroe atteso a quei livelli, per eroe (docs/sotterraneo/livelli.md): quello
  // che le quattro caratteristiche fanno alle classi. Con `--contro` sono «prima → dopo»
  if (argv.includes('--numeri')) {
    const { eroeAtteso } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
    const Ls = numeri('--numeri', [1, 5, 12, 20, 30])
    const righe = []
    for (const e of OPZ.eroi) {
      const eroi = Ls.map(L => eroeAtteso(e, L))
      righe.push({ titolo: `${e}: vita`, celle: eroi.map(c => c.vitaConLaRoba), numeri: true })
      righe.push({ titolo: `${e}: difesa`, celle: eroi.map(c => c.dif), numeri: true })
      righe.push({ titolo: `${e}: attacco`, celle: eroi.map(c => c.att), numeri: true })
    }
    return { intestazione: Ls.map(String), titolo: 'vita, difesa e attacco dell\'eroe atteso al livello', righe, numeri: true }
  }

  // `--strada mago`, `--strada mago:pura`, `--strada tutte`: le strade di una classe (dati/strade.js, docs/sotterraneo/strade.md) giocate
  // discesa per discesa, ognuna con la sua roba, i suoi punti e il suo albero, a confronto: quante volte si arriva in fondo a ogni
  // bravura, le domande, gli svenimenti e la vita che resta a fine scontro. `--livelli 0,5`: anche con l'eroe cinque livelli sopra
  // quello atteso (dove le discese non sono più un muro e le strade si distinguono)
  if (argv.includes('--strada')) {
    const { STRADE } = await import(pathToFileURL(join(radice, SRC, 'dati/strade.js')).href)
    const voce = valore('--strada')
    const classi = voce === 'tutte' ? EROI : [voce.split(':')[0]]
    const lavori = []
    for (const classe of classi) for (const nome of Object.keys(STRADE[classe] || {})) {
      if (voce.includes(':') && voce.split(':')[1] !== nome) continue
      for (const piu of numeri('--livelli', [0])) for (const k of discese)
        lavori.push({ ...base, che: 'strada', opz: { classe, nome, k, prove: OPZ.prove, semi: OPZ.semi, piu, punti: valore('--punti') ? valore('--punti').split(',') : null, mani: valore('--mani') }, classe, nome, k, piu })
    }
    if (!lavori.length) throw new Error(`nessuna strada «${voce}»: ${EROI.map(c => `${c}:${Object.keys(STRADE[c] || {}).join('|')}`).join(' ')}`)
    // `--scheda`: com'è fatto l'eroe di ogni strada entrando in ogni discesa (arma, scudo, vita, difesa, attacco, schivata, energia,
    // velocità), con i punti dati e l'albero speso come la strada li dà: niente partite
    if (argv.includes('--scheda')) {
      const { stradaDi, robaDellaStrada, crescitaDellaStrada } = await import(pathToFileURL(join(radice, SRC, 'motore/strade.js')).href)
      const { Corredo } = await import(pathToFileURL(join(radice, SRC, 'motore/corredo.js')).href)
      const { conLaStrada } = await import(pathToFileURL(join(radice, SRC, 'motore/abilita.js')).href)
      const piu = numeri('--livelli', [0])[0]
      const righe = []
      for (const classe of classi) for (const nome of Object.keys(STRADE[classe])) {
        if (voce.includes(':') && voce.split(':')[1] !== nome) continue
        const st = stradaDi(classe, nome)
        if (valore('--punti')) st.punti = valore('--punti').split(',')
        const eroi = discese.map(k => {
          const cr = crescitaDellaStrada(classe, st, k, piu)
          const c = new Corredo({ eroe: classe, roba: robaDellaStrada(classe, st, k, { piu }), crescita: { ...conLaStrada(cr, classe, st.abilita), caselle: [null, null, null] } })
          c.sistemaIlCorredo()
          return c
        })
        const nomeDi = k => String(k || '-').split('@')[0].slice(0, 7)
        righe.push({ titolo: `${classe}:${nome}: mano · mancina`, celle: eroi.map(c => `${nomeDi(c.mano)}/${nomeDi(c.mancina)}`), numeri: true })
        for (const [campo, f] of [['vita', c => c.vitaConLaRoba], ['difesa', c => c.dif], ['attacco', c => c.att], ['schivata %', c => c.schivata],
                                  ['energia', c => c.energiaMax], ['velocità', c => +c.velocita.toFixed(1)]])
          righe.push({ titolo: `   ${campo}`, celle: eroi.map(f), numeri: true })
      }
      return { titolo: `l'eroe di ogni strada${piu ? ` (+${piu} livelli)` : ''} entrando in ogni discesa`, intestazione: nomi, righe, numeri: true, larga: 14 }
    }
    const r = await inParallelo(lavori)
    // `--sintesi`: una riga per strada, la media delle discese: vittorie a ogni bravura, domande, svenimenti, vita a fine scontro
    if (argv.includes('--sintesi')) {
      const righe = []
      for (const classe of classi) for (const piu of numeri('--livelli', [0])) for (const nome of Object.keys(STRADE[classe])) {
        if (voce.includes(':') && voce.split(':')[1] !== nome) continue
        const mie = lavori.map((l, i) => ({ l, r: r[i] })).filter(x => x.l.classe === classe && x.l.nome === nome && x.l.piu === piu).map(x => x.r)
        const tot = f => mie.reduce((n, x) => n + f(x), 0)
        righe.push({ titolo: `${classe}:${nome}${numeri('--livelli', [0]).length > 1 || piu ? ` (${piu > 0 ? '+' : ''}${piu})` : ''}`,
          celle: [...OPZ.prove.map((_, j) => percento(tot(x => x.vinte[j]), mie.length * OPZ.semi)),
                  Math.round(tot(x => x.domande) / (mie.length * OPZ.semi)), +(tot(x => x.svenimenti) / (mie.length * OPZ.semi)).toFixed(1),
                  percento(tot(x => x.fini), tot(x => x.scontri) || 1)] })
      }
      return { titolo: `le strade, media delle discese (${OPZ.semi} partite per cella; vittorie %, domande e svenimenti per discesa a ${Math.round(OPZ.prove[0] * 10)}/10, vita % a fine scontro)`,
               intestazione: [...OPZ.prove.map(b => `${Math.round(b * 10)}/10`), 'domande', 'svenim.', 'vita%'], righe, larga: 9, numeri: true }
    }
    const sub = []
    for (const classe of classi) for (const piu of numeri('--livelli', [0])) {
      const righe = []
      for (const nome of Object.keys(STRADE[classe])) {
        const mie = lavori.map((l, i) => ({ l, r: r[i] })).filter(x => x.l.classe === classe && x.l.nome === nome && x.l.piu === piu)
        if (!mie.length) continue
        const per = k => mie.find(x => x.l.k === k).r
        OPZ.prove.forEach((b, j) => righe.push({ titolo: `${nome} a ${Math.round(b * 10)}/10`, celle: discese.map(k => percento(per(k).vinte[j], OPZ.semi)), media: true }))
        righe.push({ titolo: `   domande (a ${Math.round(OPZ.prove[0] * 10)}/10)`, celle: discese.map(k => Math.round(per(k).domande / OPZ.semi)), numeri: true })
        righe.push({ titolo: `   svenimenti`, celle: discese.map(k => +(per(k).svenimenti / OPZ.semi).toFixed(1)), numeri: true })
        righe.push({ titolo: `   vita% a fine scontro`, celle: discese.map(k => percento(per(k).fini, per(k).scontri || 1)) })
      }
      sub.push({ titolo: `${classe}: le strade${piu ? ` (eroe ${piu > 0 ? '+' : ''}${piu} livelli)` : ''}, ${OPZ.semi} partite per cella`, intestazione: nomi, righe })
    }
    return { sub }
  }

  // `--armi`: l'attacco delle armi a una e a due mani nei tre gradini, a livello 1, 11 e 31 (docs/sotterraneo/roba.md, «Due mani»);
  // con `--contro` «prima → dopo». Le basi che esistono a quel gradino e a quelle mani, per famiglia
  if (argv.includes('--armi')) {
    const { COSE, CHIAVI_COSE, chiaveDelPezzo } = await import(pathToFileURL(join(radice, SRC, 'dati/cose.js')).href)
    const righe = []
    for (const grado of [1, 2, 3]) for (const mani of [1, 2]) {
      const basi = CHIAVI_COSE.filter(k => COSE[k].dove === 'mano' && COSE[k].grado === grado && (COSE[k].mani || 1) === mani)
      if (!basi.length) continue
      righe.push({ titolo: `gradino ${grado}, ${mani === 1 ? 'una mano' : 'due mani'} (${basi.join(' ')})`,
                   celle: [1, 11, 31].map(L => COSE[chiaveDelPezzo ? chiaveDelPezzo(basi[0], L) : basi[0]].att), numeri: true })
    }
    return { intestazione: ['liv. 1', 'liv. 11', 'liv. 31'], titolo: 'l\'attacco di un\'arma a una e a due mani', righe, numeri: true, larga: 10 }
  }

  if (argv.includes('--forza')) {
    const { livelloDiForza, eroeAtteso, rapporto } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
    const Ls = numeri('--forza', [1, 5, 12, 20, 30])
    // `--dettagli`: com'è fatto l'eroe atteso (arma, scudo, abilità forti, danno, vita): perché il suo rapporto fa gobbe
    if (argv.includes('--dettagli')) {
      const righe = []
      for (const e of OPZ.eroi) for (const L of Ls) {
        const c = eroeAtteso(e, L)
        const { mostroDiRiferimento, offesa, resistenza } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
        const m = mostroDiRiferimento(L), o = offesa(c, m)
        righe.push({ titolo: `${e} ${L}`, celle: [String(c.mano).split('@')[0], String(c.mancina).split('@')[0], o.forti.join('+') || '-', o.colpo, +o.risposte.toFixed(1), Math.round(resistenza(c)), +rapporto(c, L).toFixed(2)], numeri: true })
      }
      return { intestazione: ['mano', 'mancina', 'forti', 'colpo', 'risposte', 'resist.', 'rapporto'], titolo: 'l\'eroe atteso', righe, numeri: true, larga: 24 }
    }
    // `--rapporti`: invece del livello, il rapporto dell'eroe atteso (quanti mostri regge per ogni mostro che batte): le gobbe
    if (argv.includes('--rapporti'))
      return { intestazione: Ls.map(String), titolo: 'rapporto dell\'eroe atteso al livello', righe: OPZ.eroi.map(e => ({ titolo: e, celle: Ls.map(L => +rapporto(eroeAtteso(e, L), L).toFixed(2)) })), numeri: true }
    return { intestazione: Ls.map(String), titolo: 'forza dell\'eroe atteso al livello', righe: OPZ.eroi.map(e => ({ titolo: e, celle: Ls.map(L => livelloDiForza(eroeAtteso(e, L))) })), numeri: true }
  }

  // `--turni`: la fila dei turni di ogni classe nelle discese, con l'eroe atteso a quel livello (docs/sotterraneo/scontro.md,
  // «L'iniziativa»): la sua velocità, e quanti turni suoi seguono un altro turno suo (il doppio turno) contro un branco della
  // discesa e contro il peggiore dei suoi mostri da solo. `--file`: invece, la fila dei primi turni di un branco, lettera per lettera
  if (argv.includes('--turni')) {
    const { eroeAtteso } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
    const { LIVELLI_ATTESI } = await import(pathToFileURL(join(radice, SRC, 'dati/storia.js')).href)
    const { MOSTRI } = await import(pathToFileURL(join(radice, SRC, 'dati/mostri.js')).href)
    const { fileGiocata } = await import(pathToFileURL(join(RADICE, SRC, 'motore/turni.js')).href)
    const vel = k => CAMP[k].mostri.map(m => MOSTRI[m].velocita)
    const branco = k => Array.from({ length: CAMP[k].tettoBranco }, (_, i) => vel(k)[i % vel(k).length])
    const righe = []
    for (const e of OPZ.eroi) {
      const eroi = discese.map(k => eroeAtteso(e, LIVELLI_ATTESI[k]).velocita)
      if (argv.includes('--file')) {
        righe.push({ titolo: `${e} (velocità ${eroi.map(v => +v.toFixed(1)).join(' · ')})`, celle: discese.map((k, i) => fileGiocata(eroi[i], branco(k), 120, 22).fila) })
        continue
      }
      righe.push({ titolo: `${e}: velocità`, celle: eroi.map(v => +v.toFixed(1)), numeri: true })
      righe.push({ titolo: `${e}: doppi turni nel branco`, celle: discese.map((k, i) => Math.round(fileGiocata(eroi[i], branco(k)).doppi * 100)) })
      righe.push({ titolo: `${e}: doppi turni, il peggiore da solo`, celle: discese.map((k, i) => Math.round(Math.max(...vel(k).map(v => fileGiocata(eroi[i], [v]).doppi)) * 100)) })
    }
    if (argv.includes('--file')) return { intestazione: nomi, titolo: 'la fila dei primi turni di un branco (E l\'eroe, m un mostro)', righe, numeri: true, larga: 24 }
    return { intestazione: nomi, titolo: 'la fila dei turni: velocità dell\'eroe atteso e doppi turni (% dei turni suoi dopo un altro suo)', righe }
  }

  // `--costi`: l'energia delle abilità, classe per classe e riga per riga (docs/sotterraneo/abilita.md, «L'energia»): il globo che
  // l'eroe atteso ha al livello della riga, quanto costa un'abilità di quella riga (al primo grado) e quante se ne lanciano col globo
  // pieno
  if (argv.includes('--costi')) {
    const { eroeAtteso } = await import(pathToFileURL(join(radice, SRC, 'motore/forza.js')).href)
    const { RAMI, GRADINI, LIVELLI_PER_GRADO, costoAl } = await import(pathToFileURL(join(radice, SRC, 'dati/abilita.js')).href)
    const righe = []
    for (const e of OPZ.eroi) {
      const nodo = riga => RAMI[e].flatMap(r => r.nodi).find(x => x.riga === riga && !x.sempre)   // una riga di sole passive non costa
      const costo = (riga, g) => (nodo(riga) ? (costoAl && g > 1 ? costoAl({ ...nodo(riga), classe: e }, g) : nodo(riga).costo) : '-')
      const globo = (riga, g) => eroeAtteso(e, GRADINI[riga] + (g - 1) * LIVELLI_PER_GRADO).energiaMax
      const lanci = (riga, g) => (nodo(riga) ? +(globo(riga, g) / costo(riga, g)).toFixed(1) : '-')
      righe.push({ titolo: `${e}: globo`, celle: GRADINI.map((_, r) => globo(r, 1)), numeri: true })
      righe.push({ titolo: `${e}: costo`, celle: GRADINI.map((_, r) => costo(r, 1)), numeri: true })
      righe.push({ titolo: `${e}: lanci col globo pieno`, celle: GRADINI.map((_, r) => lanci(r, 1)), numeri: true })
      // al terzo grado (quattro livelli più su): il globo è cresciuto, e il costo con lui
      righe.push({ titolo: `${e}: costo al grado 3`, celle: GRADINI.map((_, r) => costo(r, 3)), numeri: true })
      righe.push({ titolo: `${e}: lanci al grado 3`, celle: GRADINI.map((_, r) => lanci(r, 3)), numeri: true })
    }
    return { intestazione: GRADINI.map((L, r) => `riga ${r} (L${L})`), titolo: 'l\'energia attesa e il costo delle abilità per riga', righe, numeri: true, larga: 14 }
  }

  // `--passi`: i passi del giocatore finto per piano e per discesa, dritto alla scala (minimo) e girando ogni cosa che vale (tutto), e
  // quanto globo di mana ridanno (docs/sotterraneo/orologio.md). Solo le discese vinte contano per «discesa intera»
  if (argv.includes('--passi')) {
    const { MANA_PER_PASSO } = await import(pathToFileURL(join(radice, SRC, 'dati/mondo.js')).href)
    const lavori = []
    for (const come of ['minimo', 'tutto']) for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'passi', opz: { eroe, k, semi: OPZ.semi, come, bravura: OPZ.prove[0] }, come, k })
    const r = await inParallelo(lavori)
    const somma = (come, k, f) => lavori.reduce((n, l, x) => (l.come === come && l.k === k ? n + r[x][f] : n), 0)
    const righe = []
    for (const come of ['minimo', 'tutto']) {
      const piano = discese.map(k => Math.round(somma(come, k, 'passi') / (somma(come, k, 'piani') || 1)))
      righe.push({ titolo: `${come === 'minimo' ? 'dritto' : 'giro'}: passi per piano`, celle: piano, numeri: true })
      righe.push({ titolo: `   di globo per piano (%)`, celle: piano.map(n => Math.round(n * MANA_PER_PASSO * 100)), numeri: true })
      righe.push({ titolo: `   passi per discesa`, celle: discese.map(k => Math.round(somma(come, k, 'passi') / (OPZ.eroi.length * OPZ.semi))), numeri: true })
    }
    return { intestazione: nomi, titolo: `i passi che il giocatore finto fa davvero (${OPZ.eroi.length * OPZ.semi} partite a discesa, bravura ${OPZ.prove[0] * 10}/10)`, righe, numeri: true }
  }

  // `--luce`: le torce che si trovano senza comprarne (docs/sotterraneo/luce.md, «Quante se ne trovano»), dritto e girando tutto, con la roba
  // e il livello attesi e senza torce in tasca: quante a discesa e da dove, le stanze entrate e quante al buio, quante ne restano uscendo
  if (argv.includes('--luce')) {
    const lavori = []
    for (const come of ['minimo', 'tutto']) for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'luce', opz: { eroe, k, semi: OPZ.semi, come, bravura: OPZ.prove[0] }, come, k })
    const r = await inParallelo(lavori)
    const somma = (come, k, f) => lavori.reduce((n, l, x) => (l.come === come && l.k === k ? n + (r[x][f] || 0) : n), 0)
    const part = OPZ.eroi.length * OPZ.semi
    const a = (come, f) => discese.map(k => +(somma(come, k, f) / part).toFixed(1))
    const righe = []
    for (const come of ['minimo', 'tutto']) {
      righe.push({ titolo: `${come === 'minimo' ? 'dritto' : 'giro'}: torce trovate`, celle: a(come, 'torce'), numeri: true })
      righe.push({ titolo: '   dai forzieri', celle: a(come, 'forziere'), numeri: true })
      righe.push({ titolo: '   dai mostri', celle: a(come, 'mostro'), numeri: true })
      righe.push({ titolo: '   dalle curiosità', celle: a(come, 'curiosita'), numeri: true })
      // le torce appese (motore/torce-a-muro.js) si accendono passandoci sotto, senza una cosa per terra: sono quelle che restano
      righe.push({ titolo: '   appese ai muri', celle: discese.map(k => +((somma(come, k, 'torce') - somma(come, k, 'forziere') - somma(come, k, 'mostro') - somma(come, k, 'curiosita') - somma(come, k, 'terra')) / part).toFixed(1)), numeri: true })
      righe.push({ titolo: '   stanze entrate', celle: a(come, 'stanze').map(Math.round), numeri: true })
      righe.push({ titolo: '   al buio (%)', celle: discese.map(k => percento(somma(come, k, 'buio'), somma(come, k, 'stanze') || 1)), numeri: true })
      righe.push({ titolo: '   torce uscendo', celle: a(come, 'restano'), numeri: true })
      righe.push({ titolo: '   piani · forzieri aperti · mostri', celle: discese.map((k, i) => `${a(come, 'piani')[i]}·${a(come, 'aperti')[i]}·${Math.round(a(come, 'mostri')[i])}`), numeri: true })
    }
    return { intestazione: nomi, titolo: `la luce di chi non compra torce (${part} partite a discesa, bravura ${OPZ.prove[0] * 10}/10, roba attesa)`, righe, numeri: true }
  }

  // `--mondo`: il mondo a percorso coi mostri (docs/sotterraneo/mondo-aperto-mostri.md, «Le misure»): il curioso esce dalla pietra accesa
  // più avanti prima del dungeon e va al suo ingresso, per strada (combatte chi lo raggiunge) o passando dalle tane (va incontro a chi vede); `--semi` storie
  // per eroe, `--bravure` la prima. Le colonne sono i dungeon, l'abisso per ultimo
  if (argv.includes('--mondo')) {
    const ks = numeri('--discese', [0, 1, 2, 3, 4, 5, 6, 7])
    const lavori = []
    for (const come of ['strada', 'giro']) for (const eroe of OPZ.eroi) lavori.push({ ...base, che: 'mondo', opz: { eroi: [eroe], semi: OPZ.semi, discese: ks, modi: [come], bravura: OPZ.prove[0] }, come })
    const r = await inParallelo(lavori)
    const media = (come, k, f) => { const l = lavori.map((x, i) => (x.come === come ? r[i].find(y => y.k === k) : null)).filter(y => y && y[f] != null); return l.length ? l.reduce((n, y) => n + y[f], 0) / l.length : NaN }
    const righe = []
    for (const come of ['strada', 'giro']) {
      righe.push({ titolo: come === 'strada' ? 'per strada: scontri a tragitto' : 'dalle tane: scontri a tragitto', celle: ks.map(k => +media(come, k, 'scontri').toFixed(1)), numeri: true })
      righe.push({ titolo: '   mostri battuti (signori)', celle: ks.map(k => `${media(come, k, 'mostri').toFixed(1)} (${media(come, k, 'signori').toFixed(1)})`), numeri: true })
      righe.push({ titolo: '   domande', celle: ks.map(k => Math.round(media(come, k, 'domande'))), numeri: true })
      righe.push({ titolo: '   svenuti %', celle: ks.map(k => Math.round(media(come, k, 'svenuti') * 100)) })
      righe.push({ titolo: '   vita % a fine scontro', celle: ks.map(k => (Number.isNaN(media(come, k, 'vitaFine')) ? '-' : Math.round(media(come, k, 'vitaFine') * 100))) })
      righe.push({ titolo: '   vita % all\'ingresso (0 se svenuto)', celle: ks.map(k => Math.round(media(come, k, 'vitaArrivo') * 100)) })
      righe.push({ titolo: '   pozioni bevute', celle: ks.map(k => +media(come, k, 'pozioni').toFixed(1)), numeri: true })
      righe.push({ titolo: '   livelli presi', celle: ks.map(k => +media(come, k, 'livelli').toFixed(2)), numeri: true })
      righe.push({ titolo: '   gemme raccolte', celle: ks.map(k => Math.round(media(come, k, 'gemme'))), numeri: true })
      righe.push({ titolo: '   passi', celle: ks.map(k => Math.round(media(come, k, 'passi'))), numeri: true })
    }
    const CHIAVI = ['altare', 'cantine', 'torre', 'gallerie', 'cisterna', 'labirinto', 'fondo', 'abisso']
    return { intestazione: ks.map(k => CHIAVI[k].slice(0, 7)), titolo: `il mondo a percorso: il curioso dalla pietra al dungeon (${OPZ.eroi.length * OPZ.semi} tragitti a cella, ${Math.round(OPZ.prove[0] * 10)}/10)`, righe, larga: 11 }
  }

  // `--domande`: le domande obbligate per discesa e per piano rispondendo sempre giusto, dritto alla scala (minimo) e girando tutto, per
  // eroe e in media (il tetto è 85 a seduta: docs/sotterraneo/piani.md, «Il costo in domande»); `--semi` quanti semi
  if (argv.includes('--domande')) {
    const lavori = []
    for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'domande', opz: { eroe, k, semi: OPZ.semi }, eroe, k })
    const r = await inParallelo(lavori)
    const di = (eroe, k) => r[lavori.findIndex(l => l.eroe === eroe && l.k === k)]
    const righe = []
    for (const come of ['minimo', 'tutto']) {
      const tot = come === 'minimo' ? 'totMinimo' : 'totTutto'
      for (const eroe of OPZ.eroi) righe.push({ titolo: `${come}: ${eroe}`, celle: discese.map(k => Math.round(di(eroe, k)[tot] / OPZ.semi)), numeri: true })
      righe.push({ titolo: `${come}: media`, celle: discese.map(k => Math.round(OPZ.eroi.reduce((n, e) => n + di(e, k)[tot], 0) / (OPZ.eroi.length * OPZ.semi))), numeri: true })
      righe.push({ titolo: `${come}: per piano (media)`, celle: discese.map(k => {
        const n = Math.max(...OPZ.eroi.map(e => di(e, k)[come].length))
        return Array.from({ length: n }, (_, i) => Math.round(OPZ.eroi.reduce((a, e) => a + (di(e, k)[come][i] || 0), 0) / (OPZ.eroi.length * OPZ.semi))).join('·')
      }), numeri: true })
    }
    righe.push({ titolo: 'dritto: discese vinte (%)', celle: discese.map(k => percento(OPZ.eroi.reduce((n, e) => n + di(e, k).vinte, 0), OPZ.eroi.length * OPZ.semi)) })
    return { titolo: `domande obbligate rispondendo sempre giusto (${OPZ.semi} semi, roba di chi ci arriva andando dritto)`, intestazione: nomi, righe, numeri: true, larga: 16 }
  }

  if (argv.includes('--diag')) {
    const lavori = []
    for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'diag', opz: { eroe, k, bravura: OPZ.prove[0], semi: OPZ.semi, come: OPZ.come } })
    const r = await inParallelo(lavori)
    const righe = discese.map((k, i) => {
      const mie = r.filter((_, j) => lavori[j].opz.k === k)
      const s = f => mie.reduce((n, x) => n + (x[f] || 0), 0)
      const part = s('partite')
      return { titolo: nomi[i], celle: [percento(s('vinte'), part), Math.round(s('domande') / part), +(s('svenimenti') / part).toFixed(1), +(s('pozioni') / part).toFixed(1),
                                       percento(s('fini'), s('scontri') || 1), +(s('abilita') / (s('scontri') || 1)).toFixed(2), +(s('turni') / (s('scontri') || 1)).toFixed(1),
                                       +(s('energiaIn') / (s('aperti') || 1)).toFixed(1), percento(s('energiaIn'), s('energiaMaxIn') || 1),
                                       +((s('preparati') || 0) / part).toFixed(1), percento(s('ceLHo') || 0, s('aperti') || 1)] }
    })
    return { titolo: `a ${OPZ.prove[0] * 10}/10 (${OPZ.eroi.length * OPZ.semi} partite a discesa)`,
             intestazione: ['vinte%', 'domande', 'svenim.', 'pozioni', 'vita%fine', 'abil/sc', 'turni/sc', 'en.in', 'en%in', 'prep/disc', 'sc.con%'], righe, numeri: true, perRiga: true }
  }

  if (OPZ.zone) {
    const lavori = []
    OPZ.zone.forEach((L, i) => { for (const eroe of OPZ.eroi) for (const k of discese) lavori.push({ ...base, che: 'zone', opz: { eroe, livello: L, eroeA: OPZ.eroeA ? OPZ.eroeA[i] : L, semi: OPZ.semi, prove: OPZ.prove, quali: [k], come: OPZ.come }, L: i, k }) })
    const r = await inParallelo(lavori)
    // `--verifica`: i bersagli di `misure/sotterraneo` sulle zone (8/10 quasi sempre, 6/10 fra il 40 e il 92% e in media fra il 50 e
    // l'80, 4/10 di rado, una verde vinta vale 0,8–2 livelli; fra il 24 e il 28 meno severi)
    if (argv.includes('--verifica')) {
      const male = []
      const q = (i, j, k) => lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].vinte[j][k] : n), 0) / (OPZ.eroi.length * OPZ.semi)
      const liv = (i, k) => lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].livelli[k] : n), 0) / OPZ.eroi.length
      OPZ.zone.forEach((L, i) => {
        const tra = L === 24 || L === 27
        let sei = 0, presi = 0
        for (const k of discese) {
          const n = nomi[discese.indexOf(k)]
          if (!tra) {
            if (q(i, 0, k) < 0.85) male.push(`${n}@${L} 8/10 ${Math.round(q(i, 0, k) * 100)}%`)
            if (q(i, 1, k) < 0.4 || q(i, 1, k) > 0.92) male.push(`${n}@${L} 6/10 ${Math.round(q(i, 1, k) * 100)}%`)
            if (q(i, 2, k) > 0.4) male.push(`${n}@${L} 4/10 ${Math.round(q(i, 2, k) * 100)}%`)
          }
          sei += q(i, 1, k) / discese.length
          presi += liv(i, k) / discese.length
        }
        if (tra) {
          const otto = discese.reduce((a, k) => a + q(i, 0, k) / discese.length, 0)
          if (otto < 0.9) male.push(`@${L} 8/10 media ${Math.round(otto * 100)}%`)
          if (sei < 0.33) male.push(`@${L} 6/10 media ${Math.round(sei * 100)}%`)
        } else {
          if (sei < 0.5 || sei > 0.8) male.push(`@${L} 6/10 media ${Math.round(sei * 100)}%`)
          if (presi < 0.8 || presi > 2) male.push(`@${L} livelli presi ${presi.toFixed(2)}`)
        }
      })
      return { verdetto: male }
    }
    const righe = []
    OPZ.zone.forEach((L, i) => {
      OPZ.prove.forEach((b, j) => {
        const celle = discese.map(k => {
          const v = lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].vinte[j][k] : n), 0)
          return percento(v, OPZ.eroi.length * OPZ.semi)
        })
        righe.push({ titolo: `zone al ${L}${OPZ.eroeA ? ` (eroe ${OPZ.eroeA[i]})` : ''} a ${Math.round(b * 10)}/10`, celle, media: true })
      })
      const liv = discese.map(k => lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].livelli[k] : n), 0) / OPZ.eroi.length)
      righe.push({ titolo: `   livelli presi (al ${L})`, celle: liv.map(v => +v.toFixed(1)), numeri: true })
      const dom = discese.map(k => lavori.reduce((n, l, x) => (l.L === i && l.k === k ? n + r[x].domande[k] : n), 0) / OPZ.eroi.length)
      righe.push({ titolo: `   domande (a ${Math.round(OPZ.prove[0] * 10)}/10)`, celle: dom.map(Math.round), numeri: true })
    })
    return { intestazione: nomi, righe }
  }

  // chi arriva con delle gemme da parte e compra il meglio che può, anche i pezzi avanti: `--risparmio 100,250`
  // l'abisso (docs/sotterraneo/abisso.md): `--abisso`
  if (argv.includes('--abisso')) {
    const lavori = OPZ.eroi.map(eroe => ({ ...base, che: 'abisso', opz: { eroe, semi: Math.min(8, OPZ.semi), tetto: Number(valore('--tetto', 30)), nudo: argv.includes('--nudo') } }))
    const r = await inParallelo(lavori)
    const media = x => { const v = x.filter(n => n > 0); return v.reduce((a, b) => a + b, 0) / (v.length || 1) }
    const righe = OPZ.eroi.map((e, i) => ({ titolo: `${e}: ferma ai piani ${r[i].fondi.sort((a, b) => a - b).join(' ')}`,
      celle: [r[i].costi.minimo.filter(n => n > 0).length, +media(r[i].costi.minimo).toFixed(1), +media(r[i].costi.tutto).toFixed(1), r[i].costi.minimo.filter(n => n > 0).join('·')] }))
    return { intestazione: ['piani', 'minimo', 'tutto', 'domande per piano'], titolo: `l'abisso${argv.includes('--nudo') ? ' (partendo nudi)' : ' (con la roba e il livello con cui si esce dalla storia)'}`, righe, numeri: true, larga: 14 }
  }

  if (argv.includes('--risparmio')) {
    const gemme = numeri('--risparmio', [100, 250])
    const lavori = []
    for (const g of gemme) for (const eroe of OPZ.eroi) lavori.push({ ...base, che: 'risparmio', opz: { eroe, semi: OPZ.semi, gemme: g, prove: OPZ.prove }, g })
    const r = await inParallelo(lavori)
    const righe = []
    for (const g of gemme) OPZ.prove.forEach((b, j) => righe.push({
      titolo: `con ${g} gemme da parte a ${Math.round(b * 10)}/10`,
      celle: discese.map(k => percento(lavori.reduce((n, l, x) => (l.g === g ? n + r[x].vinte[j][k] : n), 0), OPZ.eroi.length * OPZ.semi)), media: true }))
    return { intestazione: nomi, righe }
  }

  if (argv.includes('--vere')) {
    const lavori = OPZ.eroi.map(eroe => ({ ...base, che: 'vere', opz: { semi: OPZ.semi, eroe, fila: OPZ.fila, prove: OPZ.prove } }))
    const r = await inParallelo(lavori)
    const righe = OPZ.prove.map((b, j) => ({
      titolo: `la storia giocata (${OPZ.fila}) a ${Math.round(b * 10)}/10`,
      celle: discese.map(k => percento(r.reduce((n, x) => n + x.vinte[j][k], 0), r.length * OPZ.semi)), media: true,
    }))
    righe.push({ titolo: '   livello con cui si entra', numeri: true, celle: discese.map(k => +(r.reduce((n, x) => n + x.zaini[k].livello, 0) / r.length).toFixed(1)) })
    return { intestazione: nomi, righe }
  }

  // la storia: roba e livello attesi, a scarti diversi
  const lavori = []
  for (const eroe of OPZ.eroi) for (const k of discese)
    lavori.push({ ...base, che: 'storia', opz: { eroe, semi: OPZ.semi, prove: OPZ.prove, scarti: OPZ.scarti, livelli: OPZ.livelli, come: OPZ.come, quali: [k], torce: OPZ.torce }, k })
  const r = await inParallelo(lavori)
  const chiavi = [...OPZ.scarti, ...OPZ.livelli.map(l => `L${l > 0 ? '+' : ''}${l}`)]
  const righe = []
  for (const ch of chiavi) OPZ.prove.forEach((b, j) => {
    const nome = ch === 0 ? 'roba attesa' : typeof ch === 'number' ? `roba di ${ch > 0 ? '+' : ''}${ch} discese` : `livello ${ch.slice(1)}`
    const celle = discese.map(k => percento(lavori.reduce((n, l, x) => (l.k === k ? n + r[x].vinte[ch][j][k] : n), 0), OPZ.eroi.length * OPZ.semi))
    const perEroe = discese.map(k => OPZ.eroi.map(e => lavori.reduce((n, l, x) => (l.k === k && l.opz.eroe === e ? n + r[x].vinte[ch][j][k] : n), 0)).join('·'))
    righe.push({ titolo: `${nome} a ${Math.round(b * 10)}/10`, celle, media: true, perEroe })
  })
  // quanti scontri cominciano alle spalle (l'agguato), sulla roba attesa a 8/10, in percentuale degli scontri
  if (OPZ.scarti.includes(0)) righe.push({ titolo: 'agguati (roba attesa, 8/10)', celle: discese.map(k => {
    const ag = lavori.reduce((n, l, x) => (l.k === k ? n + (r[x].agguati[k] || 0) : n), 0), sc = lavori.reduce((n, l, x) => (l.k === k ? n + (r[x].scontri[k] || 0) : n), 0)
    return sc ? Math.round(ag / sc * 100) : 0
  }), media: true })
  // `--verifica`: invece della tabella, quali bersagli di `misure/sotterraneo` (la tabella della storia) la discesa non rispetta.
  // Solo quelli sui numeri di ogni discesa (a ogni eroe e in media); chiede da sé gli scarti 0, −1, 2 e i livelli −2 e +3
  if (argv.includes('--verifica')) {
    const n = OPZ.eroi.length * OPZ.semi
    const v = (ch, j, k, e = null) => lavori.reduce((t, l, x) => (l.k === k && (!e || l.opz.eroe === e) ? t + r[x].vinte[ch][j][k] : t), 0) / (e ? OPZ.semi : n)
    const male = []
    for (const k of discese) {
      const dove = `${nomi[discese.indexOf(k)]}`
      for (const e of OPZ.eroi) {
        if (v(0, 0, k, e) < (e === 'mago' ? 0.7 : 0.8)) male.push(`${dove} ${e.slice(0, 3)} 8/10 attesa ${Math.round(v(0, 0, k, e) * OPZ.semi)}`)
        const q = v(0, 2, k, e)
        if (k ? q > (k === 1 ? 0.7 : 0.6) : q < 0.6) male.push(`${dove} ${e.slice(0, 3)} 4/10 attesa ${Math.round(q * OPZ.semi)}`)
      }
      if (!k) continue
      const quattro = v(0, 2, k)
      if (quattro > (k === 1 ? 0.45 : 0.3)) male.push(`${dove} 4/10 media ${Math.round(quattro * 100)}%`)
      const sei = v(0, 1, k)
      if (sei < 0.3 || sei > (k === 1 ? 1 : 0.8)) male.push(`${dove} 6/10 media ${Math.round(sei * 100)}%`)
      // il primo avvio: la scalinata a mani nude (la roba di una discesa prima) a 8/10, in media e a testa
      if (k === 1) {
        if (v(-1, 0, 1) < 0.1) male.push(`${dove} nuda 8/10 ${Math.round(v(-1, 0, 1) * 100)}%`)
      }
      if (k >= 3 && v(-1, 0, k) < 0.5) male.push(`${dove} una prima 8/10 ${Math.round(v(-1, 0, k) * 100)}%`)
      if (v(-1, 1, k) > sei + 0.15) male.push(`${dove} una prima 6/10 sopra l'attesa`)
      if (k >= 2 && v(2, 2, k) > 0.7) male.push(`${dove} due avanti 4/10 ${Math.round(v(2, 2, k) * 100)}%`)
      if (v('L-2', 0, k) < 0.5) male.push(`${dove} livello −2 8/10 ${Math.round(v('L-2', 0, k) * 100)}%`)
      if (v('L-2', 1, k) > sei) male.push(`${dove} livello −2 6/10 sopra l'attesa`)
      if (v('L+3', 2, k) > (k === 1 ? 0.98 : 0.9)) male.push(`${dove} livello +3 4/10 ${Math.round(v('L+3', 2, k) * 100)}%`)
    }
    return { verdetto: male }
  }
  return { intestazione: nomi, righe }
}

/* ═══════════ la stampa ═══════════ */
function stampa(t, prima = null) {
  if (t.sub) { t.sub.forEach((x, i) => { if (i) console.log(''); stampa(x, prima && prima.sub ? prima.sub[i] : null) }); return }
  if (t.verdetto) { console.log(t.verdetto.length ? `KO (${t.verdetto.length}): ${t.verdetto.join(' · ')}` : 'OK'); return }
  const media = c => Math.round(c.reduce((a, b) => a + b, 0) / c.length)
  const cella = (x, y) => (y == null ? String(x) : `${y}→${x}`)
  console.log(t.titolo ? `${t.titolo}` : '')
  const larga = t.larga || 8 + (prima ? 4 : 0)
  console.log(' '.repeat(34) + t.intestazione.map(s => String(s).padStart(larga)).join('') + (t.righe.some(r => r.media) ? '   media' : ''))
  t.righe.forEach((r, i) => {
    const p = prima && prima.righe[i] ? prima.righe[i] : null
    const unita = r.numeri || t.numeri ? '' : '%'
    const celle = r.celle.map((c, j) => (cella(c, p ? p.celle[j] : null) + unita).padStart(larga))
    const coda = r.media ? '   ' + cella(media(r.celle), p ? media(p.celle) : null) + '%' : ''
    console.log(r.titolo.padEnd(34) + celle.join('') + coda)
    if (r.perEroe && argv.includes('--per-eroe')) console.log(' '.repeat(34) + r.perEroe.map(s => s.padStart(larga)).join(''))
  })
}

const contro = valore('--contro')
let tmp = null
try {
  let prima = null
  if (contro) {
    const hash = execFileSync('git', ['rev-parse', '--short', contro], { cwd: RADICE, encoding: 'utf8' }).trim()
    tmp = join(RADICE, 'tmp', `banco-${hash}`)
    if (existsSync(tmp)) execFileSync('git', ['worktree', 'remove', '--force', tmp], { cwd: RADICE })
    execFileSync('git', ['worktree', 'add', '--detach', tmp, contro], { cwd: RADICE, stdio: 'ignore' })
    // `--banco-di-adesso`: il giocatore finto di adesso (che usa le abilità) sui mostri e sui numeri di quel commit: quanto è più
    // facile un gioco già tarato per un banco che non le usava, a chi le usa
    if (argv.includes('--banco-di-adesso'))
      for (const f of ['motore/banco.js', 'motore/abilita.js', 'motore/forza.js']) copyFileSync(join(RADICE, SRC, f), join(tmp, SRC, f))
    console.log(`prima = ${hash}${argv.includes('--banco-di-adesso') ? ' (col banco di adesso)' : ''}, dopo = la copia di lavoro`)
    prima = await misura(tmp)
  }
  // `--tara 1.forza=0.6|0.8,1.spinta=3|5`: con più valori separati da | si prova ogni combinazione, una tabella l'una
  const voci = OPZ.tara.split(',').filter(Boolean).map(v => { const [chiave, valori] = v.split('='); return valori.split('|').map(x => `${chiave}=${x}`) })
  const combina = (i, scelte) => (i === voci.length ? [scelte] : voci[i].flatMap(v => combina(i + 1, [...scelte, v])))
  for (const scelte of combina(0, [])) {
    OPZ.taraOra = scelte.join(',')
    if (scelte.length) console.log(`\n== ${OPZ.taraOra}`)
    stampa(await misura(RADICE), prima)
  }
} finally {
  if (tmp) {
    try { execFileSync('git', ['worktree', 'remove', '--force', tmp], { cwd: RADICE, stdio: 'ignore' }) } catch { rmSync(tmp, { recursive: true, force: true }) }
  }
}
