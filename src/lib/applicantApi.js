import { supabase } from './supabase'
import {
  mockApplicantProfile,
  mockApplicantSettings,
  mockApplications,
  mockProjects,
  mockSupervisors,
} from './mockApplicantData'

function includesInsensitive(value, search) {
  return String(value || '').toLowerCase().includes(search.toLowerCase())
}

function applyProjectFilters(projects, filters = {}) {
  const {
    search = '',
    department = 'all',
    location = 'all',
    educationLevel = 'all',
    duration = 'all',
  } = filters

  return projects.filter((project) => {
    const matchesSearch =
      !search ||
      includesInsensitive(project.title, search) ||
      includesInsensitive(project.summary, search) ||
      includesInsensitive(project.department, search)

    const matchesDepartment = department === 'all' || project.department === department
    const matchesLocation = location === 'all' || project.location === location
    const matchesEducation =
      educationLevel === 'all' || includesInsensitive(project.education_level, educationLevel)
    const matchesDuration = duration === 'all' || includesInsensitive(project.duration, duration)

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesLocation &&
      matchesEducation &&
      matchesDuration
    )
  })
}

function mapApplicationWithProject(application) {
  const project = mockProjects.find((item) => item.id === application.project_id)
  return {
    ...application,
    projects: project || null,
  }
}

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

async function withFallback(action, fallback) {
  try {
    return await action()
  } catch (error) {
    return fallback(error)
  }
}

export async function getApplicantDashboardData() {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const [
      { data: profile, error: profileError },
      { data: applications, error: applicationsError },
      { data: projects, error: projectsError },
    ] = await Promise.all([
      supabase
        .from('applicant_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('applications')
        .select('id, status, project_id, submitted_at')
        .eq('applicant_id', user.id),
      supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .limit(3),
    ])

    if (profileError || applicationsError || projectsError) {
      throw profileError || applicationsError || projectsError
    }

    const totalApplications = applications?.length || 0
    const inReview = applications?.filter((item) => item.status === 'in_review').length || 0
    const accepted = applications?.filter((item) => item.status === 'accepted').length || 0

    return {
      profile: profile || {
        ...mockApplicantProfile,
        email: user.email || mockApplicantProfile.email,
      },
      stats: {
        totalApplications,
        inReview,
        accepted,
      },
      recommendedProjects: projects?.length ? projects : mockProjects.slice(0, 3),
      featuredSupervisors: mockSupervisors,
    }
  }, () => {
    const applications = mockApplications
    return {
      profile: mockApplicantProfile,
      stats: {
        totalApplications: applications.length,
        inReview: applications.filter((item) => item.status === 'in_review').length,
        accepted: applications.filter((item) => item.status === 'accepted').length,
      },
      recommendedProjects: mockProjects.slice(0, 3),
      featuredSupervisors: mockSupervisors,
    }
  })
}

export async function getOpportunities(filters = {}) {
  return withFallback(async () => {
    const query = supabase.from('projects').select('*').eq('status', 'active')

    if (filters.search) {
      query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,department.ilike.%${filters.search}%`)
    }

    if (filters.department && filters.department !== 'all') {
      query.eq('department', filters.department)
    }

    if (filters.location && filters.location !== 'all') {
      query.eq('location', filters.location)
    }

    if (filters.educationLevel && filters.educationLevel !== 'all') {
      query.ilike('education_level', `%${filters.educationLevel}%`)
    }

    if (filters.duration && filters.duration !== 'all') {
      query.ilike('duration', `%${filters.duration}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const projects = data || []
    return {
      projects,
      filterOptions: {
        departments: [...new Set(projects.map((item) => item.department))],
        locations: [...new Set(projects.map((item) => item.location))],
      },
    }
  }, () => {
    const projects = applyProjectFilters(mockProjects, filters)
    return {
      projects,
      filterOptions: {
        departments: [...new Set(mockProjects.map((item) => item.department))],
        locations: [...new Set(mockProjects.map((item) => item.location))],
      },
    }
  })
}

export async function getProjectDetails(projectId) {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Project not found')
    }

    return data
  }, () => mockProjects.find((item) => item.id === projectId) || null)
}

export async function getApplications(status = 'all') {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const query = supabase
      .from('applications')
      .select('*, projects(*)')
      .eq('applicant_id', user.id)
      .order('submitted_at', { ascending: false })

    if (status !== 'all') {
      query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  }, () => {
    const filtered =
      status === 'all'
        ? mockApplications
        : mockApplications.filter((item) => item.status === status)

    return filtered.map(mapApplicationWithProject)
  })
}

