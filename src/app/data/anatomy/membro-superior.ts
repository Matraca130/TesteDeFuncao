// ══════════════════════════════════════════════════════════════
// AXON — Anatomia: Membro Superior
// Sections: Ombro, Axila, Braco, Cotovelo/Antebraco, Mao
// Each follows: Visao Geral, Artrologia, Musculatura, Vascularizacao, Inervacao
// ══════════════════════════════════════════════════════════════

import type { Section } from '../course-types';

// ── OMBRO ─────────────────────────────────────────────────────
export const shoulderSection: Section = {
  id: 'shoulder-section',
  title: 'Ombro',
  region: 'Membro Superior',
  topics: [
    {
      id: 'shoulder',
      title: 'Visao Geral do Ombro',
      summary: 'A articulacao do ombro e uma das mais moveis do corpo humano.',
      flashcards: [
        { id: 1, question: 'Quais ossos formam a articulacao do ombro?', answer: 'Umero e escapula (cavidade glenoidal)', mastery: 4 },
        { id: 2, question: 'Qual e o principal musculo abdutor do ombro?', answer: 'Musculo deltoide (auxiliado pelo supraespinal)', mastery: 3 },
        { id: 3, question: 'Quais musculos formam o manguito rotador?', answer: 'Supraespinal, Infraespinal, Redondo menor e Subescapular (SITS)', mastery: 2 },
        { id: 4, question: 'Qual nervo pode ser lesado em fraturas do colo cirurgico do umero?', answer: 'Nervo axilar', mastery: 5 },
      ],
      quizzes: [
        { id: 1, question: 'Qual musculo NAO faz parte do manguito rotador?', options: ['Supraespinal', 'Infraespinal', 'Deltoide', 'Subescapular'], correctAnswer: 2, explanation: 'O deltoide e o principal abdutor do ombro, mas nao faz parte do manguito rotador.' },
      ],
    },
    {
      id: 'shoulder-artrologia',
      title: 'Artrologia do Ombro',
      summary: 'Articulacoes da cintura escapular e complexo do ombro.',
      flashcards: [
        { id: 1, question: 'Quais articulacoes compoe a cintura escapular?', answer: 'Esternoclavicular, acromioclavicular, glenoumeral e escapulotoracica (funcional)', mastery: 3 },
        { id: 2, question: 'Qual tipo de articulacao e a glenoumeral?', answer: 'Sinovial esferoidea (enartrosis)', mastery: 2 },
        { id: 3, question: 'Qual estrutura aprofunda a cavidade glenoidal?', answer: 'Labro glenoidal (labrum)', mastery: 3 },
        { id: 4, question: 'Quais ligamentos estabilizam a articulacao glenoumeral?', answer: 'Ligamentos glenoumerais (superior, medio e inferior) e coracoumeral', mastery: 2 },
      ],
      quizzes: [
        { id: 1, question: 'Qual articulacao da cintura escapular e funcional (nao anatomica)?', options: ['Esternoclavicular', 'Acromioclavicular', 'Glenoumeral', 'Escapulotoracica'], correctAnswer: 3, explanation: 'A escapulotoracica nao possui capsula articular.' },
      ],
    },
    {
      id: 'shoulder-musculatura',
      title: 'Musculatura do Ombro',
      summary: 'Musculos da cintura escapular, manguito rotador e movimentos.',
      flashcards: [
        { id: 1, question: 'Quais musculos formam o manguito rotador (SITS)?', answer: 'Supraespinal, Infraespinal, Redondo menor (Teres minor), Subescapular', mastery: 3 },
        { id: 2, question: 'Qual a acao do musculo supraespinal?', answer: 'Abducao do braco (primeiros 15 graus) e estabilizacao da cabeca umeral', mastery: 2 },
        { id: 3, question: 'Qual musculo e o principal rotador lateral do ombro?', answer: 'Infraespinal', mastery: 2 },
        { id: 4, question: 'Quais musculos fazem aducao do ombro?', answer: 'Peitoral maior, latissimo do dorso e redondo maior', mastery: 3 },
        { id: 5, question: 'Qual musculo e o unico rotador medial do manguito?', answer: 'Subescapular', mastery: 2 },
      ],
      quizzes: [
        { id: 1, question: 'Qual musculo do manguito rotador e mais frequentemente lesionado?', options: ['Infraespinal', 'Supraespinal', 'Redondo menor', 'Subescapular'], correctAnswer: 1, explanation: 'O supraespinal e o mais lesionado por sua posicao sob o arco coracoacromial.' },
        { id: 2, type: 'fill-blank', question: 'Complete sobre o manguito rotador.', blankSentence: 'O manguito rotador e formado por 4 musculos cuja sigla e ___.', blankAnswer: 'SITS', hint: 'Supraespinal, Infraespinal, Teres minor, Subescapular.', explanation: 'SITS = Supraespinal, Infraespinal, Teres minor, Subescapular.' },
      ],
    },
    {
      id: 'shoulder-vasc',
      title: 'Vascularizacao do Ombro',
      summary: 'Irrigacao arterial e drenagem venosa da regiao do ombro.',
      flashcards: [
        { id: 1, question: 'Qual arteria irriga principalmente o ombro?', answer: 'Arteria axilar e seus ramos', mastery: 3 },
        { id: 2, question: 'Quais sao as 3 partes da arteria axilar?', answer: '1a parte (acima do peitoral menor), 2a parte (posterior), 3a parte (abaixo)', mastery: 2 },
      ],
      quizzes: [],
    },
    {
      id: 'shoulder-nerves',
      title: 'Inervacao do Ombro',
      summary: 'Nervos do plexo braquial que inervam a regiao do ombro.',
      flashcards: [
        { id: 1, question: 'Qual nervo inerva o musculo deltoide?', answer: 'Nervo axilar (C5-C6)', mastery: 4 },
        { id: 2, question: 'Qual nervo inerva o supraespinal e infraespinal?', answer: 'Nervo supraescapular (C5-C6)', mastery: 3 },
        { id: 3, question: 'Qual e a raiz do plexo braquial?', answer: 'Ramos ventrais de C5-T1', mastery: 3 },
      ],
      quizzes: [
        { id: 1, type: 'write-in', question: 'Qual nervo e lesionado em luxacoes anteriores do ombro?', correctText: 'axilar', acceptedVariations: ['nervo axilar', 'n. axilar'], hint: 'Circunda o colo cirurgico do umero.', explanation: 'O nervo axilar (C5-C6) e vulneravel em luxacoes anteriores.' },
      ],
    },
  ],
};

