/* ═══════════════════════════════════════════════════════════════════
   L'INGLESE A MONDI — quello che la vista aggiunge, senza browser.
   `node test/esegui.mjs inglese-vista`

   La fila delle tessere (motore/fila.js) su domande vere, la mappa del
   tesoro messa in pagina (scena/disposizione.js) a tre larghezze, un
   disegnino per ogni tappa e ogni mondo, le monete, e la materia «Frasi
   inglesi» dell'albo che con le frasi nuove non passa il cento per cento.
   Il browser lo prova integrazione/inglese-mondi; il motore unita/inglese-mondi.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { MONDI, TAPPE, tappaDi } from '../../src/giochi/inglese/dati/mondi.js'
import { FRASI } from '../../src/giochi/inglese/dati/frasi.js'
import { FRASI as FRASI_VECCHIE } from '../../src/data/frasi.js'
import { guastiDelleMonete, pagaDi, PAGA } from '../../src/giochi/inglese/dati/monete.js'
import { costruisci, giudica, contesto } from '../../src/giochi/inglese/motore/formati.js'
import { sorte } from '../../src/giochi/inglese/motore/guasti.js'
import { statoMappa, segnaVinta } from '../../src/giochi/inglese/motore/mappa.js'
import * as F from '../../src/giochi/inglese/motore/fila.js'
import { disponi, R_TAPPA } from '../../src/giochi/inglese/scena/disposizione.js'
import { PITTORI } from '../../src/giochi/inglese/scena/pittori.js'
import { sbiadito } from '../../src/giochi/inglese/scena/mappa.js'
import manifesto from '../../src/giochi/inglese/gioco.js'
import { abilita, materiaDi } from '../../src/store/progressi.js'
import { MAX_S } from '../../src/store/srs.js'

const titolo = t => console.log('\n' + t)

/* ═══════════ 1. la fila ═══════════ */
titolo('LA FILA')
{
  let provate = 0
  for (const f of FRASI) {
    const ctx = contesto(f, { tappa: tappaDi(f.tappa), altre: FRASI.filter(x => x.tappa === f.tappa), rnd: sorte(7) })
    for (const formato of ['completa', 'monta', 'scegliMonta']) {
      const d = costruisci(f, formato, ctx, { forza: 6 })
      // si compone toccando le tessere nell'ordine del loro posto: deve venire giusta
      const giuste = d.tessere.filter(t => F.postoDi(d, t.id) != null)
        .sort((a, b) => F.postoDi(d, a.id) - F.postoDi(d, b.id))
      let fila = F.filaVuota(d)
      controlla(`${f.id} ${formato}: prima di toccare non si consegna`, !F.pronta(d, fila))
      for (const t of giuste) fila = F.metti(d, fila, t.id)
      controlla(`${f.id} ${formato}: in ordine di posto si può consegnare`, F.pronta(d, fila))
      const e = giudica(f, d, F.risposta(fila), { ctx })
      controlla(`${f.id} ${formato}: e la frase è giusta`, e.giusta, F.risposta(fila).join(','))
      uguale(`${f.id} ${formato}: nessuna tessera colorata sulla giusta`, F.sbagliate(d, fila).length, 0)
      const { caselle, punto } = F.caselle(d, fila)
      controlla(`${f.id} ${formato}: la fila comincia con la maiuscola`, /^[A-Z]/.test(caselle[0].testo), caselle[0].testo)
      uguale(`${f.id} ${formato}: il «?» alle domande, il punto alle altre`, punto, /\?\s*$/.test(f.it) ? '?' : '.')
      // «è un cane» senza punto si legge anche come domanda: l'italiano lo dice sempre
      uguale(`${f.id} ${formato}: la consegna italiana finisce col suo segno`, d.domanda.testo.slice(-1),
             /\?\s*$/.test(f.it) ? '?' : '.')
      // ritoccata, una tessera torna nel banco
      const via = giuste[0].id
      const tolta = F.togli(d, fila, via)
      controlla(`${f.id} ${formato}: ritoccata torna nel banco`, F.nelBanco(d, tolta).some(t => t.id === via))
      // storta: al contrario (o con una tessera in più) qualcosa si colora
      if (formato !== 'completa' && giuste.length > 1) {
        let storta = F.filaVuota(d)
        const ordine = formato === 'scegliMonta' && d.inPiu
          ? [...giuste.slice(0, -1), d.tessere.find(t => F.postoDi(d, t.id) == null)]
          : giuste.slice().reverse()
        for (const t of ordine) storta = F.metti(d, storta, t.id)
        const es = giudica(f, d, F.risposta(storta), { ctx })
        if (!es.giusta)
          controlla(`${f.id} ${formato}: sbagliata, almeno una tessera colorata`, F.sbagliate(d, storta).length > 0)
      }
      provate++
    }
  }
  nota(`${provate} domande composte`)
  // «monta» vuole tutte le tessere, «scegli e monta» non dice quante
  const f = FRASI.find(x => x.id === 'm-two-dogs')
  const ctx = contesto(f, { tappa: tappaDi(f.tappa), altre: [], rnd: sorte(2) })
  const m = costruisci(f, 'monta', ctx)
  controlla('monta: con una tessera sola non si consegna', !F.pronta(m, [m.tessere[0].id]))
  const s = costruisci(f, 'scegliMonta', ctx, { forza: 6 })
  controlla('scegli e monta: basta una tessera', F.pronta(s, [s.tessere[0].id]))
}

