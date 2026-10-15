// Ogni ambientazione ha il suo aspetto in 3D: le pietre, i colori, la luce, la nebbia, le torce, l'acqua. La chiave è lo
// scenario vero del piano (`corsa.scenario`, dati/campagna.js `scenarioDi`: nell'abisso cambia coi tratti), e il colore della
// roccia viene dallo scenario stesso (dati/tessere.js, `colori.roccia`). Dato puro, gira in Node: unita/sotterraneo-3d.
import { SCENARI, SCENARIO } from '../dati/tessere.js'

// colori in [0..1]; `pietra` e `fuga` tingono le trame generate (scena3d/trame.js), `braci` accende le crepe del pavimento
export const ASPETTI_3D = {
  // le cantine: mattoni bruni e caldi, legno, un velo di muschio nelle fughe
  cantine: {
    pietra: [1.0, 0.93, 0.82], fuga: [0.13, 0.12, 0.1], muschio: 0.06, braci: 0, botti: true,
    muro: [1.0, 0.9, 0.78], cima: '#2c2723', parapetto: '#6a5f55', colonna: '#7a7068',
    cielo: '#b8a894', terra: '#3a3430', ambiente: 1,
    torcia: '#ff8a3c', fiamma: 'calda', nebbia: { colore: [1, 0.9, 0.75], densita: 0.05 },
    acqua: { fondo: [0.04, 0.14, 0.2], chiaro: [0.35, 0.75, 0.95], lava: 0 },
  },
  // la cripta: pietra grigia fredda, ombre azzurre, nebbia più fitta
  cripta: {
    pietra: [0.86, 0.92, 1.02], fuga: [0.09, 0.11, 0.13], muschio: 0.1, braci: 0, botti: true,
    muro: [0.84, 0.9, 1.0], cima: '#1f2326', parapetto: '#5e656b', colonna: '#8a9096',
    cielo: '#9aa6b6', terra: '#2a3036', ambiente: 0.95,
    torcia: '#ff9a52', fiamma: 'calda', nebbia: { colore: [0.75, 0.85, 1.0], densita: 0.075 },
    acqua: { fondo: [0.03, 0.1, 0.16], chiaro: [0.4, 0.7, 0.95], lava: 0 },
  },
  // la fornace: pietra rossiccia, crepe accese, aria calda
  fornace: {
    pietra: [1.05, 0.84, 0.74], fuga: [0.12, 0.07, 0.05], muschio: 0, braci: 0.6, botti: true,
    muro: [1.0, 0.8, 0.7], cima: '#2a1a16', parapetto: '#6e5048', colonna: '#7e625a',
    cielo: '#c0907a', terra: '#3a2420', ambiente: 1,
    torcia: '#ff7030', fiamma: 'calda', nebbia: { colore: [1, 0.6, 0.4], densita: 0.045 },
    acqua: { fondo: [0.06, 0.12, 0.16], chiaro: [0.35, 0.65, 0.85], lava: 0 },
  },
  // l'inferno: pietra quasi nera, lava nelle crepe, la fonte è una coppa di lava; niente botti (docs/sotterraneo/arredo.md)
  inferno: {
    pietra: [0.78, 0.62, 0.6], fuga: [0.1, 0.03, 0.02], muschio: 0, braci: 1, botti: false,
    muro: [0.72, 0.58, 0.56], cima: '#180e0e', parapetto: '#4e3634', colonna: '#5e4644',
    cielo: '#b06a58', terra: '#2a1210', ambiente: 0.9,
    torcia: '#ff5a24', fiamma: 'calda', nebbia: { colore: [1, 0.45, 0.25], densita: 0.06 },
    acqua: { fondo: [0.25, 0.04, 0.0], chiaro: [1.0, 0.55, 0.12], lava: 1 },
  },
}

const CAMPI = ['botti', 'pietra', 'fuga', 'muro', 'cima', 'parapetto', 'colonna', 'cielo', 'terra', 'torcia', 'nebbia', 'acqua']

// l'aspetto di uno scenario (quello di ripiego se non lo dichiara), con la roccia del suo scenario e il nome
export function aspettoDi(scenario) {
  const chiave = ASPETTI_3D[scenario] ? scenario : SCENARIO
  const sc = SCENARI[chiave] || SCENARI[SCENARIO]
  return { chiave, ...ASPETTI_3D[chiave], roccia: (sc.colori && sc.colori.roccia) || '#202020' }
}

// ogni scenario del gioco ha il suo aspetto, con tutti i campi: un nome mancante è rosso nei test, non un piano grigio
export function guastiDegliAspetti() {
  const g = []
  for (const k of Object.keys(SCENARI)) {
    const a = ASPETTI_3D[k]
    if (!a) { g.push(`lo scenario ${k} non ha l'aspetto in 3D`); continue }
    for (const c of CAMPI) if (a[c] == null) g.push(`l'aspetto 3D di ${k} non ha «${c}»`)
  }
  for (const k of Object.keys(ASPETTI_3D)) if (!SCENARI[k]) g.push(`l'aspetto 3D «${k}» non è uno scenario del gioco`)
  return g
}
