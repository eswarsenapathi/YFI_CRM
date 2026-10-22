import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await axios.post(
                "http://127.0.0.1:8000/api/tickets/register/",
                {
                    username: username,
                    email: email,
                    password: password,
                }
            );

            setSuccess("Registration successful. Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            console.error(error);

            if (error.response?.data) {
                const data = error.response.data;

                if (data.username) {
                    setError(data.username[0]);
                } else if (data.email) {
                    setError(data.email[0]);
                } else if (data.password) {
                    setError(data.password[0]);
                } else {
                    setError("Unable to create account.");
                }
            } else {
                setError("Unable to connect to the server.");
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">

            <div className="container">

                <div className="row justify-content-center">

                    <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">

                        <div className="card border-0 shadow-lg rounded-4">

                            <div className="card-body p-4 p-md-5">

                                {/* Logo and Heading */}
                                <div className="text-center mb-4">

                                    <div
                                        className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm mb-3"
                                        style={{
                                            width: "65px",
                                            height: "65px",
                                            fontSize: "24px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Y
                                    </div>

                                    <h2 className="fw-bold mb-1">
                                        YFI CRM
                                    </h2>

                                    <p className="text-muted mb-0">
                                        Customer Support Management
                                    </p>

                                </div>

                                <h4 className="fw-bold text-center mb-4">
                                    Create Account
                                </h4>

                                {/* Error */}
                                {error && (
                                    <div
                                        className="alert alert-danger"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                {/* Success */}
                                {success && (
                                    <div
                                        className="alert alert-success"
                                        role="alert"
                                    >
                                        {success}
                                    </div>
                                )}

                                <form onSubmit={handleRegister}>

                                    {/* Username */}
                                    <div className="mb-3">

                                        <label
                                            htmlFor="username"
                                            className="form-label fw-semibold"
                                        >
                                            Username
                                        </label>

                                        <input
                                            id="username"
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Enter username"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                            required
                                        />

                                    </div>

                                    {/* Email */}
                                    <div className="mb-3">

                                        <label
                                            htmlFor="email"
                                            className="form-label fw-semibold"
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="email"
                                            type="email"
                                            className="form-control form-control-lg"
                                            placeholder="Enter email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            required
                                        />

                                    </div>

                                    {/* Password */}
                                    <div className="mb-3">

                                        <label
                                            htmlFor="password"
                                            className="form-label fw-semibold"
                                        >
                                            Password
                                        </label>

                                        <input
                                            id="password"
                                            type="password"
                                            className="form-control form-control-lg"
                                            placeholder="Create password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            required
                                        />

                                    </div>

                                    {/* Confirm Password */}
                                    <div className="mb-4">

                                        <label
                                            htmlFor="confirmPassword"
                                            className="form-label fw-semibold"
                                        >
                                            Confirm Password
                                        </label>

                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            className="form-control form-control-lg"
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    {/* Register Button */}
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg w-100 fw-semibold shadow-sm"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>

                                                Creating Account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>

                                </form>

                                {/* Login Link */}
                                <div className="text-center mt-4">

                                    <span className="text-muted">
                                        Already have an account?{" "}
                                    </span>

                                    <Link
                                        to="/login"
                                        className="text-decoration-none fw-semibold"
                                    >
                                        Login
                                    </Link>

                                </div>

                            </div>

                        </div>

                        <p className="text-center text-muted small mt-4">
                            © 2026 YFI CRM
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Register;