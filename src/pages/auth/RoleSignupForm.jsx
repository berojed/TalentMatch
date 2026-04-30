import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ApplicantProfileForm from '../../components/applicant/ApplicantProfileForm'
import SupervisorProfileForm from '../../components/supervisor/SupervisorProfileForm'

const inputClassName =
  'mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-lg text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500'

const labelClassName = 'block text-base font-medium text-neutral-700'

function StudentBasicFields({ values, onChange }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClassName}>
          First Name
          <input
            name="firstName"
            value={values.firstName}
            onChange={onChange}
            type="text"
            required
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Last Name
          <input
            name="lastName"
            value={values.lastName}
            onChange={onChange}
            type="text"
            required
            className={inputClassName}
          />
        </label>
      </div>

      <label className={labelClassName}>
        Email
        <input
          name="email"
          value={values.email}
          onChange={onChange}
          type="email"
          required
          placeholder="your@institution.edu"
          className={inputClassName}
        />
      </label>
    </>
  )
}

function SupervisorBasicFields({ values, onChange }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClassName}>
          First Name
          <input
            name="firstName"
            value={values.firstName}
            onChange={onChange}
            type="text"
            required
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Last Name
          <input
            name="lastName"
            value={values.lastName}
            onChange={onChange}
            type="text"
            required
            className={inputClassName}
          />
        </label>
      </div>

      <label className={labelClassName}>
        Email
        <input
          name="email"
          value={values.email}
          onChange={onChange}
          type="email"
          required
          placeholder="your@institution.edu"
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Academic Title
        <select
          name="academicTitle"
          value={values.academicTitle}
          onChange={onChange}
          required
          className={inputClassName}
        >
          <option value="">Select title</option>
          <option value="professor">Professor</option>
          <option value="associate_professor">Associate Professor</option>
          <option value="assistant_professor">Assistant Professor</option>
          <option value="lecturer">Lecturer</option>
          <option value="research_fellow">Research Fellow</option>
        </select>
      </label>
    </>
  )
}

