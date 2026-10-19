import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from './pages/Home.jsx'
import Project from './pages/Project.jsx'
import Topic from './pages/Topic.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:projectId" element={<Project />} />
        <Route path="/:projectId/:topicId" element={<Topic />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster
        position="bottom-center"
        toastOptions={{ className: 'toast' }}
        offset={20}
      />
    </>
  )
}
