/* Verifica del guardaroba della fattoria 3D, senza browser: i dati (abiti.js), il genere dal profilo, la normalizzazione di un abito rotto,
   gli sblocchi per livello, i nomi «il contadino / la contadina», i modelli con abiti diversi (mesh, triangoli, ingombro, perni, nessun NaN)
   e la cache. `node test/esegui.mjs fattoria3d-guardaroba`
   tempo: 1 */
import { CATEGORIE, PERSONE_ABITO, personaDi, nomeDelContadino, opzioniDi, opzione, sbloccato, abitoDiSerie, valida, normalizzaAbito, capiDi, chiaveAbito,
  abitoDaChiave, vesti, abitiAl, guastiDegliAbiti } from '../../src/giochi/fattoria3d/dati/abiti.js'
import { roba, vuoto, guastiDeiLivelli } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

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
    controlla(`${p}/${c}: da 3 a 8 scelte (${n})`, n >= 3 && n <= 8)
  }
}
controlla('lei ha i capelli a trecce e la fascia, lui no', opzioniDi('capelli', 'contadina').some(o => o.stile === 'trecce') && !opzioniDi('capelli', 'contadino').some(o => o.stile === 'trecce')
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
  const salvato = { cappello: 'berretto', maglia: 'maglione', pantalone: 'rosso', stivali: 'verdi', collo: 'sciarpa', capelli: 'corti-rossi', pelle: 'bruna' }
  const lui = normalizzaAbito(salvato, 'contadino')
  uguale('un abito sano resta com\'è', J(capiDi(lui)), J(salvato))
  const lei = normalizzaAbito(salvato, 'contadina')
  uguale('cambiando persona i capi compatibili restano', [lei.cappello, lei.pantalone, lei.stivali, lei.collo, lei.pelle].join(), 'berretto,rosso,verdi,sciarpa,bruna')
  uguale('…la maglia si riporta a quella di serie', lei.maglia, serieLei.maglia)
  uguale('…i capelli cercano lo stesso colore (rossi)', opzione('capelli', lei.capelli).colore, 'rossi')
  uguale('un colore che lei non ha ripiega su quello di serie (biondi ce li ha, ma neri→coda o caschetto)', opzione('capelli', normalizzaAbito({ capelli: 'corti-neri' }, 'contadina').capelli).colore, 'neri')
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
  controlla('fino al 46 sono tutti (e al 1 nessuno)', abitiAl(1).length === 0 && abitiAl(46).length === abitiAl(99).length && abitiAl(99).length >= 5)
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
  { persona: 'contadino', cappello: 'cowboy', maglia: 'gilet', pantalone: 'verde', stivali: 'dorati', collo: 'papillon', capelli: 'corti-rossi', pelle: 'scura' },
  { persona: 'contadina', cappello: 'fascia', maglia: 'festa', pantalone: 'rosso', stivali: 'rossi', collo: 'scialle', capelli: 'coda-rossa', pelle: 'chiara' },
  { persona: 'contadina', cappello: 'tesa', maglia: 'grembiule', pantalone: 'giallo', stivali: 'verdi', collo: 'sciarpa', capelli: 'caschetto-nero', pelle: 'bruna' },
  { persona: 'contadino', cappello: 'berretto', maglia: 'maglione', pantalone: 'marrone', stivali: 'neri', collo: 'niente', capelli: 'corti-biondi', pelle: 'ambra' },
  { persona: 'contadina', cappello: 'niente', maglia: 'pois', pantalone: 'blu', stivali: 'gialli', collo: 'niente', capelli: 'trecce-bionde', pelle: 'dorata' },
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
riassunto('fattoria3d-guardaroba')
