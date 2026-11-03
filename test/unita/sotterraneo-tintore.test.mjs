/* ═══════════════════════════════════════════════════════════════════
   IL TINTORE — docs/sotterraneo/tintore.md

   Ritingere un pezzo costa COSTO gemme e il colore segue il pezzo: nella
   roba salvata (`tinte`, campo assente = nessuna tinta, i salvataggi di
   prima si aprono com'erano), in tasca e addosso. In 3D le copie tinte
   non toccano i materiali e le geometrie di serie, e la tinta sta nella
   chiave del ritratto.
   ═══════════════════════════════════════════════════════════════════ */
import { TINTE, TINTA_DI, COSTO, rileggiTinte, sipuoTingere, tinteAddosso } from '../../src/giochi/sotterraneo/dati/tinte.js'
import { Corredo, rileggiRoba, ROBA_VUOTA } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { tingi, togliLaTinta, pezziDaTingere } from '../../src/giochi/sotterraneo/motore/tintore.js'
import { dotazioneDi, chiaveDellEroe, leggiChiave } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { spostaColore, tingiGruppo } from '../../src/giochi/sotterraneo/scena3d/tinge3d.js'
import { vestiEroe } from '../../src/giochi/sotterraneo/scena3d/eroe3d.js'
import { creaEroeDa } from '../../src/giochi/sotterraneo/scena3d/eroe-aspetto.js'
import { controlla, uguale as ugualeStretto, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// valori composti: si confrontano come testo
const uguale = (cosa, avuto, atteso) => (typeof atteso === 'object' && atteso !== null ? ugualeStretto(cosa, JSON.stringify(avuto), JSON.stringify(atteso)) : ugualeStretto(cosa, avuto, atteso))

const c2d = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true })
globalThis.document = globalThis.document || { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) }

