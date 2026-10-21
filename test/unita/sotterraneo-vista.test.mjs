/* La vista dello scontro a gruppi, senza browser (docs/sotterraneo/scontro-interfaccia.md): come stanno disposti i mostri sul
   palco (`disponi`), cosa legge la vista dal foglio della corsa (`vistaDelloScontro`), e il racconto di un turno
   (`nuovoRacconto`: ogni azione una alla volta, le ossa mostrate, i caduti, la fila che scorre).
   `node test/esegui.mjs sotterraneo-vista --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { disponi, piazza, ZOCCOLO, vistaDelloScontro, statiDel, statoNuovo, segniDel } from '../../src/giochi/sotterraneo/viste/campo.js'
import { nuovoRacconto, modoDelColpo } from '../../src/giochi/sotterraneo/viste/racconto.js'
import { NODI } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { EFFETTI, CORPI, SEGNI, effettoDi, effettoDelColpo, aureDelNodo, statiDelNodo, guastiDegliEffetti } from '../../src/giochi/sotterraneo/dati/effetti.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { statoDi } from '../../src/giochi/sotterraneo/scena3d/effetti3d/gestore.js'
import { readFileSync } from 'node:fs'
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
  uguale('sette: quattro e tre, sempre due file', celle(7), '0.1 2.1 4.1 6.1 1.2 3.2 5.2')
  uguale('una fila sola fino a tre, due file da quattro', [1, 2, 3, 4, 5, 6, 7].map(k => disponi(nessuno(k)).file).join(''), '1112222')
  // il grosso: al centro, su due file; gli altri ai lati, prima in basso
  const g = disponi([{ grosso: null }, { grosso: 'grumo' }, { grosso: null }, { grosso: null }, { grosso: null }])
  uguale('il grosso sta al centro, su due file', JSON.stringify(g.celle[1]), JSON.stringify({ col: 3, riga: 1, file: 2 }))
  uguale('e gli altri quattro ai lati', g.celle.filter((_, i) => i !== 1).map(c => c.col).join(), '1,5,1,5')
  uguale('in due file', g.file, 2)
  uguale('la cella del grosso è il suo posto', g.grande, 1)
  controlla('nessuna cella si sovrappone', new Set(g.celle.flatMap(c => (c.file === 2 ? [`${c.col}.1`, `${c.col}.2`] : [`${c.col}.${c.riga}`]))).size === 6)
}

/* ══════════ 1b. dove stanno le figure sul pavimento ══════════ */
{
  const nessuno = k => Array.from({ length: k }, () => ({ grosso: null }))
  for (const larg of [320, 352, 390]) {
    for (let k = 1; k <= 7; k++) {
      const pi = piazza(disponi(nessuno(k)), nessuno(k), larg)
      const campo = `${k} mostri a ${larg}`
      controlla(`${campo}: tutti coi piedi sul pavimento, mai sulla parete`, pi.mostri.every(m => m.y >= ZOCCOLO + 60) && pi.eroe.y > ZOCCOLO + 60 && pi.compagno.y > ZOCCOLO)
      controlla(`${campo}: dentro il palco, a destra dell'eroe`, pi.mostri.every(m => m.x > pi.eroe.x + 40 && m.x < larg - 40 && m.y < pi.alto - 10))
      uguale(`${campo}: uno per posto`, pi.mostri.length, k)
      const colonne = pi.mostri.map(m => m.x).sort((a, b) => a - b).reduce((n, x, j, v) => (j && x - v[j - 1] > 30 ? n + 1 : n), 1)   // un salto di 30 px è una colonna nuova
      if (k >= 3) controlla(`${campo}: in colonne, più di una e meno dei mostri`, colonne >= 2 && colonne < k, String(colonne))
      controlla(`${campo}: due mostri mai sullo stesso punto`, new Set(pi.mostri.map(m => `${Math.round(m.x / 20)}.${Math.round(m.y / 20)}`)).size === k)
      controlla(`${campo}: chi sta più in basso sta davanti (z)`, pi.mostri.every(a => pi.mostri.every(b => a.y <= b.y + 10 || a.z >= b.z)))
      controlla(`${campo}: chi sta in alto è un filo più piccolo, mai più grande`, pi.mostri.every(m => m.prof === 1 || (m.prof === 0.875 && pi.mostri.every(b => b.prof === 0.875 || b.y > m.y))))
      stessaLista(`${campo}: gli scarti sono stabili, non a caso`, pi.mostri.map(m => `${m.x},${m.y}`), piazza(disponi(nessuno(k)), nessuno(k), larg).mostri.map(m => `${m.x},${m.y}`))
    }
  }
  const uno = piazza(disponi(nessuno(1)), nessuno(1), 390)
  controlla('un mostro solo sta al centro del pavimento, non in un angolo', Math.abs(uno.mostri[0].x - (104 + (390 - 70 - 104) / 2)) < 12 && uno.mostri[0].y > ZOCCOLO + 80 && uno.mostri[0].y < uno.alto - 60)
  // i posti consecutivi del motore stanno vicini nel disegno (i «vicini» delle forme a catena)
  const sei = piazza(disponi(nessuno(6)), nessuno(6), 390).mostri
  const dist = (a, b) => Math.hypot(sei[a].x - sei[b].x, (sei[a].y - sei[b].y) * 0.6)
  controlla('i posti consecutivi sono vicini nel disegno', [0, 1, 2, 3, 4].every(i => dist(i, i + 1) < 130), [0, 1, 2, 3, 4].map(i => Math.round(dist(i, i + 1))).join())
  const sette = piazza(disponi(nessuno(7)), nessuno(7), 390).mostri
  const dist7 = (a, b) => Math.hypot(sette[a].x - sette[b].x, (sette[a].y - sette[b].y) * 0.6)
  controlla('anche fra sette i posti consecutivi sono vicini', [0, 1, 2, 3, 4, 5].every(i => dist7(i, i + 1) < 130), [0, 1, 2, 3, 4, 5].map(i => Math.round(dist7(i, i + 1))).join())
  // nessuno copre un altro: due figure, larghe una quarantina di pixel e alte una sessantina, non si sovrappongono quasi mai per intero
  let copre = 0
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) if (Math.abs(sette[a].x - sette[b].x) < 34 && Math.abs(sette[a].y - sette[b].y) < 52) copre++
  uguale('con sette nessuno ne copre un altro', copre, 0)
  // il grosso davanti e al centro, gli altri ai lati
  const gr = [{ grosso: null }, { grosso: 'grumo' }, { grosso: null }, { grosso: null }, { grosso: null }]
  const pg = piazza(disponi(gr), gr, 390)
  controlla('il grosso sta al centro', Math.abs(pg.mostri[1].x - (104 + (390 - 70 - 104) / 2)) < 12)
  controlla('e più in basso (davanti) di chi gli sta ai lati', pg.mostri.filter((_, i) => i !== 1).every(m => m.y < pg.mostri[1].y + 20) && pg.mostri[1].prof === 1)
  controlla('gli altri quattro ai due lati', pg.mostri.filter((_, i) => i !== 1).filter(m => m.x < pg.mostri[1].x).length === 2)
  // il grosso più sei piccoli (fino a un posto in più del tetto): ognuno ha un punto suo
  const g7 = [{ grosso: 'grumo' }, ...nessuno(6)]
  const p7 = piazza(disponi(g7), g7, 390).mostri
  controlla('il grosso e sei piccoli: tutti su punti diversi', new Set(p7.map(m => `${Math.round(m.x / 12)}.${Math.round(m.y / 12)}`)).size === 7, JSON.stringify(p7.map(m => [m.x, m.y])))
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

