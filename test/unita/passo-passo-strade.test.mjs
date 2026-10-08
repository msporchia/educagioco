/* Le due strade di Passo passo, senza browser: la strada maestra del
   coniglio e i rami del cane si ricavano dai dati; una tappa del coniglio
   non chiede mai il cane; chi aveva una tappa aperta col cursore di prima
   la ritrova aperta (a inizio, a metà buche, a metà cane, dopo il cane, a
   metà ripeti con e senza «Le stalle», in fondo); chi salta il cane arriva
   in fondo lo stesso; il ▶ resta sulla strada che si sta facendo; la riga
   della home e le medaglie restano sensate.
   Vedi «Le due strade» in docs/passo-passo/livelli.md.
   `node test/esegui.mjs passo-passo-strade --niente-build` */
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, FINE_STRADA, TAPPE_PRIME, TAPPE_PICCOLE, riordina, FILE,
         postoNelCursore }
  from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE, delCane, aperture, prossima, seguente, tappaDiAdesso, cosaManca, stradeDi, ereditaDi }
  from '../../src/giochi/passo-passo/motore/strade.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { LEGENDA } from '../../src/giochi/passo-passo/dati/mondo.js'
import manifesto, { CHIAVE } from '../../src/giochi/passo-passo/gioco.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const S = STRADE
const indice = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)
const nome = i => CAMPAGNA[i].chiave

/* ══════════ la forma, dai dati ══════════ */
{
  controlla('il cane si riconosce dalle pecore nella mappa, come lo vede il motore',
            CAMPAGNA.every((t, i) => delCane(t) === !!Livello.da(t).cane))
  uguale('il cane pastore è tutto del cane', S.isole.find(s => s.chiave === 'pecore-cane').tappe.length,
         CAMPAGNA.filter(t => t.scalino === 'pecore').length)
  controlla('e nessuna tappa del coniglio sta nello scalino del cane',
            S.coniglio.every(i => CAMPAGNA[i].scalino !== 'pecore'))
  const rami = S.isole.filter(s => s.animale === 'cane')
  controlla('ogni ramo del cane parte da una tappa del coniglio che viene prima di lui',
            rami.every(r => S.animale[r.attacco] === 'coniglio' && r.attacco < r.tappe[0]),
            rami.map(r => `${r.chiave}@${r.attacco}`).join(' '))
  uguale('il pascolo si apre alla fine dei massi', nome(rami[0].attacco), 'tutto')
  controlla('gli altri rami alla prima tappa dello scalino che insegna la loro carta',
            rami.slice(1).every(r => r.carta && r.attacco === S.coniglio.find(i => CAMPAGNA[i].scalino === r.scalino)),
            rami.slice(1).map(r => `${r.scalino}:${nome(r.attacco)}`).join(' '))
  uguale('le tane del cane nelle carte sono quattro, e ogni isoletta comincia dalla tappa che c\'era',
         rami.slice(1).map(r => nome(r.tappe[0])).join(' '), 'stalle stalle-gradini nicchie lago-stalle')
  controlla('ogni isoletta del cane ha almeno tre tappe', rami.every(r => r.tappe.length >= 3),
            rami.map(r => `${r.chiave}:${r.tappe.length}`).join(' '))
  /* le tappe in coda: dopo l'ultima del coniglio, solo cane, ognuna nella
     sua isola dopo quelle che c'erano */
  controlla('dopo l\'ultima tappa del coniglio vengono solo tappe del cane',
            S.coniglio.at(-1) === FINE_STRADA - 1 && CAMPAGNA.slice(FINE_STRADA).every(delCane))
  uguale('le tappe in coda stanno nell\'isola del loro scalino, in fila dopo quella di prima',
         rami.slice(1).map(r => r.tappe.map(nome).join('+')).join(' '),
         'stalle+cortile+pettine stalle-gradini+pettine-storto+vicoli nicchie+sentiero-gregge+nicchie-fonde ' +
         'lago-stalle+gallerie+steccati')
  controlla('e la strada del cane va di isola in isola, non per indice',
            S.cane.every((i, k) => k === 0 || S.isolaDi[i] >= S.isolaDi[S.cane[k - 1]]))
  controlla('ogni isola del coniglio ha al più un ramo',
            S.isole.filter(s => s.animale === 'coniglio').every(s => rami.filter(r => s.tappe.includes(r.attacco)).length <= 1))
  controlla('la fine della strada del coniglio è la fine della campagna (dopo, il cane in coda)',
            S.animale[FINE_STRADA - 1] === 'coniglio' && FINE_STRADA <= QUANTE_TAPPE)
  controlla('ogni tappa sta in un\'isola sola', CAMPAGNA.every((_, i) =>
    S.isole.filter(s => s.tappe.includes(i)).length === 1))
}

