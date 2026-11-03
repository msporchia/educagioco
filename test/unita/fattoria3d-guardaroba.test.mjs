/* Verifica del guardaroba della fattoria 3D, senza browser: i dati (abiti.js), il genere dal profilo, la normalizzazione di un abito rotto,
   gli sblocchi per livello, i nomi «il contadino / la contadina», i modelli con abiti diversi (mesh, triangoli, ingombro, perni, nessun NaN)
   e la cache. `node test/esegui.mjs fattoria3d-guardaroba`
   tempo: 1 */
import { CATEGORIE, PERSONE_ABITO, personaDi, nomeDelContadino, opzioniDi, opzione, sbloccato, abitoDiSerie, valida, normalizzaAbito, capiDi, chiaveAbito,
  abitoDaChiave, vesti, abitiAl, guastiDegliAbiti, armadioInForma, daComprare, statoDelPezzo, scelteDi, chiaveCapo } from '../../src/giochi/fattoria3d/dati/abiti.js'
import { roba, vuoto, guastiDeiLivelli } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { vociDelGuardaroba, valoriDellAbito, abitoDeiValori, vestitiInForma } from '../../src/giochi/fattoria3d/dati/guardaroba-voci.js'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { creaContadino, misure } = await import('../../src/giochi/fattoria3d/scena3d/modelli-compagni.js')
const { svuotaCache } = await import('../../src/giochi/fattoria3d/scena3d/cache-modelli.js')

const J = JSON.stringify
/* ══════════ 1. i dati ══════════ */
const g = guastiDegliAbiti()
controlla('i dati del guardaroba non hanno guasti', g.length === 0, g.join(' · '))
controlla('i dati dei livelli reggono con gli abiti', guastiDeiLivelli().length === 0, guastiDeiLivelli().join(' · '))
for (const p of PERSONE_ABITO) {
  controlla(`l'abito di serie di ${p} è valido e di quella persona`, valida(abitoDiSerie(p)) && abitoDiSerie(p).persona === p)
  for (const c of CATEGORIE) {
    const n = opzioniDi(c, p).length
    controlla(`${p}/${c}: da 3 a 14 scelte (${n})`, n >= 3 && n <= 14)
  }
}
controlla('taglio e barba sono uguali per tutti e due (in comune col sotterraneo); la fascia è di lei', opzioniDi('taglio', 'contadina').length === opzioniDi('taglio', 'contadino').length && opzioniDi('barba', 'contadina').length === 6
  && opzioniDi('cappello', 'contadina').some(o => o.id === 'fascia') && !opzioniDi('cappello', 'contadino').some(o => o.id === 'fascia'))
controlla('stivali, pantaloni e pelle sono di tutti e due', ['stivali', 'pantalone', 'pelle'].every(c => opzioniDi(c, 'contadino').length === opzioniDi(c, 'contadina').length))

/* ══════════ 2. il genere, dal profilo ══════════ */
uguale('bambina → la contadina', personaDi('bambina'), 'contadina')
uguale('bimbo → il contadino', personaDi('bimbo'), 'contadino')
uguale('principessa → la contadina', personaDi('principessa'), 'contadina')
uguale('cavaliere → il contadino', personaDi('cavaliere'), 'contadino')
uguale('un personaggio ambiguo ripiega sul valore di serie', personaDi('elfo'), 'contadino')
uguale('…o su quello che si passa', personaDi('elfo', 'contadina'), 'contadina')
uguale('niente / un numero / null non lanciano', [personaDi(undefined), personaDi(7), personaDi(null)].join(), 'contadino,contadino,contadino')

