/* ═══════════════════════════════════════════════════════════════════
   IL GIRO DEL MONDO DELLA BANCARELLA, SENZA BROWSER

   Le giornate non cambiano e i salvataggi nemmeno: le città le raggruppano
   in ordine, tutte e una volta sola, e lo stato di una città si ricava da
   quante ne sono state finite. Poi la geometria, che a occhio non si
   controlla: i segnaposto, i nomi, le piste e i monumenti non si
   sovrappongono fra città; l'aereo vola su un arco che sta dentro il mondo
   e arriva girato come la rotta; nella piazza i banchi stanno dentro lo
   schermo a ogni larghezza da telefono e il carretto, che va solo lungo il
   viale, non passa mai in mezzo a un banco.
   Vedi docs/bancarella/mappa.md.
   `node test/esegui.mjs bancarella-mondo --niente-build` */
import { CAMPAGNE, LIBERA } from '../../src/data/bancarella.js'
import { CITTA, MONDO, POSTEGGIO, posteggio, statoCitta, statoGiornata, cittaCorrente, fatteIn,
         indiceDi, cittaDelleGiornata, primaDi } from '../../src/data/bancarella-mondo.js'
import { fondaleMondo, fondalePiazza } from '../../src/data/bancarella-fondali.js'
import { arco, lunghezza, lungo, giro, durataVolo, versoFinale, versoIniziale, versoDiPartenza,
         disponiPiazza, stradaCarretto, PIAZZA_MAX, GIRA_PRIMA } from '../../src/motore/bancarella/mondo.js'
import { MONUMENTI, COLORI_PIAZZA } from '../../src/grafica/bancarella-mondo.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. le città raggruppano le giornate, e basta ══════════ */
const vere = CITTA.filter(c => !c.libera)
stessaLista('le giornate delle città sono tutte quelle della scaletta, nello stesso ordine',
            vere.flatMap(c => c.giornate), CAMPAGNE.map(g => g.id))
uguale('la libera sta in una città sola, da sola', CITTA.filter(c => c.libera).map(c => c.giornate.join()).join(), LIBERA.id)
controlla('da quattro a sei città, e la libera', vere.length >= 4 && vere.length <= 6, `${vere.length} città`)
controlla('ogni città ha da due a quattro giornate',
          vere.every(c => c.giornate.length >= 2 && c.giornate.length <= 4),
          vere.map(c => c.giornate.length).join())
