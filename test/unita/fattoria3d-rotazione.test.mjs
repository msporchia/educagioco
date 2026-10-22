/* Ruotare i pezzi (docs/fattoria3d/rotazione.md): le misure girate, l'ingombro che segue, il rifiuto se non ci sta, la rotazione nello stato
   (e i vecchi stati senza), il davanti di un edificio che gira, il fantasma e il tasto ↻. Senza browser. `node test/esegui.mjs fattoria3d-rotazione`
   tempo: 1 */
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { Pezzi } = await import('../../src/giochi/fattoria3d/scena3d/pezzi.js')
const { Mondo3d } = await import('../../src/giochi/fattoria3d/scena3d/mondo3d.js')
const { Costruzione } = await import('../../src/giochi/fattoria3d/scena3d/costruzione.js')
const { Fattoria3d } = await import('../../src/giochi/fattoria3d/motore/fattoria3d.js')
const { normalizza } = await import('../../src/giochi/fattoria3d/motore/stato.js')
const { sogliaDi } = await import('../../src/giochi/fattoria3d/dati/livelli.js')
const { PEZZI, EDIFICI } = await import('../../src/giochi/fattoria3d/dati/catalogo.js')
const { chiave } = await import('../../src/giochi/fattoria3d/dati/mondo.js')
const { ruotabile, misureGirate, rotLetta, DAVANTI } = await import('../../src/giochi/fattoria3d/dati/rotazione.js')

const nuova = (stato = null) => {
  const b = { monete: 5000 }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  f.s.esperienza = Math.max(f.s.esperienza || 0, sogliaDi(70))
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  return { f, b }
}
/** Il primo posto dove un pezzo (con la sua rotazione, e col giro di cella attorno libero) ci sta: i test non dipendono da dove sono i sassi. */
const posto = (f, tipo, rot = 0, margine = 1) => {
  const d = f.misure(tipo, rot)
  for (let j = -3; j < 8; j++) for (let i = -7; i < 5; i++) {
    if (!f.puoMettere(tipo, i, j, 0, rot).ok) continue
    let ok = true
    for (let a = -margine; a < d.w + margine && ok; a++) for (let b = -margine; b < d.d + margine && ok; b++) if (!f.libera(i + a, j + b) && !(a >= 0 && a < d.w && b >= 0 && b < d.d)) ok = false
    if (ok) return [i, j]
  }
  throw new Error('nessun posto per ' + tipo)
}
const celleDi = (f, id) => { const out = []; for (let i = -6; i < 12; i++) for (let j = -6; j < 16; j++) if (f.cellaCosa.get(chiave(i, j)) === id) out.push([i, j]); return out }

/* ══════════ 1. cosa si gira ══════════ */
controlla('un campo, l\'acqua, i ponti, i moli e il porticciolo non si girano', ['campo', 'stagno', 'laghetto', 'ponte', 'passerella', 'molo', 'molo_v', 'porticciolo'].every(t => !ruotabile(t)))
controlla('la panchina, il pollaio, la stalla, il tavolo e ogni edificio si girano', ['panchina', 'pollaio', 'stalla', 'tavolo', 'bacheca', ...Object.keys(EDIFICI)].every(ruotabile))
controlla('un tipo che non esiste non si gira', !ruotabile('niente'))
{
  const m = misureGirate('pollaio', PEZZI.pollaio)
  controlla('un pollaio girato è 2×3 e il resto delle misure non cambia', m.w === 2 && m.d === 3 && m.prezzo === PEZZI.pollaio.prezzo && PEZZI.pollaio.w === 3)
}
uguale('rotLetta: un intero qualunque diventa 0–3', [rotLetta(5), rotLetta(-1), rotLetta(2)].join(), '1,3,2')
controlla('rotLetta: il resto vale 0', [rotLetta(undefined), rotLetta('1'), rotLetta(1.5), rotLetta(null), rotLetta({})].every(r => r === 0))
controlla('i davanti sono quattro, a quarti di giro', DAVANTI.length === 4 && DAVANTI.every(([x, z]) => Math.abs(x) + Math.abs(z) === 1))