/* ══════════ 4. gli effetti: uno per ogni abilità, scelto dai dati ══════════ */
{
  uguale('nessun guasto negli effetti', guastiDegliEffetti(NODI).join(' | '), '')
  const usati = new Set()
  let senza = 0
  for (const n of Object.values(NODI)) {
    if (n.sempre) continue
    // l'effetto scritto, e quello che il nodo avrebbe senza (così un nodo nuovo ne ha già uno)
    const scritto = effettoDi(n), ricavato = effettoDi({ ...n, effetto: undefined })
    if (!EFFETTI[scritto] || !EFFETTI[ricavato]) senza++
    usati.add(scritto)
  }
  uguale('ogni abilità ha un effetto che esiste, scritto e ricavato', senza, 0)
  controlla('e le famiglie in uso sono molte (non uno solo per tutti)', usati.size >= 25, [...usati].join())
  // quello ricavato ha senso: elemento, forma, arma
  const d = (nodo, famiglia) => effettoDi({ ...NODI[nodo], effetto: undefined }, famiglia)
  uguale('il fendente è un taglio', d('fendente'), 'taglio')
  uguale('la spazzata un arco su più mostri', d('spazzata'), 'spazzata')
  uguale('il mulinello un turbine', d('mulinello'), 'turbine')
  uguale('la catena di fulmini una catena', d('catena-di-fulmini'), 'catena')
  uguale('la freccia che trapassa trapassa', d('freccia-che-trapassa'), 'trapassa')
  uguale('l\'ascia lanciata rimbalza', d('ascia-lanciata'), 'ascia')
  uguale('il fulmine scende dall\'alto', d('fulmine'), 'fulmine')
  uguale('il dardo di fuoco è una palla che vola e scoppia', d('dardo-di-fuoco'), 'palla')
  uguale('su più mostri la palla scoppia come un\'esplosione', d('sfera-di-fuoco'), 'esplode')
  uguale('l\'esplosione nasce sul mostro', d('esplosione'), 'esplode')
  uguale('la scheggia vola e gela', d('scheggia'), 'scheggia')
  uguale('la nevicata cade', d('nevicata'), 'nevicata')
  uguale('la luce sacra è un raggio dall\'alto', d('luce-sacra'), 'luce')
  uguale('il veleno è una nube', d('spore'), 'nube')
  uguale('lo scudo si forma', d('scudo-alzato'), 'scudo')
  uguale('la cura sale come scintille', d('fonte-arcana'), 'cura')
  uguale('l\'invulnerabilità è pietra', d('montagna'), 'pietra')
  uguale('un colpo di mano con la bacchetta è un dardo, con l\'arco una freccia, senz\'armi un taglio',
         [effettoDelColpo('bacchette'), effettoDelColpo('archi'), effettoDelColpo(null)].join(), 'dardo,freccia,taglio')
  // cosa dura e come arriva: mai oltre 800 ms, e ogni corpo e segno si sa disegnare
  controlla('nessun effetto dura più di 800 ms', Object.values(EFFETTI).every(e => e.dura <= 800))
  const scene = readFileSync(new URL('../../src/giochi/sotterraneo/viste/Scene.vue', import.meta.url), 'utf8')
  const mancano = [...CORPI, ...SEGNI].filter(c => !scene.includes(`'${c}'`) && !scene.includes(`sc-${c}`) && !scene.includes(`sg-${c}`))
  uguale('Scene.vue disegna tutti i corpi e i segni dichiarati', mancano.join(), '')
  // le aure: la Danza delle lame fa danno e para; la Fortezza cura e para
  uguale('la Fortezza ha due aure: cura e scudo', aureDelNodo(NODI.fortezza).sort().join(), 'cura,scudo')
  uguale('un nodo senza protezione non ne ha', aureDelNodo(NODI.fendente).length, 0)
  // gli stati che mette un'abilità, meno quelli che il mostro rifiuta
  uguale('la Prigione di ghiaccio gela e ferma', statiDelNodo(NODI['prigione-di-ghiaccio']).join(), 'fermo')
  uguale('Radici blocca e rende esposti', statiDelNodo(NODI.radici).sort().join(), 'esposto,fermo')
  uguale('un immune a «stordisce» non si ferma', statiDelNodo(NODI.stordisce, ['stordisce']).length, 0)
  uguale('un immune al veleno non brucia', statiDelNodo(NODI.brucia, ['brucia']).length, 0)
}

