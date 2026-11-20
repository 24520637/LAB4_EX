/// <reference types="vite/client" />

import { BrowserRouter } from 'react-router'
import SiteNav from '../components/navigation/SiteNav'
import SkipLink from '../components/navigation/SkipLink'
import AppLayout from './AppLayout'
import AppRoutes from './AppRoutes'
import '../styles/global.css'

export default function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <AppLayout navigation={<SiteNav />}>
        <AppRoutes />
      </AppLayout>
    </BrowserRouter>
  )
}