/* ══════════ 3. normalizzare ══════════ */
{
  const serieLui = abitoDiSerie('contadino'), serieLei = abitoDiSerie('contadina')
  for (const rotto of [null, undefined, 0, 'ciao', [], {}, { cappello: 7, maglia: null }, { cappello: 'inesistente', stivali: {} }, { persona: 'drago', cappello: 'cowboy' }]) {
    const a = normalizzaAbito(rotto, 'contadina')
    controlla(`un abito rotto (${JSON.stringify(rotto)}) torna valido`, valida(a) && a.persona === 'contadina', JSON.stringify(a))
  }
  uguale('nessun abito: quello di serie, per lui', J(normalizzaAbito(undefined, 'contadino')), J(serieLui))
  uguale('nessun abito: quello di serie, per lei', J(normalizzaAbito(null, 'contadina')), J(serieLei))
  uguale('una persona sconosciuta ripiega sul contadino', normalizzaAbito({}, 'xx').persona, 'contadino')
  const salvato = { cappello: 'berretto', maglia: 'maglione', pantalone: 'rosso', stivali: 'verdi', collo: 'sciarpa', taglio: 'ricci', capelli: 'rossi', barba: 'baffi', pelle: 'bruna' }
  const lui = normalizzaAbito(salvato, 'contadino')
  uguale('un abito sano resta com\'è', J(capiDi(lui)), J(salvato))
  const lei = normalizzaAbito(salvato, 'contadina')
  uguale('cambiando persona i capi compatibili restano', [lei.cappello, lei.pantalone, lei.stivali, lei.collo, lei.pelle].join(), 'berretto,rosso,verdi,sciarpa,bruna')
  uguale('…la maglia si riporta a quella di serie', lei.maglia, serieLei.maglia)
  uguale('…taglio, colore e barba restano (sono di tutti e due)', [lei.taglio, lei.capelli, lei.barba].join(), 'ricci,rossi,baffi')
  uguale('un abito di prima (capelli `corti-rossi`) diventa taglio corti + colore rossi', [normalizzaAbito({ capelli: 'corti-rossi' }, 'contadino').taglio, normalizzaAbito({ capelli: 'corti-rossi' }, 'contadino').capelli].join(), 'corti,rossi')
  uguale('…anche per lei: `coda-rossa` → coda + rossi', [normalizzaAbito({ capelli: 'coda-rossa' }, 'contadina').taglio, normalizzaAbito({ capelli: 'coda-rossa' }, 'contadina').capelli].join(), 'coda,rossi')
  uguale('taglio e barba nuovi si leggono, uno sconosciuto torna di serie', [normalizzaAbito({ taglio: 'ricci', barba: 'folta' }, 'contadino').taglio, normalizzaAbito({ taglio: 'zzz', barba: 'zzz' }, 'contadino').barba].join(), 'ricci,nessuna')
  controlla('l\'abito normalizzato è un\'altra copia', normalizzaAbito(salvato, 'contadino') !== salvato)
  uguale('capiDi non porta la persona', Object.keys(capiDi(lui)).join(), CATEGORIE.join())
  uguale('la chiave si rilegge (abitoDaChiave)', J(abitoDaChiave(chiaveAbito(lei))), J(lei))
  uguale('una chiave rotta non lancia', valida(abitoDaChiave('xx|||')), true)
  uguale('due abiti diversi hanno chiavi diverse', chiaveAbito(lui) !== chiaveAbito(lei) && chiaveAbito(serieLui) !== chiaveAbito(lui), true)
}