uguale('gli id delle città sono tutti diversi', new Set(CITTA.map(c => c.id)).size, CITTA.length)
controlla('ogni città ha continente, racconto, monumento e un colore',
          CITTA.every(c => c.continente && c.racconto && MONUMENTI[c.monumento] && /^#[0-9a-f]{6}$/i.test(c.accento)))
controlla('e un cielo per la sua piazza', CITTA.every(c => COLORI_PIAZZA[c.id]))
controlla('l\'indice di una giornata è quello della scaletta, la libera -1',
          CAMPAGNE.every((g, i) => indiceDi(g.id) === i) && indiceDi('libera') === -1)
controlla('e la città si ritrova dall\'id', CAMPAGNE.every(g => CITTA[cittaDelleGiornata(g.id)].giornate.includes(g.id)))
nota('città: ' + CITTA.map(c => `${c.nome} (${c.libera ? 'libera' : c.giornate.length})`).join(' · '))

/* una città si apre con la sua prima giornata: l'ordine del mondo è quello della fila */
controlla('le città si aprono nell\'ordine della fila', vere.every((c, k) => !k || primaDi(c) > primaDi(vere[k - 1])))

/* ══════════ 2. lo stato di una giornata, di una città, e dove sta l'aereo ══════════ */
const aperta = fatto => i => i <= fatto
const stati = fatto => CITTA.map(c => statoCitta(c, fatto, aperta(fatto))).join(' ')
uguale('a profilo vuoto: la prima città tocca a te, le altre chiuse', stati(0),
       'ora chiusa chiusa chiusa chiusa chiusa chiusa')
uguale('finite le prime due giornate: Bologna è fatta, Roma tocca a te', stati(2),
       'fatta ora chiusa chiusa chiusa chiusa chiusa')
uguale('a metà di Roma: tocca ancora a Roma', stati(4).split(' ')[1], 'ora')
uguale('finita tutta la fila: tutte fatte e la libera aperta', stati(16),
       'fatta fatta fatta fatta fatta fatta aperta')
const aTutto = () => true
uguale('con tutto aperto (i grandi): la prima giornata resta quella da fare', stati.length && CITTA.map(c => statoCitta(c, 0, aTutto)).join(' '),
       'ora aperta aperta aperta aperta aperta aperta')
uguale('una giornata fatta, da fare, aperta dai grandi, chiusa',
       ['banchetto', 'paese', 'resto-dieci'].map(id => statoGiornata(id, 1, aperta(1))).join(),
       'fatta,ora,chiusa')
uguale('la libera è chiusa finché la fila non è finita', statoGiornata('libera', 15, aperta(15)), 'chiusa')
uguale('e dopo è aperta', statoGiornata('libera', 16, aperta(16)), 'aperta')
uguale('la città da fare è la prima col lavoro da fare', [0, 1, 2, 5, 6, 9, 11, 14, 15].map(f => CITTA[cittaCorrente(f, aperta(f))].id).join(),
       'bologna,bologna,roma,roma,parigi,new-york,rio,tokyo,tokyo')
uguale('finita la fila, la città da fare è la libera', CITTA[cittaCorrente(16, aperta(16))].id, 'cairo')
uguale('di Roma a metà ne risultano due finite', fatteIn(CITTA[1], 4), 2)
uguale('e nessuna prima del tempo', fatteIn(CITTA[1], 2), 0)

/* ══════════ 3. le città stanno sul mondo e non si pestano ══════════ */
const NOME_LARGO = 7.8, NOME_BASSO = 36, NOME_ALTO = 25   // il nome è sotto il tondo, come in `Mondo.vue`
const scatole = c => {
  const p = posteggio(c)
  const largo = c.nome.length * NOME_LARGO + 22
  return {
    tondo: [c.x - 26, c.y - 26, c.x + 26, c.y + 26],
    nome: [c.x - largo / 2, c.y + NOME_BASSO, c.x + largo / 2, c.y + NOME_BASSO + NOME_ALTO],
    pista: [p.x - 25, p.y - 11, p.x + 25, p.y + 11],
    monumento: [c.x - 94, c.y - 36, c.x - 94 + 64 * 0.9, c.y - 36 + 64 * 0.9],
  }
}
const siToccano = (a, b, m = 4) => a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m
const dentroIlMondo = b => b[0] >= 0 && b[1] >= 0 && b[2] <= MONDO.W && b[3] <= MONDO.H

const sopra = []
CITTA.forEach((c, i) => {
  const mie = scatole(c)
  for (const [k, b] of Object.entries(mie)) if (!dentroIlMondo(b)) sopra.push(`${c.nome}: ${k} esce dal mondo`)
  // l'aereo posato sta sulla pista, accanto al tondo: né sopra né lontano
  const p = posteggio(c)
  if (Math.hypot(p.x - c.x, p.y - c.y) < 40) sopra.push(`${c.nome}: l'aereo copre il tondo`)
  CITTA.forEach((d, j) => {
    if (j <= i) return
    const altre = scatole(d)
    for (const [k, b] of Object.entries(mie)) for (const [h, e] of Object.entries(altre))
      if (siToccano(b, e)) sopra.push(`${c.nome} (${k}) tocca ${d.nome} (${h})`)
  })
  // dentro la città i pezzi non si coprono: monumento, tondo, nome, pista
  const [t, n, pi, m] = [mie.tondo, mie.nome, mie.pista, mie.monumento]
  if (siToccano(t, m, 0)) sopra.push(`${c.nome}: il monumento tocca il tondo`)
  if (siToccano(n, pi, 0)) sopra.push(`${c.nome}: il nome tocca la pista`)
  if (siToccano(t, pi, 0)) sopra.push(`${c.nome}: la pista tocca il tondo`)
})
controlla('nel mondo nessuna città copre un\'altra e tutto sta dentro', sopra.length === 0, sopra.join(' | '))

/* ══════════ 4. l'arco dell'aereo ══════════ */
const posti = CITTA.map(posteggio)
let fuori = 0, storti = 0, lontano = 0
for (let a = 0; a < posti.length; a++) for (let b = 0; b < posti.length; b++) {
  if (a === b) continue
  const p = arco(posti[a], posti[b])
  if (p.some(([x, y]) => x < 0 || y < 0 || x > MONDO.W || y > MONDO.H)) fuori++
  const q = arco(posti[b], posti[a]).reverse()
  if (p.some((pt, i) => Math.hypot(pt[0] - q[i][0], pt[1] - q[i][1]) > 0.01)) storti++
  const [ax, ay] = p[0], [bx, by] = p[p.length - 1]
  if (Math.hypot(ax - posti[a].x, ay - posti[a].y) > 0.01 || Math.hypot(bx - posti[b].x, by - posti[b].y) > 0.01) lontano++
}
uguale('ogni arco fra due città resta dentro il mondo', fuori, 0)
uguale('l\'arco è lo stesso all\'andata e al ritorno', storti, 0)
uguale('e parte e arriva proprio dai due posti', lontano, 0)
{
  const p = arco({ x: 100, y: 400 }, { x: 500, y: 400 })
  controlla('l\'arco sale: il punto di mezzo sta più in alto', p[Math.floor(p.length / 2)][1] < 380)
  const retta = lunghezza([[100, 400], [500, 400]])
  controlla('ed è più lungo della retta', lunghezza(p) > retta)
}
{
  const p = arco(posti[1], posti[2])
  const fine = versoFinale(p), ini = versoIniziale(p)
  controlla('il verso di partenza e quello di arrivo sono quelli dell\'arco', Math.abs(giro(ini, lungo(p, 0).angolo)) < 0.05 &&
            Math.abs(giro(fine, lungo(p, 1).angolo)) < 0.05)
  controlla('un arco sale e scende: i due versi non sono uguali', Math.abs(giro(ini, fine)) > 0.2)
}
controlla('i voli durano fra uno e tre secondi', durataVolo(10) >= 1 && durataVolo(5000) <= 3)
controlla('una svolta piccola non fa girare sul posto, una grande sì', 0.2 < GIRA_PRIMA && Math.PI > GIRA_PRIMA)
{
  // l'aereo fermo senza aver volato guarda come la rotta che gli arriva, o quella che parte
  const v0 = versoDiPartenza(posti, 0), v1 = versoDiPartenza(posti, 1)
  uguale('il primo guarda dove parte la rotta', Math.round(v0 * 1000), Math.round(versoIniziale(arco(posti[0], posti[1])) * 1000))
  uguale('gli altri come arrivano', Math.round(v1 * 1000), Math.round(versoFinale(arco(posti[0], posti[1])) * 1000))
}
controlla('il posteggio è accanto al segnaposto', POSTEGGIO.dx >= 40 && Math.abs(POSTEGGIO.dy) <= 12)

/* ══════════ 5. la piazza, a ogni larghezza da telefono ══════════ */
const rettangolo = b => [b.x - b.w / 2, b.y, b.x + b.w / 2, b.y + b.h]
const MEZZO_CARRETTO = 20
for (const W of [320, 360, 390, 430, 520, 800]) for (const n of [1, 2, 3, 4]) {
  const P = disponiPiazza(W, n, 700)
  const nome = `${W} px, ${n} banchi`
  uguale(`${nome}: la piazza non supera la sua larghezza massima`, P.W, Math.min(W, PIAZZA_MAX))
  uguale(`${nome}: un banco per giornata`, P.banchi.length, n)
  controlla(`${nome}: i banchi stanno dentro la scena`,
            P.banchi.every(b => rettangolo(b)[0] >= 0 && rettangolo(b)[2] <= P.W && b.y >= P.cielo - 30 && b.y + b.h <= P.H),
            P.banchi.map(b => `${b.x}x${b.y}`).join())
  const sovrapposti = []
  P.banchi.forEach((a, i) => P.banchi.forEach((b, j) => { if (j > i && siToccano(rettangolo(a), rettangolo(b), 8)) sovrapposti.push(`${i}-${j}`) }))
  controlla(`${nome}: i banchi non si toccano`, sovrapposti.length === 0, sovrapposti.join())
  controlla(`${nome}: dal primo in basso salgono, uno per volta`, P.banchi.every((b, k) => !k || b.y < P.banchi[k - 1].y))
  controlla(`${nome}: a destra e a sinistra del viale, a turno`, P.banchi.every((b, k) => b.lato === (k % 2 ? 1 : -1)))
  controlla(`${nome}: il viale è libero dalla parte del carretto`,
            P.banchi.every(b => Math.abs(b.x - P.centro) - b.w / 2 >= MEZZO_CARRETTO + 2), P.banchi.map(b => b.x - P.centro).join())

  // il cartello per tornare al mondo sta in basso, accanto all'ingresso, e non copre un banco
  const cartello = [P.centro + 36, P.H - 128, P.centro + 114, P.H - 16]
  controlla(`${nome}: il cartello sta dentro la scena`, cartello[2] <= P.W && cartello[3] <= P.H, cartello.join())
  controlla(`${nome}: e non copre un banco`, P.banchi.every(b => !siToccano(rettangolo(b), cartello, 0)))
  const ingresso = [P.ingresso.x - MEZZO_CARRETTO, P.ingresso.y - 38, P.ingresso.x + MEZZO_CARRETTO, P.ingresso.y]
  controlla(`${nome}: né il carretto che arriva`, !siToccano(ingresso, cartello, 0))

  // la strada del carretto, da ogni posto a ogni altro: mai dentro un banco
  const posteg = [P.ingresso, ...P.banchi.map(b => b.posto)]
  let guasti = 0, tocchi = 0
  posteg.forEach((da, i) => posteg.forEach((a, j) => {
    if (i === j) return
    const strada = stradaCarretto(P, da, a)
    const l = lunghezza(strada)
    for (let d = 0; d <= l; d += 4) {
      const p = lungo(strada, d / l)
      const corpo = [p.x - MEZZO_CARRETTO, p.y - 38, p.x + MEZZO_CARRETTO, p.y]
      P.banchi.forEach((b, k) => {
        // il carretto sta davanti al suo banco, sul selciato: il suo e quello da cui parte lo sfiorano
        const suo = k === i - 1 || k === j - 1
        if (siToccano([p.x, p.y, p.x, p.y], rettangolo(b), 0)) guasti++
        if (!suo && siToccano(corpo, rettangolo(b), 0)) tocchi++
      })
    }
    const u = strada[strada.length - 1]
    if (Math.hypot(u[0] - a.x, u[1] - a.y) > 0.01) guasti++
  }))
  uguale(`${nome}: la strada del carretto non passa dentro un banco`, guasti, 0)
  uguale(`${nome}: né il suo corpo ne copre un altro`, tocchi, 0)

  // il banco più in alto sta sotto il cielo, e ogni banco ha davanti il suo posto sul selciato
  controlla(`${nome}: i posti sono sul selciato e dentro la scena`,
            P.banchi.every(b => b.posto.y <= P.H - 20 && b.posto.x >= MEZZO_CARRETTO && b.posto.x <= P.W - MEZZO_CARRETTO))
}
{
  // con la scena più bassa dello schermo si allarga in alto, e i banchi restano in basso
  const stretta = disponiPiazza(390, 2, 0), larga = disponiPiazza(390, 2, 800)
  controlla('una scena corta si allunga fino all\'altezza richiesta', larga.H >= 800 && stretta.H < 800)
  uguale('e i banchi restano ancorati al cartello', larga.H - larga.banchi[0].y, stretta.H - stretta.banchi[0].y)
}

/* ══════════ 6. i fondali dipinti: il posto c'è, le immagini no ══════════ */
uguale('senza file nel mondo non entra nessun fondale', fondaleMondo(), null)
uguale('né nelle piazze', CITTA.map(c => fondalePiazza(c.id)).filter(Boolean).length, 0)

riassunto('bancarella — il giro del mondo')
