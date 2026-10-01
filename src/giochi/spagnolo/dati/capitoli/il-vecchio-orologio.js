// In quarta, dopo «Che ore sono?»: il compleanno del nonno, e un orologio
// in cucina che dice sempre la stessa ora. Che sia fermo non è mai scritto.
// Formato in docs/lingue/libro.md, segnaposto in docs/lingue/spagnolo-motore.md.
const ANNI = [{ es: 'sesenta', it: 'sessanta' }, { es: 'setenta', it: 'settanta' }]

export default {
  id: 'il-vecchio-orologio',
  mondo: 'quarta',
  dopo: 'quarta-hora',
  titolo: 'Il vecchio orologio',
  nuove: ['mirar', 'abrir'],
  variabili: {
    ora: { da: 'numeri', fra: ['siete', 'ocho', 'nueve'] },
    anni: { fra: ANNI },
    colore: { da: 'colori', fra: ['azul', 'rojo', 'verde', 'negro'] },
    // chi chiede l'ora la mattina: l'altro la chiede in giardino
    primo: { fra: ['Laura', 'Leo'] },
  },
  pagine: [
    [
      { es: 'Es sábado por la mañana.', forma: 'hoy-es' },
      { es: 'Laura y Leo están en la casa de los abuelos.', forma: 'esta-en' },
      { es: 'Hoy el abuelo tiene {anni} años: ¡es su cumpleaños!', forma: 'tiene' },
      { es: 'En la pared de la cocina hay un reloj grande y viejo.', forma: 'hay' },
      { id: 'mattina', chi: v => v.primo, es: 'Abuelo, ¿qué hora es?', forma: 'hora' },
      { chi: 'nonno', es: 'Son las {ora} de la mañana.', forma: 'hora' },
    ],
    [
      { es: 'Por la tarde hace sol.', forma: 'hace' },
      { es: 'Laura, Leo y Pip están en el jardín.', forma: 'esta-en' },
      { chi: v => (v.primo === 'Laura' ? 'Leo' : 'Laura'), es: 'Abuelo, ¿qué hora es ahora?', forma: 'hora' },
      { chi: 'nonno', es: 'Son las {ora}.', forma: 'hora' },
      { chi: v => (v.primo === 'Laura' ? 'Leo' : 'Laura'), es: '¿Las {ora}? ¡No, abuelo! Es la tarde.', forma: 'hora' },
      { es: 'Leo corre a la cocina y mira el reloj.', forma: 'presente-ar' },
      { id: 'stanco', chi: 'Leo', es: '¡Laura! ¡El reloj está cansado!', forma: 'ser-estar' },
    ],
    [
      { es: 'Por la noche, después de la cena, Laura y Leo tienen una caja.', forma: 'tiene' },
      { chi: 'Laura', es: '¡Feliz cumpleaños, abuelo!', forma: 'saludos' },
      { es: 'El abuelo abre la caja: hay un reloj nuevo, pequeño y {colore}.', forma: 'hay' },
      { chi: 'nonno', es: '¡Gracias! Mi reloj es muy viejo.', forma: 'ser' },
      { id: 'come-me', chi: 'nonno', es: 'Siempre está cansado. ¡Yo también!', forma: 'ser-estar' },
      { chi: 'nonno', es: '¡Y ahora son las diez de la noche!', forma: 'hora' },
      { es: 'Y en la pared de la cocina siempre son las {ora}.', forma: 'hora' },
    ],
  ],
  domande: [
    { testo: 'Perché il nonno dice sempre la stessa ora?', risposta: () => 'L’orologio della cucina è fermo',
      anche: ['Il nonno è stanco', 'Il nonno fa uno scherzo', 'È sempre mattina'] },
    { tipo: 'frase', testo: 'Da quale frase si capisce che Leo ha scoperto il guaio dell’orologio?', frase: 'stanco' },
    { tipo: 'chi', frase: 'come-me' },
    { tipo: 'ordine', fatti: [v => `${v.primo} chiede l’ora al nonno`, 'Leo corre a guardare l’orologio',
                              'Laura dice «buon compleanno» al nonno', 'Il nonno apre la scatola'] },
  ],
}
