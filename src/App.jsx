import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import MainPage from "./components/MainPage/MainPage";
import AttendancePage from "./components/attendance/AttendancePage";
import Dashboard from "./components/dashboard/Dashboard"; 
import RentalDashboard from "./components/customer/Customer"; 
import InvoicePage from "./components/invoice/InvoicePage"; 
import StockReport from "./components/stock-report/StockReport"; 
import StockDetail from "./components/stock-report/StockDetail"; 
import Brand from "./components/brand/brand"; 
import Tools from "./components/tools/Tools"; 
import Category from "./components/category/Category"; 

// ✅ Orders
import Orders from "./components/orders/Orders";
import OrderDetails from "./components/orders/OrderDetails";

// ✅ MainType & SubType
import MainType from "./components/maintype/MainType";
import SubType from "./components/subtype/SubType";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // set to false in production

  const handleLoginSuccess = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

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

        {/* Main Page */}
        <Route
          path="/"
          element={isLoggedIn ? <MainPage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Attendance */}
        <Route
          path="/attendance"
          element={isLoggedIn ? <AttendancePage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Rental Dashboard */}
        <Route
          path="/rental-dashboard"
          element={isLoggedIn ? <RentalDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Brand Page */}
        <Route
          path="/brand"
          element={isLoggedIn ? <Brand onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* ✅ MainType Page */}
        <Route
          path="/maintype"
          element={isLoggedIn ? <MainType onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* ✅ SubType Page */}
        <Route
          path="/subtype"
          element={isLoggedIn ? <SubType onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Tools Page */}
        <Route
          path="/tools"
          element={isLoggedIn ? <Tools onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Category Page */}
        <Route
          path="/category"
          element={isLoggedIn ? <Category onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Stock Report */}
        <Route
          path="/stock-report"
          element={isLoggedIn ? <StockReport onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Stock Detail Page */}
        <Route
          path="/stock/:sub_code"
          element={isLoggedIn ? <StockDetail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Invoice */}
        <Route
          path="/invoices"
          element={isLoggedIn ? <InvoicePage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* ✅ Orders Page */}
        <Route
          path="/orders"
          element={isLoggedIn ? <Orders onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* ✅ Order Details Page (using delivery_id) */}
        <Route
          path="/order-details/:delivery_id"
          element={isLoggedIn ? <OrderDetails onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
