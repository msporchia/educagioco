// In seconda, dopo «Questo è mio»: Laura mostra a Tom una vecchia foto di
// famiglia, e il bebè non è chi sembra. Due pagine, tre domande; il colore
// chiede a chi va «su». Formato in docs/lingue/libro.md.
export default {
  id: 'la-vecchia-foto',
  mondo: 'seconda',
  dopo: 'seconda-mi',
  titolo: 'La vecchia foto',
  variabili: {
    // `este`: il dimostrativo in testa alla frase; `del`: per la domanda
    parente: { fra: [
      { es: 'abuelo', it: 'nonno', este: 'Este', del: 'del nonno', m: true },
      { es: 'abuela', it: 'nonna', este: 'Esta', del: 'della nonna' },
      { es: 'tío', it: 'zio', este: 'Este', del: 'dello zio', m: true },
      { es: 'tía', it: 'zia', este: 'Esta', del: 'della zia' },
    ] },
    capo: { da: 'vestiti', fra: ['sombrero', 'gorra', 'bufanda', 'abrigo', 'vestido'] },
    // colori che in italiano non cambiano: la risposta non dice il genere
    colore: { da: 'colori', fra: ['azul', 'verde', 'marrón', 'morado', 'rosado', 'naranja'] },
    bebe: { fra: [
      { es: 'papá', chi: 'papa', it: 'Il papà di Laura' },
      { es: 'mamá', chi: 'mamma', it: 'La mamma di Laura' },
    ] },
  },
  vincoli: [v => !(v.capo.es === 'vestido' && v.parente.m)],
  pagine: [
    [
      { chi: 'Laura', es: 'Tom, esta es mi familia.', forma: 'este-esta' },
      { chi: 'Laura', es: '{parente.este} es mi {parente}. Su {capo} es {colore~capo}.', forma: 'mi-tu-su' },
      { chi: 'Tom', es: '¿Y este bebé? ¿Es tu hermano Leo?', forma: 'mi-tu-su' },
    ],
    [
      { chi: 'Laura', es: 'No, no es Leo.', forma: 'es-un' },
      { chi: 'Laura', es: '¡Es mi {bebe}!', forma: 'mi-tu-su' },
      { chi: v => v.bebe.chi, es: '¡Sí, Tom! El bebé soy yo.', forma: 'saludos' },
      { chi: 'Leo', es: '¡Hola, bebé!', forma: 'saludos' },
    ],
  ],
  domande: [
    { testo: 'Chi è il bebè della foto?', risposta: v => v.bebe.it, anche: ['Leo', 'Laura'] },
    { testo: 'Secondo Tom, chi è il bebè?', risposta: () => 'Leo', anche: ['Laura', 'La nonna di Laura', 'Pip'] },
    { testo: v => `Di che colore è ${v.capo.il} ${v.parente.del}?`, risposta: v => v.colore.it },
  ],
}