/* ══════════ il coniglio non chiede mai il cane ══════════ */
{
  // con tutto il coniglio fatto fino a lì e niente cane, ogni tappa del coniglio è aperta
  for (const i of S.coniglio) {
    const fatta = j => S.animale[j] === 'coniglio' && j < i
    const { aperta } = aperture(S, { fatta })
    if (!aperta(i)) controlla(`«${nome(i)}» si apre senza il cane`, false)
  }
  controlla('nessuna tappa del coniglio chiede una tappa del cane', S.coniglio.every(i =>
    aperture(S, { fatta: j => S.animale[j] === 'coniglio' && j < i }).aperta(i)))
  /* nemmeno nei saperi: le carte che il cane usa nelle sue tappe le ha
     già portate il coniglio, e il cane non porta carte nuove */
  const carteViste = new Set()
  let nuoveDelCane = []
  CAMPAGNA.forEach((t, i) => {
    for (const c of t.carte || []) {
      if (!carteViste.has(c) && S.animale[i] === 'cane') nuoveDelCane.push(`${t.chiave}:${c}`)
      carteViste.add(c)
    }
  })
  uguale('il cane non insegna una carta che il coniglio non ha già', nuoveDelCane.join(' '), '')
  // le cose del mondo: il cane rifà quelle che il coniglio ha già incontrato prima di lui, più le pecore
  const cose = t => {
    const d = t.mappa.join('').split('').map(ch => LEGENDA[ch] || {})
    return [t.salti && 'salto', d.some(x => x.terreno === 'ghiaccio') && 'ghiaccio', d.some(x => x.masso) && 'massi',
            d.some(x => x.coppia) && 'buche', d.some(x => x.lastra) && 'lastre'].filter(Boolean)
  }
  const nuove = S.cane.flatMap(i => cose(CAMPAGNA[i]).filter(c =>
    !S.coniglio.some(j => j < i && cose(CAMPAGNA[j]).includes(c))).map(c => `${nome(i)}:${c}`))
  uguale('le cose del mondo che il cane usa le ha già incontrate il coniglio', nuove.join(' '), '')
}

/* ══════════ chi aveva una tappa aperta la ritrova aperta ══════════
   Il cursore di prima (`tappa`) apriva tutto fino a lui: il profilo se lo
   tiene come `cfg.eredita`, e da lì in poi si apre per strade. */
const stelleFino = (n, salta = []) => Object.fromEntries([...Array(n)].map((_, i) => [i, 3]).filter(([i]) => !salta.includes(i)))
const vecchiaRegola = av => i => i <= (av.tappa || 0)
const casi = {
  'a inizio': { tappa: 0, stelle: {} },
  'a metà buche': { tappa: indice('colori'), stelle: stelleFino(indice('colori')) },
  'a metà cane': { tappa: indice('guado'), stelle: stelleFino(indice('guado')) },
  'dopo il cane': { tappa: TAPPE_PICCOLE, stelle: stelleFino(TAPPE_PICCOLE) },
  'a metà ripeti con «Le stalle»': { tappa: indice('sassi-fiume'), stelle: stelleFino(indice('sassi-fiume')) },
  // il travaso da una fila vecchia apre «Le stalle» alle spalle senza stelle (un regalo)
  'a metà ripeti senza «Le stalle»': { tappa: indice('sassi-fiume'), stelle: stelleFino(indice('sassi-fiume'), [indice('stalle')]) },
  'in fondo': { tappa: QUANTE_TAPPE, libera: true, stelle: stelleFino(QUANTE_TAPPE) },
}
for (const [chi, av] of Object.entries(casi)) {
  const prima = vecchiaRegola(av)
  const ora = stradeDi({ ...av, cfg: { eredita: av.tappa } })
  const perse = CAMPAGNA.map((_, i) => i).filter(i => prima(i) && !ora.aperta(i))
  uguale(`${chi}: nessuna tappa aperta ieri è chiusa oggi`, perse.map(nome).join(' '), '')
  // e senza `eredita` scritto (la home, prima di aprire il gioco) vale lo stesso
  const home = stradeDi(av)
  controlla(`${chi}: anche letto dalla home, prima che il gioco scriva il cursore`,
            CAMPAGNA.every((_, i) => !prima(i) || home.aperta(i)))
  controlla(`${chi}: la tappa di adesso è aperta e non fatta`, (() => {
    const a = ora.adesso()
    return a === null ? av.tappa >= QUANTE_TAPPE : ora.aperta(a) && !ora.fatta(a)
  })())
}
{
  const dopoBuche = stradeDi({ tappa: TAPPE_PRIME, stelle: stelleFino(TAPPE_PRIME), cfg: { eredita: TAPPE_PRIME } })
  controlla('finiti i massi si aprono tutte e due le strade: il viale e il primo gregge',
            dopoBuche.aperta(TAPPE_PICCOLE) && dopoBuche.aperta(TAPPE_PRIME))
  controlla('ma non il secondo gregge, né le stalle', !dopoBuche.aperta(TAPPE_PRIME + 1) && !dopoBuche.aperta(indice('stalle')))
  const conViale = stradeDi({ tappa: TAPPE_PICCOLE + 1, stelle: { ...stelleFino(TAPPE_PRIME), [TAPPE_PICCOLE]: 2 },
                              cfg: { eredita: TAPPE_PRIME } })
  controlla('fatto il viale senza il cane, le stalle restano chiuse (il cane non ha finito il pascolo)',
            !conViale.aperta(indice('stalle')))
  const tuttoCane = stradeDi({ tappa: TAPPE_PICCOLE, stelle: stelleFino(TAPPE_PICCOLE), cfg: { eredita: 0 } })
  controlla('finito il pascolo, le stalle aspettano il viale', !tuttoCane.aperta(indice('stalle')))
  const eViale = stradeDi({ tappa: TAPPE_PICCOLE + 1, stelle: stelleFino(TAPPE_PICCOLE + 1), cfg: { eredita: 0 } })
  controlla('e col viale si aprono', eViale.aperta(indice('stalle')))
}

