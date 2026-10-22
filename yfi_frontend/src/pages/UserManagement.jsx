import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function UserManagement() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);

    const [teamData, setTeamData] = useState({
        managers: [],
        unassigned_engineers: [],
    });

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "Manager",
    });

    const [selectedManagerId, setSelectedManagerId] = useState(null);
    const [selectedEngineerId, setSelectedEngineerId] = useState("");

    const [selectedUnassignedEngineer, setSelectedUnassignedEngineer] =
        useState(null);

    const [assignManagerId, setAssignManagerId] = useState("");

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [assigning, setAssigning] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const getErrorMessage = (err, fallback) => {
        const data = err.response?.data;

        if (typeof data?.detail === "string") {
            return data.detail;
        }

        if (typeof data?.message === "string") {
            return data.message;
        }

        if (data && typeof data === "object") {
            return Object.entries(data)
                .map(([key, value]) => {
                    const text = Array.isArray(value)
                        ? value.join(", ")
                        : String(value);

                    return `${key}: ${text}`;
                })
                .join(" | ");
        }

        return fallback;
    };

    const loadTeamData = async () => {
        const response = await api.get(
            "tickets/team-management/"
        );

        setTeamData({
            managers: response.data.managers || [],
            unassigned_engineers:
                response.data.unassigned_engineers || [],
        });
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const userResponse = await api.get(
                "tickets/me/"
            );

            if (userResponse.data.role !== "Admin") {
                navigate("/dashboard");
                return;
            }

            setUser(userResponse.data);

            const response = await api.get(
                "tickets/user-management/"
            );

            setUsers(response.data);

            await loadTeamData();

        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to load user management."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const refreshTeams = async () => {
        try {
            setError("");
            await loadTeamData();
        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to refresh teams."
                )
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setCreating(true);

        try {
            const response = await api.post(
                "tickets/user-management/",
                formData
            );

            setFormData({
                username: "",
                email: "",
                password: "",
                role: "Manager",
            });

            await loadUsers();

            setMessage(
                `${response.data.user.username} created successfully.`
            );

        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to create user."
                )
            );

        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (item) => {
        let confirmationMessage =
            `Are you sure you want to delete "${item.username}"?`;

        if (item.role === "Manager") {
            const manager = teamData.managers.find(
                (manager) => manager.id === item.id
            );

            const engineerCount =
                manager?.engineers?.length || 0;

            confirmationMessage =
                `Delete Manager "${item.username}"?\n\n` +
                `${engineerCount} engineer(s) will move to ` +
                `"Unassigned Engineers".\n\n` +
                `Engineer accounts and their existing tickets ` +
                `will remain safe.\n\n` +
                `Do you want to continue?`;
        }

        if (item.role === "Engineer") {
            confirmationMessage =
                `Delete Engineer "${item.username}"?\n\n` +
                `The system will attempt to reassign their ` +
                `tickets to another available engineer.\n\n` +
                `Do you want to continue?`;
        }

        const confirmed = window.confirm(
            confirmationMessage
        );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");
        setDeletingId(item.id);

        try {
            const response = await api.delete(
                "tickets/user-management/",
                {
                    data: {
                        user_id: item.id,
                    },
                }
            );

            setSelectedManagerId(null);
            setSelectedUnassignedEngineer(null);

            await loadUsers();

            setMessage(
                response.data.message ||
                "User deleted successfully."
            );

        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to delete user."
                )
            );

        } finally {
            setDeletingId(null);
        }
    };

    const handleViewTeam = (managerId) => {
        setSelectedManagerId(managerId);
        setSelectedEngineerId("");

        setSelectedUnassignedEngineer(null);
        setAssignManagerId("");

        setMessage("");
        setError("");
    };

    const closeTeamModal = () => {
        setSelectedManagerId(null);
        setSelectedEngineerId("");
    };

    const openAssignModal = (engineer) => {
        setSelectedManagerId(null);
        setSelectedEngineerId("");

        setSelectedUnassignedEngineer(engineer);
        setAssignManagerId("");

        setMessage("");
        setError("");
    };

    const closeAssignModal = () => {
        setSelectedUnassignedEngineer(null);
        setAssignManagerId("");
    };

    const assignEngineer = async (
        engineerId,
        managerId
    ) => {
        const response = await api.post(
            "tickets/team-management/",
            {
                engineer_id: Number(engineerId),
                manager_id: Number(managerId),
            }
        );

        await loadTeamData();

        return response.data;
    };

    const handleTeamAssignment = async () => {
        if (
            !selectedManagerId ||
            !selectedEngineerId
        ) {
            setError("Please select an engineer.");
            return;
        }

        setAssigning(true);
        setError("");
        setMessage("");

        try {
            const response = await assignEngineer(
                selectedEngineerId,
                selectedManagerId
            );

            setSelectedEngineerId("");

            setMessage(
                response.message ||
                "Engineer assigned successfully."
            );

        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to assign engineer."
                )
            );

        } finally {
            setAssigning(false);
        }
    };

    const handleDirectAssignment = async () => {
        if (
            !selectedUnassignedEngineer ||
            !assignManagerId
        ) {
            setError("Please select a manager.");
            return;
        }

        setAssigning(true);
        setError("");
        setMessage("");

        try {
            const engineerName =
                selectedUnassignedEngineer.username;

            const manager = teamData.managers.find(
                (item) =>
                    item.id === Number(assignManagerId)
            );

            const response = await assignEngineer(
                selectedUnassignedEngineer.id,
                assignManagerId
            );

            closeAssignModal();

            setMessage(
                response.message ||
                `${engineerName} assigned to ` +
                `${manager?.username || "Manager"} successfully.`
            );

        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to assign engineer."
                )
            );

        } finally {
            setAssigning(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/login");
    };

    const getRoleBadge = (role) => {
        if (role === "Admin") {
            return "badge bg-danger";
        }

        if (role === "Manager") {
            return "badge bg-primary";
        }

        if (role === "Engineer") {
            return "badge bg-success";
        }

        return "badge bg-secondary";
    };

    const selectedManager = teamData.managers.find(
        (manager) =>
            manager.id === selectedManagerId
    );

    /*
        Find all engineers already assigned
        to a manager.
    */
    const assignedEngineerIds = new Set(
        teamData.managers.flatMap(
            (manager) =>
                (manager.engineers || []).map(
                    (engineer) => engineer.id
                )
        )
    );

    /*
        Build the Unassigned Engineers list.

        We first use the backend data and then
        check active Engineer users as a safety
        measure.
    */
    const unassignedMap = new Map();

    teamData.unassigned_engineers.forEach(
        (engineer) => {
            unassignedMap.set(
                engineer.id,
                engineer
            );
        }
    );

    users
        .filter(
            (item) =>
                item.role === "Engineer" &&
                item.is_active &&
                !assignedEngineerIds.has(item.id)
        )
        .forEach((item) => {

            if (!unassignedMap.has(item.id)) {
                unassignedMap.set(item.id, {
                    id: item.id,
                    username: item.username,
                    email: item.email,
                    ticket_count: null,
                });
            }

        });

    const unassignedEngineers =
        Array.from(unassignedMap.values());

    if (loading) {
        return (
            <div
                className={
                    "min-vh-100 bg-light d-flex " +
                    "justify-content-center align-items-center"
                }
            >
                <div className="text-center">

                    <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                    ></div>

                    <p className="text-muted mb-0">
                        Loading User Management...
                    </p>

                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">

            {/* ================= NAVBAR ================= */}

            <nav className="navbar navbar-dark bg-primary shadow-sm">

                <div className="container-fluid px-4">

                    <span className="navbar-brand fw-bold fs-4">
                        YFI CRM
                    </span>

                    <div className="d-flex align-items-center gap-3">

                        <span className="text-white">
                            Welcome{" "}
                            <strong>
                                {user?.username || "Admin"}
                            </strong>
                        </span>

                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </nav>

            {/* ================= MAIN CONTENT ================= */}

            <div className="container-fluid px-4 py-4">

                {/* Header */}

                <div
                    className={
                        "d-flex flex-wrap justify-content-between " +
                        "align-items-center mb-4"
                    }
                >

                    <div>

                        <h2 className="fw-bold mb-1">
                            User Management
                        </h2>

                        <p className="text-muted mb-0">
                            Manage CRM users, managers and engineers.
                        </p>

                    </div>

                    <button
                        className="btn btn-outline-primary mt-3 mt-md-0"
                        onClick={() =>
                            navigate("/admin-dashboard")
                        }
                    >
                        Back to Dashboard
                    </button>

                </div>

                {/* Success Message */}

                {message && (
                    <div className="alert alert-success shadow-sm">
                        {message}
                    </div>
                )}

                {/* Error Message */}

                {error && (
                    <div className="alert alert-danger shadow-sm">
                        {error}
                    </div>
                )}

                <div className="row g-4">

                    {/* ================= CREATE USER ================= */}

                    <div className="col-12 col-lg-4">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4">

                                <h5 className="fw-bold mb-1">
                                    Create User
                                </h5>

                                <p className="text-muted small mb-4">
                                    Create Admin, Manager or Engineer accounts.
                                </p>

                                <form onSubmit={handleCreateUser}>

                                    {/* Username */}

                                    <div className="mb-3">

                                        <label
                                            className="form-label fw-semibold"
                                            htmlFor="username"
                                        >
                                            Username
                                        </label>

                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>

                                    {/* Email */}

                                    <div className="mb-3">

                                        <label
                                            className="form-label fw-semibold"
                                            htmlFor="email"
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            placeholder="Enter email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />

                                    </div>

                                    {/* Password */}

                                    <div className="mb-3">

                                        <label
                                            className="form-label fw-semibold"
                                            htmlFor="password"
                                        >
                                            Temporary Password
                                        </label>

                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter temporary password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />

                                    </div>

                                    {/* Role */}

                                    <div className="mb-4">

                                        <label
                                            className="form-label fw-semibold"
                                            htmlFor="role"
                                        >
                                            Role
                                        </label>

                                        <select
                                            id="role"
                                            name="role"
                                            className="form-select"
                                            value={formData.role}
                                            onChange={handleChange}
                                        >

                                            <option value="Manager">
                                                Manager
                                            </option>

                                            <option value="Engineer">
                                                Engineer
                                            </option>

                                            <option value="Admin">
                                                Admin
                                            </option>

                                        </select>

                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={creating}
                                    >
                                        {creating
                                            ? "Creating..."
                                            : "Create User"}
                                    </button>

                                </form>

                            </div>

                        </div>

                    </div>

                    {/* ================= CRM USERS ================= */}

                    <div className="col-12 col-lg-8">

                        <div className="card border-0 shadow-sm h-100">

                            <div className="card-body p-4">

                                <div
                                    className={
                                        "d-flex justify-content-between " +
                                        "align-items-center mb-3"
                                    }
                                >

                                    <div>

                                        <h5 className="fw-bold mb-1">
                                            CRM Users
                                        </h5>

                                        <p className="text-muted small mb-0">
                                            Users currently registered in the CRM.
                                        </p>

                                    </div>

                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={loadUsers}
                                    >
                                        Refresh
                                    </button>

                                </div>

                                {users.length === 0 ? (

                                    <div className="text-center py-5">

                                        <p className="text-muted mb-0">
                                            No users found.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="table-responsive">

                                        <table className="table table-hover align-middle">

                                            <thead className="table-light">

                                                <tr>

                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Status</th>
                                                    <th>Action</th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {users.map((item) => (

                                                    <tr key={item.id}>

                                                        <td>
                                                            {item.id}
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {item.username}
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {item.email || "-"}
                                                        </td>

                                                        <td>

                                                            <span
                                                                className={
                                                                    getRoleBadge(
                                                                        item.role
                                                                    )
                                                                }
                                                            >
                                                                {item.role}
                                                            </span>

                                                        </td>

                                                        <td>

                                                            {item.is_active ? (

                                                                <span className="badge bg-success">
                                                                    Active
                                                                </span>

                                                            ) : (

                                                                <span className="badge bg-secondary">
                                                                    Inactive
                                                                </span>

                                                            )}

                                                        </td>

                                                        <td>

                                                            <div className="d-flex gap-2 flex-wrap">

                                                                {item.role === "Manager" && (

                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() =>
                                                                            handleViewTeam(
                                                                                item.id
                                                                            )
                                                                        }
                                                                    >
                                                                        View Team
                                                                    </button>

                                                                )}

                                                                {item.id === user?.id ? (

                                                                    <span className="text-muted small align-self-center">
                                                                        Current User
                                                                    </span>

                                                                ) : (

                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() =>
                                                                            handleDeleteUser(
                                                                                item
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deletingId ===
                                                                            item.id
                                                                        }
                                                                    >
                                                                        {deletingId === item.id
                                                                            ? "Deleting..."
                                                                            : "Delete"}
                                                                    </button>

                                                                )}

                                                            </div>

                                                        </td>

                                                    </tr>

                                                ))}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

                {/* ================= TEAM MANAGEMENT ================= */}

                <div className="card border-0 shadow-sm mt-4">

                    <div className="card-body p-4">

                        <div
                            className={
                                "d-flex justify-content-between " +
                                "align-items-center mb-4"
                            }
                        >

                            <div>

                                <h5 className="fw-bold mb-1">
                                    Team Management
                                </h5>

                                <p className="text-muted small mb-0">
                                    View managers and their engineers.
                                </p>

                            </div>

                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={refreshTeams}
                            >
                                Refresh Teams
                            </button>

                        </div>

                        {teamData.managers.length === 0 ? (

                            <div className="alert alert-light border mb-0">
                                No managers found.
                            </div>

                        ) : (

                            <div className="row g-4">

                                {teamData.managers.map(
                                    (manager) => (

                                        <div
                                            className="col-12 col-md-6 col-xl-4"
                                            key={manager.id}
                                        >

                                            <div className="card border h-100">

                                                <div className="card-body">

                                                    <div
                                                        className={
                                                            "d-flex justify-content-between " +
                                                            "align-items-start mb-3"
                                                        }
                                                    >

                                                        <div>

                                                            <h6 className="fw-bold mb-1">
                                                                {manager.username}
                                                            </h6>

                                                            <small className="text-muted">
                                                                Manager
                                                            </small>

                                                        </div>

                                                        <span className="badge bg-primary">
                                                            {(manager.engineers || []).length} Engineers
                                                        </span>

                                                    </div>

                                                    <div className="mb-3">

                                                        <small className="text-muted">
                                                            Team Members
                                                        </small>

                                                        {(manager.engineers || []).length === 0 ? (

                                                            <p className="text-muted small mt-2 mb-0">
                                                                No engineers assigned.
                                                            </p>

                                                        ) : (

                                                            <ul className="list-group list-group-flush mt-2">

                                                                {manager.engineers.map(
                                                                    (engineer) => (

                                                                        <li
                                                                            className={
                                                                                "list-group-item px-0 " +
                                                                                "d-flex justify-content-between " +
                                                                                "align-items-center"
                                                                            }
                                                                            key={engineer.id}
                                                                        >

                                                                            <span>
                                                                                {engineer.username}
                                                                            </span>

                                                                            <span className="badge bg-light text-dark">
                                                                                {engineer.ticket_count ?? "—"} tickets
                                                                            </span>

                                                                        </li>

                                                                    )
                                                                )}

                                                            </ul>

                                                        )}

                                                    </div>

                                                    <button
                                                        className="btn btn-primary btn-sm w-100"
                                                        onClick={() =>
                                                            handleViewTeam(
                                                                manager.id
                                                            )
                                                        }
                                                    >
                                                        Manage Team
                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </div>

                {/* ================= UNASSIGNED ENGINEERS ================= */}

                <div className="card border-0 shadow-sm mt-4">

                    <div className="card-body p-4">

                        <div
                            className={
                                "d-flex justify-content-between " +
                                "align-items-center mb-3"
                            }
                        >

                            <div>

                                <h5 className="fw-bold mb-1">
                                    Unassigned Engineers
                                </h5>

                                <p className="text-muted small mb-0">
                                    Engineers who are not assigned to a Manager.
                                </p>

                            </div>

                            <span className="badge bg-warning text-dark">
                                {unassignedEngineers.length}
                            </span>

                        </div>

                        {unassignedEngineers.length === 0 ? (

                            <div className="alert alert-light border mb-0">
                                No unassigned engineers.
                            </div>

                        ) : (

                            <div className="table-responsive">

                                <table className="table table-hover align-middle mb-0">

                                    <thead className="table-light">

                                        <tr>

                                            <th>Engineer</th>
                                            <th>Email</th>
                                            <th>Tickets</th>
                                            <th>Action</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {unassignedEngineers.map(
                                            (engineer) => (

                                                <tr key={engineer.id}>

                                                    <td>

                                                        <strong>
                                                            {engineer.username}
                                                        </strong>

                                                    </td>

                                                    <td>
                                                        {engineer.email || "-"}
                                                    </td>

                                                    <td>

                                                        <span className="badge bg-secondary">

                                                            {engineer.ticket_count ?? "—"}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() =>
                                                                openAssignModal(
                                                                    engineer
                                                                )
                                                            }
                                                        >
                                                            Assign
                                                        </button>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </div>

            </div>

            {/* =====================================================
                DIRECT ASSIGN MODAL
            ====================================================== */}

            {selectedUnassignedEngineer && (

                <div
                    className="modal d-block"
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)",
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content border-0 shadow">

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold">
                                        Assign Engineer
                                    </h5>

                                    <small className="text-muted">

                                        Engineer:{" "}

                                        <strong>
                                            {
                                                selectedUnassignedEngineer.username
                                            }
                                        </strong>

                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeAssignModal}
                                    disabled={assigning}
                                    aria-label="Close"
                                ></button>

                            </div>

                            <div className="modal-body">

                                <div className="mb-3">

                                    <label
                                        className="form-label fw-semibold"
                                        htmlFor="assignManager"
                                    >
                                        Select Manager
                                    </label>

                                    <select
                                        id="assignManager"
                                        className="form-select"
                                        value={assignManagerId}
                                        onChange={(e) =>
                                            setAssignManagerId(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Select a Manager
                                        </option>

                                        {teamData.managers.map(
                                            (manager) => (

                                                <option
                                                    key={manager.id}
                                                    value={manager.id}
                                                >
                                                    {manager.username}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="alert alert-light border small mb-0">

                                    <strong>
                                        Note:
                                    </strong>{" "}

                                    The engineer's existing tickets
                                    will remain assigned to the engineer.

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={closeAssignModal}
                                    disabled={assigning}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-primary"
                                    onClick={handleDirectAssignment}
                                    disabled={
                                        assigning ||
                                        !assignManagerId
                                    }
                                >

                                    {assigning
                                        ? "Assigning..."
                                        : "Assign Engineer"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

            {/* =====================================================
                MANAGER TEAM MODAL
            ====================================================== */}

            {selectedManager && (

                <div
                    className="modal d-block"
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)",
                    }}
                >

                    <div
                        className={
                            "modal-dialog modal-lg " +
                            "modal-dialog-centered"
                        }
                    >

                        <div className="modal-content border-0 shadow">

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold">
                                        Manage Team
                                    </h5>

                                    <small className="text-muted">

                                        Manager:{" "}

                                        <strong>
                                            {selectedManager.username}
                                        </strong>

                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeTeamModal}
                                    disabled={assigning}
                                    aria-label="Close"
                                ></button>

                            </div>

                            <div className="modal-body">

                                <h6 className="fw-bold mb-3">
                                    Current Engineers
                                </h6>

                                {(selectedManager.engineers || []).length === 0 ? (

                                    <div className="alert alert-light border">

                                        No engineers are currently assigned
                                        to this Manager.

                                    </div>

                                ) : (

                                    <div className="list-group mb-4">

                                        {selectedManager.engineers.map(
                                            (engineer) => (

                                                <div
                                                    className={
                                                        "list-group-item d-flex " +
                                                        "justify-content-between " +
                                                        "align-items-center"
                                                    }
                                                    key={engineer.id}
                                                >

                                                    <div>

                                                        <strong>
                                                            {engineer.username}
                                                        </strong>

                                                        <div className="small text-muted">

                                                            {engineer.email ||
                                                                "No email"}

                                                        </div>

                                                    </div>

                                                    <span className="badge bg-primary">

                                                        {engineer.ticket_count ?? "—"} tickets

                                                    </span>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                                <div className="border-top pt-4">

                                    <h6 className="fw-bold mb-3">
                                        Assign Engineer
                                    </h6>

                                    <div className="row g-2">

                                        <div className="col-12 col-md-8">

                                            <select
                                                className="form-select"
                                                value={selectedEngineerId}
                                                onChange={(e) =>
                                                    setSelectedEngineerId(
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="">
                                                    Select an unassigned engineer
                                                </option>

                                                {unassignedEngineers.map(
                                                    (engineer) => (

                                                        <option
                                                            key={engineer.id}
                                                            value={engineer.id}
                                                        >
                                                            {engineer.username}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>

                                        <div className="col-12 col-md-4">

                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={
                                                    handleTeamAssignment
                                                }
                                                disabled={
                                                    assigning ||
                                                    !selectedEngineerId
                                                }
                                            >

                                                {assigning
                                                    ? "Assigning..."
                                                    : "Assign Engineer"}

                                            </button>

                                        </div>

                                    </div>

                                    {unassignedEngineers.length === 0 && (

                                        <p className="text-muted small mt-2 mb-0">

                                            No unassigned engineers available.

                                        </p>

                                    )}

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={closeTeamModal}
                                    disabled={assigning}
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default UserManagement;