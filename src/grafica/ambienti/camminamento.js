/* ═════ IL CAMMINAMENTO ═════
   Il ballatoio sulle mura: calcare sbiancato dal sole, muro più scuro
   e più caldo del pavimento. Il salto di tinta fra i due non è un
   vezzo — sono di pietra tutti e due, e senza quel salto la stanza è
   un unico tessuto beige in cui non si vede dove si cammina. */
export const CAMMINAMENTO = {
  nome: 'Il camminamento',
  posa: 'lastre', muratura: 'pietra',
  fondo: ['#94896f', '#736a58'],            // la malta fra le lastre
  chiazze: ['#efe7d4', '#8a7e66'],
  lastra: ['#e7e0cd', '#cdc4ad'],
  terra: '#b3a68c', sasso: '#9c927e', muschio: '#6f9a4a',
  erbaC: '#a8e08a', erbaS: '#5f9c53',
  muro: ['#907f62', '#5c5343'], giunto: '#4d4738',
  luce: '#fff0cf', buio: 0.06,
  varianti: ['liscio', 'liscio', 'polvere', 'usura', 'screpolato', 'detriti'],
  dettagli: [['ciottoli', 2.1], ['ciuffi', 3.2], ['crepe', 4.3]],
}