// ── AXILA ─────────────────────────────────────────────────────
export const axillaSection: Section = {
  id: 'axilla-section',
  title: 'Axila',
  region: 'Membro Superior',
  topics: [
    {
      id: 'axilla',
      title: 'Visao Geral da Axila',
      summary: 'Espaco piramidal entre o braco e a parede toracica com estruturas neurovasculares.',
      flashcards: [
        { id: 1, question: 'O que e a axila?', answer: 'Espaco piramidal entre o braco e a parede toracica, com importantes estruturas neurovasculares', mastery: 3 },
        { id: 2, question: 'Quais sao os limites da axila?', answer: 'Anterior: peitorais; Posterior: subescapular e latissimo; Medial: serrátil anterior; Lateral: umero', mastery: 2 },
        { id: 3, question: 'Qual e o conteudo principal da axila?', answer: 'Arteria e veia axilar, plexo braquial, linfonodos axilares', mastery: 3 },
      ],
      quizzes: [
        { id: 1, question: 'Qual musculo forma a parede medial da axila?', options: ['Peitoral maior', 'Subescapular', 'Serratil anterior', 'Latissimo do dorso'], correctAnswer: 2, explanation: 'O serratil anterior reveste a parede toracica e forma a parede medial da axila.' },
      ],
    },
    {
      id: 'axilla-artrologia',
      title: 'Artrologia da Axila',
      summary: 'Relacoes articulares e espacos da regiao axilar.',
      flashcards: [
        { id: 1, question: 'Qual articulacao esta relacionada ao apice da axila?', answer: 'Articulacao esternoclavicular (via abertura cervico-axilar)', mastery: 2 },
        { id: 2, question: 'Qual espaco conecta o pescoco a axila?', answer: 'Abertura cervico-axilar (inlet toracico)', mastery: 2 },
      ],
      quizzes: [],
    },
    {
      id: 'axilla-musculatura',
      title: 'Musculatura da Axila',
      summary: 'Musculos que formam as paredes da axila.',
      flashcards: [
        { id: 1, question: 'Quais musculos formam a parede anterior da axila?', answer: 'Peitoral maior e peitoral menor', mastery: 3 },
        { id: 2, question: 'Quais musculos formam a parede posterior da axila?', answer: 'Subescapular, latissimo do dorso e redondo maior', mastery: 2 },
        { id: 3, question: 'O que e o espaco quadrangular?', answer: 'Espaco limitado pelo redondo menor, redondo maior, cabeca longa do triceps e umero — passa o nervo axilar', mastery: 2 },
      ],
      quizzes: [
        { id: 1, question: 'Qual estrutura passa pelo espaco quadrangular?', options: ['Nervo radial', 'Nervo axilar', 'Nervo mediano', 'Nervo ulnar'], correctAnswer: 1, explanation: 'O nervo axilar e a arteria circunflexa posterior passam pelo espaco quadrangular.' },
      ],
    },
    {
      id: 'axilla-vasc',
      title: 'Vascularizacao da Axila',
      summary: 'Arteria axilar, seus ramos e drenagem venosa axilar.',
      flashcards: [
        { id: 1, question: 'A arteria axilar e continuacao de qual arteria?', answer: 'Arteria subclavia (apos cruzar a 1a costela)', mastery: 3 },
        { id: 2, question: 'Quais sao os ramos da 2a parte da arteria axilar?', answer: 'Arteria toracoacromial e arteria toracica lateral', mastery: 2 },
        { id: 3, question: 'Qual grupo de linfonodos drena o membro superior?', answer: 'Linfonodos axilares (grupos: peitoral, subescapular, umeral, central, apical)', mastery: 2 },
      ],
      quizzes: [
        { id: 1, question: 'A arteria axilar e continuacao de qual arteria?', options: ['Arteria subclavia', 'Arteria braquial', 'Arteria carotida', 'Arteria toracica'], correctAnswer: 0, explanation: 'A arteria subclavia passa a ser chamada de arteria axilar apos cruzar a primeira costela.' },
      ],
    },
    {
      id: 'axilla-nerves',
      title: 'Inervacao da Axila',
      summary: 'Plexo braquial e suas divisoes na regiao axilar.',
      flashcards: [
        { id: 1, question: 'Quais sao os troncos do plexo braquial?', answer: 'Superior (C5-C6), medio (C7) e inferior (C8-T1)', mastery: 3 },
        { id: 2, question: 'Quais sao os fasciculos do plexo braquial?', answer: 'Lateral, posterior e medial (nomeados pela relacao com a arteria axilar)', mastery: 2 },
        { id: 3, question: 'Qual nervo origina do fasciculo posterior?', answer: 'Nervos axilar, radial e subescapulares', mastery: 2 },
      ],
      quizzes: [
        { id: 1, type: 'write-in', question: 'Qual fasciculo do plexo braquial da origem ao nervo mediano (parcialmente)?', correctText: 'lateral', acceptedVariations: ['fasciculo lateral', 'lateral e medial'], hint: 'Recebe contribuicao de dois fasciculos.', explanation: 'O nervo mediano recebe raizes dos fasciculos lateral e medial.' },
      ],
    },
  ],
};

