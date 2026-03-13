import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const inputClassName =
  'mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-lg text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500'

const labelClassName = 'block text-base font-medium text-neutral-700'

function StudentFields({ values, onChange }) {
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
        Degree Level
        <select
          name="degreeLevel"
          value={values.degreeLevel}
          onChange={onChange}
          required
          className={inputClassName}
        >
          <option value="">Select degree level</option>
          <option value="undergraduate">Undergraduate</option>
          <option value="masters">Master&apos;s</option>
          <option value="phd">PhD</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className={labelClassName}>
        Research Interests
        <textarea
          name="researchInterests"
          value={values.researchInterests}
          onChange={onChange}
          placeholder="Describe your research interests..."
          rows={4}
          className={`${inputClassName} resize-none`}
        />
      </label>
    </>
  )
}

function SupervisorFields({ values, onChange }) {
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
        Institution
        <input
          name="institution"
          value={values.institution}
          onChange={onChange}
          type="text"
          required
          placeholder="University Name"
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Department
        <input
          name="department"
          value={values.department}
          onChange={onChange}
          type="text"
          required
          placeholder="Department Name"
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

  const [formValues, setFormValues] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    degreeLevel: '',
    researchInterests: '',
    institution: '',
    department: '',
    academicTitle: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  })
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (formValues.password !== formValues.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!formValues.acceptedTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.')
      return
    }

    setIsSubmitting(true)

    const metadata = isStudent
      ? {
          role,
          first_name: formValues.firstName,
          last_name: formValues.lastName,
          degree_level: formValues.degreeLevel,
          research_interests: formValues.researchInterests,
        }
      : {
          role,
          first_name: formValues.firstName,
          last_name: formValues.lastName,
          institution: formValues.institution,
          department: formValues.department,
          academic_title: formValues.academicTitle,
        }

    const { error: signUpError } = await supabase.auth.signUp({
      email: formValues.email,
      password: formValues.password,
      options: {
        data: metadata,
      },
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
          <h1 className="text-6xl font-bold tracking-tight text-black">TalentMatch</h1>
          <p className="mt-2 text-2xl text-neutral-600">
            {isStudent ? 'Student Registration' : 'Research Supervisor Registration'}
          </p>
        </header>

        <section className="mt-10 rounded border border-neutral-200 bg-white px-8 py-10 sm:px-10">
          <h2 className="text-5xl font-bold tracking-tight text-black">Create Account</h2>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {isStudent ? (
              <StudentFields values={formValues} onChange={onChange} />
            ) : (
              <SupervisorFields values={formValues} onChange={onChange} />
            )}

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
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-black px-6 py-4 text-2xl font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-600"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="pt-1 text-center text-lg text-neutral-500">
              Already have an account?{' '}
              <Link to={`/auth/login/${role}`} className="font-medium text-black hover:underline">
                Sign in
              </Link>
            </p>

            {error && <p className="text-base text-red-600">{error}</p>}
            {successMessage && <p className="text-base text-green-700">{successMessage}</p>}
          </form>
        </section>
      </div>
    </main>
  )
}
