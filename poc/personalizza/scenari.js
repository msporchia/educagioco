/* I tre scenari del mock (dato puro, nessun import): cosa si sceglie, quanto costa, e quali pose si fotografano.
   Lo legge il mock (incollato dentro mock.html da fai.mjs) e lo studio di posa (studio.js), che fotografa ogni posa da otto lati.
   I prezzi e i livelli sono INVENTATI per il mock: stanno nella fascia di ogni gioco ma non sono una taratura. Vedi README.md.

   Il modello è uno solo per tutti i giochi:
   - una SCHEDA è un gruppo (Chi sei, Aspetto, Cappelli…); `tipo`: 'chi' (chi si è), 'tratti' (le caratteristiche fisiche, righe
     sempre aperte), 'oggetti' (una griglia di oggetti di un posto del corpo), 'set' (più pezzi insieme);
   - un OGGETTO ha delle FORME (varianti dello stesso oggetto: tesa larga o stretta) e dei COLORI; ognuno può avere un prezzo e un livello;
   - un PEZZO addosso si scrive `oggetto/forma/colore` (`-` dove non c'è), e sta in un POSTO (testa, busto, …).
   Possedere: l'oggetto (`o`), una sua forma (`o/f`), un suo colore (`o:c`). La forma e il colore di base vengono con l'oggetto. */
