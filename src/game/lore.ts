import { CharacterId, Palette, StageId } from './types';

export interface CharacterMeta {
  id: CharacterId;
  name: string;
  shortName: string;
  title: string;
  archetype: string;
  difficultyStars: number;
  heightLabel: string;
  maxHp: number;
  walkForwardSpeed: number;
  walkBackwardSpeed: number;
  dashSpeed: number;
  dashFrames: number;
  backdashSpeed: number;
  backdashFrames: number;
  jumpVy: number;
  shortJumpVy: number;
  gravity: number;
  bio: string;
  palettes: [Palette, Palette];
  shadowPalette: Palette;
  winQuotes: string[];
  arcadeEnding: string[];
}

export function mirrorText(text: string): string {
  return text.split('').reverse().join('');
}

export const BARBARA_LULLABY_LINES: string[] = [
  'Dorme, dorme, luz lá fora,',
  'O doutor já foi embora...',
  'Senhor Botão costura o véu,',
  'Dona Traça apaga o céu...',
  'Giz no chão marcou teu fim,',
  'Fecha os olhos para mim.'
];

export const ARCADE_INTRO_SCREENS: string[] = [
  'OUTUBRO DE 1967. Faz treze noites que a lua desapareceu do firmamento e usinas inteiras calam-se num sussurro.',
  'Os jornais batizaram o colapso de "A Noite Sem Fim". Mas nos becos e salões fechados, outro nome corre: a Lanterna de Vésper.',
  'Forjada antes da memória escrita para aprisionar a primeira luz do mundo, a relíquia foi arrancada de sua gaiola de cobre.',
  'Quatro sombras convergem sob o céu sem estrelas. Para salvar quem amam, cobrar uma dívida de sangue, devorar o sol ou calar o passado.'
];

