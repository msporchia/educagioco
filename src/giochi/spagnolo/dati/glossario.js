// Cosa vuol dire una parola di struttura quando la si tocca: quelle che non
// stanno in data/parole-es.js e data/verbi-es.js (che hanno già la loro
// traduzione), o che lì hanno una traduzione che a una frase non basta (en
// è «in», non solo «dentro»). Una parola di qui non ha una chiave SRS sua:
// si impara con la forma, e toccarla è sempre gratis. Le forme dei verbi
// di struttura che non stanno qui (estuviste, tenemos) le traduce
// motore/lessico.js dalla loro base. Vedi docs/lingue/spagnolo-motore.md.
export const GLOSSARIO = {
  // articoli, dimostrativi, possessivi
  un: 'un, uno (maschile)', una: 'una (femminile)', unos: 'alcuni, dei', unas: 'alcune, delle',
  el: 'il, lo (maschile)', la: 'la (femminile)', los: 'i, gli (maschile)', las: 'le (femminile)',
  al: 'a + il (al parque: al parco)', del: 'di + il (del niño: del bambino)',
  este: 'questo', esta: 'questa', estos: 'questi', estas: 'queste', ese: 'quello', esa: 'quella',
  mi: 'mio, mia', mis: 'miei, mie', tu: 'tuo, tua', tus: 'tuoi, tue', su: 'suo, sua (di lui, di lei)',
  sus: 'suoi, sue', nuestro: 'nostro', nuestra: 'nostra',
  // pronomi
  ellas: 'loro (femminile)', usted: 'lei (di cortesia)', ustedes: 'voi, loro',
  me: 'mi, me', te: 'ti, te', se: 'si (se lava: si lava)', nos: 'ci, noi', le: 'gli, le (a lui, a lei)',
  les: 'gli, a loro', lo: 'lo', mí: 'me (a mí: a me)', ti: 'te (a ti: a te)',
  // ser, estar, tener, gustar, hay
  es: 'è', son: 'sono (loro)', soy: 'sono (io)', eres: 'sei (tu)', somos: 'siamo',
  está: 'è, sta (lui, lei)', están: 'sono, stanno (loro)', estoy: 'sono, sto (io)', estás: 'sei, stai (tu)',
  estamos: 'siamo, stiamo', tengo: 'ho', tienes: 'hai', tiene: 'ha', tenemos: 'abbiamo', tienen: 'hanno',
  gusta: 'piace', gustan: 'piacciono', hay: 'c’è, ci sono', llamo: 'chiamo (me llamo: mi chiamo)',
  llamas: 'chiami (te llamas: ti chiami)', llama: 'chiama (se llama: si chiama)',
  // quello che si «ha»
  años: 'anni', hambre: 'fame', sed: 'sete', calor: 'caldo', sueño: 'sonno', miedo: 'paura',
  // le domande
  cuál: 'quale', cuántos: 'quanti', cuántas: 'quante', cuánto: 'quanto', cuánta: 'quanta', adónde: 'dove (verso)',
  // posti e strada
  en: 'in, a, su (en casa: a casa)', a: 'a, verso', de: 'di, da', lado: 'lato (al lado de: accanto a)',
  izquierda: 'sinistra', derecha: 'destra', recto: 'dritto', hasta: 'fino a', entre: 'fra, tra',
  enfrente: 'di fronte (enfrente de: di fronte a)', gira: 'gira', sigue: 'vai avanti, continua',
  cruza: 'attraversa', por: 'per, da', para: 'per', sin: 'senza', luego: 'poi, dopo',
  // quante cose
  mucho: 'molto, tanto', mucha: 'molta, tanta', muchos: 'molti, tanti', muchas: 'molte, tante',
  poco: 'poco (un poco de: un po’ di)', algunos: 'alcuni, qualche', algunas: 'alcune, qualche',
  ningún: 'nessuno', nada: 'niente', todo: 'tutto', todos: 'tutti', otro: 'altro', otra: 'altra',
  // le ore e il tempo
  menos: 'meno', media: 'mezza (y media: e mezza)', cuarto: 'quarto', punto: 'punto (en punto: in punto)',
  veces: 'volte (a veces: a volte)', vez: 'volta', después: 'dopo', antes: 'prima', anoche: 'ieri sera',
  pronto: 'presto', también: 'anche', ya: 'già', hace: 'fa (hace frío: fa freddo)', llueve: 'piove',
  nieva: 'nevica', bien: 'bene', mal: 'male',
  // il passato di estar (fui, fue e dijo li traduce il verbo: ir, ser, decir)
  estuve: 'sono stato, ero', estuvo: 'è stato, era',
  // legare le frasi, i paragoni
  que: 'che (più alto que: più alto di)', cuando: 'quando', mientras: 'mentre', porque: 'perché',
  más: 'più', mejor: 'migliore, meglio', peor: 'peggiore, peggio', tan: 'così (tan alto como: alto come)',
  como: 'come',
  no: 'no, non', sí: 'sì', y: 'e',
  // i saluti
  buenos: 'buoni (buenos días: buongiorno)', buenas: 'buone (buenas noches: buonanotte)', favor: 'favore',
}
