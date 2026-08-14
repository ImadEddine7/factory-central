import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface AppDefinition {
  id: string
  label: string
  basePath: string
  icon: ComponentType<{ className?: string }>
  component: LazyExoticComponent<ComponentType>
  group?: string
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  )
}

function DigestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM5 7a1 1 0 011-1h3a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h4a1 1 0 100-2H6z" />
    </svg>
  )
}

function StaffingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  )
}

function SteercoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function FinanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
    </svg>
  )
}

function SalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
    </svg>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-5 0H8v2h2V9z" clipRule="evenodd" />
    </svg>
  )
}

function AboutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

export const apps: AppDefinition[] = [
  {
    id: 'home',
    label: 'Accueil',
    basePath: '/home',
    icon: HomeIcon,
    component: lazy(() => import('../apps/home')),
  },
  {
    id: 'delivery-digest',
    label: 'Delivery Digest',
    basePath: '/digest',
    icon: DigestIcon,
    component: lazy(() => import('../apps/delivery-digest')),
    group: 'Delivery Suite',
  },
  {
    id: 'staffing-pipeline',
    label: 'Staffing Pipeline',
    basePath: '/staffing-pipeline',
    icon: StaffingIcon,
    component: lazy(() => import('../apps/staffing-pipeline')),
    group: 'Delivery Suite',
  },
  {
    id: 'steering',
    label: 'Steering',
    basePath: '/steering',
    icon: SteercoIcon,
    component: lazy(() => import('../apps/steerco')),
    group: 'Delivery Suite',
  },
  {
    id: 'financial-view',
    label: 'Financial View',
    basePath: '/financial-view',
    icon: FinanceIcon,
    component: lazy(() => import('../apps/financial-view')),
    group: 'Delivery Suite',
  },
  {
    id: 'sales-funnel',
    label: 'Sales Funnel',
    basePath: '/sales-funnel',
    icon: SalesIcon,
    component: lazy(() => import('../apps/sales-funnel')),
    group: 'Delivery Suite',
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    basePath: '/dashboards',
    icon: DashboardIcon,
    component: lazy(() => import('../apps/dashboards')),
    group: 'Delivery Suite',
  },
  {
    id: 'digital-em',
    label: 'Digital EM',
    basePath: '/digital-em',
    icon: ChatIcon,
    component: lazy(() => import('../apps/claude-chat')),
    group: 'Tools',
  },
  {
    id: 'about',
    label: 'About Us',
    basePath: '/about',
    icon: AboutIcon,
    component: lazy(() => import('../apps/about')),
  },
]
