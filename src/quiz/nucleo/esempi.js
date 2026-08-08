/* ═══════════════════════════════════════════════════════════════════
   DA UN SAPERE ALLE SUE DOMANDE — il verso contrario di sempre.

   Fin qui la freccia andava in un senso solo: chi fa la domanda
   dichiara cosa dà per scontato (`sa:` dentro i tipi, `saperi:` accanto
   alla scaletta), e chi pesca evita quello che il genitore ha spento.
   Nessuno aveva mai avuto bisogno di chiedere il contrario — **date
   queste tre parole, "Metri litri e chili", fammi vedere una domanda
   vera che sparisce se le spengo**.

   Serve perché un interruttore si tocca solo se si sa cosa fa. Sulla
   carta c'era una frase scritta a mano (`esempio` in `data/saperi.js`),
   e una frase scritta a mano invecchia da sola: il modulo cambia, il
   grado si sposta, e quella riga resta lì a raccontare una domanda che
   non esiste più. Una domanda **generata** non può mentire, perché è la
   stessa che arriverebbe al bambino.

   COSA SI CHIEDE è indifferentemente un gruppo (`misure`) o una
   tipologia (`mis:conversione-capacita`): per chi fa le domande sono
   due chiavi nella stessa lista di spenti, e qui sono due chiavi nella
   stessa ricerca. Il genitore che apre il dettaglio di un gruppo prova
   le sue voci una per una senza che questo file sappia che esiste un
   dettaglio.

   NON IMPORTA NIENTE, e i moduli arrivano da fuori: è la stessa scelta
   di `classi.js`. Il registro è fatto con `import.meta.glob` e vive
   solo sotto Vite; questo file invece gira anche in Node, ed è per
   quello che `unita/saperi` può controllare che **ogni** voce che un
   genitore vede sulla schermata sappia produrre la sua domanda. Un
   esempio che non esce è un interruttore che il genitore non capirà.
   ═══════════════════════════════════════════════════════════════════ */

/* ── dove nasce una domanda che dà per scontato `chiave` ──
   Una sorgente è la terna (modulo, grado, tipologia) — cioè tutto
   quello che serve per rigenerarla — più le parole per dire dove si è
   finiti, che sul pannello di prova si leggono in cima.

   I due modi di dichiarare si cercano tutti e due, perché nel repo
   convivono: i moduli con i `tipi` dicono il sapere tipologia per
   tipologia, quelli senza (l'orologio, le misure, la griglia) lo dicono
   grado per grado. Chi chiede non deve sapere quale dei due sta
   guardando. */
export function sorgentiDi(moduli, chiave) {
  const fuori = []
  for (const m of moduli) {
    for (let g = 1; g <= m.gradi; g++) {
      if (m.tipi.length) {
        for (const t of m.tipiDi(g))
          if (t.chiave === chiave || t.sa.includes(chiave))
            fuori.push({ modulo: m, grado: g, tipo: t.chiave, nome: t.nome })
      } else if (m.serve(g).includes(chiave)) {
        /* senza tipi il sapere è di tutto il grado: la riga di scaletta
           è il nome più preciso che c'è */
        fuori.push({ modulo: m, grado: g, tipo: null, nome: m.scaletta[g - 1] })
      }
    }
  }
  return fuori
}

/* ── una domanda vera, di quel sapere ──
   `null` quando quel sapere le domande non le fa: `divisioni` vive nel
   castello e non passa da nessun modulo di quiz, e la sua carta deve
   poterlo dire invece di aprire un pannello vuoto.

   Il tipo si passa a `genera` invece di lasciarlo pescare a `chiedi`:
   qui la tipologia è il punto, e una domanda pescata a caso dentro il
   grado sarebbe quasi sempre un'altra. */
export function esempioDa(sorgente, sorte) {
  const { modulo, grado, tipo } = sorgente
  const domanda = tipo ? modulo.genera(grado, sorte, tipo) : modulo.chiedi(grado, sorte)
  return {
    domanda,
    pittori: modulo.pittori,
    modulo: modulo.id,
    titolo: `${modulo.icona} ${modulo.nome}`,
    grado,
    /* cosa si sta guardando, detto a un grande: la tipologia se c'è, la
       riga di scaletta se il modulo i tipi non li dichiara */
    dice: sorgente.nome || modulo.scaletta[grado - 1],
  }
}

export function esempioDi(moduli, chiave, sorte) {
  const dove = sorgentiDi(moduli, chiave)
  if (!dove.length) return null
  return esempioDa(sorte.uno(dove), sorte)
}
