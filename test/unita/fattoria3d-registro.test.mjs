/* La fattoria in comune, senza rete: due telefoni finti con la stessa fattoria che si scambiano le mosse a mano. Una mossa
   dell'amico rifatta qui dà la stessa fattoria; il merge permissivo (doppio raccolto: tutti e due tengono il loro; doppio pezzo
   sulla stessa cella: il secondo nel magazzino); le monete sono di chi fa la mossa; gli id delle cose non si scontrano; una mossa
   storta da fuori non passa. Docs: docs/fattoria3d/in-comune.md.
   `node test/esegui.mjs fattoria3d-registro`
   tempo: 1 */
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { registra, rifai, mossaInForma, MOSSE } from '../../src/giochi/fattoria3d/motore/registro.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const t = { ora: 1_000_000 }
/** un telefono: la fattoria comune (la stessa partenza), le sue monete e le mosse che manda */
function telefono(corsia, stato = null) {
  const b = { monete: 1000 }, inviate = []
  const m = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  const smetti = registra(m, x => inviate.push(x), { corsia })
  return { m, b, inviate, smetti }
}
/** le mosse di `da` arrivano ad `a`, passando da JSON come sulla rete */
const consegna = (da, a) => da.inviate.splice(0).map(x => rifai(a.m, mossaInForma(JSON.parse(JSON.stringify(x)))))
const postoPer = (f, tipo) => { for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (f.puoMettere(tipo, i, j).ok) return [i, j]; return null }
const firma = m => { const s = m.serializza(); return JSON.stringify({ cose: s.cose, merci: s.merci, prodotti: s.prodotti, magazzino: s.magazzino, esperienza: s.esperienza }) }

/* ══════════ 1. le mosse registrate ══════════ */
const base = new Fattoria3d({ stato: null, borsa: { quante: () => 0, paga: () => true }, ora: () => t.ora }).serializza()
base.esperienza = sogliaDi(10)
const A = telefono(0, base), B = telefono(1, base)
controlla('le due fattorie partono uguali', firma(A.m) === firma(B.m))
const [i, j] = postoPer(A.m, 'campo')
const r = A.m.compraEMetti('campo', i, j)
controlla('il bambino compra e mette un campo come sempre', r.ok)
uguale('una mossa sola registrata, col suo nome', A.inviate.map(x => x.n).join(), 'compraEMetti')
controlla('gli argomenti sono quelli del gesto', JSON.stringify(A.inviate[0].a) === JSON.stringify(['campo', i, j, 0]) || JSON.stringify(A.inviate[0].a) === JSON.stringify(['campo', i, j]), JSON.stringify(A.inviate[0].a))
controlla('una mossa che non riesce non si manda', !A.m.compraEMetti('campo', i, j).ok && A.inviate.length === 1)
const campoA = A.m.s.cose.find(c => c.tipo === 'campo' && c.i === i && c.j === j)
uguale('il telefono di corsia 0 dà id pari', campoA.id % 2, 0)

const moneteB = B.b.monete
consegna(A, B)
controlla('la mossa di A rifatta su B dà la stessa fattoria', firma(A.m) === firma(B.m))
uguale('le monete di B non si muovono per una mossa di A', B.b.monete, moneteB)
uguale('e B non manda niente quando rifà la mossa di A', B.inviate.length, 0)
controlla('il campo ha lo stesso id sui due telefoni', B.m.cosa(campoA.id)?.tipo === 'campo')

/* ══════════ 2. seminare e raccogliere insieme ══════════ */
B.m.semina(campoA.id, 'grano')
consegna(B, A)
controlla('B semina e A vede il grano', A.m.cosa(campoA.id).coltura === 'grano' && firma(A.m) === firma(B.m))
t.ora += COLTURE.grano.ms + 1000
const prima = A.m.s.merci.grano
for (let k = 0; k < 4; k++) A.m.raccogliTessera(campoA.id, k)
for (let k = 0; k < 4; k++) B.m.raccogliTessera(campoA.id, k)        // tutti e due insieme, prima di sentirsi
uguale('A ha raccolto il suo grano', A.m.s.merci.grano, prima + 1)
const ra = consegna(B, A), rb = consegna(A, B)
controlla('le tessere già tagliate non riescono, ma la mossa è compensata', ra.every(x => !x.ok && x.compensata) && rb.every(x => !x.ok && x.compensata))
uguale('doppio raccolto: su A entra anche il grano di B (chissene)', A.m.s.merci.grano, prima + 2)
uguale('e su B lo stesso', B.m.s.merci.grano, prima + 2)
controlla('il campo è vuoto su tutti e due', A.m.campoVuoto(A.m.cosa(campoA.id)) && B.m.campoVuoto(B.m.cosa(campoA.id)))

