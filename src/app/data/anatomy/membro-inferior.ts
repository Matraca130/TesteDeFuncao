// ══════════════════════════════════════════════════════════════
// AXON — Anatomia: Membro Inferior
// Sections: Quadril, Coxa, Joelho, Perna, Tornozelo, Pe
// Each follows: Visao Geral, Artrologia, Musculatura, Vascularizacao, Inervacao
// ══════════════════════════════════════════════════════════════

import type { Section } from '../course-types';

// ── QUADRIL ───────────────────────────────────────────────────
export const hipSection: Section = {
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
};

// ── COXA ──────────────────────────────────────────────────────
export const thighSection: Section = {
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
};

// ── JOELHO ────────────────────────────────────────────────────
export const kneeSection: Section = {
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
};

// ── PERNA ──────────────────────────────────────────────────────
export const legSection: Section = {
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
};

// ── TORNOZELO ─────────────────────────────────────────────────
export const ankleSection: Section = {
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
};

// ── PE ────────────────────────────────────────────────────────
export const footSection: Section = {
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
};

/** All lower limb sections in order */
export const membroInferiorSections: Section[] = [
  hipSection,
  thighSection,
  kneeSection,
  legSection,
  ankleSection,
  footSection,
];
