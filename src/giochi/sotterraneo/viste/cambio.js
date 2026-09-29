// Il motore sa il numero (confronto() in motore/corsa.js); qui si sceglie come dirlo, in un posto solo
// (prima due schermate lo scrivevano ognuna per conto suo, e il banco del mercante non lo scriveva affatto).
// Al dito non c'è un "più forte": si dice cosa ci si toglie, non un numero.

const SEGNO = { att: '⚔️', dif: '🛡️' }
const NUDO = { att: 'mani nude', dif: 'niente addosso' }
const NUDO_MANCINA = 'mano libera'

// `conf` = confronto(): { dove, campo, addosso, delta }. Torna '' quando non c'è niente da dire (nasconde la riga)
export function cambioDetto(conf, nomeDi) {
  if (!conf) return ''
  if (conf.dove === 'dito')
    return conf.addosso ? `al posto ${dellArticolo(nomeDi(conf.addosso))}` : 'il dito è libero'
  if (!SEGNO[conf.campo]) return ''
  const segno = SEGNO[conf.campo]
  const prima = conf.addosso ? nomeDi(conf.addosso).toLowerCase()
    : conf.dove === 'mancina' ? NUDO_MANCINA : NUDO[conf.campo]
  if (!conf.delta) return `${segno} come ${prima}`
  return `${segno} ${conf.delta > 0 ? '+' : ''}${conf.delta} rispetto a ${prima}`
}

// "al posto di il medaglione" in un gioco per chi impara a leggere è un errore che insegna
function dellArticolo(nome) {
  const n = String(nome || '').toLowerCase()
  if (/^[aeiouàèéìòù]/.test(n)) return `dell'${n}`
  return `del ${n}`
}