/* ═══════════ 2. la mappa del tesoro ═══════════ */
titolo('LA MAPPA')
{
  const vuoto = { tappa: 0, stelle: {}, cfg: {} }
  const tutto = { tappa: 0, stelle: {}, cfg: {} }
  for (const t of TAPPE) segnaVinta(tutto, t.id)
  const extra = () => ({ libro: { aperto: true }, cassetto: { aperto: false } })
  for (const [nome, c] of [['a profilo vuoto', vuoto], ['a mondi finiti', tutto]]) {
    for (const W of [320, 390, 520]) {
      const q = disponi(statoMappa(c, () => 0), W, extra)
      const tappe = q.nodi.filter(n => n.tipo === 'tappa')
      uguale(`${nome}, ${W}px: ogni tappa ha il suo medaglione`, tappe.length, TAPPE.length)
      uguale(`${nome}, ${W}px: ogni mondo senza tappe si vede in arrivo`,
             q.nodi.filter(n => n.tipo === 'mondo').length, MONDI.filter(m => !m.tappe.length).length)
      const fuori = q.nodi.filter(n => n.x - n.r < 0 || n.x + n.r > W || n.y - n.r < 0 || n.y + n.r > q.H)
      uguale(`${nome}, ${W}px: niente esce dalla mappa`, fuori.map(n => n.chiave).join(','), '')
      const sovrapposti = []
      for (let i = 0; i < q.nodi.length; i++) for (let j = i + 1; j < q.nodi.length; j++) {
        const a = q.nodi[i], b = q.nodi[j]
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 8) sovrapposti.push(a.chiave + '/' + b.chiave)
      }
      uguale(`${nome}, ${W}px: nessun medaglione sopra un altro`, sovrapposti.join(','), '')
      controlla(`${nome}, ${W}px: i mondi collegati hanno una rotta`, q.sentieri.some(s => s.tipo === 'fra'))
    }
  }
  const q = disponi(statoMappa(vuoto, () => 0), 390)
  uguale('a profilo vuoto una tappa sola è «adesso»', q.nodi.filter(n => n.adesso).map(n => n.id).join(), 'prima-colori')
  const dopo = disponi(statoMappa(tutto, () => 0), 390)
  controlla('a mondi finiti non c’è niente di chiuso fra le tappe',
            dopo.nodi.filter(n => n.tipo === 'tappa').every(n => n.stato === 'vinta'))
  // il disegno si riempie col grado e sbiadisce quando cala
  const n = g => sbiadito({ tipo: 'tappa', stato: 'aperta', grado: g })
  controlla('più grado, meno sbiadito', n(0) > n(5) && n(5) > n(10) && n(10) === 0)
  controlla('una tappa chiusa è sbiadita più di tutte', sbiadito({ tipo: 'tappa', stato: 'chiusa' }) > n(0))
  nota(`altezza della mappa a 390px: ${q.H}px, medaglioni di ${R_TAPPA * 2}px`)
}

/* ═══════════ 3. i disegnini ═══════════ */
titolo('I DISEGNI')
{
  const mancano = [...TAPPE.map(t => t.disegno), ...MONDI.map(m => m.disegno), 'libro', 'cassetto']
    .filter(d => !PITTORI[d])
  uguale('ogni tappa e ogni mondo hanno il loro disegno', mancano.join(','), '')
}

/* ═══════════ 4. le monete ═══════════ */
titolo('LE MONETE')
{
  uguale('i prezzi stanno in piedi', guastiDelleMonete().join(' · '), '')
  uguale('una parola paga il minimo', pagaDi({ genere: 'parola' }), PAGA.parola)
  controlla('comporre paga più che riconoscere', PAGA.monta > PAGA.riconosci)
  uguale('il riassunto a profilo vuoto', manifesto.riassunto({}), `${TAPPE.length} tappe sulla mappa del tesoro`)
  const c = {}
  segnaVinta(c, 'prima-colori')
  controlla('il riassunto dice quante e dove', /1 tappa su \d+ · In prima/.test(manifesto.riassunto(c)), manifesto.riassunto(c))
}

/* ═══════════ 5. la materia «Frasi inglesi» ═══════════ */
titolo('L’ALBO')
{
  const ids = new Set([...FRASI_VECCHIE.map(f => f.id), ...FRASI.map(f => f.id)])
  const def = materiaDi('frasi')
  uguale('il totale conta le frasi di prima e dei mondi una volta', def.totale, ids.size)
  const ora = Date.now()
  const saputa = { s: MAX_S, ok: 9, err: 0, last: ora, seen: 9, t: 0 }
  const items = Object.fromEntries([...ids].map(id => ['frase:' + id, { ...saputa }]))
  items['frase:non-esiste'] = { ...saputa }
  const a = abilita({ items }, 'frasi', ora)
  uguale('tutte sapute: tante quante il totale, non di più', a.imparati, def.totale)
  controlla('e la padronanza non passa il cento per cento', a.padronanza <= 1)
}

riassunto('inglese a mondi: la vista')
