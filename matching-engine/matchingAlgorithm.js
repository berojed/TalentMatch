import { resolveConfig } from './config.js'
import { runHardFilters } from './filters.js'
import {
  createCandidateSnapshot,
  sanitizeCandidate,
  sanitizeOpportunity,
} from './fairness.js'
import { scoreCandidate } from './scoring.js'

function buildExplanation(candidate, opportunity, filterSummary, scoring, removedSensitiveAttributes, config) {
  const strengths = []
  const cautions = []
  const skillDetails = scoring.details.skills
  const fieldDetails = scoring.details.fields
  const availabilityDetails = scoring.details.availability

  if (scoring.breakdown.skills >= config.thresholds.strongSignalScore) {
    strengths.push(
      `Strong skills alignment with ${skillDetails.exactMatches} exact and ${skillDetails.partialMatches} partial required-skill matches.`,
    )
  } else if (scoring.breakdown.skills >= config.thresholds.mediumSignalScore) {
    strengths.push(
      `Moderate skills alignment with ${skillDetails.exactMatches} exact required-skill matches and some partial overlap.`,
    )
  } else {
    cautions.push('Skills alignment is below the preferred threshold for this opportunity.')
  }

  if (scoring.breakdown.fields >= config.thresholds.strongSignalScore) {
    strengths.push('Preferred research fields align strongly with the opportunity focus.')
  } else if (scoring.breakdown.fields >= config.thresholds.mediumSignalScore) {
    strengths.push('Preferred fields show partial similarity to the opportunity focus.')
  } else if (fieldDetails.unmatchedFields.length) {
    cautions.push(`Field alignment is limited for: ${fieldDetails.unmatchedFields.join(', ')}.`)
  }

  if (availabilityDetails.isComparable) {
    if (scoring.breakdown.availability >= config.thresholds.strongSignalScore) {
      strengths.push(
        `Availability covers ${Math.round(availabilityDetails.overlapRatio * 100)}% of the required time window.`,
      )
    } else if (scoring.breakdown.availability >= config.thresholds.mediumSignalScore) {
      strengths.push(
        `Availability overlaps ${Math.round(availabilityDetails.overlapRatio * 100)}% of the opportunity window.`,
      )
    } else {
      cautions.push('Availability overlap is limited, even though it passed the minimum filter.')
    }
  } else {
    cautions.push('Availability score used the configured fallback because one or more dates were missing.')
  }

  if (skillDetails.missingRequiredSkills.length) {
    cautions.push(`Some required skills were not matched strongly: ${skillDetails.missingRequiredSkills.join(', ')}.`)
  }

  const summaryParts = [...strengths, ...cautions].slice(0, config.explanations.maxHighlights)

  return {
    summary: summaryParts.join(' '),
    strengths,
    cautions,
    filterStatus: filterSummary.passed ? 'passed' : 'excluded',
    allowedSignalsUsed: [...config.fairness.allowedSignals],
    removedSensitiveAttributes,
    opportunityId: opportunity.id,
    candidateId: candidate.id,
  }
}

function sortRankedCandidates(left, right) {
  if (right.breakdown.total !== left.breakdown.total) {
    return right.breakdown.total - left.breakdown.total
  }

  if (right.breakdown.skills !== left.breakdown.skills) {
    return right.breakdown.skills - left.breakdown.skills
  }

  if (right.breakdown.fields !== left.breakdown.fields) {
    return right.breakdown.fields - left.breakdown.fields
  }

  if (right.breakdown.availability !== left.breakdown.availability) {
    return right.breakdown.availability - left.breakdown.availability
  }

  return String(left.candidateId).localeCompare(String(right.candidateId))
}

export function matchSingleCandidateToOpportunity(candidate, opportunity, configOverrides = {}) {
  const config = resolveConfig(configOverrides)
  const sanitizedOpportunity = sanitizeOpportunity(opportunity, config)
  const { sanitizedCandidate, removedSensitiveAttributes } = sanitizeCandidate(candidate, config)
  const filterSummary = runHardFilters(sanitizedCandidate, sanitizedOpportunity, config)

  if (!filterSummary.passed) {
    return {
      included: false,
      candidateId: sanitizedCandidate.id,
      filterSummary,
      explanation: {
        summary: filterSummary.reasons.join(' '),
        strengths: [],
        cautions: [...filterSummary.reasons],
        filterStatus: 'excluded',
        allowedSignalsUsed: [...config.fairness.allowedSignals],
        removedSensitiveAttributes,
      },
      candidateSnapshot: createCandidateSnapshot(
        sanitizedCandidate,
        removedSensitiveAttributes,
        config,
      ),
    }
  }

  const scoring = scoreCandidate(sanitizedCandidate, sanitizedOpportunity, config)
  return {
    included: true,
    candidateId: sanitizedCandidate.id,
    breakdown: scoring.breakdown,
    rawScore: scoring.totalScore,
    filterSummary,
    explanation: buildExplanation(
      sanitizedCandidate,
      sanitizedOpportunity,
      filterSummary,
      scoring,
      removedSensitiveAttributes,
      config,
    ),
    details: scoring.details,
    candidateSnapshot: createCandidateSnapshot(
      sanitizedCandidate,
      removedSensitiveAttributes,
      config,
    ),
  }
}

export function matchCandidatesToOpportunity({
  candidates = [],
  opportunity,
  configOverrides = {},
  limit,
} = {}) {
  const config = resolveConfig(configOverrides)
  const sanitizedOpportunity = sanitizeOpportunity(opportunity, config)

  const includedResults = []
  const excludedCandidates = []

  candidates.forEach((candidate) => {
    const result = matchSingleCandidateToOpportunity(candidate, sanitizedOpportunity, config)

    if (!result.included) {
      excludedCandidates.push({
        candidateId: result.candidateId,
        filterSummary: result.filterSummary,
        explanation: result.explanation,
        candidateSnapshot: result.candidateSnapshot,
      })
      return
    }

    includedResults.push({
      candidateId: result.candidateId,
      breakdown: result.breakdown,
      explanation: result.explanation,
      filterSummary: result.filterSummary,
      candidateSnapshot: result.candidateSnapshot,
      details: result.details,
    })
  })

  const rankedCandidates = includedResults
    .sort(sortRankedCandidates)
    .map((result, index) => ({
      rank: index + 1,
      ...result,
    }))
    .slice(0, limit || config.algorithm.defaultTopN)

  return {
    algorithmVersion: config.algorithm.version,
    generatedAt: new Date().toISOString(),
    opportunityId: sanitizedOpportunity.id,
    opportunityTitle: sanitizedOpportunity.title,
    rankedCandidates,
    excludedCandidates,
    summary: {
      evaluatedCandidates: candidates.length,
      rankedCount: rankedCandidates.length,
      excludedCount: excludedCandidates.length,
    },
  }
}

export function matchSupabaseRows(candidateRows, opportunityRow, configOverrides = {}) {
  return matchCandidatesToOpportunity({
    candidates: candidateRows,
    opportunity: opportunityRow,
    configOverrides,
  })
}
