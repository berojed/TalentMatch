import { DEFAULT_CONFIG } from './config.js'

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

function round(value, precision) {
  return Number(value.toFixed(precision))
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

function canonicalize(value, aliasMap) {
  const normalized = normalizeText(value)
  return aliasMap[normalized] || normalized
}

function tokenize(value, stopWords) {
  return canonicalize(value, {})
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && !stopWords.includes(token))
}

function getTokenSimilarity(left, right, stopWords) {
  const leftTokens = new Set(tokenize(left, stopWords))
  const rightTokens = new Set(tokenize(right, stopWords))

  if (!leftTokens.size || !rightTokens.size) {
    return 0
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size
  return union ? intersection / union : 0
}

function isRelatedTerm(left, right, relatedMap) {
  const leftRelated = relatedMap[left] || []
  const rightRelated = relatedMap[right] || []
  return leftRelated.includes(right) || rightRelated.includes(left)
}

function selectThreshold(groupName, config) {
  return groupName === 'fields'
    ? config.thresholds.tokenFieldMatchFloor
    : config.thresholds.tokenSkillMatchFloor
}

function selectRelatedScore(groupName, config) {
  return groupName === 'fields'
    ? config.thresholds.relatedFieldMatch
    : config.thresholds.relatedSkillMatch
}

function buildGroupMatch(sourceTerm, candidateTerm, groupName, config) {
  const configSection = config[groupName]
  const left = canonicalize(sourceTerm, configSection.aliases)
  const right = canonicalize(candidateTerm, configSection.aliases)

  if (!left || !right) {
    return { score: 0, matchType: 'none', canonicalTarget: left, canonicalCandidate: right }
  }

  if (left === right) {
    return {
      score: config.thresholds.exactMatch,
      matchType: 'exact',
      canonicalTarget: left,
      canonicalCandidate: right,
    }
  }

  if (isRelatedTerm(left, right, configSection.related)) {
    return {
      score: selectRelatedScore(groupName, config),
      matchType: 'related',
      canonicalTarget: left,
      canonicalCandidate: right,
    }
  }

  const tokenSimilarity = getTokenSimilarity(left, right, config.normalization.stopWords)
  return {
    score: tokenSimilarity >= selectThreshold(groupName, config) ? tokenSimilarity : 0,
    matchType: tokenSimilarity >= selectThreshold(groupName, config) ? 'partial' : 'none',
    canonicalTarget: left,
    canonicalCandidate: right,
  }
}

export function findBestSkillMatch(targetSkill, candidateSkills, config = DEFAULT_CONFIG) {
  const targetName = typeof targetSkill === 'string' ? targetSkill : targetSkill.name
  const initial = {
    score: 0,
    matchType: 'none',
    targetSkill: targetName,
    matchedSkill: null,
  }

  return candidateSkills.reduce((bestMatch, candidateSkill) => {
    const candidateName = typeof candidateSkill === 'string' ? candidateSkill : candidateSkill.name
    const descriptor = buildGroupMatch(targetName, candidateName, 'skills', config)

    if (descriptor.score > bestMatch.score) {
      return {
        score: descriptor.score,
        matchType: descriptor.matchType,
        targetSkill: targetName,
        matchedSkill: candidateName,
      }
    }

    return bestMatch
  }, initial)
}

export function scoreSkills(candidateSkills, opportunity, config = DEFAULT_CONFIG) {
  const requiredSkills = opportunity.requiredSkills || []
  const optionalSkills = opportunity.optionalSkills || []

  const requiredMatches = requiredSkills.map((skill) => {
    const bestMatch = findBestSkillMatch(skill, candidateSkills, config)
    return {
      ...bestMatch,
      weight: Number.isFinite(skill.weight) ? skill.weight : 1,
    }
  })

  const optionalMatches = optionalSkills.map((skill) => {
    const bestMatch = findBestSkillMatch(skill, candidateSkills, config)
    return {
      ...bestMatch,
      weight: Number.isFinite(skill.weight) ? skill.weight : 1,
    }
  })

  const requiredWeightTotal = requiredMatches.reduce((sum, match) => sum + match.weight, 0)
  const optionalWeightTotal = optionalMatches.reduce((sum, match) => sum + match.weight, 0)

  const requiredScore = requiredWeightTotal
    ? requiredMatches.reduce((sum, match) => sum + match.score * match.weight, 0) / requiredWeightTotal
    : 0

  const optionalScore = optionalWeightTotal
    ? optionalMatches.reduce((sum, match) => sum + match.score * match.weight, 0) / optionalWeightTotal
    : 0

  let normalizedScore = 0
  if (requiredMatches.length && optionalMatches.length) {
    normalizedScore = clamp(
      requiredScore + optionalScore * config.skills.optionalSkillWeightFactor,
      0,
      1,
    )
  } else if (requiredMatches.length) {
    normalizedScore = clamp(requiredScore, 0, 1)
  } else if (optionalMatches.length) {
    normalizedScore = clamp(optionalScore, 0, 1)
  }

  return {
    score: normalizedScore,
    exactMatches: requiredMatches.filter((match) => match.matchType === 'exact').length,
    partialMatches: requiredMatches.filter((match) => match.matchType !== 'exact' && match.matchType !== 'none').length,
    missingRequiredSkills: requiredMatches
      .filter((match) => match.matchType === 'none')
      .map((match) => match.targetSkill),
    requiredMatches,
    optionalMatches,
  }
}

export function scoreFields(candidateFields, opportunityFields, config = DEFAULT_CONFIG) {
  if (!opportunityFields.length) {
    return {
      score: config.fallbackScores.missingFieldPreference,
      matchedFields: [],
      unmatchedFields: [],
    }
  }

  if (!candidateFields.length) {
    return {
      score: 0,
      matchedFields: [],
      unmatchedFields: [...opportunityFields],
    }
  }

  const matchedFields = opportunityFields.map((field) => {
    const bestMatch = candidateFields.reduce(
      (best, candidateField) => {
        const descriptor = buildGroupMatch(field, candidateField, 'fields', config)
        if (descriptor.score > best.score) {
          return {
            score: descriptor.score,
            matchType: descriptor.matchType,
            opportunityField: field,
            candidateField,
          }
        }
        return best
      },
      {
        score: 0,
        matchType: 'none',
        opportunityField: field,
        candidateField: null,
      },
    )

    return bestMatch
  })

  const totalScore = matchedFields.reduce((sum, match) => sum + match.score, 0)
  return {
    score: clamp(totalScore / matchedFields.length, 0, 1),
    matchedFields: matchedFields.filter((match) => match.score > 0),
    unmatchedFields: matchedFields.filter((match) => match.score === 0).map((match) => match.opportunityField),
  }
}

function toDate(value) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getDayDifferenceInclusive(start, end) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1
}

