// Le anteprime 3D dello zaino nella misura del telefono (docs/core/vecchio-telefono-veri.md): il fornitore vero (viste/anteprima3d.js:
// le foto fatte sul computer, e il servizio di scena3d/anteprime3d.js per il ritratto dell'eroe) con N richieste di fila, come quando si
// apre lo zaino pieno. Ogni giro ha un fornitore nuovo (la cache vuota) e chiavi diverse dal giro prima. Si misura il tempo in tutto,
// l'attesa media di una casella, il lavoro della coda del servizio (modelli, disegno, copia) e il fotogramma più lungo della pagina.
import { creaFornitore } from '../../../giochi/sotterraneo/viste/anteprima3d.js'
import { chiaveDellEroe } from '../../../giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { ANTEPRIME } from '../../../giochi/sotterraneo/dati/anteprime-fatte.js'
import { Corredo } from '../../../giochi/sotterraneo/motore/corredo.js'
import { vestiLeggendario } from './leggendario.js'

const SPECIE = ['scheletro', 'goblin', 'orco', 'lupo', 'ragno', 'zombie', 'troll', 'vespa', 'cinghiale', 'diavoletto']

/** Le chiavi di uno zaino pieno, tutte diverse: armi e bastoni, scudi, gioielli, mostri, persone e l'eroe, mescolati come in una pagina. */
export function chiaviDelloZaino(n, salta = 0) {
  // le chiavi vere del gioco (quelle fotografate), sparse: una ogni sette, perché due di fila non siano la stessa figura
  const di = tipo => Object.keys(ANTEPRIME).filter(k => k.startsWith(tipo + ':')).filter((k, i) => i % 7 === 0)
  const liste = {
    arma: di('arma'), scudo: di('scudo'), gioiello: di('gioiello'),
    mostro: SPECIE.flatMap(t => ['raro', 'leggendario'].map(g => `mostro:${t}:${g}:-`)),
    persona: Object.keys(ANTEPRIME).filter(k => k.startsWith('persona:')),
  }
  const roba = vestiLeggendario(new Corredo({ eroe: 'cavaliere' }))
  liste.eroe = ['cavaliere', 'elfa', 'mago', 'nano'].flatMap(e => [chiaveDellEroe(e, roba), chiaveDellEroe(e, roba, 'busto')])
  // il giro di una pagina dello zaino: più armi che altro
  const giro = ['arma', 'arma', 'scudo', 'gioiello', 'arma', 'mostro', 'scudo', 'persona', 'arma', 'gioiello', 'eroe']
  const presi = Object.fromEntries(Object.keys(liste).map(k => [k, 0]))
  const tutte = []
  for (let i = 0; tutte.length < n + salta && i < 2000; i++) {
    const t = giro[i % giro.length], l = liste[t]
    if (presi[t] < l.length) tutte.push(l[presi[t]++])
  }
  return tutte.slice(salta, salta + n)
}

/** Una prova: `s.anteprime` richieste (dopo `s.salta` chiavi già usate) → { tot, attesa, lavoro, max, fatte, n }. */
export async function prepara() {
  return {
    async misura(s) {
      const chiavi = chiaviDelloZaino(s.anteprime, s.salta || 0)
      const servizio = creaFornitore(() => 'cavaliere')
      let max = 0, ultimo = 0, vivo = true
      const guarda = t => { if (ultimo) max = Math.max(max, t - ultimo); ultimo = t; if (vivo) requestAnimationFrame(guarda) }
      requestAnimationFrame(guarda)
      const t0 = performance.now(), attese = []
      let fatte = 0
      try {
        await Promise.all(chiavi.map(k => servizio.chiedi(k).then(img => { attese.push(performance.now() - t0); if (img) fatte++ })))
      } finally { vivo = false }
      const tot = performance.now() - t0
      const st = servizio.stato() || { ms: 0, msModelli: 0, msCopia: 0, perdite: 0 }   // il servizio nasce solo se una chiave non è fra le foto
      servizio.via()
      return { tot: Math.round(tot), attesa: Math.round(attese.reduce((a, b) => a + b, 0) / Math.max(1, attese.length)), lavoro: Math.round(st.ms),
               modelli: Math.round(st.msModelli), copia: Math.round(st.msCopia), max: Math.round(max), fatte, n: chiavi.length, persi: st.perdite }
    },
    via() {},
  }
}