export default function RoleSignupForm({ role }) {
  const isStudent = role === 'student'

  const studentFormRef = React.useRef(null)
  const supervisorFormRef = React.useRef(null)

  const [formValues, setFormValues] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    academicTitle: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  })
  // Holds latest payloads built by the shared profile forms.
  const [studentProfilePayload, setStudentProfilePayload] = React.useState(null)
  const [supervisorProfilePayload, setSupervisorProfilePayload] = React.useState(null)
  const [error, setError] = React.useState('')
  const [successMessage, setSuccessMessage] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const onChange = (event) => {
    const { name, type, value, checked } = event.target
    setFormValues((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateBaseFields = () => {
    if (!formValues.firstName.trim()) return 'First name is required.'
    if (!formValues.lastName.trim()) return 'Last name is required.'
    if (!formValues.email.trim()) return 'Email is required.'
    if (formValues.password !== formValues.confirmPassword) return 'Passwords do not match.'
    if (formValues.password.length < 6) return 'Password must be at least 6 characters.'
    if (!formValues.acceptedTerms) {
      return 'You must agree to the Terms of Service and Privacy Policy.'
    }
    return null
  }

  const completeSignup = async (profilePayload) => {
    const baseError = validateBaseFields()
    if (baseError) {
      setError(baseError)
      return
    }
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const metadata = isStudent
      ? {
          role,
          first_name: formValues.firstName,
          last_name: formValues.lastName,
          degree_level_id: profilePayload.degree_level_id,
          institution: profilePayload.institution,
          field_of_study: profilePayload.field_of_study,
          graduation_year: profilePayload.graduation_year,
          experience: profilePayload.experience,
          projects: profilePayload.projects,
          skills: profilePayload.skills,
          awards: profilePayload.awards,
          additional_notes: profilePayload.additional_notes,
        }
      : {
          role,
          first_name: formValues.firstName,
          last_name: formValues.lastName,
          academic_title: formValues.academicTitle,
          institution: profilePayload.institution,
          department: profilePayload.department,
          lab_name: profilePayload.lab_name,
          research_areas: profilePayload.research_areas,
          years_experience: profilePayload.years_experience,
          short_bio: profilePayload.short_bio,
          past_projects: profilePayload.past_projects,
          key_achievements: profilePayload.key_achievements,
          current_project_info: profilePayload.current_project_info,
          applicant_expectations: profilePayload.applicant_expectations,
        }

    const { error: signUpError } = await supabase.auth.signUp({
      email: formValues.email,
      password: formValues.password,
      options: { data: metadata },
    })

    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccessMessage(
      'Account created. Check your email to confirm your address, then sign in.',
    )
  }


  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link
          to="/auth/signup"
          className="inline-flex items-center gap-1 text-base text-neutral-700 transition hover:text-black"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Role Selection
        </Link>

        <header className="mt-10 text-center">
          <Link to="/" className="inline-block text-6xl font-bold tracking-tight text-black hover:underline underline-offset-4 transition">TalentMatch</Link>
          <p className="mt-2 text-2xl text-neutral-600">
            {isStudent ? 'Student Registration' : 'Research Supervisor Registration'}
          </p>
        </header>

        <section className="mt-10 rounded border border-neutral-200 bg-white px-8 py-10 sm:px-10">
          <h2 className="text-5xl font-bold tracking-tight text-black">Create Account</h2>

          {isStudent ? (
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <StudentBasicFields values={formValues} onChange={onChange} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Profile Details</h3>
                <ApplicantProfileForm
                  ref={studentFormRef}
                  initialValues={studentProfilePayload}
                  onSubmit={async (payload) => {
                    setStudentProfilePayload(payload)
                    await completeSignup(payload)
                  }}
                  submitting={isSubmitting}
                  hideSubmitButton
                />
              </div>

              <div className="space-y-4">
                <label className={labelClassName}>
                  Password
                  <input
                    name="password"
                    value={formValues.password}
                    onChange={onChange}
                    type="password"
                    minLength={6}
                    required
                    className={inputClassName}
                  />
                </label>

                <label className={labelClassName}>
                  Confirm Password
                  <input
                    name="confirmPassword"
                    value={formValues.confirmPassword}
                    onChange={onChange}
                    type="password"
                    minLength={6}
                    required
                    className={inputClassName}
                  />
                </label>

                <label className="mt-1 flex items-center gap-2 text-base text-neutral-600">
                  <input
                    name="acceptedTerms"
                    type="checkbox"
                    checked={formValues.acceptedTerms}
                    onChange={onChange}
                    className="h-4 w-4"
                  />
                  I agree to the Terms of Service and Privacy Policy
                </label>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => studentFormRef.current?.submit()}
                  className="w-full rounded bg-black py-3 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <p className="pt-1 text-center text-lg text-neutral-500">
                Already have an account?{' '}
                <Link to={`/auth/login/${role}`} className="font-medium text-black hover:underline">
                  Sign in
                </Link>
              </p>

              {error && <p className="text-base text-red-600">{error}</p>}
              {successMessage && <p className="text-base text-green-700">{successMessage}</p>}
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <SupervisorBasicFields values={formValues} onChange={onChange} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Profile Details</h3>
                <SupervisorProfileForm
                  ref={supervisorFormRef}
                  initialValues={supervisorProfilePayload}
                  onSubmit={async (payload) => {
                    setSupervisorProfilePayload(payload)
                    await completeSignup(payload)
                  }}
                  submitting={isSubmitting}
                  hideSubmitButton
                />
              </div>

              <div className="space-y-4">
                <label className={labelClassName}>
                  Password
                  <input
                    name="password"
                    value={formValues.password}
                    onChange={onChange}
                    type="password"
                    minLength={6}
                    required
                    className={inputClassName}
                  />
                </label>

                <label className={labelClassName}>
                  Confirm Password
                  <input
                    name="confirmPassword"
                    value={formValues.confirmPassword}
                    onChange={onChange}
                    type="password"
                    minLength={6}
                    required
                    className={inputClassName}
                  />
                </label>

                <label className="mt-1 flex items-center gap-2 text-base text-neutral-600">
                  <input
                    name="acceptedTerms"
                    type="checkbox"
                    checked={formValues.acceptedTerms}
                    onChange={onChange}
                    className="h-4 w-4"
                  />
                  I agree to the Terms of Service and Privacy Policy
                </label>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => supervisorFormRef.current?.submit()}
                  className="w-full rounded bg-black py-3 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <p className="pt-1 text-center text-lg text-neutral-500">
                Already have an account?{' '}
                <Link to={`/auth/login/${role}`} className="font-medium text-black hover:underline">
                  Sign in
                </Link>
              </p>

              {error && <p className="text-base text-red-600">{error}</p>}
              {successMessage && <p className="text-base text-green-700">{successMessage}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
