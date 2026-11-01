/* Le sagome del Sotterraneo 3D (docs/sotterraneo/sagome-3d.md): la figura piatta di chi non ha il modello in scena è la foto del suo
   modello. Il file dati/sagome-fatte.js è generato (`npm run anteprime sotterraneo`, strumenti/sagome-sotterraneo3d.mjs): una voce
   per ogni modello che il registro può dare e per ogni persona di sopra, otto direzioni con tutte le pose, un atlante solo che sta in
   una texture del telefono; la firma dell'atlante torna e quella dei sorgenti pure (un modello cambiato vuole le foto rifatte). Poi le
   regole pure: la direzione, la posa, il cartello.
   tempo: 2 */
import { SAGOME, SENZA, FIRMA, SORGENTI, LARGO, ALTO, IMMAGINE, NORMALI } from '../../src/giochi/sotterraneo/dati/sagome-fatte.js'
import { vociDaFotografare, firmaDi, firmaSorgenti } from '../../strumenti/sagome-sotterraneo3d.mjs'
import { DIREZIONI, POSE_MOSTRO, POSE_PERSONA, QUANTI_RESPIRO, COLPO, PASSO_RESPIRO, COS, direzioneDi, yawDi, posaDi, cartelloDi, scalaDelModello } from '../../src/giochi/sotterraneo/scena3d/sagome-pura.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* ── il file generato ── */
const voci = vociDaFotografare()
stessaLista('una sagoma (o il «senza modello») per ogni modello di mostro e ogni persona (se no: npm run anteprime sotterraneo)',
            [...Object.keys(SAGOME), ...SENZA].sort(), voci.map(v => v.id).sort())
uguale('nessun modello senza foto', SENZA.length, 0)
const storte = []
for (const v of voci) {
  const s = SAGOME[v.id]
  if (!s) continue
  const attese = DIREZIONI * (v.persona ? POSE_PERSONA : POSE_MOSTRO)
  if (s.f.length !== attese) storte.push(`${v.id}: ${s.f.length} foto invece di ${attese}`)
  if (!(s.alto > 0 && s.largo > 0 && s.px > 0)) storte.push(`${v.id}: misura ${s.alto} ${s.largo} ${s.px}`)
  for (const f of s.f) if (f[0] < 0 || f[1] < 0 || f[0] + Math.abs(f[2]) > LARGO || f[1] + f[3] > ALTO || !f[3]) { storte.push(`${v.id}: [${f}] fuori dall'atlante`); break }
  if (v.persona && s.att) storte.push(`${v.id}: una persona con l'attacco`)
}
stessaLista('ogni modello ha otto direzioni con tutte le pose, dentro l\'atlante', storte, [])
const lato = uri => { const b = Buffer.from(String(uri).replace(/^data:image\/webp;base64,/, ''), 'base64'); return { b, l: b.toString('latin1', 12, 16) === 'VP8X' ? [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)] : null } }
const im = lato(IMMAGINE), nm = lato(NORMALI)
uguale('l\'atlante è un WebP della misura detta', String(im.l), `${LARGO},${ALTO}`)
uguale('le normali sono a metà misura', String(nm.l), `${LARGO / 2},${Math.ceil(ALTO / 2)}`)
controlla(`nessun lato oltre 4096 px (un telefono non lo carica): ${LARGO}×${ALTO}`, LARGO <= 4096 && ALTO <= 4096)
const kb = Math.round((im.b.length + nm.b.length) / 1024)
controlla(`atlante e normali sotto 2,5 MB (${kb} KB)`, kb <= 2.5 * 1024)
uguale('la firma dell\'atlante torna (il file non si scrive a mano)', FIRMA, firmaDi(IMMAGINE + NORMALI, SAGOME))
uguale('i modelli sono quelli fotografati (se no: npm run anteprime sotterraneo)', SORGENTI, firmaSorgenti())

/* ── la direzione e la posa ── */
uguale('guarda la telecamera: la prima direzione', direzioneDi(0), 0)
uguale('di tre quarti a destra (chi dorme, 0,9 rad): la seconda', direzioneDi(0.9), 1)
uguale('di tre quarti a sinistra: l\'ultima', direzioneDi(-0.9), DIREZIONI - 1)
uguale('di spalle', direzioneDi(Math.PI), DIREZIONI / 2)
controlla('un giro intero torna alla stessa', direzioneDi(0.3 + 2 * Math.PI) === direzioneDi(0.3) && direzioneDi(yawDi(3)) === 3)
uguale('il respiro: il primo istante', posaDi({ t: 0 }), 0)
uguale('il respiro: un passo dopo, il secondo', posaDi({ t: PASSO_RESPIRO * 1.01 }), 1)
uguale('il respiro gira', posaDi({ t: PASSO_RESPIRO * QUANTI_RESPIRO * 1.01 }), 0)
uguale('all\'arrivo del colpo, la posa del colpo', posaDi({ t: 0, attacco: 0.5, arrivo: 0.5, haColpo: true }), QUANTI_RESPIRO)
uguale('ai capi del colpo, il respiro (come il modello, a riposo)', posaDi({ t: 0, attacco: 0.02, arrivo: 0.5, haColpo: true }), 0)
uguale('chi non ha il colpo respira', posaDi({ t: 0, attacco: 0.5, arrivo: 0.5, haColpo: false }), 0)
uguale('caduto: la posa a terra', posaDi({ t: 0, caduto: 1 }), QUANTI_RESPIRO + COLPO.length)
uguale('una persona respira soltanto', posaDi({ t: PASSO_RESPIRO * 1.5, caduto: 1, persona: true }), 1)

/* ── il cartello e la misura ── */
{
  const c = cartelloDi([0, 0, 20, 40, 10, 0], 1, 20, COS)
  controlla('i piedi in mezzo al ritaglio: niente scarto', Math.abs(c.dx) < 1e-9 && c.y === 0 && c.dz === 0)
  controlla('largo un pixel per k/px celle, alto 1/cos', Math.abs(c.largo - 1) < 1e-9 && Math.abs(c.alto - 2 / COS) < 1e-9)
  const sotto = cartelloDi([0, 0, 20, 40, 10, 5], 1, 20, COS), sopra = cartelloDi([0, 0, 20, 40, 10, -5], 1, 20, COS)
  controlla('quello che sta sotto i piedi: il cartello avanza, non scende sotto il pavimento', sotto.dz > 0 && sotto.y === 0)
  controlla('chi vola: il cartello parte più su', sopra.y > 0 && sopra.dz === 0)
  const specchiata = cartelloDi([0, 0, -20, 40, 5, 0], 1, 20, COS)
  controlla('la foto specchiata ha la stessa misura', Math.abs(specchiata.largo - 1) < 1e-9 && specchiata.dx > 0)
  uguale('la misura: RAPPORTO dell\'altezza del posto', scalaDelModello(1, 0.5, 2), 2 * 0.72)
  controlla('mai più largo di LARGO_MAX celle (di più per chi ha un posto alto: i grossi)', scalaDelModello(1, 4, 1.5) * 4 <= 1.5 + 1e-9 && scalaDelModello(1, 4, 3.2) * 4 > 1.5)
}

riassunto('le sagome del Sotterraneo 3D')
