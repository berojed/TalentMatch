# TalentMatch

A web portal connecting students with research supervisors and their projects. Built for a European scientific network.

---

## What It Does

TalentMatch bridges the gap between students looking for research opportunities and supervisors managing research projects.

**For students (applicants):**
- Browse and filter open research projects
- Swipe-mode discovery — drag right to apply, left to skip
- Apply with a cover letter and CV
- Track application status in real time

**For supervisors:**
- Review incoming applications in list or swipe mode
- Shortlist, accept, or reject with undo support
- View applicant CVs via secure signed URLs
- Dashboard with at-a-glance stats linked to filtered application views
- Manage a public research profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router DOM v6 |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (private buckets, RLS) |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar
│   ├── home/            # Landing page sections
│   ├── applicant/       # Applicant layout + application modal
│   └── supervisor/      # Supervisor layout
├── pages/
│   ├── Home.jsx         # Public landing page
│   ├── auth/            # Role selection, login, signup
│   ├── applicant/       # Dashboard, opportunities, applications, profile
│   └── supervisor/      # Dashboard, applications, review, profile
├── lib/
│   ├── supabase.js      # Supabase client
│   ├── applicantApi.js  # Applicant data + CV upload/download
│   └── supervisorApi.js # Supervisor data + application management + CV access
supabase/
└── migrations/          # SQL migration history
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema applied (see `supabase/migrations/`)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/talentmatch.git
cd talentmatch

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and fill in:
#   VITE_SUPABASE_URL=https://<your-project>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<your-anon-key>

# 4. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |

Never commit your `.env` file — it is gitignored by default.

---

## Database

The schema is defined across the SQL files in `supabase/migrations/`. Apply them in order to your Supabase project using the Supabase CLI or dashboard.

Key tables: `users`, `roles`, `applicants`, `supervisors`, `projects`, `applications`, `documents`, `fields_of_research`, `education_levels`, `application_reviews`.

---

## Key Features

- **Role-based auth** — students and supervisors land in separate dashboards after login
- **Swipe UX** — pointer-event drag gestures for both project discovery (applicant) and application review (supervisor)
- **CV management** — secure upload, replace, delete, and signed-URL view/download per role
- **Real-time status** — application status changes with optimistic UI + undo toast
- **Query-param navigation** — dashboard stat cards deep-link into pre-filtered application views

---

## License

MIT
