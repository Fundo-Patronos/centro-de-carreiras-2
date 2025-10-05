import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Mentorias from './pages/Mentorias'
import Vagas from './pages/Vagas'
import AgendarMentoria from './pages/AgendarMentoria'

function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        {/* Navbar */}
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64">
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mentorias" element={<Mentorias />} />
              <Route path="/mentorias/agendar" element={<AgendarMentoria />} />
              <Route path="/vagas" element={<Vagas />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