/* ══════════ chi salta il cane arriva in fondo lo stesso ══════════
   Si gioca la strada del coniglio come la gioca il gioco: si vince la
   tappa aperta, `completa` muove il cursore al massimo, il riassunto e le
   medaglie leggono il profilo. */
{
  const av = { tappa: 0, stelle: {}, cfg: { eredita: 0 } }
  // come il gioco: il cursore lo muove `postoNelCursore`, e finita vuol dire finita la strada del coniglio
  const completa = i => {
    av.tappa = Math.max(av.tappa, postoNelCursore(i) + 1); if (av.tappa >= FINE_STRADA) av.libera = true; av.stelle[i] = 3
  }
  const chiuse = []
  for (const i of S.coniglio) {
    if (!stradeDi(av).aperta(i)) chiuse.push(nome(i))
    completa(i)
  }
  uguale('tutta la strada del coniglio si apre una tappa alla volta, senza il cane', chiuse.join(' '), '')
  const fine = stradeDi(av)
  uguale('il cane intanto ha aperto solo il primo gregge',
         S.cane.filter(i => fine.aperta(i)).map(nome).join(' '), 'primo-gregge')
  controlla('in home: tutte le tane, finita la strada del coniglio', manifesto.riassunto(av).startsWith('tutte le tane'))
  uguale('e la tappa di adesso è il primo gregge, l\'unica rimasta', fine.adesso(), TAPPE_PRIME)
  // poi il cane: le sue tappe si aprono in fila, e quelle nelle carte ci sono già
  const chiuseCane = []
  for (const i of S.cane) { if (!stradeDi(av).aperta(i)) chiuseCane.push(nome(i)); completa(i) }
  uguale('dopo, il cane si apre una tappa alla volta fino agli steccati', chiuseCane.join(' '), '')
  uguale('e le tappe del cane in coda non muovono il cursore', av.tappa, FINE_STRADA)

  const m = misure({ totals: { ppTane: 50, ppProve: 60 }, best: {}, items: {},
                     campagne: { passo: { tappa: QUANTE_TAPPE, libera: true,
                                          stelle: Object.fromEntries(S.coniglio.map(i => [i, 3])) } } })
  const traguardi = manifesto.albo.traguardi
  for (const id of ['pp-tappe', 'pp-campagna'])
    controlla(`saltando il cane «${id}» è d'oro lo stesso`, statoTraguardo(traguardi.find(t => t.id === id), m).finito)
  controlla('e le stelle del cane mancano: il cane conta per le stelle',
            m.stelleDi(CHIAVE) === S.coniglio.length * 3)
}

