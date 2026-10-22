import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ManagerDashboard() {
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
            const [userResponse, summaryResponse, ticketsResponse] = await Promise.all([
                api.get("tickets/me/"),
                api.get("tickets/dashboard-summary/"),
                api.get("tickets/"),
            ]);
            setUser(userResponse.data);
            setSummary(summaryResponse.data);
            setTickets(Array.isArray(ticketsResponse.data)
                ? ticketsResponse.data
                : ticketsResponse.data.results || []);
        } catch (error) {
            console.error(error);
            setMessage("Unable to load Manager Dashboard. Please refresh and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    };

    const priorityClass = (priority) => {
        switch (String(priority || "").toUpperCase()) {
            case "HIGH": return "yfi-badge priority-high";
            case "MEDIUM": return "yfi-badge priority-medium";
            case "LOW": return "yfi-badge priority-low";
            default: return "yfi-badge badge-neutral";
        }
    };

    const statusClass = (status) => {
        switch (String(status || "").toUpperCase()) {
            case "OPEN": return "yfi-badge status-open";
            case "IN_PROGRESS": return "yfi-badge status-progress";
            case "RESOLVED": return "yfi-badge status-resolved";
            case "CLOSED": return "yfi-badge status-closed";
            default: return "yfi-badge badge-neutral";
        }
    };

    const label = (value) => String(value || "Unknown").replaceAll("_", " ");

    const stats = summary ? [
        { label: "Total Tickets", value: summary.total_tickets ?? 0, icon: "bi-ticket-perforated", tone: "blue" },
        { label: "Open", value: summary.open_tickets ?? 0, icon: "bi-inbox", tone: "purple" },
        { label: "In Progress", value: summary.in_progress_tickets ?? 0, icon: "bi-arrow-repeat", tone: "orange" },
        { label: "Resolved", value: summary.resolved_tickets ?? 0, icon: "bi-check2-circle", tone: "green" },
        { label: "Closed", value: summary.closed_tickets ?? 0, icon: "bi-lock", tone: "slate" },
        { label: "Unassigned", value: summary.unassigned_tickets ?? 0, icon: "bi-person-exclamation", tone: "red" },
    ] : [];

    if (loading) {
        return (
            <div className="yfi-loading">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status" aria-label="Loading" />
                    <p className="text-muted mb-0">Loading Manager Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="yfi-manager">
            <style>{`
                .yfi-manager { min-height:100vh; background:var(--yfi-bg,#f5f7fb); color:var(--yfi-ink,#182230); }
                .yfi-loading { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--yfi-bg,#f5f7fb); }
                .yfi-topbar { min-height:76px; padding:14px clamp(16px,3vw,40px); background:#17233d; color:white; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; box-shadow:0 5px 22px #0f172a1f; }
                .yfi-brand { display:flex; align-items:center; gap:11px; color:white; font-size:21px; font-weight:800; letter-spacing:-.5px; }
                .yfi-brand-icon { width:38px; height:38px; display:grid; place-items:center; border-radius:12px; color:white; background:linear-gradient(135deg,#6d8bff,#3f5bd4); }
                .yfi-user-area { display:flex; align-items:center; gap:13px; }
                .yfi-avatar { width:36px; height:36px; border-radius:50%; display:grid; place-items:center; background:#2e405f; color:#dbe5ff; font-weight:800; }
                .yfi-role { display:block; color:#aab8d0; font-size:10px; letter-spacing:.8px; text-transform:uppercase; }
                .yfi-logout { border:1px solid #ffffff35; color:white; background:#ffffff12; border-radius:10px; padding:9px 14px; font-weight:700; }
                .yfi-logout:hover { background:#ffffff25; }
                .yfi-content { width:min(1600px,100%); margin:auto; padding:clamp(20px,3vw,38px); }
                .yfi-page-intro { position:relative; padding:24px 26px; margin-bottom:24px; border:1px solid #e5eaf4; border-radius:18px; background:linear-gradient(115deg,#fff 0%,#f7f9ff 100%); box-shadow:0 8px 26px #1c2c4a08; overflow:hidden; }
                .yfi-page-intro:after { content:""; position:absolute; right:-42px; top:-75px; width:190px; height:190px; border-radius:50%; background:#eaf0ff; opacity:.8; pointer-events:none; }
                .yfi-page-intro > * { position:relative; z-index:1; }
                .yfi-eyebrow { margin-bottom:8px; color:#526fe0; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.4px; }
                .yfi-title { margin:0 0 7px; font-size:clamp(25px,3vw,33px); font-weight:800; letter-spacing:-1px; }
                .yfi-subtitle { margin:0; color:var(--yfi-muted,#718096); font-size:14px; }
                .yfi-panel { height:100%; background:white; border:1px solid var(--yfi-border,#e7ebf2); border-radius:17px; box-shadow:0 8px 28px #1c2c4a0b; overflow:hidden; }
                .yfi-stat { position:relative; padding:19px; transition:transform .18s ease,box-shadow .18s ease; border-top:3px solid transparent; }
                .yfi-stat:before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--stat-accent,#3157d5); opacity:.9; }
                .yfi-stat:has(.tone-blue) { --stat-accent:#3157d5; } .yfi-stat:has(.tone-purple) { --stat-accent:#7754c8; } .yfi-stat:has(.tone-orange) { --stat-accent:#e69a25; } .yfi-stat:has(.tone-green) { --stat-accent:#16805d; } .yfi-stat:has(.tone-slate) { --stat-accent:#718096; } .yfi-stat:has(.tone-red) { --stat-accent:#cf3f53; }
                .yfi-stat:hover { transform:translateY(-3px); box-shadow:0 14px 30px #1c2c4a17; }
                .yfi-stat-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:19px; }
                .yfi-stat-label { margin:0; color:#718096; font-size:12px; font-weight:700; }
                .yfi-stat-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:13px; font-size:19px; }
                .tone-blue { color:#3157d5; background:#edf1ff; } .tone-purple { color:#7754c8; background:#f1edff; }
                .tone-orange { color:#b96b10; background:#fff3df; } .tone-green { color:#16805d; background:#e5f8ef; }
                .tone-slate { color:#536176; background:#edf1f5; } .tone-red { color:#cf3f53; background:#ffedf0; }
                .yfi-stat-value { margin:0; color:#1b2638; font-size:31px; line-height:1; font-weight:800; letter-spacing:-1px; }
                .yfi-panel-head { padding:19px 24px; display:flex; align-items:center; justify-content:space-between; gap:15px; flex-wrap:wrap; border-bottom:1px solid #edf0f5; }
                .yfi-panel-title { margin:0 0 5px; font-size:16px; font-weight:800; }
                .yfi-panel-note { margin:0; color:#718096; font-size:13px; }
                .yfi-action { padding:10px 15px; border-radius:10px; font-size:13px; font-weight:700; }
                .yfi-table { min-width:820px; margin:0; vertical-align:middle; }
                .yfi-table thead th { padding:15px 18px; background:#f8faff; color:#758198; border-bottom:1px solid #e9edf5; font-size:10px; font-weight:800; letter-spacing:.8px; text-transform:uppercase; white-space:nowrap; }
                .yfi-table tbody td { padding:15px 18px; border-color:#f0f2f7; color:#3c485b; font-size:13px; }
                .yfi-table tbody tr:hover { background:#fafbff; }
                .yfi-ticket-id { color:#3157d5; font-weight:800; white-space:nowrap; }
                .yfi-issue { max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .yfi-badge { display:inline-flex; align-items:center; padding:6px 9px; border-radius:7px; font-size:10px; font-weight:800; white-space:nowrap; }
                .priority-high { color:#b42335; background:#ffebee; } .priority-medium { color:#965d08; background:#fff3d8; }
                .priority-low { color:#13734f; background:#e4f8ed; } .status-open { color:#3157d5; background:#eaf0ff; }
                .status-progress { color:#965d08; background:#fff3d8; } .status-resolved { color:#13734f; background:#e4f8ed; }
                .status-closed,.badge-neutral { color:#536176; background:#edf1f5; }
                .yfi-action-strip { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:18px 22px; }
                .yfi-action-copy { display:flex; align-items:center; gap:14px; min-width:0; }
                .yfi-action-icon { width:44px; height:44px; flex:0 0 44px; display:grid; place-items:center; border-radius:13px; color:#3157d5; background:#edf1ff; font-size:20px; }
                .yfi-table tbody tr { transition:background .15s ease; }
                .yfi-empty { padding:54px 20px; text-align:center; }
                .yfi-empty-icon { width:52px; height:52px; margin:0 auto 14px; display:grid; place-items:center; border-radius:16px; background:#edf1ff; color:#3157d5; font-size:22px; }
                @media(max-width:640px) { .yfi-topbar { align-items:flex-start; } .yfi-user-area { width:100%; justify-content:space-between; } .yfi-content { padding:18px 12px; } .yfi-page-intro { padding:20px 17px; } .yfi-panel-head { padding:17px; } .yfi-stat { padding:16px; } .yfi-stat-value { font-size:28px; } .yfi-action-strip { align-items:flex-start; flex-direction:column; padding:17px; } .yfi-action-strip .btn { width:100%; } }
            `}</style>

            <nav className="yfi-topbar">
                <div className="yfi-brand">
                    <span className="yfi-brand-icon">Y</span>
                    <span>YFI CRM</span>
                </div>
                <div className="yfi-user-area">
                    <div className="d-flex align-items-center gap-2">
                        <span className="yfi-avatar">{(user?.username || "M").charAt(0).toUpperCase()}</span>
                        <div>
                            <div className="fw-bold">{user?.username || "Manager"}</div>
                            <span className="yfi-role">Manager workspace</span>
                        </div>
                    </div>
                    <button className="yfi-logout" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />Logout
                    </button>
                </div>
            </nav>

            <main className="yfi-content">
                <div className="yfi-page-intro d-flex justify-content-between align-items-center gap-3 flex-wrap">
                    <div>
                        <div className="yfi-eyebrow"><i className="bi bi-grid-1x2-fill me-2" aria-hidden="true" />Support operations</div>
                        <h1 className="yfi-title">Manager Dashboard</h1>
                        <p className="yfi-subtitle">Monitor tickets and manage daily support operations.</p>
                    </div>
                    <button className="btn btn-outline-primary yfi-action" onClick={loadDashboard}>
                        <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />Refresh data
                    </button>
                </div>

                {message && <div className="alert alert-danger mb-4" role="alert">{message}</div>}

                {summary && (
                    <section className="row g-3 g-xl-4 mb-4" aria-label="Ticket summary">
                        {stats.map((stat) => (
                            <div className="col-6 col-md-4 col-xl-2" key={stat.label}>
                                <div className="yfi-panel yfi-stat">
                                    <div className="yfi-stat-top">
                                        <p className="yfi-stat-label">{stat.label}</p>
                                        <span className={`yfi-stat-icon tone-${stat.tone}`}>
                                            <i className={`bi ${stat.icon}`} aria-hidden="true" />
                                        </span>
                                    </div>
                                    <p className="yfi-stat-value">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                <section className="yfi-panel yfi-action-strip mb-4">
                    <div className="yfi-action-copy">
                        <span className="yfi-action-icon"><i className="bi bi-kanban" aria-hidden="true" /></span>
                        <div>
                            <h2 className="yfi-panel-title">Manager actions</h2>
                            <p className="yfi-panel-note">Open and review support tickets assigned to your team.</p>
                        </div>
                    </div>
                    <button className="btn btn-primary yfi-action" onClick={() => navigate("/tickets")}>
                        <i className="bi bi-arrow-right-circle me-2" aria-hidden="true" />Manage tickets
                    </button>
                </section>

                <section className="yfi-panel">
                    <div className="yfi-panel-head">
                        <div>
                            <h2 className="yfi-panel-title">Support tickets</h2>
                            <p className="yfi-panel-note">
                                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} available in your dashboard.
                            </p>
                        </div>
                        <span className="badge rounded-pill text-bg-light border">
                            <i className="bi bi-shield-check me-1" aria-hidden="true" />Team overview
                        </span>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="yfi-empty">
                            <div className="yfi-empty-icon"><i className="bi bi-inbox" aria-hidden="true" /></div>
                            <h3 className="h6 fw-bold mb-2">No tickets found</h3>
                            <p className="text-muted mb-0">There are no tickets available to display right now.</p>
                        </div>
                    ) : (
                        <div className="table-responsive border-0 rounded-0">
                            <table className="table yfi-table align-middle">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th><th>Customer</th><th>Issue</th><th>Priority</th>
                                        <th>Status</th><th>Engineer</th><th>Created</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td><span className="yfi-ticket-id">#{ticket.id}</span></td>
                                            <td className="fw-semibold">{ticket.customer_name || "—"}</td>
                                            <td><div className="yfi-issue" title={ticket.issue_description || ""}>{ticket.issue_description || "No description"}</div></td>
                                            <td><span className={priorityClass(ticket.priority)}>{label(ticket.priority)}</span></td>
                                            <td><span className={statusClass(ticket.status)}>{label(ticket.status)}</span></td>
                                            <td>{ticket.assigned_to?.username || <span className="text-danger fw-semibold">Not assigned</span>}</td>
                                            <td className="text-nowrap">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("en-IN") : "—"}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-primary fw-bold" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                                    View <i className="bi bi-arrow-up-right ms-1" aria-hidden="true" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="text-center text-muted small mt-4">YFI CRM · Manager workspace</div>
            </main>
        </div>
    );
}

export default ManagerDashboard;
