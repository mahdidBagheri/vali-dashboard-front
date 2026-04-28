import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './components/Login';
import UserDashboard from './pages/User/UserDashboard'; // <-- CHANGED IMPORT

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard Page protected by PrivateRoute */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            } 
          />

          {/* Automatically redirect the root path to the dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
