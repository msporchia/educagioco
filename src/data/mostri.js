/* ═══════════════════════════════════════════════════════════════════
   CHI ATTACCA IL CASTELLO

   Qui c'è chi sono, non come sono disegnati: il disegno delle dieci
   bestie di sempre sta in `grafica/castello.js`, quello delle otto
   nuove in `grafica/mostri/` — due cantieri paralleli, non ancora
   ricuciti insieme — entrambi indicizzati per lo stesso `id`.

   ── si dice a cosa RESISTE, non a cosa cede ──
   Prima ogni mostro dichiarava una **debolezza**: una torre che gli
   faceva doppio danno, e il nastro annunciava «il Golem, debole alle
   bombe». Un bambino che legge quella frase capisce il contrario di
   quello che vuol dire — «debole» accanto a un nome suona come «è lui
   quello debole» — e comunque l'informazione che cambia la mossa non è
   a cosa cede: è **a cosa resiste**, perché è quella che dice *cosa non
   costruire*. Adesso ogni mostro dichiara `resiste`, e il nastro dice
   «il Golem regge la magia».

   Non è lo stesso dato scritto al contrario. Prima la torre nominata
   era quella da comprare, adesso è quella da evitare, e le due cose non
   si somigliano: contro «debole alle bombe» c'era una risposta sola,
   contro «resiste alla magia» ce ne sono due, e la scelta fra quelle
   due resta di chi gioca. Perciò la torre nominata è stata **ridecisa
   mostro per mostro** — un orco che *resiste* alle bombe non vuol dire
   niente, quello stesso orco che ferma le frecce nel cuoio sì — e le
   ragioni stanno scritte accanto a ciascuno.

   ── quanto pesa ──
   Vedi `RESISTENZA` più sotto: **un terzo** del danno, non uno
   sconticino.

   ── tre famiglie, e si indovinano ──
   Le ragioni non sono diciotto ragioni diverse: sono tre regole, e un
   bambino che le ha capite indovina la resistenza di un mostro che non
   ha mai visto.

     🏹 **la freccia** è un colpo piccolo e mirato: la ferma chi è
        coperto (cuoio, corazza, carapace) e la manca chi è troppo
        piccolo o troppo svelto;
     🔮 **la magia** cerca una mente o un incantesimo su cui fare presa:
        non la trova in chi una mente non ce l'ha, e non morde chi di
        magia è già fatto;
     💣 **la bomba** è un colpo solo, lento e a scoppio: o ti manca
        perché voli, o ti trova morbido e l'urto se lo mangia, o dentro
        non trova niente da far scoppiare.

   Il ghiaccio non compare: non fa danno, e resistere a zero non vuol
   dire niente.

   Non tutti la portano accesa, e non fin da subito. Nella primissima
   tappa, quella con una sola torre che spara, dire a cosa resiste
   sarebbe una condanna e non una scelta: non c'è nient'altro da
   costruire. Da lì in poi — quattordici tappe su quindici, più la
   partita libera — le resistenze sono accese: il bambino le vede
   **prima** che l'ondata arrivi, e la torre giusta si sceglie in
   anticipo invece di scoprirla a battaglia già iniziata.

   `vola` non cambia le regole — nessuno passa sopra le torri — ma
   cambia il disegno: chi vola sta staccato da terra, con la sua
   ombra sotto. Serve a rendere i branchi riconoscibili a colpo
   d'occhio, che è tutto quello che chiediamo a un nemico.
   ═══════════════════════════════════════════════════════════════════ */

/* La resistenza si scrive con il nome della **torre**, non con quello
   dell'operazione: quale conto compri quella torre può cambiare — è già
   successo — e un mostro «che regge le divisioni» diventerebbe di colpo
   resistente a un'altra torre senza che nessuno se ne accorga. Il
   ghiaccio non compare mai: non fa danno, e un terzo di zero è zero. */
import { TORRI } from './ops.js'

