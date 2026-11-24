// Il sotterraneo a scuola (docs/sotterraneo/scuola.md): una cripta dopo l'altra, ogni cosa che chiede è una domanda dell'esercizio. La forma: docs/scuola/giochi.md
// le prime lettere e le sillabe sono di prima, e il gioco è troppo per sei anni
const DI_PRIMA = ['lettere', 'sillabe']

export default {
  id: 'sotterraneo',
  nome: 'Il sotterraneo',
  nei: 'nel sotterraneo',
  spiega: 'Il bambino esplora una cripta: per aprire porte e forzieri e per battere i mostri risponde alle domande. Per le classi dalla terza in su.',
  // per la maestra che sceglie il gioco, in un testo solo: cosa allena, un esempio fra «…», come cresce (il carosello mostra questo)
  allena: 'Il bambino esplora una cripta, e per aprire porte e forzieri o colpire un mostro risponde a una domanda, per esempio «6 × 7 = ?». Come in Survivors le domande possono mescolare argomenti diversi. È il più impegnativo: per le classi dalla terza in su.',
  tred: true,
  difficolta: {
    facile: 'L\'eroe parte forte: quattro livelli sopra quelli attesi per la cripta, quindi regge anche chi sbaglia spesso.',
    difficile: 'L\'eroe parte con i livelli attesi per la cripta e basta: chi sbaglia le domande lo sente negli scontri.',
  },
  accetta: e => e.tipo === 'tabelline' || (e.tipo === 'modulo' && !DI_PRIMA.includes(e.modulo)),
}
