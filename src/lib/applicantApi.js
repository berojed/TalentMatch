import { supabase } from './supabase'
import {
  mockApplicantProfile,
  mockApplicantSettings,
  mockApplications,
  mockProjects,
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

// ─── Applicant profile parse/serialize helpers ──────────────
// experience text uses the deterministic block format:
//   Role: ...
//   Organization: ...
//   Duration: ...
//   Description: ...
// Blocks are separated by a blank line.
const EXPERIENCE_KEYS = ['role', 'organization', 'duration', 'description']
const EXPERIENCE_LABELS = {
  role: 'Role',
  organization: 'Organization',
  duration: 'Duration',
  description: 'Description',
}

// projects text uses:
//   Title: ...
//   Description: ...
//   Methods/Technologies: ...
const PROJECT_KEYS = ['title', 'description', 'methods_technologies']
const PROJECT_LABELS = {
  title: 'Title',
  description: 'Description',
  methods_technologies: 'Methods/Technologies',
}

function parseBlocks(text, keys, labels) {
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

function serializeBlocks(rows, keys, labels) {
  return rows
    .map((row) => keys.map((k) => `${labels[k]}: ${(row[k] || '').trim()}`).join('\n'))
    .join('\n\n')
}

export function parseExperienceText(text) {
  return parseBlocks(text, EXPERIENCE_KEYS, EXPERIENCE_LABELS)
}

export function serializeExperienceRows(rows) {
  const cleaned = (rows || [])
    .map((r) => ({
      role: (r.role || '').trim(),
      organization: (r.organization || '').trim(),
      duration: (r.duration || '').trim(),
      description: (r.description || '').trim(),
    }))
    .filter((r) => r.role || r.organization || r.duration || r.description)
  return serializeBlocks(cleaned, EXPERIENCE_KEYS, EXPERIENCE_LABELS)
}

export function parseProjectsText(text) {
  return parseBlocks(text, PROJECT_KEYS, PROJECT_LABELS)
}

export function serializeProjectRows(rows) {
  const cleaned = (rows || [])
    .map((r) => ({
      title: (r.title || '').trim(),
      description: (r.description || '').trim(),
      methods_technologies: (r.methods_technologies || '').trim(),
    }))
    .filter((r) => r.title || r.description || r.methods_technologies)
  return serializeBlocks(cleaned, PROJECT_KEYS, PROJECT_LABELS)
}

export function parseSkillsArray(skills) {
  if (Array.isArray(skills)) return skills.map((s) => String(s)).filter(Boolean)
  return []
}

export function parseAwardsText(text) {
  if (!text) return []
  return String(text)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

// Normalize an applicant row into UI-friendly shape with safe defaults.
export function normalizeApplicantRow(row) {
  if (!row) return null
  return {
    ...row,
    field_of_study: row.field_of_study || '',
    graduation_year: row.graduation_year ?? '',
    experience: row.experience || '',
    projects: row.projects || '',
    skills: parseSkillsArray(row.skills),
    awards: row.awards || '',
    additional_notes: row.additional_notes || '',
  }
}

export async function getFeaturedSupervisors(limit = 6) {
  try {
    const { data: sups, error } = await supabase
      .from('supervisors')
      .select('user_id, first_name, last_name, academic_title, department, institution')
      .limit(limit)

    if (error || !sups?.length) return []

    // Fetch one project per supervisor for domain/summary
    const ids = sups.map((s) => s.user_id)
    const { data: projects } = await supabase
      .from('projects')
      .select('supervisor_id, title, description, project_fields ( fields_of_research ( field_name ) )')
      .in('supervisor_id', ids)
      .eq('status', 'OPEN')

    const projMap = {}
    for (const p of projects || []) {
      if (!projMap[p.supervisor_id]) projMap[p.supervisor_id] = p
    }

    return sups.map((sv) => {
      const proj = projMap[sv.user_id]
      const field = proj?.project_fields?.[0]?.fields_of_research?.field_name || sv.department || 'Research'
      return {
        id: sv.user_id,
        name: [sv.academic_title, sv.first_name, sv.last_name].filter(Boolean).join(' '),
        domain: field,
        title: sv.department || sv.institution || 'Researcher',
        summary: proj?.description || '',
        projectTitle: proj?.title || '',
      }
    })
  } catch {
    return []
  }
}

export async function getApplicantDashboardData() {
  const result = await withFallback(async () => {
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
        .from('applicants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('applications')
        .select('application_id, status, project_id, submitted_at')
        .or(`applicant_id.eq.${user.id},student_id.eq.${user.id}`),
      supabase
        .from('projects')
        .select(`
          *,
          education_levels ( label ),
          project_fields ( field_id, fields_of_research ( field_name ) )
        `)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (profileError || applicationsError || projectsError) {
      throw profileError || applicationsError || projectsError
    }

    const totalApplications = applications?.length || 0
    const inReview = applications?.filter((item) => item.status === 'UNDER_REVIEW').length || 0
    const accepted = applications?.filter((item) => item.status === 'ACCEPTED').length || 0

    // Get user email from auth
    const { data: userData } = await supabase
      .from('users')
      .select('email, created_at')
      .eq('user_id', user.id)
      .maybeSingle()

    // Resolve supervisor names for recommended projects
    let recProjects = projects?.length ? projects.map(normalizeProject) : mockProjects.slice(0, 3)
    const supIds = [...new Set((projects || []).map((p) => p.supervisor_id).filter(Boolean))]
    if (supIds.length) {
      const { data: sups } = await supabase
        .from('supervisors')
        .select('user_id, first_name, last_name, academic_title')
        .in('user_id', supIds)
      const sm = {}
      for (const s of sups || []) {
        sm[s.user_id] = [s.academic_title, s.first_name, s.last_name].filter(Boolean).join(' ')
      }
      recProjects = recProjects.map((p) => ({
        ...p,
        supervisor_name: sm[p.supervisor_id] || '',
      }))
    }

    return {
      profile: profile
        ? { ...profile, email: userData?.email || user.email }
        : {
            ...mockApplicantProfile,
            email: userData?.email || user.email || mockApplicantProfile.email,
          },
      stats: {
        totalApplications,
        inReview,
        accepted,
      },
      recommendedProjects: recProjects,
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
    }
  })

  // Fetch featured supervisors independently (works without auth)
  result.featuredSupervisors = await getFeaturedSupervisors(6)
  return result
}

function normalizeProject(p) {
  return {
    ...p,
    // Ensure consistent id access
    id: p.project_id,
    // Map DB fields to UI-expected names
    summary: p.description || '',
    compensation: p.is_paid ? 'paid' : 'unpaid',
    duration: p.duration_text || (p.duration_weeks ? `${p.duration_weeks} weeks` : '—'),
    education_level: p.education_levels?.label || '',
    tags: (p.project_fields || [])
      .map((pf) => pf.fields_of_research?.field_name)
      .filter(Boolean),
    research_areas: (p.project_fields || [])
      .map((pf) => pf.fields_of_research?.field_name)
      .filter(Boolean),
  }
}

export async function getOpportunities(filters = {}) {
  return withFallback(async () => {
    // Live schema uses project_status_enum: OPEN / CLOSED / DRAFT
    let query = supabase
      .from('projects')
      .select(`
        *,
        education_levels ( label ),
        project_fields ( field_id, fields_of_research ( field_name ) )
      `)
      .eq('status', 'OPEN')

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,department.ilike.%${filters.search}%`)
    }

    if (filters.department && filters.department !== 'all') {
      query = query.eq('department', filters.department)
    }

    if (filters.location && filters.location !== 'all') {
      query = query.eq('location', filters.location)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const projects = (data || []).map(normalizeProject)
    return {
      projects,
      filterOptions: {
        departments: [...new Set(projects.map((item) => item.department).filter(Boolean))],
        locations: [...new Set(projects.map((item) => item.location).filter(Boolean))],
      },
    }
  }, (err) => {
    console.warn('getOpportunities fell back to mock data:', err?.message)
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
      .select(`
        *,
        education_levels ( label ),
        project_fields ( field_id, fields_of_research ( field_name ) )
      `)
      .eq('project_id', projectId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Project not found')

    const project = normalizeProject(data)

    // Fetch supervisor info
    if (data.supervisor_id) {
      const { data: sup } = await supabase
        .from('supervisors')
        .select('first_name, last_name, academic_title, institution')
        .eq('user_id', data.supervisor_id)
        .maybeSingle()
      if (sup) {
        project.supervisor_name = [sup.academic_title, sup.first_name, sup.last_name]
          .filter(Boolean)
          .join(' ')
        project.research_center = sup.institution || ''
      }
    }

    project.requirements = data.special_requirements || ''

    return project
  }, () => mockProjects.find((item) => item.id === projectId) || null)
}

// Map frontend filter keys to DB enum literals
const STATUS_MAP = {
  all: null,
  submitted: 'SUBMITTED',
  in_review: 'UNDER_REVIEW',
  under_review: 'UNDER_REVIEW',
  shortlisted: 'SHORTLISTED',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
  withdrawn: 'WITHDRAWN',
  // Also accept uppercase directly
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
}

export async function getApplications(status = 'all') {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    let query = supabase
      .from('applications')
      .select(`
        *,
        projects ( project_id, title, department, location, duration_text, duration_weeks, supervisor_id )
      `)
      .or(`applicant_id.eq.${user.id},student_id.eq.${user.id}`)
      .order('submitted_at', { ascending: false })

    const dbStatus = STATUS_MAP[status] ?? null
    if (dbStatus) {
      query = query.eq('status', dbStatus)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const apps = data || []

    // Batch-resolve supervisor names
    const supervisorIds = [
      ...new Set(apps.map((a) => a.projects?.supervisor_id).filter(Boolean)),
    ]
    if (supervisorIds.length) {
      const { data: sups } = await supabase
        .from('supervisors')
        .select('user_id, first_name, last_name, academic_title')
        .in('user_id', supervisorIds)
      const supMap = {}
      for (const s of sups || []) {
        supMap[s.user_id] = [s.academic_title, s.first_name, s.last_name]
          .filter(Boolean)
          .join(' ')
      }
      for (const a of apps) {
        if (a.projects?.supervisor_id) {
          a.projects.supervisor_name = supMap[a.projects.supervisor_id] || ''
        }
      }
    }

    return apps
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
        student_id: user.id,
        applicant_id: user.id,
        project_id: projectId,
        status: 'UNDER_REVIEW',
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
    status: 'UNDER_REVIEW',
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
      .eq('application_id', applicationId)
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
      { data: userData },
    ] = await Promise.all([
      supabase
        .from('applicants')
        .select(
          'user_id, first_name, last_name, degree_level_id, institution, field_of_study, graduation_year, experience, projects, skills, awards, additional_notes',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('email, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (profileError) throw profileError

    return {
      profile: profile
        ? {
            ...normalizeApplicantRow(profile),
            email: userData?.email || user.email,
            created_at: userData?.created_at,
          }
        : {
            ...normalizeApplicantRow(mockApplicantProfile),
            email: userData?.email || user.email || mockApplicantProfile.email,
          },
      settings: mockApplicantSettings,
    }
  }, () => ({
    profile: normalizeApplicantRow(mockApplicantProfile),
    settings: mockApplicantSettings,
  }))
}

export async function updateApplicantProfile(payload) {
  return withFallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const allowedKeys = [
      'first_name',
      'last_name',
      'degree_level_id',
      'institution',
      'field_of_study',
      'graduation_year',
      'experience',
      'projects',
      'skills',
      'awards',
      'additional_notes',
    ]
    const filtered = {}
    for (const key of allowedKeys) {
      if (key in payload) filtered[key] = payload[key]
    }
    if ('skills' in filtered && !Array.isArray(filtered.skills)) {
      filtered.skills = parseSkillsArray(filtered.skills)
    }

    const { data, error } = await supabase
      .from('applicants')
      .update(filtered)
      .eq('user_id', user.id)
      .select(
        'user_id, first_name, last_name, degree_level_id, institution, field_of_study, graduation_year, experience, projects, skills, awards, additional_notes',
      )
      .single()

    if (error) {
      throw error
    }

    return normalizeApplicantRow(data)
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