/* ══════════ 2. il motore: l'ingombro segue ══════════ */
{
  const { f, b } = nuova()
  const [pi, pj] = posto(f, 'pollaio', 1, 2)
  const r = f.compraEMetti('pollaio', pi, pj)
  const id = r.cosa.id
  uguale('un pollaio nuovo non ha rotazione', 'rot' in r.cosa, false)
  uguale('occupa sei celle, 3×2', celleDi(f, id).length, 6)
  controlla('(i+2, j) è sua, (i, j+2) no', f.cellaCosa.get(chiave(pi + 2, pj)) === id && f.cellaCosa.get(chiave(pi, pj + 2)) !== id)
  const prima = b.monete
  const g = f.ruotaPezzo(id)
  controlla('girare costa una moneta e riesce', g.ok && g.costo === 1 && b.monete === prima - 1)
  uguale('rot 1', f.cosa(id).rot, 1)
  const c = f.cosa(id)
  stessaLista('ora è 2×3', [f.misureCosa(c).w, f.misureCosa(c).d], [2, 3])
  uguale('sempre sei celle', celleDi(f, id).length, 6)
  controlla('il centro resta (a mezza cella)', Math.abs(c.i + 1 - (pi + 1.5)) <= 0.5 && Math.abs(c.j + 1.5 - (pj + 1)) <= 0.5)
  controlla('la cella che era sua e ora no, è libera davvero', celleDi(f, id).some(([i, j]) => i === pi + 2 && j === pj) || !f.occupata(pi + 2, pj))
  f.ruotaPezzo(id); f.ruotaPezzo(id); f.ruotaPezzo(id)
  uguale('quattro quarti di giro tornano dritti (e senza chiave)', 'rot' in f.cosa(id), false)
  controlla('e il pollaio non è andato lontano', Math.abs(f.cosa(id).i - pi) <= 1 && Math.abs(f.cosa(id).j - pj) <= 1)
}
{
  // due panchine in fila: la prima, girando, finirebbe sull'altra
  const { f, b } = nuova()
  const [bi, bj] = posto(f, 'panchina', 1, 2)
  const p1 = f.compraEMetti('panchina', bi, bj).cosa
  // girata (1×2) potrebbe prendere una di quattro coppie di celle (a ogni modo di arrotondare il centro): quattro aiuole le chiudono tutte
  for (const [di, dj] of [[1, -1], [1, 1], [0, 1], [0, -1]]) f.compraEMetti('aiuola', bi + di, bj + dj)
  const prima = b.monete
  const r = f.ruotaPezzo(p1.id)
  controlla('una panchina che girando finirebbe sull\'altra resta com\'è, e non costa', !r.ok && r.motivo === 'occupato' && !('rot' in f.cosa(p1.id)) && f.cosa(p1.id).i === bi && b.monete === prima)
}
{
  const { f } = nuova()
  const campo = f.cose.find(c => c.tipo === 'campo')
  const r = f.ruotaPezzo(campo.id)
  controlla('un campo non gira', !r.ok && r.motivo === 'non-ruotabile')
  uguale('una cosa che non c\'è', f.ruotaPezzo(9999).motivo, 'sconosciuto')
}
{
  // comprare e mettere già girato; spostare e girare insieme
  const { f } = nuova()
  const [si, sj] = posto(f, 'stalla', 1, 0)
  const r = f.compraEMetti('stalla', si, sj, 1)
  uguale('una stalla messa girata è 3×4', f.misureCosa(r.cosa).w + 'x' + f.misureCosa(r.cosa).d, '3x4')
  uguale('e ricorda la rotazione', r.cosa.rot, 1)
  controlla('puoMettere sa la rotazione: sopra la stalla non si mette un\'altra', !f.puoMettere('stalla', si, sj, 0, 1).ok)
  const [ni, nj] = posto(f, 'stalla', 0, 0)
  const s = f.spostaPezzo(r.cosa.id, ni, nj, { rot: 0 })
  controlla('spostare e raddrizzare insieme: una moneta sola', s.ok && s.costo === 1 && !('rot' in f.cosa(r.cosa.id)))
  uguale('niente da fare, niente da pagare', f.spostaPezzo(r.cosa.id, ni, nj, { rot: 0 }).costo, 0)
  controlla('messa via e rimessa, è dritta', f.mettiVia(r.cosa.id, { forza: true }).ok && !('rot' in f.mettiPezzo('stalla', ni, nj).cosa))
}
{
  const { f } = nuova()
  const [mi, mj] = posto(f, 'mulino', 1, 0)
  const e = f.compraEMetti('mulino', mi, mj, 1).cosa
  uguale('un edificio girato resta uno per tipo', f.compraEMetti('mulino', mi, mj).motivo, 'gia-tuo')
  uguale('e ricorda il quarto di giro', e.rot, 1)
}

