// Una folla finta attorno all'eroe, solo per misurare quanto pesano i personaggi 3D del mondo di sopra (docs/sotterraneo/limiti-3d.md):
// `&folla=N` N persone 3D, `&branco3d=N` N mostri 3D (`&specie=lupo,orco` a giro, se no un gruppo misto), `&tetto3d=N` alza i tetti
// dei modelli 3D di sopra (persone e mostri) per vedere oltre. Solo disegno: il motore non li conosce (niente scontri, niente dialoghi).
import { figuraDiSopra } from './mostri.js'

const MISTI = ['scheletro', 'goblin', 'lupo', 'orco', 'ragno', 'zombie', 'vespa', 'cinghiale']
const MODELLI = ['guardia', 'armaiolo', 'incantatrice', 'erborista', 'minatore', 'capitano', 'ragazza', 'boscaiolo', 'pescatore', 'mugnaio', 'cacciatrice', 'carovaniere']

export function leggiFolla(hash = typeof location === 'undefined' ? '' : location.hash + location.search) {
  const h = new URLSearchParams(String(hash).replace(/^[#?]/, '').replace(/[#?]/g, '&'))
  const n = k => Math.max(0, Math.min(64, Math.floor(Number(h.get(k)) || 0)))
  const specie = (h.get('specie') || '').split(',').filter(Boolean)
  return { folla: n('folla'), branco: n('branco3d'), tetto: n('tetto3d') || null, specie: specie.length ? specie : MISTI }
}

// il k-esimo posto attorno a (x, z): anelli a 2, 3,5, 5… celle, davanti alla telecamera (che guarda da +z) prima che dietro
function posto(k, x, z, giro) {
  let anello = 0, primo = 0, quanti = 6
  while (k >= primo + quanti) { primo += quanti; anello++; quanti = 6 + anello * 4 }
  const r = 2 + anello * 1.5, a = ((k - primo) / quanti) * Math.PI * 2 + giro + anello * 0.4
  return { x: x + Math.sin(a) * r, z: z + Math.cos(a) * r }
}

/** Le persone finte (come quelle di S.persone) attorno a (x, z). */
export function personeFinte(n, x, z) {
  const l = []
  for (let k = 0; k < n; k++) {
    const p = posto(k, x, z, 0.25)
    l.push({ chiave: `folla:${k}`, modello: MODELLI[k % MODELLI.length], x: p.x, z: p.z })
  }
  return l
}

/** I mostri finti (come quelli di mostriDaDisegnare) attorno a (x, z), al tempo t. */
export function mostriFinti(n, specie, x, z, t) {
  const l = []
  for (let k = 0; k < n; k++) {
    const p = posto(k, x, z, 0)
    const q = { i: 900000 + k, tipo: specie[k % specie.length], grado: 'comune', sveglio: true }
    const f = figuraDiSopra(q)
    l.push({ ...q, alto: f.alto, scala: f.scala, x: p.x, z: p.z, alfa: 1, specchio: p.x < x, caporale: false, signore: false, nome: null })
  }
  return l
}
