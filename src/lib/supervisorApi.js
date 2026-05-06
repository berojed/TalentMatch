import { supabase } from './supabase'

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Central resolver for supervisor identity.
 *
 * All supervisor-side queries depend on a single UUID that appears as:
 *   - auth.users.id
 *   - public.users.user_id
 *   - supervisors.user_id
 *   - projects.supervisor_id
 *
 * This function resolves the canonical key once and returns the supervisor
 * row alongside it, so callers never guess which column to filter on.
 */
async function resolveSupervisorContext() {
  const authUser = await getCurrentUser()
  if (!authUser) throw new Error('Not authenticated')

  const { data: supervisorRow } = await supabase
    .from('supervisors')
    .select(
      'user_id, first_name, last_name, academic_title, institution, department, is_verified, lab_name, research_areas, years_experience, short_bio, past_projects, key_achievements, current_project_info, applicant_expectations',
    )
    .eq('user_id', authUser.id)
    .maybeSingle()

  return {
    authUser,
    supervisorRow,
    // Canonical key for all ownership filters:
    // .eq('user_id', key)  on supervisors
    // .eq('supervisor_id', key)  on projects
    supervisorKey: authUser.id,
  }
}

// Normalize a supervisor row into UI-friendly shape with safe defaults.
export function normalizeSupervisorRow(row) {
  if (!row) return null
  return {
    ...row,
    lab_name: row.lab_name || '',
    research_areas: Array.isArray(row.research_areas) ? row.research_areas : [],
    years_experience: row.years_experience ?? '',
    short_bio: row.short_bio || '',
    past_projects: row.past_projects || '',
    key_achievements: row.key_achievements || '',
    current_project_info: row.current_project_info || '',
    applicant_expectations: row.applicant_expectations || '',
  }
}

// Parse the deterministic block format used by applicants.experience / applicants.projects.
function parseApplicantBlocks(text, keys, labels) {
  if (!text || typeof text !== 'string') return []
  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const row = Object.fromEntries(keys.map((k) => [k, '']))
      for (const line of block.split('\n')) {
        for (const key of keys) {
          const prefix = `${labels[key]}:`
          if (line.startsWith(prefix)) {
            row[key] = line.slice(prefix.length).trim()
            break
          }
        }
      }
      return row
    })
    .filter((row) => keys.some((k) => row[k]))
}

const APPLICANT_EXPERIENCE_KEYS = ['role', 'organization', 'duration', 'description']
const APPLICANT_EXPERIENCE_LABELS = {
  role: 'Role',
  organization: 'Organization',
  duration: 'Duration',
  description: 'Description',
}
const APPLICANT_PROJECT_KEYS = ['title', 'description', 'methods_technologies']
const APPLICANT_PROJECT_LABELS = {
  title: 'Title',
  description: 'Description',
  methods_technologies: 'Methods/Technologies',
}

// Compact summary derived from explicit applicant columns, for supervisor-facing surfaces.
// Keeps the same shape consumed by ApplicationReview.jsx and SupervisorApplications.jsx.
export function buildApplicantSummary(applicantRow) {
  const row = applicantRow || {}
  const experience = parseApplicantBlocks(
    row.experience,
    APPLICANT_EXPERIENCE_KEYS,
    APPLICANT_EXPERIENCE_LABELS,
  )
  const projects = parseApplicantBlocks(
    row.projects,
    APPLICANT_PROJECT_KEYS,
    APPLICANT_PROJECT_LABELS,
  )
  const skills = Array.isArray(row.skills) ? row.skills.filter(Boolean) : []
  const awards = row.awards
    ? String(row.awards)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  return {
    academic: {
      field_of_study: row.field_of_study || '',
      graduation_year:
        row.graduation_year != null && row.graduation_year !== ''
          ? String(row.graduation_year)
          : '',
    },
    experience_top: experience.slice(0, 3),
    projects_top: projects.slice(0, 3),
    skills,
    awards,
    notes: row.additional_notes || '',
  }
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase()
  if (!value) return 'SUBMITTED'
  if (value === 'IN_REVIEW') return 'UNDER_REVIEW'
  return value
}

