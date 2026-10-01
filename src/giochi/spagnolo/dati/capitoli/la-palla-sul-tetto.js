// Nella sesta isola, dopo «Ho giocato»: la palla di Tom finisce sul tetto, e
// la mattina dopo è in giardino. L'ha presa il papà con la scala, ma non lo
// dice: lo dicono la scala, il sonno e il sorriso. Formato in docs/lingue/libro.md.
export default {
  id: 'la-palla-sul-tetto',
  mondo: 'sesta',
  dopo: 'sesta-jugue',
  titolo: 'La palla sul tetto',
  // escalera e café stanno nei cassetti; sonreír arriva con «Chi parla, chi ride»
  nuove: ['sonreír'],
  variabili: {
    colore: { da: 'colori', fra: ['rojo', 'azul', 'amarillo', 'verde'] },
    bebe: { fra: [{ es: 'café', it: 'Un caffè' }, { es: 'té', it: 'Un tè' }] },
  },
  pagine: [
    [
      { es: 'Ayer por la tarde Laura, Leo y Tom jugaron en el jardín con una pelota {colore.f}.',
        forma: 'pasado-reg' },
      { es: 'Tom lanzó la pelota muy alto, y Leo no la atrapó.', forma: 'pasado-reg' },
      { es: '¡La pelota fue al techo de la casa!', forma: 'pasado-irr' },
      { chi: 'Tom', es: '¡No! ¡Mi pelota!', forma: 'mi-tu-su' },
      { chi: 'Laura', es: 'El techo es muy alto. No podemos ir allí.', forma: 'quiero-puedo' },
      { id: 'triste', es: 'Tom fue a su casa muy triste.', forma: 'pasado-irr' },
    ],
    [
      { es: 'El domingo por la mañana Leo mira por la ventana.', forma: 'presente-ar' },
      { id: 'jardin', chi: 'Leo', es: '¡Laura! ¡La pelota de Tom está en el jardín!', forma: 'de' },
      { chi: 'Laura', es: '¿Quién la tomó del techo?', forma: 'pasado-reg' },
      { es: 'Al lado de la casa hay una escalera.', forma: 'hay' },
      { es: 'En la cocina, papá toma {un:bebe}: tiene mucho sueño.', forma: 'tener' },
      { chi: 'Leo', es: 'Papá, ¿tú viste la pelota de Tom?', forma: 'pasado-irr' },
      { id: 'ninguna', chi: 'papa', es: '¿Qué pelota? Yo no vi la pelota de Tom.', forma: 'pasado-irr' },
    ],
    [
      { es: 'Laura y Leo llevaron la pelota a la casa de Tom.', forma: 'pasado-reg' },
      { chi: 'Tom', es: '¡Mi pelota! ¿Quién la encontró?', forma: 'pasado-reg' },
      { chi: 'Laura', es: 'Papá dice que no fue él.', forma: 'decir' },
      { chi: 'Leo', es: 'Pero hoy papá tiene mucho sueño, y hay una escalera en el jardín.', forma: 'hay' },
      { es: 'Papá los mira por la ventana, y sonríe.', forma: 'presente-ar' },
      { es: 'Por la tarde los tres juegan con la pelota, pero no muy alto.', forma: 'presente-ar' },
    ],
  ],
  domande: [
    { testo: 'Perché Tom è andato a casa triste?', risposta: () => 'La sua palla era sul tetto',
      anche: ['Laura non voleva giocare', 'Pip gli ha preso la palla', 'Aveva sonno'] },
    { tipo: 'frase', testo: 'Che cosa vede Leo dalla finestra?', frase: 'jardin' },
    { testo: 'Che cosa beve il papà in cucina?', risposta: v => v.bebe.it, anche: ['Un succo', 'Il latte'] },
    { tipo: 'chi', frase: 'ninguna' },
    { testo: 'Chi ha preso la palla dal tetto?', risposta: () => 'Il papà',
      anche: ['Tom', 'La mamma', 'Il vento'] },
  ],
}
