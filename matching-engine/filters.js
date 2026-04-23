import { DEFAULT_CONFIG } from './config.js'
import { calculateAvailabilityOverlap, findBestSkillMatch } from './scoring.js'

function hasBasicEligibilityFailure(candidate) {
  return candidate.eligibility && candidate.eligibility.basicEligible === false
}

function hasRequiredFlagFailure(candidate, opportunity) {
  const requiredFlags = opportunity.eligibility?.requiredFlags || []
  if (!requiredFlags.length) {
    return false
  }

  const candidateFlags = new Set(candidate.eligibility?.flags || [])
  return requiredFlags.some((flag) => !candidateFlags.has(flag))
}

function evaluateCoreSkills(candidate, opportunity, config) {
  const coreSkills = opportunity.coreSkills || []
  if (!coreSkills.length) {
    return {
      passed: true,
      missingCoreSkills: [],
    }
  }

  const missingCoreSkills = coreSkills.filter((coreSkill) => {
    const bestMatch = findBestSkillMatch({ name: coreSkill, weight: 1 }, candidate.skills || [], config)
    return bestMatch.score < config.thresholds.coreSkillMatch
  })

  return {
    passed: missingCoreSkills.length === 0,
    missingCoreSkills,
  }
}

export function runHardFilters(candidate, opportunity, config = DEFAULT_CONFIG) {
  const reasons = []
  const availability = calculateAvailabilityOverlap(
    candidate.availability || {},
    opportunity.availability || {},
    config,
  )

  if (availability.isComparable && availability.overlapRatio < config.thresholds.minimumAvailabilityOverlapRatio) {
    reasons.push('No availability overlap with the opportunity window.')
  }

  const coreSkills = evaluateCoreSkills(candidate, opportunity, config)
  if (!coreSkills.passed) {
    reasons.push(`Missing required core skills: ${coreSkills.missingCoreSkills.join(', ')}`)
  }

  if (hasBasicEligibilityFailure(candidate)) {
    reasons.push('Candidate failed the basic eligibility check.')
  }

  if (hasRequiredFlagFailure(candidate, opportunity)) {
    reasons.push('Candidate is missing required administrative eligibility flags.')
  }

  return {
    passed: reasons.length === 0,
    reasons,
    details: {
      availability,
      coreSkills,
    },
  }
}