/* ══════════ 4. gli sblocchi ══════════ */
{
  const cow = opzione('cappello', 'cowboy')
  controlla('il cowboy è bloccato un livello prima e libero al suo (21: il 6 della scala vecchia, sulla scala della 2D)', cow.liv === 21 && !sbloccato(cow, cow.liv - 1) && sbloccato(cow, cow.liv))
  controlla('un pezzo senza livello è sempre libero', sbloccato(opzione('cappello', 'paglia'), 1))
  const a = abitoDiSerie('contadino')
  uguale('vestire un pezzo bloccato non cambia l\'abito', vesti(a, 'cappello', 'cowboy', cow.liv - 1), a)
  uguale('…sbloccato sì', vesti(a, 'cappello', 'cowboy', cow.liv).cappello, 'cowboy')
  uguale('un pezzo di lei a lui non si veste', vesti(a, 'cappello', 'fascia', 99), a)
  uguale('un id sconosciuto non cambia niente', vesti(a, 'cappello', 'zzz', 99), a)
  uguale('arrivano proprio al suo livello: il cowboy', abitiAl(cow.liv, true).map(p => p.id).join(), 'cowboy')
  controlla('fino al 70 sono tutti (e al 1 nessuno)', abitiAl(1).length === 0 && abitiAl(70).length === abitiAl(99).length && abitiAl(99).length >= 5)
  uguale('roba(21).abiti li raccoglie', roba(cow.liv).abiti.map(p => p.id).join(), 'cowboy')
  controlla('i pezzi del guardaroba non rendono «pieno» un livello vuoto', vuoto({ pezzi: [], edifici: [], colture: [], ricette: [], abiti: [{ id: 'x' }] }))
}

/* ══════════ 5. i nomi ══════════ */
uguale('il contadino', nomeDelContadino('contadino', 'il'), 'il contadino')
uguale('la contadina', nomeDelContadino('contadina', 'il'), 'la contadina')
uguale('Torna al contadino', `Torna ${nomeDelContadino({ persona: 'contadino' }, 'al')}`, 'Torna al contadino')
uguale('Torna alla contadina (dall\'abito)', `Torna ${nomeDelContadino(abitoDiSerie('contadina'), 'al')}`, 'Torna alla contadina')
uguale('del / dal / nome', [nomeDelContadino('contadina', 'del'), nomeDelContadino('contadino', 'dal'), nomeDelContadino('contadina', 'nome')].join(), 'della contadina,dal contadino,contadina')
uguale('qualunque cosa ripiega sul contadino', [nomeDelContadino(null), nomeDelContadino(undefined, 'al'), nomeDelContadino('xx', 'zz')].join(), 'il contadino,al contadino,il contadino')
controlla('nessun nome dice «eroe»', PERSONE_ABITO.every(p => ['nome', 'il', 'al', 'del', 'dal'].every(f => !/eroe/i.test(nomeDelContadino(p, f)))))