export const CHARACTERS: Record<CharacterId, CharacterMeta> = {
  cassandra: {
    id: 'cassandra',
    name: 'Cassandra Vale',
    shortName: 'CASSANDRA',
    title: 'A Dama do Último Ato',
    archetype: 'Zoner de Carga',
    difficultyStars: 3,
    heightLabel: '1,75 m',
    maxHp: 1000,
    walkForwardSpeed: 2.2,
    walkBackwardSpeed: 1.8,
    dashSpeed: 5.0,
    dashFrames: 14,
    backdashSpeed: -4.8,
    backdashFrames: 16,
    jumpVy: -7.8,
    shortJumpVy: -5.6,
    gravity: 0.42,
    bio: 'Estrela do suspense da Meridian Pictures e agente "Lírio" da Divisão Celuloide. Busca a Lanterna para resgatar Ivy, sua dublê e melhor amiga, engolida pela luz de um refletor.',
    palettes: [
      {
        name: 'Esmeralda Noir',
        colors: [
          '#0d0c12', '#f3dcd0', '#d9b5a3', '#a67f6e',
          '#137a54', '#0b5238', '#063322', '#1c1a24',
          '#2d2a38', '#e8c86b', '#b89230', '#f7f4eb',
          '#d11d38', '#8f0f22', '#fff7d6', '#3a3545'
        ],
        outline: '#0d0c12',
        skin: ['#f3dcd0', '#d9b5a3', '#a67f6e'],
        primary: ['#1fa370', '#137a54', '#084730'],
        secondary: ['#2d2a38', '#1c1a24', '#0f0e14'],
        accent: ['#f5d77f', '#d4a93c', '#8c6918'],
        weapon: ['#f7f4eb', '#d4a93c', '#544d61'],
        fxColor: '#eab308'
      },
      {
        name: 'Rubi de Gala',
        colors: [
          '#0d0c12', '#f3dcd0', '#d9b5a3', '#a67f6e',
          '#c41e3a', '#8f1128', '#590817', '#f7f4eb',
          '#d8d2c5', '#e8c86b', '#b89230', '#ffffff',
          '#ff4d6d', '#a31632', '#ffe5ec', '#4a3540'
        ],
        outline: '#0d0c12',
        skin: ['#f3dcd0', '#d9b5a3', '#a67f6e'],
        primary: ['#e02447', '#a6142f', '#630819'],
        secondary: ['#ffffff', '#ded8ce', '#aba396'],
        accent: ['#f5d77f', '#d4a93c', '#8c6918'],
        weapon: ['#ffffff', '#e02447', '#382c32'],
        fxColor: '#fb7185'
      }
    ],
    shadowPalette: {
      name: 'Sombra de Celuloide',
      colors: [],
      outline: '#a855f7',
      skin: ['#2e1065', '#1e1b4b', '#090514'],
      primary: ['#4c1d95', '#2e1065', '#090514'],
      secondary: ['#7e22ce', '#581c87', '#1e1b4b'],
      accent: ['#e9d5ff', '#c084fc', '#6b21a8'],
      weapon: ['#c084fc', '#7e22ce', '#2e1065'],
      fxColor: '#c084fc',
      isShadowBoss: true
    },
    winQuotes: [
      'Querido, você não estava no roteiro.',
      'Ninguém derruba Cassandra Vale. No máximo, a gente refilma.'
    ],
    arcadeEnding: [
      'ATO FINAL — O Observatório do Eclipse silencia. Dentro da gaiola de cobre, a Lanterna de Vésper pulsa como um coração engaiolado.',
      'Cassandra apoia o salto agulha sobre o brasão da Divisão Celuloide e destrava o fecho com um grampo de esmeralda.',
      'Da fenda de luz branca, uma mão conhecida emerge. Ivy cai de joelhos no asfalto frio, respirando como quem volta do fundo do mar.',
      'O rádio na chapeleira chia: "Agente Lírio, entregue o artefato imediatamente." Cassandra dispara um único tiro no transmissor.',
      '"Corta", diz ela, ajudando Ivy a se levantar enquanto o sol finalmente rasga a décima quarta manhã. "A partir de hoje, nós dirigimos."'
    ]
  },

  boris: {
    id: 'boris',
    name: 'Boris Dragomir',
    shortName: 'BORIS',
    title: 'A Última Presa da Caravana',
    archetype: 'Rushdown com Veneno',
    difficultyStars: 4,
    heightLabel: '1,88 m',
    maxHp: 950,
    walkForwardSpeed: 2.8,
    walkBackwardSpeed: 2.1,
    dashSpeed: 5.8,
    dashFrames: 15,
    backdashSpeed: -5.2,
    backdashFrames: 14,
    jumpVy: -8.1,
    shortJumpVy: -5.8,
    gravity: 0.45,
    bio: 'Ferreiro e herbalista romani dos Cárpatos. Seus antepassados forjaram a gaiola de cobre da Lanterna. Luta com adagas banhadas no veneno da víbora-de-chifre que corre em seu próprio sangue.',
    palettes: [
      {
        name: 'Vinho & Cobre',
        colors: [
          '#0d0a0b', '#e6c2a8', '#c79b7d', '#946b50',
          '#7a1c2e', '#52101d', '#30070f', '#f4efe6',
          '#d1c7b7', '#d97736', '#a6511b', '#38d95b',
          '#1ea33b', '#1c1817', '#38302e', '#6e3a20'
        ],
        outline: '#0d0a0b',
        skin: ['#e6c2a8', '#c79b7d', '#946b50'],
        primary: ['#8f2036', '#611322', '#380811'],
        secondary: ['#f4efe6', '#d6cbb9', '#9e9280'],
        accent: ['#e08244', '#b55c24', '#70330f'],
        weapon: ['#4ade80', '#e08244', '#166534'],
        fxColor: '#22c55e'
      },
      {
        name: 'Azul-Noite & Prata',
        colors: [
          '#0d0a0b', '#e6c2a8', '#c79b7d', '#946b50',
          '#1e3a8a', '#172554', '#0f172a', '#e2e8f0',
          '#94a3b8', '#cbd5e1', '#64748b', '#34d399',
          '#059669', '#1e293b', '#334155', '#475569'
        ],
        outline: '#0d0a0b',
        skin: ['#e6c2a8', '#c79b7d', '#946b50'],
        primary: ['#2563eb', '#1e3a8a', '#0f172a'],
        secondary: ['#e2e8f0', '#cbd5e1', '#64748b'],
        accent: ['#f8fafc', '#94a3b8', '#475569'],
        weapon: ['#34d399', '#cbd5e1', '#065f46'],
        fxColor: '#10b981'
      }
    ],
    shadowPalette: {
      name: 'Sombra dos Cárpatos',
      colors: [],
      outline: '#a855f7',
      skin: ['#2e1065', '#1e1b4b', '#090514'],
      primary: ['#4c1d95', '#2e1065', '#090514'],
      secondary: ['#6b21a8', '#3b0764', '#1e1b4b'],
      accent: ['#d8b4fe', '#a855f7', '#581c87'],
      weapon: ['#a855f7', '#4ade80', '#2e1065'],
      fxColor: '#a855f7',
      isShadowBoss: true
    },
    winQuotes: [
      'Minha avó lutava melhor. E ela tinha noventa anos.',
      'Cobre se dobra. Sangue Dragomir, não.'
    ],
    arcadeEnding: [
      'ATO FINAL — Com o martelo de seu avô e o calor da própria Lanterna, Boris refaz cada rebite da gaiola de cobre no topo do Observatório.',
      'As moedas no seu peito tilintam uma a uma, como se cada parente caído soprasse nas brasas para temperar o metal.',
      'Quando o último fecho se encaixa, a luz voraz recua para dentro da grade. Nos vales abaixo, as janelas voltam a acender.',
      'De volta à Clareira nos Cárpatos, Boris crava doze adagas ao redor da fogueira e entoa a canção da avó.',
      'A dívida foi paga com ferro, memória e cobre. Enquanto houver um Dragomir de pé, a noite terá medida.'
    ]
  },

  gnhoif: {
    id: 'gnhoif',
    name: 'Gnhoif',
    shortName: 'GNHOIF',
    title: 'O Que Veio Antes da Primeira Manhã',
    archetype: 'Controle de Espaço & Teleporte',
    difficultyStars: 5,
    heightLabel: '2,30 m',
    maxHp: 1050,
    walkForwardSpeed: 1.55,
    walkBackwardSpeed: 1.3,
    dashSpeed: 4.9,
    dashFrames: 16,
    backdashSpeed: -4.5,
    backdashFrames: 16,
    jumpVy: -6.6,
    shortJumpVy: -4.9,
    gravity: 0.30,
    bio: 'Entidade primordial de obsidiana e escuridão absoluta que engolia o excesso da primeira luz para impedir que o mundo queimasse. Voltou para devorar o que vazou da Lanterna.',
    palettes: [
      {
        name: 'Obsidiana & Eclipse',
        colors: [
          '#000000', '#1a1826', '#100e17', '#050408',
          '#f2ead8', '#d4c5a9', '#9c8b6e', '#ffd700',
          '#ffaa00', '#ffffff', '#fff4b8', '#ff4500',
          '#991b1b', '#27233a', '#3f3859', '#0a090f'
        ],
        outline: '#050408',
        skin: ['#27233a', '#161321', '#08070c'],
        primary: ['#050508', '#020204', '#000000'],
        secondary: ['#f2ead8', '#cfc0a3', '#8c7d62'],
        accent: ['#fff7cc', '#facc15', '#ca8a04'],
        weapon: ['#09080f', '#fffbeb', '#f59e0b'],
        fxColor: '#facc15'
      },
      {
        name: 'Negativo (Osso & Violeta)',
        colors: [
          '#1e1b2e', '#0f0d1a', '#07060d', '#f5f0e6',
          '#e0d6c3', '#bfb299', '#a855f7', '#7e22ce',
          '#d8b4fe', '#f3e8ff', '#581c87', '#c084fc',
          '#4c1d95', '#ded6c6', '#c4b9a5', '#968b78'
        ],
        outline: '#1e1b2e',
        skin: ['#3b1d5e', '#24103d', '#11071f'],
        primary: ['#f5f0e6', '#ded4c1', '#b5a992'],
        secondary: ['#1e1b2e', '#110e1c', '#07050d'],
        accent: ['#f3e8ff', '#c084fc', '#7e22ce'],
        weapon: ['#f5f0e6', '#d8b4fe', '#7e22ce'],
        fxColor: '#c084fc'
      }
    ],
    shadowPalette: {
      name: 'Luz Primordial (Chefe)',
      colors: [],
      outline: '#fef08a',
      skin: ['#fffbeb', '#fef08a', '#f59e0b'],
      primary: ['#ffffff', '#fef9c3', '#facc15'],
      secondary: ['#fef08a', '#f59e0b', '#b45309'],
      accent: ['#ffffff', '#fde047', '#ca8a04'],
      weapon: ['#ffffff', '#fef08a', '#d97706'],
      fxColor: '#fef08a',
      isShadowBoss: true
    },
    winQuotes: [
      mirrorText('A LUZ TAMBÉM TEM FOME.'),
      mirrorText('VOCÊ BRILHAVA. AGORA, NÃO.')
    ],
    arcadeEnding: [
      'ATO FINAL — A foice de eclipse parte o último cadeado. Gnhoif ergue a Lanterna de Vésper diante da máscara de osso.',
      'As costuras de ouro estalam e se rompem. Dos olhos abertos não sai escuridão, mas o fulgor de dez mil auroras guardadas.',
      'Ele engole a primeira luz de volta para o peito de obsidiana, onde constelações antigas voltam a girar em silêncio.',
      'Nas avenidas de 1967, os postes elétricos piscam e acendem. O mundo humano respira, alheio ao incêndio do qual foi poupado.',
      mirrorText('DORMIRÃO MAIS UM SÉCULO. ATÉ QUE O SOL TRANSBORDE OUTRA VEZ.')
    ]
  },

  barbara: {
    id: 'barbara',
    name: 'Barbara Wren',
    shortName: 'BARBARA',
    title: 'A Menina das Visitas',
    archetype: 'Agarradora com Invocações',
    difficultyStars: 4,
    heightLabel: '1,60 m',
    maxHp: 1100,
    walkForwardSpeed: 1.45,
    walkBackwardSpeed: 1.2,
    dashSpeed: 4.4,
    dashFrames: 18,
    backdashSpeed: -4.0,
    backdashFrames: 16,
    jumpVy: -6.9,
    shortJumpVy: -5.1,
    gravity: 0.46,
    bio: 'Sobrevivente do Sanatório Hollow Pines (Nº 0413). O Dr. Aldous Crane tentou apagar suas visões com um fragmento da Lanterna, mas os Visitantes do Outro Lado eram reais — e vieram protegê-la.',
    palettes: [
      {
        name: 'Ala Leste (Azul & Giz)',
        colors: [
          '#121016', '#f7ebe6', '#e3cec5', '#b89b8f',
          '#93c5fd', '#60a5fa', '#2563eb', '#f2eee9',
          '#d6cfc7', '#c2410c', '#9a3412', '#f472b6',
          '#db2777', '#27272a', '#fde047', '#4ade80'
        ],
        outline: '#121016',
        skin: ['#f7ebe6', '#e3cec5', '#b89b8f'],
        primary: ['#93c5fd', '#60a5fa', '#2563eb'],
        secondary: ['#f2eee9', '#d6cfc7', '#a89f94'],
        accent: ['#ea580c', '#c2410c', '#7c2d12'],
        weapon: ['#f472b6', '#fde047', '#60a5fa'],
        fxColor: '#f472b6'
      },
      {
        name: 'Meia-Noite & Fitas Vermelhas',
        colors: [
          '#121016', '#f7ebe6', '#e3cec5', '#b89b8f',
          '#27272a', '#18181b', '#09090b', '#e4e4e7',
          '#a1a1aa', '#ef4444', '#b91c1c', '#f43f5e',
          '#be123c', '#71717a', '#facc15', '#a855f7'
        ],
        outline: '#121016',
        skin: ['#f7ebe6', '#e3cec5', '#b89b8f'],
        primary: ['#27272a', '#18181b', '#09090b'],
        secondary: ['#d4d4d8', '#a1a1aa', '#52525b'],
        accent: ['#ef4444', '#b91c1c', '#7f1d1d'],
        weapon: ['#f43f5e', '#facc15', '#a855f7'],
        fxColor: '#f43f5e'
      }
    ],
    shadowPalette: {
      name: 'Sombra de Hollow Pines',
      colors: [],
      outline: '#a855f7',
      skin: ['#2e1065', '#1e1b4b', '#090514'],
      primary: ['#4c1d95', '#2e1065', '#090514'],
      secondary: ['#581c87', '#3b0764', '#1e1b4b'],
      accent: ['#f0abfc', '#c084fc', '#7e22ce'],
      weapon: ['#e879f9', '#a855f7', '#4c1d95'],
      fxColor: '#e879f9',
      isShadowBoss: true
    },
    winQuotes: [
      'Desculpa! O Senhor Botão não gosta quando gritam comigo.',
      'Ninguém nunca acreditou em mim. Agora acredita?'
    ],
    arcadeEnding: [
      'ATO FINAL — Barbara segura a Lanterna de Vésper com cuidado, como quem segura um vaga-lume num pote de vidro.',
      'O Senhor Botão se abaixa ao lado dela; Dona Traça pousa em seu ombro; os Gêmeos de Giz abrem uma porta desenhada no ar.',
      '"Vocês não precisam mais queimar sob aquelas lâmpadas", sussurra Barbara, abrindo a portinhola para o Outro Lado.',
      'A luz cativa atravessa o limiar e devolve cor ao mundo dos Visitantes. As fichas médicas de Hollow Pines viram cinza.',
      'Pela primeira vez desde os dezessete anos, Barbara caminha pela grama úmida da manhã. Livre, acordada e acompanhada.'
    ]
  }
};