/* ══════════ 3. lo stato: normalizza non lancia mai, i vecchi stati si leggono ══════════ */
{
  const { f } = nuova()
  const [pi, pj] = posto(f, 'pollaio', 1, 0)
  const p = f.compraEMetti('pollaio', pi, pj, 1).cosa
  const [ti, tj] = posto(f, 'tavolo', 0, 0)
  const t = f.compraEMetti('tavolo', ti, tj).cosa
  const [mi, mj] = posto(f, 'mulino', 3, 0)
  f.compraEMetti('mulino', mi, mj, 3)
  const apri = s => new Fattoria3d({ stato: s, borsa: { quante: () => 0, paga: () => true }, ora: () => 1_000_000, rnd: () => 0.5 })
  const g = apri(JSON.parse(JSON.stringify(f.s)))
  uguale('la rotazione sopravvive al salvataggio', g.cosa(p.id).rot, 1)
  uguale('e anche quella di un edificio', g.cose.find(c => c.tipo === 'mulino').rot, 3)
  uguale('chi non è girato non ha la chiave', 'rot' in g.cosa(t.id), false)
  stessaLista('l\'ingombro riletto è quello girato', [g.misureCosa(g.cosa(p.id)).w, g.misureCosa(g.cosa(p.id)).d], [2, 3])
  uguale('e le celle sono sei', celleDi(g, p.id).length, 6)
  const vecchio = JSON.parse(JSON.stringify(f.s)); for (const c of vecchio.cose) delete c.rot
  controlla('un vecchio stato senza rot si legge com\'era (tutto dritto)', apri(vecchio).cose.every(c => !('rot' in c)))
  for (const brutto of [7, -1, '2', 1.5, NaN, null, {}, [], true]) {
    const sporco = JSON.parse(JSON.stringify(f.s)); sporco.cose.find(c => c.tipo === 'tavolo').rot = brutto
    let ok = true, rot
    try { rot = normalizza(sporco).cose.find(c => c.tipo === 'tavolo').rot } catch (x) { ok = false }
    controlla('normalizza non lancia con rot ' + JSON.stringify(brutto), ok && (rot === undefined || (Number.isInteger(rot) && rot >= 0 && rot < 4)), 'rot: ' + rot)
  }
  const strano = JSON.parse(JSON.stringify(f.s)); strano.cose.find(c => c.tipo === 'tavolo').rot = 9
  uguale('un rot grande si riduce (9 → 1)', normalizza(strano).cose.find(c => c.tipo === 'tavolo').rot, 1)
  const campo = JSON.parse(JSON.stringify(f.s)); campo.cose.find(c => c.tipo === 'campo').rot = 1
  uguale('un campo con rot nello stato lo butta', 'rot' in normalizza(campo).cose.find(c => c.tipo === 'campo'), false)
}

