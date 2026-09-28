/* Il caso ripetibile: mai Math.random(), un generatore riceve sempre una
   sorte. Con un seme «la domanda 47 del grado 3» è sempre la stessa,
   e il banco di prova può dire quale è venuta storta. */
function seminato(seme) {
  let s = seme | 0
  return () => {
    s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export class Sorte {
  constructor(seme = 1) { this.dado = seminato(seme) }

  /* un numero fra 0 e 1 */
  get frazione() { return this.dado() }

  /* un intero da `a` a `b`, estremi compresi */
  fra(a, b) { return a + Math.floor(this.dado() * (b - a + 1)) }

  /* capita `p` volte su una */
  forse(p = 0.5) { return this.dado() < p }

  /* un elemento a caso */
  uno(lista) { return lista[Math.floor(this.dado() * lista.length)] }

  /* una copia mescolata (Fisher-Yates: l'unico modo di mescolare che
     non favorisce nessuna posizione) */
  mescola(lista) {
    const a = lista.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.dado() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /* `n` elementi diversi fra loro */
  alcuni(lista, n) { return this.mescola(lista).slice(0, n) }

  // il gesto più frequente: i distrattori sono sempre «altri che non siano la giusta»
  distrattori(lista, n, scarta = () => false) {
    const buoni = lista.filter(x => !scarta(x))
    return this.mescola(buoni).slice(0, n)
  }
}

/* comodità: `sorte()` quando non importa la ripetibilità (il gioco vero,
   la prova nei settaggi), `new Sorte(seme)` quando importa (il banco). */
export const sorteQualunque = () => new Sorte((Math.random() * 2 ** 31) | 0)
