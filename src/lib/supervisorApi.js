import { supabase } from './supabase'

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
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

  let usersData = null

  const { data: byUserId, error: byUserIdError } = await supabase
    .from('users')
    .select('user_id, email')
    .in('user_id', applicantIds)

  if (!byUserIdError) {
    usersData = byUserId || []
  } else {
    const { data: byId, error: byIdError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', applicantIds)
    if (!byIdError) {
      usersData = byId || []
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
    .select('user_id, first_name, last_name, degree_level_id, interests')
    .in('user_id', applicantIds)

  if (!normalizedError) {
    const map = {}
    ;(normalizedApplicants || []).forEach((applicant) => {
      map[applicant.user_id] = {
        first_name: applicant.first_name || '',
        last_name: applicant.last_name || '',
        degree_level_id: applicant.degree_level_id ?? null,
        interests: applicant.interests || '',
      }
    })
    return map
  }

  const { data: portalApplicants, error: portalError } = await supabase
    .from('applicant_profiles')
    .select('id, first_name, last_name, degree_level, research_interests')
    .in('id', applicantIds)

  if (portalError) return {}

  const map = {}
  ;(portalApplicants || []).forEach((applicant) => {
    map[applicant.id] = {
      first_name: applicant.first_name || '',
      last_name: applicant.last_name || '',
      degree_level_id: null,
      degree_level: applicant.degree_level || '',
      interests: applicant.research_interests || '',
    }
  })
  return map
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
      : applicant?.degree_level || ''

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
            interests: applicant.interests || '',
          }
        : null,
      applicant_email: applicantId ? emailMap[applicantId] || '' : '',
      degree_label: degreeLabel,
    }
  })
}

