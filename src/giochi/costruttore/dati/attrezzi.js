/* ═══════════════════════════════════════════════════════════════════
   GLI ATTREZZI — le cose che il bambino sa già costruire, già scritte

   Un attrezzo è un progetto che il livello dà in mano **già fatto e
   chiuso**: si chiama come un blocco qualunque, si apre per leggerlo, ma
   non si cambia. Quasi sempre è una cosa che il bambino ha già
   costruito in un livello prima — la torre della torretta, la colonna
   del tempio, l'albero del bosco — e il livello la ridà pronta, perché
   rifarla sarebbe tempo perso e la lezione è un'altra.

   È il pezzo che mancava per insegnare **quando** serve un progetto, e
   non solo come si scrive: ci si abitua ad avere qualcosa che costruisce
   al posto tuo, a chiamarlo con le misure giuste, e a sapere **dove ti
   lascia** (`finisce`), perché la riga dopo comincia da lì. Poi, quando
   i progetti sono suoi, il bambino fa la stessa cosa per conto proprio.

   ── LA FORMA ───────────────────────────────────────────────────────
   Un attrezzo è un progetto (`dati/scrivi.js`) con tre campi in più:

     attrezzo   true: è chiuso, e lo zaino non lo conta
     da         la chiave del livello dove il bambino l'ha costruito
                (quello che il cartello racconta: «l'hai fatta nella
                torretta»), o null per un attrezzo nuovo
     finisce    dove lascia il robot, in parole: «in cima alla torre»

   Si scrivono qui come fabbriche, perché lo stesso attrezzo cambia
   colore da un livello all'altro (la colonna gialla della scala, quella
   bianca del tempio). Un livello li elenca in `attrezzi`, e il gioco li
   mette nel programma da sé (`motore/attrezzi.js`): non stanno nella
   soluzione, e non si salvano come roba del bambino.
   ═══════════════════════════════════════════════════════════════════ */
import { fai, progetto, meno, guarda, tinta, confronta, leggi } from './scrivi.js'

/* un attrezzo da un progetto: quelli qui sotto, e quelli che un livello
   si scrive da sé perché valgono solo sulla sua mappa (le strade di un
   porto: `dati/porto/posti.js`) */
export const attrezzo = (p, { da = null, finisce }) => ({ ...p, attrezzo: true, da, finisce })

/* ── il cantiere ── */

/* la torretta: mattoni rossi, e in cima il giallo. «alta» è tutta
   l'altezza, giallo compreso */
export const torre = () => attrezzo(progetto('torre', { nome: 'torre', icona: '🗼', misure: ['alta'] }, [
  fai.ripeti(meno('alta', 1), [fai.metti('rosso')]),
  fai.metti('giallo'),
]), { da: 'torretta', finisce: 'in cima alla torre' })

/* il muro lungo: un mattone e un passo, e il robot scende da solo */
export const muro = (colore = 'rosso') => attrezzo(progetto('muro', { nome: 'muro', icona: '🧱', misure: ['lungo'] }, [
  fai.ripeti('lungo', [fai.metti(colore), fai.vai('destra', 1)]),
]), { da: 'muro-lungo', finisce: 'a terra, subito dopo l\'ultimo mattone' })

/* la colonna del muro alto: metti, metti, metti — a riportarlo giù ci
   pensa il passo dopo */
export const colonna = (colore = 'bianco') => attrezzo(progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
  fai.ripeti('alta', [fai.metti(colore)]),
]), { da: 'muro-alto', finisce: 'in cima alla colonna' })

/* la riga torna indietro camminandoci sopra: finisce sul suo primo
   mattone, e il piano dopo comincia da lì */
export const riga = (colore = 'rosso') => attrezzo(progetto('riga', { nome: 'riga', icona: '➖', misure: ['lunga'] }, [
  fai.ripeti('lunga', [fai.metti(colore), fai.vai('destra', 1)]),
  fai.vai('sinistra', 'lunga'),
]), { da: 'quanto-lungo', finisce: 'sopra il primo mattone della riga' })

/* l'albero del bosco: il tronco, la chioma che sporge ai lati, la punta */
export const albero = () => attrezzo(progetto('albero', { nome: 'albero', icona: '🌳' }, [
  fai.metti('marrone'), fai.metti('marrone'),
  fai.metti('verde'), fai.metti('verde', 'giu-sinistra'), fai.metti('verde', 'giu-destra'),
  fai.metti('verde'),
]), { da: 'bosco', finisce: 'in cima all\'albero' })

/* il rettangolo del castello: colonne alte «alto», una accanto all'altra */
export const rettangolo = (colore = 'grigio') => attrezzo(progetto('rettangolo', { nome: 'rettangolo', icona: '🧱', misure: ['largo', 'alto'] }, [
  fai.ripeti('largo', [fai.ripeti('alto', [fai.metti(colore)]), fai.vai('destra', 1)]),
]), { da: 'castello', finisce: 'a terra, subito dopo il rettangolo' })

