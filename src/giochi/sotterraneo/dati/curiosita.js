/* ═══════════════════════════════════════════════════════════════════
   LE CURIOSITÀ — le cose che si toccano per vedere che succede

   Un libro polveroso, una sfera di cristallo, una clessidra ferma, un
   calice pieno di qualcosa. Non servono a niente e sono la ragione per
   cui esiste questo file: un sotterraneo fatto solo di mostri da
   abbattere e porte da aprire diventa **una fila di esercizi con un
   tema sopra**, e dopo tre discese si vede benissimo che è quello.

   ── LA BATTUTA È IL PREMIO VERO ───────────────────────────────────
   Qui dentro il grosso del lavoro sono le frasi, non i numeri. Quello
   che un bambino racconta a tavola non è «ho preso otto gemme»: è che
   ha starnutito talmente forte da spegnere tutte le torce, o che ha
   bevuto una roba che sapeva di calzino. I numeri fanno il gioco, le
   frasi fanno la voglia di riaprirlo — e costano un pomeriggio di
   scrittura invece di un motore nuovo.

   ── SI DICE PRIMA CHE PUÒ ANDARE MALE ─────────────────────────────
   L'invito lo dichiara («può andare bene, o male»), perché una
   sorpresa cattiva non annunciata è la cosa che i bambini ricordano
   peggio, e perché la scommessa è tutto il gioco: se non ci fosse il
   rischio non ci sarebbe niente da decidere, e la domanda diventerebbe
   un pedaggio.

   ── IL MALUS È MITE, E METÀ DELLE VOLTE NON C'È ───────────────────
   Quando c'è: due punti di vita, o qualche gemma. In un gioco dove uno
   svenimento ti riporta all'ingresso, un malus vero — perdere un
   oggetto, tornare indietro di un piano — è una punizione che fa
   chiudere il gioco.

   E spesso non c'è affatto: **hai starnutito, e basta**. Serve che
   sbagliare qui non sia una tassa ma un fatto che succede, come in una
   storia; se ogni risposta storta costasse qualcosa, toccare le cose
   diventerebbe una cosa da evitare — e allora tanto varrebbe non
   metterle. Il costo lo dichiara la frase stessa (`costo`), così chi
   scrive una battuta nuova decide lì se pesa o se fa solo ridere.
   ═══════════════════════════════════════════════════════════════════ */

/* Le due misure del pentimento, quando c'è: due punti di vita, o
   qualche gemma. Sono uniche per tutte le curiosità, perché il rischio
   dev'essere leggibile prima e uno che cambia da oggetto a oggetto non
   lo impara nessuno. */
export const MALUS = { vita: 2, gemme: [2, 6] }

/* I premi possibili. Ognuno porta la sua frase, perché il premio e la
   battuta devono raccontare la stessa cosa: «ti si sono rizzati i
   capelli» accanto a *hai trovato otto gemme* è un non sequitur, e i
   bambini quelle cose le sentono. */
