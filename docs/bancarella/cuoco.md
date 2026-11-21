# Il cuoco

I bambini volevano scegliersi il cuoco, anche per non confondersi in due. Si sceglie dal tasto **«Il tuo cuoco»** in cima alle cucine,
accanto a «In due»: un foglio con l'interfaccia unica per personalizzare ([../core/personalizza.md](../core/personalizza.md), tema
fattoria) e cinque schede. **Tutto è gratis** e si mette subito: è un gioco di conti, il cuoco è solo suo.

| scheda | cosa |
|---|---|
| Chi è | Cuoco, Cuoca, Gatto, Orsetto, Coniglio |
| Aspetto | la pelle (i cinque toni di `grafica/persona/aspetto.js`) e i capelli (taglio e colore, gli stessi della fattoria e del sotterraneo; «Di serie»: corti il cuoco, trecce la cuoca); per un animale il pelo, quattro manti a testa |
| Grembiule | liscio, a righe, a quadretti, a pois, in nove stoffe |
| Cappello | alto, basso, bandana; bianco o una stoffa |
| Collo | fazzoletto, papillon, niente |

- **La cuoca si distingue dal davanti**: trecce di serie e le ciglia. Con la coda di serie era uguale al cuoco, che la coda sta dietro.
- **Le schede non cambiano con chi si è**: per un animale «Aspetto» ha il pelo al posto di pelle e capelli (una scelta non cambia le zone sopra).
  Cambiando animale si riparte dal suo primo manto: il manto di un altro non gli sta.
- **Più carino di prima**: la testa è un po' più grande del vero (`TESTONA`), gli occhi hanno due luci.

## Come si salva

Una riga sola, `chiaveVeste` in `data/bancarella-cuochi.js` («cuoca.ambra.-.rossi.-.righe.verde.alto.bianco.papillon.giallo»), in
`profile.campagne.bancarella.banco.cuoco`, messa a posto da `bancoPulito`: un campo che non si conosce torna di serie. La stessa riga fa
da nome alle foto e va all'altro telefono in due. Gli id non si rinominano.

## Il disegno

`grafica/cucina3d/omino.js`: ogni forma (il busto col fazzoletto o col colletto, la testa, il muso di ogni animale, un taglio, un
cappello) si modella una volta e **si ritinge** (`tinto`): cambiare colore non rifà la creta. Il disegno del grembiule è nel colore dei
vertici, per questo il busto ha la maglia più fitta degli altri pezzi.

Le foto del foglio e del tasto sono il cuoco vero fotografato adesso (`grafica/cucina3d/ritratto.js`): un renderer piccolo che vive
finché si sta nella scelta delle cucine, una foto per volta. Non stanno in `bancarella-foto.js`: le combinazioni sono troppe.

## In due

Partendo, ognuno manda com'è fatto il suo cuoco (la mossa `veste`, [in-due.md](in-due.md)); l'altro arriva vestito di serie e si
riveste quando la riga arriva. Chi è chi lo dicono ancora il colore della fascia del cappello e **un anello per terra**, rosso o blu:
due bambini possono scegliere lo stesso gatto.

## Nei test

`unita/bancarella-cuochi` (la riga avanti e indietro, ogni scelta del foglio, la mossa in due), `integrazione/bancarella-cucina`
(si sceglie il gatto e resta). Bersagli: `[data-il-cuoco]`, `[data-cuoco]` (il foglio), e quelli di Personalizza (`[data-prs-voce="gatto"]`).
