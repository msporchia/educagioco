// I mostri di sopra nella vista del mondo (viste/Mondo3d.vue): lo stato del motore (motore/aperta.js) tenuto per l'eroe e il giro, il
// passo di ogni fotogramma (chi si sveglia, chi insegue, chi apre lo scontro), i passi dell'eroe, il tocco su un mostro, cosa si
// disegna e cosa si salva. Le regole: docs/sotterraneo/mondo-aperto-mostri.md, «Cosa si aspetta dalla scena». Niente Vue, niente three.
import { riprendiMondo, inSalvo, nuovoGiro, mostriVicini, muoviMostri, cammina, incontro } from '../motore/aperta.js'
import { rimettiLoScontro, doveToccare, abbastanzaVicino } from '../motore/aperta-scena.js'
import { mostriDaDisegnare, coseDaDisegnare } from '../scena3d/mondo/mostri.js'
import { COSE } from '../dati/cose.js'

// `salvato`: `mondo.sopra` dell'avventura; con dentro lo scontro lasciato con la ✕ (`scontro`), i rimasti tornano accanto all'eroe
export function creaMostriSopra({ m, eroe, giro, salvato = null }) {
  let stato = riprendiMondo({ mondo: m, eroe, giro, salvato })
  if (salvato && salvato.eroe === eroe && salvato.giro === giro && salvato.scontro) rimettiLoScontro(stato, salvato.scontro)
  const memoria = new Map()
  let mira = null   // il mostro toccato a cui l'eroe sta andando incontro

  return {
    get stato() { return stato },
    get mira() { return mira },
    lascia() { mira = null },
    // entrando in città il giro sale: quello che vive sopra rinasce (restano i passi, le forze e le cose per terra)
    giro(g) { if (g !== stato.giro) { stato = nuovoGiro(stato, g); memoria.clear(); mira = null } },
    // un fotogramma, `dt` secondi veri; `fermo`: niente si muove (una domanda, un dialogo, la veduta, un pannello). Torna l'incontro
    // che apre uno scontro (motore/aperta.js, `incontro`), o null
    passo(dt, io, { fermo = false } = {}) {
      if (fermo || !(dt > 0)) return null
      muoviMostri(stato, { x: io.x, y: io.z }, dt)
      const q = mira != null ? stato.mostri[mira] : null
      if (q && q.morto) mira = null
      const tocco = q && !q.morto && abbastanzaVicino(q, io.x, io.z) ? mira : null
      const inc = incontro(stato, { x: io.x, y: io.z }, { tocco })
      if (inc) mira = null
      return inc
    },
    // `n` celle camminate (il mana torna, i morti col loro passo arrivato tornano a casa); torna se le forze sono cambiate
    passi(n, io, energiaMax) {
      const e = stato.forze ? stato.forze.energia : null
      cammina(stato, n, { x: io.x, y: io.z, energiaMax })
      return !!stato.forze && stato.forze.energia !== e
    },
    // il tocco su un mostro: lo scontro subito se è a portata, se no la cella dove andargli incontro (e lo si ricorda)
    tocca(i, io, passa) {
      const q = stato.mostri[i]
      if (!q || q.morto) return null
      if (abbastanzaVicino(q, io.x, io.z)) { mira = i; return { subito: true } }
      const c = doveToccare(q, passa)
      if (!c) return null
      mira = i
      return { cella: c }
    },
    // cosa si disegna adesso (scena3d/mondo/mostri.js): i mostri nel cerchio e fuori dalla nebbia, e il bottino per terra
    figure(io, t, visto, salta = null) { return mostriDaDisegnare(mostriVicini(stato, io.x, io.z), { x: io.x, z: io.z, t, visto, salta, memoria }) },
    perTerra(visto) { return coseDaDisegnare(stato.perTerra, { visto, cose: COSE }) },
    // quello che va in `mondo.sopra`, con lo scontro aperto o lasciato (`scontro`: motore/aperta-scena.js, fotoDelloScontro)
    inSalvo(scontro = null) { return { ...inSalvo(stato), ...(scontro ? { scontro } : {}) } },
  }
}