/* ══════════ 5. gli stati e i segni di chi resiste, teme, è immune ══════════ */
{
  const g = statiDel({ stati: { debole: 2, gelo: true, fermo: 1 } })
  uguale('un gelato ha il fiocco', g.find(x => x.chiave === 'debole').glifo, 'fiocco')
  controlla('e lo dice (gelo)', g.every(x => x.gelo))
  const f = statiDel({ stati: { debole: 2 } })
  uguale('chi colpisce a metà senza gelo è fiacco, non gelato', f[0].glifo + '/' + f[0].gelo, 'fiacco/false')
  uguale('stordito: le stelle', statiDel({ stati: { fermo: 1 } })[0].glifo, 'stelle')
  // i Rovi (debole da `radici`): le spine ai piedi per tutti i turni, non la freccia del fiacco; il Grido resta fiacco
  const rovi = statiDel({ stati: { debole: 3, deboleDa: 'radici' } })[0]
  uguale('i Rovi lasciano le radici ai piedi', rovi.glifo + '/' + rovi.da, 'radici/radici')
  uguale('i Rovi in 3D sono radici ai piedi', statoDi(rovi), 'bloccato')
  uguale('il Grido resta fiacco in 3D', statoDi(statiDel({ stati: { debole: 3, deboleDa: null } })[0]), 'fiacco')
  uguale('lo stato che il racconto posa subito per i Rovi è lo stesso', statoNuovo('debole', { stati: {} }, { effetto: 'radici' }).glifo, 'radici')
  uguale('sanguina: il sangue', statiDel({ stati: { sanguina: { quanto: 2, scambi: 2, pile: 1 } } })[0].glifo, 'sangue')
  const resiste = segniDel({ elemento: 'fuoco', effetto: 'resiste', rifiutati: [] })
  const teme = segniDel({ elemento: 'gelo', effetto: 'teme', rifiutati: [] })
  const immune = segniDel({ elemento: 'veleno', effetto: null, rifiutati: ['avvelena', 'stordisce'] })
  uguale('chi resiste ha il suo segno, col fuoco', resiste[0].tipo + '/' + resiste[0].glifo, 'resiste/fiamma')
  uguale('chi teme il suo, col gelo', teme[0].tipo + '/' + teme[0].glifo, 'teme/fiocco')
  uguale('un immune un segno per ogni stato rifiutato', immune.map(x => x.tipo + '/' + x.glifo).join(), 'immune/veleno,immune/stelle')
  uguale('un colpo normale non ha segni', segniDel({ elemento: 'fisico', effetto: null, rifiutati: [] }).length, 0)
  // dall'anteprima di una scelta preparata, a partire dai dati veri del motore
  const { c, fatti } = scena(3)
  c.scontro(fatti[0])
  c.difese = m => (m === fatti[0] ? { resiste: ['fuoco'], teme: [], immune: [] } : m === fatti[1] ? { resiste: [], teme: ['fuoco'], immune: ['brucia'] } : { resiste: [], teme: [], immune: [] })
  c.pronta = 'sfera-di-fuoco'
  c.aggiorna(c.foglio)
  const v = vistaDelloScontro(c)
  uguale('chi resiste al fuoco lo dice prima di rispondere', v.mostri[0].segni.map(x => x.tipo).join(), 'resiste')
  uguale('chi lo teme ha il suo segno', v.mostri[1].segni.map(x => x.tipo).join(), 'teme')
  uguale('chi non ha difese niente', v.mostri[2].segni.length, 0)
  c.scegliBersaglio(fatti[1])
  c.pronta = 'brucia'
  c.aggiorna(c.foglio)
  uguale('chi lo teme e non brucia ne ha due', vistaDelloScontro(c).mostri[1].segni.map(x => x.tipo).join(), 'teme,immune')
}

