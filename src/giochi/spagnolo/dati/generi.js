// Il genere dei nomi spagnoli che la regola non indovina: motore/lessico.js
// prova prima questa tabella, poi le desinenze (-o maschile, -a femminile,
// -ción e -dad femminili, -or e -aje maschili…). Le parole in -e, in -z e in
// -s non hanno una regola: stanno tutte qui. Il test spagnolo-lingua stampa
// i nomi di data/parole-es.js senza genere. Vedi docs/lingue/spagnolo-motore.md.

// 'm' maschile, 'f' femminile
export const GENERI = {
  // in -a ma maschili
  día: 'm', mapa: 'm', sofá: 'm', planeta: 'm', problema: 'm', tema: 'm', idioma: 'm', clima: 'm',
  sistema: 'm', programa: 'm', pijama: 'm', fantasma: 'm', panda: 'm', koala: 'm', gorila: 'm', puma: 'm',
  tranvía: 'm', papá: 'm', cometa: 'f',
  // in -o ma femminili
  mano: 'f', foto: 'f', moto: 'f', radio: 'f',
  // in -e
  leche: 'f', noche: 'f', tarde: 'f', gente: 'f', nieve: 'f', carne: 'f', calle: 'f', serpiente: 'f',
  llave: 'f', nube: 'f', torre: 'f', fuente: 'f', suerte: 'f', frente: 'f', sangre: 'f', clase: 'f',
  parte: 'f', fiebre: 'f', hambre: 'f', muerte: 'f', base: 'f', mente: 'f',
  elefante: 'm', tigre: 'm', tomate: 'm', chocolate: 'm', aire: 'm', cine: 'm', parque: 'm', puente: 'm',
  restaurante: 'm', billete: 'm', postre: 'm', diente: 'm', hombre: 'm', nombre: 'm', cohete: 'm',
  bote: 'm', bosque: 'm', guante: 'm', peluche: 'm', pupitre: 'm', panqueque: 'm', cruce: 'm', traje: 'm',
  paquete: 'm', bigote: 'm', jarabe: 'm', septiembre: 'm', octubre: 'm', noviembre: 'm', diciembre: 'm',
  té: 'm', café: 'm', pie: 'm', juguete: 'm', estante: 'm', coche: 'm', viaje: 'm',
  // in -z
  lápiz: 'm', maíz: 'm', arroz: 'm', pez: 'm', disfraz: 'm', ajedrez: 'm',
  nariz: 'f', luz: 'f', nuez: 'f', paz: 'f', voz: 'f', vez: 'f', cruz: 'f', raíz: 'f',
  // in -s
  lunes: 'm', martes: 'm', miércoles: 'm', jueves: 'm', viernes: 'm', paraguas: 'm', cumpleaños: 'm',
  rompecabezas: 'm', tenis: 'm', arcoíris: 'm', autobús: 'm', país: 'm', mes: 'm', anís: 'm', tos: 'f',
  // in -i, -u
  taxi: 'm', brócoli: 'm', esquí: 'm', maní: 'm', menú: 'm', champú: 'm', bambú: 'm',
  // consonanti che sbagliano la regola
  sal: 'f', miel: 'f', piel: 'f', cárcel: 'f', señal: 'f', col: 'f', flor: 'f', labor: 'f', mujer: 'f',
  ley: 'f', mamá: 'f', césped: 'm',
  // già plurali (il genere della cosa)
  uvas: 'f', fideos: 'm', lentes: 'm', tijeras: 'f', cartas: 'f', pinturas: 'f', palomitas: 'f',
  vacaciones: 'f', 'papas fritas': 'f',
  // nomi che arrivano con le forme (dati/forme.js) e non sono in parole-es
  sed: 'f', sueño: 'm', miedo: 'm', calor: 'm', frío: 'm', lado: 'm', cosa: 'f', historia: 'f', hora: 'f',
  media: 'f', cuarto: 'm', punto: 'm', izquierda: 'f', derecha: 'f',
}

// Lo stesso nome per lui e per lei: el cantante, la cantante. Il genere lo
// dice l'articolo; senza articolo vale il maschile.
export const GENERE_COMUNE = new Set(['cantante', 'policía', 'piloto', 'bebé', 'estudiante', 'artista', 'turista',
  'dentista', 'guía', 'joven', 'astronauta', 'atleta', 'testigo', 'futbolista', 'pianista', 'tenista'])

// Femminili che cominciano con la «a» accentata: el agua, un agua, ma las
// aguas e el agua fría (l'aggettivo resta femminile).
export const A_TONICA = new Set(['agua', 'águila', 'hambre', 'hacha', 'aula', 'alma', 'arma', 'ala', 'hada',
  'área', 'ancla', 'arpa'])

// I nomi che non stanno in parole-es ma servono alle forme (tengo hambre,
// al lado de, la izquierda): si riconoscono come nomi anche senza tappa.
export const ALTRI_NOMI = ['hambre', 'sed', 'sueño', 'miedo', 'calor', 'frío', 'lado', 'cosa', 'historia',
  'izquierda', 'derecha', 'media', 'cuarto', 'punto', 'vez']
