# TalentMatch

A web platform that connects applicants with research supervisors and project opportunities.

---

## Use Cases

TalentMatch supports the full application lifecycle between applicants and supervisors.

**Applicants**
- Browse and filter open research projects
- Use swipe mode to quickly apply or skip opportunities
- Apply with a cover letter and CV
- Track application status across review stages

**Supervisors**
- Review incoming applications in list or swipe mode
- Shortlist, accept, or reject applications
- Access applicant CVs through signed URLs
- Monitor pipeline metrics from dashboard summary cards
- Maintain and update supervisor profile details

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
- A [Supabase](https://supabase.com) project with migrations applied from `supabase/migrations/`

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/talentmatch.git
cd talentmatch

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Set:
# VITE_SUPABASE_URL=https://<your-project>.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-anon-key>

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

Database schema and history are maintained in `supabase/migrations/`. Apply migrations in order using the Supabase CLI or SQL editor.

Key tables: `users`, `roles`, `applicants`, `supervisors`, `projects`, `applications`, `documents`, `fields_of_research`, `education_levels`, `application_reviews`.

---

## Key Features

- **Role-based auth** — students and supervisors land in separate dashboards after login
- **Swipe UX** — drag-based interactions for applicant project discovery and supervisor review workflows
- **CV management** — upload, replace, delete, and signed-URL access per role
- **Application workflow** — status transitions across submitted, review, and final decision states
- **Dashboard navigation** — summary metrics linked to filtered application views

---

## License

MIT