;(function () {
  // ── la fattoria: il contadino e la contadina (i modelli di src/giochi/fattoria3d, ramo develop) ──
  const PELLI = [['chiara', 'Chiara', '#f8d8bc'], ['dorata', 'Dorata', '#f5c9a2'], ['ambra', 'Ambra', '#d9a272'], ['bruna', 'Bruna', '#a8754a'], ['scura', 'Scura', '#6e4630']]
  const CAPELLI = [['castani', 'Castani', '#6b4423'], ['neri', 'Neri', '#2a2220'], ['biondi', 'Biondi', '#d8b050'], ['rossi', 'Rossi', '#b8502a'],
    ['blu', 'Blu', '#3d78d8', 6], ['rosa', 'Rosa', '#e86f9a', 6], ['viola', 'Viola', '#8a4aa8', 6]]
  const colori = l => l.map(([id, nome, css, prezzo]) => ({ id, nome, css, ...(prezzo ? { prezzo } : {}) }))
  // le tinte che il mock mette sui cappelli della fattoria (nel gioco oggi un cappello ha un colore solo)
  const TINTE_F = { naturale: ['Naturale', null], rosso: ['Rosso', '#c8402e'], blu: ['Blu', '#3d68b8'], verde: ['Verde', '#4a8a4a'], viola: ['Viola', '#7a4aa8'], nero: ['Nero', '#26262e'] }
  const tinteF = (ids, base) => ids.map(id => ({ id, nome: TINTE_F[id][0], css: id === 'naturale' ? base : TINTE_F[id][1] }))

  const fattoria = {
    id: 'fattoria', nome: 'La contadina nella fattoria', tema: 'fattoria', titolo: 'Il guardaroba',
    valuta: { simbolo: '🪙', nome: 'monete', saldo: 60 }, livello: 8,
    chi: [{ id: 'contadina', nome: 'Contadina' }, { id: 'contadino', nome: 'Contadino' }],
    chiDiSerie: 'contadina',
    // il taglio della foto per i gettoni: [ingrandimento, centro x, centro y] (frazioni della foto di fronte)
    tagli: { testa: [2.2, 0.5, 0.31], capelli: [2.1, 0.5, 0.4], busto: [2.2, 0.5, 0.64], gambe: [2.3, 0.5, 0.76], piedi: [2.8, 0.5, 0.88], collo: [2.8, 0.5, 0.56], tutto: [1.15, 0.5, 0.55] },
    posti: ['pelle', 'capelli', 'barba', 'testa', 'busto', 'gambe', 'piedi', 'collo'],
    base: {
      contadina: { pelle: 'pelle/-/dorata', capelli: 'capelli/trecce/castani', barba: 'barba/nessuna/-', testa: 'cappello/paglia/naturale', busto: 'maglia/camicetta/-', gambe: 'gonna/-/blu', piedi: 'stivali/-/marroni', collo: 'fazzoletto/-/rosso' },
      contadino: { pelle: 'pelle/-/dorata', capelli: 'capelli/corti/castani', barba: 'barba/nessuna/-', testa: 'cappello/paglia/naturale', busto: 'maglia/quadri/-', gambe: 'gonna/-/blu', piedi: 'stivali/-/marroni', collo: 'fazzoletto/-/rosso' },
    },
    schede: [
      { id: 'chi', nome: 'Chi sei', tipo: 'chi' },
      { id: 'aspetto', nome: 'Aspetto', tipo: 'tratti', tratti: ['pelle', 'capelli', 'barba'] },
      { id: 'cappelli', nome: 'Cappelli', tipo: 'oggetti', posto: 'testa' },
      { id: 'vestiti', nome: 'Vestiti', tipo: 'oggetti', posti: ['busto', 'gambe', 'piedi', 'collo'] },
      { id: 'set', nome: 'Set', tipo: 'set' },
    ],
    oggetti: {
      pelle: { nome: 'Pelle', posto: 'pelle', tratto: true, taglio: 'testa', colori: colori(PELLI) },
      capelli: { nome: 'Capelli', posto: 'capelli', tratto: true, taglio: 'capelli', nomeForme: 'Taglio', nomeColori: 'Colore',
        forme: [{ id: 'corti', nome: 'Corti' }, { id: 'lunghi', nome: 'Lunghi' }, { id: 'coda', nome: 'Coda' }, { id: 'trecce', nome: 'Trecce' }, { id: 'caschetto', nome: 'Caschetto' }, { id: 'ricci', nome: 'Ricci' }],
        colori: colori(CAPELLI) },
      barba: { nome: 'Barba', posto: 'barba', tratto: true, per: ['contadino'], taglio: 'capelli', nomeForme: 'Barba',
        forme: [{ id: 'nessuna', nome: 'Nessuna' }, { id: 'corta', nome: 'Corta' }, { id: 'folta', nome: 'Folta' }, { id: 'baffi', nome: 'Baffi' }] },
      cappello: { nome: 'Cappello', posto: 'testa', taglio: 'testa', posseduto: true, prezzoColore: 4,
        forme: [{ id: 'paglia', nome: 'Paglia' }, { id: 'tesa', nome: 'Tesa larga', prezzo: 6 }, { id: 'cowboy', nome: 'Cowboy', liv: 12 }],
        colori: tinteF(['naturale', 'rosso', 'blu', 'verde'], '#e9c96e') },
      berretto: { nome: 'Berretto', posto: 'testa', taglio: 'testa', posseduto: true,
        forme: [{ id: 'berretto', nome: 'Berretto' }, { id: 'bandana', nome: 'Bandana', prezzo: 8 }] },
      cilindro: { nome: 'Cilindro', posto: 'testa', taglio: 'testa', prezzo: 18, prezzoColore: 4,
        colori: tinteF(['nero', 'viola', 'blu'], '#26262e') },
      corona: { nome: 'Corona', posto: 'testa', taglio: 'testa', liv: 14 },
      'niente-testa': { nome: 'Nessuno', posto: 'testa', taglio: 'testa', posseduto: true, niente: true },
      maglia: { nome: 'Maglia', posto: 'busto', taglio: 'busto', posseduto: true, nomeForme: 'Forma',
        forme: { contadina: [{ id: 'camicetta', nome: 'Camicetta' }, { id: 'pois', nome: 'A pois' }, { id: 'grembiule', nome: 'Grembiule' }, { id: 'fiori', nome: 'A fiori', prezzo: 12 }],
          contadino: [{ id: 'quadri', nome: 'A quadri' }, { id: 'blu', nome: 'Blu' }, { id: 'maglione', nome: 'Maglione' }, { id: 'tuta', nome: 'Tuta', prezzo: 10 }] } },
      gonna: { nome: { contadina: 'Gonna', contadino: 'Salopette' }, posto: 'gambe', taglio: 'gambe', posseduto: true, prezzoColore: 0,
        colori: [{ id: 'blu', nome: 'Blu', css: '#3d68b8' }, { id: 'verde', nome: 'Verde', css: '#4a8a4a' }, { id: 'rosso', nome: 'Rosso', css: '#b8443a' }, { id: 'viola', nome: 'Viola', css: '#7a4aa8', prezzo: 8 }] },
      stivali: { nome: 'Stivali', posto: 'piedi', taglio: 'piedi', posseduto: true,
        colori: [{ id: 'marroni', nome: 'Marroni', css: '#6a4426' }, { id: 'rossi', nome: 'Rossi', css: '#c03030' }, { id: 'bianchi', nome: 'Bianchi', css: '#f0f0ee', prezzo: 8 }, { id: 'dorati', nome: 'Dorati', css: '#c9a227', liv: 12 }] },
      fazzoletto: { nome: 'Fazzoletto', posto: 'collo', taglio: 'collo', posseduto: true,
        colori: [{ id: 'rosso', nome: 'Rosso', css: '#d2392e' }, { id: 'blu', nome: 'Blu', css: '#3b6fc0' }, { id: 'giallo', nome: 'Giallo', css: '#e0b030' }] },
      sciarpa: { nome: 'Sciarpa', posto: 'collo', taglio: 'collo', prezzo: 8,
        colori: [{ id: 'verde', nome: 'Verde', css: '#4a8a4a' }, { id: 'azzurra', nome: 'Azzurra', css: '#4aa8d8', prezzo: 4 }] },
    },
    set: [
      { id: 'domenica', nome: 'Domenica in festa', prezzo: 36, pezzi: { testa: 'cilindro/-/viola', busto: 'maglia/fiori/-', piedi: 'stivali/-/bianchi', collo: 'sciarpa/-/azzurra' }, per: ['contadina'] },
      { id: 'domenica-lui', nome: 'Domenica in festa', prezzo: 32, pezzi: { testa: 'cilindro/-/viola', busto: 'maglia/tuta/-', piedi: 'stivali/-/bianchi', collo: 'sciarpa/-/azzurra' }, per: ['contadino'] },
      { id: 'lavoro', nome: 'Al lavoro', prezzo: 10, pezzi: { testa: 'cappello/tesa/naturale', busto: 'maglia/grembiule/-', gambe: 'gonna/-/verde' }, per: ['contadina'] },
    ],
  }
  const posiF = []
  const varia = (chi, diff) => posiF.push({ chi, diff })
  for (const chi of ['contadina', 'contadino']) varia(chi, {})
  for (const p of ['chiara', 'ambra', 'bruna', 'scura']) varia('contadina', { pelle: `pelle/-/${p}` })
  for (const t of ['corti', 'coda', 'caschetto', 'ricci']) varia('contadina', { capelli: `capelli/${t}/castani` })
  for (const c of ['neri', 'biondi', 'rossi', 'blu', 'rosa']) varia('contadina', { capelli: `capelli/trecce/${c}` })
  for (const c of ['rosso', 'blu', 'verde']) varia('contadina', { testa: `cappello/paglia/${c}` })
  for (const c of ['naturale', 'rosso', 'blu']) varia('contadina', { testa: `cappello/tesa/${c}` })
  varia('contadina', { testa: 'cappello/cowboy/naturale' })
  varia('contadina', { testa: 'berretto/berretto/-' }); varia('contadina', { testa: 'berretto/bandana/-' })
  for (const c of ['nero', 'viola', 'blu']) varia('contadina', { testa: `cilindro/-/${c}` })
  varia('contadina', { testa: 'corona/-/-' }); varia('contadina', { testa: 'niente-testa/-/-' })
  for (const f of ['pois', 'grembiule', 'fiori']) varia('contadina', { busto: `maglia/${f}/-` })
  for (const c of ['verde', 'rosso', 'viola']) varia('contadina', { gambe: `gonna/-/${c}` })
  for (const c of ['rossi', 'bianchi', 'dorati']) varia('contadina', { piedi: `stivali/-/${c}` })
  for (const c of ['blu', 'giallo']) varia('contadina', { collo: `fazzoletto/-/${c}` })
  for (const c of ['verde', 'azzurra']) varia('contadina', { collo: `sciarpa/-/${c}` })
  for (const b of ['corta', 'folta', 'baffi']) varia('contadino', { barba: `barba/${b}/-` })
  for (const f of ['blu', 'maglione', 'tuta']) varia('contadino', { busto: `maglia/${f}/-` })
  varia('contadino', { testa: 'cappello/tesa/naturale' }); varia('contadino', { testa: 'cilindro/-/nero' }); varia('contadino', { testa: 'niente-testa/-/-' })
  for (const s of fattoria.set) for (const chi of s.per) varia(chi, s.pezzi)
  fattoria.pose = posiF

  // ── il sotterraneo: gli eroi (i modelli di src/giochi/sotterraneo/scena3d/eroi3d, ramo develop) ──
  const TINTE_S = { '-': ['Di serie', null], rosso: ['Rosso', '#d83a34'], blu: ['Blu', '#3a54d0'], verde: ['Verde', '#48b84c'], oro: ['Oro', '#d4a62a'], viola: ['Viola', '#8c48d0'], nero: ['Nero', '#1e1e22'] }
  const tinteS = (ids, base) => ids.map(id => ({ id, nome: TINTE_S[id][0], css: id === '-' ? base : TINTE_S[id][1] }))
  const sotterraneo = {
    id: 'sotterraneo', nome: "L'eroe nel sotterraneo", tema: 'sotterraneo', titolo: 'Il tuo eroe',
    valuta: { simbolo: '💎', nome: 'gemme', saldo: 140 }, livello: 6,
    chi: [['maga', 'Maga'], ['mago', 'Mago'], ['elfa', 'Elfa'], ['elfo', 'Elfo'], ['cavaliera', 'Guerriera'], ['cavaliere', 'Cavaliere'], ['nana', 'Nana'], ['nano', 'Nano']].map(([id, nome]) => ({ id, nome })),
    chiDiSerie: 'maga',
    tagli: { testa: [2.9, 0.5, 0.42], capelli: [3.4, 0.5, 0.55], mano: [2.3, 0.6, 0.55], tutto: [1.25, 0.5, 0.58] },
    posti: ['pelle', 'capelli', 'barba', 'testa', 'mano'],
    base: Object.fromEntries(['maga', 'mago', 'elfa', 'elfo', 'cavaliera', 'cavaliere', 'nana', 'nano'].map(k =>
      [k, { pelle: 'pelle/-/-', capelli: 'capelli/-/-', barba: 'barba/-/-', testa: 'serie/-/-', mano: 'arma/bastone-magico/-' }])),
    schede: [
      { id: 'chi', nome: 'Chi sei', tipo: 'chi' },
      { id: 'aspetto', nome: 'Aspetto', tipo: 'tratti', tratti: ['pelle', 'capelli', 'barba'] },
      { id: 'testa', nome: 'Testa', tipo: 'oggetti', posto: 'testa' },
      { id: 'armi', nome: 'Armi', tipo: 'oggetti', posto: 'mano' },
      { id: 'set', nome: 'Set', tipo: 'set' },
    ],
    oggetti: {
      pelle: { nome: 'Pelle', posto: 'pelle', tratto: true, taglio: 'testa', colori: [{ id: '-', nome: 'Di serie', css: null }, ...colori(PELLI)] },
      capelli: { nome: 'Capelli', posto: 'capelli', tratto: true, taglio: 'capelli', nomeForme: 'Taglio', nomeColori: 'Colore',
        forme: [{ id: '-', nome: 'Di serie' }, { id: 'corti', nome: 'Corti' }, { id: 'lunghi', nome: 'Lunghi' }, { id: 'coda', nome: 'Coda' }, { id: 'trecce', nome: 'Trecce' }, { id: 'ricci', nome: 'Ricci' }, { id: 'calvo', nome: 'Calvo' }],
        colori: [{ id: '-', nome: 'Di serie', css: null }, ...colori(CAPELLI.map(c => (c[3] ? [c[0], c[1], c[2], 20] : c)))] },
      barba: { nome: 'Barba', posto: 'barba', tratto: true, taglio: 'capelli', nomeForme: 'Barba', per: ['mago', 'elfo', 'cavaliere', 'nano'],
        forme: [{ id: '-', nome: 'Di serie' }, { id: 'nessuna', nome: 'Nessuna' }, { id: 'corta', nome: 'Corta' }, { id: 'lunga', nome: 'Lunga' }, { id: 'baffi', nome: 'Baffi' }] },
      serie: { nome: 'Il suo', posto: 'testa', taglio: 'testa', posseduto: true },
      'cappello-mago': { nome: 'Cappello da mago', posto: 'testa', taglio: 'testa', posseduto: true, prezzoColore: 25,
        forme: [{ id: 'cappello-apprendista', nome: 'Apprendista' }, { id: 'cappello-stellato', nome: 'Stellato', prezzo: 30 }, { id: 'cappello-arcano', nome: 'Arcano', liv: 9 }],
        colori: tinteS(['-', 'rosso', 'blu', 'verde', 'oro'], '#6a5aa8') },
      elmo: { nome: 'Elmo', posto: 'testa', taglio: 'testa', prezzo: 20, prezzoColore: 25,
        forme: [{ id: 'elmo-calotta', nome: 'Calotta' }, { id: 'elmo-nasale', nome: 'Col nasale', prezzo: 10 }, { id: 'elmo-alato', nome: 'Alato', prezzo: 30 }],
        colori: tinteS(['-', 'oro', 'nero'], '#9aa0aa') },
      cappuccio: { nome: 'Cappuccio', posto: 'testa', taglio: 'testa', prezzo: 10, prezzoColore: 25, colori: tinteS(['-', 'verde', 'rosso'], '#7a6a52') },
      'corona-foglie': { nome: 'Corona di foglie', posto: 'testa', taglio: 'testa', prezzo: 40 },
      diadema: { nome: 'Diadema', posto: 'testa', taglio: 'testa', liv: 8 },
      arma: { nome: 'Arma', posto: 'mano', taglio: 'mano', posseduto: true, nomeForme: 'Quale',
        forme: [{ id: 'bastone-magico', nome: 'Bastone' }, { id: 'spada', nome: 'Spada', prezzo: 40 }, { id: 'mazza', nome: 'Mazza', prezzo: 30 }, { id: 'martello', nome: 'Martello', liv: 10 }] },
    },
    set: [
      { id: 'arcimago', nome: "L'arcimago", prezzo: 60, pezzi: { testa: 'cappello-mago/cappello-stellato/blu', capelli: 'capelli/lunghi/bianchi', mano: 'arma/bastone-magico/-' } },
    ],
  }
  sotterraneo.oggetti.capelli.colori.push({ id: 'bianchi', nome: 'Bianchi', css: '#eeeaf2' })
  const posiS = []
  for (const c of sotterraneo.chi) posiS.push({ chi: c.id, diff: {} })
  const vS = diff => posiS.push({ chi: 'maga', diff })
  for (const p of ['chiara', 'ambra', 'scura']) vS({ pelle: `pelle/-/${p}` })
  for (const t of ['corti', 'lunghi', 'coda', 'trecce', 'ricci', 'calvo']) vS({ capelli: `capelli/${t}/-` })
  for (const c of ['neri', 'biondi', 'blu', 'viola']) vS({ capelli: `capelli/-/${c}` })
  for (const f of ['cappello-apprendista', 'cappello-stellato', 'cappello-arcano']) for (const c of ['-', 'rosso', 'blu']) vS({ testa: `cappello-mago/${f}/${c}` })
  vS({ testa: 'cappello-mago/cappello-stellato/oro' }); vS({ testa: 'cappello-mago/cappello-stellato/verde' })
  for (const f of ['elmo-calotta', 'elmo-nasale', 'elmo-alato']) vS({ testa: `elmo/${f}/-` })
  vS({ testa: 'elmo/elmo-alato/oro' })
  for (const c of ['-', 'verde']) vS({ testa: `cappuccio/-/${c}` })
  vS({ testa: 'corona-foglie/-/-' }); vS({ testa: 'diadema/-/-' })
  for (const a of ['spada', 'mazza', 'martello']) vS({ mano: `arma/${a}/-` })
  for (const b of ['nessuna', 'corta', 'baffi']) posiS.push({ chi: 'mago', diff: { barba: `barba/${b}/-` } })
  for (const s of sotterraneo.set) vS(s.pezzi)
  sotterraneo.pose = posiS

  // ── gli animali: il beagle con gli addobbi (src/giochi/fattoria3d, ramo main: gli addobbi hanno i colori) ──
  const CA = { rosso: '#d8322b', blu: '#2f6fd0', verde: '#3f9a4a', giallo: '#f2b831', rosa: '#f58bb0', fucsia: '#e8407a', viola: '#7b3fb0', nero: '#24242a', bianco: '#f4f4ee', marrone: '#5a3a1e', oro: '#f2c230', argento: '#c9ced6', azzurro: '#4fb4e8' }
  const NOMI_CA = { rosso: 'Rosso', blu: 'Blu', verde: 'Verde', giallo: 'Giallo', rosa: 'Rosa', fucsia: 'Fucsia', viola: 'Viola', nero: 'Nero', bianco: 'Bianco', marrone: 'Marrone', oro: 'Oro', argento: 'Argento', azzurro: 'Azzurro' }
  const ca = ids => ids.map(id => ({ id, nome: NOMI_CA[id], css: CA[id] }))
  const animali = {
    id: 'animali', nome: 'Il beagle nella fattoria', tema: 'animali', titolo: 'Gli addobbi',
    valuta: { simbolo: '🪙', nome: 'monete', saldo: 60 }, livello: 5,
    chi: [{ id: 'beagle', nome: 'Beagle' }], chiDiSerie: 'beagle', nomeChi: 'Bobi',
    tagli: { testa: [2.3, 0.5, 0.36], muso: [2.6, 0.5, 0.44], collo: [2.4, 0.5, 0.56], tutto: [1.1, 0.5, 0.55] },
    posti: ['testa', 'muso', 'collo'],
    base: { beagle: { testa: 'niente-testa/-/-', muso: 'niente-muso/-/-', collo: 'niente-collo/-/-' } },
    schede: [
      { id: 'testa', nome: 'In testa', tipo: 'oggetti', posto: 'testa' },
      { id: 'muso', nome: 'Sul muso', tipo: 'oggetti', posto: 'muso' },
      { id: 'collo', nome: 'Al collo', tipo: 'oggetti', posto: 'collo' },
      { id: 'set', nome: 'Set', tipo: 'set' },
    ],
    oggetti: {
      'niente-testa': { nome: 'Niente', posto: 'testa', taglio: 'testa', posseduto: true, niente: true },
      cappello: { nome: 'Cappello', posto: 'testa', prezzoColore: 3, nomeForme: 'Forma', foto: 'addobbo',
        forme: [{ id: 'cappellino', nome: 'Cappellino', prezzo: 12, colori: ca(['blu', 'rosso', 'verde', 'giallo', 'nero']) },
          { id: 'cilindro', nome: 'Cilindro', prezzo: 18, colori: ca(['nero', 'viola', 'blu', 'bianco', 'rosso']) },
          { id: 'cappello_elfo', nome: 'Da elfo', prezzo: 12, colori: ca(['verde', 'rosso', 'blu']) }] },
      corona: { nome: 'Coroncina', posto: 'testa', prezzo: 24, liv: 9, prezzoColore: 3, foto: 'addobbo', forme: [{ id: 'corona', nome: 'Coroncina', colori: ca(['oro', 'argento', 'rosa', 'azzurro']) }] },
      'niente-muso': { nome: 'Niente', posto: 'muso', taglio: 'muso', posseduto: true, niente: true },
      occhiali: { nome: 'Occhiali', posto: 'muso', prezzoColore: 3, nomeForme: 'Forma', foto: 'addobbo',
        forme: [{ id: 'occhialini', nome: 'Tondi', prezzo: 10, colori: ca(['marrone', 'nero', 'rosso', 'azzurro', 'rosa']) },
          { id: 'occhiali', nome: 'Da sole', prezzo: 16, colori: ca(['nero', 'rosso', 'blu', 'giallo', 'bianco']) }] },
      'niente-collo': { nome: 'Niente', posto: 'collo', taglio: 'collo', posseduto: true, niente: true },
      sciarpa: { nome: 'Sciarpa', posto: 'collo', prezzoColore: 3, nomeForme: 'Forma', foto: 'addobbo',
        forme: [{ id: 'sciarpa', nome: 'Liscia', prezzo: 14, colori: ca(['rosso', 'blu', 'verde', 'giallo', 'viola']) },
          { id: 'sciarpa_righe', nome: 'A righe', prezzo: 14, colori: ca(['rosso', 'verde', 'blu']) }] },
      fiocco: { nome: 'Fiocco', posto: 'collo', prezzoColore: 3, foto: 'addobbo', forme: [{ id: 'fiocco', nome: 'Fiocco', prezzo: 8, colori: ca(['fucsia', 'rosso', 'blu', 'giallo', 'viola']) }] },
    },
    set: [{ id: 'festa', nome: 'Pronto per la festa', prezzo: 30, pezzi: { testa: 'cappello/cilindro/nero', muso: 'occhiali/occhiali/nero', collo: 'fiocco/fiocco/rosso' } }],
  }
  const posiA = [{ chi: 'beagle', diff: {} }]
  const vA = diff => posiA.push({ chi: 'beagle', diff })
  for (const c of ['blu', 'rosso', 'verde']) vA({ testa: `cappello/cappellino/${c}` })
  for (const c of ['nero', 'viola']) vA({ testa: `cappello/cilindro/${c}` })
  vA({ testa: 'cappello/cappello_elfo/verde' }); vA({ testa: 'corona/corona/oro' })
  for (const c of ['marrone', 'rosso']) vA({ muso: `occhiali/occhialini/${c}` })
  for (const c of ['nero', 'giallo']) vA({ muso: `occhiali/occhiali/${c}` })
  for (const c of ['rosso', 'blu', 'giallo']) vA({ collo: `sciarpa/sciarpa/${c}` })
  vA({ collo: 'sciarpa/sciarpa_righe/rosso' })
  for (const c of ['fucsia', 'rosso']) vA({ collo: `fiocco/fiocco/${c}` })
  for (const s of animali.set) vA(s.pezzi)
  animali.pose = posiA

  // ogni posa ha un id stabile: lo scenario, chi, e i pezzi diversi dalla base
  for (const s of [fattoria, sotterraneo, animali]) {
    s.pose = s.pose.map(p => ({ ...p, id: [s.id, p.chi, ...Object.keys(p.diff).sort().map(k => k + '=' + p.diff[k])].join('|') }))
  }
  globalThis.SCENARI = { fattoria, sotterraneo, animali }
  globalThis.ANGOLI = [0, 45, 90, 135, 180, 225, 270, 315]
})()
