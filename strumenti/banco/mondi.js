/* ═══════════════════════════════════════════════════════════════════
   I MONDI DEL BANCO — un adattatore, e tre mondi che si somigliano

   Il banco (`mondo.js`) non sa che esistano la fattoria, il sotterraneo
   o il castello: sa che esiste **un mondo**, che risponde a quattro
   domande e nient'altro. Tutto quello che di un gioco è particolare sta
   qui dentro, e per i tre mondi a sprite è pochissimo — un import e una
   misura — perché da quando gli atlanti hanno un catalogo standard
   (`strumenti/sprite/catalogo.py`) parlano tutti la stessa lingua.

   ── il patto ──
     id, nome        chi è
     tessera         quanto vale una casella in pixel dello sprite
     voci            l'elenco delle cose, già raggruppate
     pronto()        una promessa: il foglio è caricato
     disegna(ctx, q) posa una cosa. `q` è
                     { voce, posa, fotogramma, x, y, gira, specchia },
                     con x e y **in pixel dello sprite**
     strade          se il mondo sa comporre percorsi: il catalogo delle
                     pose e la funzione che le mette in fila. Ce l'ha
                     solo chi ha tessere con gli attacchi misurati.

   Un mondo che non è fatto di sprite — i pittori procedurali del
   Generale, per dire — entra qui rispondendo alle stesse quattro
   domande: `disegna` chiamerebbe il pittore invece di `drawImage`, e il
   banco non se ne accorgerebbe. È il motivo per cui l'interfaccia parla
   di «voci» e non di «pezzi dell'atlante».
   ═══════════════════════════════════════════════════════════════════ */
import { creaFoglio, netto } from '../../src/grafica/atlante.js'
import { pose, componiPercorso, latiDi } from '../../src/grafica/tessere.js'

/* Un mondo fatto di sprite: tutti e tre lo sono, e differiscono solo per
   quale modulo importano. Il modulo lo passa chi chiama già caricato —
   un `import()` dinamico — così questo file non ha dentro nessun
   percorso e aggiungere un mondo è una riga in `MONDI`. */
function mondoASprite({ id, nome, atl }) {
  const foglio = creaFoglio({ pezzi: atl.PEZZI, immagine: atl.ATLANTE, tessera: atl.TESSERA })
  const attesa = foglio.carica().catch(() => null)

  const mondo = {
    id, nome,
    tessera: atl.TESSERA,
    voci: atl.VOCI,
    pronto: () => attesa,

    /* Il disegno di una cosa. Il giro sta **nel contesto** e non
       nell'atlante: otto copie di ogni pezzo costerebbero otto volte il
       peso di un file che il telefono scarica, e girare a schermo non
       costa niente. Chi può essere girato lo dice la voce (`giri`), e
       il banco non offre la manopola a chi non può. */
    disegna(ctx, { voce, posa = 'fermo', fotogramma = 0, x, y, gira = 0, specchia = false }) {
      const fotogrammi = (voce.pose || {})[posa] || []
      const nomePezzo = fotogrammi[fotogramma % Math.max(1, fotogrammi.length)]
      if (!nomePezzo) return false
      const m = foglio.misura(nomePezzo)
      if (!m) return false
      ctx.save()
      ctx.translate(x, y)
      if (gira) ctx.rotate(gira * Math.PI / 2)
      if (specchia) ctx.scale(-1, 1)
      /* Una tessera riempie la sua casella e si centra; tutto il resto
         si appoggia **col piede**, e sborda verso l'alto. È la
         differenza che permette a un albero di stare dietro a chi ci
         passa davanti invece di galleggiargli sopra. */
      const dy = (voce.famiglia === 'tessera' || voce.famiglia === 'fondo')
        ? -m.h / 2 : -m.h + atl.TESSERA / 2
      foglio.pezzo(ctx, nomePezzo, -m.w / 2, dy)
      ctx.restore()
      return true
    },

    misura(voce, posa = 'fermo') {
      const n = ((voce.pose || {})[posa] || [])[0]
      return n ? foglio.misura(n) : null
    },
  }

  /* ── le strade ──
     Un mondo sa comporre percorsi se le sue tessere portano gli
     attacchi, cioè se qualcuno li ha misurati dal foglio. Oggi è solo
     il castello; il giorno che un altro foglio a griglia passa da
     `terreni.py` questo si accende da sé, perché guarda i dati e non il
     nome del gioco. */
  const conAttacchi = atl.VOCI.filter(v => v.famiglia === 'tessera' && v.attacchi)
  if (conAttacchi.length) {
    mondo.strade = {
      materie: [...new Set(conAttacchi.map(v => v.materia))].filter(Boolean).sort(),
      fondiDi: materia => atl.VOCI.filter(v => v.famiglia === 'fondo' && v.materia === materia),
      /* il catalogo di una materia: ogni tessera nelle sue pose — quattro
         giri per due versi, senza i doppioni */
      catalogoDi(materia) {
        return conAttacchi
          .filter(v => v.materia === materia)
          .flatMap(v => pose(v.pose.fermo[0], v.attacchi))
      },
      componi: componiPercorso,
      latiDi,
    }
  }

  return mondo
}

/* L'elenco dei mondi. Ognuno dice solo dove sta il suo atlante: il
   resto è uguale per tutti, ed è esattamente il punto della
   standardizzazione. */
export const MONDI = [
  { id: 'fattoria', nome: 'La fattoria',
    carica: () => import('../../src/giochi/fattoria/dati/atlante.js') },
  { id: 'sotterraneo', nome: 'Il sotterraneo',
    carica: () => import('../../src/giochi/sotterraneo/dati/atlante.js') },
  { id: 'castello', nome: 'Il castello a tessere',
    carica: () => import('../../src/giochi/castello/dati/atlante.js') },
]

const aperti = new Map()

export async function apri(id) {
  if (aperti.has(id)) return aperti.get(id)
  const m = MONDI.find(x => x.id === id) || MONDI[0]
  const atl = await m.carica()
  const mondo = mondoASprite({ id: m.id, nome: m.nome, atl })
  await mondo.pronto()
  aperti.set(id, mondo)
  return mondo
}

export { netto }
