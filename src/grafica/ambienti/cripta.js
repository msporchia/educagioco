/* ═════ LA CRIPTA ═════
   Pavimento a lastroni freddi, muri di mattoni caldi: sono le due cose
   che devono restare distinguibili anche al buio — la prima cripta era
   mattoni sopra e sotto, e non si capiva più dove finiva il
   camminabile. La luce è verde-menta: è quella che dice «qui sotto c'è
   qualcosa che non va» senza bisogno di un teschio in mezzo.

   ── COME SI LEGGE QUESTO FILE ──
   Ci sono tre gruppi di righe e fanno tre mestieri diversi:

   1. `mura` e `suolo` — **di che cosa sono fatte le superfici.** Sono
      elenchi di tessiture, ognuna chiamata con i suoi colori. La prima
      voce è il fondo; le altre si prendono la fetta di superficie che
      dichiarano (`quanto`), dove dice il loro campo (`dove`), e si
      applicano in ordine: l'ultima che cade è quella che si vede.

   2. `campi` — **le mappe invisibili della stanza.** Un campo è una
      macchia larga che dice quanto un punto è messo in un certo modo:
      `umido` vale 0 dove è asciutto e 1 dove cola. Non si vede da
      nessuna parte: serve solo a mettere d'accordo le cose che hanno
      la **stessa causa**. Il muro marcio, il muschio e le pozze
      nominano tutti `umido`, e per questo finiscono nello stesso
      angolo invece che in tre angoli a caso. Il numero è quanto sono
      larghe le macchie, **in celle**: 5 vuol dire che la stanza cambia
      umore ogni cinque passi.

   3. le tinte e i dettagli — **quello che ci si sparge sopra.** Ogni
      colore qui sotto è chiesto da qualcuno: `fondo` è quello che si
      vede nei giunti, `sasso` lo usano i ciottoli, `muschio` il
      muschio. Non sono una tavolozza generica.

   `muratura`, `posa`, `muro` e `lastra` **non ci sono più**: li deriva
   l'indice dalla prima voce delle due liste, così la stessa cosa non
   sta scritta in due posti che possono discordare.
   ═══════════════════════════════════════════════════════════════════ */
import { mattoni, roccia, lastre, mattonelle } from '../materiali/pattern.js'

export const CRIPTA = {
  nome: 'La cripta',

  /* ── LE PARETI ──
     Le prime tre sono lo stesso mattone di **tre partite diverse**:
     cotture che tirano al rosso, al bruno e al grigio, con tre semi
     diversi. È la varietà che costa meno di tutte — tre righe, nessun
     pittore nuovo — ed è quella che toglie di mezzo il «muro fatto di
     un colore solo ripetuto trecento volte».
     Le ultime due sono il muro che cede: prima i mattoni fatti nel
     modo `rotto`, poi la roccia in cui la cripta è stata scavata.
     Guardano lo stesso campo con `quanto` diversi, quindi la roccia
     sta **dentro** la zona dei mattoni rotti e attorno le resta un
     anello che si sbriciola: la transizione è a tre gradini, e non c'è
     nessun punto in cui due cose troppo diverse si toccano. */
  mura: [
    mattoni('#8f6146', '#5c3a29'),                                        // cotto rosso
    mattoni('#7e6350', '#4e3b2e', { seme: 2, quanto: 0.26 }),             // cotto bruno
    mattoni('#6f6157', '#443a33', { seme: 9, quanto: 0.2, dove: 'freddo' }),  // cotto grigio
    mattoni('#7a5340', '#4a3020', { modo: 'vecchio', dove: 'usura', quanto: 0.18, seme: 5 }),
    mattoni('#6a4736', '#40281c', { modo: 'rotto', dove: 'umido', quanto: 0.12, seme: 7 }),
    roccia('#5f5148', '#332a25', { modo: 'stratificata', dove: 'umido',
                                   quanto: 0.09, sporco: 0.2 }),
  ],

  /* ── IL PAVIMENTO ──
     Stesso ragionamento: due partite di lastre, una fascia consumata
     dove si è camminato di più, e il sottofondo di mattonelle dove il
     lastricato è saltato. */
  suolo: [
    lastre('#5e6169', '#474a52'),
    lastre('#5a5d63', '#43464d', { seme: 3, quanto: 0.28 }),
    lastre('#565962', '#3f4249', { modo: 'consumato', dove: 'usura', quanto: 0.2, seme: 4 }),
    mattonelle('#5a5750', '#403e3a', { dove: 'umido', quanto: 0.12 }),
  ],

  /* le mappe invisibili: nome → quanto sono larghe le macchie, in celle */
  campi: { umido: 5, usura: 6.5, freddo: 8 },

  /* ── LE TINTE, e chi le chiede ──
     `fondo` è quello che si vede nei giunti e sotto tutto; `chiazze`
     sono le due tinte del fondo mosso; `sasso`, `terra`, `muschio` e i
     due verdi li chiedono i dettagli qui sotto; `giunto` è la malta;
     le ultime quattro sono della luce. */
  fondo: ['#22242a', '#16171c'],
  chiazze: ['#53565e', '#141519'],
  terra: '#4a3c33', sasso: '#7a6a5c', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#2b1b13',
  luce: '#7fe0c0', fiamma: '#35c79a', buio: 0.42, torce: true,

  /* il sacchetto delle posature: ogni cinque celle il pavimento pesca
     di qui e stende una macchia. `liscio` due volte perché un terzo
     delle macchie non deve fare niente — è il vuoto che fa vedere il
     pieno. */
  varianti: ['liscio', 'liscio', 'usura', 'screpolato', 'licheni', 'detriti'],

  /* `[nome, passo in celle, dove]`: il passo è la densità (uno ogni
     passo×passo celle, quindi più piccolo è più fitto), e `dove` è il
     campo che dice dove ha senso. `rotto` non è un campo: vuol dire
     «dove il pavimento non è quello di fondo», cioè i pezzi caduti
     stanno sotto il punto in cui il lastricato è saltato. */
  dettagli: [['crepe', 2.3], ['ossa', 3.3], ['muschio', 4, 'umido'],
             ['pozze', 3.4, 'umido'], ['ciottoli', 5.2], ['ciottoli', 3, 'rotto']],
}
