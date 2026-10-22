import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Tickets() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [engineers, setEngineers] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [assigningTicketId, setAssigningTicketId] = useState(null);
    const [selectedEngineers, setSelectedEngineers] = useState({});
    const [assigning, setAssigning] = useState(false);

    const role = localStorage.getItem("role")?.toLowerCase();

    // Only Managers can assign tickets from this page.
    const canAssignTickets = role === "manager";

    useEffect(() => {
        loadTickets();

        if (canAssignTickets) {
            loadEngineers();
        }
    }, []);

    useEffect(() => {
        filterTickets();
    }, [tickets, search, statusFilter, priorityFilter]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("tickets/");
            const data = response.data.results || response.data;

            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load tickets error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load tickets."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadEngineers = async () => {
        try {
            const response = await api.get("tickets/engineers/");
            const data = response.data.results || response.data;

            setEngineers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load engineers error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load engineers."
            );
        }
    };

    const filterTickets = () => {
        let result = [...tickets];

        if (search.trim()) {
            const searchValue = search.toLowerCase();

            result = result.filter((ticket) =>
                String(ticket.id).includes(searchValue) ||
                ticket.customer_name?.toLowerCase().includes(searchValue) ||
                ticket.issue_description?.toLowerCase().includes(searchValue) ||
                ticket.assigned_to?.username?.toLowerCase().includes(searchValue)
            );
        }

        if (statusFilter !== "ALL") {
            result = result.filter(
                (ticket) => ticket.status === statusFilter
            );
        }

        if (priorityFilter !== "ALL") {
            result = result.filter(
                (ticket) => ticket.priority === priorityFilter
            );
        }

        setFilteredTickets(result);
    };

    const handleAssign = async (ticket) => {
        const engineerId = selectedEngineers[ticket.id];

        if (!engineerId) {
            setError("Please select an engineer.");
            setSuccess("");
            return;
        }

        try {
            setAssigning(true);
            setError("");
            setSuccess("");

            await api.patch(`tickets/${ticket.id}/assign/`, {
                engineer_id: Number(engineerId),
            });

            setSuccess(`Ticket #${ticket.id} assigned successfully.`);
            setAssigningTicketId(null);

            await loadTickets();
        } catch (err) {
            console.error("Assign ticket error:", err);

            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.error ||
                "Unable to assign ticket. Please check the backend permissions."
            );
        } finally {
            setAssigning(false);
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority === "HIGH") return "badge bg-danger";
        if (priority === "MEDIUM") return "badge bg-warning text-dark";
        if (priority === "LOW") return "badge bg-success";

        return "badge bg-secondary";
    };

    const getStatusBadge = (status) => {
        if (status === "OPEN") return "badge bg-primary";
        if (status === "IN_PROGRESS") return "badge bg-warning text-dark";
        if (status === "RESOLVED") return "badge bg-success";
        if (status === "CLOSED") return "badge bg-dark";

        return "badge bg-secondary";
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light d-flex justify-content-center align-items-center">
                <div className="text-center">
                    <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                    />
                    <p className="text-muted mb-0">
                        Loading Tickets...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            <nav className="navbar navbar-dark bg-primary shadow-sm">
                <div className="container-fluid px-4">
                    <span className="navbar-brand fw-bold fs-4">
                        YFI CRM
                    </span>

                    <button
                        className="btn btn-light btn-sm"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                </div>
            </nav>

            <div className="container-fluid px-4 py-4">
                <div className="mb-4">
                    <h2 className="fw-bold mb-1">
                        Manage Tickets
                    </h2>

                    <p className="text-muted mb-0">
                        View, search, filter and manage support tickets.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger alert-dismissible">
                        {error}

                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setError("")}
                            aria-label="Close"
                        />
                    </div>
                )}

                {success && (
                    <div className="alert alert-success alert-dismissible">
                        {success}

                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setSuccess("")}
                            aria-label="Close"
                        />
                    </div>
                )}

                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Search
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by ID, customer, issue or engineer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">
                                    Status
                                </label>

                                <select
                                    className="form-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">
                                    Priority
                                </label>

                                <select
                                    className="form-select"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="ALL">All Priority</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-3">
                    <span className="text-muted">
                        Showing {filteredTickets.length} ticket(s)
                    </span>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        {filteredTickets.length === 0 ? (
                            <div className="text-center py-5">
                                <h5 className="text-muted">
                                    No tickets found
                                </h5>

                                <p className="text-muted mb-0">
                                    Try changing your search or filters.
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Issue</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Engineer</th>
                                            <th>Created</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredTickets.map((ticket) => (
                                            <tr key={ticket.id}>
                                                <td>
                                                    <strong>#{ticket.id}</strong>
                                                </td>

                                                <td>{ticket.customer_name}</td>

                                                <td>
                                                    <div style={{ maxWidth: "250px" }}>
                                                        {ticket.issue_description}
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className={getPriorityBadge(ticket.priority)}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className={getStatusBadge(ticket.status)}>
                                                        {ticket.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {ticket.assigned_to?.username || (
                                                        <span className="text-danger">
                                                            Not assigned
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    {new Date(
                                                        ticket.created_at
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td>
                                                    <div className="d-flex flex-column gap-2">
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() =>
                                                                navigate(`/tickets/${ticket.id}`)
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        {canAssignTickets && (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => {
                                                                    setError("");
                                                                    setSuccess("");

                                                                    setAssigningTicketId(
                                                                        assigningTicketId === ticket.id
                                                                            ? null
                                                                            : ticket.id
                                                                    );
                                                                }}
                                                            >
                                                                Assign Engineer
                                                            </button>
                                                        )}
                                                    </div>

                                                    {canAssignTickets &&
                                                        assigningTicketId === ticket.id && (
                                                            <div
                                                                className="mt-2"
                                                                style={{ minWidth: "190px" }}
                                                            >
                                                                <select
                                                                    className="form-select form-select-sm mb-2"
                                                                    value={selectedEngineers[ticket.id] || ""}
                                                                    onChange={(e) =>
                                                                        setSelectedEngineers((previous) => ({
                                                                            ...previous,
                                                                            [ticket.id]: e.target.value,
                                                                        }))
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        Select Engineer
                                                                    </option>

                                                                    {engineers.map((engineer) => (
                                                                        <option
                                                                            key={engineer.id}
                                                                            value={engineer.id}
                                                                        >
                                                                            {engineer.username}
                                                                        </option>
                                                                    ))}
                                                                </select>

                                                                <button
                                                                    className="btn btn-sm btn-success w-100"
                                                                    disabled={
                                                                        assigning ||
                                                                        !selectedEngineers[ticket.id]
                                                                    }
                                                                    onClick={() => handleAssign(ticket)}
                                                                >
                                                                    {assigning
                                                                        ? "Assigning..."
                                                                        : "Confirm Assign"}
                                                                </button>
                                                            </div>
                                                        )}
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
    );
}

export default Tickets;