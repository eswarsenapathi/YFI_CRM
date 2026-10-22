import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";

import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

import CreateTicket from "./pages/CreateTicket";
import Tickets from "./pages/Tickets";
import TicketDetails from "./pages/TicketDetails";
import UserManagement from "./pages/UserManagement";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Login */}
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Registration */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* General Dashboard */}
                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                {/* Role Dashboards */}
                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/manager-dashboard"
                    element={<ManagerDashboard />}
                />

                <Route
                    path="/engineer-dashboard"
                    element={<EngineerDashboard />}
                />

                <Route
                    path="/customer-dashboard"
                    element={<CustomerDashboard />}
                />

                {/* Create Ticket */}
                <Route
                    path="/create-ticket"
                    element={<CreateTicket />}
                />

                {/* Manage Tickets */}
                <Route
                    path="/tickets"
                    element={<Tickets />}
                />

                {/* Single Ticket Details */}
                <Route
                    path="/tickets/:id"
                    element={<TicketDetails />}
                />

                {/* Admin User Management */}
                <Route
                    path="/user-management"
                    element={<UserManagement />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;