export const MOSTRI = {
  // 🔮 gelatina senza mente e senza forma: l'incantesimo non trova su cosa fare presa
  slime:      { nome: 'Slime',      resiste: 'magica' },
  // 🏹 lo scudo di legno rattoppato è tutto quello che ha, e per le frecce basta
  goblin:     { nome: 'Goblin',     resiste: 'arciere' },
  // 🏹 sfarfalla a scatti: una freccia mirata arriva dov'era un attimo fa
  pipistrello:{ nome: 'Pipistrello', vola: true, resiste: 'arciere' },
  // 🔮 è fatto di magia: la magia gli passa attraverso come lui attraversa i muri
  fantasma:   { nome: 'Fantasma',   vola: true, resiste: 'magica' },
  // 🏹 carapace e otto zampe: la freccia rimbalza o ci passa in mezzo
  ragno:      { nome: 'Ragno',      resiste: 'arciere' },
  /* 🏹 cuoio e grasso: la freccia si pianta e lui nemmeno se ne accorge.
     Era «debole alle bombe», ed è uno dei due che girando la frase
     diventavano assurdi: un bestione lento è **il** bersaglio di una
     bomba, mica quello che la regge. */
  orco:       { nome: 'Orco',       resiste: 'arciere' },
  // 💣 ossa e basta: dentro non c'è niente da far scoppiare
  scheletro:  { nome: 'Scheletro',  resiste: 'bombe' },
  // 🔮 pietra animata da un incantesimo: un altro incantesimo non la disfa
  golem:      { nome: 'Golem',      resiste: 'magica' },
  // 💣 vola alta e vira: la bomba è lenta e le scoppia sotto
  arpia:      { nome: 'Arpia',      vola: true, resiste: 'bombe' },
  // 💣 due ali e mezza tonnellata: si alza sopra lo scoppio
  drago:      { nome: 'Drago',      vola: true, resiste: 'bombe' },

  /* le otto bestie nuove, una per ciascuno dei tre terreni: bosco,
     sotterraneo, mura. Il disegno sta in `grafica/mostri/`. */
  // 🏹 corre a zig-zag: la freccia va dov'era, non dov'è
  lupo:        { nome: 'Lupo',        resiste: 'arciere' },
  // 🏹 vola stretto fra i canneti e cambia direzione a ogni battito
  corvo:       { nome: 'Corvo',       resiste: 'arciere' },
  // 💣 un groviglio di spine: lo scoppio lo sfoltisce e lui si richiude
  rovo:        { nome: 'Rovo',        resiste: 'bombe' },
  // 💣 tutto molle, senza un osso: l'urto se lo mangia
  verme:       { nome: 'Verme',       resiste: 'bombe' },
  // 🔮 una blatta non ha una mente da incantare: ha solo fame
  blatta:      { nome: 'Blatta',      resiste: 'magica' },
  // 🔮 testa dura come il resto: la magia gli rimbalza addosso
  troll:       { nome: 'Troll',       resiste: 'magica' },
  /* 🏹 armatura di piastre: le frecce le sente come sassolini.
     È l'altro che girando la frase diventava assurdo — era «debole alla
     magica», che come debolezza è giusta (l'acciaio non ripara dagli
     incantesimi) ma come resistenza dice l'opposto di quello che si
     vede addosso. */
  corazziere:  { nome: 'Corazziere',  resiste: 'arciere' },
  // 💣 l'unico che sa cos'è un'artiglieria: al fischio si butta dietro il pavese
  balestriere: { nome: 'Balestriere', resiste: 'bombe' },
}

export const ELENCO = Object.keys(MOSTRI)

/* da «magica» alla torre che in questo momento si compra con la
   sottrazione: è l'unico punto in cui i due mondi si toccano */
export const torreResistente = id => {
  const aspetto = MOSTRI[id]?.resiste
  return aspetto ? Object.keys(TORRI).find(k => TORRI[k].aspetto === aspetto) : null
}

/* ── quanto vale la resistenza ──
   **Un terzo** del danno: quella torre lì ci mette tre volte tanto.

   Il numero è scelto perché si senta e perché regga il conto, e i due
   estremi si sono provati tutti e due con `npm run tara`, che non
   opina — gioca le venti tappe migliaia di volte e dice quali stanno
   ancora in piedi.

   **A metà non si sente abbastanza.** Un mostro che moriva in quattro
   frecce ne chiede otto: a schermo è lo stesso mostro che muore, un
   attimo più in là. Dire una cosa che non si vede è peggio che non
   dirla, perché insegna a non fidarsi del nastro.

   **A un quarto si sente troppo, e si rompe.** Non per il bambino
   bravo — per la geometria. Dove gli ingressi sono due si mette una
   torre per strada, e se l'ondata regge *quella* torre lì, quella
   strada resta di fatto sguarnita: la taratura misurava ondate che
   reggevano un decimo di quelle vicine, e lo spianamento verso il
   basso trascinava tutta la tappa al livello della peggiore. Il
   Torrione ne usciva con nemici da 8 punti vita su diciassette ondate.
   Un quarto non punisce la torre sbagliata, cancella la strada.

   **A un terzo torna tutto.** Il mostro chiede dodici frecce invece di
   quattro — gli si vede attraversare mezzo campo mentre la torre
   sbagliata gli spara addosso, che è esattamente il fatto che il
   preavviso serviva a evitare — e la taratura è più sana di com'era
   prima del cambio: due tappe da allargare invece di quattro, e
   nessuna sotto l'80% del suo limite.

   E un terzo è una frazione che qui si sta imparando a scrivere. */
export const RESISTENZA = 1 / 3

/* Il branco di un'ondata. Un tipo solo per ondata: così la scheda in
   alto a destra parla di *questa* ondata e la scelta della torre è una
   domanda con una risposta, non una media. */
export const mostroDiOnda = (elenco, onda) => elenco[(Math.max(1, onda) - 1) % elenco.length]

/* La partita libera pesca da tutti, e via via che le ondate salgono
   allarga il repertorio: le prime sono quelle facili da guardare, il
   drago arriva quando si è capito il gioco. */
export const mostroLibero = onda => {
  const quanti = Math.min(ELENCO.length, 2 + Math.floor(onda / 3))
  return ELENCO[(Math.max(1, onda) - 1) % quanti]
}
