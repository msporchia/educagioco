/* ═══════════════════════════════════════════════════════════════════
   LA RICETTA — un cliente, una pozione, degli ingredienti da dosare

   Da una tappa esce una ricetta: quali ingredienti, in che dose, e
   cosa c'è sullo scaffale accanto a loro. Lo scaffale è la parte che
   i bambini trovano più divertente — come alla bancarella, dove si
   sceglie la roba giusta fra quella esposta — quindi accanto agli
   ingredienti della ricetta ce ne sono altri che non c'entrano, e la
   prima cosa da fare è leggere.

   Il caso arriva da fuori (`rnd`), così una ricetta si rifà identica
   nei test. Due ingredienti della stessa ricetta non hanno mai la
   stessa dose né lo stesso nome, e la dose non è mai quella della
   ricetta di prima: la stessa cifra due volte di fila sembra un gioco
   rotto.
   ═══════════════════════════════════════════════════════════════════ */
import { INGREDIENTI, POZIONI, CLIENTI } from '../dati/misure.js'

const pesca = (rnd, lista) => lista[Math.floor(rnd() * lista.length)]

function mescolata(rnd, lista) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generaRicetta(tappa, rnd = Math.random, { evita = [] } = {}) {
  const quante = tappa.ingredienti
  const dosi = []
  let guardia = 0
  /* dosi diverse fra loro e diverse da quelle appena fatte; se il
     catalogo è piccolo si cede sul secondo vincolo, mai sul primo */
  while (dosi.length < quante && guardia++ < 300) {
    const d = pesca(rnd, tappa.dosi)
    if (dosi.some(x => x.base === d.base && x.unita === d.unita)) continue
    if (guardia < 120 && evita.some(x => x.base === d.base && x.unita === d.unita)) continue
    dosi.push(d)
  }
  /* un ingrediente per dose, della sua famiglia, senza ripetere nomi */
  const usati = new Set()
  const ingredienti = dosi.map(d => {
    const liberi = INGREDIENTI.filter(i => i.famiglia === d.famiglia && !usati.has(i.nome))
    const i = pesca(rnd, liberi)
    usati.add(i.nome)
    return { ...i, dose: d, fatto: false }
  })
  /* i distrattori: della stessa famiglia quando la tappa ne ha una
     sola (così l'unica cosa che distingue è il nome), di qualunque
     famiglia in scena quando sono di più */
  const distrattori = []
  while (ingredienti.length + distrattori.length < tappa.scelta && guardia++ < 300) {
    const liberi = INGREDIENTI.filter(i => tappa.famiglie.includes(i.famiglia) && !usati.has(i.nome))
    if (!liberi.length) break
    const i = pesca(rnd, liberi)
    usati.add(i.nome)
    distrattori.push({ ...i })
  }
  const scaffale = mescolata(rnd, [...ingredienti, ...distrattori])
    .map(i => ({ emoji: i.emoji, nome: i.nome, famiglia: i.famiglia, colore: i.colore }))
  return {
    ...pesca(rnd, POZIONI),
    cliente: pesca(rnd, CLIENTI),
    ingredienti, scaffale,
  }
}
