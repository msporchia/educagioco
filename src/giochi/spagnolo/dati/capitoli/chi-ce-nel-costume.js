// In seconda, dopo «Io sono, tu sei»: a Carnevale arriva un costume che
// non dice chi è, solo com'è. Tre pagine, tre domande; chi c'è dentro si
// capisce dalla prima pagina (alta o piccola). Formato in docs/lingue/libro.md.
export default {
  id: 'chi-ce-nel-costume',
  mondo: 'seconda',
  dopo: 'seconda-soy',
  titolo: 'Chi c’è nel costume?',
  variabili: {
    // `com`: com'è, ed è l'indizio; `indizio`: lo stesso in italiano
    dentro: { fra: [
      { es: 'mamá', chi: 'mamma', com: 'alta', it: 'La mamma', indizio: 'La voce dice che è molto alta' },
      { es: 'abuela', chi: 'nonna', com: 'pequeña', it: 'La nonna', indizio: 'La voce dice che è molto piccola' },
    ] },
    // `bello`: bonito accordato a mano ({c~x} vuole c variabile)
    maschera: { fra: [{ es: 'fantasma', bello: 'bonito' }, { es: 'bruja', bello: 'bonita' },
                      { es: 'calabaza', bello: 'bonita' }] },
    colore: { da: 'colori', fra: ['blanco', 'negro', 'verde', 'morado', 'naranja'] },
  },
  pagine: [
    [
      { es: 'Es Carnaval.', forma: 'es-un' },
      { chi: 'Laura', es: 'Hola, soy Laura y este es mi hermano Leo.', forma: 'ser' },
      { chi: 'Laura', es: 'Mi mamá es muy alta y mi abuela es muy pequeña.', forma: 'ser' },
    ],
    [
      { chi: 'Leo', es: '¡Laura! ¡Es {un:maschera} {colore~maschera}!', forma: 'color-despues' },
      { chi: 'Laura', es: '¿Eres Tom?', forma: 'ser' },
      { chi: 'voce', es: 'No, no soy Tom.', forma: 'ser' },
      { id: 'papa', chi: 'Leo', es: '¿Eres papá?', forma: 'ser' },
      { chi: 'voce', es: 'No, no soy tu papá. ¡Soy muy {dentro.com}!', forma: 'ser' },
    ],
    [
      { chi: 'Laura', es: '¿Muy {dentro.com}? ¡Eres mi {dentro}!', forma: 'ser' },
      { chi: v => v.dentro.chi, es: '¡Sí, soy yo!', forma: 'ser' },
      { chi: 'Leo', es: '¡Eres {un:maschera} muy {maschera.bello}!', forma: 'ser' },
    ],
  ],
  domande: [
    { testo: 'Chi c’è nel costume?', risposta: v => v.dentro.it, anche: ['Tom', 'Il papà'] },
    { testo: 'Come fa Laura a capire chi è?', risposta: v => v.dentro.indizio,
      anche: ['La voce dice che è Tom', 'Vede la sua faccia'] },
    { tipo: 'chi', frase: 'papa' },
  ],
}
