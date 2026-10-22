import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateTicket() {
    const [customerName, setCustomerName] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [priority, setPriority] = useState("UNASSIGNED");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const accessToken = localStorage.getItem("access");

            await api.post(
                "tickets/",
                {
                    customer_name: customerName,
                    issue_description: issueDescription,
                    priority: priority,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            setMessage("Ticket created successfully");

            setCustomerName("");
            setIssueDescription("");
            setPriority("UNASSIGNED");

            setTimeout(() => {
                navigate("/customer-dashboard");
            }, 1000);

        } catch (error) {
            console.error(error);
            setMessage("Unable to create ticket");
        }
    };

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

                <div className="row justify-content-center">

                    <div className="col-md-8 col-lg-6">

                        <div className="card border-0 shadow">

                            <div className="card-body p-4">

                                <h2 className="fw-bold mb-1">
                                    Create Ticket
                                </h2>

                                <p className="text-muted mb-4">
                                    Submit your support issue
                                </p>

                                {message && (
                                    <div className="alert alert-info">
                                        {message}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Customer Name
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={customerName}
                                            onChange={(event) =>
                                                setCustomerName(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter customer name"
                                            required
                                        />

                                    </div>


                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Issue Description
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="5"
                                            value={issueDescription}
                                            onChange={(event) =>
                                                setIssueDescription(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Describe your issue"
                                            required
                                        />

                                    </div>


                                    <div className="mb-4">

                                        <label className="form-label fw-semibold">
                                            Priority
                                        </label>

                                        <select
                                            className="form-select"
                                            value={priority}
                                            onChange={(event) =>
                                                setPriority(
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="UNASSIGNED">
                                                Unassigned
                                            </option>

                                            <option value="HIGH">
                                                High
                                            </option>

                                            <option value="MEDIUM">
                                                Medium
                                            </option>

                                            <option value="LOW">
                                                Low
                                            </option>

                                        </select>

                                    </div>


                                    <div className="d-flex gap-2">

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            Create Ticket
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() =>
                                                navigate(
                                                    "/customer-dashboard"
                                                )
                                            }
                                        >
                                            Cancel
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default CreateTicket;