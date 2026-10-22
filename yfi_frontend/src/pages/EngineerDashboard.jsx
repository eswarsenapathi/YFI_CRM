import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function EngineerDashboard() {
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
            console.error("Engineer dashboard loading error:", error);
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
            HIGH: "engineer-pill engineer-pill-danger",
            MEDIUM: "engineer-pill engineer-pill-warning",
            LOW: "engineer-pill engineer-pill-success",
        };
        return classes[priority] || "engineer-pill engineer-pill-neutral";
    };

    const getStatusClass = (status) => {
        const classes = {
            OPEN: "engineer-pill engineer-pill-blue",
            IN_PROGRESS: "engineer-pill engineer-pill-warning",
            RESOLVED: "engineer-pill engineer-pill-success",
            CLOSED: "engineer-pill engineer-pill-neutral",
        };
        return classes[status] || "engineer-pill engineer-pill-neutral";
    };

    const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgressCount = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const resolvedCount = tickets.filter((ticket) => ticket.status === "RESOLVED").length;
    const closedCount = tickets.filter((ticket) => ticket.status === "CLOSED").length;

    if (loading) {
        return (
            <div className="engineer-loading-screen">
                <style>{engineerStyles}</style>
                <div className="engineer-loading-card">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h2>Preparing your workspace</h2>
                    <p>Loading your assigned tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="engineer-dashboard-page">
            <style>{engineerStyles}</style>

            <nav className="engineer-topbar">
                <div className="engineer-brand">
                    <span className="engineer-brand-icon">Y</span>
                    <span className="engineer-brand-name">YFI CRM</span>
                    <span className="engineer-brand-label">ENGINEER</span>
                </div>

                <div className="engineer-user-area">
                    <div className="engineer-avatar">
                        {(user?.username || "E").charAt(0).toUpperCase()}
                    </div>
                    <div className="engineer-user-details">
                        <strong>{user?.username || "Engineer"}</strong>
                        <span>Support Engineer</span>
                    </div>
                    <button type="button" className="engineer-logout-button" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            <main className="engineer-main">
                <header className="engineer-hero">
                    <div>
                        <div className="engineer-eyebrow"><span /> ENGINEER WORKSPACE</div>
                        <h1>Engineer Dashboard</h1>
                        <p>Track your assigned support tickets and review their current status.</p>
                    </div>
                    <button type="button" className="engineer-refresh-button" onClick={loadDashboard}>
                        <i className="bi bi-arrow-clockwise" />
                        Refresh tickets
                    </button>
                </header>

                {message && (
                    <div className="engineer-error-message" role="alert">
                        <i className="bi bi-exclamation-triangle" />
                        <span>{message}</span>
                        <button type="button" onClick={loadDashboard}>Try again</button>
                    </div>
                )}

                <section className="engineer-stats-grid" aria-label="Assigned ticket summary">
                    <article className="engineer-stat-card tone-blue">
                        <div className="engineer-stat-top"><span>Assigned Tickets</span><i className="bi bi-ticket-detailed" /></div>
                        <strong>{tickets.length}</strong>
                        <small>Total tickets in your list</small>
                    </article>
                    <article className="engineer-stat-card tone-orange">
                        <div className="engineer-stat-top"><span>Open</span><i className="bi bi-inbox" /></div>
                        <strong>{openCount}</strong>
                        <small>Waiting to be started</small>
                    </article>
                    <article className="engineer-stat-card tone-purple">
                        <div className="engineer-stat-top"><span>In Progress</span><i className="bi bi-hourglass-split" /></div>
                        <strong>{inProgressCount}</strong>
                        <small>Currently being handled</small>
                    </article>
                    <article className="engineer-stat-card tone-green">
                        <div className="engineer-stat-top"><span>Resolved</span><i className="bi bi-check2-circle" /></div>
                        <strong>{resolvedCount}</strong>
                        <small>Successfully resolved</small>
                    </article>
                </section>

                <section className="engineer-panel">
                    <div className="engineer-panel-heading">
                        <div>
                            <span className="engineer-section-kicker">YOUR WORK QUEUE</span>
                            <h2>Assigned Tickets</h2>
                            <p>Tickets currently returned by your account.</p>
                        </div>
                        <span className="engineer-ticket-count">{tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}</span>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="engineer-empty-state">
                            <span className="engineer-empty-icon"><i className="bi bi-inbox" /></span>
                            <h3>No tickets assigned</h3>
                            <p>New tickets assigned to you will appear here.</p>
                            <button type="button" className="engineer-empty-refresh" onClick={loadDashboard}>
                                <i className="bi bi-arrow-clockwise" /> Check again
                            </button>
                        </div>
                    ) : (
                        <div className="engineer-table-wrapper">
                            <table className="engineer-ticket-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer</th>
                                        <th>Issue</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td className="engineer-ticket-id">#{ticket.id}</td>
                                            <td className="engineer-customer-name">{ticket.customer_name || "—"}</td>
                                            <td className="engineer-issue-cell" title={ticket.issue_description || ""}>{ticket.issue_description || "—"}</td>
                                            <td><span className={getPriorityClass(ticket.priority)}>{ticket.priority || "—"}</span></td>
                                            <td><span className={getStatusClass(ticket.status)}>{(ticket.status || "UNKNOWN").replaceAll("_", " ")}</span></td>
                                            <td>
                                                <button type="button" className="engineer-view-button" onClick={() => navigate(`/tickets/${ticket.id}`)}>
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

                <footer className="engineer-footer">
                    <span><strong>YFI CRM</strong> <span className="engineer-footer-dot">•</span> Customer Support Management</span>
                    <span>Engineer workspace</span>
                </footer>
            </main>
        </div>
    );
}

