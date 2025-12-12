import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './pages/Login';
import MainPage from './pages/MainPage';
import { ProtectedRoute } from './ProtectedRoute';

function App() {

  return (
    <>
      <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        {/* Protected routes - only accessible to authenticated admin users */}
        <Route 
          path="/MainPage" 
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          } 
        />
       
      </Routes>
    </Router>

    </>
  )
}

export default App