function getApplicationId(application) {
  return application.application_id || application.id || ''
}

function getApplicantId(application) {
  return application.student_id || application.applicant_id || null
}

async function fetchUserEmailMap(applicantIds) {
  if (!applicantIds.length) return {}

  // First try direct read (works when user can see the rows via RLS)
  const { data: byUserId, error: byUserIdError } = await supabase
    .from('users')
    .select('user_id, email')
    .in('user_id', applicantIds)

  let usersData = !byUserIdError ? byUserId || [] : []

  // If direct read returned no rows (RLS blocked), use the supervisor RPC
  // which runs as SECURITY DEFINER and checks supervisor ownership
  if (usersData.length === 0 && applicantIds.length > 0) {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_applicant_emails_for_supervisor', { applicant_ids: applicantIds })
    if (!rpcError && rpcData) {
      usersData = rpcData
    }
  }

  const emailMap = {}
  ;(usersData || []).forEach((row) => {
    const key = row.user_id || row.id
    if (key) emailMap[key] = row.email || ''
  })
  return emailMap
}

async function fetchApplicantsMap(applicantIds) {
  if (!applicantIds.length) return {}

  const { data: normalizedApplicants, error: normalizedError } = await supabase
    .from('applicants')
    .select(
      'user_id, first_name, last_name, degree_level_id, institution, field_of_study, graduation_year, experience, projects, skills, awards, additional_notes',
    )
    .in('user_id', applicantIds)

  if (!normalizedError) {
    const map = {}
    ;(normalizedApplicants || []).forEach((applicant) => {
      map[applicant.user_id] = {
        first_name: applicant.first_name || '',
        last_name: applicant.last_name || '',
        degree_level_id: applicant.degree_level_id ?? null,
        institution: applicant.institution || '',
        profile_summary: buildApplicantSummary(applicant),
      }
    })
    return map
  }

  return {}
}

async function fetchEducationMap() {
  const { data: eduLevels, error } = await supabase
    .from('education_levels')
    .select('education_level_id, label')

  if (error) return {}

  const eduMap = {}
  ;(eduLevels || []).forEach((e) => {
    eduMap[e.education_level_id] = e.label
  })
  return eduMap
}

async function enrichApplications(rawApplications) {
  const applications = rawApplications || []
  if (!applications.length) return []

  const applicantIds = [
    ...new Set(
      applications
        .map(getApplicantId)
        .filter(Boolean),
    ),
  ]

  const [emailMap, applicantsMap, eduMap] = await Promise.all([
    fetchUserEmailMap(applicantIds),
    fetchApplicantsMap(applicantIds),
    fetchEducationMap(),
  ])

  return applications.map((app) => {
    const applicantId = getApplicantId(app)
    const applicant = applicantId ? applicantsMap[applicantId] : null
    const degreeLabel = applicant?.degree_level_id
      ? eduMap[applicant.degree_level_id] || ''
      : ''

    return {
      ...app,
      application_id: getApplicationId(app),
      status: normalizeStatus(app.status),
      student_id: app.student_id || app.applicant_id || null,
      applicants: applicant
        ? {
            first_name: applicant.first_name || '',
            last_name: applicant.last_name || '',
            degree_level_id: applicant.degree_level_id ?? null,
            institution: applicant.institution || '',
            profile_summary: applicant.profile_summary || buildApplicantSummary(null),
          }
        : null,
      applicant_email: applicantId ? emailMap[applicantId] || '' : '',
      degree_label: degreeLabel,
    }
  })
}

async function fetchSupervisorApplicationsByProjectIds(projectIds, { favoritedOnly = false } = {}) {
  if (!projectIds.length) return []

  let query = supabase
    .from('applications')
    .select(`
      *,
      projects ( title, department, location, duration_text, duration_weeks )
    `)
    .in('project_id', projectIds)
    .order('submitted_at', { ascending: false })

  if (favoritedOnly) {
    query = query.eq('is_favorited', true)
  }

  const { data, error } = await query

  if (error) throw error

  return enrichApplications(data || [])
}

