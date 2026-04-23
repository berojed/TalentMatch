# TalentMatch Matching Engine

## Purpose

This module ranks candidates for a supervisor opportunity using only allowed, explainable signals:

- skills
- preferred fields / research area fit
- availability overlap
- basic administrative eligibility

The engine is bias-aware by construction. It strips sensitive candidate attributes before filtering or scoring and never uses names, gender, nationality, country, ethnicity, or inferred proxies derived from those fields.

## System Architecture

The engine is split into small, portable JavaScript modules:

- [config.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/config.js): weights, thresholds, aliases, fairness allowlists, and fallback behavior
- [types.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/types.js): JSDoc contracts and example shapes
- [filters.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/filters.js): hard constraints applied before scoring
- [scoring.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/scoring.js): skills, field, and availability scoring
- [fairness.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/fairness.js): sensitive-attribute audit and input sanitization
- [matchingAlgorithm.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/matchingAlgorithm.js): orchestration, ranking, tie-breaking, and explanations
- [exampleUsage.js](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/exampleUsage.js): end-to-end example
- [test-data.json](/Users/bernard/Desktop/TalentMatch/talentmatch/matching-engine/test-data.json): realistic sample payload

## Data Model Design

### Candidate input

```js
{
  id: 'cand-001',
  skills: [{ name: 'python', weight: 1 }],
  preferredFields: ['machine learning'],
  availability: {
    availableFrom: '2026-06-01',
    availableTo: '2026-09-30'
  },
  eligibility: {
    basicEligible: true,
    flags: ['documentsReady']
  }
}
```

### Opportunity input

```js
{
  id: 'opp-101',
  title: 'AI Research Internship',
  requiredSkills: [{ name: 'python', weight: 1.4 }],
  optionalSkills: ['pytorch'],
  coreSkills: ['python'],
  preferredFields: ['artificial intelligence'],
  researchAreas: ['machine learning'],
  availability: {
    startDate: '2026-06-15',
    endDate: '2026-09-15'
  },
  eligibility: {
    requiredFlags: ['documentsReady']
  }
}
```

## Matching Logic

### 1. Hard filters first

Candidates are excluded before scoring if they:

- have no date overlap with the opportunity window
- do not meet the minimum similarity threshold for required core skills
- fail the basic eligibility placeholder or required admin flags

### 2. Weighted scoring

Default weights from `config.js`:

- skills: `0.65`
- fields: `0.20`
- availability: `0.15`

### 3. Skills matching

Skills are the primary ranking signal.

- exact match: canonical skill name matches after alias normalization
- related match: skill families defined in config treat adjacent skills as partial matches
- token match: text overlap handles partial string similarity
- normalized score: weighted average of required skills, plus smaller optional-skill bonus

### 4. Field matching

Field matching compares candidate preferred fields with opportunity preferred fields and research areas.

- exact match: `AI` and `Artificial Intelligence` normalize to the same canonical field
- related match: config supports similarity families such as `AI ~ ML`
- partial token match: used when fields share significant wording

### 5. Availability scoring

Availability is scored by overlap ratio:

`overlap days / opportunity days`

Examples:

- full overlap: `1.0`
- 50% of the window covered: `0.5`
- no overlap: filtered out before scoring

## Fairness & Bias Prevention

The engine reduces bias in four ways:

- sensitive fields are audited and removed before any filter or score is computed
- only allowlisted attributes are passed into matching logic
- explanations reference only allowed signals
- rankings are traceable through numeric sub-scores instead of opaque heuristics

Sensitive keys currently blocked include:

- `gender`, `sex`
- `nationality`, `country`, `citizenship`
- `ethnicity`, `race`
- `name`, `firstName`, `lastName`, `fullName`

## Explainability Layer

Each ranked result includes:

- `breakdown.total`
- `breakdown.skills`
- `breakdown.fields`
- `breakdown.availability`
- `filterSummary`
- `explanation.summary`
- `explanation.strengths`
- `explanation.cautions`
- `candidateSnapshot.removedSensitiveAttributes`

This makes the result directly usable in moderation workflows or UI drill-downs.

## Supabase Integration

The module is plain JavaScript and can run:

- in the frontend after Supabase queries
- inside a Supabase Edge Function
- in a shared utility layer

### Frontend example

```js
import { matchCandidatesToOpportunity } from './matching-engine/matchingAlgorithm.js'

const { data: opportunity } = await supabase
  .from('opportunities')
  .select('*')
  .eq('id', opportunityId)
  .single()

const { data: candidates } = await supabase
  .from('candidate_profiles')
  .select('*')

const result = matchCandidatesToOpportunity({
  candidates,
  opportunity,
})
```

### Edge Function example

```js
import { matchSupabaseRows } from '../matching-engine/matchingAlgorithm.js'

const ranking = matchSupabaseRows(candidateRows, opportunityRow)
return new Response(JSON.stringify(ranking), {
  headers: { 'Content-Type': 'application/json' }
})
```

## Example End-to-End Flow

1. Supabase fetches one opportunity and a set of candidate records.
2. `sanitizeCandidate` removes disallowed or sensitive attributes.
3. `runHardFilters` excludes impossible matches.
4. `scoreCandidate` computes normalized sub-scores.
5. `matchingAlgorithm.js` ranks candidates and generates explanations.
6. UI or supervisor workflow shows ranked candidates plus rationale.

## Running the example

```bash
node matching-engine/exampleUsage.js
```

## Future Improvements

- replace static related-skill dictionaries with curated taxonomy tables from Supabase
- add calibrated feedback loops from supervisor outcomes
- include confidence scoring for sparse profiles
- support reverse matching: recommend supervisors/opportunities to candidates
- add audit logs to persist why a candidate was ranked or filtered

## Limitations

- bias can still enter through proxy data inside skills, fields, or eligibility rules if those inputs are biased upstream
- static similarity dictionaries require maintenance and domain calibration
- missing or low-quality candidate data can reduce ranking quality even when fairness protections are in place

