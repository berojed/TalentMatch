import React from 'react'

export default function StatCard({ label, value, sub, accent = false, success = false, onClick }) {
  const surface = success
    ? 'bg-ok-bg text-ok border-ok-border hover:border-ok'
    : accent
      ? 'bg-ink text-white border-ink hover:border-ink'
      : 'bg-card text-ink border-line hover:border-line-strong'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={[
        'group flex w-full flex-col items-start rounded-DEFAULT border px-[22px] py-5 text-left transition-all',
        'disabled:cursor-default',
        onClick ? 'hover:shadow-card' : '',
        surface,
      ].join(' ')}
    >
      <div
        className={[
          'mb-2.5 text-[11px] font-semibold uppercase tracking-wider2',
          success ? 'text-ok/70' : accent ? 'text-white/50' : 'text-ink-3',
        ].join(' ')}
      >
        {label}
      </div>
      <div
        className={[
          'mb-1.5 text-[32px] font-bold leading-none tracking-tightish font-mono-tabular',
          success ? 'text-ok' : accent ? 'text-white' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </div>
      <div className={['text-[12px]', success ? 'text-ok/70' : accent ? 'text-white/55' : 'text-ink-3'].join(' ')}>
        {sub}
      </div>
    </button>
  )
}