export async function submitApplication({ projectId, coverLetterText, coverLetterFile }) {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    let filePath = null

    if (coverLetterFile) {
      const uploadPath = `${user.id}/${projectId}/${Date.now()}-${coverLetterFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('application-files')
        .upload(uploadPath, coverLetterFile, {
          upsert: false,
        })

      if (!uploadError) {
        filePath = uploadPath
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        applicant_id: user.id,
        project_id: projectId,
        status: 'submitted',
        cover_letter_text: coverLetterText || null,
        cover_letter_file_path: filePath,
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }, () => ({
    id: String(Math.random()).slice(2, 10),
    project_id: projectId,
    status: 'submitted',
    cover_letter_text: coverLetterText || '',
    submitted_at: new Date().toISOString(),
  }))
}

export async function discardApplication(applicationId) {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('applicant_id', user.id)

    if (error) {
      throw error
    }

    return true
  }, () => true)
}

export async function getApplicantProfile() {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const [
      { data: profile, error: profileError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      supabase
        .from('applicant_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('applicant_settings')
        .select('*')
        .eq('applicant_id', user.id)
        .maybeSingle(),
    ])

    if (profileError || settingsError) {
      throw profileError || settingsError
    }

    return {
      profile: profile || {
        ...mockApplicantProfile,
        email: user.email || mockApplicantProfile.email,
      },
      settings: settings || mockApplicantSettings,
    }
  }, () => ({
    profile: mockApplicantProfile,
    settings: mockApplicantSettings,
  }))
}

export async function updateApplicantProfile(payload) {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('applicant_profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }, () => ({ ...mockApplicantProfile, ...payload }))
}

export async function updateApplicantSettings(payload) {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('applicant_settings')
      .upsert(
        {
          applicant_id: user.id,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'applicant_id' },
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }, () => ({ ...mockApplicantSettings, ...payload }))
}

// ─── CV URL helpers ─────────────────────────────────────────
function parseStorageReference(storagePath, defaultBucket = 'applicants_cvs') {
  const knownBuckets = ['application-files', 'applicants_cvs', 'supervisors_cvs']
  if (!storagePath) return { bucket: defaultBucket, path: null }

  let ref = storagePath

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

export async function getStorageFileUrls(storagePath, defaultBucket = 'applicants_cvs') {
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

async function getApplicantCvDocument() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data: applicant, error: applicantErr } = await supabase
    .from('applicants')
    .select('cv_document_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (applicantErr) throw applicantErr

  if (!applicant?.cv_document_id) return { user, applicant, document: null }

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('document_id, file_url')
    .eq('document_id', applicant.cv_document_id)
    .maybeSingle()
  if (docErr) throw docErr

  return { user, applicant, document: doc || null }
}

export async function uploadApplicantCv(file) {
  if (!file) throw new Error('CV file is required.')

  const { user, document } = await getApplicantCvDocument()
  const uploadPath = `${user.id}/${Date.now()}-${file.name}`
  const docPath = `applicants_cvs/${uploadPath}`

  const { error: uploadError } = await supabase.storage
    .from('applicants_cvs')
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

  const { error: updateErr } = await supabase
    .from('applicants')
    .update({ cv_document_id: insertedDoc.document_id })
    .eq('user_id', user.id)
  if (updateErr) throw updateErr

  if (document?.file_url) {
    const oldRef = parseStorageReference(document.file_url, 'applicants_cvs')
    if (oldRef.path) {
      await supabase.storage.from(oldRef.bucket).remove([oldRef.path])
    }
    await supabase.from('documents').delete().eq('document_id', document.document_id)
  }

  return insertedDoc.file_url
}

export async function deleteApplicantCv() {
  const { user, document } = await getApplicantCvDocument()
  if (!document) return true

  const { error: updateErr } = await supabase
    .from('applicants')
    .update({ cv_document_id: null })
    .eq('user_id', user.id)
  if (updateErr) throw updateErr

  const ref = parseStorageReference(document.file_url, 'applicants_cvs')
  if (ref.path) {
    await supabase.storage.from(ref.bucket).remove([ref.path])
  }

  await supabase.from('documents').delete().eq('document_id', document.document_id)
  return true
}

export async function getApplicantCvFilePath() {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) return null

    // Try applicants.cv_document_id -> documents.file_url
    const { data: applicant } = await supabase
      .from('applicants')
      .select('cv_document_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (applicant?.cv_document_id) {
      const { data: doc } = await supabase
        .from('documents')
        .select('file_url')
        .eq('document_id', applicant.cv_document_id)
        .maybeSingle()
      if (doc?.file_url) return doc.file_url
    }

    // Fallback: latest application with cover_letter_file_path
    const { data: apps } = await supabase
      .from('applications')
      .select('cover_letter_file_path')
      .or(`applicant_id.eq.${user.id},student_id.eq.${user.id}`)
      .not('cover_letter_file_path', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(1)

    return apps?.[0]?.cover_letter_file_path
      ? `application-files/${apps[0].cover_letter_file_path}`
      : null
  }, () => null)
}

export async function updatePassword(currentPassword, newPassword) {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user?.email) {
      throw new Error('Not authenticated')
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      throw new Error('Current password is incorrect.')
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw error
    }

    return true
  }, () => true)
}