// ── BRACO ─────────────────────────────────────────────────────
export const armSection: Section = {
  id: 'arm-section',
  title: 'Braco',
  region: 'Membro Superior',
  topics: [
    {
      id: 'arm',
      title: 'Visao Geral do Braco',
      summary: 'O braco contem o umero e compartimentos musculares.',
      flashcards: [
        { id: 1, question: 'Qual a principal arteria do braco?', answer: 'Arteria braquial', mastery: 5 },
        { id: 2, question: 'Qual nervo inerva o compartimento anterior do braco?', answer: 'Nervo musculocutaneo', mastery: 2 },
        { id: 3, question: 'Quais musculos formam o compartimento anterior do braco?', answer: 'Biceps braquial, braquial e coracobraquial', mastery: 3 },
      ],
      quizzes: [
        { id: 1, question: 'Qual musculo e inervado pelo nervo radial?', options: ['Biceps braquial', 'Braquial', 'Triceps braquial', 'Coracobraquial'], correctAnswer: 2, explanation: 'O triceps braquial e inervado pelo nervo radial.' },
      ],
    },
    {
      id: 'arm-artrologia',
      title: 'Artrologia do Braco',
      summary: 'Articulacao glenoumeral e suas relacoes com o umero.',
      flashcards: [
        { id: 1, question: 'Qual osso forma o esqueleto do braco?', answer: 'Umero', mastery: 5 },
        { id: 2, question: 'Quais sao as tuberosidades do umero proximal?', answer: 'Tuberculo maior (lateral) e tuberculo menor (anterior), separados pelo sulco intertubercular', mastery: 3 },
      ],
      quizzes: [],
    },
    {
      id: 'arm-musculatura',
      title: 'Musculatura do Braco',
      summary: 'Compartimentos anterior e posterior do braco.',
      flashcards: [
        { id: 1, question: 'Quais musculos formam o compartimento anterior do braco?', answer: 'Biceps braquial (cabeca curta e longa), braquial e coracobraquial', mastery: 3 },
        { id: 2, question: 'Qual musculo forma o compartimento posterior do braco?', answer: 'Triceps braquial (cabecas longa, lateral e medial)', mastery: 4 },
        { id: 3, question: 'Qual e a acao principal do biceps braquial?', answer: 'Flexao do cotovelo e supinacao do antebraco', mastery: 3 },
      ],
      quizzes: [
        { id: 1, question: 'Qual musculo do braco tambem faz supinacao?', options: ['Braquial', 'Coracobraquial', 'Biceps braquial', 'Triceps'], correctAnswer: 2, explanation: 'O biceps braquial e flexor do cotovelo e supinador potente.' },
      ],
    },
    {
      id: 'arm-vasc',
      title: 'Vascularizacao do Braco',
      summary: 'Arteria braquial, seus ramos e drenagem venosa.',
      flashcards: [
        { id: 1, question: 'A arteria braquial e continuacao de qual arteria?', answer: 'Arteria axilar (apos a margem inferior do redondo maior)', mastery: 3 },
        { id: 2, question: 'Onde a arteria braquial se bifurca?', answer: 'Na fossa cubital, em arterias radial e ulnar', mastery: 3 },
        { id: 3, question: 'Qual arteria acompanha o nervo radial no sulco do nervo radial?', answer: 'Arteria braquial profunda (profunda do braco)', mastery: 2 },
      ],
      quizzes: [],
    },
    {
      id: 'arm-nerves',
      title: 'Inervacao do Braco',
      summary: 'Nervos do plexo braquial que transitam pelo braco.',
      flashcards: [
        { id: 1, question: 'Qual nervo pode ser lesado em fraturas da diafise do umero?', answer: 'Nervo radial (no sulco do nervo radial)', mastery: 4 },
        { id: 2, question: 'Qual nervo inerva o compartimento anterior do braco?', answer: 'Nervo musculocutaneo (C5-C7)', mastery: 3 },
        { id: 3, question: 'Apos inervar o braco, o nervo musculocutaneo continua como qual nervo?', answer: 'Nervo cutaneo lateral do antebraco', mastery: 2 },
      ],
      quizzes: [
        { id: 1, type: 'write-in', question: 'Qual nervo e vulneravel em fraturas do meio da diafise do umero?', correctText: 'radial', acceptedVariations: ['nervo radial', 'n. radial'], hint: 'Percorre o sulco espiral do umero.', explanation: 'O nervo radial percorre o sulco do nervo radial na face posterior do umero.' },
      ],
    },
  ],
};

