

import React from 'react'
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AuthComponents from './components/AuthComponents';
import LoginModal from './components/LoginModal';

const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/login' element={<LoginModal />} />
        <Route path='/auth/callback' element={<AuthComponents />} />
      </Routes>
    </>
  )
}

export default App