/* ══════════ 6. i modelli ══════════ */
const PERNI = ['gambe', 'busto', 'testa', 'bracci', 'falce', 'ascia']
const abiti = [
  abitoDiSerie('contadino'), abitoDiSerie('contadina'),
  { persona: 'contadino', cappello: 'cowboy', maglia: 'gilet', pantalone: 'verde', stivali: 'dorati', collo: 'papillon', taglio: 'corti', capelli: 'rossi', barba: 'corta', pelle: 'scura' },
  { persona: 'contadina', cappello: 'fascia', maglia: 'festa', pantalone: 'rosso', stivali: 'rossi', collo: 'scialle', taglio: 'coda', capelli: 'rossi', barba: 'nessuna', pelle: 'chiara' },
  { persona: 'contadina', cappello: 'tesa', maglia: 'grembiule', pantalone: 'giallo', stivali: 'verdi', collo: 'sciarpa', taglio: 'caschetto', capelli: 'neri', barba: 'nessuna', pelle: 'bruna' },
  { persona: 'contadino', cappello: 'berretto', maglia: 'maglione', pantalone: 'marrone', stivali: 'neri', collo: 'niente', taglio: 'corti', capelli: 'biondi', barba: 'folta', pelle: 'ambra' },
  { persona: 'contadina', cappello: 'niente', maglia: 'pois', pantalone: 'blu', stivali: 'gialli', collo: 'niente', taglio: 'trecce', capelli: 'biondi', barba: 'nessuna', pelle: 'dorata' },
  { persona: 'contadino', cappello: 'babbo', maglia: 'natale', pantalone: 'nero', stivali: 'bianchi', collo: 'sciarpa-natale', taglio: 'ricci', capelli: 'blu', barba: 'baffi', pelle: 'chiara' },
  { persona: 'contadina', cappello: 'strega', maglia: 'fiori', pantalone: 'viola', stivali: 'argento', collo: 'sciarpa-oro', taglio: 'lunghi', capelli: 'azzurri', barba: 'nessuna', pelle: 'scura' },
  { persona: 'contadino', cappello: 'cilindro', maglia: 'tuta', pantalone: 'rosa', stivali: 'azzurri', collo: 'sciarpa-azzurra', taglio: 'calvo', capelli: 'verdi', barba: 'pizzetto', pelle: 'bruna' },
  { persona: 'contadina', cappello: 'corona', maglia: 'hawaiana', pantalone: 'nero', stivali: 'dorati', collo: 'scialle', taglio: 'caschetto', capelli: 'viola', barba: 'lunga', pelle: 'ambra' },
  { persona: 'contadino', cappello: 'bandana', maglia: 'hawaiana', pantalone: 'blu', stivali: 'marroni', collo: 'niente', taglio: 'corti', capelli: 'neri', barba: 'nessuna', pelle: 'dorata' },
]
{
  let peggiorM = 0, peggiorT = 0
  for (const a of abiti) {
    const m = creaContadino(a), s = misure(m), u = m.userData, nome = `${a.persona}/${a.cappello}/${a.maglia}`
    peggiorM = Math.max(peggiorM, s.mesh); peggiorT = Math.max(peggiorT, s.triangoli)
    controlla(`${nome}: sotto i 60 mesh e i 6000 triangoli (${s.mesh}, ${s.triangoli})`, s.mesh > 5 && s.mesh <= 60 && s.triangoli <= 6000)
    controlla(`${nome}: ha i sei perni`, PERNI.every(k => u[k]) && u.gambe.length === 2 && u.bracci.length === 2)
    controlla(`${nome}: i piedi stanno a terra`, Math.abs(s.sotto) < 0.02, String(s.sotto))
    controlla(`${nome}: alto e largo come un contadino (${s.altezza.toFixed(2)} × ${s.larghezza.toFixed(2)})`, s.altezza > 0.9 && s.altezza < 1.6 && s.larghezza < 0.95 && s.lunghezza < 0.95)
    let nan = 0; m.traverse(o => { if (o.isMesh) { const p = o.geometry.attributes.position; for (let i = 0; i < p.array.length; i++) if (!Number.isFinite(p.array[i])) nan++ } })
    uguale(`${nome}: nessun numero sbagliato nelle geometrie`, nan, 0)
    uguale(`${nome}: la persona è quella dell'abito`, u.aspetto, a.persona)
    controlla(`${nome}: falce e ascia nascoste, tutto dentro la scena`, !u.falce.visible && !u.ascia.visible)
  }
  console.log(`  il peggiore: ${peggiorM} mesh, ${peggiorT} triangoli`)
  const lei = creaContadino(abitoDiSerie('contadina')), cap = creaContadino({ ...abitoDiSerie('contadina'), cappello: 'niente' })
  controlla('senza cappello ha meno triangoli', misure(cap).triangoli < misure(lei).triangoli)
  controlla('il cappello sta dentro la testa (perno): senza, la testa ha meno triangoli', (() => { const t = m => { let n = 0; m.userData.testa.traverse(o => { if (o.isMesh) n += o.geometry.index.count / 3 }); return n }; return t(lei) > t(cap) })())
}