// ── COTOVELO E ANTEBRACO ──────────────────────────────────────
export const elbowForearmSection: Section = {
  id: 'elbow-forearm-section',
  title: 'Cotovelo e Antebraco',
  region: 'Membro Superior',
  topics: [
    {
      id: 'elbow',
      title: 'Visao Geral do Cotovelo',
      summary: 'A articulacao do cotovelo conecta o braco ao antebraco.',
      flashcards: [
        { id: 1, question: 'Quais ossos formam a articulacao do cotovelo?', answer: 'Umero, radio e ulna', mastery: 4 },
        { id: 2, question: 'Qual tipo de articulacao e o cotovelo?', answer: 'Articulacao sinovial do tipo ginglimo (dobradica)', mastery: 3 },
        { id: 3, question: 'Qual nervo passa posterior ao epicondilo medial?', answer: 'Nervo ulnar', mastery: 5 },
      ],
      quizzes: [
        { id: 1, question: 'Qual movimento principal ocorre na articulacao do cotovelo?', options: ['Rotacao', 'Flexao e extensao', 'Abducao e aducao', 'Circunducao'], correctAnswer: 1, explanation: 'O cotovelo e uma articulacao ginglimo.' },
      ],
    },
    {
      id: 'forearm',
      title: 'Visao Geral do Antebraco',
      summary: 'O antebraco e composto pelo radio e ulna.',
      flashcards: [
        { id: 1, question: 'Quais ossos formam o antebraco?', answer: 'Radio (lateral) e Ulna (medial)', mastery: 5 },
        { id: 2, question: 'Qual nervo inerva a maior parte dos flexores do antebraco?', answer: 'Nervo mediano', mastery: 3 },
      ],
      quizzes: [],
    },
    {
      id: 'elbow-artrologia',
      title: 'Artrologia do Cotovelo',
      summary: 'Articulacoes do complexo do cotovelo e ligamentos.',
      flashcards: [
        { id: 1, question: 'Quais articulacoes formam o complexo do cotovelo?', answer: 'Umeroulnar (ginglimo), umerorradial (esferoidea) e radioulnar proximal (trocoide)', mastery: 3 },
        { id: 2, question: 'Qual ligamento estabiliza o cotovelo medialmente?', answer: 'Ligamento colateral ulnar (medial)', mastery: 2 },
      ],
      quizzes: [
        { id: 1, question: 'Qual articulacao do cotovelo permite pronacao e supinacao?', options: ['Umeroulnar', 'Umerorradial', 'Radioulnar proximal', 'Todas'], correctAnswer: 2, explanation: 'A radioulnar proximal (trocoide) permite rotacao do radio sobre a ulna.' },
      ],
    },
    {
      id: 'elbow-musculatura',
      title: 'Musculatura do Cotovelo e Antebraco',
      summary: 'Musculos flexores, extensores, pronadores e supinadores.',
      flashcards: [
        { id: 1, question: 'Quais musculos flexionam o cotovelo?', answer: 'Biceps braquial, braquial e braquiorradial', mastery: 3 },
        { id: 2, question: 'Qual musculo faz extensao do cotovelo?', answer: 'Triceps braquial (e anconeo como acessorio)', mastery: 4 },
        { id: 3, question: 'Quais musculos fazem pronacao?', answer: 'Pronador redondo e pronador quadrado', mastery: 3 },
      ],
      quizzes: [],
    },
    {
      id: 'forearm-compartments',
      title: 'Compartimentos do Antebraco',
      summary: 'Compartimentos anterior e posterior, musculos e inervacao.',
      flashcards: [
        { id: 1, question: 'Qual nervo inerva a maioria dos flexores do antebraco?', answer: 'Nervo mediano (exceto flexor ulnar do carpo e metade do FPD)', mastery: 3 },
        { id: 2, question: 'Qual nervo inerva todos os extensores do antebraco?', answer: 'Nervo radial (ramo interosseo posterior)', mastery: 3 },
      ],
      quizzes: [],
    },
  ],
};

