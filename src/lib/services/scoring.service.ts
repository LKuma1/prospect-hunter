import type { ScoreBreakdown, ScoringConfig } from '@/types';

const NICHO_KEYWORDS: Record<string, string[]> = {
  dentista: ['dentista', 'odonto', 'odontologia', 'clínica', 'saúde bucal', 'sorriso', 'dente'],
  psicólogo: ['psicólogo', 'psicóloga', 'psicologo', 'psicologa', 'terapia', 'saúde mental', 'psicoterapia'],
  eletricista: ['elétrica', 'eletricista', 'instalação elétrica', 'instalações', 'manutenção'],
  nutricionista: ['nutricionista', 'nutrição', 'dieta', 'alimentação saudável', 'reeducação alimentar'],
  advogado: ['advogado', 'advogada', 'direito', 'jurídico', 'advocacia', 'oab'],
  médico: ['médico', 'médica', 'medicina', 'clínica médica', 'saúde', 'consultório'],
  fisioterapeuta: ['fisioterapeuta', 'fisioterapia', 'reabilitação', 'pilates'],
  personal: ['personal', 'personal trainer', 'treinamento', 'academia', 'fitness', 'musculação'],
};

const CONTACT_REGEX = /whatsapp|wpp|zap|📱|\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/i;

const DEFAULT_CONFIG: ScoringConfig = {
  followersWeight: 50,
  bioWeight: 30,
  contactWeight: 20,
};

function scoreFollowers(followers: number, weight: number): number {
  let ratio: number;
  if (followers >= 1000 && followers <= 50000) ratio = 1.0;
  else if (followers >= 500) ratio = 0.6;
  else if (followers > 50000) ratio = 0.4;
  else ratio = 0.2;
  return Math.round(weight * ratio);
}

function scoreBio(bio: string, nicho: string, weight: number): number {
  const bioLower = bio.toLowerCase();
  const keywords = NICHO_KEYWORDS[nicho.toLowerCase()] ?? [];

  if (keywords.length === 0) {
    // Fallback: if we don't know the nicho, check if any keyword from nicho appears in bio
    if (bioLower.includes(nicho.toLowerCase())) return Math.round(weight * 0.5);
    return 0;
  }

  const matches = keywords.filter((kw) => bioLower.includes(kw)).length;
  const ratio = Math.min(matches / Math.max(keywords.length * 0.3, 1), 1);
  return Math.round(weight * ratio);
}

function scoreContact(bio: string, weight: number): number {
  return CONTACT_REGEX.test(bio) ? weight : 0;
}

export function calculateScore(
  profile: { followers: number; bio: string; nicho: string },
  config: ScoringConfig = DEFAULT_CONFIG
): { score: number; breakdown: ScoreBreakdown } {
  const bio = profile.bio ?? '';
  const followers = scoreFollowers(profile.followers, config.followersWeight);
  const bioKeywords = scoreBio(bio, profile.nicho, config.bioWeight);
  const contactInBio = scoreContact(bio, config.contactWeight);

  const score = followers + bioKeywords + contactInBio;
  return {
    score: Math.min(100, score),
    breakdown: { followers, bioKeywords, contactInBio },
  };
}
