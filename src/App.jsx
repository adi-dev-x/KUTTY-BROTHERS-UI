import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import MainPage from "./components/MainPage/MainPage";
import AttendancePage from "./components/attendance/AttendancePage";
import Dashboard from "./components/dashboard/Dashboard"; // ✅ import your Dashboard component

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />

        {/* Main Page Route */}
        <Route
          path="/"
          element={
            isLoggedIn ? <MainPage onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />

        {/* Attendance Page Route */}
        <Route
          path="/attendance"
          element={
            isLoggedIn ? <AttendancePage onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />

        {/* Dashboard Page Route (All Employees redirect here) */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
