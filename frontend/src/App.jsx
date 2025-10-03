import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Mentorias from './pages/Mentorias'
import Vagas from './pages/Vagas'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entrar" element={<SignIn />} />
        <Route path="/cadastro" element={<SignUp />} />
        <Route path="/mentorias" element={<Mentorias />} />
        <Route path="/vagas" element={<Vagas />} />
      </Routes>
    </Router>
  )
}

export default App
