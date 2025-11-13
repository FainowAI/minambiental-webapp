// Tipos para os parâmetros de análise
export interface AnalysisParameter {
  key: string;
  nome: string;
  valor_referencia: string;
  metodologia: string;
  unidade: string;
}

// Tipos de coleta disponíveis
export const TIPOS_COLETA = [
  'Simples',
  'Composta',
  'Pontual',
  'Integrada',
  'Manual',
  'Automática',
] as const;

export type TipoColeta = (typeof TIPOS_COLETA)[number];

// Grupo 1: Parâmetros Físico-Químicos
export const PARAMETROS_FISICO_QUIMICOS: AnalysisParameter[] = [
  {
    key: 'temperatura_agua',
    nome: 'Resultado Analítico da Temperatura da Água',
    valor_referencia: '-',
    metodologia: 'SM 2580 B',
    unidade: '°C',
  },
  {
    key: 'cor',
    nome: 'Resultado Analítico da Cor',
    valor_referencia: '15',
    metodologia: 'SM 2120 B/C',
    unidade: 'Hazen',
  },
  {
    key: 'turbidez',
    nome: 'Resultado Analítico da Turbidez',
    valor_referencia: '5',
    metodologia: 'SM 2130 B',
    unidade: 'UNT',
  },
  {
    key: 'ph',
    nome: 'Resultado Analítico do pH',
    valor_referencia: '6,0 a 9,0',
    metodologia: 'SM 4500 H+ B',
    unidade: 'UC',
  },
  {
    key: 'solidos_totais_dissolvidos',
    nome: 'Resultado Analítico dos Sólidos Totais Dissolvidos',
    valor_referencia: '1000',
    metodologia: 'SM 23ª Ed. 2540 C',
    unidade: 'mg/L',
  },
  {
    key: 'dureza_total',
    nome: 'Resultado Analítico da Dureza Total',
    valor_referencia: '300',
    metodologia: 'SM 23ª Ed. 2340 C',
    unidade: 'mg/L',
  },
  {
    key: 'alcalinidade_total',
    nome: 'Resultado Analítico da Alcalinidade Total',
    valor_referencia: '-',
    metodologia: 'SM 23ª Ed. 2320 B',
    unidade: 'mg/L',
  },
  {
    key: 'nitrato',
    nome: 'Resultado Analítico do Nitrato (NO₃)',
    valor_referencia: '10',
    metodologia: 'TC-PS-055',
    unidade: 'mg/L',
  },
  {
    key: 'nitrito',
    nome: 'Resultado Analítico do Nitrito',
    valor_referencia: '1',
    metodologia: 'SM 23ª Ed. 4500 NO2 B',
    unidade: 'mg/L',
  },
  {
    key: 'fluoreto',
    nome: 'Resultado Analítico do Fluoreto',
    valor_referencia: '1,5',
    metodologia: 'SM 4500 F- D',
    unidade: 'mg/L',
  },
  {
    key: 'sulfato',
    nome: 'Resultado Analítico do Sulfato',
    valor_referencia: '250',
    metodologia: 'SM 4500 SO42- E',
    unidade: 'mg/L',
  },
  {
    key: 'cloro_residual_livre',
    nome: 'Resultado Analítico do Cloro Residual Livre',
    valor_referencia: '-',
    metodologia: '-',
    unidade: 'mg/L',
  },
  {
    key: 'cloramina',
    nome: 'Resultado Analítico da Cloramina',
    valor_referencia: '-',
    metodologia: '-',
    unidade: 'mg/L',
  },
  {
    key: 'dioxido_cloro',
    nome: 'Resultado Analítico do Dióxido de Cloro',
    valor_referencia: '-',
    metodologia: '-',
    unidade: 'mg/L',
  },
  {
    key: 'sodio',
    nome: 'Resultado Analítico do Sódio',
    valor_referencia: '200',
    metodologia: 'SM 23ª Ed. 3120 B/',
    unidade: 'mg/L',
  },
  {
    key: 'cloreto',
    nome: 'Resultado Analítico do Cloreto',
    valor_referencia: '250',
    metodologia: 'SMEWW 4500-CI- B',
    unidade: 'mg/L',
  },
  {
    key: 'ferro_total',
    nome: 'Resultado Analítico do Ferro Total',
    valor_referencia: '0,3',
    metodologia: 'SM 3500 Fe B',
    unidade: 'mg/L',
  },
  {
    key: 'condutividade_eletrica',
    nome: 'Resultado Analítico da Condutividade Elétrica',
    valor_referencia: '-',
    metodologia: 'SM 23ª Ed. 2510 B',
    unidade: 'µS/cm',
  },
];