/* ══════════ 6. il racconto di un'abilità: effetti, numeri, stati ══════════ */
{
  const aspetta = ms => new Promise(f => setTimeout(f, ms))
  const prepara = n => {
    const { c, fatti } = scena(n)
    c.scontro(fatti[0])
    const campo = [...c.foglio.campo]
    const v = vistaDelloScontro(c)
    const prima = { campo, ossa: campo.map(m => m.ossa), morti: campo.map(() => false), turni: v.turni, stati: v.mostri.map(m => m.stati) }
    return { c, campo, prima }
  }
  const eroe = (campo, nodo, forma, colpiti, presi) => ({
    chi: 'eroe', che: 'abilita', forma, bersaglio: campo[0],
    usata: { id: nodo, nome: NODI[nodo].nome, glifo: NODI[nodo].glifo, elemento: NODI[nodo].elemento }, colpiti, presi: presi || colpiti.map(c => ({ chi: c.chi, rifiutati: c.rifiutati || [] })),
  })
  const colpito = (m, dato, elemento, effetto = null, rifiutati = []) => ({ chi: m, dato, caduto: false, elemento, effetto, rifiutati })
  // una palla di fuoco: parte un corpo, e su tre mostri scoppia (uno solo vola, gli altri sentono lo scoppio)
  {
    const { campo, prima } = prepara(3)
    const a = eroe(campo, 'sfera-di-fuoco', 'vicini', campo.map(m => colpito(m, 7, 'fuoco')))
    const r = nuovoRacconto({})
    r.racconta({ campo, prima, azioni: [a], modo: () => modoDelColpo({ nodo: NODI['sfera-di-fuoco'], famiglia: 'bacchette' }) })
    await aspetta(40)
    uguale('la palla di fuoco: un corpo che vola dall\'eroe', r.fx.scene.filter(x => x.corpo === 'palla').map(x => x.modo + ':' + x.da + '>' + x.a).join(), 'volo:eroe>0')
    controlla('tinta di fuoco', r.fx.scene[0].tinta.toLowerCase() === '#e8742f')
    controlla('l\'eroe tira indietro il braccio', r.fx.effetto.eroe && r.fx.effetto.eroe.tipo === 'tira')
    await aspetta(620)
    uguale('arrivata, su ognuno dei tre scoppia', r.fx.scene.filter(x => x.corpo === 'scoppio').map(x => x.a).sort().join(), '0,1,2')
    r.accorcia()
    await aspetta(900)
    uguale('finito, niente resta a schermo', r.fx.scene.length, 0)
  }
  // la catena di fulmini: un arco per ogni anello, uno dopo l'altro
  {
    const { campo, prima } = prepara(3)
    const a = eroe(campo, 'catena-di-fulmini', 'catena', campo.map((m, k) => colpito(m, 9 - k, 'fulmine')))
    const r = nuovoRacconto({})
    r.racconta({ campo, prima, azioni: [a], modo: () => modoDelColpo({ nodo: NODI['catena-di-fulmini'], famiglia: 'bacchette' }) })
    await aspetta(30)
    const archi = r.fx.scene.filter(x => x.corpo === 'arco')
    uguale('tre archi, dall\'eroe al primo e poi di mostro in mostro', archi.map(x => x.da + '>' + x.a).join(), 'eroe>0,0>1,1>2')
    controlla('con un ritardo crescente: il lampo salta', archi[0].ritardo < archi[1].ritardo && archi[1].ritardo < archi[2].ritardo)
    r.ferma()
  }
  // un mostro che resiste e uno che teme: il numero cambia e c'è il segno; chi è immune ha lo stato barrato
  {
    const { campo, prima } = prepara(3)
    const a = eroe(campo, 'prigione-di-ghiaccio', 'vicini', [
      colpito(campo[0], 3, 'gelo', 'resiste'), colpito(campo[1], 14, 'gelo', 'teme'), colpito(campo[2], 8, 'gelo', null, ['stordisce'])])
    const r = nuovoRacconto({})
    r.racconta({ campo, prima, azioni: [a], modo: () => modoDelColpo({ nodo: NODI['prigione-di-ghiaccio'], famiglia: 'bacchette' }) })
    await aspetta(700)
    const n = r.fx.numeri
    uguale('chi resiste: il numero è piccolo', n.filter(x => x.su === 0 && x.tipo === 'resiste').length, 1)
    uguale('con la scritta piccola', n.filter(x => x.su === 0 && x.tipo === 'segno').map(x => x.testo + '/' + x.tono).join(), 'resiste/resiste')
    uguale('chi teme: il numero è grande', n.filter(x => x.su === 1 && x.tipo === 'teme').length, 1)
    uguale('e dice «lo teme!»', n.filter(x => x.su === 1 && x.tipo === 'segno').map(x => x.testo).join(), 'lo teme!')
    uguale('l\'immune ha lo stato rifiutato, barrato', n.filter(x => x.su === 2 && x.tipo === 'segno').map(x => x.testo + '/' + !!x.barrato).join(), 'non si stordisce/true')
    controlla('chi resiste ha il suo scudetto sulla figura', r.fx.scene.some(x => x.corpo === 'rimbalzo' && x.a === 0))
    controlla('chi teme scoppia', r.fx.scene.some(x => x.corpo === 'colpo' && x.a === 1 && x.piu))
    controlla('chi resiste trema piano, chi teme forte', r.fx.effetto[0].tipo === 'colpito-debole' && r.fx.effetto[1].tipo === 'colpito-forte')
    // gli stati si posano quando l'abilità arriva
    controlla('chi è preso resta fermo, nel ghiaccio', (r.fx.stati[0] || []).some(x => x.chiave === 'fermo' && x.gelo) && (r.fx.stati[1] || []).some(x => x.chiave === 'fermo' && x.gelo))
    controlla('chi è immune a «stordisce» non si ferma', !(r.fx.stati[2] || []).some(x => x.chiave === 'fermo'))
    r.ferma()
  }
  // un'abilità che non fa danno ma mette addosso (Ninna nanna): chi la prende ha il suo effetto e il suo stato
  {
    const { campo, prima } = prepara(3)
    const a = eroe(campo, 'ninna-nanna', 'vicini', [], campo.slice(0, 2).map(m => ({ chi: m, rifiutati: [] })))
    const r = nuovoRacconto({})
    r.racconta({ campo, prima, azioni: [a], modo: () => modoDelColpo({ nodo: NODI['ninna-nanna'], famiglia: 'bacchette' }) })
    await aspetta(30)
    uguale('il sonno nasce sui due presi', r.fx.scene.filter(x => x.corpo === 'sonno').map(x => x.a).join(), '0,1')
    await aspetta(300)
    controlla('e li ferma (stati addosso mostrati)', [0, 1].every(k => (r.fx.stati[k] || []).some(x => x.chiave === 'fermo')))
    uguale('il terzo no', (r.fx.stati[2] || []).length, 0)
    r.ferma()
  }
  // lo scudo si forma sull'eroe e non c'è niente da colpire
  {
    const { campo, prima } = prepara(2)
    const a = eroe(campo, 'scudo-alzato', 'uno', [])
    const r = nuovoRacconto({})
    r.racconta({ campo, prima, azioni: [a], modo: () => modoDelColpo({ nodo: NODI['scudo-alzato'] }) })
    await aspetta(30)
    uguale('lo scudo si forma sull\'eroe', r.fx.scene.map(x => x.corpo + '@' + x.a).join(), 'scudo@eroe')
    controlla('e lui sta fermo e brilla', r.fx.effetto.eroe && r.fx.effetto.eroe.tipo === 'protegge')
    r.ferma()
  }
}