// ─── Dashboard ────────────────────────────────────────────
export async function getSupervisorDashboardData() {
  const { authUser, supervisorRow, supervisorKey } = await resolveSupervisorContext()

  const { data: projects } = await supabase
    .from('projects')
    .select('project_id')
    .eq('supervisor_id', supervisorKey)

  const projectIds = (projects || []).map((p) => p.project_id)

  const enrichedApplications = await fetchSupervisorApplicationsByProjectIds(projectIds)

  const newApplications = enrichedApplications.filter(
    (a) => a.status === 'SUBMITTED',
  ).length
  const underReview = enrichedApplications.filter(
    (a) => a.status === 'UNDER_REVIEW',
  ).length
  const accepted = enrichedApplications.filter(
    (a) => a.status === 'ACCEPTED',
  ).length
  const shortlisted = enrichedApplications.filter(
    (a) => a.status === 'SHORTLISTED' || a.status === 'ACCEPTED',
  ).length
  const totalApplications = enrichedApplications.length

  return {
    profile: supervisorRow || { first_name: authUser.email?.split('@')[0] || 'User', last_name: '' },
    stats: { newApplications, underReview, accepted, shortlisted, totalApplications },
    recentApplications: enrichedApplications.slice(0, 10),
  }
}

// ─── Projects ─────────────────────────────────────────────
export async function getSupervisorProjects(search = '') {
  const { supervisorKey } = await resolveSupervisorContext()

  let query = supabase
    .from('projects')
    .select(`
      *,
      education_levels ( label ),
      project_fields ( field_id, fields_of_research ( field_name ) )
    `)
    .eq('supervisor_id', supervisorKey)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,department.ilike.%${search}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error

  // Get application counts for each project
  const projectIds = (data || []).map((p) => p.project_id)
  let appCounts = {}

  if (projectIds.length > 0) {
    const { data: appData } = await supabase
      .from('applications')
      .select('project_id')
      .in('project_id', projectIds)

    if (appData) {
      appData.forEach((a) => {
        appCounts[a.project_id] = (appCounts[a.project_id] || 0) + 1
      })
    }
  }

  const projects = (data || []).map((p) => ({
    ...p,
    education_label: p.education_levels?.label || '',
    research_areas: (p.project_fields || [])
      .map((pf) => pf.fields_of_research?.field_name)
      .filter(Boolean),
    applicant_count: appCounts[p.project_id] || 0,
  }))

  return projects
}

export async function createProject(projectData) {
  const { supervisorKey } = await resolveSupervisorContext()

  const { researchAreas, ...rest } = projectData

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...rest,
      supervisor_id: supervisorKey,
      status: 'OPEN',
    })
    .select()
    .single()

  if (error) throw error

  // Handle research area tags via project_fields
  if (researchAreas && researchAreas.length > 0) {
    await syncProjectFields(data.project_id, researchAreas)
  }

  return data
}

export async function updateProject(projectId, projectData) {
  const { researchAreas, ...rest } = projectData

  // Remove join-only fields before updating
  delete rest.education_levels
  delete rest.project_fields
  delete rest.education_label
  delete rest.research_areas
  delete rest.applicant_count

  const { data, error } = await supabase
    .from('projects')
    .update(rest)
    .eq('project_id', projectId)
    .select()
    .single()

  if (error) throw error

  if (researchAreas !== undefined) {
    await syncProjectFields(projectId, researchAreas)
  }

  return data
}

export async function deleteProject(projectId) {
  // Delete project_fields first
  await supabase.from('project_fields').delete().eq('project_id', projectId)

  // Delete applications
  await supabase.from('applications').delete().eq('project_id', projectId)

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('project_id', projectId)

  if (error) throw error
  return true
}

async function syncProjectFields(projectId, fieldNames) {
  // Delete existing
  await supabase.from('project_fields').delete().eq('project_id', projectId)

  if (!fieldNames || fieldNames.length === 0) return

  // Ensure all field names exist in fields_of_research
  for (const name of fieldNames) {
    await supabase
      .from('fields_of_research')
      .upsert({ field_name: name }, { onConflict: 'field_name' })
  }

  // Get field ids
  const { data: fields } = await supabase
    .from('fields_of_research')
    .select('field_id, field_name')
    .in('field_name', fieldNames)

  if (fields && fields.length > 0) {
    const rows = fields.map((f) => ({
      project_id: projectId,
      field_id: f.field_id,
    }))
    await supabase.from('project_fields').insert(rows)
  }
}