/* ══════════ il cursore di prima resta, ma non apre più del dovuto ══════════ */
{
  // un profilo di ieri a metà ripeti: il gioco scrive `eredita` una volta e poi va avanti
  const av = { tappa: indice('sassi-fiume'), stelle: stelleFino(indice('sassi-fiume')), cfg: {} }
  av.cfg.eredita = ereditaDi(av)
  for (const chiave of ['sassi-fiume', 'lago-gradini', 'collina', 'terrazze', 'campo-arato', 'gradini-storti',
                        'cortile', 'pettine']) {
    const i = indice(chiave)
    av.tappa = Math.max(av.tappa, i + 1)
    av.stelle[i] = 2
  }
  const ora = stradeDi(av)
  controlla('vinti i gradini storti si apre il ramo del «fino a»: le stalle erano fatte, e il pettine vinto',
            ora.aperta(indice('stalle-gradini')))
  controlla('e il cursore che corre avanti non apre il cane per conto suo',
            !stradeDi({ tappa: indice('spirale') + 1, stelle: { ...stelleFino(TAPPE_PRIME), ...Object.fromEntries(
              S.coniglio.filter(i => i >= TAPPE_PICCOLE && i <= indice('spirale')).map(i => [i, 3])) }, cfg: { eredita: TAPPE_PRIME } })
              .aperta(indice('stalle-gradini')))
  // un travaso di fila sposta `eredita` come la tappa
  const vecchia = FILE[3]
  uguale('se la fila cambia, il cursore di prima si travasa come la tappa',
         riordina({ tappa: 30 }, vecchia, CAMPAGNA.map(t => t.chiave)).tappa, riordina({ tappa: 30, stelle: {} }, vecchia).tappa)
}

/* ══════════ una tappa fatta resta aperta ══════════
   Chi aveva vinto le stalle a gradini prima che nel ripeti arrivassero il
   cortile e il pettine non se la ritrova chiusa: sono davanti a lei sulla
   strada del cane, ma lei è fatta. */
{
  const vinte = [...Array(indice('spirale') + 1).keys()].filter(i => S.animale[i] === 'coniglio' || i < TAPPE_PICCOLE)
  const av = { tappa: indice('spirale') + 1, cfg: { eredita: TAPPE_PRIME },
               stelle: { ...Object.fromEntries(vinte.map(i => [i, 3])), [indice('stalle')]: 3, [indice('stalle-gradini')]: 2 } }
  const r = stradeDi(av)
  controlla('le stalle a gradini vinte restano aperte', r.aperta(indice('stalle-gradini')))
  controlla('e anche le tappe dopo di lei', r.aperta(indice('pettine-storto')))
  controlla('il cortile si apre dopo le stalle', r.aperta(indice('cortile')) && !r.aperta(indice('pettine')))
  uguale('il fumetto del pettine dice che prima tocca al cortile', cosaManca(S, indice('pettine'), { fatta: r.fatta, aperta: r.aperta }),
         'Prima tocca a «Il cortile».')
}

/* ══════════ chi aveva finito tutto ieri ══════════ */
{
  const r = riordina({ tappa: FILE[3].length, stelle: { 0: 3 } }, FILE[3])
  controlla('chi aveva finito la fila di prima ha finito anche oggi, le tappe in coda gli restano da fare',
            r.libera && r.tappa === FINE_STRADA, JSON.stringify({ tappa: r.tappa, libera: r.libera }))
  controlla('e la riga della home dice «tutte le tane»', manifesto.riassunto({ tappa: FINE_STRADA, stelle: {} }).startsWith('tutte le tane'))
  const pocoPrima = stradeDi({ tappa: FINE_STRADA, stelle: Object.fromEntries(
    [...Array(FINE_STRADA).keys()].map(i => [i, 3])), cfg: { eredita: FINE_STRADA } })
  uguale('e la tappa di adesso è la prima tappa nuova del cane', nome(pocoPrima.adesso()), 'cortile')
}