// Grupo 2: Parâmetros Bacteriológicos
export const PARAMETROS_BACTERIOLOGICOS: AnalysisParameter[] = [
  {
    key: 'coliformes_termotolerante',
    nome: 'Resultado Analítico do Coliformes Termotolerante',
    valor_referencia: '-',
    metodologia: '-',
    unidade: 'UFC/100mL',
  },
  {
    key: 'coliformes_totais',
    nome: 'Resultado Analítico do Coliformes Totais',
    valor_referencia: 'Ausente',
    metodologia: 'ISO 9308',
    unidade: 'UFC/100mL',
  },
  {
    key: 'escherichia_coli',
    nome: 'Resultado Analítico do E.Coli',
    valor_referencia: 'Ausente',
    metodologia: 'ISO 9308',
    unidade: 'UFC/100mL',
  },
];

// Grupo 3: Parâmetros Específicos – Grupo BTEX
export const PARAMETROS_BTEX: AnalysisParameter[] = [
  {
    key: 'benzeno',
    nome: 'Resultado Analítico do Benzeno',
    valor_referencia: '-',
    metodologia: 'EPA 8260 D:2018,',
    unidade: 'µg/L',
  },
  {
    key: 'tolueno',
    nome: 'Resultado Analítico do Tolueno',
    valor_referencia: '-',
    metodologia: 'EPA 8260 D:2018,',
    unidade: 'µg/L',
  },
  {
    key: 'etilbenzeno',
    nome: 'Resultado Analítico do Etilbenzeno',
    valor_referencia: '-',
    metodologia: 'EPA 8260 D:2018,',
    unidade: 'µg/L',
  },
  {
    key: 'xileno',
    nome: 'Resultado Analítico do Xileno',
    valor_referencia: '-',
    metodologia: '5021A:2014',
    unidade: 'µg/L',
  },
];

// Grupo 4: Parâmetros Específicos – Óleos e Diesel
export const PARAMETROS_OLEOS_DIESEL: AnalysisParameter[] = [
  {
    key: 'benzeno_a_pireno',
    nome: 'Resultado Analítico de Benzeno (a) pireno',
    valor_referencia: '10',
    metodologia: 'EPA 8270 E-1:2018/',
    unidade: 'µg/L',
  },
];

// Função helper para buscar parâmetro por key
export const getParameterByKey = (key: string): AnalysisParameter | undefined => {
  const allParameters = [
    ...PARAMETROS_FISICO_QUIMICOS,
    ...PARAMETROS_BACTERIOLOGICOS,
    ...PARAMETROS_BTEX,
    ...PARAMETROS_OLEOS_DIESEL,
  ];
  return allParameters.find((param) => param.key === key);
};

// Função helper para obter todos os parâmetros organizados por grupo
export const getAllParameterGroups = () => {
  return {
    'Parâmetros Físico-Químicos': PARAMETROS_FISICO_QUIMICOS,
    'Parâmetros Bacteriológicos': PARAMETROS_BACTERIOLOGICOS,
    'Parâmetros Específicos – Grupo BTEX': PARAMETROS_BTEX,
    'Parâmetros Específicos – Óleos e Diesel': PARAMETROS_OLEOS_DIESEL,
  };
};