async function fetchSupervisorApplicationsByProjectIds(projectIds) {
  if (!projectIds.length) return []

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      projects ( title, department, location, duration_text, duration_weeks )
    `)
    .in('project_id', projectIds)
    .order('submitted_at', { ascending: false })

  if (error) throw error

  return enrichApplications(data || [])
}

// ─── Dashboard ────────────────────────────────────────────
export async function getSupervisorDashboardData() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const [
    { data: profile },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from('supervisors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('projects')
      .select('project_id')
      .eq('supervisor_id', user.id),
  ])

  const projectIds = (projects || []).map((p) => p.project_id)

  const enrichedApplications = await fetchSupervisorApplicationsByProjectIds(projectIds)

  const newApplications = enrichedApplications.filter(
    (a) => a.status === 'SUBMITTED',
  ).length
  const shortlisted = enrichedApplications.filter(
    (a) => a.status === 'SHORTLISTED' || a.status === 'ACCEPTED',
  ).length
  const totalApplications = enrichedApplications.length

  return {
    profile: profile || { first_name: user.email?.split('@')[0] || 'User' },
    stats: { newApplications, shortlisted, totalApplications },
    recentApplications: enrichedApplications.slice(0, 10),
  }
}

// ─── Projects ─────────────────────────────────────────────
export async function getSupervisorProjects(search = '') {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('projects')
    .select(`
      *,
      education_levels ( label ),
      project_fields ( field_id, fields_of_research ( field_name ) )
    `)
    .eq('supervisor_id', user.id)
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
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { researchAreas, ...rest } = projectData

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...rest,
      supervisor_id: user.id,
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
export async function getSupervisorApplications(projectId = null) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Get supervisor's project ids
  let projectIds = []
  if (projectId) {
    projectIds = [projectId]
  } else {
    const { data: projects } = await supabase
      .from('projects')
      .select('project_id')
      .eq('supervisor_id', user.id)
    projectIds = (projects || []).map((p) => p.project_id)
  }

  if (projectIds.length === 0) return []

  return fetchSupervisorApplicationsByProjectIds(projectIds)
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
  const user = await getCurrentUser()
  if (!user) return null

  const [{ data: profile }, { data: userData }] =
    await Promise.all([
      supabase
        .from('supervisors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('email, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

  return {
    ...profile,
    email: userData?.email || user.email,
    created_at: userData?.created_at,
  }
}

export async function updateSupervisorProfile(fields) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('supervisors')
    .update(fields)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
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

async function getSupervisorCvColumnAndDocumentId(userId) {
  const candidates = ['cv_document_id', 'document_id']

  for (const column of candidates) {
    const { data, error } = await supabase
      .from('supervisors')
      .select(column)
      .eq('user_id', userId)
      .maybeSingle()
    if (!error) {
      return { column, documentId: data?.[column] || null }
    }
  }

  return { column: 'cv_document_id', documentId: null }
}

async function updateSupervisorCvColumn(userId, documentId) {
  const { column } = await getSupervisorCvColumnAndDocumentId(userId)
  const { error } = await supabase
    .from('supervisors')
    .update({ [column]: documentId })
    .eq('user_id', userId)
  if (error) throw error
}

export async function getSupervisorCvFilePath() {
  const user = await getCurrentUser()
  if (!user) return null

  const { documentId } = await getSupervisorCvColumnAndDocumentId(user.id)
  if (!documentId) return null

  const { data: doc } = await supabase
    .from('documents')
    .select('file_url')
    .eq('document_id', documentId)
    .maybeSingle()

  return doc?.file_url || null
}

export async function uploadSupervisorCv(file) {
  if (!file) throw new Error('CV file is required.')

  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { documentId: oldDocumentId } = await getSupervisorCvColumnAndDocumentId(user.id)
  let oldDoc = null
  if (oldDocumentId) {
    const { data } = await supabase
      .from('documents')
      .select('document_id, file_url')
      .eq('document_id', oldDocumentId)
      .maybeSingle()
    oldDoc = data || null
  }

  const uploadPath = `${user.id}/${Date.now()}-${file.name}`
  const docPath = `supervisors_cvs/${uploadPath}`

  const { error: uploadError } = await supabase.storage
    .from('supervisors_cvs')
    .upload(uploadPath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data: insertedDoc, error: insertErr } = await supabase
    .from('documents')
    .insert({
      owner_user_id: user.id,
      doc_type: 'CV',
      file_url: docPath,
    })
    .select('document_id, file_url')
    .single()
  if (insertErr) throw insertErr

  await updateSupervisorCvColumn(user.id, insertedDoc.document_id)

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
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { documentId } = await getSupervisorCvColumnAndDocumentId(user.id)
  if (!documentId) return true

  const { data: doc } = await supabase
    .from('documents')
    .select('document_id, file_url')
    .eq('document_id', documentId)
    .maybeSingle()

  await updateSupervisorCvColumn(user.id, null)

  if (doc?.file_url) {
    const ref = parseStorageReference(doc.file_url, 'supervisors_cvs')
    if (ref.path) {
      await supabase.storage.from(ref.bucket).remove([ref.path])
    }
  }

  if (doc?.document_id) {
    await supabase.from('documents').delete().eq('document_id', doc.document_id)
  }

  return true
}

export async function getApplicationCvPath(application) {
  if (!application) return null

  // 1. Direct cover_letter_file_path on application
  if (application.cover_letter_file_path) return application.cover_letter_file_path

  // 2. application.cv_document_id -> documents.file_url
  const cvDocId = application.cv_document_id
  if (cvDocId) {
    const { data: doc } = await supabase
      .from('documents')
      .select('file_url')
      .eq('document_id', cvDocId)
      .maybeSingle()
    if (doc?.file_url) return doc.file_url
  }

  // 3. Applicant's cv_document_id -> documents.file_url
  const applicantId = application.student_id || application.applicant_id
  if (applicantId) {
    const { data: applicant } = await supabase
      .from('applicants')
      .select('cv_document_id')
      .eq('user_id', applicantId)
      .maybeSingle()

    if (applicant?.cv_document_id) {
      const { data: doc } = await supabase
        .from('documents')
        .select('file_url')
        .eq('document_id', applicant.cv_document_id)
        .maybeSingle()
      if (doc?.file_url) return doc.file_url
    }
  }

  return null
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