// i dati
controlla('quindici colori standard (bianco, nero, grigio, marrone…), tutti con nome e css', TINTE.length === 15 && ['bianco', 'nero', 'grigio', 'marrone'].every(id => TINTE.some(t => t.id === id)) && TINTE.every(t => t.nome && /^#[0-9a-f]{6}$/.test(t.css)))
controlla('il prezzo è «qualcosina»: fra 20 e 30', COSTO >= 20 && COSTO <= 30, String(COSTO))
controlla('si ritingono arma, scudo, armatura, cappello; non una pozione né un anello', sipuoTingere('spada-corta') && sipuoTingere('panciotto') && !sipuoTingere('pozione-piccola') && !sipuoTingere('anello-verde'))
uguale('una tinta che non c\'è e un pezzo che non si tinge si buttano', rileggiTinte({ 'spada-corta': 'rosso', panciotto: 'ocra', 'pozione-piccola': 'blu', fantasma: 'rosa' }), { 'spada-corta': 'rosso' })

// la roba
const base = { ...ROBA_VUOTA(), gemme: 100, mano: 'spada-corta', zaino: ['panciotto'] }
const vecchia = rileggiRoba(base)
controlla('senza il campo, nessuna tinta e la roba è quella di prima', vecchia && !('tinte' in vecchia) && !('tinte' in new Corredo({ roba: base }).roba))
const c = new Corredo({ eroe: 'cavaliere', roba: base })
uguale('la spada si ritinge: costa COSTO', tingi(c, 'spada-corta', 'rosso'), { che: 'tinto', cosa: 'spada-corta', tinta: 'rosso', gemme: 100 - COSTO })
uguale('le gemme sono scalate', c.gemme, 100 - COSTO)
uguale('un secondo giro con lo stesso colore non paga', tingi(c, 'spada-corta', 'rosso'), { che: 'niente', perche: 'uguale' })
uguale('un colore che non c\'è non paga', tingi(c, 'spada-corta', 'fucsia').perche, 'tinta')
uguale('un pezzo che non si ha non si ritinge', tingi(c, 'spada', 'blu').perche, 'pezzo')
uguale('la veste nello zaino si ritinge', tingi(c, 'panciotto', 'viola').che, 'tinto')
uguale('senza gemme no, e non si tocca niente', (() => { const p = new Corredo({ roba: { ...base, gemme: COSTO - 1 } }); return [tingi(p, 'spada-corta', 'blu').perche, p.gemme, p.tintaDi('spada-corta')] })(), ['gemme', COSTO - 1, null])
const salvata = rileggiRoba(JSON.parse(JSON.stringify(c.roba)))
uguale('la tinta passa dal salvataggio', salvata.tinte, { 'spada-corta': 'rosso', panciotto: 'viola' })
const d = new Corredo({ eroe: 'cavaliere', roba: JSON.parse(JSON.stringify(salvata)) })
uguale('e la riprende il corredo', [d.tintaDi('spada-corta'), d.tintaDi('panciotto')], ['rosso', 'viola'])
d.indossaDallaTasca(0)
uguale('il pezzo messo addosso tiene il suo colore', [d.corpo, d.tintaDi('panciotto')], ['panciotto', 'viola'])
d.riponi('mano')
uguale('e rimesso in tasca anche', [d.zaino.includes('spada-corta'), d.roba.tinte['spada-corta']], [true, 'rosso'])
d.zaino = d.zaino.filter(k => k !== 'spada-corta')
controlla('un pezzo venduto si porta via la sua tinta', !('spada-corta' in (d.roba.tinte || {})))
uguale('togliere la tinta si paga come una tintura', (() => { const p = new Corredo({ roba: salvata }); const g = p.gemme; const e = togliLaTinta(p, 'spada-corta'); return [e.che, g - p.gemme, p.tintaDi('spada-corta')] })(), ['tinto', COSTO, null])
stessaLista('i pezzi da ritingere: prima quelli addosso', pezziDaTingere(new Corredo({ eroe: 'cavaliere', roba: salvata })).map(p => `${p.k}:${p.addosso}:${p.tinta}`), ['spada-corta:true:rosso', 'serie-cavaliere:true:null', 'panciotto:false:viola'])   // il copricapo di serie è un pezzo, e si ritinge
// il copricapo di serie (docs/sotterraneo/elmo.md): un pezzo vero, anche ritinto

// la chiave del ritratto
const roba = { mano: 'spada-corta', corpo: 'panciotto', tinte: { 'spada-corta': 'rosso', panciotto: 'blu' } }
const k0 = chiaveDellEroe('cavaliere', { mano: 'spada-corta', corpo: 'panciotto' })
const k1 = chiaveDellEroe('cavaliere', roba)
controlla('senza tinte la chiave è quella di prima, con le tinte è diversa', k1 !== k0 && k1.startsWith(k0) && k1.endsWith(':@rosso.-.blu.-'), k1)
const l = leggiChiave(k1)
uguale('e si rilegge', [l.tinte.destra, l.tinte.corpo, l.destra && true], ['rosso', 'blu', true])
uguale('una chiave di prima non ha tinte', leggiChiave(k0).tinte, undefined)
uguale('dotazioneDi', dotazioneDi(roba).tinte, { destra: 'rosso', sinistra: null, corpo: 'blu', testa: null })
uguale('tinteAddosso', tinteAddosso({ ...roba, mancina: null, testa: null }).mano, 'rosso')

// il colore
const rosso = spostaColore(0.8, 0.1, 0.1, 'blu'), grigio = spostaColore(0.5, 0.5, 0.5, 'blu'), nero = spostaColore(0, 0, 0, 'blu')
controlla('un rosso diventa blu (il canale blu è il più forte)', rosso.b > rosso.r && rosso.b > rosso.g, JSON.stringify(rosso))
controlla('il grigio vira appena', grigio.b > grigio.r && grigio.b < 0.6 && grigio.r > 0.25, JSON.stringify(grigio))
uguale('il nero resta nero', nero, { r: 0, g: 0, b: 0 })
// bianco e nero hanno una luce, non una tinta: un colore medio diventa chiaro o scuro, il metallo un po'
const chiaro = spostaColore(0.5, 0.2, 0.2, 'bianco'), scuro = spostaColore(0.5, 0.2, 0.2, 'nero'), metalloBianco = spostaColore(0.5, 0.5, 0.5, 'bianco')
controlla('il bianco schiarisce un colore', chiaro.r > 0.85 && chiaro.g > 0.5, JSON.stringify(chiaro))
controlla('il nero lo scurisce', scuro.r < 0.2 && scuro.g < 0.1, JSON.stringify(scuro))
controlla('sul metallo il bianco agisce meno', metalloBianco.r > 0.5 && metalloBianco.r < chiaro.r, JSON.stringify(metalloBianco))

// il 3D: la copia è tinta, l'originale no
const g = creaEroeDa('cavaliere')
const prima = new Set(); g.traverse(o => { if (o.isMesh) prima.add(o.material) })
const colori = new Map(); g.traverse(o => { if (o.isMesh) colori.set(o.material, o.material.color.getHex()) })
const togli = vestiEroe(g, roba)
const dopo = []; g.traverse(o => { if (o.isMesh) dopo.push(o) })
controlla('i materiali di serie non sono stati toccati', [...colori].every(([m, h]) => m.color.getHex() === h))
const tinto = new Set(); for (const o of dopo) if (!prima.has(o.material) && !o.material.vertexColors) tinto.add(o.material.color.getHex())
controlla('l\'armatura tinta ha materiali nuovi', tinto.size > 0)
togli()
const g2 = creaEroeDa('cavaliere'); vestiEroe(g2, { mano: 'spada-corta' })
let n1 = 0, n2 = 0
g2.traverse(o => { if (o.isMesh && o.geometry.attributes.color) n1++ })
const g3 = creaEroeDa('cavaliere'); vestiEroe(g3, { mano: 'spada-corta', tinte: { 'spada-corta': 'rosso' } })
const gs2 = new Set(); g2.traverse(o => { if (o.isMesh) gs2.add(o.geometry) })
g3.traverse(o => { if (o.isMesh && o.geometry.attributes.color && !gs2.has(o.geometry)) n2++ })
controlla('la lama ha il colore nei vertici: ne esce una geometria nuova, quella di serie resta', n1 > 0 && n2 > 0, `${n1} ${n2}`)

riassunto('il tintore')
