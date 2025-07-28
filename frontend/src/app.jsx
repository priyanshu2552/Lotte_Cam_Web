import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
// import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import SKUManagement from "./pages/SKU";
import ProfilePage from "./pages/Profile";
import ProductionRecords from "./pages/Records";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/sku-management" element={<SKUManagement />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/production-records" element={<ProductionRecords />} />

        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;