// ══════════════════════════════════════════════════════════════
// AXON — Course Data Model
// Hierarchy: Course → Semester (with year) → Section (with region) → Topic
// ══════════════════════════════════════════════════════════════

export type QuizQuestionType = 'multiple-choice' | 'write-in' | 'fill-blank';

export interface QuizQuestion {
  id: number;
  type?: QuizQuestionType;
  question: string;
  options?: string[];
  correctAnswer?: number;
  correctText?: string;
  acceptedVariations?: string[];
  blankSentence?: string;
  blankAnswer?: string;
  hint?: string;
  explanation?: string;
}

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  mastery: number;
  image?: string;
}

export interface Model3D {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  videoUrl?: string;
  flashcards?: Flashcard[];
  quizzes?: QuizQuestion[];
  model3D?: Model3D;
  subtopics?: Topic[];  // Nested sub-topics (folders within folders)
}

export interface Section {
  id: string;
  title: string;
  region?: string;   // Grouping: "Membro Superior", "Membro Inferior", "Torax", etc.
  imageUrl?: string;
  topics: Topic[];
}

export interface Semester {
  id: string;
  title: string;
  year?: number;      // 1 = 1o Ano, 2 = 2o Ano, etc.
  sections: Section[];
}

export interface Course {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  semesters: Semester[];
}

// ══════════════════════════════════════════════════════════════
// STANDARD ANATOMY TOPIC PATTERN
// Each sub-region follows: Visao Geral, Artrologia, Musculatura, Vascularizacao, Inervacao
// ══════════════════════════════════════════════════════════════

