const FEATURE_LABELS = {
  vitality: 'Dynamisme global de la zone',
  active_rate: 'Part des entreprises actives',
  formal_ratio: 'Part des entreprises formelles',
  weighted_capital: 'Poids du capital investi',
  city_avg_active: 'Dynamisme moyen de la ville',
  density_log: "Concentration d'entreprises",
  sector_diversity: 'Diversité des activités',
  entity_count_real: "Nombre d'entreprises de la zone",
  entity_count_total: "Nombre total d'entreprises recensées",
  capital_median: 'Capital habituel des entreprises',
  capital_mean: 'Capital moyen des entreprises',
  capital_max: 'Capital maximal observé',
  sarl_count: 'Présence de sociétés SARL',
  sa_count: 'Présence de sociétés anonymes',
  city: 'Contexte de la ville',
  sector_main: "Secteur d'activité",
};

const normalizeFeature = (feature) => String(feature ?? '').trim().replace(/^(num|cat|remainder|onehot)__/i, '');

const titleCase = (text) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const toMatchable = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const explainabilityLabel = (feature) => {
  const normalized = normalizeFeature(feature);
  const key = normalized.toLowerCase();
  if (FEATURE_LABELS[key]) return FEATURE_LABELS[key];
  if (key.startsWith('city_')) return 'Contexte de la ville';
  if (key.startsWith('sector_main_')) return "Type d'activité dominante";
  return titleCase(normalized.replace(/[_-]+/g, ' '));
};

export const formatExplainabilityFactors = (items = []) =>
  items
    .map((item, index) => {
      const share = Number(item?.share);
      if (!Number.isFinite(share)) return null;
      return {
        id: `${String(item?.feature ?? 'factor')}-${index}`,
        label: explainabilityLabel(item?.feature),
        percent: Math.max(0, Math.round(share * 100)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.percent - a.percent);

export const explainabilityHeading = (attractivityClass) => {
  const normalized = toMatchable(attractivityClass);
  if (normalized.includes('faible')) return 'Pourquoi le score est plutôt faible ?';
  if (normalized.includes('eleve') || normalized.includes('fort')) return 'Pourquoi le score est élevé ?';
  if (normalized.includes('moyen') || normalized.includes('modere')) return 'Pourquoi le score est intermédiaire ?';
  return 'Quels éléments influencent ce score ?';
};

export const explainabilityIntro = () =>
  'Voici les facteurs qui ont le plus pesé dans la décision du modèle.';

export const formatConfidencePercent = (value) => {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return 'N/A';
  const bounded = Math.min(0.999, Math.max(0, confidence));
  return `${(bounded * 100).toFixed(1)}%`;
};
