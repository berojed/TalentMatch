import testData from './test-data.json' with { type: 'json' }
import { matchCandidatesToOpportunity } from './matchingAlgorithm.js'

export function runExample() {
  const result = matchCandidatesToOpportunity({
    candidates: testData.candidates,
    opportunity: testData.opportunity,
    configOverrides: {
      algorithm: {
        defaultTopN: 5,
      },
    },
  })

  return result
}

const result = runExample()

console.log('Top ranked candidates for opportunity:', result.opportunityTitle)
console.log(
  JSON.stringify(
    {
      summary: result.summary,
      rankedCandidates: result.rankedCandidates.map((candidate) => ({
        rank: candidate.rank,
        candidateId: candidate.candidateId,
        totalScore: candidate.breakdown.total,
        breakdown: candidate.breakdown,
        explanation: candidate.explanation.summary,
      })),
      excludedCandidates: result.excludedCandidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        reasons: candidate.filterSummary.reasons,
      })),
    },
    null,
    2,
  ),
)

