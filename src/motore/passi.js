/* ═══════════════════════════════════════════════════════════════════
   DOVE SI PUÒ METTERE IL PIEDE, E COME CI SI ARRIVA

   Il pezzo di motore che mancava, e che due giochi stavano scrivendo
   ognuno per conto suo: la fattoria (dove può camminare il cane, dove
   ci sta una casetta) e il sotterraneo (dove si passa, come si arriva
   a quel forziere lì). Sono la stessa domanda — **quali celle sono
   buone, e che strada le unisce** — e finché stava dentro le due
   classi non si poteva né provare da sola né correggere una volta per
   tutte.

   ── LA REGOLA: LO SPAZIO ARRIVA DA FUORI ──────────────────────────
   Qui dentro non c'è nessuna mappa. Chi chiama passa `buona(x, y)`,
   una funzione che dice se su quella cella ci si può stare, e questo
   file non sa **perché**: se è roccia, se è bosco di qualcun altro, se
   c'è un mostro addormentato in mezzo. È la stessa scelta di
   `tessere.js`, che non sa cosa sia un'acqua e chiede «questa cella è
   dello stesso genere?».

   Ne segue una cosa comoda: lo stesso pezzo di codice risponde a
   domande diverse cambiando solo `buona`. «Dove arrivo camminando» e
   «dove arriverei se le porte chiuse fossero aperte» sono la stessa
   ricerca fatta due volte con due funzioni diverse — ed è così che si
   controlla che un livello sia finibile senza doverlo giocare.

   ── PERCHÉ IN AMPIEZZA, E NON A* ──────────────────────────────────
   Le griglie di questi giochi sono piccole (qualche migliaio di celle)
   e i passi costano tutti uguali: una ricerca in ampiezza dà **la
   strada più corta** senza euristiche da tarare, e si legge in dieci
   righe. A* si mette quando servirà davvero, non prima.

   Il tetto di celle visitate non è pignoleria: `buona` la scrive chi
   chiama, e una `buona` che dice sempre sì — un errore di segno sui
   bordi — manderebbe la ricerca a esplorare l'infinito e il telefono
   a bloccarsi in silenzio.
   ═══════════════════════════════════════════════════════════════════ */

/* I quattro passi. In diagonale non si va: su una griglia a tessere
   una diagonale passa **fra due muri** che si toccano per un angolo, e
   a schermo si vede un personaggio attraversare la roccia. */
export const PASSI = [[1, 0], [-1, 0], [0, 1], [0, -1]]

const chiave = (x, y) => x + ',' + y

/* Quante celle si esplorano al massimo prima di dire basta. Cinquantamila
   sono molte più di qualunque mappa di questi giochi e molte meno di un
   telefono bloccato. */
const TETTO = 50000

/* ── dove si arriva ──
   Tutte le celle raggiungibili da `da`, come Set di chiavi `"x,y"`.
   Serve a due cose che sembrano diverse e sono la stessa: illuminare
   una zona, e **controllare che un livello si possa finire**. */
export function raggiungibili(buona, da, tetto = TETTO) {
  const visti = new Set()
  if (!buona(da.x, da.y)) return visti
  const coda = [da]
  visti.add(chiave(da.x, da.y))
  for (let i = 0; i < coda.length && visti.size < tetto; i++) {
    const q = coda[i]
    for (const [dx, dy] of PASSI) {
      const x = q.x + dx, y = q.y + dy, k = chiave(x, y)
      if (visti.has(k) || !buona(x, y)) continue
      visti.add(k)
      coda.push({ x, y })
    }
  }
  return visti
}

export const siArriva = (buona, da, a, tetto = TETTO) =>
  raggiungibili(buona, da, tetto).has(chiave(a.x, a.y))

/* ── la strada ──
   La fila di celle da fare per andare da `da` ad `a`, **esclusa quella
   di partenza e inclusa quella d'arrivo** — cioè esattamente i passi
   da compiere, che è quello che serve a chi cammina. `null` se non
   c'è strada: un percorso vuoto vorrebbe dire «sei già arrivato», ed è
   un'altra cosa.

   `arrivoLibero` serve al caso più comune di tutti: la cella d'arrivo
   è occupata proprio da quello che si vuole raggiungere (un mostro, un
   forziere). Con `false` la meta si può attraversare solo per
   arrivarci, mai per passarci in mezzo. */
export function percorso(buona, da, a, { tetto = TETTO, arrivoLibero = true } = {}) {
  if (da.x === a.x && da.y === a.y) return []
  const meta = chiave(a.x, a.y)
  const passabile = (x, y) =>
    (!arrivoLibero && x === a.x && y === a.y) || buona(x, y)
  if (!passabile(a.x, a.y)) return null

  const prima = new Map()
  const visti = new Set([chiave(da.x, da.y)])
  const coda = [da]
  for (let i = 0; i < coda.length && visti.size < tetto; i++) {
    const q = coda[i]
    for (const [dx, dy] of PASSI) {
      const x = q.x + dx, y = q.y + dy, k = chiave(x, y)
      if (visti.has(k) || !passabile(x, y)) continue
      visti.add(k)
      prima.set(k, q)
      if (k === meta) {
        const strada = []
        let p = { x, y }
        while (p) {
          strada.push({ x: p.x, y: p.y })
          p = prima.get(chiave(p.x, p.y))
        }
        strada.pop()                       // la cella di partenza non è un passo
        return strada.reverse()
      }
      coda.push({ x, y })
    }
  }
  return null
}

