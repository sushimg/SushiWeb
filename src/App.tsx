import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, LazyMotion, MotionConfig } from 'framer-motion'
import { features, EASE } from './lib/motion'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'

// Route-level code splitting: only the landing chunk loads up front, so the
// initial parse/JS-heap stays minimal. Other pages arrive on demand (and are
// quietly prefetched once the browser is idle — see RoutePrefetch). Each
// factory stays un-invoked until React.lazy first renders it, so the import
// is genuinely deferred.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })))
const ProjectsPage = lazy(() => import('./pages/Projects').then(m => ({ default: m.ProjectsPage })))
const ContactPage = lazy(() => import('./pages/Contact').then(m => ({ default: m.ContactPage })))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))

// reset scroll to top whenever the route changes (SPA navigation otherwise
// keeps the previous scroll position)
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Warm the remaining route chunks during idle time so navigation feels
// instant without paying for them at first paint.
function RoutePrefetch() {
  useEffect(() => {
    const warm = () => {
      import('./pages/About')
      import('./pages/Projects')
      import('./pages/Contact')
      import('./pages/ProjectDetail')
    }
    const ric = window.requestIdleCallback
    if (ric) {
      const id = ric(warm)
      return () => window.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warm, 1500)
    return () => window.clearTimeout(id)
  }, [])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={null}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <LazyMotion features={features} strict>
      <MotionConfig transition={{ ease: EASE }} reducedMotion="user">
        <BrowserRouter>
          <ScrollToTop />
          <RoutePrefetch />
          {/* pt = navbar height (h-24), so content never hides behind fixed bar */}
          <div className="flex flex-col min-h-screen" style={{ paddingTop: '6rem' }}>
            <Navbar />
            <div className="flex-1">
              <AnimatedRoutes />
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  )
}
