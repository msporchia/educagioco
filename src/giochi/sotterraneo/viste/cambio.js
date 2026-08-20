/* ═══════════════════════════════════════════════════════════════════
   «QUANTO CAMBIA, SE ME LA METTO» — detto in una riga

   Il motore sa **il numero** (`confronto()` in `motore/corsa.js`: il
   campo che cambia, di quanto, e cosa si ha addosso adesso); qui si
   sceglie come dirlo, che è una faccenda di parole e sta perciò da
   questa parte. In un posto solo, perché la stessa riga serve in due
   schermate che prima la scrivevano ognuna per conto suo — e infatti
   una delle due non la scriveva affatto.

   Al banco del mercante era il buco più grosso: «Bipenne — una lama
   per parte, non perdona» racconta un'arma, non dice se conviene. Con
   l'arco lungo in pugno la riga che serve è «⚔️ +1 rispetto all'arco
   lungo», ed è la sola cosa con cui si decide se spendere quindici
   gemme. Un bambino sceglie dal disegno; il disegno non dice quanto fa
   male.

   Al dito non c'è un «più forte»: fra due anelli cambia *come* si
   gioca — vedere lontano, tornare su con più gemme — e lì al posto di
   un numero si dice **cosa ci si toglie**, che è l'altra metà della
   scelta: «al posto dell'anello d'ambra».
   ═══════════════════════════════════════════════════════════════════ */

const SEGNO = { att: '⚔️', dif: '🛡️' }
const NUDO = { att: 'mani nude', dif: 'niente addosso' }

/* `conf` è quello che torna `confronto()`: `{ dove, campo, addosso, delta }`.
   `nomeDi` traduce la chiave di quello che si ha addosso nel suo nome —
   il motore le chiavi le dà, i nomi no. Torna '' quando non c'è niente
   da dire, così chi disegna può nascondere la riga invece di mostrarne
   una vuota. */
export function cambioDetto(conf, nomeDi) {
  if (!conf) return ''
  if (conf.dove === 'dito')
    return conf.addosso ? `al posto ${dellArticolo(nomeDi(conf.addosso))}` : 'il dito è libero'
  if (!SEGNO[conf.campo]) return ''
  const segno = SEGNO[conf.campo]
  const prima = conf.addosso ? nomeDi(conf.addosso).toLowerCase() : NUDO[conf.campo]
  if (!conf.delta) return `${segno} come ${prima}`
  return `${segno} ${conf.delta > 0 ? '+' : ''}${conf.delta} rispetto a ${prima}`
}

/* «dell'anello d'ambra», «del medaglione»: l'articolo giusto davanti a
   un nome che arriva da una tabella. Non è pignoleria da grammatici —
   «al posto di il medaglione» in un gioco per bambini che stanno
   imparando a leggere è un errore che insegna. */
function dellArticolo(nome) {
  const n = String(nome || '').toLowerCase()
  if (/^[aeiouàèéìòù]/.test(n)) return `dell'${n}`
  return `del ${n}`
}