// ─── Applications for a supervisor ─────────────────────────
export async function getSupervisorApplications(projectId = null, { favoritedOnly = false } = {}) {
  const { supervisorKey } = await resolveSupervisorContext()

  // Get supervisor's project ids
  let projectIds = []
  if (projectId) {
    projectIds = [projectId]
  } else {
    const { data: projects } = await supabase
      .from('projects')
      .select('project_id')
      .eq('supervisor_id', supervisorKey)
    projectIds = (projects || []).map((p) => p.project_id)
  }

  if (projectIds.length === 0) return []

  return fetchSupervisorApplicationsByProjectIds(projectIds, { favoritedOnly })
}

export async function toggleApplicationFavorite(applicationId, nextValue) {
  const { error } = await supabase
    .from('applications')
    .update({ is_favorited: nextValue })
    .eq('application_id', applicationId)
  if (error) throw error
}

export async function updateApplicationStatus(applicationId, status) {
  const payload = { status, updated_at: new Date().toISOString() }
  const { data, error } = await supabase
    .from('applications')
    .update(payload)
    .eq('application_id', applicationId)
    .select()
    .single()

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('applications')
      .update(payload)
      .eq('id', applicationId)
      .select()
      .single()
    if (fallbackError) throw error
    return fallbackData
  }
  return data
}

