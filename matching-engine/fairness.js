import { DEFAULT_CONFIG } from './config.js'

function normalizeKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function pickKeys(source, allowedKeys) {
  return allowedKeys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source || {}, key)) {
      result[key] = source[key]
    }
    return result
  }, {})
}

function createSkillEntry(skill) {
  if (typeof skill === 'string') {
    return { name: skill, weight: 1 }
  }

  if (skill && typeof skill === 'object') {
    return {
      name: String(skill.name || '').trim(),
      weight: Number.isFinite(skill.weight) ? skill.weight : 1,
    }
  }

  return { name: '', weight: 1 }
}

function collectForbiddenPaths(value, path, forbiddenKeys, collected) {
  if (!value || typeof value !== 'object') {
    return collected
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenPaths(item, `${path}[${index}]`, forbiddenKeys, collected))
    return collected
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    const nextPath = path ? `${path}.${key}` : key
    if (forbiddenKeys.has(normalizeKey(key))) {
      collected.push(nextPath)
    }
    collectForbiddenPaths(nestedValue, nextPath, forbiddenKeys, collected)
  })

  return collected
}

function sanitizeAvailability(availability) {
  if (!availability || typeof availability !== 'object') {
    return {}
  }

  return {
    availableFrom: availability.availableFrom || availability.startDate || null,
    availableTo: availability.availableTo || availability.endDate || null,
  }
}

function sanitizeEligibility(eligibility) {
  if (!eligibility || typeof eligibility !== 'object') {
    return {}
  }

  return {
    basicEligible: eligibility.basicEligible,
    flags: asArray(eligibility.flags).map(String),
    requiredFlags: asArray(eligibility.requiredFlags).map(String),
  }
}

export function auditSensitiveAttributes(record, config = DEFAULT_CONFIG) {
  const forbiddenKeys = new Set(config.fairness.forbiddenKeys.map(normalizeKey))
  return collectForbiddenPaths(record, '', forbiddenKeys, [])
}

export function sanitizeCandidate(candidate, config = DEFAULT_CONFIG) {
  const sanitized = pickKeys(candidate || {}, config.fairness.allowedCandidateKeys)
  const removedSensitiveAttributes = auditSensitiveAttributes(candidate, config)

  return {
    sanitizedCandidate: {
      id: String(sanitized.id || ''),
      skills: asArray(sanitized.skills).map(createSkillEntry).filter((skill) => skill.name),
      preferredFields: asArray(sanitized.preferredFields).map(String).filter(Boolean),
      availability: sanitizeAvailability(sanitized.availability),
      eligibility: sanitizeEligibility(sanitized.eligibility),
      metadata: sanitized.metadata || {},
    },
    removedSensitiveAttributes,
  }
}

export function sanitizeOpportunity(opportunity, config = DEFAULT_CONFIG) {
  const sanitized = pickKeys(opportunity || {}, config.fairness.allowedOpportunityKeys)

  return {
    id: String(sanitized.id || ''),
    title: sanitized.title || '',
    requiredSkills: asArray(sanitized.requiredSkills).map(createSkillEntry).filter((skill) => skill.name),
    optionalSkills: asArray(sanitized.optionalSkills).map(createSkillEntry).filter((skill) => skill.name),
    coreSkills: asArray(sanitized.coreSkills).map(String).filter(Boolean),
    preferredFields: asArray(sanitized.preferredFields).map(String).filter(Boolean),
    researchAreas: asArray(sanitized.researchAreas).map(String).filter(Boolean),
    availability: sanitizeAvailability(sanitized.availability),
    eligibility: sanitizeEligibility(sanitized.eligibility),
    metadata: sanitized.metadata || {},
  }
}

export function createCandidateSnapshot(candidate, removedSensitiveAttributes, config = DEFAULT_CONFIG) {
  return {
    id: candidate.id,
    allowedSignalsUsed: [...config.fairness.allowedSignals],
    removedSensitiveAttributes,
    skillCount: candidate.skills.length,
    preferredFields: [...candidate.preferredFields],
    availability: { ...candidate.availability },
    eligibility: { ...candidate.eligibility },
  }
}

