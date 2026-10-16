// Il tempo, non i fotogrammi (docs/sotterraneo/grafica-3d.md): quanto avvicinarsi alla meta in `dt` secondi andandoci con
// rapidità `k` (al secondo). `1 - e^(-k·dt)` fa la stessa strada a 60, 120 o 144 fotogrammi al secondo; `Math.min(1, dt * k)`
// ci andava quasi uguale, ma non del tutto, e un fattore fisso a fotogramma (`lerp(a, b, 0.1)`) va il doppio a 120 Hz
export const verso = (dt, k) => 1 - Math.exp(-k * dt)
