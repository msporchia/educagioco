/* ═══════════════════════════════════════════════════════════════════
   LE STRANEZZE — le stanze dove non si risponde, si decide

   Un dungeon fatto solo di domande è un compito con le spade. Ogni
   tanto ci vuole una stanza in cui non c'è niente da sapere: c'è solo
   da scegliere, e nessuna delle due scelte è quella «giusta». Una è
   prudente e dà poco, l'altra è un azzardo — e il bambino impara che
   azzardare qualche volta va bene e qualche volta no. È la stessa
   scommessa dello scrigno, senza la domanda.

   Qui dentro non c'è codice: un esito **dichiara** cosa dà, e il motore
   lo applica. Le parole che il motore capisce sono cinque:

     gemme: 8       otto gemme in tasca
     cuore: 1       un cuore recuperato (mai oltre il massimo)
     cuoriMax: 1    un cuore in più per sempre, già pieno
     danno: 1       un cuore perso
     tesoro: true   un tesoro a caso fra quelli che mancano

   `peso` dice quanto spesso capita un esito fra quelli della stessa
   scelta. Una scelta con un esito solo capita sempre.
   ═══════════════════════════════════════════════════════════════════ */

export const EVENTI = [
  {
    chiave: 'fontana', em: '⛲', tit: 'Una fontana che borbotta',
    testo: 'L\'acqua è limpida ma non si sa da dove arrivi. Un rospo ti guarda.',
    scelte: [
      { nome: 'Bevi un sorso', desc: 'Chi non risica…', esiti: [
        { peso: 6, em: '💧', tit: 'Che freschezza!', testo: 'Ti senti meglio.', da: { cuore: 1 } },
        { peso: 4, em: '🤢', tit: 'Bleah!', testo: 'Era acqua vecchia.', da: { danno: 1 } },
      ] },
      { nome: 'Riempi la borraccia', desc: 'Meglio non fidarsi.', esiti: [
        { peso: 1, em: '🎒', tit: 'Prudente', testo: 'In fondo alla vasca c\'erano sei gemme.', da: { gemme: 6 } },
      ] },
    ],
  },
  {
    chiave: 'topolino', em: '🐭', tit: 'Un topolino con un sacchetto',
    testo: 'Ti fissa. Il sacchetto è più grande di lui e tintinna.',
    scelte: [
      { nome: 'Gli dai da mangiare', desc: 'Costa cinque gemme.', costo: 5, esiti: [
        { peso: 1, em: '🐭', tit: 'Amici!', testo: 'Ti lascia quello che aveva nel sacchetto.', da: { tesoro: true } },
      ] },
      { nome: 'Lo scacci', desc: 'Non hai tempo da perdere.', esiti: [
        { peso: 1, em: '🐭', tit: 'Scappa', testo: 'Ti fa la linguaccia e sparisce in una crepa.', da: {} },
      ] },
    ],
  },
  {
    chiave: 'statua', em: '🗿', tit: 'Una statua con la mano aperta',
    testo: 'Sotto c\'è scritto: «chi dona riceve». La mano è enorme.',
    scelte: [
      { nome: 'Ci metti dieci gemme', desc: 'Costa dieci gemme.', costo: 10, esiti: [
        { peso: 1, em: '🗿', tit: 'La statua sorride', testo: 'Un cuore in più, per tutta la discesa.', da: { cuoriMax: 1 } },
      ] },
      { nome: 'Le fai una linguaccia', desc: 'Sarà mica viva.', esiti: [
        { peso: 5, em: '😄', tit: 'Era cava!', testo: 'Dentro c\'erano quattordici gemme.', da: { gemme: 14 } },
        { peso: 5, em: '🗿', tit: 'Era viva', testo: 'Ti ha dato uno scappellotto.', da: { danno: 1 } },
      ] },
    ],
  },
  {
    chiave: 'funghi', em: '🍄', tit: 'Funghi che brillano',
    testo: 'Illuminano la galleria di verde. Profumano di bosco.',
    scelte: [
      { nome: 'Ne mangi uno', desc: 'Sembrano buoni.', esiti: [
        { peso: 5, em: '🍄', tit: 'Buonissimo', testo: 'Un cuore e un ruttino.', da: { cuore: 1 } },
        { peso: 5, em: '🍄', tit: 'Amarissimo', testo: 'Ti gira la testa.', da: { danno: 1 } },
      ] },
      { nome: 'Li metti in tasca', desc: 'Al mercato li pagano.', esiti: [
        { peso: 1, em: '🎒', tit: 'Raccolta', testo: 'Otto gemme di funghi luminosi.', da: { gemme: 8 } },
      ] },
    ],
  },
  {
    chiave: 'ragnatela', em: '🕸️', tit: 'Una ragnatela gigante',
    testo: 'Occupa tutto il corridoio. In mezzo brilla qualcosa.',
    scelte: [
      { nome: 'Passi in mezzo', desc: 'Quel luccichio…', esiti: [
        { peso: 6, em: '💎', tit: 'Presa!', testo: 'Tredici gemme incastrate nella tela.', da: { gemme: 13 } },
        { peso: 4, em: '🕷️', tit: 'Il ragno', testo: 'Era in casa.', da: { danno: 1 } },
      ] },
      { nome: 'Fai il giro lungo', desc: 'Nessun rischio.', esiti: [
        { peso: 1, em: '🚶', tit: 'Giro lungo', testo: 'Niente di che. Ma sei intero.', da: {} },
      ] },
    ],
  },
  {
    chiave: 'candelabro', em: '🕯️', tit: 'Un candelabro dimenticato',
    testo: 'La fiamma non si spegne mai, dicono. Ci si vede lontano.',
    scelte: [
      { nome: 'Prendi la candela', desc: 'È attaccata bene. Sarà calda?', esiti: [
        { peso: 7, em: '✨', tit: 'Ci vedi!', testo: 'Qualcosa da tenere in mano.', da: { tesoro: true } },
        { peso: 3, em: '🕯️', tit: 'Cera bollente', testo: 'Ti cola tutta sulla mano.', da: { danno: 1 } },
      ] },
      { nome: 'Lasci stare', desc: 'Non si tocca la roba altrui.', esiti: [
        { peso: 1, em: '💎', tit: 'Sotto il candelabro', testo: 'C\'erano quattro gemme cadute.', da: { gemme: 4 } },
      ] },
    ],
  },
  {
    chiave: 'porta', em: '🚪', tit: 'Una porta chiusa a chiave',
    testo: 'Dietro si sente tintinnare. La serratura è arrugginita.',
    scelte: [
      { nome: 'La sfondi a spallate', desc: 'Farà male.', esiti: [
        { peso: 1, em: '💥', tit: 'Aperta!', testo: 'Venti gemme — e una spalla dolorante.', da: { gemme: 20, danno: 1 } },
      ] },
      { nome: 'Cerchi un\'altra strada', desc: 'Non si può avere tutto.', esiti: [
        { peso: 1, em: '🚶', tit: 'Giri al largo', testo: 'Niente gemme, ma tutti i cuori.', da: {} },
      ] },
    ],
  },
  {
    chiave: 'pergamena', em: '📜', tit: 'Una pergamena impolverata',
    testo: 'È scritta in una lingua che non conosci. Le lettere si muovono.',
    scelte: [
      { nome: 'La leggi ad alta voce', desc: 'Cosa vuoi che succeda.', esiti: [
        { peso: 6, em: '✨', tit: 'Magia!', testo: 'La pergamena si trasforma.', da: { tesoro: true } },
        { peso: 4, em: '💨', tit: 'Un botto', testo: 'Le lettere ti scappano in faccia.', da: { danno: 1 } },
      ] },
      { nome: 'La rivendi', desc: 'Vecchia carta, ma vecchia.', esiti: [
        { peso: 1, em: '💎', tit: 'Affare', testo: 'Undici gemme da un mercante di passaggio.', da: { gemme: 11 } },
      ] },
    ],
  },
]