/* ══════════ il ▶ resta sulla strada che si sta facendo ══════════ */
{
  const tutte = () => true
  uguale('dopo «Tutto insieme» il viale', prossima(S, indice('tutto'), tutte), TAPPE_PICCOLE)
  uguale('ma col viale chiuso (sei anni) il primo gregge',
         prossima(S, indice('tutto'), i => i < TAPPE_PICCOLE), TAPPE_PRIME)
  uguale('in mezzo al pascolo, il gregge dopo', prossima(S, TAPPE_PRIME + 2, tutte), TAPPE_PRIME + 3)
  uguale('finito il pascolo si torna sulla strada maestra: il viale', prossima(S, indice('gregge'), tutte), TAPPE_PICCOLE)
  uguale('finite le stalle, il cortile: si resta nell\'isoletta', nome(prossima(S, indice('stalle'), tutte)), 'cortile')
  uguale('finita l\'isoletta, la tappa dopo il viale', nome(prossima(S, indice('pettine'), tutte)), 'stagno-grande')
  uguale('finito il lago delle stalle, le gallerie', nome(prossima(S, indice('lago-stalle'), tutte)), 'gallerie')
  uguale('finiti gli steccati, le pozze', nome(prossima(S, indice('steccati'), tutte)), 'pozze')
  uguale('dopo il viale il coniglio va avanti, non nelle stalle', nome(prossima(S, TAPPE_PICCOLE, tutte)), 'stagno-grande')
  uguale('in fondo alla strada maestra non c\'è un dopo', seguente(S, FINE_STRADA - 1), null)
  uguale('dal gregge, col viale chiuso, non c\'è un dopo (si va al sentiero)',
         prossima(S, indice('gregge'), i => i < TAPPE_PICCOLE), null)
  uguale('e la seguente è proprio lo zaino', seguente(S, indice('gregge')), TAPPE_PICCOLE)
}

/* ══════════ la tappa di adesso ══════════ */
{
  const av = { tappa: TAPPE_PRIME, stelle: stelleFino(TAPPE_PRIME), cfg: { eredita: TAPPE_PRIME } }
  const r = stradeDi(av)
  uguale('un profilo di ieri, finiti i massi: il cursore di allora (il primo gregge)', r.adesso(), TAPPE_PRIME)
  uguale('vinta «Tutto insieme» in questa sessione: il viale',
         tappaDiAdesso(S, { ultima: indice('tutto'), cursore: TAPPE_PRIME, aperta: r.aperta, fatta: r.fatta }), TAPPE_PICCOLE)
  uguale('lasciato a metà il primo gregge: lì',
         tappaDiAdesso(S, { ultima: TAPPE_PRIME, cursore: TAPPE_PRIME, aperta: r.aperta, fatta: r.fatta }), TAPPE_PRIME)
  uguale('a sei anni, finiti i massi: il primo gregge',
         tappaDiAdesso(S, { ultima: indice('tutto'), cursore: TAPPE_PRIME, aperta: i => r.aperta(i) && i < TAPPE_PICCOLE,
                            fatta: r.fatta }), TAPPE_PRIME)
}

/* ══════════ cosa dice il fumetto su una chiusa ══════════ */
{
  const av = { tappa: TAPPE_PRIME + 3, stelle: stelleFino(TAPPE_PRIME + 3), cfg: { eredita: 0 } }
  const r = stradeDi(av)
  const dice = i => cosaManca(S, i, { fatta: r.fatta, aperta: r.aperta })
  const stalle = dice(indice('stalle'))
  controlla('le stalle aspettano il coniglio che impara 🔁', /il coniglio impara 🔁 \(«Il viale»\)/.test(stalle), stalle)
  controlla('e il cane che finisce il pascolo', /Prima tocca a «La curva»/.test(stalle), stalle)
  controlla('il lago delle stalle aspetta il coniglio che arriva a 🌍 (la carta c\'era già)',
            /arriva a 🌍/.test(dice(indice('lago-stalle'))), dice(indice('lago-stalle')))
  uguale('una del coniglio dice chi tocca prima', dice(indice('sassi-fiume')), 'Prima tocca a «Il viale», poi ad altre 2 tappe.')
  controlla('chiusa per l\'età lo dice e basta',
            cosaManca(S, 40, { fatta: r.fatta, aperta: r.aperta, perEta: () => true }) === 'Questa tappa per ora è chiusa.')
}

/* ══════════ la riga della home ══════════ */
{
  uguale('a metà strada, la tappa dopo l\'ultima giocata',
         manifesto.riassunto({ tappa: TAPPE_PRIME, stelle: stelleFino(TAPPE_PRIME), cfg: { eredita: TAPPE_PRIME, ultima: indice('tutto') } }),
         `tappa ${TAPPE_PICCOLE + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[TAPPE_PICCOLE].nome} · ⭐ ${TAPPE_PRIME * 3}`)
  uguale('dentro il pascolo, il gregge dopo',
         manifesto.riassunto({ tappa: TAPPE_PICCOLE + 2, stelle: { ...stelleFino(TAPPE_PRIME + 2), [TAPPE_PICCOLE]: 1, [TAPPE_PICCOLE + 1]: 1 },
                              cfg: { eredita: TAPPE_PRIME, ultima: TAPPE_PRIME + 1 } }).split(' · ')[1],
         CAMPAGNA[TAPPE_PRIME + 2].nome)
  void SCALINI
}

riassunto('passo passo — le due strade e i salvataggi')
