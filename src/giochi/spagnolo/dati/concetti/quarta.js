// I concetti delle strutture del mondo «quarta» (formato in concetti.js)
import { flesse } from '../../motore/flessioni.js'
import { PERSONAGGI } from '../elenchi.js'

const parole = es => es.split(' ')
const con = (...ws) => f => parole(f.es).some(w => ws.includes(w))
const domanda = f => f.domanda
// la persona del primo verbo al presente (yo, tú, él, nosotros, ellos): «lavamos» → nosotros
const DI_STRUTTURA = new Set(['ser', 'estar', 'tener', 'gustar', 'llamarse'])
const NOMI = new Set(PERSONAGGI.map(p => p.nome.toLowerCase()))   // Leo non è «leggo»
function persona(es) {
  for (const w of parole(es).filter(w => !NOMI.has(w))) {
    const v = flesse(w).find(x => x.come === 'pres' && !DI_STRUTTURA.has(x.base))
    if (v) return v
  }
  return null
}
const diPersona = (...pp) => f => pp.includes(persona(f.es)?.persona)
const GIORNI = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const MESI = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
              'noviembre', 'diciembre', 'primavera', 'verano', 'otoño', 'invierno']

export default {
  hora: [
    { id: 'hora:es-la-una', titolo: 'È l’una, sono le tre',
      spiega: 'Come in italiano: l’una è una sola, quindi es la una. Dalle due in su son las: son las tres.',
      esempi: [['[es la] una', 'è l’una'], ['[son las] tres', 'sono le tre']] },
    { id: 'hora:y-media', titolo: 'E mezza, meno un quarto', prende: f => /\b(y media|y cuarto|menos|en punto)\b/.test(f.es),
      spiega: 'E mezza è y media, e un quarto è y cuarto (senza «un»), meno un quarto è menos cuarto.',
      esempi: [['son las dos', 'sono le due'], ['son las dos [y media]', 'sono le due e mezza']] },
    { id: 'hora:a-las', titolo: 'Alle sette', prende: f => /^a qué |\ba las?\b/.test(f.es),
      spiega: 'Per dire a che ora succede una cosa: a las siete, a la una. Come «alle sette», ma in due parole.',
      esempi: [['son las siete', 'sono le sette'], ['el desayuno es [a las] siete', 'la colazione è alle sette']] },
  ],
  'presente-ar': [
    { id: 'presente-ar:io', titolo: 'Ascolto, ascolti', prende: diPersona('yo', 'tú'),
      spiega: 'La fine del verbo dice chi lo fa: escucho è «io», escuchas è «tu». Così yo e tú spesso non si dicono.',
      esempi: [['[escucho] música', 'ascolto la musica'], ['[escuchas] música', 'ascolti la musica']] },
    { id: 'presente-ar:lei', titolo: 'Lei guarda, Tom ascolta', prende: diPersona('él'),
      spiega: 'Per lui, lei o qualcuno col suo nome il verbo in -ar finisce in -a, come in italiano: ella mira.',
      esempi: [['[yo miro] el tenis', 'io guardo il tennis'], ['[ella mira] el tenis', 'lei guarda il tennis']] },
    { id: 'presente-ar:noi', titolo: 'Laviamo, lavano',
      spiega: 'Noi: -amos (lavamos). Loro: -an (lavan). Anche qui nosotros ed ellos si possono lasciare fuori.',
      esempi: [['lavo el auto', 'lavo la macchina'], ['[lavamos] el auto', 'laviamo la macchina']] },
  ],
  fechas: [
    { id: 'fechas:de', titolo: 'Il cinque di maggio',
      spiega: 'Una data è el, il numero, de e il mese: el cinco de mayo. In italiano «il cinque maggio», qui ci vuole de.',
      esempi: [['hoy es el cinco', 'oggi è il cinque'], ['hoy es el cinco [de] mayo', 'oggi è il cinque maggio']] },
    { id: 'fechas:el-sabado', titolo: 'Sabato: el sábado', prende: con(...GIORNI),
      spiega: 'Per dire in che giorno succede una cosa si mette el: el sábado. In italiano basta «sabato».',
      esempi: [['hoy es sábado', 'oggi è sabato'], ['la fiesta es [el] sábado', 'la festa è sabato']] },
    { id: 'fechas:en-mayo', titolo: 'A novembre: en noviembre', prende: f => MESI.some(m => f.es.includes('en ' + m)),
      spiega: 'Con i mesi e le stagioni si dice en, senza el: en noviembre, en invierno. Come «a novembre».',
      esempi: [['el cinco de noviembre', 'il cinque novembre'], ['[en] noviembre', 'a novembre']] },
  ],
  cantidad: [
    { id: 'cantidad:unos', titolo: 'Delle mele: unas manzanas', prende: con('unos', 'unas', 'algunos', 'algunas'),
      spiega: 'Unos, unas sono «dei, delle»; algunos, algunas «alcuni, alcune». Vanno d’accordo con la cosa.',
      esempi: [['tengo una manzana', 'ho una mela'], ['tengo [unas] manzanas', 'ho delle mele']] },
    { id: 'cantidad:poco', titolo: 'Un po’ di latte', prende: con('poco', 'poca', 'pocos', 'pocas'),
      spiega: 'Un po’ di è un poco de, sempre con de e senza cambiare. Poco da solo concorda: pocas nubes.',
      esempi: [['hay leche', 'c’è latte'], ['hay [un poco de] leche', 'c’è un po’ di latte']] },
    { id: 'cantidad:mucho', titolo: 'Molto latte, molti libri',
      spiega: 'Mucho concorda con la cosa come «molto»: mucha leche, muchos libros. Hambre è femminile: mucha hambre.',
      esempi: [['hay mucho pan', 'c’è molto pane'], ['hay [mucha] leche', 'c’è molto latte']] },
    { id: 'cantidad:nada', titolo: 'Non c’è niente', prende: con('nada', 'ningún'),
      spiega: 'Come in italiano il no resta davanti al verbo: no hay nada. Ningún è «nessun»: no tengo ningún perro.',
      esempi: [['hay un perro', 'c’è un cane'], ['[no] hay [nada]', 'non c’è niente']] },
  ],
  'presente-er-ir': [
    { id: 'presente-er-ir:er', titolo: 'Mangio, mangi, mangia',
      spiega: 'I verbi in -er finiscono in -o, -es, -e: como, comes, come. Attento: come vuol dire «mangia».',
      esempi: [['[como] una manzana', 'mangio una mela'], ['[comes] una manzana', 'mangi una mela']] },
    { id: 'presente-er-ir:ir', titolo: 'Vivo, vivi, vive',
      prende: f => { const v = persona(f.es); return !!v && /ir$/.test(v.base) && ['yo', 'tú', 'él'].includes(v.persona) },
      spiega: 'Anche i verbi in -ir fanno -o, -es, -e: vivo, vives, vive. Abrir uguale: abro, abres, abre.',
      esempi: [['él [vive] aquí', 'lui vive qui'], ['tú [vives] aquí', 'tu vivi qui']] },
    { id: 'presente-er-ir:noi', titolo: 'Mangiamo, viviamo', prende: diPersona('nosotros', 'ellos'),
      spiega: 'Noi: -emos con -er (comemos), -imos con -ir (vivimos). Loro: -en per tutti e due (comen, viven).',
      esempi: [['[comemos] pizza', 'mangiamo la pizza'], ['[vivimos] aquí', 'viviamo qui']] },
  ],
  reflexivos: [
    { id: 'reflexivos:me', titolo: 'Mi alzo: me levanto',
      spiega: 'Come «mi alzo» in italiano, ma si scrive me: me levanto. Lo sai già da me llamo.',
      esempi: [['me llamo Leo', 'mi chiamo Leo'], ['[me levanto] temprano', 'mi alzo presto']] },
    { id: 'reflexivos:te-se', titolo: 'Ti alzi, si alza', prende: con('te', 'se'),
      spiega: 'Tu: te levantas. Lui, lei, loro o qualcuno col nome: se, come «si»: Tom se levanta.',
      esempi: [['[te levantas] temprano', 'ti alzi presto'], ['Tom [se levanta] temprano', 'Tom si alza presto']] },
    { id: 'reflexivos:nos', titolo: 'Ci alziamo: nos', prende: con('nos'),
      spiega: 'Noi: nos e il verbo in -amos: nos levantamos. Andare a letto è acostarse: nos acostamos.',
      esempi: [['me levanto tarde', 'mi alzo tardi'], ['[nos levantamos] tarde', 'ci alziamo tardi']] },
  ],
  gerundio: [
    { id: 'gerundio:ando', titolo: 'Sto guardando',
      spiega: 'Per una cosa che succede adesso: estar e il verbo in -ando, come «sto guardando»: estoy mirando.',
      esempi: [['[miro] el tren', 'guardo il treno'], ['[estoy mirando] el tren', 'sto guardando il treno']] },
    { id: 'gerundio:iendo', titolo: 'Sto mangiando', prende: f => !f.domanda && /iendo\b/.test(f.es),
      spiega: 'I verbi in -er e -ir fanno -iendo: comer, comiendo. Dopo estar mai il verbo intero: estoy comer no.',
      esempi: [['estoy [mirando]', 'sto guardando'], ['estoy [comiendo]', 'sto mangiando']] },
    { id: 'gerundio:domanda', titolo: 'Che cosa stai guardando?', prende: domanda,
      spiega: 'Per chiedere l’ordine resta quello: ¿qué estás mirando? Qué con l’accento, e ¿ ? attorno.',
      esempi: [['estás mirando el tren', 'stai guardando il treno'], ['[¿qué] estás mirando?', 'che cosa stai guardando?']] },
  ],
}