/* ══════════ 4. la scena: il gruppo gira, e il davanti con lui ══════════ */
{
  const { f } = nuova()
  const badge = () => ({ el: { hidden: false, style: {} }, testo: '', imposta() {}, togli() {}, metti() {}, bestie() {} })
  const p = new Pezzi(new THREE.Scene(), f, { nuovoBadge: badge, nuovoCartello: badge, fumata() {} }, { proietta: () => [0, 0, true] }, { vento: false })
  const [qi, qj] = posto(f, 'pollaio', 1, 1)
  const r = f.compraEMetti('pollaio', qi, qj, 1)
  p.sincronizza()
  const v = p.voce(r.cosa.id)
  controlla('il gruppo nasce girato di un quarto', Math.abs(v.grp.rotation.y - Math.PI / 2) < 1e-9)
  stessaLista('e sta al centro dell\'ingombro girato (2×3)', [v.grp.position.x, v.grp.position.z], [r.cosa.i + 1, r.cosa.j + 1.5])
  f.ruotaPezzo(r.cosa.id); p.sincronizza()
  const dopo = f.cosa(r.cosa.id), w = p.voce(dopo.id)
  controlla('girando ancora il gruppo segue, con le misure nuove', Math.abs(w.grp.rotation.y - Math.PI) < 1e-9 && w.d.w === 3 && w.d.d === 2)
  stessaLista('il centro per la camera e per l\'eroe è quello girato', [p.centroDi({ kind: 'cosa', id: dopo.id }).x, p.centroDi({ kind: 'cosa', id: dopo.id }).z], [dopo.i + 1.5, dopo.j + 1])
}
{
  // il davanti di un edificio gira: rot 0 → +z; 1 → +x; 2 → −z; 3 → −x
  const servi = rot => {
    const g = nuova().f
    const [i, j] = posto(g, 'mulino', rot, 1)
    const c = g.compraEMetti('mulino', i, j, rot).cosa
    return { celle: Mondo3d.prototype.celleDiServizio.call({ m: g }, { kind: 'cosa', id: c.id }), i, j }
  }
  const tutte = (s, k) => s.celle.length > 0 && s.celle.every(([i, j]) => k(i - s.i, j - s.j))
  controlla('rot 0: si serve dal lato +z', tutte(servi(0), (a, b) => b === 3))
  controlla('rot 1: dal lato +x', tutte(servi(1), (a, b) => a === 3))
  controlla('rot 2: dal lato −z', tutte(servi(2), (a, b) => b === -1))
  controlla('rot 3: dal lato −x', tutte(servi(3), (a, b) => a === -1))
}

/* ══════════ 5. il fantasma e il tasto ↻ ══════════ */
{
  const { f } = nuova()
  const info = []
  const fant = new THREE.Group()
  const ctxC = {
    m: f, ui: { zonaDrop: () => null, trascinando: i => info.push(i), avviso() {}, cambio() {} }, fx: { parla() {}, scoppietta() {} },
    scena: new THREE.Scene(), terreno: { mostraGriglia() {} }, pezzi: { nascondi() {}, sincronizza() {}, fanNascere() {}, centroDi: () => new THREE.Vector3() },
    cmd: {}, puntaSuolo: (x, y) => ({ x: x / 10, z: y / 10 }), camera: { x: 0, z: 0 }, rettangolo: () => ({ left: 0, right: 1000, top: 0, bottom: 1000 }),
    creaFantasma: () => fant, cambiato() {},
  }
  const co = new Costruzione(ctxC)
  const [fi, fj] = posto(f, 'pollaio', 1, 1)
  co.parcheggia('pollaio', fi, fj + 1)
  uguale('il fantasma di un pollaio è dritto', fant.rotation.y, 0)
  controlla('e il tasto ↻ c\'è', info[info.length - 1].ruotabile === true)
  controlla('ruota() gira il fantasma', co.ruota() && Math.abs(fant.rotation.y - Math.PI / 2) < 1e-9 && co.D.rot === 1)
  stessaLista('e tiene il centro (3×2 → 2×3)', [co.D.i, co.D.j], [Math.round(fi + 1.5 - 1), Math.round(fj + 1 + 1 - 1.5)])
  uguale('l\'informazione del tasto porta il quarto di giro', info[info.length - 1].rot, 1)
  co.tocco((co.D.i + 1) * 10, (co.D.j + 1.5) * 10)          // un tocco sul fantasma costruisce lì: il pollaio è girato
  const nuovo = f.cose.find(c => c.tipo === 'pollaio')
  controlla('costruire dal fantasma girato mette il pezzo girato', !!nuovo && nuovo.rot === 1)
  co.parcheggia('campo', 0, 0)
  controlla('un campo non ha il tasto e ruota() non fa niente', info[info.length - 1].ruotabile === false && co.ruota() === false && co.D.rot === 0)
  co.annullaTrascinamento()
  co.inizia('pollaio', nuovo, 10, 70)
  uguale('il fantasma di un pezzo già girato parte girato', co.D.rot, 1)
  co.ruota(); co.ruota(); co.ruota()
  uguale('e dopo tre giri è tornato dritto', co.D.rot, 0)
  co.annullaTrascinamento()
  uguale('annullare azzera la rotazione tenuta', co.D.rot, 0)
}

riassunto('Fattoria 3D — la rotazione dei pezzi')
