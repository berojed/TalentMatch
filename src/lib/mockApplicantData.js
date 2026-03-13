export const mockApplicantProfile = {
  id: 'demo-applicant',
  first_name: 'bernard',
  last_name: 'jedvaj',
  nickname: 'bernard jedvaj',
  email: 'bernard.jedvaj@gmail.com',
  degree_level: 'PhD',
  research_interests:
    'Particle accelerators, medical physics, plasma simulations, nuclear instrumentation',
  member_since: '2025-12-16',
  profile_picture_url: '',
}

export const mockApplicantSettings = {
  language: 'English',
  timezone: 'UTC',
  email_notifications: true,
  status_updates: true,
  new_opportunities: true,
  marketing_emails: false,
  profile_visibility: 'public',
  show_email_address: false,
}

export const mockProjects = [
  {
    id: 'p-accelerator-1',
    title: 'Development of Novel Particle Accelerators for Medical Applications',
    summary:
      'This project focuses on the design and optimization of next-generation particle accelerators, specifically for proton and heavy-ion therapy. It involves simulations, engineering, and experimental validation of new concepts to enhance treatment precision and efficiency.',
    department: 'Accelerator Physics',
    location: 'Darmstadt, Germany',
    duration: '2-3 years (Master), 3-4 years (PhD)',
    education_level: 'Master',
    compensation: 'paid',
    supervisor_name: 'Prof. Dr. Klaus Schmidt',
    research_center: 'GSI Helmholtz Centre for Heavy Ion Research',
    tags: ['Medical Physics', 'Accelerator Technology', 'Nuclear Engineering'],
    requirements:
      'Strong background in physics or engineering, experience with simulation software (e.g., GEANT4, CST), programming skills (Python, C++).',
    is_featured: true,
    status: 'active',
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'p-superheavy-2',
    title: 'Exploring Superheavy Elements: Synthesis and Spectroscopy',
    summary:
      'The project aims to synthesize and characterize new superheavy elements at the limits of the periodic table. This involves conducting experiments at the UNILAC and SHIP facilities, analyzing decay properties, and contributing to the understanding of nuclear structure.',
    department: 'Nuclear Structure and Reactions',
    location: 'Darmstadt, Germany',
    duration: '3-4 years',
    education_level: 'PhD',
    compensation: 'unpaid',
    supervisor_name: 'Prof. Dr. Lena Muller',
    research_center: 'GSI Helmholtz Centre for Heavy Ion Research',
    tags: ['Nuclear Physics', 'Radiochemistry', 'Atomic Physics'],
    requirements:
      'Strong analytical skills, prior lab exposure, and familiarity with nuclear data analysis methods.',
    is_featured: true,
    status: 'active',
    created_at: '2026-02-03T08:30:00Z',
  },
  {
    id: 'p-plasma-3',
    title: 'High-Energy Density Physics with FAIR: Matter under Extreme Conditions',
    summary:
      'Investigating the properties of matter under extreme conditions, such as those found in stellar interiors or planetary cores, using high-energy heavy ion beams at the upcoming FAIR facility. The project involves experimental work and theoretical modeling.',
    department: 'Plasma Physics',
    location: 'Darmstadt, Germany',
    duration: '2 years (Master), 3-4 years (PhD)',
    education_level: 'Master, PhD',
    compensation: 'paid',
    supervisor_name: 'Prof. Marco Bianchi',
    research_center: 'FAIR Research Campus',
    tags: ['Plasma Physics', 'Astrophysics', 'Condensed Matter Physics'],
    requirements:
      'Interest in high-energy density experiments, data analysis, and computational modeling.',
    is_featured: true,
    status: 'active',
    created_at: '2026-02-06T11:15:00Z',
  },
  {
    id: 'p-qed-4',
    title: 'Quantum Electrodynamics in Strong Fields: Precision Spectroscopy',
    summary:
      'This project focuses on precision spectroscopy of highly charged ions to test fundamental predictions of quantum electrodynamics in extreme electromagnetic fields.',
    department: 'Quantum Optics',
    location: 'Leipzig, Germany',
    duration: '3 years',
    education_level: 'PhD',
    compensation: 'paid',
    supervisor_name: 'Prof. Elena Petrova',
    research_center: 'Helmholtz Institute Leipzig',
    tags: ['Quantum Optics', 'Precision Spectroscopy', 'QED'],
    requirements: 'Solid theoretical background in quantum mechanics and lab-based spectroscopy.',
    is_featured: false,
    status: 'active',
    created_at: '2026-02-08T09:45:00Z',
  },
]

export const mockApplications = [
  {
    id: '00a3a5bb',
    applicant_id: 'demo-applicant',
    project_id: 'p-superheavy-2',
    status: 'in_review',
    cover_letter_text: 'I am passionate about this domain and excited to contribute.',
    submitted_at: '2026-02-02T10:00:00Z',
  },
  {
    id: '00b7ff92',
    applicant_id: 'demo-applicant',
    project_id: 'p-accelerator-1',
    status: 'accepted',
    cover_letter_text: 'I have experience in accelerator simulations and detector systems.',
    submitted_at: '2026-01-28T09:30:00Z',
  },
  {
    id: '00cc8a10',
    applicant_id: 'demo-applicant',
    project_id: 'p-plasma-3',
    status: 'submitted',
    cover_letter_text: 'My research aligns with high-energy density plasma experiments.',
    submitted_at: '2026-02-09T15:20:00Z',
  },
]

export const mockSupervisors = [
  {
    id: 's-1',
    name: 'Dr. Elena Petrova',
    title: 'Senior Researcher',
    domain: 'Computational Neuroscience',
    summary:
      'Our lab focuses on developing novel computational models to understand complex brain functions and translate these insights into practical applications for neuro-rehabilitation.',
  },
  {
    id: 's-2',
    name: 'Prof. Dr. Klaus Richter',
    title: 'Professor of Quantum Physics',
    domain: 'Quantum Optics',
    summary:
      'The Quantum Optics group investigates fundamental aspects of light-matter interaction at the quantum level, with applications in quantum computing and metrology.',
  },
  {
    id: 's-3',
    name: 'Dr. Sofia Rossi',
    title: 'Research Group Leader',
    domain: 'Environmental Engineering',
    summary:
      'Our team develops innovative solutions for global water challenges, focusing on advanced filtration, resource recovery, and climate resilience in urban water systems.',
  },
  {
    id: 's-4',
    name: 'Prof. Jean-Luc Dubois',
    title: 'Distinguished Professor',
    domain: 'Artificial Intelligence & Robotics',
    summary:
      'The AI & Robotics lab explores the frontiers of intelligent systems, focusing on autonomous navigation, learning from demonstration, and ethical AI.',
  },
  {
    id: 's-5',
    name: 'Dr. Anya Sharma',
    title: 'Postdoctoral Fellow (Supervising)',
    domain: 'Molecular Medicine and Surgery',
    summary:
      'Our research focuses on identifying novel therapeutic targets for aggressive cancers using high-throughput genomic and proteomic approaches.',
  },
  {
    id: 's-6',
    name: 'Prof. Marco Bianchi',
    title: 'Professor of Astrophysics',
    domain: 'Applied Mathematics and Theoretical Physics',
    summary:
      'The Astrophysics group uses theoretical models and numerical simulations to understand extreme astrophysical phenomena and the evolution of the universe.',
  },
]
