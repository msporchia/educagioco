// Le anteprime 3D dello zaino nella misura del telefono (docs/core/vecchio-telefono-veri.md): il servizio vero
// (scena3d/anteprime3d.js, la sua coda e il suo renderer) con N richieste di fila, come quando si apre lo zaino pieno. Ogni giro ha
// un servizio nuovo (la cache vuota) e chiavi diverse dal giro prima. Si misura il tempo in tutto, l'attesa media di una casella,
// il lavoro della coda (modelli, disegno, copia) e il fotogramma più lungo della pagina mentre la coda lavora.
import { creaAnteprime3d } from '../../../giochi/sotterraneo/scena3d/anteprime3d.js'
import { chiaveDellEroe } from '../../../giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { gettone } from '../../../giochi/sotterraneo/scena3d/roba3d-pura.js'
import { FIGURE3D } from '../../../giochi/sotterraneo/dati/figure3d.js'
import { CHIAVI as PERSONE } from '../../../giochi/sotterraneo/scena3d/persone3d/persone.js'
import { Corredo } from '../../../giochi/sotterraneo/motore/corredo.js'
import { vestiLeggendario } from './leggendario.js'

const LETTERE = ['m', 'r', 'l']
const SPECIE = ['scheletro', 'goblin', 'orco', 'lupo', 'ragno', 'zombie', 'troll', 'vespa', 'cinghiale', 'diavoletto']

/** Le chiavi di uno zaino pieno, tutte diverse: armi e bastoni, scudi, gioielli, mostri, persone e l'eroe, mescolati come in una pagina. */
export function chiaviDelloZaino(n, salta = 0) {
  const di = fam => Object.keys(FIGURE3D).filter(f => FIGURE3D[f].famiglia === fam)
  const pezzo = (tipo, f, k) => `${tipo}:${gettone({ figura: f, id: null, rarita: { m: 'magico', r: 'raro', l: 'leggendario' }[LETTERE[k % 3]], elemento: FIGURE3D[f].elemento || 'nessuno' })}`
  const liste = {
    arma: [...di('lame'), ...di('bastoni')].map((f, k) => pezzo('arma', f, k)),
    scudo: di('scudi').map((f, k) => pezzo('scudo', f, k)),
    gioiello: di('gioielli').map((f, k) => pezzo('gioiello', f, k)),
    mostro: SPECIE.flatMap(t => ['raro', 'leggendario'].map(g => `mostro:${t}:${g}:-`)),
    persona: PERSONE.map(p => `persona:${p}`),
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
      const servizio = creaAnteprime3d()
      let max = 0, ultimo = 0, vivo = true
      const guarda = t => { if (ultimo) max = Math.max(max, t - ultimo); ultimo = t; if (vivo) requestAnimationFrame(guarda) }
      requestAnimationFrame(guarda)
      const t0 = performance.now(), attese = []
      let fatte = 0
      try {
        await Promise.all(chiavi.map(k => servizio.chiedi(k).then(img => { attese.push(performance.now() - t0); if (img) fatte++ })))
      } finally { vivo = false }
      const tot = performance.now() - t0
      const st = servizio.stato()
      servizio.via()
      return { tot: Math.round(tot), attesa: Math.round(attese.reduce((a, b) => a + b, 0) / Math.max(1, attese.length)), lavoro: Math.round(st.ms),
               modelli: Math.round(st.msModelli), copia: Math.round(st.msCopia), max: Math.round(max), fatte, n: chiavi.length, persi: st.perdite }
    },
    via() {},
  }
}
