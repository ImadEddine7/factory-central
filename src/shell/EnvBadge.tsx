export function EnvBadge() {
  const env = import.meta.env.VITE_ENV || 'prod'
  if (env === 'prod') return null

  return (
    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
      {env}
    </span>
  )
}