export const CURIOSITA = [
  {
    tipo: 'libro', nome: 'Un libro polveroso', em: '📖', pezzo: 'libro',
    dice: 'Sulla copertina c\'è scritto qualcosa, ma è tutto impolverato. Lo apri?',
    bene: [
      { dice: 'Dentro c\'era una mappa disegnata male, e una gemma usata come segnalibro.', premio: { gemme: 9 } },
      { dice: 'È un ricettario di orchi. La zuppa di calzini ti ha fatto passare la fame, e stranamente ti senti meglio.', premio: { cura: 6 } },
      { dice: 'Una pagina spiegava come si respira col naso mentre si corre. Sembra una sciocchezza: da adesso reggi di più.', premio: { vitaPiu: 2 } },
      { dice: 'Era il diario di un mago distratto. Alla parola «accendi» ti si è accesa la torcia in mano.', premio: { torcia: true } },
      { dice: 'Fra le pagine c\'erano dei fogli di gemme schiacciate, come fiori. Erano gemme vere.', premio: { gemme: 11 } },
      { dice: 'Il capitolo si chiamava «Come si dorme in piedi». L\'hai letto tutto e ti sei riposato benissimo.', premio: { cura: 9 } },
      { dice: 'Sull\'ultima pagina c\'era il disegno di un bambino con una spada. Sotto: «ce la fa». Ti sei sentito addosso una fiducia strana.', premio: { vitaPiu: 3 } },
      { dice: 'Il libro raccontava barzellette di scheletri. Hai riso talmente che ti sono tornate le forze.', premio: { cura: 7 } },
      { dice: 'Era un catalogo di prezzi del mercante, con gli sconti segnati a matita. Adesso sai dove non farti fregare — e hai tenuto le gemme in tasca.', premio: { gemme: 7 } },
      { dice: 'C\'era scritto solo: «la scala scende sempre». Ovvio, sì. Però in qualche modo ti ha fatto bene saperlo.', premio: { cura: 5 } },
    ],
    male: [
      { dice: 'Hai alzato una nuvola di polvere e hai starnutito così forte che si è spenta una torcia in fondo al corridoio.' },
      { dice: 'Il libro si è chiuso di scatto sulle tue dita. Il libro sembrava contento.', costo: { vita: true } },
      { dice: 'Era scritto in una lingua di sotterraneo: a leggerla ad alta voce ti è venuto il singhiozzo. Ce l\'hai ancora adesso.' },
      { dice: 'Le pagine erano tutte bianche tranne una, dove c\'era scritto «ti stavo aspettando». Bello, eh.' },
      { dice: 'Dentro dormiva un ragnetto. Si è svegliato, ti ha guardato male e se n\'è andato sbattendo le zampe.' },
      { dice: 'Hai letto una parola magica sbagliata e per tre secondi hai parlato al contrario. Odranged.' },
      { dice: 'Il libro puzzava di muffa vecchia di secoli. Ti gira un po\' la testa.', costo: { vita: true } },
      { dice: 'È scivolato dallo scaffale e ti è caduto su un piede. Un piede solo, per fortuna.', costo: { vita: true } },
      { dice: 'Fra le pagine c\'era una nota del mercante: «mi devi delle gemme». Le hai trovate in tasca in meno.', costo: { gemme: true } },
      { dice: 'Hai letto la parola «pisolino» e hai sbadigliato per un minuto intero. Un pipistrello ha sbadigliato con te.' },
    ],
  },
  {
    tipo: 'sfera', nome: 'Una sfera di cristallo', em: '🔮', pezzo: 'sfera-cristallo',
    dice: 'Dentro si muove qualcosa di viola. Ci guardi dentro?',
    bene: [
      { dice: 'Hai visto dove tiene le gemme il mercante. Non chiedere come: adesso ne hai qualcuna in più.', premio: { gemme: 12 } },
      { dice: 'Hai visto te stesso che finivi la discesa. Ti sei fatto un\'ottima impressione, e ti senti meglio.', premio: { cura: 8 } },
      { dice: 'Nella sfera c\'era un tizio con una torcia. Adesso la torcia ce l\'hai tu, e il tizio è furioso.', premio: { torcia: true } },
      { dice: 'La sfera ti ha mostrato dove metteranno i piedi i mostri. Sapendolo, ti muovi più tranquillo.', premio: { vitaPiu: 2 } },
      { dice: 'Dentro c\'era la faccia di tua nonna che diceva «copriti». Ti sei coperto, e stai già meglio.', premio: { cura: 10 } },
      { dice: 'Ha fatto vedere la stanza qui accanto: c\'era un sacchetto dimenticato. Adesso è tuo.', premio: { gemme: 10 } },
      { dice: 'Ci hai visto dentro il tuo compleanno. Non si è capito quanti anni, ma la torta era grossa e ti ha rimesso in forze.', premio: { cura: 12 } },
      { dice: 'Dentro c\'era il sotterraneo visto dall\'alto. Adesso hai un\'idea di dove sei, e cammini meglio.', premio: { vitaPiu: 3 } },
      { dice: 'La sfera ha starnutito — sì, ha starnutito — e ha sputato fuori tre gemme.', premio: { gemme: 8 } },
      { dice: 'Ha mostrato un orco che scivolava su una buccia. Hai riso così tanto che ti è passato il fiatone.', premio: { cura: 6 } },
    ],
    male: [
      { dice: 'Dentro la sfera c\'era la tua faccia che ti guardava male. Ti sei preso un colpo.', costo: { vita: true } },
      { dice: 'La sfera ha mostrato la merenda di domani. Era finocchio. Sei rimasto lì un attimo a pensarci.' },
      { dice: 'Hai visto una cosa con troppi denti che ti salutava con la manina. Le hai risposto salutando, per educazione.' },
      { dice: 'La sfera ha fatto vedere solo nebbia viola, e un cartello: «torna domani».' },
      { dice: 'Dentro c\'eri tu che guardavi dentro una sfera dove c\'eri tu che guardavi dentro una sfera. Ti è venuto il capogiro.', costo: { vita: true } },
      { dice: 'Ha mostrato i compiti delle vacanze. Tutti. Anche quelli che non avevi fatto.' },
      { dice: 'Si è appannata e sopra ci si è disegnata una faccina con la lingua fuori.' },
      { dice: 'Hai visto dove sono finite le gemme che avevi in tasca: in tasca a qualcun altro.', costo: { gemme: true } },
      { dice: 'La sfera ha fatto «bip». Le sfere di cristallo non fanno «bip», e questo ti preoccupa un po\'.' },
      { dice: 'Ci hai sbattuto il naso mentre ti avvicinavi per guardare meglio.', costo: { vita: true } },
    ],
  },
  {
    tipo: 'clessidra', nome: 'Una clessidra ferma', em: '⏳', pezzo: 'clessidra',
    dice: 'La sabbia sta tutta di sotto e non scende da anni. La giri?',
    bene: [
      { dice: 'La sabbia è scesa al contrario e per un attimo sei stato un po\' più giovane. Riposato, direi.', premio: { cura: 10 } },
      { dice: 'Dentro la sabbia c\'erano dei sassolini che luccicavano. Non erano sassolini.', premio: { gemme: 10 } },
      { dice: 'Il tempo si è fermato giusto il tempo di mangiare in pace. Da lì in poi ti senti più tosto.', premio: { vitaPiu: 3 } },
      { dice: 'Per tre secondi tutto è andato al rallentatore: ne hai approfittato per riprendere fiato.', premio: { cura: 8 } },
      { dice: 'La clessidra ha fatto un rumore da orologio nuovo e si è illuminata: adesso hai luce.', premio: { torcia: true } },
      { dice: 'La sabbia si è messa a formare una freccia che indicava una fessura nel muro. Dentro c\'erano gemme.', premio: { gemme: 12 } },
      { dice: 'È tornato per un attimo il momento prima che ti facessi male. Comodo: quel male non ce l\'hai più.', premio: { cura: 12 } },
      { dice: 'Hai visto passare tutte le stagioni in un minuto. Alla fine era primavera, e ti senti in gran forma.', premio: { vitaPiu: 2 } },
      { dice: 'La sabbia si è divisa in due mucchietti, e in mezzo c\'era una moneta grossa.', premio: { gemme: 7 } },
      { dice: 'Il tempo si è fermato mentre stavi respirando. Un respiro lunghissimo, e adesso stai meglio.', premio: { cura: 7 } },
    ],
    male: [
      { dice: 'La clessidra si è girata da sola dall\'altra parte e ti ha rovesciato la sabbia in testa. Ne troverai negli stivali per giorni.' },
      { dice: 'Hai sentito il rumore di tutti gli anni passati qua sotto, tutti insieme. Ti sono venute le vertigini.', costo: { vita: true } },
      { dice: 'La sabbia è uscita, si è messa in fila e se n\'è andata portandosi via delle gemme. Non sapevi che sapesse camminare.', costo: { gemme: true } },
      { dice: 'Per due secondi hai vissuto lunedì mattina un\'altra volta. Due secondi lunghissimi.' },
      { dice: 'La sabbia è scesa al contrario e ti sono ricresciuti i capelli che non avevi ancora perso.' },
      { dice: 'Ti si è addormentato un piede. Solo quello, e proprio adesso.' },
      { dice: 'Il vetro era freddissimo e ti si è appiccicato alla mano. Staccarla ha fatto un po\' male.', costo: { vita: true } },
      { dice: 'Per un attimo hai avuto sei anni. Poi sei tornato normale, ma con una gran voglia di merenda.' },
      { dice: 'La clessidra ha contato il tempo che ci hai messo a rispondere, e ha fatto un verso di disapprovazione.' },
      { dice: 'Hai starnutito sulla sabbia e ti è tornata tutta in faccia. Tutta.' },
    ],
  },
  {
    tipo: 'calice', nome: 'Un calice pieno di qualcosa', em: '🍷', pezzo: 'calice',
    dice: 'È pieno fino all\'orlo di una roba che si muove piano. Ne bevi un sorso?',
    bene: [
      { dice: 'Sapeva di mirtillo. Un mirtillo che ti vuole bene: ti senti rimesso a nuovo.', premio: { cura: 12 } },
      { dice: 'Era acqua di sorgente, di quelle buone. Ti si è messo a posto lo stomaco e pure l\'umore.', premio: { vitaPiu: 2 } },
      { dice: 'In fondo al calice c\'erano delle gemme. Chi lo ha riempito non guardava dove metteva le mani.', premio: { gemme: 8 } },
      { dice: 'Era succo di pera con una fetta di limone. Qualcuno qua sotto sa il fatto suo, e tu stai meglio.', premio: { cura: 9 } },
      { dice: 'Sapeva di niente, ma dopo il sorso ti sei sentito più solido. Come una porta di quercia.', premio: { vitaPiu: 3 } },
      { dice: 'Dentro galleggiava una moneta d\'oro. Bevuto il sorso, te la sei messa in tasca.', premio: { gemme: 9 } },
      { dice: 'Era cioccolata calda. Nel sotterraneo. Non farti domande e goditela.', premio: { cura: 14 } },
      { dice: 'Il liquido si è acceso di arancione e ti ha scaldato le mani: adesso fai luce da solo.', premio: { torcia: true } },
      { dice: 'Era limonata, e in fondo c\'erano tre gemme come cubetti di ghiaccio.', premio: { gemme: 11 } },
      { dice: 'Sapeva di brodo della nonna. Hai fatto «aaah» ad alta voce, e ti è tornata la forza.', premio: { cura: 10 } },
    ],
    male: [
      { dice: 'Sapeva di calzino. Di calzino di orco. Hai fatto una faccia che ha spaventato un pipistrello.' },
      { dice: 'Era zuppa di cipolle vecchie di trecento anni. Adesso senti una puzza tremenda, e la puzza sei tu.' },
      { dice: 'Hai bevuto, e ti sono venuti gli occhi a spirale. Ti è passata, ma nel frattempo hai perso qualcosa dalla tasca.', costo: { gemme: true } },
      { dice: 'Era acqua stagnante con dentro una foglia. La foglia ti ha guardato.' },
      { dice: 'Ti è andato di traverso e hai tossito per mezzo minuto. Mezzo sotterraneo sa che sei qui.' },
      { dice: 'Sapeva di medicina, quella verde. Hai fatto una smorfia e hai detto una parola che non si dice.' },
      { dice: 'Era freddissimo e ti ha congelato il cervello. Quel dolore lì, sopra gli occhi.', costo: { vita: true } },
      { dice: 'Un sorso, e ti è venuto un rutto che ha fatto tremare una lanterna. Nessuno ha applaudito.' },
      { dice: 'Dentro c\'era qualcosa che si muoveva ancora. Non guardare. Ti si è chiuso lo stomaco.', costo: { vita: true } },
      { dice: 'Il calice era bucato e ti sei versato tutto sui pantaloni. Sembra proprio quello che sembra.' },
    ],
  },
]

