/* ═══════════════════════════════════════════════════════════════════
   LA SORTE — il caso ripetibile, con le scorciatoie che servono a chi
   scrive un generatore di domande.

   Perché non `Math.random()`: una domanda generata a caso non si può
   provare. Con un seme, invece, «la domanda 47 del grado 3 di
   ortografia» è sempre la stessa cosa — e il banco di prova
   (`strumenti/quiz/banco.mjs`) può girare mille domande per modulo e
   dire *quale* è venuta storta, non solo che qualcosa non torna.

   Un generatore riceve una sorte e non chiama mai `Math.random()`:
   è l'unica regola di questo file.
   ═══════════════════════════════════════════════════════════════════ */

/* Il rumore ripetibile (lo stesso di `grafica/tela.js`): stesso seme,
   stessa sequenza, su qualunque macchina. */
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

  /* `n` elementi diversi presi da `lista`, saltando quelli che a `scarta`
     non vanno bene. È il gesto più frequente di tutti — i distrattori
     sono sempre «altri che non siano la risposta giusta» — e scritto a
     mano ogni volta è dove nascono i doppioni. */
  distrattori(lista, n, scarta = () => false) {
    const buoni = lista.filter(x => !scarta(x))
    return this.mescola(buoni).slice(0, n)
  }
}

/* comodità: `sorte()` quando non importa la ripetibilità (il gioco vero,
   la prova nei settaggi), `new Sorte(seme)` quando importa (il banco). */
export const sorteQualunque = () => new Sorte((Math.random() * 2 ** 31) | 0)