export function calculateAvailabilityOverlap(candidateAvailability, opportunityAvailability, config = DEFAULT_CONFIG) {
  const candidateStart = toDate(candidateAvailability.availableFrom || candidateAvailability.startDate)
  const candidateEnd = toDate(candidateAvailability.availableTo || candidateAvailability.endDate)
  const opportunityStart = toDate(opportunityAvailability.availableFrom || opportunityAvailability.startDate)
  const opportunityEnd = toDate(opportunityAvailability.availableTo || opportunityAvailability.endDate)

  if (!candidateStart || !candidateEnd || !opportunityStart || !opportunityEnd) {
    return {
      isComparable: false,
      overlapDays: null,
      opportunityDays: null,
      overlapRatio: config.fallbackScores.missingAvailability,
    }
  }

  const overlapStart = new Date(Math.max(candidateStart.getTime(), opportunityStart.getTime()))
  const overlapEnd = new Date(Math.min(candidateEnd.getTime(), opportunityEnd.getTime()))

  if (overlapEnd < overlapStart) {
    return {
      isComparable: true,
      overlapDays: 0,
      opportunityDays: getDayDifferenceInclusive(opportunityStart, opportunityEnd),
      overlapRatio: 0,
    }
  }

  const overlapDays = getDayDifferenceInclusive(overlapStart, overlapEnd)
  const opportunityDays = getDayDifferenceInclusive(opportunityStart, opportunityEnd)

  return {
    isComparable: true,
    overlapDays,
    opportunityDays,
    overlapRatio: clamp(overlapDays / opportunityDays, 0, 1),
  }
}

export function scoreAvailability(candidateAvailability, opportunityAvailability, config = DEFAULT_CONFIG) {
  const overlap = calculateAvailabilityOverlap(candidateAvailability, opportunityAvailability, config)
  return {
    score: overlap.overlapRatio,
    ...overlap,
  }
}

export function scoreCandidate(candidate, opportunity, config = DEFAULT_CONFIG) {
  const opportunityFields = [
    ...(opportunity.preferredFields || []),
    ...(opportunity.researchAreas || []),
  ]
  const uniqueOpportunityFields = [...new Set(opportunityFields)]

  const skillScore = scoreSkills(candidate.skills || [], opportunity, config)
  const fieldScore = scoreFields(candidate.preferredFields || [], uniqueOpportunityFields, config)
  const availabilityScore = scoreAvailability(candidate.availability || {}, opportunity.availability || {}, config)

  const weighted = {
    skills: skillScore.score * config.weights.skills,
    fields: fieldScore.score * config.weights.fields,
    availability: availabilityScore.score * config.weights.availability,
  }

  const totalScore = clamp(weighted.skills + weighted.fields + weighted.availability, 0, 1)
  const precision = config.algorithm.scorePrecision

  return {
    totalScore: round(totalScore, precision),
    breakdown: {
      skills: round(skillScore.score, precision),
      fields: round(fieldScore.score, precision),
      availability: round(availabilityScore.score, precision),
      weighted: {
        skills: round(weighted.skills, precision),
        fields: round(weighted.fields, precision),
        availability: round(weighted.availability, precision),
      },
      total: round(totalScore, precision),
    },
    details: {
      skills: skillScore,
      fields: fieldScore,
      availability: availabilityScore,
    },
  }
}
