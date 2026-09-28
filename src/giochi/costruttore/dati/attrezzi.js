// Gli attrezzi: progetti già scritti e chiusi. Vedi docs/costruttore/progetti.md.
import { fai, progetto, meno, guarda, tinta, confronta, leggi } from './scrivi.js'

export const attrezzo = (p, { da = null, finisce }) => ({ ...p, attrezzo: true, da, finisce })

/* ── il cantiere ── */

export const torre = () => attrezzo(progetto('torre', { nome: 'torre', icona: '🗼', misure: ['alta'] }, [
  fai.ripeti(meno('alta', 1), [fai.metti('rosso')]),
  fai.metti('giallo'),
]), { da: 'torretta', finisce: 'in cima alla torre' })

export const muro = (colore = 'rosso') => attrezzo(progetto('muro', { nome: 'muro', icona: '🧱', misure: ['lungo'] }, [
  fai.ripeti('lungo', [fai.metti(colore), fai.vai('destra', 1)]),
]), { da: 'muro-lungo', finisce: 'a terra, subito dopo l\'ultimo mattone' })

export const colonna = (colore = 'bianco') => attrezzo(progetto('colonna', { nome: 'colonna', icona: '🏛️', misure: ['alta'] }, [
  fai.ripeti('alta', [fai.metti(colore)]),
]), { da: 'muro-alto', finisce: 'in cima alla colonna' })

export const riga = (colore = 'rosso') => attrezzo(progetto('riga', { nome: 'riga', icona: '➖', misure: ['lunga'] }, [
  fai.ripeti('lunga', [fai.metti(colore), fai.vai('destra', 1)]),
  fai.vai('sinistra', 'lunga'),
]), { da: 'quanto-lungo', finisce: 'sopra il primo mattone della riga' })

export const albero = () => attrezzo(progetto('albero', { nome: 'albero', icona: '🌳' }, [
  fai.metti('marrone'), fai.metti('marrone'),
  fai.metti('verde'), fai.metti('verde', 'giu-sinistra'), fai.metti('verde', 'giu-destra'),
  fai.metti('verde'),
]), { da: 'bosco', finisce: 'in cima all\'albero' })

export const rettangolo = (colore = 'grigio') => attrezzo(progetto('rettangolo', { nome: 'rettangolo', icona: '🧱', misure: ['largo', 'alto'] }, [
  fai.ripeti('largo', [fai.ripeti('alto', [fai.metti(colore)]), fai.vai('destra', 1)]),
]), { da: 'castello', finisce: 'a terra, subito dopo il rettangolo' })

/* ── il porto ── */

export const cerca = () => attrezzo(progetto('cerca', { nome: 'cerca', icona: '🔎', misure: ['tinta'], tipi: { tinta: 'colore' } }, [
  fai.finche(guarda('su', 'cassa', true, tinta('tinta')), [fai.vai('destra', 1)]),
]), { da: 'bottega', finisce: 'sotto la cassa del colore cercato' })

export const scambia = () => attrezzo(progetto('scambia', { nome: 'scambia', icona: '🔀' }, [
  fai.prendi('su'), fai.posa('giu'),
  fai.vai('sinistra', 1), fai.prendi('su'),
  fai.vai('destra', 1), fai.posa('su'),
  fai.prendi('giu'), fai.vai('sinistra', 1), fai.posa('su'),
  fai.vai('destra', 1),
]), { da: 'due-lettere', finisce: 'dove aveva cominciato' })

export const imbuca = () => attrezzo(progetto('imbuca', { nome: 'imbuca', icona: '📮' }, [
  fai.prendi('sinistra'),
  fai.vai('destra', leggi('mano')),
  fai.posa('su'),
  fai.finche(guarda('sinistra', 'cassone'), [fai.vai('sinistra', 1)]),
]), { da: 'postino', finisce: 'accanto al sacco, dove aveva cominciato' })

// La torre del casaro (Hanoi): il robot sta fermo fra tre assi. Vedi docs/costruttore/algoritmi.md.
const LATO_DELL_ASSE = { rosso: 'sinistra', verde: 'su', blu: 'destra' }

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