// ─── Single project detail ─────────────────────────────────
export async function getProjectById(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      education_levels ( label ),
      project_fields ( field_id, fields_of_research ( field_name ) )
    `)
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  // Fetch supervisor info separately to avoid PostgREST FK hint issues
  let supervisorName = ''
  if (data.supervisor_id) {
    const { data: sup } = await supabase
      .from('supervisors')
      .select('first_name, last_name, academic_title, institution')
      .eq('user_id', data.supervisor_id)
      .maybeSingle()
    if (sup) {
      supervisorName = [sup.academic_title, sup.first_name, sup.last_name]
        .filter(Boolean)
        .join(' ')
      data._supervisor = sup
    }
  }

  return {
    ...data,
    education_label: data.education_levels?.label || '',
    research_areas: (data.project_fields || [])
      .map((pf) => pf.fields_of_research?.field_name)
      .filter(Boolean),
    supervisor_name: supervisorName,
  }
}

// ─── Supervisor Profile ─────────────────────────────────────
export async function getSupervisorProfile() {
  const { authUser, supervisorRow, supervisorKey } = await resolveSupervisorContext()

  const { data: userData } = await supabase
    .from('users')
    .select('email, created_at')
    .eq('user_id', supervisorKey)
    .maybeSingle()

  return {
    ...normalizeSupervisorRow(supervisorRow),
    email: userData?.email || authUser.email,
    created_at: userData?.created_at,
  }
}

export async function updateSupervisorProfile(fields) {
  const { supervisorKey } = await resolveSupervisorContext()

  const allowedKeys = [
    'first_name',
    'last_name',
    'academic_title',
    'institution',
    'department',
    'lab_name',
    'research_areas',
    'years_experience',
    'short_bio',
    'past_projects',
    'key_achievements',
    'current_project_info',
    'applicant_expectations',
  ]
  const payload = {}
  for (const key of allowedKeys) {
    if (key in fields) payload[key] = fields[key]
  }
  if ('research_areas' in payload && !Array.isArray(payload.research_areas)) {
    payload.research_areas = []
  }

  const { data, error } = await supabase
    .from('supervisors')
    .update(payload)
    .eq('user_id', supervisorKey)
    .select(
      'user_id, first_name, last_name, academic_title, institution, department, is_verified, lab_name, research_areas, years_experience, short_bio, past_projects, key_achievements, current_project_info, applicant_expectations',
    )
    .single()

  if (error) throw error
  return normalizeSupervisorRow(data)
}

export async function updateSupervisorPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return true
}

// ─── CV URL helpers ─────────────────────────────────────────
function parseStorageReference(storagePath, defaultBucket = 'application-files') {
  const knownBuckets = ['application-files', 'applicants_cvs', 'supervisors_cvs']
  if (!storagePath) return { bucket: defaultBucket, path: null }

  const ref = String(storagePath)

  if (/^https?:\/\//i.test(ref)) {
    const m = ref.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/)
    if (m) return { bucket: m[1], path: m[2] }
    return { bucket: defaultBucket, path: null }
  }

  const firstSlash = ref.indexOf('/')
  if (firstSlash > 0) {
    const bucketCandidate = ref.slice(0, firstSlash)
    if (knownBuckets.includes(bucketCandidate)) {
      return { bucket: bucketCandidate, path: ref.slice(firstSlash + 1) }
    }
  }

  return { bucket: defaultBucket, path: ref }
}

export async function getStorageFileUrls(storagePath, defaultBucket = 'application-files') {
  const { bucket, path } = parseStorageReference(storagePath, defaultBucket)
  if (!path) return { viewUrl: null, downloadUrl: null }

  const { data: viewData, error: viewErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300)

  const { data: dlData, error: dlErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300, { download: true })

  return {
    viewUrl: viewErr ? null : viewData?.signedUrl || null,
    downloadUrl: dlErr ? null : dlData?.signedUrl || null,
  }
}

async function getSupervisorCvDocument(userId) {
  // supervisors table has NO cv_document_id column.
  // Look up the CV directly in the documents table by owner + type + bucket prefix.
  const { data: doc, error } = await supabase
    .from('documents')
    .select('document_id, file_url')
    .eq('owner_user_id', userId)
    .eq('doc_type', 'CV')
    .like('file_url', 'supervisors_cvs/%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return doc || null
}

export async function getSupervisorCvFilePath() {
  const { supervisorKey } = await resolveSupervisorContext()

  const doc = await getSupervisorCvDocument(supervisorKey)
  return doc?.file_url || null
}

export async function uploadSupervisorCv(file) {
  if (!file) throw new Error('CV file is required.')

  const { supervisorKey } = await resolveSupervisorContext()

  const oldDoc = await getSupervisorCvDocument(supervisorKey)

  const uploadPath = `${supervisorKey}/${Date.now()}-${file.name}`
  const docPath = `supervisors_cvs/${uploadPath}`

  const { error: uploadError } = await supabase.storage
    .from('supervisors_cvs')
    .upload(uploadPath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data: insertedDoc, error: insertErr } = await supabase
    .from('documents')
    .insert({
      owner_user_id: supervisorKey,
      doc_type: 'CV',
      file_url: docPath,
    })
    .select('document_id, file_url')
    .single()
  if (insertErr) throw insertErr

  // Clean up old storage file and document row
  if (oldDoc?.file_url) {
    const oldRef = parseStorageReference(oldDoc.file_url, 'supervisors_cvs')
    if (oldRef.path) {
      await supabase.storage.from(oldRef.bucket).remove([oldRef.path])
    }
    await supabase.from('documents').delete().eq('document_id', oldDoc.document_id)
  }

  return insertedDoc.file_url
}

export async function deleteSupervisorCv() {
  const { supervisorKey } = await resolveSupervisorContext()

  const doc = await getSupervisorCvDocument(supervisorKey)
  if (!doc) return true

  if (doc.file_url) {
    const ref = parseStorageReference(doc.file_url, 'supervisors_cvs')
    if (ref.path) {
      await supabase.storage.from(ref.bucket).remove([ref.path])
    }
  }

  await supabase.from('documents').delete().eq('document_id', doc.document_id)

  return true
}

// ─── Single application detail ─────────────────────────────
export async function getApplicationById(applicationId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      projects ( title, department, location )
    `)
    .eq('application_id', applicationId)
    .maybeSingle()

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('applications')
      .select(`
        *,
        projects ( title, department, location )
      `)
      .eq('id', applicationId)
      .maybeSingle()
    if (fallbackError) throw error
    if (!fallbackData) return null
    const [enriched] = await enrichApplications([fallbackData])
    return enriched || null
  }
  if (!data) return null

  const [enriched] = await enrichApplications([data])
  return enriched || null
}
