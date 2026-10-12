/* La vista dello scontro a gruppi, senza browser (docs/sotterraneo/scontro-interfaccia.md): come stanno disposti i mostri sul
   palco (`disponi`), cosa legge la vista dal foglio della corsa (`vistaDelloScontro`), e il racconto di un turno
   (`nuovoRacconto`: ogni azione una alla volta, le ossa mostrate, i caduti, la fila che scorre).
   `node test/esegui.mjs sotterraneo-vista --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { disponi, vistaDelloScontro, statiDel } from '../../src/giochi/sotterraneo/viste/campo.js'
import { nuovoRacconto } from '../../src/giochi/sotterraneo/viste/racconto.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const roba = { v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
function scena(n, { grosso = -1 } = {}) {
  const c = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11), eroe: 'cavaliere', roba })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  c.vitaPiu += 60
  c.vita = c.vitaMax
  const st = c.livello.stanze.reduce((a, b) => (b.w > a.w ? b : a))
  c.eroe = { x: st.x + 0.5, y: st.y + 1.5 }
  c.verso = { dx: 1, dy: 0 }
  const fatti = []
  for (let i = 0; i < n; i++) {
    const m = i === grosso ? c.livello.mostroGrosso('grumo', st.x + 1 + (i >> 1), st.y + 1 + (i & 1)) : c.livello.mostro('goblin', st.x + 1 + (i >> 1), st.y + 1 + (i & 1))
    Object.assign(m, { ossa: 20, ossaMax: 20, att: 4, dif: 0, velocita: 10, sveglio: true })
    c.livello.robe.push(m)
    fatti.push(m)
  }
  return { c, fatti }
}

/* ══════════ 1. la disposizione ══════════ */
{
  const nessuno = k => Array.from({ length: k }, () => ({ grosso: null }))
  const celle = k => disponi(nessuno(k)).celle.map(c => `${c.col}.${c.riga}`).join(' ')
  uguale('uno: al centro, una fila', celle(1), '3.1')
  uguale('due: una fila, centrati', celle(2), '2.1 4.1')
  uguale('tre: una fila', celle(3), '1.1 3.1 5.1')
  uguale('quattro: due file da due', celle(4), '2.1 4.1 2.2 4.2')
  uguale('cinque: tre e due, la seconda centrata', celle(5), '1.1 3.1 5.1 2.2 4.2')
  uguale('sei: due file da tre', celle(6), '1.1 3.1 5.1 1.2 3.2 5.2')
  uguale('una fila sola fino a tre, due file da quattro', [1, 2, 3, 4, 5, 6].map(k => disponi(nessuno(k)).file).join(''), '111222')
  // il grosso: al centro, su due file; gli altri ai lati, prima in basso
  const g = disponi([{ grosso: null }, { grosso: 'grumo' }, { grosso: null }, { grosso: null }, { grosso: null }])
  uguale('il grosso sta al centro, su due file', JSON.stringify(g.celle[1]), JSON.stringify({ col: 3, riga: 1, file: 2 }))
  uguale('e gli altri quattro ai lati', g.celle.filter((_, i) => i !== 1).map(c => c.col).join(), '1,5,1,5')
  uguale('in due file', g.file, 2)
  uguale('la cella del grosso è il suo posto', g.grande, 1)
  controlla('nessuna cella si sovrappone', new Set(g.celle.flatMap(c => (c.file === 2 ? [`${c.col}.1`, `${c.col}.2`] : [`${c.col}.${c.riga}`]))).size === 6)
}