/* ── il porto ── */

/* la bottega: si cammina a destra finché sopra c'è una cassa del
   colore cercato */
export const cerca = () => attrezzo(progetto('cerca', { nome: 'cerca', icona: '🔎', misure: ['tinta'], tipi: { tinta: 'colore' } }, [
  fai.finche(guarda('su', 'cassa', true, tinta('tinta')), [fai.vai('destra', 1)]),
]), { da: 'bottega', finisce: 'sotto la cassa del colore cercato' })

/* le lettere in ordine: la lettera qui sopra e quella a sinistra si
   scambiano di posto, passando dal banco di sotto, e il robot torna
   dov'era — così chi lo chiama sa sempre da dove ripartire */
export const scambia = () => attrezzo(progetto('scambia', { nome: 'scambia', icona: '🔀' }, [
  fai.prendi('su'), fai.posa('giu'),
  fai.vai('sinistra', 1), fai.prendi('su'),
  fai.vai('destra', 1), fai.posa('su'),
  fai.prendi('giu'), fai.vai('sinistra', 1), fai.posa('su'),
  fai.vai('destra', 1),
]), { da: 'due-lettere', finisce: 'dove aveva cominciato' })

/* il postino: la lettera in cima al sacco (a sinistra) va nella buca del
   suo numero, e il robot torna accanto al sacco. Il numero letto in mano
   è già i passi fino alla buca, e al ritorno basta guardare: si torna
   finché a sinistra non c'è il sacco — così non serve una lavagnetta,
   che un attrezzo non si porta dietro */
export const imbuca = () => attrezzo(progetto('imbuca', { nome: 'imbuca', icona: '📮' }, [
  fai.prendi('sinistra'),
  fai.vai('destra', leggi('mano')),
  fai.posa('su'),
  fai.finche(guarda('sinistra', 'cassone'), [fai.vai('sinistra', 1)]),
]), { da: 'postino', finisce: 'accanto al sacco, dove aveva cominciato' })

/* ── la torre del casaro (Hanoi) ──
   Il robot sta fermo fra tre assi: la rossa a sinistra, la verde sopra,
   la blu a destra. Le assi si chiamano col loro colore, ed è così che
   un ordine può dire «partenza», «arrivo» e «appoggio»: tre colori. */
const LATO_DELL_ASSE = { rosso: 'sinistra', verde: 'su', blu: 'destra' }

/* una forma, da un'asse all'altra: prende da una e posa sull'altra */
export const sposta = () => attrezzo(progetto('sposta', {
  nome: 'sposta', icona: '🧀', misure: ['da', 'a'], tipi: { da: 'colore', a: 'colore' },
}, [
  ...Object.entries(LATO_DELL_ASSE).map(([c, lato]) => fai.se(confronta('da', '=', c), [fai.prendi(lato)])),
  ...Object.entries(LATO_DELL_ASSE).map(([c, lato]) => fai.se(confronta('a', '=', c), [fai.posa(lato)])),
]), { da: null, finisce: 'dove aveva cominciato: il robot non si muove' })

/* la torre di due, scritta nelle «due forme»: la piccola sull'asse
   d'appoggio, la grande dove deve arrivare, e la piccola sopra la grande.
   Le sue misure sono nomi di ruolo, e quelle di «sposta» preposizioni:
   così una chiamata si legge «sposta da [partenza] a [appoggio]» */
export const torreDiDue = () => attrezzo(progetto('torre2', {
  nome: 'torre di due', icona: '🗼', misure: ['partenza', 'arrivo', 'appoggio'],
  tipi: { partenza: 'colore', arrivo: 'colore', appoggio: 'colore' },
}, [
  fai.chiama('sposta', 'partenza', 'appoggio'),
  fai.chiama('sposta', 'partenza', 'arrivo'),
  fai.chiama('sposta', 'appoggio', 'arrivo'),
]), { da: 'due-forme', finisce: 'dove aveva cominciato: il robot non si muove' })

/* ── i controlli ── */
export function guastiDegliAttrezzi(elenco, dove, chiaviPrima = []) {
  const guasti = []
  for (const a of elenco || []) {
    if (!a || !a.attrezzo) { guasti.push(`${dove}: un attrezzo va scritto con le fabbriche di \`dati/attrezzi.js\``); continue }
    if (!a.finisce) guasti.push(`${dove}: l'attrezzo «${a.nome}» non dice dove lascia il robot (\`finisce\`)`)
    if (a.da && !chiaviPrima.includes(a.da))
      guasti.push(`${dove}: l'attrezzo «${a.nome}» dice di venire da «${a.da}», che non è un livello che viene prima`)
  }
  return guasti
}
