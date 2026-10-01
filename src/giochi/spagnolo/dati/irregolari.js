// I verbi spagnoli che non seguono la regola, quanto serve al percorso. Le
// forme sono in fila per persona: yo, tú, él (ella, usted), nosotros, ellos
// (ellas, ustedes); `-` dove la forma non si usa (llueve, nieva). Quello che
// manca si fa con la regola di motore/flessioni.js: pres il presente, ind il
// pretérito indefinido, ger il gerundio. I riflessivi stanno sotto la base
// senza «se» (vestir per vestirse). Vedi docs/lingue/spagnolo-motore.md.
export const IRREGOLARI = {
  ser: { pres: 'soy eres es somos son', ind: 'fui fuiste fue fuimos fueron', ger: 'siendo' },
  estar: { pres: 'estoy estás está estamos están', ind: 'estuve estuviste estuvo estuvimos estuvieron' },
  tener: { pres: 'tengo tienes tiene tenemos tienen', ind: 'tuve tuviste tuvo tuvimos tuvieron' },
  ir: { pres: 'voy vas va vamos van', ind: 'fui fuiste fue fuimos fueron', ger: 'yendo' },
  hacer: { pres: 'hago haces hace hacemos hacen', ind: 'hice hiciste hizo hicimos hicieron' },
  ver: { pres: 'veo ves ve vemos ven', ind: 'vi viste vio vimos vieron' },
  dar: { pres: 'doy das da damos dan', ind: 'di diste dio dimos dieron' },
  saber: { pres: 'sé sabes sabe sabemos saben', ind: 'supe supiste supo supimos supieron' },
  venir: { pres: 'vengo vienes viene venimos vienen', ind: 'vine viniste vino vinimos vinieron', ger: 'viniendo' },
  decir: { pres: 'digo dices dice decimos dicen', ind: 'dije dijiste dijo dijimos dijeron', ger: 'diciendo' },
  poder: { pres: 'puedo puedes puede podemos pueden', ind: 'pude pudiste pudo pudimos pudieron', ger: 'pudiendo' },
  querer: { pres: 'quiero quieres quiere queremos quieren', ind: 'quise quisiste quiso quisimos quisieron' },
  poner: { pres: 'pongo pones pone ponemos ponen', ind: 'puse pusiste puso pusimos pusieron' },
  traer: { pres: 'traigo traes trae traemos traen', ind: 'traje trajiste trajo trajimos trajeron' },
  salir: { pres: 'salgo sales sale salimos salen' },
  caer: { pres: 'caigo caes cae caemos caen' },
  oír: { pres: 'oigo oyes oye oímos oyen' },
  conocer: { pres: 'conozco conoces conoce conocemos conocen' },
  construir: { pres: 'construyo construyes construye construimos construyen' },
  // la vocale che cambia: e → ie, o → ue, u → ue, e → i
  jugar: { pres: 'juego juegas juega jugamos juegan' },
  volar: { pres: 'vuelo vuelas vuela volamos vuelan' },
  contar: { pres: 'cuento cuentas cuenta contamos cuentan' },
  costar: { pres: 'cuesto cuestas cuesta costamos cuestan' },
  encontrar: { pres: 'encuentro encuentras encuentra encontramos encuentran' },
  acostar: { pres: 'acuesto acuestas acuesta acostamos acuestan' },
  despertar: { pres: 'despierto despiertas despierta despertamos despiertan' },
  sentar: { pres: 'siento sientas sienta sentamos sientan' },
  cerrar: { pres: 'cierro cierras cierra cerramos cierran' },
  empezar: { pres: 'empiezo empiezas empieza empezamos empiezan' },
  pensar: { pres: 'pienso piensas piensa pensamos piensan' },
  llover: { pres: '- - llueve - -' },
  nevar: { pres: '- - nieva - -' },
  dormir: { pres: 'duermo duermes duerme dormimos duermen', ind: 'dormí dormiste durmió dormimos durmieron',
            ger: 'durmiendo' },
  pedir: { pres: 'pido pides pide pedimos piden', ind: 'pedí pediste pidió pedimos pidieron', ger: 'pidiendo' },
  vestir: { pres: 'visto vistes viste vestimos visten', ind: 'vestí vestiste vistió vestimos vistieron',
            ger: 'vistiendo' },
  seguir: { pres: 'sigo sigues sigue seguimos siguen', ind: 'seguí seguiste siguió seguimos siguieron',
            ger: 'siguiendo' },
  // rio senza accento (RAE 2010: monosillabo, come vio, dio, fue); sonrió è di due sillabe e lo tiene
  reír: { pres: 'río ríes ríe reímos ríen', ind: 'reí reíste rio reímos rieron', ger: 'riendo' },
  sonreír: { pres: 'sonrío sonríes sonríe sonreímos sonríen', ind: 'sonreí sonreíste sonrió sonreímos sonrieron',
             ger: 'sonriendo' },
}

// Le basi che cambiano la vocale al presente (quiero, puedo, juego): la
// trappola «dittongo» le scrive come se fossero regolari (quero, podo).
export const CON_DITTONGO = new Set(['querer', 'poder', 'jugar', 'volar', 'contar', 'costar', 'encontrar', 'acostar',
  'despertar', 'sentar', 'cerrar', 'empezar', 'pensar', 'dormir', 'pedir', 'vestir', 'seguir'])
