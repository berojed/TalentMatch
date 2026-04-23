/**
 * Shared JSDoc contracts for the matching engine.
 * The engine stays in plain JavaScript, but callers still get a stable schema.
 */

/**
 * @typedef {Object} SkillEntry
 * @property {string} name
 * @property {number} [weight]
 */

/**
 * @typedef {Object} AvailabilityWindow
 * @property {string} [availableFrom]
 * @property {string} [availableTo]
 * @property {string} [startDate]
 * @property {string} [endDate]
 */

/**
 * @typedef {Object} EligibilityRecord
 * @property {boolean} [basicEligible]
 * @property {string[]} [flags]
 */

/**
 * @typedef {Object} CandidateRecord
 * @property {string} id
 * @property {(string|SkillEntry)[]} [skills]
 * @property {string[]} [preferredFields]
 * @property {AvailabilityWindow} [availability]
 * @property {EligibilityRecord} [eligibility]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} OpportunityRecord
 * @property {string} id
 * @property {string} [title]
 * @property {(string|SkillEntry)[]} [requiredSkills]
 * @property {(string|SkillEntry)[]} [optionalSkills]
 * @property {string[]} [coreSkills]
 * @property {string[]} [preferredFields]
 * @property {string[]} [researchAreas]
 * @property {AvailabilityWindow} [availability]
 * @property {{requiredFlags?: string[]}} [eligibility]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} ScoreBreakdown
 * @property {number} skills
 * @property {number} fields
 * @property {number} availability
 * @property {Object} weighted
 * @property {number} total
 */

/**
 * @typedef {Object} MatchResult
 * @property {number} rank
 * @property {string} candidateId
 * @property {ScoreBreakdown} breakdown
 * @property {Object} explanation
 * @property {Object} filterSummary
 * @property {Object} candidateSnapshot
 */

export const candidateShape = {
  id: 'candidate-id',
  skills: [{ name: 'python', weight: 1 }],
  preferredFields: ['machine learning'],
  availability: {
    availableFrom: '2026-06-01',
    availableTo: '2026-09-30',
  },
  eligibility: {
    basicEligible: true,
    flags: ['documentsReady'],
  },
  metadata: {
    source: 'supabase',
  },
}

export const opportunityShape = {
  id: 'opportunity-id',
  title: 'AI Research Internship',
  requiredSkills: [{ name: 'python', weight: 1.4 }, { name: 'machine learning', weight: 1.2 }],
  optionalSkills: ['pytorch', 'data analytics'],
  coreSkills: ['python'],
  preferredFields: ['artificial intelligence'],
  researchAreas: ['machine learning'],
  availability: {
    startDate: '2026-06-15',
    endDate: '2026-09-15',
  },
  eligibility: {
    requiredFlags: ['documentsReady'],
  },
}

