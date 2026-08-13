/* ═══════════════════════════════════════════════════════════════════
   L'ARREDATORE — riempire una stanza sapendo com'è fatta

   Sopra la mappa piena, e separato da lei: qui non si scopre niente
   sulla forma della stanza, si *usa* quello che la decompressione ha
   già capito. Una funzione pura — stessa mappa e stesso seme, stessa
   stanza arredata — perché una stanza che cambia a ogni apertura non è
   una stanza, è un rumore.

   ── IL SEME SERVE ALLE IMPERFEZIONI, NON ALLE SCELTE ──
   Una macchia d'usura può nascere da un rumore: sbagliarla non vuol
   dire niente. Una botte no. Qui la conoscenza c'è davvero — questo è
   un bordo, questa è una soglia, questo muro dà sul prato — quindi le
   scelte sono **informate**, e il seme decide solo *quale* delle cose
   ammesse fra quelle che stanno bene lì.

   ── LA REGOLA CHE LE CONTIENE TUTTE ──
   **La mappa non si tocca.** Quello che nasce qui è vestito: si posa
   sui muri che ci sono già — dove l'ingombro è vero senza che nessuno
   debba dichiararlo — oppure è roba che si calpesta, e allora sta sul
   pavimento e non ferma niente. Nessuna casella cambia natura, quindi
   nessuna strada si accorcia o si allunga e nessun piano scritto ieri
   smette di funzionare oggi.
   In più, e per pulizia: niente sopra una cosa che è in gioco, né dove
   il livello ha chiesto una casella libera (`arredo.niente()`).

   Chi vuole un mobile che **occupa** lo scrive in legenda con
   `arredo.*`: è una decisione del livello, si vede nella mappa, e il
   banco la gioca.
   ═══════════════════════════════════════════════════════════════════ */

const K = (i, k) => i + ',' + k
const PASSI = [[0, -1], [1, 0], [0, 1], [-1, 0]]

/* ── UNA SORTE CHE NON DIPENDE DALL'ORA ──
   `Math.random` qui sarebbe un guasto: il fondale si ricostruisce a
   ogni apertura del livello, e la stanza cambierebbe sotto gli occhi
   di chi la sta studiando. Questo è il solito tritatutto: dallo stesso
   numero esce sempre lo stesso numero. */
const sorte = (n) => {
  let x = (n * 2654435761) % 4294967296
  x ^= x >>> 15; x = (x * 2246822507) % 4294967296
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

/* pesca fra le cose ammesse, con i pesi che il catalogo dichiara */
const pesca = (cose, r) => {
  const tot = cose.reduce((s, c) => s + (c.peso || 1), 0)
  let n = r * tot
  for (const c of cose) { n -= (c.peso || 1); if (n <= 0) return c }
  return cose[cose.length - 1]
}

export function arreda (piena, regole, { seme = 0, occupate = [], liberi = [],
                                         gia = [] } = {}) {
  if (!regole || !regole.cose || !regole.cose.length) return { arredi: {}, scenografia: [] }

  const vietate = new Set([...occupate, ...liberi])
  const arredi = {}
  const scenografia = []
  /* ── DOVE IL LIVELLO HA GIÀ MESSO LA MANO ──
     Una stanza in cui il livello ha appeso una torcia è una stanza già
     detta: non ne nascono altre. La presenza È la dichiarazione. */
  const dette = {}
  for (const d of gia) {
    const s = piena.stanza(Math.round(d.x), Math.round(d.y))
    if (s != null) (dette[s] = dette[s] || new Set()).add(d.che)
  }

  for (const stanza of piena.stanze) {
    const quante = Math.floor(stanza.area * (regole.riempimento || 0.06))
    if (!quante) continue
    /* le celle candidate della stanza, in ordine fisso (l'ordine di
       scansione), mescolate dal seme: fisso e diverso da stanza a
       stanza */
    const celle = stanza.celle.filter(({ x, y }) =>
      !vietate.has(K(x, y)) && !piena.soglia(x, y) && !piena.obbligata(x, y))
    /* ── SOLO LE FACCE CHE GUARDANO IN GIÙ ──
       Un muro ha quattro lati, ma dall'alto se ne vede uno: quello
       rivolto verso chi guarda, cioè con il pavimento **sotto**. Una
       torcia appesa al lato nord è una torcia dentro la roccia — e i
       pittori sono disegnati per quell'unico verso. */
    const facce = piena.facce.filter(f =>
      f.stanza === stanza.id && f.versoY === 1 && !vietate.has(K(f.x, f.y)))
    const mischia = (lista, sale) => lista
      .map((v, i) => [v, sorte(seme * 7919 + stanza.id * 131 + i * 17 + sale)])
      .sort((a, b) => a[1] - b[1]).map(([v]) => v)

    const libereMuro = mischia(facce, 3)
    const libereSuolo = mischia(celle, 5)
    let messe = 0
    for (let n = 0; messe < quante && n < quante * 6; n++) {
      const r = sorte(seme * 104729 + stanza.id * 977 + n)
      const cosa = pesca(regole.cose, r)
      if (dette[stanza.id] && dette[stanza.id].has(cosa.che)) continue

      /* ── QUELLO CHE HA UN VOLUME VA SUL MURO CHE C'È GIÀ ──
         La prima versione faceva il contrario: sceglieva una casella di
         pavimento contro una parete e la **murava**, perché una botte
         ingombra e la mappa non deve mentire. Ma murare una casella è
         cambiare la stanza, e si vedeva: nella grotta comparivano
         rettangoli di pavimento chiaro in mezzo alla roccia, come se
         qualcuno avesse aperto un buco per metterci dentro una
         stalagmite.
         Il verso giusto è l'altro. Il muro c'è già, il suo ingombro è
         già vero, e la faccia che dà sul pavimento è **esattamente**
         dove una cosa appoggiata alla parete si vedrebbe. Ci si mette
         il disegno sopra e non si tocca niente: la mappa resta quella
         che il livello ha scritto, cella per cella.
         Ed è anche la ragione per cui è sparita la regola sulle
         distanze che il banco aveva imposto — non serve controllare di
         non aver allungato una strada, se non si è spostato un
         sasso. */
      if (cosa.dove !== 'ovunque') {
        const f = libereMuro.shift()
        if (!f) continue
        vietate.add(K(f.x, f.y))
        scenografia.push({ che: cosa.che, x: f.x, y: f.y, versoX: f.versoX, versoY: f.versoY })
        messe++
        continue
      }
      /* `ovunque` è quello che si calpesta: una pozzanghera, un mucchio
         d'ossa, un fungo. Quello sì che sta sul pavimento — e appunto
         non ingombra */
      const i = libereSuolo.findIndex(c =>
        !cosa.suolo || cosa.suolo.includes(piena.suolo(c.x, c.y)))
      if (i < 0) continue
      const c = libereSuolo.splice(i, 1)[0]
      scenografia.push({ che: cosa.che, x: c.x, y: c.y, strato: -1 })
      vietate.add(K(c.x, c.y))
      messe++
    }
  }
  return { arredi, scenografia }
}