const engineerStyles = `
.engineer-dashboard-page{min-height:100vh;background:#f4f7fc;color:#17233b;font-family:inherit}
.engineer-topbar{min-height:76px;padding:0 clamp(18px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;border-bottom:1px solid #e7ecf4;box-shadow:0 4px 18px rgba(22,40,75,.035)}
.engineer-brand,.engineer-user-area{display:flex;align-items:center;gap:12px}
.engineer-brand-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:linear-gradient(140deg,#2457df,#5285ff);color:#fff;font-weight:900;font-size:21px;box-shadow:0 5px 12px rgba(49,94,230,.24)}
.engineer-brand-name{font-size:18px;font-weight:850;letter-spacing:-.5px;color:#17233b}
.engineer-brand-label{padding:5px 8px;border-radius:6px;background:#edf2ff;color:#315bd7;font-size:10px;font-weight:800;letter-spacing:1px}
.engineer-user-area{gap:11px}
.engineer-avatar{width:39px;height:39px;display:grid;place-items:center;border-radius:50%;background:#e9efff;color:#315bd7;font-weight:800;border:1px solid #dbe5ff}
.engineer-user-details{display:flex;flex-direction:column;gap:3px;min-width:100px}
.engineer-user-details strong{font-size:13px;color:#1c2942}
.engineer-user-details span{font-size:11px;color:#8994a8}
.engineer-logout-button,.engineer-refresh-button,.engineer-view-button,.engineer-empty-refresh{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;cursor:pointer;transition:all .18s ease}
.engineer-logout-button{border:1px solid #e1e7f0;background:#fff;color:#4a5870;border-radius:10px;padding:10px 13px;font-size:12px;margin-left:8px}
.engineer-logout-button:hover{background:#fff2f1;border-color:#ffd6d1;color:#c53e36}
.engineer-main{width:min(1440px,100%);margin:0 auto;padding:34px clamp(18px,4vw,56px) 22px}
.engineer-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:24px;padding:27px 29px;border:1px solid #e3eaff;border-radius:18px;background:linear-gradient(115deg,#fff 0%,#f5f8ff 70%,#eef3ff 100%);box-shadow:0 7px 25px rgba(36,64,120,.045)}
.engineer-eyebrow,.engineer-section-kicker{display:flex;align-items:center;gap:8px;color:#5874bd;font-size:10px;font-weight:850;letter-spacing:1.5px;margin-bottom:10px}
.engineer-eyebrow span{width:7px;height:7px;border-radius:50%;background:#4773ed;box-shadow:0 0 0 4px #e1e9ff}
.engineer-hero h1{font-size:clamp(25px,3vw,32px);letter-spacing:-1px;font-weight:850;margin:0 0 7px;color:#182641}
.engineer-hero p,.engineer-panel-heading p{font-size:13px;line-height:1.6;color:#7b879b;margin:0}
.engineer-refresh-button{flex-shrink:0;border:0;border-radius:10px;padding:12px 16px;background:#315fe5;color:#fff;font-size:12px;box-shadow:0 5px 13px rgba(49,95,229,.2)}
.engineer-refresh-button:hover{background:#244dca;transform:translateY(-1px)}
.engineer-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:22px}
.engineer-stat-card{position:relative;overflow:hidden;min-width:0;background:#fff;border:1px solid #e8edf5;border-radius:15px;padding:19px 20px 17px;box-shadow:0 5px 18px rgba(23,42,79,.035);transition:transform .18s ease,box-shadow .18s ease}
.engineer-stat-card:before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--tone)}
.engineer-stat-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(23,42,79,.075)}
.tone-blue{--tone:#4774ed;--tint:#edf2ff;--ink:#3865df}.tone-purple{--tone:#8960df;--tint:#f3edff;--ink:#8054d6}.tone-orange{--tone:#e99a39;--tint:#fff4e5;--ink:#ce7d1e}.tone-green{--tone:#28a879;--tint:#e7f8f0;--ink:#188c62}
.engineer-stat-top{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#758198;font-size:12px;font-weight:700}
.engineer-stat-top i{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--tint);color:var(--ink);font-size:17px;font-style:normal}
.engineer-stat-card>strong{display:block;margin-top:13px;font-size:30px;line-height:1.1;letter-spacing:-1px;font-weight:850;color:#1d2b45}
.engineer-stat-card>small{display:block;margin-top:8px;font-size:10px;color:#a0a9b8}
.engineer-panel{background:#fff;border:1px solid #e6ebf3;border-radius:16px;padding:23px;margin-bottom:22px;box-shadow:0 5px 18px rgba(23,42,79,.03)}
.engineer-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:19px}
.engineer-section-kicker{margin-bottom:6px;font-size:9px}
.engineer-panel-heading h2{font-size:18px;letter-spacing:-.4px;font-weight:800;color:#1b2943;margin:0 0 5px}
.engineer-ticket-count{flex-shrink:0;padding:7px 10px;border:1px solid #e1e8fb;border-radius:8px;background:#f3f6ff;color:#4665bb;font-size:11px;font-weight:800}
.engineer-table-wrapper{width:100%;overflow-x:auto;border:1px solid #edf0f5;border-radius:11px}
.engineer-ticket-table{width:100%;min-width:720px;border-collapse:separate;border-spacing:0;font-size:12px}
.engineer-ticket-table thead{background:#f7f9fd}
.engineer-ticket-table th{padding:13px 14px;text-align:left;color:#78859a;font-size:10px;font-weight:800;letter-spacing:.45px;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid #e9edf4}
.engineer-ticket-table td{padding:14px;border-bottom:1px solid #eff2f7;color:#56647a;vertical-align:middle;white-space:nowrap}
.engineer-ticket-table tbody tr:last-child td{border-bottom:0}.engineer-ticket-table tbody tr:hover{background:#fafbff}
.engineer-ticket-id{font-weight:800;color:#4266ca!important}.engineer-customer-name{font-weight:750;color:#273650!important}
.engineer-issue-cell{max-width:250px;overflow:hidden;text-overflow:ellipsis}
.engineer-pill{display:inline-flex;align-items:center;justify-content:center;padding:5px 8px;border-radius:6px;font-size:9px;font-weight:850;letter-spacing:.3px;white-space:nowrap}
.engineer-pill-danger{background:#ffeded;color:#c94343}.engineer-pill-warning{background:#fff3dc;color:#a66a0b}.engineer-pill-success{background:#e4f8ef;color:#17815b}.engineer-pill-blue{background:#e9efff;color:#345ed0}.engineer-pill-neutral{background:#edf0f5;color:#5c687b}
.engineer-view-button{border:1px solid #dce5ff;border-radius:8px;padding:7px 10px;background:#f4f7ff;color:#355fd1;font-size:11px;white-space:nowrap}
.engineer-view-button:hover{background:#315fe5;color:#fff;border-color:#315fe5}
.engineer-empty-state{text-align:center;padding:42px 16px}
.engineer-empty-icon{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 12px;border-radius:16px;background:#f0f4ff;color:#6380d8;font-size:22px}
.engineer-empty-state h3{font-size:15px;font-weight:800;color:#293751;margin:0 0 6px}.engineer-empty-state p{font-size:12px;color:#8994a7;margin:0 0 16px}
.engineer-empty-refresh{border:1px solid #dce5ff;border-radius:8px;padding:9px 12px;background:#f4f7ff;color:#355fd1;font-size:11px}
.engineer-error-message{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:13px 15px;border:1px solid #ffd8d5;border-radius:10px;background:#fff4f3;color:#b23d38;font-size:12px}
.engineer-error-message button{margin-left:auto;border:0;background:transparent;color:#a52e29;font-weight:800;cursor:pointer}
.engineer-footer{display:flex;justify-content:space-between;gap:12px;padding:4px 2px 10px;color:#9aa4b4;font-size:10px}.engineer-footer strong{color:#6c7890}.engineer-footer-dot{padding:0 5px;color:#c0c8d4}
.engineer-loading-screen{min-height:100vh;display:grid;place-items:center;background:#f4f7fc;padding:20px}.engineer-loading-card{text-align:center;padding:35px 45px;background:#fff;border:1px solid #e6ebf3;border-radius:16px;box-shadow:0 8px 30px rgba(23,42,79,.06)}.engineer-loading-card h2{font-size:17px;margin:16px 0 6px;color:#1d2b45}.engineer-loading-card p{font-size:12px;color:#8994a7;margin:0}
@media(max-width:900px){.engineer-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.engineer-topbar{padding:14px 18px;flex-wrap:wrap}.engineer-user-details{display:none}.engineer-main{padding-top:20px}.engineer-hero{align-items:flex-start;flex-direction:column;padding:21px}.engineer-refresh-button{align-self:flex-start}.engineer-panel{padding:17px}.engineer-panel-heading{align-items:flex-start}.engineer-footer{flex-direction:column}}
@media(max-width:430px){.engineer-brand{gap:8px}.engineer-brand-name{font-size:16px}.engineer-brand-label{font-size:9px}.engineer-logout-button{padding:9px 10px}.engineer-hero h1{font-size:25px}.engineer-hero p{font-size:12px}.engineer-stat-card{padding:14px}.engineer-stat-card>strong{font-size:26px}.engineer-stat-card>small{font-size:9px}.engineer-panel-heading h2{font-size:16px}}
`;

export default EngineerDashboard;