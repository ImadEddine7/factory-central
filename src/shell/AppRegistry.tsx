import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface AppDefinition {
  id: string
  label: string
  basePath: string
  icon: ComponentType<{ className?: string }>
  component: LazyExoticComponent<ComponentType>
}

function DigestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM5 7a1 1 0 011-1h3a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h4a1 1 0 100-2H6z" />
    </svg>
  )
}

export const apps: AppDefinition[] = [
  {
    id: 'delivery-digest',
    label: 'Delivery Digest',
    basePath: '/digest',
    icon: DigestIcon,
    component: lazy(() => import('../apps/delivery-digest')),
  },
  // To add a new app:
  // 1. Create src/apps/your-app/index.tsx with a default export component
  // 2. Add an entry here:
  // {
  //   id: 'your-app',
  //   label: 'Your App',
  //   basePath: '/your-app',
  //   icon: YourIcon,
  //   component: lazy(() => import('../apps/your-app')),
  // },
]
