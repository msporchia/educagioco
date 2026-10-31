# Gli scheletri armati e i gradi

L'utente, 12 ottobre 2026: «gli scheletri possono avere in mano un'arma e diventano rapidamente scheletro guerriero, scheletro mago, scheletro
arciere: basta appiccicarci qualcosa; si possono fare vari livelli di scheletro aumentando la qualità dell'arma, quindi c'è molta varianza; e nella
schermata chiamali scheletro, scheletro mago, scheletro spettrale magico, insomma le solite combinazioni come per le armi, per dargli gradatura ed
epicità». Il codice: `dati/varianti.js` (tutto il dato e le funzioni pure), `motore/livello.js` (`mostro`, `faiCaporale`: dove si pescano),
`scena3d/mostro3d.js` e `scena3d/cose.js` (l'arma in pugno, sul campo e nello scontro), `motore/scontro.js` (il gelo del mago).

## Le varianti

Una specie **con le mani** (lo scheletro, lo zombie, il goblin, l'orco: `VARIANTI`) può avere un'arma in pugno: una figura della roba
dell'atlante ([figure.md](figure.md): `ASPETTI`, per base e per pregio) posata sulla sua mano (`MANI`: dove sta e quanto è alta rispetto a lui). Non è
un altro sprite: è lo sprite della specie con qualcosa appiccicato, quindi ogni arma nuova che entra fra le figure è una variante in più.

| specie | senza arma | guerriero | arciere | mago |
|---|---|---|---|---|
| scheletro | 40% | 26%: spada, resiste ai colpi fisici, un filo più lento | 20%: arco, +3 di velocità, un colpo in meno | 14%: bastone del ghiaccio, il gelo, resiste al gelo |
| zombie | 65% | 35%: ascia, resiste ai colpi fisici | | |
| goblin | 50% | 30%: spada corta | 20%: arco corto | |
| orco | 60% | 40%: ascia o bipenne | | |

- **Una variante cambia la forma, mai la forza.** Le ossa e la difesa restano quelle della specie: dentro un posto si costa uguale, entro il 15%
  ([mostri.md](mostri.md)), con ogni variante a ogni grado (`unita/sotterraneo-varianti`). Il **guerriero «più difesa»** è una resistenza: resiste ai
  colpi fisici delle abilità (e non teme più il fisico, dove lo temeva); la difesa vera, che conta nel colpo di tutti i giorni, è la stessa, o nella
  cripta, che si scende a mani nude, un guerriero chiederebbe il 50% di risposte in più. L'**arciere** agisce prima nella fila dei turni e picchia un
  po' meno (colpo per velocità circa uguale). Il **mago** ha un incanto: quando un suo colpo ti arriva ti può **gelare**, e il tuo colpo dopo fa
  metà (`io.gelato`, un'etichetta «gelato» fra gli effetti sotto lo scontro; la probabilità cresce col grado, `GELO_DEL_MAGO` 30 · 40 · 50 · 60%). Si
  scongela quando agisci. Il tiro lo fa solo chi ha un incanto, e non sposta il caso degli altri.
- **Le creature dipinte già armate** (lo scheletro con scudo e spada, il negromante) non sono varianti con lo sprite: sono creature del catalogo
  con la loro scheda (`scheletro-scudo`, che è il **caporale della cripta**, e il negromante, che veste Re Ossuto: [grossi.md](grossi.md)). La
  differenza non si vede: una variante ha l'arma che si può cambiare di grado, un caporale ha il suo sprite.

## I gradi

Come la roba ([rarita.md](rarita.md)): **comune, magico, raro, leggendario**, gli stessi colori (bianco, blu, giallo, arancio-oro). Un mostro con le
mani ne ha uno, e anche **ogni caporale**, che non è mai comune: sono i buoni posti per i gradi alti, come l'anticamera del grosso.

- **Quanto spesso** (`pesiDeiGradi`): il comune pesa sempre 100; il magico 15 + 1,5 a livello del posto, il raro 3 + 0,8, il leggendario 0,3 + 0,25. Alla
  scalinata (livello 2) sono l'81% comuni, il 15% magici, il 4% rari e meno di uno su cento leggendari; a livello 60, nelle zone, il 37% comuni, il 38% magici, il
  19% rari e il 6% leggendari. Un caporale ha il raro doppio e il leggendario triplo (e il comune zero). Il livello è quello del posto
  (`livelloDelPosto`, [livelli.md](livelli.md)), passato al piano come `livello`; il caso è quello delle varianti, che non sposta una stanza né un mostro
  (`rndVarianti` in `motore/livello.js`, come l'arredo).
- **Il nome**: la specie, la variante e uno o due aggettivi che un bambino conosce e che suonano da tesoro (`AGGETTIVI`): «Scheletro», «Scheletro mago»,
  «Scheletro mago antico» (magico: antico, tetro, cupo), «Scheletro mago spettrale» (raro: spettrale, runico, oscuro), «Scheletro mago spettrale arcano»
  (leggendario: l'aggettivo del raro e uno suo, arcano, immortale, eterno). Al femminile dove la specie lo è («tartaruga corazzata antica»). Quale degli
  aggettivi lo decide il caso del piano. Il caporale aggiunge in fondo «caporale».
- **Il colore e l'alone**: il nome sullo schermo ha il colore della rarità (`coloreDelGrado`, quello di `RARITA`) e la figura un alone dello stesso colore (il leggendario brilla). L'arma ha il pregio del grado (1 comune,
  2 magico, 3 raro, 4 leggendario): `armaDi` prende fra le figure delle basi della variante, e delle sue tinte (il mago ha il bastone del ghiaccio, a
  leggendario anche arcano) quelle col pregio più vicino.
- **Cosa cambia di vero**: raro e leggendario hanno **un punto di velocità in più** (`VELOCITA_DEL_GRADO`), e abbatterli vale di più (gemme ed
  esperienza ×1,3 · 1,7 · 2,5: `PREMIO_DEL_GRADO`, dentro la potenza del mostro, `motore/potenza.js`). Le ossa e la difesa no: la gradatura è epicità, non un muro. Provato: ossa più alte
  ai gradi alti (il leggendario ×1,12): con un guerriero e un mostro di difesa 1 a fianco usciva dal 15%; l'attacco più alto ai gradi alti: nella cripta,
  a mani nude, un +1 è un terzo di colpo in più.

## Dove

La **cripta è il posto degli scheletri**: lo scheletro sta solo là ([mostri.md](mostri.md)), e con lui il caporale scheletro cavaliere, che è sempre di
un grado alto. Nelle zone, dove il livello va oltre sessanta, gli scheletri leggendari non sono rari. Gli altri posti hanno i loro goblin e orchi armati
(la scalinata) e uno zombie con l'ascia (la cripta); il resto delle creature non ha mani.

## Nei test, e per guardarli

`unita/sotterraneo-varianti` (le specie con le varianti e dove tengono l'arma; ogni arma è una figura dell'atlante e sale col grado; i nomi coi gradi,
al femminile e senza articolo; ogni variante a ogni grado costa come la specie; le frequenze dei gradi; il gelo del mago che dimezza e si
scongela; quello che la vista porta: etichetta, grado, colore, arma). Nel browser: `[data-nome-mostro]` (`data-grado`), `[data-arma-in-mano]`
(`data-arma`), e sul mostro `data-variante` e `data-grado`.

I cheat di `#sotterraneo=branco` ([../core/comandi.md](../core/comandi.md)): `&tipo=scheletro&variante=guerriero,arciere,mago&grado=raro,magico,leggendario` apre uno
scontro con quelle varianti e quei gradi (le liste girano sui mostri; `semplice` è la specie senza arma); `&campo=1` li lascia addormentati sul campo,
senza scontro, per guardarli (`&stanza=sala&seme=11` per una stanza con luce).