export const PRE_FIGHT_DIALOGUES: Record<string, { p1Line: string; p2Line: string }> = {
  'cassandra_vs_boris': {
    p1Line: 'Cassandra: "Belas facas, ferreiro. Mas nunca traga cobre para um set com chumbo."',
    p2Line: 'Boris: "A gaiola que sua agência cobiça tem o nome da minha família gravado a fogo."'
  },
  'boris_vs_cassandra': {
    p1Line: 'Boris: "Afaste-se da Lanterna, atriz. Essa luz já roubou sangue demais."',
    p2Line: 'Cassandra: "Ela levou minha melhor amiga. Nem você nem os Cárpatos vão entrar na frente."'
  },
  'cassandra_vs_gnhoif': {
    p1Line: 'Cassandra: "Ótimo. O departamento de efeitos especiais realmente passou dos limites hoje."',
    p2Line: `Gnhoif: "${mirrorText('SUA AMIGA ESTÁ DENTRO DO CLARÃO. EU VOU BEBÊ-LO.')}"`
  },
  'gnhoif_vs_cassandra': {
    p1Line: `Gnhoif: "${mirrorText('VOCÊ VESTE SOMBRAS FALSAS, MULHER DE CELULOIDE.')}"`,
    p2Line: 'Cassandra: "E você está bloqueando minha luz principal. Ação!"'
  },
  'cassandra_vs_barbara': {
    p1Line: 'Cassandra: "Querida, o figurino de hospital é dramático, mas este estúdio está fechado."',
    p2Line: 'Barbara: "Moça bonita... por que há uma sombra sem dona chorando atrás de você?"'
  },
  'barbara_vs_cassandra': {
    p1Line: 'Barbara: "Dona Traça disse que o seu refletor machucou alguém que você amava."',
    p2Line: 'Cassandra: "...Fique longe da câmera, menina. Não quero machucar você."'
  },
  'boris_vs_gnhoif': {
    p1Line: 'Boris: "Então você é a fome antiga para a qual meus avós forjaram as grades."',
    p2Line: `Gnhoif: "${mirrorText('O COBRE DOS DRAGOMIR ENFERRUJA. MINHA NOITE, NÃO.')}"`
  },
  'gnhoif_vs_boris': {
    p1Line: `Gnhoif: "${mirrorText('CHEIRO DE VÍBORA E FERRO QUENTE. ENTREGUE A CHAVE.')}"`,
    p2Line: 'Boris: "Venha buscá-la no fio das minhas lâminas, devorador de sóis."'
  },
  'boris_vs_barbara': {
    p1Line: 'Boris: "Menina, volte para um lugar seguro. Meu veneno não escolhe quem fere."',
    p2Line: 'Barbara: "Não existe lugar seguro em Hollow Pines, moço. Só os meus amigos."'
  },
  'barbara_vs_boris': {
    p1Line: 'Barbara: "Suas moedas fazem um barulho bonito... mas parecem tão tristes."',
    p2Line: 'Boris: "Cada moeda é um nome que honro. Peça às suas sombras que abram caminho."'
  },
  'gnhoif_vs_barbara': {
    p1Line: `Gnhoif: "${mirrorText('CRIATURAS DE GIZ E COSTURA... RASTOS DO OUTRO LADO.')}"`,
    p2Line: 'Barbara: "Senhor Botão, segure minha mão. Esse moço alto quer apagar tudo."'
  },
  'barbara_vs_gnhoif': {
    p1Line: 'Barbara: "A luz do Dr. Crane doía... mas o seu escuro é frio demais!"',
    p2Line: `Gnhoif: "${mirrorText('O ESCURO NÃO MENTE, CRIANÇA DE PORCELANA.')}"`
  }
};