export const CHIAVI_EVENTI = EVENTI.map(e => e.chiave)

export const evento = chiave => EVENTI.find(e => e.chiave === chiave) || EVENTI[0]

/* le parole che il motore sa applicare: fuori da questo elenco un
   esito è un regalo che non arriva mai */
export const DONI_EVENTO = ['gemme', 'cuore', 'cuoriMax', 'danno', 'tesoro']

export function guastiDegliEventi(eventi = EVENTI) {
  const guasti = []
  const viste = new Set()
  for (const e of eventi) {
    const dove = `evento "${e.chiave}"`
    if (viste.has(e.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(e.chiave)
    if (!e.em || !e.tit || !e.testo) guasti.push(`${dove}: senza icona, titolo o racconto`)
    if (!Array.isArray(e.scelte) || e.scelte.length !== 2)
      guasti.push(`${dove}: le scelte devono essere due, non ${e.scelte?.length}`)
    let rischiose = 0
    for (const [i, s] of (e.scelte || []).entries()) {
      const qui = `${dove}, scelta ${i + 1}`
      if (!s.nome || !s.desc) guasti.push(`${qui}: senza nome o spiegazione`)
      if (s.costo !== undefined && !(s.costo > 0)) guasti.push(`${qui}: costo ${s.costo}`)
      if (!s.esiti?.length) guasti.push(`${qui}: senza esiti`)
      for (const es of s.esiti || []) {
        if (!(es.peso > 0)) guasti.push(`${qui}: un esito con peso ${es.peso}`)
        if (!es.em || !es.tit || !es.testo) guasti.push(`${qui}: un esito senza icona, titolo o racconto`)
        for (const k of Object.keys(es.da || {}))
          if (!DONI_EVENTO.includes(k)) guasti.push(`${qui}: l'esito dà "${k}", che il motore non conosce`)
        if (es.da?.danno) rischiose++
      }
    }
    /* le due scelte non possono essere tutte e due un azzardo né tutte
       e due un regalo: una stranezza in cui non c'è niente da decidere
       è una schermata con un tasto «avanti» travestita */
    const conCosto = (e.scelte || []).filter(s => s.costo).length
    if (!rischiose && !conCosto) guasti.push(`${dove}: nessuna delle due scelte rischia niente`)
  }
  /* un solo evento vuol dire vederlo tre volte per discesa */
  if (eventi.length < 6) guasti.push(`${eventi.length} stranezze sono poche: si ripetono nella stessa discesa`)
  return guasti
}
