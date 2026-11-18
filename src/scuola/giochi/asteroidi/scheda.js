// Gli Asteroidi a scuola (docs/asteroidi/scuola.md): le tabelline col risultato, in 3D. La forma di una scheda: docs/scuola/giochi.md
export default {
  id: 'asteroidi',
  nome: 'Gli Asteroidi',
  nei: 'negli Asteroidi',
  spiega: 'La nave colpisce il sasso col risultato giusto. Vuole un PC che regga la grafica 3D.',
  tred: true,
  // gli esercizi del catalogo che sa fare: solo le tabelline, col risultato (anche a più parti)
  accetta: e => e.tipo === 'tabelline' && e.modo === 'prodotto',
}
