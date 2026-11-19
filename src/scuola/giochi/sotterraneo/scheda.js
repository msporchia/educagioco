// Il sotterraneo a scuola (docs/sotterraneo/scuola.md): una cripta dopo l'altra, ogni cosa che chiede è una domanda dell'esercizio. La forma: docs/scuola/giochi.md
// le prime lettere e le sillabe sono di prima, e il gioco è troppo per sei anni
const DI_PRIMA = ['lettere', 'sillabe']

export default {
  id: 'sotterraneo',
  nome: 'Il sotterraneo',
  nei: 'nel sotterraneo',
  spiega: 'Una discesa breve nella cripta: porte, forzieri e mostri si pagano con le domande dell\'esercizio. Per le classi dalla terza in su.',
  tred: true,
  daAnno: 3,   // le lezioni pronte lo propongono dalla terza (docs/scuola/giochi.md)
  accetta: e => e.tipo === 'tabelline' || (e.tipo === 'modulo' && !DI_PRIMA.includes(e.modulo)),
}