/* ══════════ 3. due pezzi sulla stessa cella ══════════ */
const [i2, j2] = postoPer(A.m, 'campo')
A.m.compraEMetti('campo', i2, j2); B.m.compraEMetti('campo', i2, j2)
const idA = A.m.s.cose.find(c => c.i === i2 && c.j === j2).id, idB = B.m.s.cose.find(c => c.i === i2 && c.j === j2).id
controlla('gli id dei due campi nuovi non si scontrano (pari e dispari)', idA !== idB && idA % 2 === 0 && idB % 2 === 1, `${idA} ${idB}`)
consegna(A, B); consegna(B, A)
uguale('il campo di B su A non trova posto e va nel magazzino', A.m.nelMagazzino('campo'), 1)
uguale('e quello di A su B lo stesso', B.m.nelMagazzino('campo'), 1)
uguale('l\'esperienza della spesa entra lo stesso', A.m.esperienza(), B.m.esperienza())

/* ══════════ 4. le monete e l'esperienza ══════════ */
const mA = A.b.monete, mB = B.b.monete, eA = A.m.esperienza()
const lotto = B.m.lottiComprabili()[0]
controlla('B compra un lotto di terra', B.m.compraLotto(lotto.id).ok)
controlla('chi compra paga con le sue monete', B.b.monete < mB)
consegna(B, A)
controlla('e il lotto è della fattoria comune anche su A', A.m.posseduto(lotto))
uguale('l\'altro non paga niente', A.b.monete, mA)
controlla('e la fattoria comune sale di esperienza su tutti e due', A.m.esperienza() > eA && A.m.esperienza() === B.m.esperienza())

/* ══════════ 5. spostare: le mosse dell'altro vanno in fila ══════════ */
const [i4, j4] = postoPer(A.m, 'campo')
A.m.spostaPezzo(campoA.id, i4, j4)
consegna(A, B)
controlla('A sposta il primo campo e B lo vede spostato', B.m.cosa(campoA.id).i === i4 && B.m.cosa(campoA.id).j === j4)
// il campo finito nel magazzino su un telefono resta un'altra cosa sull'altro: lo rimette in pari la fotografia (docs/fattoria3d/in-comune.md)
controlla('il campo conteso è di A su A e di B su B', !!A.m.cosa(idA) && !A.m.cosa(idB) && !!B.m.cosa(idB) && !B.m.cosa(idA))

/* ══════════ 6. una mossa storta da fuori ══════════ */
controlla('un nome che non è una mossa non passa', mossaInForma({ n: 'serializza', a: [], f: {} }) === null && mossaInForma({ n: 'constructor', a: [] }) === null)
controlla('niente argomenti a liste o troppi', mossaInForma({ n: 'semina', a: [[1]], f: {} }) === null && mossaInForma({ n: 'semina', a: [1, 2, 3, 4, 5] }) === null)
const gonfiata = mossaInForma({ n: 'raccogliTessera', a: [1, 0], f: { m: { grano: 1e9, '<x>': 3 }, e: 1e12 } })
controlla('i guadagni dichiarati hanno un tetto e chiavi pulite', gonfiata.f.m.grano <= 60 && !('<x>' in gonfiata.f.m) && gonfiata.f.e <= 5000)
controlla('ogni mossa del registro esiste nel motore', MOSSE.every(n => { const [o, x] = n.startsWith('cura.') ? [A.m.cura, n.slice(5)] : [A.m, n]; return typeof o[x] === 'function' }))
A.smetti()
const [i5, j5] = postoPer(A.m, 'campo')
A.m.compraEMetti('campo', i5, j5)
uguale('smesso di ascoltare, il motore non registra più', A.inviate.length, 0)

riassunto('fattoria3d-registro')
