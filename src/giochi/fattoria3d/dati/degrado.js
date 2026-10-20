/* Il degrado adattivo della scena: se i fotogrammi vanno sotto i 30 al secondo per due secondi si scende di un livello (un po'
   meno risoluzione e le ombre ridisegnate meno spesso), e si risale solo dopo dieci secondi fermi a 60. La scelta salvata
   dall'utente (`q.scala`, `q.ombre`) non si tocca mai: il livello vive solo in memoria. Dato puro, senza three: lo prova
   `unita/fattoria3d-degrado`. Vedi docs/fattoria3d/scena.md, «Qualità e peso». */

export const SOGLIE = {
  scendi: 30,          // fps medi, sulla finestra sotto, che fanno scendere
  finestra: 2,         // secondi della media che decide la discesa
  sali: 55,            // fps minimi, tenuti per tutto `attesaSali`, che permettono di salire (60 con un po' di tolleranza)
  attesaSali: 10,      // secondi fermi a buoni fps prima di risalire
  grazia: 3,           // secondi iniziali (e dopo ogni cambio di qualità) in cui non si decide: gli shader si compilano
  attesaMax: 80,       // la risalita non aspetta mai più di tanto, anche dopo molte ricadute
  scalaMin: 0.75,      // il pixel ratio non scende mai sotto
  passoScala: 0.8,     // ogni gradino di risoluzione toglie un quinto
}

/** I livelli: quanti gradini di risoluzione si tolgono e ogni quanti fotogrammi si ridisegna l'ombra (1 = a ogni fotogramma). */
export const LIVELLI = [
  { gradini: 0, ombraOgni: 1 },
  { gradini: 0, ombraOgni: 2 },
  { gradini: 1, ombraOgni: 2 },
  { gradini: 1, ombraOgni: 3 },
  { gradini: 2, ombraOgni: 3 },
  { gradini: 3, ombraOgni: 4 },
]
export const LIVELLO_MAX = LIVELLI.length - 1

/** Il pixel ratio da usare: quello scelto (o quello dello schermo, se più basso) meno i gradini del livello, mai sotto il minimo. */
export function scalaPer(dpr, scelta, livello) {
  const base = Math.min(dpr || 1, scelta)
  const g = LIVELLI[Math.max(0, Math.min(LIVELLO_MAX, livello))].gradini
  return Math.max(Math.min(base, SOGLIE.scalaMin), base * SOGLIE.passoScala ** g)
}

export function nuovoDegrado(t = 0) {
  return { livello: 0, letture: [], daT: t, ultimoCambio: t, attesa: SOGLIE.attesaSali, ricadute: 0, saliAl: -1 }
}

/** Una lettura di fps al tempo `t` (secondi). Torna il nuovo stato e `cambio`: -1 sceso, +1 salito, 0 niente. `attivo` falso (scheda
    nascosta, opzioni in prova) svuota la finestra: non si giudica. Lo stato non si modifica: se ne torna uno nuovo. */
export function passoDegrado(stato, { t, fps, attivo = true }) {
  if (!attivo) return { stato: { ...stato, letture: [], daT: t, ultimoCambio: Math.max(stato.ultimoCambio, t - SOGLIE.grazia + 1) }, cambio: 0 }
  const S = SOGLIE
  const letture = [...stato.letture, { t, fps }].filter(l => t - l.t <= Math.max(S.attesaSali, S.finestra) + 0.01)
  const base = { ...stato, letture }
  if (t - stato.ultimoCambio < S.grazia) return { stato: base, cambio: 0 }
  // scendere: la media dell'ultima finestra, se ne abbiamo coperto una intera
  const ultime = letture.filter(l => t - l.t < S.finestra)
  const coperta = letture.length && t - letture[0].t >= S.finestra - 0.6
  if (coperta && ultime.length && stato.livello < LIVELLO_MAX) {
    const media = ultime.reduce((a, l) => a + l.fps, 0) / ultime.length
    if (media < S.scendi) {
      // una discesa poco dopo una salita vuol dire che quel livello non reggeva: la prossima salita aspetta il doppio
      const ricaduta = stato.saliAl >= 0 && t - stato.saliAl < 3 * S.attesaSali
      const attesa = ricaduta ? Math.min(S.attesaMax, stato.attesa * 2) : stato.attesa
      return { stato: { ...base, livello: stato.livello + 1, letture: [], ultimoCambio: t, attesa, ricadute: stato.ricadute + (ricaduta ? 1 : 0) }, cambio: -1 }
    }
  }
  // salire: tutte le letture degli ultimi `attesa` secondi a 55 o più, e niente cambi nello stesso tempo
  if (stato.livello > 0 && t - stato.ultimoCambio >= stato.attesa) {
    const finestra = letture.filter(l => t - l.t < stato.attesa)
    const copre = letture.length && t - letture[0].t >= stato.attesa - 0.6
    if (copre && finestra.length && finestra.every(l => l.fps >= S.sali)) {
      return { stato: { ...base, livello: stato.livello - 1, letture: [], ultimoCambio: t, saliAl: t }, cambio: 1 }
    }
  }
  return { stato: base, cambio: 0 }
}

/** Una riga per le opzioni: cosa sta facendo il degrado, o niente se non ha fatto niente. */
export function descriviDegrado(livello) {
  if (!livello) return ''
  const l = LIVELLI[Math.min(LIVELLO_MAX, livello)]
  const parti = []
  if (l.gradini) parti.push(`risoluzione ridotta di ${l.gradini} grad${l.gradini === 1 ? 'ino' : 'ini'}`)
  if (l.ombraOgni > 1) parti.push(`ombre ridisegnate ogni ${l.ombraOgni} fotogrammi`)
  return `Per tenere i fotogrammi: ${parti.join(', ')}.`
}