export function getPreFightDialogue(p1: CharacterId, p2: CharacterId, isShadowBoss = false): { p1Line: string; p2Line: string } {
  if (isShadowBoss) {
    if (p1 === 'gnhoif') {
      return {
        p1Line: `Gnhoif: "${mirrorText('A PRIMEIRA MANHÃ TOMOU MINHA PRÓPRIA FORMA.')}"`,
        p2Line: 'Luz Primordial: "EU SOU O INCÊNDIO QUE VOCÊ ENGOLIU HÁ DEZ MIL ANOS."'
      };
    }
    return {
      p1Line: `${CHARACTERS[p1].name}: "Minha própria sombra... moldada pela escuridão da Lanterna?!"`,
      p2Line: `Sombra de ${CHARACTERS[p1].shortName}: "${mirrorText('SEU ÚLTIMO ATO TERMINA NO ESCURO.')}"`
    };
  }
  if (p1 === p2) {
    return {
      p1Line: `${CHARACTERS[p1].name}: "Um truque de espelhos da Noite Sem Fim?"`,
      p2Line: `${CHARACTERS[p2].name}: "Só há espaço para um de nós quando a Lanterna acender."`
    };
  }
  const key = `${p1}_vs_${p2}`;
  return PRE_FIGHT_DIALOGUES[key] || {
    p1Line: `${CHARACTERS[p1].name}: "A Lanterna de Vésper será minha."`,
    p2Line: `${CHARACTERS[p2].name}: "Tente tomá-la."`
  };
}

export interface StageMeta {
  id: StageId;
  name: string;
  subtitle: string;
  musicDesc: string;
}

export const STAGES: StageMeta[] = [
  {
    id: 'estudio',
    name: 'Estúdio 13, Meridian Pictures',
    subtitle: 'Hollywood · Set Noir em Filmagem',
    musicDesc: 'Jazz de Espionagem 60s & Surf Guitar'
  },
  {
    id: 'clareira',
    name: 'Clareira das Mil Lanternas',
    subtitle: 'Montanhas dos Cárpatos · Acampamento Dragomir',
    musicDesc: 'Folk do Leste Europeu em Tom Menor'
  },
  {
    id: 'sanatorio',
    name: 'Sanatório Hollow Pines, Ala Leste',
    subtitle: 'Corredor de Isolamento · Noite de Temporal',
    musicDesc: 'Caixinha de Música Dissonante'
  },
  {
    id: 'observatorio',
    name: 'Observatório do Eclipse',
    subtitle: 'Acima das Nuvens · A Gaiola de Vésper',
    musicDesc: 'Drone Abissal & Coral Sintetizado'
  }
];
