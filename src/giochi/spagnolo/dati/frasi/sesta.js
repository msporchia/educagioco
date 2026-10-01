// Le frasi componibili del mondo «sesta». Il formato di una frase e le
// regole stanno in docs/lingue/spagnolo-motore.md.
const F = (tappa, forma) => (id, es, it, x = {}) => ({ id, tappa, forma, es, it, ...x })

const ayer = F('sesta-ayer', 'ayer')
const fui = F('sesta-fui', 'pasado-irr')
const jugue = F('sesta-jugue', 'pasado-reg')
const dijo = F('sesta-dijo', 'decir')
const cuando = F('sesta-cuando', 'cuando')
const mas = F('sesta-mas', 'comparativos')
const voyA = F('sesta-voy-a', 'voy-a')

export default {
  mondo: 'sesta',
  frasi: [
    /* ── Ieri ero al parco: estuve, fui, fue ── */
    ayer('sx-ayer-parque', 'ayer estuve en el parque', 'ieri sono stato al parco'),
    ayer('sx-anoche-casa', 'anoche estuve en casa', 'ieri sera sono stato a casa'),
    ayer('sx-donde-estuviste', 'dónde estuviste ayer', 'dov’eri ieri?'),
    ayer('sx-laura-enferma', 'ayer Laura estuvo enferma', 'ieri Laura era malata'),
    ayer('sx-biblioteca', 'ayer estuvimos en la biblioteca', 'ieri siamo stati in biblioteca'),
    ayer('sx-cansado', 'ayer estuve muy cansado', 'ieri ero molto stanco'),
    ayer('sx-tom-leo-casa', 'ayer Tom y Leo estuvieron en mi casa', 'ieri Tom e Leo sono stati a casa mia'),
    ayer('sx-ayer-cine', 'ayer fui al cine', 'ieri sono andato al cinema'),
    ayer('sx-no-escuela', 'ayer no fui a la escuela', 'ieri non sono andato a scuola'),
    ayer('sx-fuiste-parque', 'fuiste al parque ayer', 'sei andato al parco ieri?'),
    ayer('sx-abuelos-museo', 'ayer mis abuelos fueron al museo', 'ieri i miei nonni sono andati al museo'),
    ayer('sx-leo-zoologico', 'Leo fue al zoológico el sábado', 'Leo è andato allo zoo sabato'),
    ayer('sx-fue-lunes', 'ayer fue lunes y hoy es martes', 'ieri era lunedì e oggi è martedì', {
      trappole: [{ es: 'ayer es lunes y hoy es martes', perche: 'Ieri è già passato: fue, non es' },
                 { es: 'ayer estuvo lunes y hoy es martes', perche: 'Che giorno era si dice con ser: fue, non estuvo' },
                 { es: 'ayer fue lunes y hoy fue martes', perche: 'Oggi è adesso: hoy es, non hoy fue' }] }),
    ayer('sx-cumpleanos', 'ayer fue mi cumpleaños', 'ieri è stato il mio compleanno', {
      trappole: [{ es: 'ayer es mi cumpleaños', perche: 'Ieri è già passato: fue, non es' }] }),
    ayer('sx-fiesta-bonita', 'la fiesta fue muy bonita', 'la festa è stata molto bella', {
      trappole: [{ es: 'la fiesta es muy bonita', perche: 'La festa è già finita: fue, non es' }] }),
    ayer('sx-fiesta-sabado', 'la fiesta de Laura fue el sábado', 'la festa di Laura è stata sabato', {
      trappole: [{ es: 'la fiesta de Laura estuvo el sábado', perche: 'Quando c’è stata una festa si dice con ser: fue' }] }),

    /* ── Sono andato al castello: hice, vi, di, vine ── */
    fui('sx-hice-torta', 'ayer hice una torta', 'ieri ho fatto una torta'),
    fui('sx-mama-pizza', 'anoche mi mamá hizo una pizza', 'ieri sera la mia mamma ha fatto una pizza'),
    fui('sx-que-hiciste', 'qué hiciste ayer', 'che cosa hai fatto ieri?'),
    fui('sx-no-hice-nada', 'ayer no hice nada', 'ieri non ho fatto niente'),
    fui('sx-hicimos-fiesta', 'hicimos una fiesta en el jardín', 'abbiamo fatto una festa in giardino'),
    fui('sx-vi-caballo', 'ayer vi un caballo en la granja', 'ieri ho visto un cavallo nella fattoria'),
    fui('sx-viste-castillo', 'viste el castillo y el puente', 'hai visto il castello e il ponte?'),
    fui('sx-leo-vio', 'Leo vio un pájaro en el puente', 'Leo ha visto un uccello sul ponte',
        { trappole: [{ es: 'Leo vió un pájaro en el puente', perche: 'Vio è corto: niente accento, come vi, di, dio' }] }),
    fui('sx-vimos-vacas', 'vimos muchas vacas en la granja', 'abbiamo visto molte mucche nella fattoria'),
    fui('sx-papa-dio', 'mi papá me dio un libro', 'il mio papà mi ha dato un libro',
        { trappole: [{ es: 'mi papá me dió un libro', perche: 'Dio è corto: niente accento, come vi, di, vio' }] }),
    fui('sx-quien-dio', 'quién te dio la pelota', 'chi ti ha dato la palla?'),
    fui('sx-abuela-vino', 'ayer mi abuela vino a mi casa', 'ieri mia nonna è venuta a casa mia'),
    fui('sx-tios-vinieron', 'mis tíos vinieron en tren', 'i miei zii sono venuti in treno'),
    fui('sx-fuimos-castillo', 'ayer fuimos al castillo', 'ieri siamo andati al castello'),
    fui('sx-no-pude-dormir', 'anoche no pude dormir', 'ieri sera non sono riuscito a dormire'),
    fui('sx-laura-quiso', 'Laura quiso ir al cine', 'Laura ha voluto andare al cinema'),

    /* ── Ho giocato: jugué, comió, viví ── */
    jugue('sx-ayude-papa', 'ayer ayudé a mi papá', 'ieri ho aiutato il mio papà'),
    jugue('sx-leo-encontro', 'Leo encontró una moneda en la calle', 'Leo ha trovato una moneta per strada'),
    jugue('sx-compre-globo', 'compré un globo en el mercado', 'ho comprato un palloncino al mercato'),
    jugue('sx-equipo-gano', 'ayer mi equipo ganó', 'ieri la mia squadra ha vinto'),
    jugue('sx-lave-auto', 'ayer lavé el auto con papá', 'ieri ho lavato la macchina con papà'),
    jugue('sx-mama-cocino', 'mi mamá cocinó la sopa', 'la mia mamma ha cucinato la minestra'),
    jugue('sx-escuchaste', 'escuchaste la música', 'hai ascoltato la musica?'),
    jugue('sx-limpiaron', 'ellos limpiaron la cocina', 'loro hanno pulito la cucina'),
    jugue('sx-ella-comio', 'ella comió una manzana', 'lei ha mangiato una mela'),
    jugue('sx-comiste-sopa', 'comiste la sopa', 'hai mangiato la minestra?'),
    jugue('sx-abuela-vivio', 'mi abuela vivió en un pueblo', 'mia nonna ha vissuto in un paese'),
    jugue('sx-laura-bebio', 'Laura bebió un jugo', 'Laura ha bevuto un succo'),
    jugue('sx-abrieron', 'ellos abrieron la puerta', 'loro hanno aperto la porta'),
    jugue('sx-no-comi', 'anoche no comí nada', 'ieri sera non ho mangiato niente'),
    jugue('sx-tom-salio', 'Tom salió de la escuela a las tres', 'Tom è uscito da scuola alle tre'),
    jugue('sx-jugue-tenis', 'ayer jugué al tenis', 'ieri ho giocato a tennis'),
    jugue('sx-jugue-hermano', 'jugué con mi hermano en el jardín', 'ho giocato con mio fratello in giardino'),
    jugue('sx-lance-pelota', 'lancé la pelota a Pip', 'ho lanciato la palla a Pip'),

    /* ── Ha detto ciao: dijo, me dijo, dice que ── */
    dijo('sx-leo-dijo-hola', 'Leo dijo hola', 'Leo ha detto ciao'),
    dijo('sx-laura-adios', 'Laura dijo adiós', 'Laura ha detto arrivederci'),
    dijo('sx-que-dijiste', 'qué dijiste', 'che cosa hai detto?'),
    dijo('sx-no-dije-nada', 'no dije nada', 'non ho detto niente'),
    dijo('sx-amigos-gracias', 'mis amigos dijeron gracias', 'i miei amici hanno detto grazie'),
    dijo('sx-que-te-dijo', 'qué te dijo Laura', 'che cosa ti ha detto Laura?'),
    dijo('sx-maestra-nos-dijo', 'la maestra nos dijo gracias', 'la maestra ci ha detto grazie'),
    dijo('sx-le-dije-hola', 'le dije hola a Tom', 'ho detto ciao a Tom'),
    dijo('sx-papa-me-dijo', 'papá me dijo adiós', 'papà mi ha detto ciao'),
    dijo('sx-tom-dice-hambre', 'Tom dice que tiene hambre', 'Tom dice che ha fame'),
    dijo('sx-digo-que-si', 'yo digo que sí', 'io dico di sì'),
    dijo('sx-dijeron-frio', 'ellos dijeron que hace frío', 'loro hanno detto che fa freddo'),
    dijo('sx-amigos-dicen', 'mis amigos dicen que el parque es bonito', 'i miei amici dicono che il parco è bello'),
    dijo('sx-papa-dijo-cine', 'papá dijo que vamos al cine', 'papà ha detto che andiamo al cinema'),

    /* ── Quando fa freddo: cuando, mientras ── */
    cuando('sx-cuando-frio', 'cuando hace frío bebo leche', 'quando fa freddo bevo latte'),
    cuando('sx-cuando-llueve', 'cuando llueve no salgo', 'quando piove non esco'),
    cuando('sx-cuando-triste', 'cuando estoy triste hablo con mi mamá', 'quando sono triste parlo con la mia mamma'),
    cuando('sx-bebe-llora', 'el bebé llora cuando tiene hambre', 'il bebè piange quando ha fame'),
    cuando('sx-cuando-granja', 'cuando fui a la granja vi muchas vacas',
           'quando sono andato nella fattoria ho visto molte mucche'),
    cuando('sx-cuando-nieva', 'cuando nieva jugamos en el jardín', 'quando nevica giochiamo in giardino'),
    cuando('sx-abuela-sonrie', 'mi abuela sonríe cuando ve a Pip', 'mia nonna sorride quando vede Pip'),
    cuando('sx-escucho-mientras', 'escucho música mientras cocino', 'ascolto la musica mentre cucino'),
    cuando('sx-pip-duerme', 'Pip duerme mientras Leo juega', 'Pip dorme mentre Leo gioca'),
    cuando('sx-no-hablo', 'no hablo mientras como', 'non parlo mentre mangio'),
    cuando('sx-hermana-duerme', 'mi hermana duerme mientras yo juego', 'mia sorella dorme mentre io gioco'),
    cuando('sx-juegan-mientras', 'ellos juegan mientras nosotros cocinamos', 'loro giocano mentre noi cuciniamo'),
    cuando('sx-que-haces', 'qué haces cuando llueve', 'che cosa fai quando piove?'),
    cuando('sx-que-comes', 'qué comes cuando tienes hambre', 'che cosa mangi quando hai fame?'),
    cuando('sx-donde-juegas', 'dónde juegas cuando hace calor', 'dove giochi quando fa caldo?'),

    /* ── Chi è più alto? más … que, el más, mejor ── */
    mas('sx-hermano-alto', 'mi hermano es más alto que yo', 'mio fratello è più alto di me'),
    mas('sx-caballo-rapido', 'el caballo es más rápido que el perro', 'il cavallo è più veloce del cane'),
    mas('sx-abuelo-viejo', 'mi abuelo es más viejo que mi abuela', 'mio nonno è più vecchio di mia nonna'),
    mas('sx-vaca-menos', 'la vaca es menos rápida que el caballo', 'la mucca è meno veloce del cavallo'),
    mas('sx-avion-tren', 'el avión es más rápido que el tren', 'l’aereo è più veloce del treno'),
    mas('sx-dormitorio-grande', 'mi dormitorio es más grande que el baño', 'la mia camera è più grande del bagno'),
    mas('sx-juego-facil', 'este juego es más fácil que el rompecabezas', 'questo gioco è più facile del puzzle'),
    mas('sx-hoy-frio', 'hoy hace más frío que ayer', 'oggi fa più freddo di ieri'),
    mas('sx-quien-alto', 'quién es más alto que Tom', 'chi è più alto di Tom?'),
    mas('sx-laura-alta', 'Laura es la más alta de mis amigos', 'Laura è la più alta dei miei amici',
        { trappole: [{ es: 'Laura es la más alta que mis amigos', perche: 'La più alta di tutti: la más alta de, con de' }] }),
    mas('sx-pip-gracioso', 'Pip es el más gracioso', 'Pip è il più buffo',
        { trappole: [{ es: 'Pip es más gracioso', it: 'Pip è più buffo', perche: 'Il più buffo: el más, con el davanti' }] }),
    mas('sx-laura-valiente', 'Laura es la más valiente', 'Laura è la più coraggiosa',
        { trappole: [{ es: 'Laura es más valiente', it: 'Laura è più coraggiosa', perche: 'La più coraggiosa: la más, con la davanti' },
                     { es: 'Laura es el más valiente', perche: 'Laura è femminile: la más valiente, non el' }] }),
    mas('sx-rompecabezas-dificil', 'este rompecabezas es el más difícil', 'questo puzzle è il più difficile',
        { trappole: [{ es: 'este rompecabezas es más difícil', it: 'questo puzzle è più difficile',
                       perche: 'Il più difficile: el más, con el davanti' }] }),
    mas('sx-pizza-mejor', 'la pizza es mejor que la sopa', 'la pizza è più buona della minestra'),
    // qui mejor è «meglio»: «más bueno» non è l'errore giusto
    mas('sx-tom-mejor', 'Tom juega al tenis mejor que yo', 'Tom gioca a tennis meglio di me', { niente: ['mas-bueno'] }),
    mas('sx-ella-mejor', 'ella es la mejor', 'lei è la migliore'),
    mas('sx-auto-peor', 'el auto viejo es peor que el auto nuevo', 'la macchina vecchia è peggiore di quella nuova'),

    /* ── Domani andrò: voy a + verbo ── */
    voyA('sx-manana-tenis', 'mañana voy a jugar al tenis', 'domani giocherò a tennis'),
    voyA('sx-ella-tenis', 'ella va a jugar al tenis', 'lei giocherà a tennis'),
    voyA('sx-vamos-pizza', 'luego vamos a comer pizza', 'poi mangeremo la pizza'),
    voyA('sx-ayudar-abuela', 'mañana voy a ayudar a mi abuela', 'domani aiuterò mia nonna'),
    voyA('sx-abuelos-venir', 'mis abuelos van a venir pronto', 'i miei nonni verranno presto'),
    voyA('sx-leo-lavar', 'Leo va a lavar el auto', 'Leo laverà la macchina'),
    voyA('sx-hacer-torta', 'mañana vamos a hacer una torta', 'domani faremo una torta'),
    voyA('sx-laura-dormir', 'mañana Laura va a dormir en casa de su abuela', 'domani Laura dormirà a casa di sua nonna'),
    voyA('sx-ver-castillo', 'mañana voy a ver el castillo', 'domani vedrò il castello'),
    voyA('sx-que-vas-hacer', 'qué vas a hacer mañana', 'che cosa farai domani?'),
    voyA('sx-vas-comprar', 'vas a comprar un regalo', 'comprerai un regalo?'),
    voyA('sx-que-van-comer', 'qué van a comer ellos', 'che cosa mangeranno loro?'),
    voyA('sx-vas-venir', 'vas a venir a mi fiesta', 'verrai alla mia festa?'),
    voyA('sx-no-llorar', 'no voy a llorar', 'non piangerò'),
    voyA('sx-no-salir', 'no vamos a salir porque llueve', 'non usciremo perché piove'),
    voyA('sx-no-ir-escuela', 'hoy no voy a ir a la escuela', 'oggi non andrò a scuola'),
  ],
}
