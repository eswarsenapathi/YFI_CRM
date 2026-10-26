import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/token/",
                { username, password }
            );

            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;

            localStorage.setItem("access", accessToken);
            localStorage.setItem("refresh", refreshToken);

           const userResponse = await axios.get(
            "https://yfi-crm.onrender.com/api/tickets/me/",
        {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    }
        );

            const role = userResponse.data.role;

            if (!role) {
                throw new Error("User role was not returned by the backend.");
            }

            localStorage.setItem("role", role);

            if (role === "Admin") {
                navigate("/admin-dashboard");
            } else if (role === "Manager") {
                navigate("/manager-dashboard");
            } else if (role === "Engineer") {
                navigate("/engineer-dashboard");
            } else {
                navigate("/customer-dashboard");
            }
        } catch (error) {
            console.error("Login error:", error);

            if (error.response?.data?.detail) {
                setError(error.response.data.detail);
            } else if (error.message === "Network Error") {
                setError("Cannot connect to the server. Please check that the backend is running.");
            } else {
                setError(error.message || "Unable to login. Please try again.");
            }

            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("role");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="yfi-login-page">
            <style>{loginStyles}</style>

            <header className="yfi-login-topbar">
                <Link to="/login" className="yfi-login-brand">
                    <span className="yfi-login-brand-mark">Y</span>
                    <span>YFI CRM</span>
                </Link>
                <span className="yfi-topbar-caption">CUSTOMER SUPPORT MANAGEMENT</span>
            </header>

            <main className="yfi-login-main">
                <section className="yfi-login-card">
                    <div className="yfi-login-logo">
                        <span className="yfi-login-brand-mark">Y</span>
                    </div>

                    <div className="yfi-login-heading">
                        <span className="yfi-login-kicker">YOUR WORKSPACE</span>
                        <h1>Welcome back</h1>
                        <p>Sign in to continue to your YFI CRM account.</p>
                    </div>

                    {error && (
                        <div className="yfi-login-error" role="alert">
                            <i className="bi bi-exclamation-circle-fill" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="yfi-form-field">
                            <label htmlFor="username">Username</label>
                            <div className="yfi-input-wrap">
                                <i className="bi bi-person" aria-hidden="true" />
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="yfi-form-field">
                            <label htmlFor="password">Password</label>
                            <div className="yfi-input-wrap yfi-password-wrap">
                                <i className="bi bi-lock" aria-hidden="true" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="yfi-password-toggle"
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="yfi-password-hint">Your password is case-sensitive.</div>
                        </div>

                        <button type="submit" className="yfi-login-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                    Signing you in...
                                </>
                            ) : (
                                <>
                                    Sign in <i className="bi bi-arrow-right" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="yfi-login-divider"><span>NEW TO YFI CRM?</span></div>

                    <p className="yfi-register-line">
                        Don't have an account? <Link to="/register">Create an account</Link>
                    </p>

                    <div className="yfi-login-security">
                        <i className="bi bi-shield-lock" />
                        <span>Secure sign-in to your YFI CRM workspace</span>
                    </div>
                </section>
            </main>

            <footer className="yfi-login-footer">© 2026 YFI CRM. All rights reserved.</footer>
        </div>
    );
}

const loginStyles = `
.yfi-login-page{min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%,#eaf0ff 0%,#f5f7fc 45%,#f7f9fd 100%);font-family:inherit;color:#192844}
.yfi-login-topbar{height:78px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,5vw,72px);background:rgba(255,255,255,.88);border-bottom:1px solid #e7ecf5}
.yfi-login-brand{display:inline-flex;align-items:center;gap:10px;color:#172744;text-decoration:none;font-size:18px;font-weight:850;letter-spacing:-.4px}.yfi-login-brand:hover{color:#172744}
.yfi-login-brand-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:linear-gradient(140deg,#315fe5,#5285ff);color:#fff;font-size:23px;font-weight:900;box-shadow:0 6px 15px rgba(49,95,229,.22)}
.yfi-topbar-caption{font-size:10px;font-weight:800;letter-spacing:1.5px;color:#8b97ad}
.yfi-login-main{flex:1;display:flex;align-items:center;justify-content:center;padding:38px 20px}
.yfi-login-card{width:min(100%,440px);padding:38px 40px 32px;background:#fff;border:1px solid #e6ebf4;border-radius:21px;box-shadow:0 18px 55px rgba(31,55,105,.09)}
.yfi-login-logo{display:flex;justify-content:center;margin-bottom:20px}.yfi-login-logo .yfi-login-brand-mark{width:54px;height:54px;border-radius:17px;font-size:29px}
.yfi-login-heading{text-align:center;margin-bottom:28px}.yfi-login-kicker{display:block;margin-bottom:9px;color:#5274d7;font-size:9px;font-weight:850;letter-spacing:1.7px}
.yfi-login-heading h1{margin:0 0 8px;color:#192844;font-size:29px;letter-spacing:-1px;font-weight:850}.yfi-login-heading p{margin:0;color:#8792a6;font-size:12px;line-height:1.7}
.yfi-login-error{display:flex;align-items:flex-start;gap:9px;margin:-7px 0 19px;padding:12px 13px;border:1px solid #ffd8d5;border-radius:10px;background:#fff4f3;color:#b33d37;font-size:12px;line-height:1.5}.yfi-login-error i{margin-top:1px;flex-shrink:0}
.yfi-form-field{margin-bottom:20px}.yfi-form-field label{display:block;margin-bottom:8px;color:#34425b;font-size:12px;font-weight:800}
.yfi-input-wrap{display:flex;align-items:center;gap:11px;min-height:51px;padding:0 14px;border:1px solid #e0e6f0;border-radius:10px;background:#fbfcff;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
.yfi-input-wrap:focus-within{border-color:#6385f0;background:#fff;box-shadow:0 0 0 4px rgba(65,103,226,.1)}.yfi-input-wrap>i{flex-shrink:0;color:#8d9ab0;font-size:17px}
.yfi-input-wrap input{width:100%;min-width:0;height:49px;border:0;outline:0;background:transparent;color:#1b2943;font-family:inherit;font-size:12px;box-shadow:none!important}.yfi-input-wrap input::placeholder{color:#a4adbc}
.yfi-password-wrap{padding-right:8px}.yfi-password-toggle{display:grid;place-items:center;flex-shrink:0;width:37px;height:37px;border:1px solid transparent;border-radius:9px;background:transparent;color:#7c8aa2;cursor:pointer;transition:background .18s ease,color .18s ease,border-color .18s ease}
.yfi-password-toggle i{font-size:17px;line-height:1}.yfi-password-toggle:hover{background:#edf2ff;border-color:#dce5ff;color:#315fe5}.yfi-password-toggle:focus-visible{outline:3px solid rgba(49,95,229,.25);outline-offset:1px}
.yfi-password-hint{margin-top:7px;color:#9aa4b4;font-size:10px}
.yfi-login-submit{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:49px;margin-top:26px;border:0;border-radius:10px;background:linear-gradient(100deg,#315fe5,#4275f3);color:#fff;font-family:inherit;font-size:12px;font-weight:800;box-shadow:0 8px 17px rgba(49,95,229,.2);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}
.yfi-login-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 11px 22px rgba(49,95,229,.28)}.yfi-login-submit:disabled{opacity:.7;cursor:wait}.yfi-login-submit>i{font-size:15px}
.yfi-login-divider{display:flex;align-items:center;gap:13px;margin:25px 0 16px;color:#a0a9b8;font-size:9px;font-weight:850;letter-spacing:1.3px}.yfi-login-divider:before,.yfi-login-divider:after{content:"";height:1px;flex:1;background:#edf0f5}
.yfi-register-line{text-align:center;margin:0;color:#7e899c;font-size:11px}.yfi-register-line a{margin-left:4px;color:#315fe5;font-weight:800;text-decoration:none}.yfi-register-line a:hover{text-decoration:underline}
.yfi-login-security{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:28px;color:#9aa4b4;font-size:10px}.yfi-login-security i{color:#6e88d9;font-size:13px}
.yfi-login-footer{padding:0 18px 20px;text-align:center;color:#a1aabb;font-size:10px}
@media(max-width:520px){.yfi-login-topbar{height:68px;padding:0 19px}.yfi-topbar-caption{max-width:115px;text-align:right;font-size:8px;line-height:1.5;letter-spacing:1px}.yfi-login-main{padding:24px 16px}.yfi-login-card{padding:30px 22px 25px;border-radius:17px}.yfi-login-heading h1{font-size:27px}.yfi-login-footer{padding-bottom:16px}}
`;

export default Login;
