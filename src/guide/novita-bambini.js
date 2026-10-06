// Le novità per i bambini: il changelog vero, contrario di guide/novita.js.
// Formato, regole e quando proporre una riga: docs/genitori/novita-bambini.md.
export const NOVITA = [
  { id: 1, quando: '2026-08-24', gioco: 'sotterraneo',
    testo: '👹 Nel sotterraneo ci sono dieci mostri nuovi' },
  { id: 2, quando: '2026-09-11', gioco: 'pozioni',
    testo: '🧪 Il laboratorio delle pozioni è tutto nuovo' },
  { id: 3, quando: '2026-09-20', gioco: 'torri',
    testo: '♾️ Finita la campagna ci sono quattro partite libere' },
  { id: 4, quando: '2026-09-20', gioco: 'survivors',
    testo: '🧟 In Survivors arrivano i muri di mostri e due armi nuove' },
  { id: 5, quando: '2026-09-21', gioco: 'mate',
    testo: '🚀 Il volo infinito ha il suo record: fin dove arrivi?' },
  { id: 6, quando: '2026-09-22', gioco: 'fattoria',
    testo: '🐰 Alla fattoria ci sono il coniglio e tante macchine nuove' },
  { id: 7, quando: '2026-09-24', gioco: 'fattoria',
    testo: '⏳ Alla fattoria puoi mettere in fila più cose in ogni macchina' },
  { id: 8, quando: '2026-09-24', gioco: 'fattoria',
    testo: '🎈 Alla fattoria, salendo di livello, arrivano botteghe e mongolfiera' },
  { id: 9, quando: '2026-09-24', gioco: 'passo',
    testo: '🐇 Nuovo gioco: Passo passo, il coniglio va a casa con le frecce' },
  { id: 10, quando: '2026-09-24', gioco: 'costruttore',
    testo: '🏗️ Nuovo gioco: Il costruttore, programma un robot che costruisce' },
  { id: 11, quando: '2026-09-25', gioco: 'sotterraneo',
    testo: '🕯️ Il sotterraneo ha muri nuovi, torce accese e una fontana vera' },
  { id: 12, quando: '2026-09-26', gioco: 'passo',
    testo: '♾️ Il sentiero senza fine ora ha anche le scatole e le pecore' },
  { id: 13, quando: '2026-09-27', gioco: 'costruttore',
    testo: '✂️ Nel costruttore ora sposti e copi le righe, anche dentro un ripeti' },
  { id: 14, quando: '2026-09-28', gioco: 'torri',
    testo: '🏰 Nel castello arrivano ondate miste: due mostri insieme' },
  { id: 15, quando: '2026-09-29', gioco: 'torri',
    testo: '🏰 Il castello è tutto ridisegnato, con quattro mondi nuovi. Ogni torre ha il suo prezzo e il suo modo di colpire, e i mostri si comportano in modo diverso: alcuni certe torri non li toccano, altri si dividono o si rialzano. È tutto da riprovare!' },
  { id: 16, quando: '2026-09-29', gioco: 'sotterraneo',
    testo: '🕳️ Nell\'abisso adesso ogni risposta giusta vale una moneta' },
  { id: 17, quando: '2026-09-29', gioco: 'inglese',
    testo: '🗺️ English è una mappa del tesoro: frasi da comporre e un libro' },
  { id: 18, quando: '2026-09-29', gioco: null,
    testo: '⭐ I giochi con la stella all\'inizio danno il doppio delle monete' },
  { id: 19, quando: '2026-09-29', gioco: null,
    testo: '🐷 Lo vedi sulla carta del gioco: quando si svuota, cambia gioco' },
  { id: 20, quando: '2026-09-29', gioco: null,
    testo: '🐷 Mezzo vuoto dà metà monete, vuoto non ne dà: domani torna pieno' },
  { id: 21, quando: '2026-09-29', gioco: null,
    testo: '🐷 Ogni gioco ha un salvadanaio che si svuota se ci giochi a lungo' },
  { id: 22, quando: '2026-10-05', gioco: 'sotterraneo',
    testo: '🔥 Nell\'abisso, scendendo, arriva un posto nuovo: la fornace dei diavoletti' },
  { id: 23, quando: '2026-10-05', gioco: 'sotterraneo',
    testo: '🕯️ Nel sotterraneo le discese hanno posti diversi: cantine, cripta e fornace' },
  { id: 24, quando: '2026-10-05', gioco: 'fattoria',
    testo: '🎃 Gli animali della fattoria si sono travestiti per Halloween' },
  { id: 25, quando: '2026-10-06', gioco: 'sotterraneo',
    testo: '🗝️ Il Dungeon ha chiuso le sue porte: l\'avventura continua nel sotterraneo, più grande e tutto da esplorare' },
]

export const PER_GIOCO = 4

export const ULTIMA = NOVITA.reduce((m, n) => Math.max(m, n.id), 0)

// pura, test/unita/novita-bambini: gruppi per gioco (null = tutti), il più fresco in cima
export function daLeggere (segno, inCasa = () => true, elenco = NOVITA) {
  const da = typeof segno === 'number' ? segno : 0
  const gruppi = new Map()
  for (const n of [...elenco].sort((a, b) => b.id - a.id)) {
    if (n.id <= da) continue
    if (n.gioco && !inCasa(n.gioco)) continue
    const chi = n.gioco || null
    if (!gruppi.has(chi)) gruppi.set(chi, [])
    const voci = gruppi.get(chi)
    if (voci.length < PER_GIOCO) voci.push(n)
  }
  return [...gruppi].map(([gioco, voci]) => ({ gioco, voci }))
}
