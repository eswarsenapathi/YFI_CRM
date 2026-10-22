import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function CustomerDashboard() {
    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setMessage("");

            const [userResponse, ticketResponse] = await Promise.all([
                api.get("tickets/me/"),
                api.get("tickets/"),
            ]);

            setUser(userResponse.data);

            const ticketData = ticketResponse.data;
            setTickets(
                Array.isArray(ticketData)
                    ? ticketData
                    : Array.isArray(ticketData?.results)
                    ? ticketData.results
                    : []
            );
        } catch (error) {
            console.error("Customer dashboard loading error:", error);
            setMessage("Unable to load your dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };

    const getPriorityClass = (priority) => {
        const classes = {
            HIGH: "customer-pill customer-pill-danger",
            MEDIUM: "customer-pill customer-pill-warning",
            LOW: "customer-pill customer-pill-success",
        };
        return classes[priority] || "customer-pill customer-pill-neutral";
    };

    const getStatusClass = (status) => {
        const classes = {
            OPEN: "customer-pill customer-pill-blue",
            IN_PROGRESS: "customer-pill customer-pill-warning",
            RESOLVED: "customer-pill customer-pill-success",
            CLOSED: "customer-pill customer-pill-neutral",
        };
        return classes[status] || "customer-pill customer-pill-neutral";
    };

    const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgressCount = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const resolvedCount = tickets.filter((ticket) => ticket.status === "RESOLVED").length;
    const closedCount = tickets.filter((ticket) => ticket.status === "CLOSED").length;

    if (loading) {
        return (
            <div className="customer-loading-screen">
                <style>{customerStyles}</style>
                <div className="customer-loading-card">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h2>Loading your support space</h2>
                    <p>Getting your latest ticket information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-dashboard-page">
            <style>{customerStyles}</style>

            <nav className="customer-topbar">
                <Link to="/customer-dashboard" className="customer-brand">
                    <span className="customer-brand-icon">Y</span>
                    <span className="customer-brand-name">YFI CRM</span>
                    <span className="customer-brand-label">CUSTOMER</span>
                </Link>

                <div className="customer-user-area">
                    <div className="customer-avatar">
                        {(user?.username || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="customer-user-details">
                        <strong>{user?.username || "Customer"}</strong>
                        <span>Customer account</span>
                    </div>
                    <button type="button" className="customer-logout-button" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            <main className="customer-main">
                <header className="customer-hero">
                    <div className="customer-hero-copy">
                        <div className="customer-eyebrow"><span /> CUSTOMER SUPPORT PORTAL</div>
                        <h1>Welcome{user?.username ? `, ${user.username}` : ""}!</h1>
                        <p>Create a support ticket and keep track of updates in one place.</p>
                    </div>
                    <Link to="/create-ticket" className="customer-create-button">
                        <i className="bi bi-plus-lg" />
                        Create New Ticket
                    </Link>
                </header>

                {message && (
                    <div className="customer-error-message" role="alert">
                        <i className="bi bi-exclamation-triangle" />
                        <span>{message}</span>
                        <button type="button" onClick={loadDashboard}>Try again</button>
                    </div>
                )}

                <section className="customer-stats-grid" aria-label="My ticket summary">
                    <article className="customer-stat-card tone-blue">
                        <div className="customer-stat-top"><span>My Tickets</span><i className="bi bi-ticket-detailed" /></div>
                        <strong>{tickets.length}</strong>
                        <small>Total submitted tickets</small>
                    </article>
                    <article className="customer-stat-card tone-orange">
                        <div className="customer-stat-top"><span>Open</span><i className="bi bi-inbox" /></div>
                        <strong>{openCount}</strong>
                        <small>Waiting for support</small>
                    </article>
                    <article className="customer-stat-card tone-purple">
                        <div className="customer-stat-top"><span>In Progress</span><i className="bi bi-hourglass-split" /></div>
                        <strong>{inProgressCount}</strong>
                        <small>Being worked on</small>
                    </article>
                    <article className="customer-stat-card tone-green">
                        <div className="customer-stat-top"><span>Resolved</span><i className="bi bi-check2-circle" /></div>
                        <strong>{resolvedCount}</strong>
                        <small>Support issue resolved</small>
                    </article>
                </section>

                <section className="customer-panel">
                    <div className="customer-panel-heading">
                        <div>
                            <span className="customer-section-kicker">TICKET ACTIVITY</span>
                            <h2>My Tickets</h2>
                            <p>Review your submitted support requests and their latest status.</p>
                        </div>
                        <span className="customer-ticket-count">{tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}</span>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="customer-empty-state">
                            <span className="customer-empty-icon"><i className="bi bi-inbox" /></span>
                            <h3>No tickets yet</h3>
                            <p>When you submit a support request, it will appear here.</p>
                            <Link to="/create-ticket" className="customer-empty-create">
                                <i className="bi bi-plus-lg" /> Create your first ticket
                            </Link>
                        </div>
                    ) : (
                        <div className="customer-table-wrapper">
                            <table className="customer-ticket-table">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Issue</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>
                                                <Link to={`/tickets/${ticket.id}`} className="customer-ticket-id">
                                                    #{ticket.id}
                                                </Link>
                                            </td>
                                            <td className="customer-issue-cell" title={ticket.issue_description || ""}>
                                                {ticket.issue_description || "—"}
                                            </td>
                                            <td><span className={getPriorityClass(ticket.priority)}>{ticket.priority || "—"}</span></td>
                                            <td><span className={getStatusClass(ticket.status)}>{(ticket.status || "UNKNOWN").replaceAll("_", " ")}</span></td>
                                            <td>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"}</td>
                                            <td>
                                                <button type="button" className="customer-view-button" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                                    View <i className="bi bi-chevron-right" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer className="customer-footer">
                    <span><strong>YFI CRM</strong> <span className="customer-footer-dot">•</span> Customer Support Management</span>
                    <span>Customer portal</span>
                </footer>
            </main>
        </div>
    );
}

const customerStyles = `
.customer-dashboard-page{min-height:100vh;background:#f4f7fc;color:#17233b;font-family:inherit}
.customer-topbar{min-height:76px;padding:0 clamp(18px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;border-bottom:1px solid #e7ecf4;box-shadow:0 4px 18px rgba(22,40,75,.035)}
.customer-brand,.customer-user-area{display:flex;align-items:center;gap:12px}.customer-brand{text-decoration:none}
.customer-brand-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:linear-gradient(140deg,#2457df,#5285ff);color:#fff;font-weight:900;font-size:21px;box-shadow:0 5px 12px rgba(49,94,230,.24)}
.customer-brand-name{font-size:18px;font-weight:850;letter-spacing:-.5px;color:#17233b}.customer-brand-label{padding:5px 8px;border-radius:6px;background:#edf2ff;color:#315bd7;font-size:10px;font-weight:800;letter-spacing:1px}
.customer-user-area{gap:11px}.customer-avatar{width:39px;height:39px;display:grid;place-items:center;border-radius:50%;background:#e9efff;color:#315bd7;font-weight:800;border:1px solid #dbe5ff}
.customer-user-details{display:flex;flex-direction:column;gap:3px;min-width:100px}.customer-user-details strong{font-size:13px;color:#1c2942}.customer-user-details span{font-size:11px;color:#8994a8}
.customer-logout-button,.customer-create-button,.customer-view-button,.customer-empty-create{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;cursor:pointer;transition:all .18s ease;text-decoration:none}
.customer-logout-button{border:1px solid #e1e7f0;background:#fff;color:#4a5870;border-radius:10px;padding:10px 13px;font-size:12px;margin-left:8px}.customer-logout-button:hover{background:#fff2f1;border-color:#ffd6d1;color:#c53e36}
.customer-main{width:min(1440px,100%);margin:0 auto;padding:34px clamp(18px,4vw,56px) 22px}
.customer-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:24px;padding:29px;border:1px solid #e3eaff;border-radius:18px;background:linear-gradient(115deg,#fff 0%,#f5f8ff 70%,#eef3ff 100%);box-shadow:0 7px 25px rgba(36,64,120,.045)}
.customer-eyebrow,.customer-section-kicker{display:flex;align-items:center;gap:8px;color:#5874bd;font-size:10px;font-weight:850;letter-spacing:1.5px;margin-bottom:10px}.customer-eyebrow span{width:7px;height:7px;border-radius:50%;background:#4773ed;box-shadow:0 0 0 4px #e1e9ff}
.customer-hero h1{font-size:clamp(25px,3vw,32px);letter-spacing:-1px;font-weight:850;margin:0 0 7px;color:#182641}.customer-hero p,.customer-panel-heading p{font-size:13px;line-height:1.6;color:#7b879b;margin:0}
.customer-create-button{flex-shrink:0;border:0;border-radius:10px;padding:13px 17px;background:#315fe5;color:#fff;font-size:12px;box-shadow:0 5px 13px rgba(49,95,229,.2)}.customer-create-button:hover{background:#244dca;color:#fff;transform:translateY(-1px)}
.customer-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:22px}
.customer-stat-card{position:relative;overflow:hidden;min-width:0;background:#fff;border:1px solid #e8edf5;border-radius:15px;padding:19px 20px 17px;box-shadow:0 5px 18px rgba(23,42,79,.035);transition:transform .18s ease,box-shadow .18s ease}
.customer-stat-card:before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--tone)}.customer-stat-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(23,42,79,.075)}
.tone-blue{--tone:#4774ed;--tint:#edf2ff;--ink:#3865df}.tone-purple{--tone:#8960df;--tint:#f3edff;--ink:#8054d6}.tone-orange{--tone:#e99a39;--tint:#fff4e5;--ink:#ce7d1e}.tone-green{--tone:#28a879;--tint:#e7f8f0;--ink:#188c62}
.customer-stat-top{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#758198;font-size:12px;font-weight:700}.customer-stat-top i{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--tint);color:var(--ink);font-size:17px;font-style:normal}
.customer-stat-card>strong{display:block;margin-top:13px;font-size:30px;line-height:1.1;letter-spacing:-1px;font-weight:850;color:#1d2b45}.customer-stat-card>small{display:block;margin-top:8px;font-size:10px;color:#a0a9b8}
.customer-panel{background:#fff;border:1px solid #e6ebf3;border-radius:16px;padding:23px;margin-bottom:22px;box-shadow:0 5px 18px rgba(23,42,79,.03)}
.customer-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:19px}.customer-section-kicker{margin-bottom:6px;font-size:9px}.customer-panel-heading h2{font-size:18px;letter-spacing:-.4px;font-weight:800;color:#1b2943;margin:0 0 5px}
.customer-ticket-count{flex-shrink:0;padding:7px 10px;border:1px solid #e1e8fb;border-radius:8px;background:#f3f6ff;color:#4665bb;font-size:11px;font-weight:800}
.customer-table-wrapper{width:100%;overflow-x:auto;border:1px solid #edf0f5;border-radius:11px}.customer-ticket-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0;font-size:12px}.customer-ticket-table thead{background:#f7f9fd}
.customer-ticket-table th{padding:13px 14px;text-align:left;color:#78859a;font-size:10px;font-weight:800;letter-spacing:.45px;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid #e9edf4}
.customer-ticket-table td{padding:14px;border-bottom:1px solid #eff2f7;color:#56647a;vertical-align:middle;white-space:nowrap}.customer-ticket-table tbody tr:last-child td{border-bottom:0}.customer-ticket-table tbody tr:hover{background:#fafbff}
.customer-ticket-id{font-weight:800;color:#4266ca;text-decoration:none}.customer-ticket-id:hover{text-decoration:underline}.customer-issue-cell{max-width:300px;overflow:hidden;text-overflow:ellipsis}
.customer-pill{display:inline-flex;align-items:center;justify-content:center;padding:5px 8px;border-radius:6px;font-size:9px;font-weight:850;letter-spacing:.3px;white-space:nowrap}
.customer-pill-danger{background:#ffeded;color:#c94343}.customer-pill-warning{background:#fff3dc;color:#a66a0b}.customer-pill-success{background:#e4f8ef;color:#17815b}.customer-pill-blue{background:#e9efff;color:#345ed0}.customer-pill-neutral{background:#edf0f5;color:#5c687b}
.customer-view-button{border:1px solid #dce5ff;border-radius:8px;padding:7px 10px;background:#f4f7ff;color:#355fd1;font-size:11px;white-space:nowrap}.customer-view-button:hover{background:#315fe5;color:#fff;border-color:#315fe5}
.customer-empty-state{text-align:center;padding:42px 16px}.customer-empty-icon{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 12px;border-radius:16px;background:#f0f4ff;color:#6380d8;font-size:22px}
.customer-empty-state h3{font-size:15px;font-weight:800;color:#293751;margin:0 0 6px}.customer-empty-state p{font-size:12px;color:#8994a7;margin:0 0 16px}
.customer-empty-create{border:1px solid #dce5ff;border-radius:8px;padding:10px 13px;background:#f4f7ff;color:#355fd1;font-size:11px}.customer-empty-create:hover{background:#315fe5;color:#fff}
.customer-error-message{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:13px 15px;border:1px solid #ffd8d5;border-radius:10px;background:#fff4f3;color:#b23d38;font-size:12px}.customer-error-message button{margin-left:auto;border:0;background:transparent;color:#a52e29;font-weight:800;cursor:pointer}
.customer-footer{display:flex;justify-content:space-between;gap:12px;padding:4px 2px 10px;color:#9aa4b4;font-size:10px}.customer-footer strong{color:#6c7890}.customer-footer-dot{padding:0 5px;color:#c0c8d4}
.customer-loading-screen{min-height:100vh;display:grid;place-items:center;background:#f4f7fc;padding:20px}.customer-loading-card{text-align:center;padding:35px 45px;background:#fff;border:1px solid #e6ebf3;border-radius:16px;box-shadow:0 8px 30px rgba(23,42,79,.06)}.customer-loading-card h2{font-size:17px;margin:16px 0 6px;color:#1d2b45}.customer-loading-card p{font-size:12px;color:#8994a7;margin:0}
@media(max-width:900px){.customer-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.customer-topbar{padding:14px 18px;flex-wrap:wrap}.customer-user-details{display:none}.customer-main{padding-top:20px}.customer-hero{align-items:flex-start;flex-direction:column;padding:21px}.customer-create-button{align-self:flex-start}.customer-panel{padding:17px}.customer-panel-heading{align-items:flex-start}.customer-footer{flex-direction:column}}
@media(max-width:430px){.customer-brand{gap:8px}.customer-brand-name{font-size:16px}.customer-brand-label{font-size:9px}.customer-logout-button{padding:9px 10px}.customer-hero h1{font-size:25px}.customer-hero p{font-size:12px}.customer-stat-card{padding:14px}.customer-stat-card>strong{font-size:26px}.customer-stat-card>small{font-size:9px}.customer-panel-heading h2{font-size:16px}}
`;

export default CustomerDashboard;