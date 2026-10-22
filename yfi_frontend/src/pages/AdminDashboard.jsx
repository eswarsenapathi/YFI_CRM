import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState(null);
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

            const [userResponse, summaryResponse, ticketsResponse] =
                await Promise.all([
                    api.get("tickets/me/"),
                    api.get("tickets/dashboard-summary/"),
                    api.get("tickets/"),
                ]);

            setUser(userResponse.data);
            setSummary(summaryResponse.data);

            const ticketData = ticketsResponse.data;
            setTickets(
                Array.isArray(ticketData)
                    ? ticketData
                    : Array.isArray(ticketData?.results)
                    ? ticketData.results
                    : []
            );
        } catch (error) {
            console.error("Dashboard loading error:", error);
            setMessage("Unable to load Admin Dashboard. Please refresh.");
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
            HIGH: "admin-pill admin-pill-danger",
            MEDIUM: "admin-pill admin-pill-warning",
            LOW: "admin-pill admin-pill-success",
        };
        return classes[priority] || "admin-pill admin-pill-neutral";
    };

    const getStatusClass = (status) => {
        const classes = {
            OPEN: "admin-pill admin-pill-blue",
            IN_PROGRESS: "admin-pill admin-pill-warning",
            RESOLVED: "admin-pill admin-pill-success",
            CLOSED: "admin-pill admin-pill-neutral",
        };
        return classes[status] || "admin-pill admin-pill-neutral";
    };

    const stats = summary
        ? [
              { label: "Total Tickets", value: summary.total_tickets ?? 0, icon: "bi-ticket-detailed", tone: "blue" },
              { label: "Open", value: summary.open_tickets ?? 0, icon: "bi-inbox", tone: "purple" },
              { label: "In Progress", value: summary.in_progress_tickets ?? 0, icon: "bi-hourglass-split", tone: "orange" },
              { label: "Resolved", value: summary.resolved_tickets ?? 0, icon: "bi-check2-circle", tone: "green" },
              { label: "Closed", value: summary.closed_tickets ?? 0, icon: "bi-lock", tone: "slate" },
              { label: "Unassigned", value: summary.unassigned_tickets ?? 0, icon: "bi-person-exclamation", tone: "red" },
          ]
        : [];

    if (loading) {
        return (
            <div className="admin-loading-screen">
                <style>{adminStyles}</style>
                <div className="admin-loading-card">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h2>Preparing your dashboard</h2>
                    <p>Loading the latest CRM information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <style>{adminStyles}</style>

            <nav className="admin-topbar">
                <div className="admin-brand">
                    <span className="admin-brand-icon">Y</span>
                    <span className="admin-brand-name">YFI CRM</span>
                    <span className="admin-brand-label">ADMIN</span>
                </div>

                <div className="admin-user-area">
                    <div className="admin-avatar">
                        {(user?.username || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-user-details">
                        <strong>{user?.username || "Admin"}</strong>
                        <span>Administrator</span>
                    </div>
                    <button type="button" className="admin-logout-button" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            <main className="admin-main">
                <header className="admin-hero">
                    <div>
                        <div className="admin-eyebrow"><span /> ADMINISTRATION / OVERVIEW</div>
                        <h1>Admin Dashboard</h1>
                        <p>Monitor support activity and manage your CRM operations from one place.</p>
                    </div>
                    <button type="button" className="admin-refresh-button" onClick={loadDashboard}>
                        <i className="bi bi-arrow-clockwise" />
                        Refresh data
                    </button>
                </header>

                {message && (
                    <div className="admin-error-message" role="alert">
                        <i className="bi bi-exclamation-triangle" />
                        <span>{message}</span>
                        <button type="button" onClick={loadDashboard}>Try again</button>
                    </div>
                )}

                {summary && (
                    <section className="admin-stats-grid" aria-label="Ticket summary">
                        {stats.map((stat) => (
                            <article className={`admin-stat-card tone-${stat.tone}`} key={stat.label}>
                                <div className="admin-stat-top">
                                    <span className="admin-stat-label">{stat.label}</span>
                                    <span className="admin-stat-icon"><i className={`bi ${stat.icon}`} /></span>
                                </div>
                                <div className="admin-stat-bottom">
                                    <strong className="admin-stat-value">{stat.value}</strong>
                                    <span className="admin-stat-caption">Current total</span>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

                <section className="admin-panel admin-actions-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <span className="admin-section-kicker">SHORTCUTS</span>
                            <h2>Quick Actions</h2>
                            <p>Go directly to the tools you use most.</p>
                        </div>
                    </div>
                    <div className="admin-action-buttons">
                        <button type="button" className="admin-action-card admin-action-primary" onClick={() => navigate("/tickets")}>
                            <span className="admin-action-icon"><i className="bi bi-ticket-detailed" /></span>
                            <span className="admin-action-copy"><strong>Manage Tickets</strong><small>Review and update support tickets</small></span>
                            <i className="bi bi-arrow-up-right admin-action-arrow" />
                        </button>
                        <button type="button" className="admin-action-card admin-action-secondary" onClick={() => navigate("/user-management")}>
                            <span className="admin-action-icon"><i className="bi bi-people" /></span>
                            <span className="admin-action-copy"><strong>Manage Users</strong><small>Manage CRM accounts and roles</small></span>
                            <i className="bi bi-arrow-up-right admin-action-arrow" />
                        </button>
                    </div>
                </section>

                <section className="admin-panel admin-tickets-panel">
                    <div className="admin-panel-heading admin-ticket-heading">
                        <div>
                            <span className="admin-section-kicker">LATEST ACTIVITY</span>
                            <h2>Recent Tickets</h2>
                            <p>Latest tickets returned by your CRM.</p>
                        </div>
                        <button type="button" className="admin-view-all-button" onClick={() => navigate("/tickets")}>
                            View all tickets <i className="bi bi-arrow-up-right" />
                        </button>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon"><i className="bi bi-inbox" /></span>
                            <h3>No tickets found</h3>
                            <p>There are no tickets available right now.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-ticket-table">
                                <thead>
                                    <tr>
                                        <th>ID</th><th>Customer</th><th>Issue</th><th>Priority</th>
                                        <th>Status</th><th>Engineer</th><th>Created</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td className="admin-ticket-id">#{ticket.id}</td>
                                            <td className="admin-customer-name">{ticket.customer_name || "—"}</td>
                                            <td className="admin-issue-cell" title={ticket.issue_description || ""}>{ticket.issue_description || "—"}</td>
                                            <td><span className={getPriorityClass(ticket.priority)}>{ticket.priority || "—"}</span></td>
                                            <td><span className={getStatusClass(ticket.status)}>{(ticket.status || "UNKNOWN").replaceAll("_", " ")}</span></td>
                                            <td>{ticket.assigned_to?.username || <span className="admin-unassigned">Not assigned</span>}</td>
                                            <td>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"}</td>
                                            <td>
                                                <button type="button" className="admin-view-button" onClick={() => navigate(`/tickets/${ticket.id}`)}>
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

                <footer className="admin-footer">
                    <span><strong>YFI CRM</strong> <span className="admin-footer-dot">•</span> Customer Support Management</span>
                    <span>Admin workspace</span>
                </footer>
            </main>
        </div>
    );
}

const adminStyles = `
.admin-dashboard-page{min-height:100vh;background:#f4f7fc;color:#17233b;font-family:inherit}
.admin-topbar{height:76px;padding:0 clamp(18px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;border-bottom:1px solid #e7ecf4;box-shadow:0 4px 18px rgba(22,40,75,.035)}
.admin-brand,.admin-user-area{display:flex;align-items:center;gap:12px}
.admin-brand-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:linear-gradient(140deg,#2457df,#5285ff);color:#fff;font-weight:900;font-size:21px;box-shadow:0 5px 12px rgba(49,94,230,.24)}
.admin-brand-name{font-size:18px;font-weight:850;letter-spacing:-.5px;color:#17233b}
.admin-brand-label{padding:5px 8px;border-radius:6px;background:#edf2ff;color:#315bd7;font-size:10px;font-weight:800;letter-spacing:1px}
.admin-user-area{gap:11px}
.admin-avatar{width:39px;height:39px;display:grid;place-items:center;border-radius:50%;background:#e9efff;color:#315bd7;font-weight:800;border:1px solid #dbe5ff}
.admin-user-details{display:flex;flex-direction:column;gap:3px;min-width:100px}
.admin-user-details strong{font-size:13px;color:#1c2942}
.admin-user-details span{font-size:11px;color:#8994a8}
.admin-logout-button,.admin-refresh-button,.admin-view-all-button,.admin-view-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;cursor:pointer;transition:all .18s ease}
.admin-logout-button{border:1px solid #e1e7f0;background:#fff;color:#4a5870;border-radius:10px;padding:10px 13px;font-size:12px;margin-left:8px}
.admin-logout-button:hover{background:#fff2f1;border-color:#ffd6d1;color:#c53e36}
.admin-main{width:min(1480px,100%);margin:0 auto;padding:34px clamp(18px,4vw,56px) 22px}
.admin-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:27px;padding:27px 29px;border:1px solid #e3eaff;border-radius:18px;background:linear-gradient(115deg,#fff 0%,#f5f8ff 70%,#eef3ff 100%);box-shadow:0 7px 25px rgba(36,64,120,.045)}
.admin-eyebrow,.admin-section-kicker{display:flex;align-items:center;gap:8px;color:#5874bd;font-size:10px;font-weight:850;letter-spacing:1.5px;margin-bottom:10px}
.admin-eyebrow span{width:7px;height:7px;border-radius:50%;background:#4773ed;box-shadow:0 0 0 4px #e1e9ff}
.admin-hero h1{font-size:clamp(25px,3vw,32px);letter-spacing:-1px;font-weight:850;margin:0 0 7px;color:#182641}
.admin-hero p,.admin-panel-heading p{font-size:13px;line-height:1.6;color:#7b879b;margin:0}
.admin-refresh-button{flex-shrink:0;border:0;border-radius:10px;padding:12px 16px;background:#315fe5;color:#fff;font-size:12px;box-shadow:0 5px 13px rgba(49,95,229,.2)}
.admin-refresh-button:hover{background:#244dca;transform:translateY(-1px)}
.admin-stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:23px}
.admin-stat-card{position:relative;overflow:hidden;min-width:0;background:#fff;border:1px solid #e8edf5;border-radius:15px;padding:19px 20px 17px;box-shadow:0 5px 18px rgba(23,42,79,.035);transition:transform .18s ease,box-shadow .18s ease}
.admin-stat-card:before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--tone)}
.admin-stat-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(23,42,79,.075)}
.tone-blue{--tone:#4774ed;--tint:#edf2ff;--ink:#3865df}.tone-purple{--tone:#8960df;--tint:#f3edff;--ink:#8054d6}.tone-orange{--tone:#e99a39;--tint:#fff4e5;--ink:#ce7d1e}.tone-green{--tone:#28a879;--tint:#e7f8f0;--ink:#188c62}.tone-slate{--tone:#718096;--tint:#eef2f7;--ink:#536176}.tone-red{--tone:#e15c62;--tint:#fff0f0;--ink:#cf464d}
.admin-stat-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.admin-stat-label{font-size:12px;font-weight:700;color:#758198}
.admin-stat-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:var(--tint);color:var(--ink);font-size:17px}
.admin-stat-bottom{display:flex;align-items:baseline;gap:10px;margin-top:12px}
.admin-stat-value{font-size:30px;line-height:1.1;letter-spacing:-1px;font-weight:850;color:#1d2b45}
.admin-stat-caption{font-size:10px;color:#a0a9b8}
.admin-panel{background:#fff;border:1px solid #e6ebf3;border-radius:16px;padding:23px;margin-bottom:22px;box-shadow:0 5px 18px rgba(23,42,79,.03)}
.admin-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:19px}
.admin-section-kicker{margin-bottom:6px;font-size:9px}
.admin-panel-heading h2{font-size:18px;letter-spacing:-.4px;font-weight:800;color:#1b2943;margin:0 0 5px}
.admin-action-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.admin-action-card{display:flex;align-items:center;gap:13px;min-width:0;text-align:left;padding:16px;border-radius:13px;cursor:pointer;transition:all .18s ease}
.admin-action-primary{background:#f5f8ff;border:1px solid #e0e8ff}.admin-action-secondary{background:#f8f9fc;border:1px solid #e8ecf3}
.admin-action-card:hover{transform:translateY(-2px);box-shadow:0 7px 16px rgba(35,58,105,.07)}
.admin-action-icon{display:grid;place-items:center;flex-shrink:0;width:43px;height:43px;border-radius:12px;background:#e4ebff;color:#315fe5;font-size:19px}
.admin-action-secondary .admin-action-icon{background:#e9edf5;color:#52627e}
.admin-action-copy{display:flex;flex-direction:column;gap:5px;min-width:0}
.admin-action-copy strong{font-size:13px;color:#263650}.admin-action-copy small{font-size:11px;color:#8390a5}
.admin-action-arrow{margin-left:auto;color:#8290a8;font-size:15px}
.admin-view-all-button{border:1px solid #e1e7f1;background:#fff;color:#4866b7;border-radius:9px;padding:9px 11px;font-size:11px;white-space:nowrap}
.admin-view-all-button:hover{background:#f3f6ff;border-color:#d3defd}
.admin-table-wrapper{width:100%;overflow-x:auto;border:1px solid #edf0f5;border-radius:11px}
.admin-ticket-table{width:100%;min-width:940px;border-collapse:separate;border-spacing:0;font-size:12px}
.admin-ticket-table thead{background:#f7f9fd}
.admin-ticket-table th{padding:13px 14px;text-align:left;color:#78859a;font-size:10px;font-weight:800;letter-spacing:.45px;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid #e9edf4}
.admin-ticket-table td{padding:14px;border-bottom:1px solid #eff2f7;color:#56647a;vertical-align:middle;white-space:nowrap}
.admin-ticket-table tbody tr:last-child td{border-bottom:0}.admin-ticket-table tbody tr:hover{background:#fafbff}
.admin-ticket-id{font-weight:800;color:#4266ca!important}.admin-customer-name{font-weight:750;color:#273650!important}
.admin-issue-cell{max-width:210px;overflow:hidden;text-overflow:ellipsis}
.admin-pill{display:inline-flex;align-items:center;justify-content:center;padding:5px 8px;border-radius:6px;font-size:9px;font-weight:850;letter-spacing:.3px;white-space:nowrap}
.admin-pill-danger{background:#ffeded;color:#c94343}.admin-pill-warning{background:#fff3dc;color:#a66a0b}.admin-pill-success{background:#e4f8ef;color:#17815b}.admin-pill-blue{background:#e9efff;color:#345ed0}.admin-pill-neutral{background:#edf0f5;color:#5c687b}
.admin-unassigned{font-size:11px;color:#a0a8b5;font-style:italic}
.admin-view-button{border:1px solid #dce5ff;border-radius:8px;padding:7px 10px;background:#f4f7ff;color:#355fd1;font-size:11px;white-space:nowrap}
.admin-view-button:hover{background:#315fe5;color:#fff;border-color:#315fe5}
.admin-empty-state{text-align:center;padding:42px 16px}
.admin-empty-icon{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 12px;border-radius:16px;background:#f0f4ff;color:#6380d8;font-size:22px}
.admin-empty-state h3{font-size:15px;font-weight:800;color:#293751;margin:0 0 6px}.admin-empty-state p{font-size:12px;color:#8994a7;margin:0}
.admin-error-message{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:13px 15px;border:1px solid #ffd8d5;border-radius:10px;background:#fff4f3;color:#b23d38;font-size:12px}
.admin-error-message button{margin-left:auto;border:0;background:transparent;color:#a52e29;font-weight:800;cursor:pointer}
.admin-footer{display:flex;justify-content:space-between;gap:12px;padding:4px 2px 10px;color:#9aa4b4;font-size:10px}.admin-footer strong{color:#6c7890}.admin-footer-dot{padding:0 5px;color:#c0c8d4}
.admin-loading-screen{min-height:100vh;display:grid;place-items:center;background:#f4f7fc;padding:20px}.admin-loading-card{text-align:center;padding:35px 45px;background:#fff;border:1px solid #e6ebf3;border-radius:16px;box-shadow:0 8px 30px rgba(23,42,79,.06)}.admin-loading-card h2{font-size:17px;margin:16px 0 6px;color:#1d2b45}.admin-loading-card p{font-size:12px;color:#8994a7;margin:0}
@media(min-width:1200px){.admin-stats-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.admin-stat-card{padding:18px 15px}.admin-stat-value{font-size:27px}}
@media(max-width:760px){.admin-topbar{height:auto;min-height:70px;padding:14px 18px;flex-wrap:wrap}.admin-user-details{display:none}.admin-main{padding-top:20px}.admin-hero{align-items:flex-start;flex-direction:column;padding:21px}.admin-refresh-button{align-self:flex-start}.admin-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.admin-stat-card{padding:15px}.admin-stat-value{font-size:26px}.admin-action-buttons{grid-template-columns:1fr}.admin-panel{padding:17px}.admin-ticket-heading{align-items:flex-start}.admin-footer{flex-direction:column}}
@media(max-width:430px){.admin-brand{gap:8px}.admin-brand-name{font-size:16px}.admin-brand-label{font-size:9px}.admin-logout-button{padding:9px 10px}.admin-hero h1{font-size:25px}.admin-hero p{font-size:12px}.admin-stat-caption{display:none}.admin-panel-heading h2{font-size:16px}.admin-ticket-heading{flex-direction:column}.admin-view-all-button{align-self:flex-start}}
`;

export default AdminDashboard;
