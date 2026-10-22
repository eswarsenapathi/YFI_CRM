import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function TicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [user, setUser] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [status, setStatus] = useState("");
    const [resolution, setResolution] = useState("");

    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadTicket();
        loadUser();
    }, [id]);

    const loadTicket = async () => {
        try {
            const response = await api.get(`tickets/${id}/`);

            setTicket(response.data);
            setStatus(response.data.status);
            setResolution("");
        } catch (error) {
            console.error(error);
            setMessage("Unable to load ticket details");
        }
    };

    const loadUser = async () => {
        try {
            const response = await api.get("tickets/me/");
            setUser(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setUpdating(true);

        try {
            const response = await api.patch(`tickets/${id}/`, {
                status: status,
                resolution: resolution,
            });

            setTicket(response.data);

            setStatus(response.data.status);

            // Clear the resolution input after successful update
            setResolution("");

            setMessage("Ticket updated successfully.");

        } catch (error) {
            console.error(error);

            if (error.response?.data?.detail) {
                setError(error.response.data.detail);
            } else {
                setError("Unable to update ticket.");
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleBack = () => {
        if (user?.role === "Engineer") {
            navigate("/engineer-dashboard");
        } else if (user?.role === "Manager") {
            navigate("/manager-dashboard");
        } else if (user?.role === "Admin") {
            navigate("/admin-dashboard");
        } else {
            navigate("/customer-dashboard");
        }
    };

    if (message && !ticket) {
        return (
            <div className="bg-light min-vh-100">

                <nav className="navbar navbar-dark bg-primary shadow">
                    <div className="container">
                        <span className="navbar-brand fw-bold">
                            YFI CRM
                        </span>
                    </div>
                </nav>

                <div className="container py-5">

                    <div className="alert alert-danger">
                        {message}
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={handleBack}
                    >
                        Back to Dashboard
                    </button>

                </div>

            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="bg-light min-vh-100">

                <nav className="navbar navbar-dark bg-primary shadow">
                    <div className="container">
                        <span className="navbar-brand fw-bold">
                            YFI CRM
                        </span>
                    </div>
                </nav>

                <div className="container py-5 text-center">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p className="text-muted mt-3">
                        Loading ticket...
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100">

            {/* Navbar */}
            <nav className="navbar navbar-dark bg-primary shadow">

                <div className="container">

                    <span className="navbar-brand fw-bold">
                        YFI CRM
                    </span>

                    {user && (
                        <span className="text-white">
                            Welcome, {user.username}
                        </span>
                    )}

                </div>

            </nav>


            {/* Main Content */}
            <div className="container py-4">

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div>

                        <h2 className="fw-bold mb-1">
                            Ticket #{ticket.id}
                        </h2>

                        <p className="text-muted mb-0">
                            Ticket details
                        </p>

                    </div>

                    <button
                        className="btn btn-outline-primary"
                        onClick={handleBack}
                    >
                        Back
                    </button>

                </div>


                {/* Success Message */}
                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}


                {/* Error Message */}
                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}


                {/* Ticket Details */}
                <div className="card border-0 shadow-sm mb-4">

                    <div className="card-body p-4">

                        <div className="row g-4">

                            {/* Customer */}
                            <div className="col-md-6">

                                <label className="text-muted">
                                    Customer
                                </label>

                                <h5 className="fw-semibold">
                                    {ticket.customer_name}
                                </h5>

                            </div>


                            {/* Priority */}
                            <div className="col-md-6">

                                <label className="text-muted">
                                    Priority
                                </label>

                                <div>

                                    <span className="badge bg-warning text-dark">
                                        {ticket.priority}
                                    </span>

                                </div>

                            </div>


                            {/* Status */}
                            <div className="col-md-6">

                                <label className="text-muted">
                                    Status
                                </label>

                                <div>

                                    <span className="badge bg-info text-dark">
                                        {ticket.status}
                                    </span>

                                </div>

                            </div>


                            {/* Assigned Engineer */}
                            <div className="col-md-6">

                                <label className="text-muted">
                                    Assigned Engineer
                                </label>

                                <h5 className="fw-semibold">

                                    {ticket.assigned_to
                                        ? ticket.assigned_to.username
                                        : "Not assigned"}

                                </h5>

                            </div>


                            {/* Issue Description */}
                            <div className="col-12">

                                <label className="text-muted">
                                    Issue Description
                                </label>

                                <div className="border rounded p-3 bg-light">
                                    {ticket.issue_description}
                                </div>

                            </div>


                            {/* Saved Resolution */}
                            <div className="col-12">

                                <label className="text-muted">
                                    Resolution
                                </label>

                                <div className="border rounded p-3 bg-light">

                                    {ticket.resolution
                                        ? ticket.resolution
                                        : "No resolution provided yet."}

                                </div>

                            </div>


                            {/* Created At */}
                            <div className="col-md-6">

                                <label className="text-muted">
                                    Created At
                                </label>

                                <p className="fw-semibold">
                                    {new Date(
                                        ticket.created_at
                                    ).toLocaleString()}
                                </p>

                            </div>


                            {/* Updated At */}
                            <div className="col-md-6">

                                <label className="text-muted">
                                    Updated At
                                </label>

                                <p className="fw-semibold">
                                    {new Date(
                                        ticket.updated_at
                                    ).toLocaleString()}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Engineer Update Section */}
                {user?.role === "Engineer" && (

                    <div className="card border-0 shadow-sm">

                        <div className="card-body p-4">

                            <div className="mb-4">

                                <h4 className="fw-bold mb-1">
                                    Update Ticket
                                </h4>

                                <p className="text-muted mb-0">
                                    Update the ticket status and add the resolution.
                                </p>

                            </div>


                            <form onSubmit={handleUpdate}>

                                {/* Status */}
                                <div className="mb-4">

                                    <label
                                        htmlFor="ticketStatus"
                                        className="form-label fw-semibold"
                                    >
                                        Status
                                    </label>

                                    <select
                                        id="ticketStatus"
                                        className="form-select form-select-lg"
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        required
                                    >

                                        <option value="OPEN">
                                            Open
                                        </option>

                                        <option value="IN_PROGRESS">
                                            In Progress
                                        </option>

                                        <option value="RESOLVED">
                                            Resolved
                                        </option>

                                        <option value="CLOSED">
                                            Closed
                                        </option>

                                    </select>

                                </div>


                                {/* Resolution */}
                                <div className="mb-4">

                                    <label
                                        htmlFor="resolution"
                                        className="form-label fw-semibold"
                                    >
                                        Resolution
                                    </label>

                                    <textarea
                                        id="resolution"
                                        className="form-control"
                                        rows="5"
                                        placeholder="Enter the solution or work completed..."
                                        value={resolution}
                                        onChange={(e) =>
                                            setResolution(e.target.value)
                                        }
                                    ></textarea>

                                </div>


                                {/* Update Button */}
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4 fw-semibold"
                                    disabled={updating}
                                >

                                    {updating ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>

                                            Updating...
                                        </>
                                    ) : (
                                        "Update Ticket"
                                    )}

                                </button>

                            </form>

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
}

export default TicketDetails;