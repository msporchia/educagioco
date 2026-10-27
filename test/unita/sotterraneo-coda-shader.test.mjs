/* ═══════════════════════════════════════════════════════════════════
   LA CODA DEGLI SHADER — docs/sotterraneo/prestazioni-3d.md, «Shader e prima apparizione»

   Con un renderer finto (un contatore di programmi) e un orologio finto:
   al più un programma nuovo per fotogramma, il tetto di ms, il riposo
   esplorando, il turno in comune fra più code, i passi che si aprono in
   altri passi; e i passi di una scena, uno per materiale non ancora visto.
   ═══════════════════════════════════════════════════════════════════ */
import { creaCoda, passiDi, passiTrame, turno } from '../../src/giochi/sotterraneo/scena3d/coda-shader.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// il finto: `programmi` cresce quando un passo «compila», l'orologio va avanti di quanto dice il passo
function finto() {
  const r = { programmi: 0, t: 1000 }
  const ora = () => r.t
  // un passo che costa `ms` di JS e fa nascere `n` programmi
  const passo = (n = 1, ms = 1) => () => { r.programmi += n; r.t += ms }
  return { r, ora, passo }
}
const fotogramma = r => { r.t += 100 }   // fra un fotogramma e l'altro: più del turno

{
  turno.ultimo = -Infinity
  const { r, ora, passo } = finto()
  const coda = creaCoda({ programmi: () => r.programmi, ora })
  coda.metti(passo(1), passo(1), passo(1))
  const x = coda.passo()
  uguale('un fotogramma: un programma nuovo solo', x.nuovi, 1)
  uguale('…e ci si ferma lì (un passo)', x.passi, 1)
  uguale('ne restano due', coda.quanti, 2)
  fotogramma(r); coda.passo(); fotogramma(r); coda.passo()
  uguale('tre fotogrammi, tre programmi', r.programmi, 3)
  uguale('il picco resta uno', coda.picco, 1)
}

{
  turno.ultimo = -Infinity
  const { r, ora, passo } = finto()
  const coda = creaCoda({ programmi: () => r.programmi, ora })
  // i passi che non fanno programmi (un materiale già compilato) si fanno di fila nello stesso fotogramma
  coda.metti(passo(0), passo(0), passo(0), passo(1), passo(1))
  const x = coda.passo()
  uguale('i passi a vuoto non contano: quattro passi, un programma', `${x.passi} ${x.nuovi}`, '4 1')
}

{
  turno.ultimo = -Infinity
  const { r, ora, passo } = finto()
  const coda = creaCoda({ programmi: () => r.programmi, ora, tetto: 12 })
  // il tetto di ms: passi da 5 ms senza programmi, ci si ferma passati i 12
  coda.metti(...Array.from({ length: 10 }, () => passo(0, 5)))
  const x = coda.passo()
  uguale('il tetto: tre passi da 5 ms', x.passi, 3)
  // un passo che da solo passa il doppio del tetto: il fotogramma dopo resta libero
  coda.svuota(); coda.metti(passo(0, 30), passo(0, 1))
  fotogramma(r); coda.passo()
  fotogramma(r)
  uguale('dopo un passo da 30 ms il fotogramma dopo non fa niente', coda.passo().passi, 0)
  fotogramma(r)
  uguale('…e quello dopo ancora sì', coda.passo().passi, 1)
}

{
  turno.ultimo = -Infinity
  const { r, ora, passo } = finto()
  const coda = creaCoda({ programmi: () => r.programmi, ora })
  // esplorando: dopo un programma un fotogramma di riposo
  coda.metti(passo(1), passo(1), passo(1))
  const fatti = []
  for (let i = 0; i < 5; i++) { fotogramma(r); fatti.push(coda.passo({ riposo: 1 }).nuovi) }
  stessaLista('un fotogramma sì e uno no', fatti, [1, 0, 1, 0, 1])
}

{
  turno.ultimo = -Infinity
  const { r, ora, passo } = finto()
  const a = creaCoda({ programmi: () => r.programmi, ora }), b = creaCoda({ programmi: () => r.programmi, ora })
  a.metti(passo(1)); b.metti(passo(1))
  a.passo()
  uguale('il turno: una seconda coda nello stesso fotogramma aspetta', b.passo().passi, 0)
  fotogramma(r)
  uguale('…e al fotogramma dopo compila', b.passo().nuovi, 1)
}

{
  turno.ultimo = -Infinity
  const { r, ora, passo } = finto()
  const coda = creaCoda({ programmi: () => r.programmi, ora })
  // un passo che si apre in altri passi (la scena → un passo per oggetto): vanno in testa, prima di quelli già in coda
  const ordine = []
  const segna = k => () => { ordine.push(k); r.programmi++ }
  coda.metti(() => [segna('a1'), segna('a2')], segna('b'))
  for (let i = 0; i < 4; i++) { fotogramma(r); coda.passo() }
  stessaLista('i passi aperti vengono prima', ordine, ['a1', 'a2', 'b'])
  // un passo che si rompe non ferma la coda
  coda.metti(() => { throw new Error('rotto') }, segna('c'))
  fotogramma(r); coda.passo()
  controlla('un passo rotto si salta', ordine.includes('c'))
}

// i passi di una scena finta: uno per materiale non visto, i materiali in comune una volta, le mesh con più materiali uno per materiale
{
  const mat = (uuid, extra = {}) => ({ uuid, type: 'MeshStandardMaterial', ...extra })
  const nodo = (o, figli = []) => {
    const n = { visible: true, children: figli, parent: null, ...o }
    for (const f of figli) f.parent = n
    n.traverse = f => { f(n); for (const c of n.children) c.traverse(f) }
    n.traverseVisible = f => { if (!n.visible) return; f(n); for (const c of n.children) c.traverseVisible(f) }
    return n
  }
  const pietra = mat('pietra'), legno = mat('legno'), oro = mat('oro', { map: { isTexture: true, id: 't1' } })
  const scena = nodo({ type: 'Scene' }, [
    nodo({ isMesh: true, material: pietra }), nodo({ isMesh: true, material: pietra }),
    nodo({ isMesh: true, material: [legno, oro] }),
    nodo({ isMesh: true, isSkinnedMesh: true, material: pietra }),            // la pelle: un altro programma con lo stesso materiale
    nodo({ visible: false, type: 'Group' }, [nodo({ isMesh: true, material: mat('spento') })]),
    nodo({ type: 'Group' }),
  ])
  const compilati = []
  const compila = c => c.traverse(o => compilati.push(o.material.uuid + (o.isSkinnedMesh ? '+pelle' : '')))
  const visti = new Set()
  const passi = passiDi(scena, compila, visti, { visibili: true })
  uguale('quattro passi: pietra, legno, oro, pietra con la pelle (lo spento no)', passi.length, 4)
  for (const f of passi) f()
  stessaLista('ogni passo compila un materiale solo, anche dalla mesh con due', compilati, ['pietra', 'legno', 'oro', 'pietra+pelle'])
  uguale('rifatti con gli stessi visti: niente', passiDi(scena, compila, visti, { visibili: true }).length, 0)
  uguale('senza `visibili` anche lo spento', passiDi(scena, compila, visti).length, 1)
  const caricate = []
  const trame = passiTrame(scena, t => caricate.push(t.id), new Set(), { uMaschera: { value: { isTexture: true, id: 'maschera' } } })
  for (const f of trame) f()
  stessaLista('le trame: quelle in comune e quelle dei materiali, una volta', caricate, ['maschera', 't1'])
}

riassunto('la coda degli shader')
