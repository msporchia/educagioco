/* ═══════════════════════════════════════════════════════════════════
   UN FOGLIO DI SPRITE, E COME SI POSA

   Il pezzo di motore che mancava per disegnare con delle figure invece
   che con dei poligoni. È piccolo apposta: un PNG solo, una tabella di
   ritagli, e le tre o quattro cose che servono per metterli in scena.
   Tutto il resto — chi sceglie *quale* pezzo — sta altrove: la forma la
   decide `tessere.js`, il gioco decide il resto.

   Non sostituisce `PITTORI`: gli sta accanto. Un pittore che sa
   disegnare una torre a poligoni e uno che la posa da un foglio
   ricevono la stessa scena e fanno la stessa cosa; chi gioca non se ne
   accorge. Ed è la ragione per cui questo file **non è agganciato a
   niente**: quando gli sprite ci saranno, si aggancia riga per riga.

   ── il piede ──
   Uno sprite non si mette «alle coordinate»: si **appoggia**. Le figure
   hanno altezze diverse — una torre di terzo stadio è alta il doppio di
   una di primo — e mettendole tutte con l'angolo in alto nello stesso
   punto crescerebbero verso il basso, dentro il terreno. `posa` prende
   il punto dove la figura tocca terra, che è l'unico che il gioco
   conosce davvero, e ci mette sopra il disegno.

   ── la scala ──
   La pixel art vuole ingrandimenti interi e niente sfocatura. Un pezzo
   da 32 px disegnato a 44 non è «un po' più grande»: è sfrangiato, e
   sfrangiato è più brutto di piccolo. `scalaIntera` dice il numero più
   grande che ci sta nello spazio disponibile, ed è pensata per essere
   passata alla tela come scala del mondo — non per essere applicata
   qui dentro a mano.

   ── perché non c'è una cache ──
   `drawImage` da un atlante già decodificato è una copia di pixel: fa
   già quello che farebbe una cache, e ogni copia in più è memoria che
   su un telefono non abbiamo.
   ═══════════════════════════════════════════════════════════════════ */

/* Un foglio: la tabella `PEZZI` (nome → [x, y, larghezza, altezza]) e
   l'immagine, che di solito è un `data:` — il build deve restare un
   file unico, quindi l'atlante ci vive dentro in base64.

   `tessera` è quanto vale una cella di terreno in pixel dello sprite:
   serve solo a `posaTessera`, che ragiona in celle. */
export function creaFoglio({ pezzi, immagine, tessera = 32 }) {
  let img = null
  let attesa = null

  /* Il caricamento è una promessa, e una sola: chiamarla due volte non
     scarica due volte. Chi disegna prima che sia pronta non rompe
     niente — non si vede nulla, e al fotogramma dopo si vede. */
  function carica() {
    if (attesa) return attesa
    attesa = new Promise((risolvi, rifiuta) => {
      const i = new Image()
      i.onload = () => { img = i; risolvi(foglio) }
      i.onerror = () => rifiuta(new Error('atlante non caricato'))
      i.src = immagine
    })
    return attesa
  }

  const misura = nome => {
    const p = pezzi[nome]
    return p ? { w: p[2], h: p[3] } : null
  }

  /* Il disegno crudo: l'angolo in alto a sinistra dove dici tu.
     `specchia` riflette destra e sinistra — è così che un foglio con
     tre angoli su quattro basta lo stesso. */
  function pezzo(ctx, nome, x, y, { alfa = 1, specchia = false } = {}) {
    const p = pezzi[nome]
    if (!p || !img) return false
    const [sx, sy, w, h] = p
    const prima = ctx.globalAlpha
    if (alfa !== 1) ctx.globalAlpha = alfa
    if (specchia) {
      ctx.save()
      ctx.translate(Math.round(x) + w, Math.round(y))
      ctx.scale(-1, 1)
      ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h)
      ctx.restore()
    } else {
      ctx.drawImage(img, sx, sy, w, h, Math.round(x), Math.round(y), w, h)
    }
    if (alfa !== 1) ctx.globalAlpha = prima
    return true
  }

  /* Appoggiato: `x` è il centro, `y` è dove tocca terra. È questa la
     firma che serve a un pittore, perché è quella che il gioco sa —
     una torre sta *in* quel punto lì, non ha un angolo in alto. */
  function posa(ctx, nome, x, y, opz = {}) {
    const m = misura(nome)
    if (!m) return false
    return pezzo(ctx, nome, x - m.w / 2 + (opz.dx || 0), y - m.h + (opz.dy || 0), opz)
  }

  /* In celle. Una tessera di terreno riempie il suo quadrato; una
     figura più alta della cella — un albero, una torre — sborda verso
     l'alto e resta appoggiata al fondo della sua cella, che è quello
     che serve perché stia dietro a chi le passa davanti. */
  function posaTessera(ctx, nome, cx, cy, opz = {}) {
    return posa(ctx, nome, (cx + 0.5) * tessera, (cy + 1) * tessera, opz)
  }

  const foglio = {
    carica, misura, pezzo, posa, posaTessera, tessera,
    get pronto() { return !!img },
    get immagine() { return img },
    ha: nome => !!pezzi[nome],
    nomi: () => Object.keys(pezzi),
  }
  return foglio
}

/* I bordi netti. Va rimesso ogni volta che il contesto viene
   riconfigurato — cambiare la trasformazione lo azzera su qualche
   browser — quindi si chiama a ogni fotogramma e non una volta sola. */
export function netto(ctx) {
  ctx.imageSmoothingEnabled = false
  return ctx
}

/* Quante volte ci sta, per intero. `spazio` e `mondo` sono due misure
   omogenee (larghezza e altezza in pixel di sprite); il risultato è il
   numero più grande fra 1 e `massimo` che fa entrare il mondo dentro lo
   spazio senza mezze scale.

   È fatta per essere passata alla tela come `mondo.S`: chi la applica a
   mano dentro un pittore sta ricostruendo una telecamera che esiste già. */
export function scalaIntera(spazio, mondo, massimo = 4) {
  const k = Math.min(spazio.W / mondo.W, spazio.H / mondo.H)
  return Math.max(1, Math.min(massimo, Math.floor(k)))
}
