import React from 'react'

const VARIANTS = {
  neutral: 'bg-subtle text-ink-2 border-line',
  green: 'bg-ok-bg text-ok border-ok-border',
  red: 'bg-danger-bg text-danger border-danger-border',
  amber: 'bg-warn-bg text-warn border-warn-border',
  blue: 'bg-info-bg text-info border-info-border',
  accent: 'bg-accent text-accent-fg border-transparent',
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const variantClass = VARIANTS[variant] || VARIANTS.neutral
  return (
    <span
      className={[
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-[2px]',
        'text-[11px] font-medium tracking-[0.01em]',
        variantClass,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

const STATUS_MAP = {
  SUBMITTED: { label: 'Pending', variant: 'amber' },
  UNDER_REVIEW: { label: 'In Review', variant: 'blue' },
  SHORTLISTED: { label: 'Shortlisted', variant: 'blue' },
  ACCEPTED: { label: 'Accepted', variant: 'green' },
  REJECTED: { label: 'Rejected', variant: 'red' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
  OPEN: { label: 'Active', variant: 'green' },
  CLOSED: { label: 'Closed', variant: 'red' },
  DRAFT: { label: 'Draft', variant: 'neutral' },
}

export function StatusBadge({ status, className = '' }) {
  const cfg = STATUS_MAP[status] || { label: status || '—', variant: 'neutral' }
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  )
}
