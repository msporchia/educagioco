// I cieli del volo: la tavolozza del fondale e di che cosa sono fatti i sassi (le disegna grafica/spazio3d/cielo.js e forme.js).
// Il gioco decide quale cielo e quale numero; qui solo i dati.

export const CIELI = {
  cintura: {   // il cielo di sempre
    alto: '#05081a', medio: '#0a0f2e', basso: '#0e1338', stella: '#9fd4ff', specie: 'roccia',
    neb: [
      { x: 0.18, y: 0.22, r: 0.55, c: '#6a2fd0' },
      { x: 0.82, y: 0.38, r: 0.48, c: '#2f6bd0' },
      { x: 0.45, y: 0.72, r: 0.60, c: '#1c4a8a' },
      { x: 0.70, y: 0.08, r: 0.35, c: '#d02f8a' },
    ],
  },
  ghiaccio: {
    alto: '#031420', medio: '#06263a', basso: '#0a3550', stella: '#bff8ff', specie: 'ghiaccio',
    neb: [{ x: 0.2, y: 0.2, r: 0.5, c: '#2fd0d0' }, { x: 0.85, y: 0.5, r: 0.45, c: '#2f8bd0' }, { x: 0.4, y: 0.85, r: 0.5, c: '#9fe8ff' }],
  },
  rottami: {
    alto: '#120c08', medio: '#1e150f', basso: '#2a1d14', stella: '#ffd9a0', specie: 'rottami',
    neb: [{ x: 0.8, y: 0.2, r: 0.5, c: '#d0702f' }, { x: 0.15, y: 0.6, r: 0.45, c: '#8a5a2f' }],
  },
  cristalli: {
    alto: '#12051f', medio: '#1d0a33', basso: '#2a0f45', stella: '#f0b3ff', specie: 'cristalli',
    neb: [{ x: 0.2, y: 0.3, r: 0.5, c: '#c02fd0' }, { x: 0.85, y: 0.65, r: 0.5, c: '#6a2fd0' }, { x: 0.6, y: 0.05, r: 0.35, c: '#ff5fd0' }],
  },
  alieni: {
    alto: '#04140a', medio: '#082414', basso: '#10301e', stella: '#c8ffb0', specie: 'dischi',
    neb: [{ x: 0.25, y: 0.25, r: 0.5, c: '#2fd06a' }, { x: 0.8, y: 0.6, r: 0.5, c: '#d02fa8' }],
  },
  marte: {   // sassi di roccia, ma rossa (`rossa`: lo legge disegnaAsteroide)
    alto: '#1a0a08', medio: '#2a1210', basso: '#3a1a14', stella: '#ffc9a0', specie: 'roccia', rossa: true,
    neb: [{ x: 0.2, y: 0.25, r: 0.5, c: '#c0502f' }, { x: 0.8, y: 0.6, r: 0.5, c: '#8a3a2f' }],
  },
  sole: {
    alto: '#1a0805', medio: '#200d10', basso: '#1a1030', stella: '#ffe2a0', specie: 'lava',
    neb: [{ x: 0.85, y: 0.05, r: 0.6, c: '#ff8a1c' }, { x: 0.2, y: 0.5, r: 0.4, c: '#d02f2f' }],
  },
  nero: {
    alto: '#030208', medio: '#07050f', basso: '#0c0818', stella: '#d9c8ff', specie: 'nero',
    neb: [{ x: 0.5, y: 0.3, r: 0.4, c: '#6a2fd0' }],
  },
}

export const specieDi = cielo => CIELI[cielo]?.specie || 'roccia'

const COLORE_FRAMMENTI = {
  roccia: '#6d6153', ghiaccio: '#9fdcf5', rottami: '#8a93a3', cristalli: '#b04dff',
  dischi: '#8a96b0', lava: '#4a2a1c', nero: '#2a1f45', bomba: '#4a3a6a',
}
export const coloreFrammenti = specie => COLORE_FRAMMENTI[specie] || COLORE_FRAMMENTI.roccia