export const courses: Course[] = [
  {
    id: 'anatomy',
    name: 'Anatomia',
    color: 'bg-rose-400',
    accentColor: 'text-rose-400',
    semesters: [
      // ════════════════════════════════════════
      // 1o ANO · 1o SEMESTRE
      // ════════════════════════════════════════
      {
        id: 'sem1',
        title: '1o Ano · 1o Semestre',
        year: 1,
        sections: [
          // ── MEMBRO SUPERIOR ─────────────────────
          // Ombro
          {
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
          },
          // Axila
          {
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
          },
          // Braco
          {
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
          },
          // Cotovelo e Antebraco
          {
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
          },
          // Mao
          {
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
          },

          // ── MEMBRO INFERIOR ─────────────────────
          // Quadril
          {
            id: 'hip-section',
            title: 'Quadril',
            region: 'Membro Inferior',
            topics: [
              {
                id: 'hip',
                title: 'Visao Geral do Quadril',
                summary: 'A articulacao do quadril conecta o membro inferior ao tronco.',
                flashcards: [
                  { id: 1, question: 'Quais ossos formam a articulacao do quadril?', answer: 'Femur (cabeca) e osso do quadril (acetabulo)', mastery: 3 },
                  { id: 2, question: 'Qual tipo de articulacao e o quadril?', answer: 'Sinovial esferoidea (enartrose) — mais estavel que o ombro', mastery: 3 },
                  { id: 3, question: 'Qual estrutura aprofunda o acetabulo?', answer: 'Labro acetabular', mastery: 2 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual articulacao e mais estavel: ombro ou quadril?', options: ['Ombro', 'Quadril', 'Sao iguais', 'Depende da idade'], correctAnswer: 1, explanation: 'O quadril e mais estavel pelo encaixe profundo do acetabulo e ligamentos fortes.' },
                ],
              },
              {
                id: 'hip-artrologia',
                title: 'Artrologia do Quadril',
                summary: 'Ligamentos, capsula articular e biomecanica do quadril.',
                flashcards: [
                  { id: 1, question: 'Qual e o ligamento mais forte do corpo humano?', answer: 'Ligamento iliofemoral (de Bigelow)', mastery: 3 },
                  { id: 2, question: 'Quais ligamentos estabilizam o quadril anteriormente?', answer: 'Iliofemoral e pubofemoral', mastery: 2 },
                  { id: 3, question: 'Qual ligamento estabiliza o quadril posteriormente?', answer: 'Isquiofemoral', mastery: 2 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual ligamento limita a hiperextensao do quadril?', options: ['Pubofemoral', 'Isquiofemoral', 'Iliofemoral', 'Ligamento da cabeca do femur'], correctAnswer: 2, explanation: 'O iliofemoral (Y de Bigelow) e o principal limitador da hiperextensao.' },
                ],
              },
              {
                id: 'hip-musculatura',
                title: 'Musculatura do Quadril',
                summary: 'Musculos gluteos, rotadores e flexores do quadril.',
                flashcards: [
                  { id: 1, question: 'Qual e o principal extensor do quadril?', answer: 'Gluteo maximo', mastery: 4 },
                  { id: 2, question: 'Qual e o principal abdutor do quadril?', answer: 'Gluteo medio (e gluteo minimo)', mastery: 3 },
                  { id: 3, question: 'Quais sao os rotadores laterais profundos do quadril?', answer: 'Piriforme, obturador interno/externo, gemelo superior/inferior, quadrado femoral', mastery: 2 },
                  { id: 4, question: 'Qual e o principal flexor do quadril?', answer: 'Iliopsoas (iliaco + psoas maior)', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual musculo e o principal abdutor do quadril?', options: ['Gluteo maximo', 'Gluteo medio', 'Piriforme', 'Tensor da fascia lata'], correctAnswer: 1, explanation: 'O gluteo medio e o principal abdutor — sua fraqueza causa o sinal de Trendelenburg.' },
                  { id: 2, type: 'fill-blank', question: 'Complete sobre a marcha.', blankSentence: 'A fraqueza do gluteo medio causa o sinal de ___.', blankAnswer: 'Trendelenburg', hint: 'A pelve cai para o lado nao apoiado.', explanation: 'O sinal de Trendelenburg indica fraqueza dos abdutores do quadril.' },
                ],
              },
              {
                id: 'hip-vasc',
                title: 'Vascularizacao do Quadril',
                summary: 'Irrigacao arterial da articulacao do quadril e regiao glutea.',
                flashcards: [
                  { id: 1, question: 'Quais arterias irrigam a cabeca do femur?', answer: 'Arterias circunflexas femorais medial e lateral (ramos da femoral profunda)', mastery: 2 },
                  { id: 2, question: 'Qual arteria irriga a regiao glutea?', answer: 'Arterias gluteas superior e inferior (ramos da iliaca interna)', mastery: 2 },
                  { id: 3, question: 'Por que fraturas do colo do femur podem causar necrose?', answer: 'Porque interrompem as arterias circunflexas que irrigam a cabeca femoral', mastery: 3 },
                ],
                quizzes: [],
              },
              {
                id: 'hip-nerves',
                title: 'Inervacao do Quadril',
                summary: 'Nervos do plexo lombar e sacral na regiao do quadril.',
                flashcards: [
                  { id: 1, question: 'Qual nervo inerva o gluteo maximo?', answer: 'Nervo gluteo inferior (L5-S2)', mastery: 3 },
                  { id: 2, question: 'Qual nervo inerva o gluteo medio e minimo?', answer: 'Nervo gluteo superior (L4-S1)', mastery: 3 },
                  { id: 3, question: 'Qual nervo pode ser comprimido pelo piriforme?', answer: 'Nervo isquiatico (ciatico)', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, type: 'write-in', question: 'Qual nervo e o maior do corpo humano?', correctText: 'isquiatico', acceptedVariations: ['nervo isquiatico', 'ciatico', 'nervo ciatico', 'n. isquiatico'], hint: 'Passa pela regiao glutea profundamente.', explanation: 'O nervo isquiatico (L4-S3) e o maior nervo do corpo.' },
                ],
              },
            ],
          },
          // Coxa
          {
            id: 'thigh-section',
            title: 'Coxa',
            region: 'Membro Inferior',
            topics: [
              {
                id: 'thigh',
                title: 'Visao Geral da Coxa',
                summary: 'A coxa contem o femur e grandes grupos musculares.',
                flashcards: [
                  { id: 1, question: 'Qual e o osso da coxa?', answer: 'Femur (osso mais longo e forte do corpo)', mastery: 5 },
                  { id: 2, question: 'Quais musculos formam o quadriceps femoral?', answer: 'Reto femoral, vasto lateral, vasto medial e vasto intermedio', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual musculo NAO faz parte do quadriceps?', options: ['Reto femoral', 'Vasto lateral', 'Sartorio', 'Vasto medial'], correctAnswer: 2, explanation: 'O sartorio nao faz parte do quadriceps.' },
                ],
              },
              {
                id: 'thigh-artrologia',
                title: 'Artrologia da Coxa',
                summary: 'Relacoes osseas e topografia do femur.',
                flashcards: [
                  { id: 1, question: 'Quais sao as partes do femur proximal?', answer: 'Cabeca, colo, trocanter maior e trocanter menor', mastery: 3 },
                  { id: 2, question: 'Qual o angulo normal de inclinacao do colo do femur?', answer: 'Aproximadamente 125 graus (coxa valga > 135, coxa vara < 120)', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'thigh-musculatura',
                title: 'Musculatura da Coxa',
                summary: 'Compartimentos anterior, medial e posterior da coxa.',
                flashcards: [
                  { id: 1, question: 'Quais musculos formam os isquiotibiais?', answer: 'Biceps femoral, semitendinoso e semimembranoso', mastery: 3 },
                  { id: 2, question: 'Quais musculos formam o compartimento medial (adutor)?', answer: 'Adutor longo, adutor curto, adutor magno, gracil e pectíneo', mastery: 2 },
                  { id: 3, question: 'Qual nervo inerva o compartimento anterior da coxa?', answer: 'Nervo femoral', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual musculo cruza tanto o quadril quanto o joelho?', options: ['Vasto lateral', 'Reto femoral', 'Vasto intermedio', 'Vasto medial'], correctAnswer: 1, explanation: 'O reto femoral e biarticular: flexiona o quadril e estende o joelho.' },
                ],
              },
              {
                id: 'thigh-vasc',
                title: 'Vascularizacao da Coxa',
                summary: 'Arteria femoral, femoral profunda e triangulo femoral.',
                flashcards: [
                  { id: 1, question: 'A arteria femoral e continuacao de qual arteria?', answer: 'Arteria iliaca externa (apos o ligamento inguinal)', mastery: 3 },
                  { id: 2, question: 'O que e o triangulo femoral?', answer: 'Espaco limitado pelo ligamento inguinal, sartorio e adutor longo — contem a. femoral, v. femoral e n. femoral', mastery: 2 },
                  { id: 3, question: 'Qual arteria e o principal ramo da femoral para irrigar a coxa?', answer: 'Arteria femoral profunda (profunda da coxa)', mastery: 3 },
                ],
                quizzes: [],
              },
              {
                id: 'thigh-nerves',
                title: 'Inervacao da Coxa',
                summary: 'Nervos femoral, obturatorio e isquiatico na coxa.',
                flashcards: [
                  { id: 1, question: 'Qual nervo inerva o quadriceps femoral?', answer: 'Nervo femoral (L2-L4)', mastery: 4 },
                  { id: 2, question: 'Qual nervo inerva o compartimento medial (adutores)?', answer: 'Nervo obturatorio (L2-L4)', mastery: 3 },
                  { id: 3, question: 'O nervo isquiatico se divide em quais nervos?', answer: 'Nervo tibial e nervo fibular comum (geralmente na fossa poplitea)', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual nervo inerva os isquiotibiais?', options: ['Nervo femoral', 'Nervo obturatorio', 'Porcao tibial do isquiatico', 'Nervo gluteo inferior'], correctAnswer: 2, explanation: 'Os isquiotibiais sao inervados pela porcao tibial do nervo isquiatico (exceto cabeca curta do biceps — fibular).' },
                ],
              },
            ],
          },
          // Joelho
          {
            id: 'knee-section',
            title: 'Joelho',
            region: 'Membro Inferior',
            topics: [
              {
                id: 'knee',
                title: 'Visao Geral do Joelho',
                summary: 'A maior e mais complexa articulacao do corpo humano.',
                flashcards: [
                  { id: 1, question: 'Quais ossos formam a articulacao do joelho?', answer: 'Femur, tibia e patela', mastery: 3 },
                  { id: 2, question: 'Qual a funcao dos meniscos?', answer: 'Absorver impacto, distribuir carga e estabilizar o joelho', mastery: 3 },
                  { id: 3, question: 'Quais sao os ligamentos cruzados do joelho?', answer: 'Ligamento cruzado anterior (LCA) e ligamento cruzado posterior (LCP)', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual ligamento impede a translacao anterior da tibia?', options: ['LCP', 'LCA', 'Colateral medial', 'Colateral lateral'], correctAnswer: 1, explanation: 'O LCA impede que a tibia deslize anteriormente em relacao ao femur.' },
                ],
              },
              {
                id: 'knee-artrologia',
                title: 'Artrologia do Joelho',
                summary: 'Ligamentos, meniscos e biomecanica do joelho.',
                flashcards: [
                  { id: 1, question: 'Qual tipo de articulacao e o joelho?', answer: 'Sinovial condilar modificada (permite flexao, extensao e leve rotacao)', mastery: 3 },
                  { id: 2, question: 'Qual menisco e mais frequentemente lesionado?', answer: 'Menisco medial (menos movel, aderido ao lig. colateral medial)', mastery: 3 },
                  { id: 3, question: 'Qual e a triade infeliz (O\'Donoghue)?', answer: 'Lesao de LCA + menisco medial + ligamento colateral medial', mastery: 2 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual estrutura NAO faz parte da triade infeliz?', options: ['LCA', 'Menisco medial', 'Lig. colateral medial', 'LCP'], correctAnswer: 3, explanation: 'A triade infeliz envolve LCA, menisco medial e colateral medial.' },
                ],
              },
              {
                id: 'knee-musculatura',
                title: 'Musculatura do Joelho',
                summary: 'Musculos extensores, flexores e estabilizadores do joelho.',
                flashcards: [
                  { id: 1, question: 'Qual musculo e o principal extensor do joelho?', answer: 'Quadriceps femoral (via tendao patelar)', mastery: 4 },
                  { id: 2, question: 'Quais musculos flexionam o joelho?', answer: 'Isquiotibiais, gastrocnemio, gracil, sartorio e popliteo', mastery: 3 },
                  { id: 3, question: 'Qual musculo "destrava" o joelho na posicao estendida?', answer: 'Popliteo (rotacao medial da tibia)', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'knee-vasc',
                title: 'Vascularizacao do Joelho',
                summary: 'Rede articular do joelho e arteria poplitea.',
                flashcards: [
                  { id: 1, question: 'Qual arteria principal irriga o joelho?', answer: 'Arteria poplitea (continuacao da femoral na fossa poplitea)', mastery: 3 },
                  { id: 2, question: 'Quais sao os ramos geniculares da arteria poplitea?', answer: 'Geniculares superior e inferior (medial e lateral) e genicular media', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'knee-nerves',
                title: 'Inervacao do Joelho',
                summary: 'Nervos que inervam a articulacao e regiao do joelho.',
                flashcards: [
                  { id: 1, question: 'Quais nervos inervam a articulacao do joelho?', answer: 'Ramos do femoral, obturatorio, tibial e fibular comum', mastery: 2 },
                  { id: 2, question: 'Onde o nervo fibular comum e mais vulneravel?', answer: 'Na cabeca da fibula (subcutaneo — risco em fraturas)', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, type: 'write-in', question: 'Lesao de qual nervo causa pe caido (foot drop)?', correctText: 'fibular comum', acceptedVariations: ['nervo fibular comum', 'fibular', 'n. fibular comum', 'peroneo comum'], hint: 'Passa na cabeca da fibula.', explanation: 'O nervo fibular comum inerva os dorsiflexores do tornozelo.' },
                ],
              },
            ],
          },
          // Perna
          {
            id: 'leg-section',
            title: 'Perna',
            region: 'Membro Inferior',
            topics: [
              {
                id: 'leg',
                title: 'Visao Geral da Perna',
                summary: 'A perna e formada pela tibia e fibula.',
                flashcards: [
                  { id: 1, question: 'Quais ossos formam a perna?', answer: 'Tibia (medial) e Fibula (lateral)', mastery: 5 },
                  { id: 2, question: 'Qual musculo forma o tendao calcaneo?', answer: 'Triceps sural (gastrocnemio e soleo)', mastery: 4 },
                ],
                quizzes: [],
              },
              {
                id: 'leg-artrologia',
                title: 'Artrologia da Perna',
                summary: 'Articulacoes tibiofibulares e membrana interossea.',
                flashcards: [
                  { id: 1, question: 'Quais articulacoes existem entre tibia e fibula?', answer: 'Tibiofibular proximal (sinovial plana) e tibiofibular distal (sindesmose)', mastery: 2 },
                  { id: 2, question: 'O que e a membrana interossea da perna?', answer: 'Membrana fibrosa entre tibia e fibula que separa compartimentos e transmite forcas', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'leg-musculatura',
                title: 'Musculatura da Perna',
                summary: 'Compartimentos anterior, lateral e posterior da perna.',
                flashcards: [
                  { id: 1, question: 'Quais musculos formam o compartimento anterior da perna?', answer: 'Tibial anterior, extensor longo dos dedos, extensor longo do halux e fibular terceiro', mastery: 3 },
                  { id: 2, question: 'Quais musculos formam o triceps sural?', answer: 'Gastrocnemio (2 cabecas) e soleo', mastery: 4 },
                  { id: 3, question: 'Quais musculos formam o compartimento lateral?', answer: 'Fibular longo e fibular curto', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual compartimento e mais afetado na sindrome compartimental?', options: ['Anterior', 'Lateral', 'Posterior superficial', 'Posterior profundo'], correctAnswer: 0, explanation: 'O compartimento anterior e o mais frequentemente afetado pela sindrome compartimental.' },
                ],
              },
              {
                id: 'leg-vasc',
                title: 'Vascularizacao da Perna',
                summary: 'Arterias tibiais, fibular e drenagem venosa profunda.',
                flashcards: [
                  { id: 1, question: 'Em quais arterias a poplitea se divide?', answer: 'Arteria tibial anterior e tronco tibiofibular (que da a tibial posterior e fibular)', mastery: 2 },
                  { id: 2, question: 'Qual arteria se torna a dorsalis pedis no pe?', answer: 'Arteria tibial anterior', mastery: 3 },
                ],
                quizzes: [],
              },
              {
                id: 'leg-nerves',
                title: 'Inervacao da Perna',
                summary: 'Nervos tibial e fibulares na perna.',
                flashcards: [
                  { id: 1, question: 'Qual nervo inerva o compartimento posterior da perna?', answer: 'Nervo tibial', mastery: 3 },
                  { id: 2, question: 'Qual nervo inerva o compartimento anterior da perna?', answer: 'Nervo fibular profundo', mastery: 3 },
                  { id: 3, question: 'Qual nervo inerva o compartimento lateral da perna?', answer: 'Nervo fibular superficial', mastery: 2 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual nervo inerva os fibulares longo e curto?', options: ['Tibial', 'Fibular profundo', 'Fibular superficial', 'Sural'], correctAnswer: 2, explanation: 'O nervo fibular superficial inerva o compartimento lateral (eversores).' },
                ],
              },
            ],
          },
          // Tornozelo
          {
            id: 'ankle-section',
            title: 'Tornozelo',
            region: 'Membro Inferior',
            topics: [
              {
                id: 'ankle',
                title: 'Visao Geral do Tornozelo',
                summary: 'A articulacao do tornozelo conecta a perna ao pe.',
                flashcards: [
                  { id: 1, question: 'Quais ossos formam a articulacao do tornozelo?', answer: 'Tibia, fibula e talus', mastery: 3 },
                  { id: 2, question: 'Qual tipo de articulacao e o tornozelo?', answer: 'Sinovial ginglimo (dobradica) — dorsiflexao e flexao plantar', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual e o tipo de entorse mais comum do tornozelo?', options: ['Eversao', 'Inversao', 'Dorsiflexao forcada', 'Rotacao'], correctAnswer: 1, explanation: 'A inversao forcada lesiona os ligamentos laterais (especialmente talofibular anterior).' },
                ],
              },
              {
                id: 'ankle-artrologia',
                title: 'Artrologia do Tornozelo',
                summary: 'Ligamentos e estabilidade da articulacao talocrural.',
                flashcards: [
                  { id: 1, question: 'Qual ligamento e mais frequentemente lesionado no tornozelo?', answer: 'Ligamento talofibular anterior (em entorses por inversao)', mastery: 3 },
                  { id: 2, question: 'Qual ligamento estabiliza o tornozelo medialmente?', answer: 'Ligamento deltoide (forte, raramente lesionado)', mastery: 3 },
                  { id: 3, question: 'Quais ligamentos compoe o complexo lateral?', answer: 'Talofibular anterior, calcaneofibular e talofibular posterior', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'ankle-musculatura',
                title: 'Musculatura do Tornozelo',
                summary: 'Musculos dorsiflexores, plantarflexores e eversores.',
                flashcards: [
                  { id: 1, question: 'Qual musculo e o principal dorsiflexor?', answer: 'Tibial anterior', mastery: 4 },
                  { id: 2, question: 'Qual musculo e o principal plantiflexor?', answer: 'Triceps sural (gastrocnemio + soleo) via tendao calcaneo', mastery: 4 },
                  { id: 3, question: 'Quais musculos fazem eversao do pe?', answer: 'Fibulares longo e curto', mastery: 3 },
                ],
                quizzes: [],
              },
              {
                id: 'ankle-vasc',
                title: 'Vascularizacao do Tornozelo',
                summary: 'Rede maleolar e retinaculos.',
                flashcards: [
                  { id: 1, question: 'Quais arterias participam da rede maleolar?', answer: 'Ramos maleolares das arterias tibial anterior, tibial posterior e fibular', mastery: 2 },
                  { id: 2, question: 'Qual arteria passa posterior ao maleolo medial?', answer: 'Arteria tibial posterior', mastery: 3 },
                ],
                quizzes: [],
              },
              {
                id: 'ankle-nerves',
                title: 'Inervacao do Tornozelo',
                summary: 'Nervos que transitam pela regiao do tornozelo.',
                flashcards: [
                  { id: 1, question: 'Qual nervo passa no tunel do tarso?', answer: 'Nervo tibial (posterior ao maleolo medial)', mastery: 3 },
                  { id: 2, question: 'Qual nervo inerva a sensibilidade do dorso do pe?', answer: 'Nervo fibular superficial (exceto 1o espaco — fibular profundo)', mastery: 2 },
                ],
                quizzes: [],
              },
            ],
          },
          // Pe
          {
            id: 'foot-section',
            title: 'Pe',
            region: 'Membro Inferior',
            topics: [
              {
                id: 'foot',
                title: 'Visao Geral do Pe',
                summary: 'O pe suporta o peso e auxilia na locomocao.',
                flashcards: [
                  { id: 1, question: 'Quantos ossos do tarso existem?', answer: '7 ossos do tarso', mastery: 3 },
                  { id: 2, question: 'Qual e o maior osso do pe?', answer: 'Calcaneo', mastery: 5 },
                ],
                quizzes: [],
              },
              {
                id: 'foot-artrologia',
                title: 'Artrologia do Pe',
                summary: 'Articulacoes intertarsais, tarsometatarsais e arcos plantares.',
                flashcards: [
                  { id: 1, question: 'Quais sao os arcos do pe?', answer: 'Arco longitudinal medial, longitudinal lateral e arco transverso', mastery: 3 },
                  { id: 2, question: 'Qual articulacao e conhecida como Chopart?', answer: 'Articulacao mediotarsal (talonavicular + calcaneocuboidea)', mastery: 2 },
                  { id: 3, question: 'Qual articulacao e conhecida como Lisfranc?', answer: 'Articulacao tarsometatarsal', mastery: 2 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual osso e a chave do arco longitudinal medial?', options: ['Calcaneo', 'Talus', 'Navicular', 'Cuboide'], correctAnswer: 2, explanation: 'O navicular e a pedra angular do arco longitudinal medial.' },
                ],
              },
              {
                id: 'foot-musculatura',
                title: 'Musculatura do Pe',
                summary: 'Musculos intrinsecos do pe e camadas plantares.',
                flashcards: [
                  { id: 1, question: 'Quantas camadas de musculos tem a planta do pe?', answer: '4 camadas de musculos intrinsecos', mastery: 2 },
                  { id: 2, question: 'Qual a funcao da fascia plantar (aponevrose)?', answer: 'Sustentacao do arco longitudinal e transmissao de forca durante a marcha', mastery: 3 },
                  { id: 3, question: 'O que e a fascite plantar?', answer: 'Inflamacao da aponevrose plantar, causa dor no calcaneo', mastery: 4 },
                ],
                quizzes: [],
              },
              {
                id: 'foot-vasc',
                title: 'Vascularizacao do Pe',
                summary: 'Arterias dorsalis pedis, plantar medial e lateral.',
                flashcards: [
                  { id: 1, question: 'Qual arteria forma o pulso pedioso?', answer: 'Arteria dorsalis pedis (continuacao da tibial anterior)', mastery: 3 },
                  { id: 2, question: 'Quais arterias irrigam a planta do pe?', answer: 'Arterias plantar medial e plantar lateral (ramos da tibial posterior)', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'foot-nerves',
                title: 'Inervacao do Pe',
                summary: 'Nervos plantares e sensibilidade do pe.',
                flashcards: [
                  { id: 1, question: 'Quais nervos inervam a planta do pe?', answer: 'Nervo plantar medial e plantar lateral (ramos do tibial)', mastery: 2 },
                  { id: 2, question: 'Qual nervo inerva o dorso do pe?', answer: 'Nervo fibular superficial (maioria) e fibular profundo (1o espaco)', mastery: 2 },
                ],
                quizzes: [],
              },
            ],
          },
        ],
      },
      // ════════════════════════════════════════
      // 1o ANO · 2o SEMESTRE
      // ════════════════════════════════════════
      {
        id: 'sem2',
        title: '1o Ano · 2o Semestre',
        year: 1,
        sections: [
          {
            id: 'heart-section',
            title: 'Coracao',
            region: 'Torax',
            topics: [
              {
                id: 'heart',
                title: 'Coracao',
                summary: 'O coracao bombeia sangue para todo o corpo.',
                flashcards: [
                  { id: 1, question: 'Quantas camaras tem o coracao?', answer: '4 camaras: 2 atrios e 2 ventriculos', mastery: 5 },
                  { id: 2, question: 'O que caracteriza a sistole ventricular?', answer: 'Contracao dos ventriculos e ejecao de sangue para as grandes arterias', mastery: 4 },
                  { id: 3, question: 'Qual valva separa o atrio esquerdo do ventriculo esquerdo?', answer: 'Valva mitral (bicuspide)', mastery: 3 },
                  { id: 4, question: 'Qual arteria irriga o musculo cardiaco?', answer: 'Arterias coronarias (direita e esquerda)', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual camara do coracao possui a parede mais espessa?', options: ['Atrio direito', 'Atrio esquerdo', 'Ventriculo direito', 'Ventriculo esquerdo'], correctAnswer: 3, explanation: 'O ventriculo esquerdo precisa gerar pressao para bombear sangue para todo o corpo.' },
                ],
              },
            ],
          },
          {
            id: 'lungs-section',
            title: 'Pulmoes',
            region: 'Torax',
            topics: [
              {
                id: 'lungs',
                title: 'Pulmoes',
                summary: 'Os pulmoes realizam as trocas gasosas.',
                flashcards: [
                  { id: 1, question: 'Quantos lobos tem o pulmao direito?', answer: '3 lobos: superior, medio e inferior', mastery: 5 },
                  { id: 2, question: 'Quantos lobos tem o pulmao esquerdo?', answer: '2 lobos: superior e inferior', mastery: 5 },
                  { id: 3, question: 'Qual a funcao dos alveolos pulmonares?', answer: 'Realizar as trocas gasosas (hematose)', mastery: 4 },
                  { id: 4, question: 'O que e a pleura?', answer: 'Membrana serosa que reveste os pulmoes e a cavidade toracica', mastery: 3 },
                ],
                quizzes: [
                  { id: 1, question: 'Por que o pulmao esquerdo e menor que o direito?', options: ['Presenca do figado', 'Presenca do coracao', 'Presenca do estomago', 'Presenca do baco'], correctAnswer: 1, explanation: 'O pulmao esquerdo e menor para acomodar o coracao.' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════
  // HISTOLOGIA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'histology',
    name: 'Histologia',
    color: 'bg-indigo-500',
    accentColor: 'text-indigo-500',
    semesters: [
      {
        id: 'sem1',
        title: '1o Ano · 1o Semestre',
        year: 1,
        sections: [
          {
            id: 'epithelial',
            title: 'Tecido Epitelial',
            topics: [
              {
                id: 'simple',
                title: 'Epitelio Simples',
                summary: 'Camada unica de celulas com funcoes de absorcao e secrecao.',
                flashcards: [
                  { id: 1, question: 'O que caracteriza o epitelio simples?', answer: 'Uma unica camada de celulas apoiadas na lamina basal', mastery: 5 },
                  { id: 2, question: 'Onde e encontrado o epitelio simples pavimentoso?', answer: 'Alveolos pulmonares, endotelio vascular e mesotelio', mastery: 3 },
                  { id: 3, question: 'Qual e a funcao do epitelio simples cubico?', answer: 'Secrecao e absorcao (ex: tubulos renais)', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual tipo de epitelio simples reveste os intestinos?', options: ['Pavimentoso', 'Cubico', 'Colunar', 'Pseudoestratificado'], correctAnswer: 2, explanation: 'O epitelio simples colunar com microvilosidades reveste o intestino.' },
                ],
              },
              {
                id: 'stratified',
                title: 'Epitelio Estratificado',
                summary: 'Multiplas camadas de celulas com funcao de protecao.',
                flashcards: [
                  { id: 1, question: 'O que caracteriza o epitelio estratificado?', answer: 'Multiplas camadas de celulas sobrepostas', mastery: 5 },
                  { id: 2, question: 'Onde e encontrado o epitelio estratificado pavimentoso queratinizado?', answer: 'Pele (epiderme)', mastery: 5 },
                  { id: 3, question: 'Qual e a funcao principal do epitelio estratificado?', answer: 'Protecao contra agressoes mecanicas e quimicas', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual estrutura possui epitelio estratificado pavimentoso nao-queratinizado?', options: ['Pele', 'Esofago', 'Intestino', 'Traqueia'], correctAnswer: 1, explanation: 'O esofago e revestido por epitelio estratificado pavimentoso nao-queratinizado.' },
                ],
              },
            ],
          },
          {
            id: 'connective',
            title: 'Tecido Conjuntivo',
            topics: [
              {
                id: 'proper',
                title: 'Conjuntivo Propriamente Dito',
                summary: 'O tecido mais abundante.',
                flashcards: [
                  { id: 1, question: 'Quais sao os dois tipos de tecido conjuntivo propriamente dito?', answer: 'Frouxo (areolar) e denso (modelado e nao modelado)', mastery: 3 },
                  { id: 2, question: 'Qual e a celula mais abundante do tecido conjuntivo?', answer: 'Fibroblasto', mastery: 4 },
                  { id: 3, question: 'Quais sao os tres tipos de fibras do conjuntivo?', answer: 'Colagenas, elasticas e reticulares', mastery: 2 },
                ],
                quizzes: [],
              },
              {
                id: 'cartilage',
                title: 'Tecido Cartilaginoso',
                summary: 'Tecido rigido mas flexivel, sem vasos sanguineos.',
                flashcards: [
                  { id: 1, question: 'Quais sao os tres tipos de cartilagem?', answer: 'Hialina, elastica e fibrocartilagem', mastery: 4 },
                  { id: 2, question: 'Onde encontramos cartilagem hialina?', answer: 'Traqueia, bronquios, nariz, costelas e superficies articulares', mastery: 3 },
                  { id: 3, question: 'Por que a cartilagem se regenera lentamente?', answer: 'E avascular', mastery: 2 },
                ],
                quizzes: [],
              },
            ],
          },
          {
            id: 'muscle',
            title: 'Tecido Muscular',
            topics: [
              {
                id: 'skeletal',
                title: 'Muscular Estriado Esqueletico',
                summary: 'Musculos voluntarios ligados aos ossos.',
                flashcards: [
                  { id: 1, question: 'Qual a caracteristica histologica marcante do musculo esqueletico?', answer: 'Fibras multinucleadas com estriacoes transversais', mastery: 4 },
                  { id: 2, question: 'O que e o sarcomero?', answer: 'Unidade contratil delimitada por duas linhas Z', mastery: 3 },
                  { id: 3, question: 'Qual proteina forma os filamentos grossos?', answer: 'Miosina', mastery: 5 },
                ],
                quizzes: [],
              },
              {
                id: 'cardiac',
                title: 'Muscular Estriado Cardiaco',
                summary: 'Musculo involuntario do coracao.',
                flashcards: [
                  { id: 1, question: 'O que sao discos intercalares?', answer: 'Juncoes especializadas entre cardiomiocitos', mastery: 3 },
                  { id: 2, question: 'Quantos nucleos tem o cardiomiocito?', answer: 'Um ou dois nucleos centrais', mastery: 4 },
                ],
                quizzes: [],
              },
            ],
          },
        ],
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════
  // BIOLOGIA
  // ══════════════════════════════════════════════════════════════
  {
    id: 'biology',
    name: 'Biologia',
    color: 'bg-green-500',
    accentColor: 'text-green-500',
    semesters: [
      {
        id: 'sem1',
        title: '1o Ano · 1o Semestre',
        year: 1,
        sections: [
          {
            id: 'cell',
            title: 'Celula',
            topics: [
              {
                id: 'organelles',
                title: 'Organelas',
                summary: 'Estruturas funcionais da celula.',
                flashcards: [
                  { id: 1, question: 'Qual organela produz ATP?', answer: 'Mitocondria', mastery: 5 },
                  { id: 2, question: 'Qual e a funcao do reticulo endoplasmatico rugoso?', answer: 'Sintese de proteinas', mastery: 4 },
                  { id: 3, question: 'Qual organela realiza a digestao intracelular?', answer: 'Lisossomo', mastery: 4 },
                ],
                quizzes: [
                  { id: 1, question: 'Qual organela e conhecida como a "usina da celula"?', options: ['Nucleo', 'Mitocondria', 'Lisossomo', 'Complexo de Golgi'], correctAnswer: 1, explanation: 'A mitocondria e responsavel pela producao de ATP.' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

export type TopicSubcategory = 'Visao Geral' | 'Aparelho Locomotor' | 'Neurovascular';

/** Derive a subcategory from a topic's ID/title pattern */
export function getTopicSubcategory(topic: Topic): TopicSubcategory {
  const id = topic.id.toLowerCase();
  const title = topic.title.toLowerCase();

  if (
    id.includes('artrologia') || id.includes('musculatura') || id.includes('compartment') ||
    title.includes('artrologia') || title.includes('musculatura') || title.includes('compartimento')
  ) {
    return 'Aparelho Locomotor';
  }
  if (
    id.includes('vasc') || id.includes('nerves') || id.includes('inerv') ||
    title.includes('vasculariz') || title.includes('inervac')
  ) {
    return 'Neurovascular';
  }
  return 'Visao Geral';
}

/** Subcategory display config */
export const SUBCATEGORY_CONFIG: Record<TopicSubcategory, { label: string; color: string; dot: string }> = {
  'Visao Geral':        { label: 'Visao Geral',        color: 'text-sky-600',    dot: 'bg-sky-400' },
  'Aparelho Locomotor': { label: 'Aparelho Locomotor',  color: 'text-amber-600',  dot: 'bg-amber-400' },
  'Neurovascular':      { label: 'Neurovascular',       color: 'text-violet-600', dot: 'bg-violet-400' },
};

/** Group a section's topics by derived subcategory, preserving order */
export function groupTopicsBySubcategory(topics: Topic[]): { subcategory: TopicSubcategory; topics: Topic[] }[] {
  const order: TopicSubcategory[] = ['Visao Geral', 'Aparelho Locomotor', 'Neurovascular'];
  const groups = new Map<TopicSubcategory, Topic[]>();

  for (const topic of topics) {
    const sub = getTopicSubcategory(topic);
    if (!groups.has(sub)) groups.set(sub, []);
    groups.get(sub)!.push(topic);
  }

  return order.filter(s => groups.has(s)).map(s => ({ subcategory: s, topics: groups.get(s)! }));
}

/** Group sections by region for display purposes */
export function groupSectionsByRegion(sections: Section[]): { region: string; sections: Section[] }[] {
  const groups: { region: string; sections: Section[] }[] = [];
  const seen = new Map<string, Section[]>();

  for (const sec of sections) {
    const region = sec.region || 'Geral';
    if (!seen.has(region)) {
      const group = { region, sections: [sec] };
      groups.push(group);
      seen.set(region, group.sections);
    } else {
      seen.get(region)!.push(sec);
    }
  }

  return groups;
}

/** Flatten all topics from a course (utility) */
export function getAllTopics(course: Course): Topic[] {
  return course.semesters.flatMap(sem =>
    sem.sections.flatMap(sec => sec.topics)
  );
}

/** Flatten topics including subtopics into a single list of leaf-level items */
export function flattenTopicsWithSubtopics(topics: Topic[]): Topic[] {
  return topics.flatMap(t => t.subtopics && t.subtopics.length > 0 ? t.subtopics : [t]);
}

/** Find a static topic by ID across all courses (searches subtopics too) */
export function findStaticTopic(courseId: string, topicId: string): Topic | undefined {
  const course = courses.find(c => c.id === courseId);
  if (!course) return undefined;
  for (const sem of course.semesters) {
    for (const sec of sem.sections) {
      for (const t of sec.topics) {
        if (t.id === topicId) return t;
        if (t.subtopics) {
          const sub = t.subtopics.find(st => st.id === topicId);
          if (sub) return sub;
        }
      }
    }
  }
  return undefined;
}
