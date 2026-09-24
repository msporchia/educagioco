/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA TIPO, SENZA BROWSER

   `#fattoria-tipo=30` mette al posto della fattoria di un bambino una
   fattoria **già giocata** di quel livello (`motore/tipo.js`). Serve a
   provare col telefono quello che arriverebbe dopo settimane, e quindi
   deve essere una fattoria che il gioco avrebbe potuto produrre da sé:
   se ci fosse dentro una cosa impossibile, si proverebbe il falso.

   Le cose da non rompere, livello per livello:
     · il livello è **quello chiesto**, e non quello che costruire ha
       fatto salire; non c'è niente da reclamare;
     · c'è tutto quello che lavora e il livello ha aperto, e **niente di
       quello che non ha aperto** — in mappa come nella dispensa;
     · niente si sovrappone, niente sta nel bosco o fuori dalla terra;
     · attorno a ogni cosa si cammina, e tutti i passaggi si toccano;
     · è **già in moto**: campi pronti e a metà, macchine con qualcosa
       da ritirare e qualcosa al lavoro, clienti al banco e in bottega;
     · si rilegge com'era, e la stessa ora dà la stessa fattoria.

   `node test/esegui.mjs fattoria-tipo --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { fattoriaTipo, LIVELLI_TIPO, LIVELLO_MAX } from '../../src/giochi/fattoria/motore/tipo.js'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { CATALOGO, PER_ID, piedeDi, eCampo, eMercato, eMongolfiera, macchinaDi }
  from '../../src/giochi/fattoria/dati/catalogo.js'
import { livelloDellaVoce, zonaDi } from '../../src/giochi/fattoria/dati/livelli.js'
import { PER_RICETTA, SILI, siloDelProdotto } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { chiave } from '../../src/giochi/fattoria/dati/mondo.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const T0 = 1770000000000            // un'ora qualunque, fissa: niente Date.now()
const LAVORO = CATALOGO.filter(v => zonaDi(v.id) === 'lavoro')
const VICINI = [[1, 0], [-1, 0], [0, 1], [0, -1]]

for (const liv of [1, ...LIVELLI_TIPO, LIVELLO_MAX]) {
  const t = Date.now()
  const f = fattoriaTipo(liv, { ora: T0 })
  const ms = Date.now() - t
  const di = `al livello ${liv}`

  /* ── il livello, e i premi ── */
  uguale(`${di} la fattoria è a quel livello`, f.livello, liv)
  uguale(`${di} non c'è niente da reclamare`, f.daReclamare().length, 0)

  /* ── niente di quello che il livello non ha aperto ── */
  const fuori = f.cose.filter(c => !f.sbloccata(c.id) || livelloDellaVoce(PER_ID[c.id]) > liv)
  uguale(`${di} ogni cosa in mappa è aperta`, fuori.map(c => c.id).join(' '), '')
  const mancano = LAVORO.filter(v => f.sbloccata(v.id) && livelloDellaVoce(v) <= liv &&
                                     !f.quantiInMappa(v.id))
  uguale(`${di} c'è tutto quello che lavora`, mancano.map(v => v.id).join(' '), '')

  /* ── niente sopra niente, niente nel bosco ── */
  const dove = new Map()
  const guai = []
  for (const c of f.cose) {
    const [w, h] = piedeDi(c)
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
      const k = chiave(c.x + i, c.y + j)
      if (dove.has(k)) guai.push(`${c.id} sopra ${dove.get(k).id} in ${k}`)
      if (!f.cellaMia(c.x + i, c.y + j)) guai.push(`${c.id} fuori dalla terra in ${k}`)
      if (f.ostacoloSotto(c.x + i, c.y + j)) guai.push(`${c.id} nel bosco in ${k}`)
      dove.set(k, c)
    }
  }
  uguale(`${di} niente si sovrappone, niente sta nel bosco`, guai.slice(0, 3).join(' · '), '')

  /* ── si cammina ──
     Ogni cosa ha almeno una cella calpestabile accanto, e sono tutte
     nella stessa zona: da una cosa si arriva a tutte le altre. */
  const accanto = c => {
    const [w, h] = piedeDi(c)
    const celle = []
    for (let i = -1; i <= w; i++) for (let j = -1; j <= h; j++) {
      const bordo = i === -1 || j === -1 || i === w || j === h
      const angolo = (i === -1 || i === w) && (j === -1 || j === h)
      if (bordo && !angolo && f.calpestabile(c.x + i, c.y + j)) celle.push([c.x + i, c.y + j])
    }
    return celle
  }
  const chiuse = f.cose.filter(c => !PER_ID[c.id].sotto && !accanto(c).length)
  uguale(`${di} attorno a ogni cosa si cammina`, chiuse.map(c => c.id).join(' '), '')
  const partenza = f.cose.map(accanto).find(l => l.length)
  const visti = new Set()
  const coda = partenza ? [partenza[0]] : []
  if (partenza) visti.add(chiave(...partenza[0]))
  while (coda.length) {
    const [x, y] = coda.pop()
    for (const [dx, dy] of VICINI) {
      const k = chiave(x + dx, y + dy)
      if (!visti.has(k) && f.calpestabile(x + dx, y + dy)) { visti.add(k); coda.push([x + dx, y + dy]) }
    }
  }
  const isolate = f.cose.filter(c => {
    const l = accanto(c)
    return l.length && !l.some(([x, y]) => visti.has(chiave(x, y)))
  })
  uguale(`${di} da una cosa si arriva a tutte le altre`, isolate.map(c => c.id).join(' '), '')

  /* ── la dispensa: niente dal futuro, niente oltre il tetto ── */
  const merci = Object.entries(f.granaio)
  const troppe = merci.filter(([p, n]) => n > f.capienzaDi(siloDelProdotto(p)))
  uguale(`${di} ogni scomparto sta sotto il suo tetto`, troppe.map(([p]) => p).join(' '), '')
  const future = merci.filter(([p]) => !f.merciAperte(siloDelProdotto(p)).includes(p))
  uguale(`${di} in dispensa c'è solo roba che il livello sa fare`,
         future.map(([p]) => p).join(' '), '')
  for (const fam of Object.keys(SILI))
    if (f.eCostruito(fam))
      controlla(`${di} il silo «${fam}» non è vuoto`, f.quantoHoNelSilo(fam) > 0)

  /* ── già in moto ── */
  const campi = f.cose.filter(c => eCampo(c))
  const stati = campi.map(c => f.statoCampo(c, T0))
  controlla(`${di} ogni campo è seminato`, stati.every(s => !s.vuoto))
  if (campi.length >= 2) {
    controlla(`${di} c'è un campo pronto`, stati.some(s => s.pronto))
    controlla(`${di} e uno che cresce`, stati.some(s => !s.pronto))
  }
  const macchine = f.cose.filter(c => macchinaDi(c)).map(c => f.statoMacchina(c, T0))
  if (macchine.length) {
    controlla(`${di} c'è una macchina con qualcosa da ritirare`, macchine.some(s => s.pronto))
    controlla(`${di} e una al lavoro`, macchine.some(s => s.lavora))
  }
  const ricetteFuture = f.cose.flatMap(c => c.coda || [])
    .filter(p => (PER_RICETTA[p.ricetta].liv || 1) > liv)
  uguale(`${di} nessuna macchina fa roba del futuro`, ricetteFuture.length, 0)
  if (f.cose.some(c => eMercato(c)))
    uguale(`${di} al banco ci sono tre ordini`, f.ordini.filter(o => o && o.chiede).length, 3)
  for (const id of Object.keys(f.botteghe || {}))
    controlla(`${di} in «${id}» c'è un cliente`,
              f.botteghe[id].banconi.some(b => b && b.chiede))
  if (f.cose.some(c => eMongolfiera(c)))
    controlla(`${di} la mongolfiera è a terra`, !!(f.mongolfiera && f.mongolfiera.file))

  /* ── si rilegge com'era, e la stessa ora dà la stessa fattoria ── */
  const salvata = JSON.parse(JSON.stringify(f.serializza()))
  const riletta = new Fattoria({ dato: salvata })
  uguale(`${di} riletta ha lo stesso livello`, riletta.livello, liv)
  uguale(`${di} e le stesse cose`, riletta.cose.length, f.cose.length)
  uguale(`${di} e la stessa dispensa`, JSON.stringify(riletta.granaio), JSON.stringify(f.granaio))
  uguale(`${di} rifatta alla stessa ora è identica`,
         JSON.stringify(fattoriaTipo(liv, { ora: T0 }).serializza()), JSON.stringify(salvata))

  const cose = {}
  for (const c of f.cose) {
    const v = PER_ID[c.id]
    const k = eCampo(c) ? 'campi' : v.silo ? 'silos' : v.macchina ? 'macchine'
      : zonaDi(c.id) === 'lavoro' ? 'paese' : 'decorazioni'
    cose[k] = (cose[k] || 0) + 1
  }
  nota(`livello ${liv}: ${Object.keys(f.piazzole).length} piazzole, ` +
       Object.entries(cose).map(([k, n]) => `${n} ${k}`).join(', ') +
       `, ${f.bestie.length} bestie, ${merci.length} merci in dispensa — ${ms} ms`)
}

/* ── il livello chiesto si tiene dentro la scala ── */
uguale('sotto l\'uno si parte dall\'uno', fattoriaTipo(0, { ora: T0 }).livello, 1)
uguale('un numero storto vale uno', fattoriaTipo('boh', { ora: T0 }).livello, 1)
uguale(`sopra il ${LIVELLO_MAX} ci si ferma lì`, fattoriaTipo(500, { ora: T0 }).livello, LIVELLO_MAX)

riassunto('la fattoria tipo')