/* ══════════ 7. la cache ══════════ */
{
  svuotaCache()
  const a = creaContadino(abiti[2]), b = creaContadino(abiti[2]), c = creaContadino(abiti[3])
  controlla('lo stesso abito: un clone diverso (due oggetti)', a !== b)
  const geo = m => { const l = []; m.traverse(o => { if (o.isMesh) l.push(o.geometry) }); return l }
  controlla('…che condivide le geometrie', geo(a).every((x, i) => geo(b)[i] === x))
  controlla('un altro abito ha altre geometrie', geo(a).some((x, i) => geo(c)[i] !== x))
  uguale('«contadino» è l\'abito di serie', misure(creaContadino('contadino')).mesh, misure(creaContadino(abitoDiSerie('contadino'))).mesh)
  controlla('un abito rotto dà il modello di serie, senza lanciare', (() => { const r = creaContadino({ cappello: 'zzz', persona: 'contadina' }); return !!r.userData.testa })())
  uguale('le due persone hanno la faccia diversa (due chiavi)', creaContadino('contadina').userData.aspetto + creaContadino('contadino').userData.aspetto, 'contadinacontadino')
  const un = creaContadino(abiti[2]); un.position.set(5, 0, 5)
  controlla('toccare un clone non tocca gli altri', creaContadino(abiti[2]).position.x === 0)
}
/* ══════════ 8. i pezzi a pagamento ══════════ */
{
  const lui = abitoDiSerie('contadino'), cil = opzione('cappello', 'cilindro'), babbo = opzione('cappello', 'babbo')
  controlla('l\'abito di serie è tutto gratis', daComprare(lui).length === 0)
  uguale('un cilindro in testa da comprare costa 18', daComprare({ ...lui, cappello: 'cilindro' }).reduce((n, o) => n + o.prezzo, 0), 18)
  uguale('…già nell\'armadio non costa', daComprare({ ...lui, cappello: 'cilindro' }, { [chiaveCapo('cappello', 'cilindro')]: true }).length, 0)
  uguale('l\'armadio butta il gratis e l\'inesistente', J(armadioInForma({ 'cappello:paglia': true, 'cappello:zzz': true, 'cappello:cilindro': true, 'cappello:bandana': false, 'x': 1 })), J({ 'cappello:cilindro': true }))
  uguale('l\'armadio di un salvataggio rotto è vuoto', J([null, [], 5, 'x'].map(armadioInForma)), J([{}, {}, {}, {}]))
  uguale('un pezzo a pagamento è in vendita', statoDelPezzo('cappello', cil), 'in-vendita')
  uguale('…comprato è tuo', statoDelPezzo('cappello', cil, { armadio: { 'cappello:cilindro': true } }), 'mio')
  uguale('uno di Natale fuori stagione non si compra', statoDelPezzo('cappello', babbo, { stagione: '' }), 'fuori-stagione')
  uguale('…a Natale sì', statoDelPezzo('cappello', babbo, { stagione: 'natale' }), 'in-vendita')
  controlla('fuori stagione non si mostra, a Natale sì', !scelteDi('cappello', 'contadino', {}).some(o => o.id === 'babbo') && scelteDi('cappello', 'contadino', { stagione: 'natale' }).some(o => o.id === 'babbo'))
  controlla('…comprato resta in vista tutto l\'anno', scelteDi('cappello', 'contadino', { armadio: { 'cappello:babbo': true } }).some(o => o.id === 'babbo'))
  const motoreCon = (monete, liv = 70) => {
    const b = { monete }, f = new Fattoria3d({ borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1e12, rnd: () => 0.5 })
    f.s.esperienza = Math.max(f.s.esperienza, sogliaDi(liv)); return { f, b }
  }
  { const { f, b } = motoreCon(100), r = f.compraAbito({ ...lui, cappello: 'cilindro', capelli: 'blu' })
    controlla('si compra: 18 + 10 monete, due pezzi', r.ok && r.costo === 28 && b.monete === 72 && r.comprati.length === 2, J(r))
    controlla('…stanno nell\'armadio', f.s.armadio['cappello:cilindro'] && f.s.armadio['capelli:blu'])
    uguale('…e la seconda volta non costa', f.compraAbito({ ...lui, cappello: 'cilindro' }).costo, 0)
    uguale('…monete intatte', b.monete, 72) }
  { const { f, b } = motoreCon(20), r = f.compraAbito({ ...lui, cappello: 'cilindro', capelli: 'blu' })
    controlla('poche monete: tutto o niente', !r.ok && r.motivo === 'poche-monete' && r.costo === 28 && b.monete === 20 && !Object.keys(f.s.armadio).length, J(r)) }
  { const { f } = motoreCon(100), r = f.compraAbito({ ...lui, cappello: 'babbo' })
    controlla('un pezzo di Natale fuori stagione si rifiuta', !r.ok && r.motivo === 'fuori-stagione', J(r))
    controlla('…a Natale si compra', f.compraAbito({ ...lui, cappello: 'babbo' }, { stagione: 'natale' }).ok) }
  { const { f } = motoreCon(100, 2), r = f.compraAbito({ ...lui, cappello: 'corona' })
    controlla('un pezzo di livello non si compra', !r.ok && r.motivo === 'bloccato', J(r))
    controlla('un pezzo di lei a lui si rifiuta', !f.compraAbito({ ...lui, maglia: 'fiori' }).ok) }
  { const { f } = motoreCon(100); f.compraAbito({ ...lui, cappello: 'cilindro' })
    const e = JSON.parse(JSON.stringify(f.s)), d = new Fattoria3d({ stato: e, borsa: { quante: () => 0, paga: () => true }, ora: () => 1e12, rnd: () => 0.5 })
    controlla('l\'armadio sopravvive al salvataggio', d.s.armadio['cappello:cilindro'] === true) }
}
// ── il guardaroba sopra l'interfaccia unica (dati/guardaroba-voci.js, docs/core/personalizza.md) ──
{
  for (const p of PERSONE_ABITO) {
    const ab = abitoDiSerie(p)
    uguale(`${p}: dall'abito ai valori e ritorno senza perdere niente`, chiaveAbito(abitoDeiValori(valoriDellAbito(ab), p)), chiaveAbito(ab))
  }
  const voci = vociDelGuardaroba('contadina', { livello: 1, armadio: {}, stagione: '' }), v = id => voci.find(x => x.id === id)
  controlla('ogni voce ha un id solo', new Set(voci.map(x => x.id)).size === voci.length)
  controlla('chi sei: la contadina e il contadino, mai «sesso»', v('contadina') && v('contadino') && !voci.some(x => /sesso|maschio|femmina/i.test(x.nome)))
  controlla('i capelli: il taglio è la forma, il colore il colore', v('capelli').forme.length > 1 && v('capelli').colori.length > 1)
  controlla('al collo il fazzoletto è un oggetto coi suoi colori', v('collo:fazzoletto') && v('collo:fazzoletto').colori.length === 3)
  controlla('«niente al collo» non ha scelte', v('collo:niente') && v('collo:niente').niente)
  controlla('il cilindro si paga e non è tuo', v('cappello:cilindro').prezzo > 0 && !v('cappello:cilindro').posseduto)
  controlla('…comprato, è tuo', vociDelGuardaroba('contadina', { livello: 1, armadio: { 'cappello:cilindro': true } }).find(x => x.id === 'cappello:cilindro').posseduto)
  controlla('il cowboy ha il suo livello', v('cappello:cowboy').liv > 1)
  controlla('i bersagli dei test restano: data-capo', v('cappello:cilindro').dati['data-capo'] === 'cappello:cilindro' && v('stivali').colori.some(c => c.dati['data-capo'] === 'stivali:rossi'))
  const vv = vestitiInForma([{ posto: 0, nome: 'Festa della nonna Rosa', persona: 'contadina', capi: { cappello: 'cilindro' } }, { posto: 0, nome: 'doppio', persona: 'contadina' },
    { posto: 0, nome: 'Lui', persona: 'contadino', capi: {} }, { posto: 7, nome: 'fuori', persona: 'contadina' }, { posto: 1, nome: 'x', persona: 'zzz' }])
  uguale('i set salvati: uno per posto e per persona, gli storti via', vv.length, 2)
  uguale('il nome si accorcia', vv.find(x => x.persona === 'contadina').nome, 'Festa della nonn')
  uguale('i capi si rimettono in forma', vv.find(x => x.persona === 'contadina').capi.cappello, 'cilindro')
}
riassunto('fattoria3d-guardaroba')