/* ══════════ 2. cosa legge la vista ══════════ */
{
  const { c, fatti } = scena(4)
  c.scontro(fatti[0])
  const v = vistaDelloScontro(c)
  uguale('quattro mostri', v.mostri.length, 4)
  stessaLista('l\'indice è il posto', v.mostri.map(m => m.i), [0, 1, 2, 3])
  uguale('un bersaglio solo', v.mostri.filter(m => m.bersaglio).length, 1)
  uguale('chi ha aperto lo scontro', v.mostri.find(m => m.bersaglio).i, 0)
  uguale('sette turni, i primi dall\'eroe', v.turni.length, 7)
  uguale('la fila comincia dall\'eroe', v.turni[0].chi, 'eroe')
  controlla('gli altri sono posti', v.turni.filter(t => t.chi !== 'eroe').every(t => Number.isInteger(t.chi) && t.chi >= 0 && t.chi < 4))
  controlla('ognuno dice quanto colpisce', v.mostri.every(m => m.colpisce > 0))
  uguale('la disposizione è due file da due', v.posti.file, 2)
  uguale('l\'agguato non c\'è', v.apertura.agguato, false)
  // toccando un altro lo si cambia, e il contorno segue la scelta
  c.scegliBersaglio(fatti[2])
  const w = vistaDelloScontro(c)
  uguale('il bersaglio è il terzo', w.mostri.find(m => m.bersaglio).i, 2)
  uguale('e prende il colpo', w.mostri.filter(m => m.colpito).map(m => m.i).join(), '2')
  // uno morto resta al suo posto
  fatti[1].ossa = 0
  c.muore(c.foglio, fatti[1])
  c.aggiorna(c.foglio)
  const z = vistaDelloScontro(c)
  uguale('chi cade resta al suo posto, segnato', z.mostri[1].morto, true)
  uguale('e la fila non lo conta più', z.turni.some(t => t.chi === 1), false)
  // gli stati sono glifi coi turni che restano
  const s = statiDel({ stati: { veleno: { quanto: 3, scambi: 2, fuoco: true }, fermo: 1 } })
  uguale('veleno di fuoco: la fiamma', s[0].glifo, 'fiamma')
  uguale('con i suoi turni', s.map(x => x.t).join(), '2,1')
}

/* ══════════ 3. il racconto ══════════ */
{
  // tempi finti: i passi girano uno dopo l'altro, e il racconto si chiude da sé
  const { c, fatti } = scena(3)
  c.scontro(fatti[0])
  const campo = c.foglio.campo
  const prima = { ossa: campo.map(m => m.ossa), morti: campo.map(() => false), turni: vistaDelloScontro(c).turni }
  const eventi = []
  const r = nuovoRacconto({ suono: n => eventi.push('s:' + n), colpitoEroe: () => eventi.push('eroe'), finito: () => eventi.push('fine') })
  const azioni = [
    { chi: 'eroe', che: 'attacco', forma: 'uno', usata: null, colpiti: [{ chi: campo[0], dato: 5, caduto: false }] },
    { chi: campo[0], che: 'colpo', contro: 'eroe', preso: 3, pieno: 3 },
    { chi: campo[1], che: 'colpo', contro: 'eroe', preso: 0, schivato: true },
  ]
  r.racconta({ campo, prima, azioni })
  uguale('il racconto comincia', r.fx.attivo, true)
  const aspetta = ms => new Promise(f => setTimeout(f, ms))
  await aspetta(60)
  uguale('l\'eroe scatta ma il colpo non è ancora arrivato: la barra è com\'era', r.fx.ossa[0], prima.ossa[0])
  controlla('e lui sta scattando', r.fx.effetto.eroe && r.fx.effetto.eroe.tipo === 'scatta')
  await aspetta(300)
  uguale('poi il colpo arriva e la barra del primo scende', r.fx.ossa[0], prima.ossa[0] - 5)
  controlla('e sale il suo numero', r.fx.numeri.some(n => n.su === 0 && n.testo === '−5' && n.tipo === 'dato'))
  uguale('gli altri non sono ancora toccati', r.fx.ossa[1], prima.ossa[1])
  r.accorcia()
  uguale('un tocco accorcia', r.fx.veloce, true)
  await aspetta(1200)
  uguale('a racconto finito niente resta a schermo', r.fx.attivo, false)
  controlla('è finito una volta sola', eventi.filter(e => e === 'fine').length === 1)
  controlla('il colpo preso sobbalza il globo', eventi.includes('eroe'))
  uguale('lo schivato non lo fa sobbalzare due volte', eventi.filter(e => e === 'eroe').length, 1)
}
{
  // chi cade sparisce a metà racconto; la fila lo perde
  const { c, fatti } = scena(2)
  c.scontro(fatti[0])
  const campo = c.foglio.campo
  const prima = { ossa: campo.map(m => m.ossa), morti: campo.map(() => false), turni: vistaDelloScontro(c).turni }
  const r = nuovoRacconto({})
  r.racconta({ campo, prima, azioni: [{ chi: 'eroe', che: 'attacco', forma: 'uno', usata: null, colpiti: [{ chi: campo[0], dato: 99, caduto: true }] }] })
  await new Promise(f => setTimeout(f, 900))
  r.ferma()
  uguale('ferma pulisce tutto', r.fx.attivo, false)
}

riassunto('la vista dello scontro a gruppi')