export const CURIOSITA_DI = Object.fromEntries(CURIOSITA.map(c => [c.tipo, c]))

/* I controlli: quello che qui dentro può marcire senza dare nessun
   errore sono **le frasi** — un elenco vuoto, un premio che non dice
   niente, una battuta che promette gemme e dà una cura. */
export function guastiDelleCuriosita(nomi = null) {
  const g = []
  for (const c of CURIOSITA) {
    if (!c.nome || !c.em || !c.dice) g.push(`${c.tipo}: senza nome, emoji o invito`)
    if (nomi && c.pezzo && !nomi.includes(c.pezzo))
      g.push(`${c.tipo}: nell'atlante non c'è lo sprite "${c.pezzo}"`)
    /* tre e tre: con una sola frase per parte la battuta si brucia alla
       seconda discesa, ed è proprio quello che deve durare */
    if (!c.bene || c.bene.length < 3) g.push(`${c.tipo}: meno di tre modi di andare bene`)
    if (!c.male || c.male.length < 3) g.push(`${c.tipo}: meno di tre modi di andare male`)
    for (const b of c.bene || []) {
      if (!b.dice) g.push(`${c.tipo}: un premio senza frase`)
      const p = b.premio || {}
      if (!p.gemme && !p.cura && !p.vitaPiu && !p.torcia) g.push(`${c.tipo}: un premio che non dà niente`)
      /* la frase e il premio devono raccontare la stessa cosa: se si
         parla di gemme, gemme devono arrivare */
      if (/gemm/i.test(b.dice) && !p.gemme) g.push(`${c.tipo}: la frase promette gemme e il premio non ne dà`)
    }
    for (const m of c.male || []) {
      if (!m || !m.dice || m.dice.length < 20) g.push(`${c.tipo}: una frase storta fra quelle che vanno male`)
      if (m && m.costo && !m.costo.vita && !m.costo.gemme)
        g.push(`${c.tipo}: un costo che non toglie né vita né gemme`)
    }
    /* almeno una che non costa niente: se ogni risposta storta pesa,
       toccare le cose diventa una cosa da evitare */
    if ((c.male || []).every(m => m && m.costo))
      g.push(`${c.tipo}: sbagliare costa sempre qualcosa, e allora conviene non toccarlo`)
  }
  if (!MALUS.vita || !MALUS.gemme) g.push('il malus non toglie niente')
  return g
}