/* ── la cella da cui toccare una cosa ──
   Dove ci si ferma per raggiungere qualcosa che sta su una cella dove
   non si può salire. Fra le vicine buone si prende **quella più comoda
   per chi arriva**, non la prima in ordine di lettura: altrimenti si
   gira intorno a un forziere per fermarsi dall'altra parte.

   `sopra` dice se vale anche stare sulla cella stessa — una scala ci
   si sale sopra, un mostro no. */
export function accanto(buona, meta, da, { sopra = false } = {}) {
  const scelte = sopra ? [[0, 0], ...PASSI] : PASSI
  let meglio = null
  for (const [dx, dy] of scelte) {
    const x = meta.x + dx, y = meta.y + dy
    if (!buona(x, y)) continue
    const d = Math.abs(x - da.x) + Math.abs(y - da.y)
    if (!meglio || d < meglio.d) meglio = { x, y, d }
  }
  return meglio ? { x: meglio.x, y: meglio.y } : null
}

/* ── accanto, E raggiungibile ──
   `accanto` risponde a «dove mi fermo», e sceglie la vicina più comoda
   **per chi arriva**: la più vicina in linea d'aria. Non è sempre la
   stessa cosa che «dove riesco ad arrivare» — un mostro fermo in un
   corridoio ha due lati, e quello più vicino a me può essere proprio
   quello di là. Chiedere la strada verso quello, trovarla chiusa e
   concludere «di là non si passa» è il guasto che ne segue: il gioco
   dice di no a un tocco che era perfettamente possibile, e chi tocca non
   ha modo di sapere che bastava girarci intorno.

   Qui si provano tutte le vicine buone, dalla più comoda, e si torna la
   prima **a cui una strada c'è davvero**, con la strada già calcolata —
   così chi chiama non la ricalcola. `sopra` dice se vale anche stare
   sulla cella stessa: su una scala ci si sale, su un mostro no.

   ── E QUANDO SI SALE, LA CELLA STESSA VIENE PRIMA ─────────────────
   Non ordinata insieme alle altre: **prima**. Ordinandola per distanza
   perde sempre, perché chi arriva incontra la vicina un passo prima
   della meta — e si ferma lì. Sulle monete si vedeva ad occhio nudo: il
   dito le tocca, l'eroe si pianta accanto e non le raccoglie, perché le
   gemme si prendono camminandoci **sopra**. L'unico modo di prenderle
   era mirare una cella più in là e passarci per caso.

   Costa fino a cinque ricerche invece di una, e succede solo quando si
   tocca qualcosa: su griglie di qualche migliaio di celle non si sente. */
export function viaVerso(buona, meta, da, { sopra = false, tetto = TETTO } = {}) {
  const scelte = PASSI
    .map(([dx, dy]) => ({ x: meta.x + dx, y: meta.y + dy }))
    .filter(p => buona(p.x, p.y))
    .sort((a, b) => (Math.abs(a.x - da.x) + Math.abs(a.y - da.y)) -
                    (Math.abs(b.x - da.x) + Math.abs(b.y - da.y)))
  if (sopra && buona(meta.x, meta.y)) scelte.unshift({ x: meta.x, y: meta.y })
  for (const p of scelte) {
    if (p.x === da.x && p.y === da.y) return { dove: p, strada: [] }
    const strada = percorso(buona, da, p, { tetto })
    if (strada) return { dove: p, strada }
  }
  return null
}

/* ── la cella libera più vicina ──
   Per posare qualcosa quando il posto chiesto è occupato: un animale
   comprato quando la stalla è piena di roba, un oggetto lasciato cadere
   da un mostro caduto addosso a un muro. Si allarga a cerchi finché non
   trova, e si ferma: meglio niente che una cosa piazzata dall'altra
   parte della mappa. */
export function primaLibera(buona, da, raggio = 6) {
  if (buona(da.x, da.y)) return { x: da.x, y: da.y }
  for (let r = 1; r <= raggio; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const x = da.x + dx, y = da.y + dy
        if (buona(x, y)) return { x, y }
      }
  return null
}

/* ── quanto è distante, camminando ──
   Non in linea d'aria: **a passi**. Serve a decidere dove mettere
   l'uscita di un livello (la stanza più lontana *da percorrere*, non
   quella che sta più in là sulla carta) e a misurare se un posto è
   fuori mano. `Infinity` se non ci si arriva affatto. */
export function passiFra(buona, da, a, tetto = TETTO) {
  const strada = percorso(buona, da, a, { tetto })
  return strada ? strada.length : Infinity
}
