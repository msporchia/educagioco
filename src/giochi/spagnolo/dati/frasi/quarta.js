// Le frasi componibili del mondo «quarta», «Il rifugio d’inverno». Il formato
// di una frase e le regole stanno in docs/lingue/spagnolo-motore.md; i verbi
// flessi (canto, comiendo) valgono dalla tappa della loro struttura.
const f = (tappa, forma) => (id, it, es, altro = {}) => ({ id, tappa, forma, it, es, ...altro })
const hora = f('quarta-hora', 'hora')
const canto = f('quarta-canto', 'presente-ar')
const fecha = f('quarta-fechas', 'fechas')
const unos = f('quarta-unos', 'cantidad')
const come = f('quarta-come', 'presente-er-ir')
const me = f('quarta-me-levanto', 'reflexivos')
const ger = f('quarta-gerundio', 'gerundio')

export default {
  mondo: 'quarta',
  frasi: [
    /* ── Che ore sono? ── */
    hora('qa-que-hora-es', 'che ore sono?', 'qué hora es', {
      trappole: [{ es: 'qué ora es', perche: 'Ora si scrive con la h: hora' }] }),
    hora('qa-es-la-una', 'è l’una', 'es la una', {
      trappole: [{ es: 'es la uno', perche: 'L’una si dice la una, con una' }, { es: 'es una', perche: 'Con l’ora ci vuole la: es la una' }] }),
    hora('qa-son-las-tres', 'sono le tre', 'son las tres', {
      trappole: [{ es: 'son la tres', perche: 'Dalle due in su si dice las: son las tres' }] }),
    hora('qa-son-las-nueve', 'sono le nove?', 'son las nueve', {
      trappole: [{ es: 'son la nueve', perche: 'Dalle due in su si dice las: son las nueve' },
                 { es: 'son los nueve', perche: 'Le ore sono femminili: las nueve, non los' }] }),
    hora('qa-dos-y-media', 'sono le due e mezza', 'son las dos y media', {
      trappole: [{ es: 'son las dos y medio', perche: 'Mezza si dice media: y media' }] }),
    hora('qa-una-y-cuarto', 'è l’una e un quarto', 'es la una y cuarto', {
      trappole: [{ es: 'es la una e cuarto', perche: '«E» in spagnolo si dice y: y cuarto' }] }),
    hora('qa-ocho-menos-cuarto', 'sono le otto meno un quarto', 'son las ocho menos cuarto', {
      trappole: [{ es: 'son la ocho menos cuarto', perche: 'Dalle due in su si dice las: son las ocho' }] }),
    hora('qa-siete-en-punto', 'sono le sette in punto', 'son las siete en punto', {
      trappole: [{ es: 'son la siete en punto', perche: 'Dalle due in su si dice las: son las siete' }] }),
    hora('qa-diez-de-la-noche', 'sono le dieci di sera', 'son las diez de la noche'),
    hora('qa-cuatro-de-la-tarde', 'sono le quattro del pomeriggio', 'son las cuatro de la tarde'),
    hora('qa-once-menos-diez', 'sono le undici meno dieci', 'son las once menos diez', {
      trappole: [{ es: 'son la once menos diez', perche: 'Dalle due in su si dice las: son las once' }] }),
    hora('qa-no-es-la-una', 'non è l’una, sono le due', 'no es la una son las dos', {
      trappole: [{ es: 'no es la una son la dos', perche: 'Dalle due in su si dice las: son las dos' }] }),
    hora('qa-desayuno-a-las-siete', 'la colazione è alle sette', 'el desayuno es a las siete'),
    hora('qa-almuerzo-a-la-una', 'il pranzo è all’una', 'el almuerzo es a la una'),
    hora('qa-cena-ocho-y-media', 'la cena è alle otto e mezza', 'la cena es a las ocho y media'),
    hora('qa-a-que-hora-cena', 'a che ora è la cena?', 'a qué hora es la cena'),
    hora('qa-fiesta-a-las-cinco', 'la festa è alle cinque del pomeriggio', 'la fiesta es a las cinco de la tarde'),

    /* ── Io canto, tu balli: il presente in -ar ── */
    canto('qa-escucho-musica', 'ascolto la musica', 'escucho música'),
    canto('qa-escuchas-musica', 'ascolti la musica?', 'escuchas música', {
      trappole: [{ es: 'escucho música', it: 'ascolto la musica?', perche: 'Tu: escuchas, con la s; io: escucho' },
                 { es: 'escuches música', perche: 'Escuchar è in -ar: escuchas, non escuches' }] }),
    canto('qa-yo-cocino-sopa', 'io cucino la zuppa', 'yo cocino la sopa'),
    canto('qa-tu-limpias', 'tu pulisci la tua camera?', 'tú limpias tu dormitorio'),
    canto('qa-nunca-limpio', 'non pulisco mai la mia camera', 'nunca limpio mi dormitorio', {
      varianti: ['no limpio nunca mi dormitorio'],
      trappole: [{ es: 'nunca no limpio mi dormitorio', perche: 'Con nunca prima del verbo niente no: nunca limpio' }] }),
    canto('qa-ella-mira-pajaros', 'lei guarda gli uccelli', 'ella mira los pájaros'),
    canto('qa-tom-escucha-hermana', 'Tom non ascolta sua sorella', 'Tom no escucha a su hermana'),
    canto('qa-pip-mira-pelota', 'Pip guarda la palla', 'Pip mira la pelota'),
    canto('qa-abuela-ayuda-laura', 'la nonna aiuta Laura', 'la abuela ayuda a Laura'),
    canto('qa-el-ayuda-hermano', 'lui aiuta suo fratello', 'él ayuda a su hermano'),
    canto('qa-miras-basquet', 'guardi il basket?', 'miras el básquet'),
    canto('qa-lavamos-auto', 'laviamo la macchina', 'lavamos el auto'),
    canto('qa-siempre-ayudamos', 'aiutiamo sempre papà', 'siempre ayudamos a papá', {
      varianti: ['ayudamos siempre a papá'] }),
    canto('qa-a-veces-cocinamos', 'a volte cuciniamo con la nonna', 'a veces cocinamos con la abuela'),
    canto('qa-nosotros-limpiamos', 'noi puliamo la casa', 'nosotros limpiamos la casa'),
    canto('qa-ellos-limpian-cocina', 'loro puliscono la cucina', 'ellos limpian la cocina'),
    canto('qa-laura-leo-escuchan', 'Laura e Leo ascoltano la musica', 'Laura y Leo escuchan música'),
    canto('qa-miro-tenis-papa', 'guardo il tennis con papà', 'miro el tenis con papá'),

    /* ── Il cinque di maggio ── */
    fecha('qa-hoy-cinco-de-mayo', 'oggi è il cinque maggio', 'hoy es el cinco de mayo', {
      varianti: ['hoy es cinco de mayo'] }),
    fecha('qa-cumple-dos-de-junio', 'il mio compleanno è il due giugno', 'mi cumpleaños es el dos de junio'),
    fecha('qa-tu-cumple-diez', 'il tuo compleanno è il dieci ottobre?', 'tu cumpleaños es el diez de octubre'),
    fecha('qa-hoy-tres-de-marzo', 'oggi è il tre marzo?', 'hoy es el tres de marzo', {
      varianti: ['hoy es tres de marzo'] }),
    fecha('qa-no-es-el-ocho', 'oggi non è l’otto aprile', 'hoy no es el ocho de abril', {
      varianti: ['hoy no es ocho de abril'] }),
    fecha('qa-fiesta-veinte', 'la festa è il venti dicembre', 'la fiesta es el veinte de diciembre'),
    fecha('qa-cumple-en-noviembre', 'il mio compleanno è a novembre', 'mi cumpleaños es en noviembre'),
    fecha('qa-en-invierno-frio', 'in inverno fa freddo', 'en invierno hace frío', {
      varianti: ['en el invierno hace frío'] }),
    fecha('qa-en-primavera-pajaros', 'in primavera guardo gli uccelli', 'en primavera miro los pájaros', {
      varianti: ['en la primavera miro los pájaros'], niente: ['mese-con-el'] }),
    fecha('qa-vacaciones-en-julio', 'le vacanze sono a luglio?', 'las vacaciones son en julio'),
    fecha('qa-sabado-lavamos', 'sabato laviamo la macchina', 'el sábado lavamos el auto', {
      trappole: [{ es: 'sábado lavamos el auto', perche: 'Con i giorni ci vuole el: el sábado' }] }),
    fecha('qa-domingo-cocinamos', 'domenica cuciniamo con la nonna', 'el domingo cocinamos con la abuela', {
      trappole: [{ es: 'domingo cocinamos con la abuela', perche: 'Con i giorni ci vuole el: el domingo' }] }),
    fecha('qa-martes-ayudo', 'martedì aiuto papà', 'el martes ayudo a papá', {
      trappole: [{ es: 'martes ayudo a papá', perche: 'Con i giorni ci vuole el: el martes' }] }),
    fecha('qa-fiesta-sabado-cuatro', 'la festa è sabato alle quattro', 'la fiesta es el sábado a las cuatro', {
      trappole: [{ es: 'la fiesta es sábado a las cuatro', perche: 'Con i giorni ci vuole el: el sábado' }] }),
    fecha('qa-lunes-a-las-cinco', 'lunedì ascolto la musica alle cinque', 'el lunes escucho música a las cinco'),

    /* ── Un po’ di…, alcuni ── */
    unos('qa-unos-gatos', 'ci sono dei gatti in giardino', 'hay unos gatos en el jardín'),
    unos('qa-unas-manzanas', 'ho delle mele', 'tengo unas manzanas'),
    unos('qa-algunas-frutillas', 'ci sono alcune fragole sul tavolo', 'hay algunas frutillas en la mesa'),
    unos('qa-algunos-amigos', 'alcuni amici ascoltano la musica', 'algunos amigos escuchan música'),
    unos('qa-poco-de-leche', 'c’è un po’ di latte', 'hay un poco de leche'),
    unos('qa-poco-de-arroz', 'ho un po’ di riso', 'tengo un poco de arroz'),
    unos('qa-poco-de-sopa', 'c’è un po’ di zuppa?', 'hay un poco de sopa'),
    unos('qa-poco-pan', 'c’è poco pane', 'hay poco pan'),
    unos('qa-pocas-nubes', 'oggi ci sono poche nuvole', 'hoy hay pocas nubes', { varianti: ['hay pocas nubes hoy'] }),
    unos('qa-mucha-leche', 'c’è molto latte', 'hay mucha leche'),
    unos('qa-muchos-libros', 'ho molti libri', 'tengo muchos libros'),
    unos('qa-muchas-galletas', 'Leo ha molti biscotti', 'Leo tiene muchas galletas'),
    unos('qa-mucha-hambre', 'ho molta fame', 'tengo mucha hambre'),
    unos('qa-muchos-amigos', 'hai molti amici?', 'tienes muchos amigos'),
    unos('qa-nada-en-la-caja', 'non c’è niente nella scatola', 'no hay nada en la caja'),
    unos('qa-nada-en-mochila', 'non c’è niente nel mio zaino', 'no hay nada en mi mochila'),
    unos('qa-tom-ningun-perro', 'Tom non ha nessun cane', 'Tom no tiene ningún perro'),
    unos('qa-ningun-lapiz', 'non ho nessuna matita', 'no tengo ningún lápiz'),

    /* ── Lei mangia, lui vive: il presente in -er e -ir ── */
    come('qa-ella-come-manzana', 'lei mangia una mela', 'ella come una manzana'),
    come('qa-el-vive-casa-grande', 'lui vive in una casa grande', 'él vive en una casa grande'),
    come('qa-como-pan-queso', 'mangio il pane con il formaggio', 'como pan con queso', {
      trappole: [{ es: 'come pan con queso', it: 'mangia il pane con il formaggio', perche: 'Io: como; lui, lei: come' }] }),
    come('qa-bebes-leche', 'bevi il latte?', 'bebes leche', {
      trappole: [{ es: 'bebo leche', it: 'bevo il latte?', perche: 'Tu: bebes, con la s; io: bebo' },
                 { es: 'bebas leche', perche: 'Beber è in -er: bebes, non bebas' }] }),
    come('qa-yo-bebo-tu-bebes', 'io bevo il succo e tu bevi il latte', 'yo bebo jugo y tú bebes leche'),
    come('qa-abro-ventana', 'apro la finestra', 'abro la ventana'),
    come('qa-vives-aqui', 'vivi qui?', 'vives aquí', {
      trappole: [{ es: 'vivo aquí', it: 'vivo qui?', perche: 'Tu: vives, con la s; io: vivo' },
                 { es: 'vivas aquí', perche: 'Vivir è in -ir: vives, non vivas' }] }),
    come('qa-doctor-abre-puerta', 'il dottore apre la porta', 'el doctor abre la puerta'),
    come('qa-maestra-vive-cerca', 'la maestra vive vicino', 'la maestra vive cerca'),
    come('qa-vivimos-casa-pequena', 'viviamo in una casa piccola', 'vivimos en una casa pequeña'),
    come('qa-comemos-a-las-doce', 'mangiamo alle dodici', 'comemos a las doce'),
    come('qa-no-comemos-chocolate', 'non mangiamo il cioccolato a colazione', 'no comemos chocolate en el desayuno'),
    come('qa-abuelos-viven', 'i miei nonni vivono con noi', 'mis abuelos viven con nosotros'),
    come('qa-bomberos-comen', 'i pompieri mangiano la pizza', 'los bomberos comen pizza'),
    come('qa-ellos-abren-caja', 'loro aprono la scatola', 'ellos abren la caja'),
    come('qa-nunca-bebo-leche', 'non bevo mai il latte a cena', 'nunca bebo leche en la cena', {
      varianti: ['no bebo nunca leche en la cena'],
      trappole: [{ es: 'nunca no bebo leche en la cena', perche: 'Con nunca prima del verbo niente no: nunca bebo' }] }),

    /* ── Mi alzo alle sette ── */
    me('qa-me-levanto-siete', 'mi alzo alle sette', 'me levanto a las siete'),
    me('qa-te-levantas-temprano', 'ti alzi presto?', 'te levantas temprano'),
    me('qa-me-despierto-temprano', 'mi sveglio presto', 'me despierto temprano'),
    me('qa-domingo-tarde', 'domenica mi alzo tardi', 'el domingo me levanto tarde'),
    me('qa-me-ducho-manana', 'faccio la doccia la mattina', 'me ducho por la mañana', {
      varianti: ['me ducho en la mañana'] }),
    me('qa-me-siento-silla', 'mi siedo sulla sedia', 'me siento en la silla'),
    me('qa-te-lavas-manos', 'ti lavi le mani?', 'te lavas las manos'),
    me('qa-te-peinas', 'ti pettini la mattina?', 'te peinas por la mañana', { varianti: ['te peinas en la mañana'] }),
    me('qa-laura-se-viste', 'Laura si veste e si pettina', 'Laura se viste y se peina', { niente: ['riflessivo-persona'] }),
    me('qa-tom-se-lava-manos', 'Tom si lava le mani', 'Tom se lava las manos', { niente: ['riflessivo-persona'] }),
    me('qa-papa-se-levanta', 'papà si alza alle sei e mezza', 'papá se levanta a las seis y media', {
      niente: ['riflessivo-persona'] }),
    me('qa-bebe-se-acuesta', 'il bebè va a letto presto', 'el bebé se acuesta temprano', { niente: ['riflessivo-persona'] }),
    me('qa-ellos-se-sientan', 'loro si siedono sul divano', 'ellos se sientan en el sofá', { niente: ['riflessivo-persona'] }),
    me('qa-nos-acostamos', 'andiamo a letto alle nove', 'nos acostamos a las nueve'),
    me('qa-nos-duchamos-vestimos', 'facciamo la doccia e poi ci vestiamo', 'nos duchamos y después nos vestimos'),
    me('qa-nos-levantamos-tarde', 'sabato ci alziamo tardi', 'el sábado nos levantamos tarde'),

    /* ── Che cosa stai facendo? ── */
    ger('qa-estoy-comiendo-manzana', 'sto mangiando una mela', 'estoy comiendo una manzana'),
    ger('qa-que-estas-mirando', 'che cosa stai guardando?', 'qué estás mirando'),
    ger('qa-papa-lavando-auto', 'papà sta lavando la macchina', 'papá está lavando el auto'),
    ger('qa-estamos-escuchando', 'stiamo ascoltando la musica', 'estamos escuchando música'),
    ger('qa-mama-cocinando', 'la mamma sta cucinando la pasta', 'mamá está cocinando fideos'),
    ger('qa-limpiando-garaje', 'loro stanno pulendo il garage', 'ellos están limpiando el garaje'),
    ger('qa-bebe-bebiendo', 'il bebè sta bevendo il latte', 'el bebé está bebiendo leche'),
    ger('qa-tom-abriendo-caja', 'Tom sta aprendo la scatola', 'Tom está abriendo la caja'),
    ger('qa-mirando-tren', 'sto guardando il treno', 'estoy mirando el tren'),
    ger('qa-mirando-avion', 'stai guardando l’aereo?', 'estás mirando el avión'),
    ger('qa-no-comiendo-bebiendo', 'non sto mangiando, sto bevendo il succo', 'no estoy comiendo estoy bebiendo jugo'),
    ger('qa-laura-ayudando', 'Laura sta aiutando suo nonno', 'Laura está ayudando a su abuelo'),
    ger('qa-piloto-mirando-cielo', 'il pilota sta guardando il cielo', 'el piloto está mirando el cielo'),
    ger('qa-ahora-comiendo-pizza', 'adesso stiamo mangiando la pizza', 'ahora estamos comiendo pizza'),
    ger('qa-bomberos-ayudando', 'i pompieri stanno aiutando un gatto', 'los bomberos están ayudando a un gato'),
    ger('qa-que-esta-comiendo', 'che cosa sta mangiando il cane?', 'qué está comiendo el perro'),
    ger('qa-leo-se-esta-vistiendo', 'Leo si sta vestendo', 'Leo se está vistiendo'),
  ],
}
