function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeInto(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      target[key] = [...value]
      return
    }

    if (isPlainObject(value)) {
      target[key] = isPlainObject(target[key]) ? { ...target[key] } : {}
      mergeInto(target[key], value)
      return
    }

    target[key] = value
  })

  return target
}

export const DEFAULT_CONFIG = Object.freeze({
  algorithm: {
    version: '1.0.0',
    defaultTopN: 10,
    scorePrecision: 4,
  },
  weights: {
    skills: 0.65,
    fields: 0.2,
    availability: 0.15,
  },
  thresholds: {
    exactMatch: 1,
    relatedSkillMatch: 0.78,
    tokenSkillMatchFloor: 0.35,
    relatedFieldMatch: 0.8,
    tokenFieldMatchFloor: 0.3,
    coreSkillMatch: 0.72,
    minimumAvailabilityOverlapRatio: 0.01,
    strongSignalScore: 0.75,
    mediumSignalScore: 0.45,
  },
  fallbackScores: {
    missingAvailability: 0.5,
    missingFieldPreference: 0.35,
  },
  normalization: {
    stopWords: ['and', 'of', 'for', 'to', 'the', 'with', 'in'],
  },
  skills: {
    optionalSkillWeightFactor: 0.35,
    aliases: {
      ai: 'artificial intelligence',
      ml: 'machine learning',
      nlp: 'natural language processing',
      cv: 'computer vision',
      js: 'javascript',
      py: 'python',
      'data analysis': 'data analytics',
      'particle accelerator design': 'accelerator design',
      geant4: 'geant4',
      pytorch: 'pytorch',
      tensorflow: 'tensorflow',
    },
    related: {
      'artificial intelligence': ['machine learning', 'deep learning', 'data science'],
      'machine learning': ['artificial intelligence', 'deep learning', 'data science'],
      'deep learning': ['machine learning', 'artificial intelligence', 'computer vision'],
      'natural language processing': ['machine learning', 'artificial intelligence'],
      'computer vision': ['deep learning', 'machine learning', 'artificial intelligence'],
      'accelerator design': ['beam physics', 'simulation', 'geant4'],
      simulation: ['geant4', 'matlab', 'data analytics'],
      python: ['data analytics', 'machine learning'],
      javascript: ['react', 'frontend engineering'],
    },
  },
  fields: {
    aliases: {
      ai: 'artificial intelligence',
      ml: 'machine learning',
      'data science': 'data science',
      'accelerator physics': 'accelerator physics',
      'medical physics': 'medical physics',
      'nuclear physics': 'nuclear physics',
      'particle physics': 'particle physics',
    },
    related: {
      'artificial intelligence': ['machine learning', 'data science', 'computer science'],
      'machine learning': ['artificial intelligence', 'data science', 'computer science'],
      'medical physics': ['accelerator physics', 'nuclear engineering', 'particle physics'],
      'accelerator physics': ['medical physics', 'particle physics', 'nuclear engineering'],
      'nuclear physics': ['particle physics', 'accelerator physics', 'nuclear engineering'],
      'particle physics': ['accelerator physics', 'nuclear physics'],
    },
  },
  fairness: {
    forbiddenKeys: [
      'gender',
      'sex',
      'male',
      'female',
      'nationality',
      'country',
      'citizenship',
      'ethnicity',
      'race',
      'name',
      'firstname',
      'lastname',
      'fullname',
      'middleName',
      'middle_name',
    ],
    allowedCandidateKeys: ['id', 'skills', 'preferredFields', 'availability', 'eligibility', 'metadata'],
    allowedOpportunityKeys: [
      'id',
      'title',
      'requiredSkills',
      'optionalSkills',
      'coreSkills',
      'preferredFields',
      'researchAreas',
      'availability',
      'eligibility',
      'metadata',
    ],
    allowedSignals: ['skills', 'preferredFields', 'availability', 'eligibility'],
  },
  explanations: {
    maxHighlights: 3,
  },
})

export function resolveConfig(overrides = {}) {
  const merged = mergeInto(structuredClone(DEFAULT_CONFIG), overrides)
  return merged
}