/* ══════════ 7. il motore dà il dato in più: chi prende l'abilità, e il gelo ══════════ */
{
  const roba2 = { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }
  const c = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11), eroe: 'mago', roba: roba2,
    crescita: { esp: sogliaDi(12), albero: { 'prigione-di-ghiaccio': 1, 'ninna-nanna': 1 }, caselle: ['prigione-di-ghiaccio', 'ninna-nanna', null] } })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  c.vitaPiu += 80; c.vita = c.vitaMax; c.energia = 99
  c.perchéNonUsi = () => ''
  const st = c.livello.stanze.reduce((a, b) => (b.w > a.w ? b : a))
  c.eroe = { x: st.x + 0.5, y: st.y + 1.5 }; c.verso = { dx: 1, dy: 0 }
  const fatti = [0, 1, 2].map(i => Object.assign(c.livello.mostro('goblin', st.x + 1 + i, st.y + 1), { ossa: 90, ossaMax: 90, att: 3, dif: 0, velocita: 10, sveglio: true }))
  c.livello.robe.push(...fatti)
  c.scontro(fatti[0])
  c.prepara('prigione-di-ghiaccio')
  const e = c.rispondi(true)
  const az = e.azioni.find(a => a.chi === 'eroe')
  uguale('l\'azione porta chi prende l\'abilità', az.presi.length, az.colpiti.length)
  controlla('chi è nel ghiaccio lo dice al disegno (gelo)', fatti[0].stati.gelo === true || fatti[0].stati.fermo === 0, JSON.stringify(fatti[0].stati))
  const gel = statiDel(fatti[0]).find(x => x.chiave === 'fermo')
  controlla('e statiDel lo mostra ghiacciato finché dura', !gel || gel.gelo === true)
  c.prepara('ninna-nanna')
  const f = c.rispondi(true)
  const nn = f && f.azioni ? f.azioni.find(a => a.chi === 'eroe') : null
  if (nn) {
    uguale('Ninna nanna non fa danno ma ha i suoi presi', nn.colpiti.length, 0)
    controlla('e i presi sono i vicini del bersaglio', nn.presi.length >= 1 && nn.presi.length <= 3)
  }
}

riassunto('la vista dello scontro a gruppi')
