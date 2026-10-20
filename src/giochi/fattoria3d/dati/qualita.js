/* Le opzioni di qualità della scena (pannello ⚙): i preset, le scale della risoluzione, la qualità delle ombre. Dato puro.
   Il punto di partenza lo sceglie la fascia grafica del telefono (store/qualita.js); poi si ritocca a mano e si ricorda. */
export const PRESET = {
  basso: { scala: 1,   ombre: false, ombraRes: 512,  vento: false, erba: true,  nuvole: true,  particelle: false, alberi: true, nebbia: true },
  medio: { scala: 1.5, ombre: true,  ombraRes: 1024, vento: true,  erba: true,  nuvole: true,  particelle: true,  alberi: true, nebbia: true },
  alto:  { scala: 3,   ombre: true,  ombraRes: 2048, vento: true,  erba: true,  nuvole: true,  particelle: true,  alberi: true, nebbia: true },
}
// Il basso spegne solo ciò che costa a ogni fotogramma (ombre, vento che rimette a posto i campi, particelle): ciuffi e nuvole sono
// uno o due disegni in tutto, e restano. Le scelte salvate sono di una versione: se cambiano i valori di partenza si alza, e chi
// aveva salvato un preset che non mostrava niente riparte da quello della sua fascia.
export const VERSIONE_OPZIONI = 2
export const SCALE = [[0.75, '0,75×'], [1, '1×'], [1.5, '1,5×'], [2, '2×'], [3, 'nativa']]
export const OMBRE = [[512, 'bassa'], [1024, 'media'], [2048, 'alta']]
export const DISTANZA = { min: 12, max: 40, di_serie: 22 }

// la fascia del telefono → il preset da cui si parte (alta non vuol dire «nativa»: il 3D ha da pesare poco)
export const PRESET_DELLA_FASCIA = { alta: 'medio', media: 'medio', bassa: 'basso' }

export function qualitaIniziale(fascia = 'alta') {
  const nome = PRESET_DELLA_FASCIA[fascia] || 'medio'
  return { preset: nome, ...PRESET[nome], camera: DISTANZA.di_serie }
}

export function guastiDelleOpzioni() {
  const g = []
  const chiavi = Object.keys(PRESET.medio).sort().join()
  for (const [n, p] of Object.entries(PRESET)) if (Object.keys(p).sort().join() !== chiavi) g.push(`preset ${n}: chiavi diverse dal medio`)
  for (const [n, p] of Object.entries(PRESET)) {
    if (!SCALE.some(([v]) => v === p.scala)) g.push(`preset ${n}: scala ${p.scala} non in elenco`)
    if (!OMBRE.some(([v]) => v === p.ombraRes)) g.push(`preset ${n}: ombre ${p.ombraRes} non in elenco`)
  }
  if (!(DISTANZA.min < DISTANZA.di_serie && DISTANZA.di_serie < DISTANZA.max)) g.push('la distanza di serie è fuori dai limiti')
  return g
}
