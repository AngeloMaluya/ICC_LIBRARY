import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import { useState } from 'react'
import {LoginSignup} from './login/login.jsx'

function App() {

  return (
  <Router>
    <Routes>
      <Route path="/" element={<LoginSignup />} />
    </Routes>
  </Router>
  )
}

export default App;