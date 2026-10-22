// I tre stadi delle bestie del secondo cortile (coniglio, alpaca, asino, arnia), come numeri: la stessa forma di `profiloBestia` di bestie-puro.js
// (che li chiama quando non conosce la specie), senza three e senza DOM. Il filo `f` è la pienezza di bestie-puro.js: 0 a fame, da PIENO_MIN a PIENO_MAX
// al lavoro, 1 da pronta; ogni misura è una interpolazione di `f`, quindi nutrire riempie, aspettare riempie, raccogliere svuota.
// Vedi docs/fattoria3d/cortile-2.md, «I tre stadi».
//
//   coniglio  fame: magro, orecchie giù, pelo scarso · lavoro: il pelo cresce a nuvola · pronto: palla di pelo, orecchie dritte, il gomitolo accanto
//   alpaca    fame: collo basso, vello rado · lavoro: il vello cresce · pronta: vello enorme, ciuffo in testa, il gomitolo accanto
//   asino     fame: testa a terra, orecchie giù · lavoro: un mucchio fuma e cresce · pronto: in piedi, orecchie dritte, il sacco di concime accanto
//   arnia     fame: spenta, niente api, favi vuoti · lavoro: le api entrano, il miele sale · pronta: colma, il vasetto d'oro accanto, api in volo

export const SPECIE_CORTILE_2 = ['coniglio', 'alpaca', 'asino', 'arnia']

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = x => (x > 0 ? (x < 1 ? x : 1) : 0)
const liscia = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }

/** Riempie `out` con il profilo di una delle quattro specie; `f` è la pienezza, `p` il progresso del lavoro (0..1), `pronta` 0 o 1. Torna false per un'altra specie. */
export function profiloCortile2 (specie, out, stadio, p, f, pronta) {
  if (specie === 'coniglio') {
    out.sx = lerp(0.8, 1.05, f); out.sy = lerp(0.62, 1.0, f); out.sz = lerp(0.9, 1.05, f)
    out.corpoY = lerp(-0.025, 0, f)
    out.testaY = lerp(-0.05, 0.02, f); out.testaX = lerp(0.7, -0.12, f)
    out.orecchie = lerp(1.25, 0.12, f)               // quanto le orecchie cadono di lato (0 = dritte)
    out.pelo = lerp(0.4, 1.5, f)                     // la nuvola di pelo d'angora: scarsa, poi enorme
    out.lento = lerp(0.5, 1, f)
    out.salto = pronta                               // da pronto salterella
    out.dono = pronta                                // il gomitolo di lana
  } else if (specie === 'alpaca') {
    out.sx = lerp(0.8, 1.05, f); out.sy = lerp(0.7, 1.05, f); out.sz = lerp(0.9, 1.04, f)
    out.corpoY = lerp(-0.04, 0, f)
    out.testaY = lerp(-0.12, 0.04, f); out.testaX = lerp(0.6, -0.1, f)
    out.collo = lerp(0.72, 1.1, f)                   // il collo si allunga quando sta bene
    out.lana = lerp(0.35, 1.45, f)                   // il vello: rado, poi una nuvola
    out.ciuffo = liscia(0.6, 1, f)                   // il ciuffo sulla fronte spunta tardi
    out.orecchie = lerp(1.0, 0.1, f)
    out.lento = lerp(0.5, 1, f)
    out.dono = pronta                                // il gomitolo
  } else if (specie === 'asino') {
    out.sx = lerp(0.76, 1.08, f); out.sy = lerp(0.66, 1.1, f); out.sz = lerp(0.92, 1.03, f)
    out.corpoY = lerp(-0.04, 0, f)
    out.testaY = lerp(-0.14, 0.02, f); out.testaX = lerp(0.9, -0.05, f)
    out.orecchie = lerp(1.3, 0.12, f)
    out.coda = lerp(0.1, 1, f)
    out.lento = lerp(0.5, 1, f)
    out.mucchio = stadio <= 0 ? 0 : stadio >= 2 ? 1 : lerp(0.2, 0.85, clamp01(p))     // il mucchio fumante cresce mentre lavora
    out.dono = pronta                                // il sacco di concime
  } else if (specie === 'arnia') {
    out.miele = f                                    // quanto sono pieni i favi (e quanto è alto il favo che si vede)
    out.api = lerp(0.25, 1, f)                       // quante api in volo
    out.coperchio = liscia(0.8, 1, f)                // da pronta il coperchio si solleva
    out.gocciola = stadio === 1 && p > 0.35 ? 1 : 0  // una goccia d'oro cade dal favo
    out.lento = lerp(0.5, 1, f)
    out.dono = pronta                                // il vasetto di miele
  } else return false
  return true
}