// ── MAO ───────────────────────────────────────────────────────
export const handSection: Section = {
  id: 'hand-section',
  title: 'Mao',
  region: 'Membro Superior',
  topics: [
    {
      id: 'hand',
      title: 'Visao Geral da Mao',
      summary: 'A mao possui ossos do carpo, metacarpos e falanges.',
      flashcards: [
        { id: 1, question: 'Quantos ossos do carpo existem?', answer: '8 ossos do carpo organizados em duas fileiras', mastery: 4 },
        { id: 2, question: 'O que e o tunel do carpo?', answer: 'Passagem osteofibrosa por onde passam os tendoes flexores e o nervo mediano', mastery: 5 },
      ],
      quizzes: [
        { id: 1, question: 'Qual nervo e afetado na sindrome do tunel do carpo?', options: ['Nervo radial', 'Nervo mediano', 'Nervo ulnar', 'Nervo musculocutaneo'], correctAnswer: 1, explanation: 'Compressao do nervo mediano no tunel do carpo.' },
      ],
    },
    {
      id: 'hand-artrologia',
      title: 'Artrologia do Punho e Mao',
      summary: 'Articulacoes do punho, carpometacarpais e interfalangicas.',
      flashcards: [
        { id: 1, question: 'Qual articulacao permite a oposicao do polegar?', answer: 'Carpometacarpal do polegar (selar/em sela)', mastery: 3 },
        { id: 2, question: 'Quais ossos do carpo formam a fileira proximal?', answer: 'Escafoide, semilunar, piramidal e pisiforme', mastery: 2 },
        { id: 3, question: 'Quais ossos do carpo formam a fileira distal?', answer: 'Trapezio, trapezoide, capitato e hamato', mastery: 2 },
      ],
      quizzes: [],
    },
    {
      id: 'hand-musculatura',
      title: 'Musculatura Intrinseca da Mao',
      summary: 'Musculos tenares, hipotenares, lumbricais e interosseos.',
      flashcards: [
        { id: 1, question: 'Quais musculos formam a eminencia tenar?', answer: 'Abdutor curto do polegar, oponente do polegar e flexor curto do polegar', mastery: 3 },
        { id: 2, question: 'Qual a funcao dos lumbricais?', answer: 'Flexao das MCF e extensao das IF', mastery: 2 },
        { id: 3, question: 'Qual nervo inerva os musculos hipotenares?', answer: 'Nervo ulnar', mastery: 4 },
      ],
      quizzes: [],
    },
    {
      id: 'hand-vasc',
      title: 'Vascularizacao da Mao',
      summary: 'Arcos palmares e irrigacao dos dedos.',
      flashcards: [
        { id: 1, question: 'Quais sao os dois arcos arteriais da mao?', answer: 'Arco palmar superficial (ramo da ulnar) e arco palmar profundo (ramo da radial)', mastery: 2 },
        { id: 2, question: 'Qual arteria forma principalmente o arco palmar superficial?', answer: 'Arteria ulnar', mastery: 3 },
      ],
      quizzes: [],
    },
    {
      id: 'hand-nerves',
      title: 'Inervacao da Mao',
      summary: 'Territorios sensitivos e motores dos nervos mediano, ulnar e radial na mao.',
      flashcards: [
        { id: 1, question: 'Qual nervo inerva os 2 lumbricais laterais?', answer: 'Nervo mediano', mastery: 2 },
        { id: 2, question: 'Qual nervo inerva todos os interosseos da mao?', answer: 'Nervo ulnar (ramo profundo)', mastery: 3 },
        { id: 3, question: 'Qual a area sensitiva exclusiva do nervo mediano na mao?', answer: 'Polpa do indicador', mastery: 2 },
      ],
      quizzes: [
        { id: 1, question: 'Qual nervo e responsavel pela garra ulnar?', options: ['Nervo mediano', 'Nervo radial', 'Nervo ulnar', 'Nervo musculocutaneo'], correctAnswer: 2, explanation: 'A lesao do nervo ulnar causa a mao em garra pela perda dos interosseos e lumbricais mediais.' },
      ],
    },
  ],
};

/** All upper limb sections in order */
export const membroSuperiorSections: Section[] = [
  shoulderSection,
  axillaSection,
  armSection,
  elbowForearmSection,
  handSection,
];
