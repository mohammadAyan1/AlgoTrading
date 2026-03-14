

import React, { useState, useEffect } from 'react';
import { clientAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, RefreshCw, Link, Check, X, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { useContext } from "react"
// import { UserContext } from "../context/AuthContext";
// Base styles (will be supplemented by responsive CSS)
const styles = {
  card: { background: '#1e293b', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #334155' },
  input: {
    background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
    padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box',
    outline: 'none'
  },
  btn: (color = '#6366f1') => ({
    background: color, color: 'white', border: 'none', borderRadius: 6,
    padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6
  }),
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 4, display: 'block' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
};

function SessionBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: isActive ? '#14532d' : '#450a0a',
      color: isActive ? '#22c55e' : '#ef4444'
    }}>
      {isActive ? '● Active' : '○ Inactive'}
    </span>
  );
}

export default function ClientManager({ authCodeFromPath, isAdmin }) {

  // const { authModal, setAuthModal } = useContext(UserContext);

  const navigate = useNavigate()

  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [authCode, setAuthCode] = useState('');
  const [form, setForm] = useState({ name: '', user_id: '', app_code: '', api_secret: '', client_password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthCode(authCodeFromPath)
    const user = JSON.parse(localStorage.getItem("modelIdName"))
    console.log(user)
    setAuthModal(user)
  }, [authCodeFromPath])

  const loadClients = async () => {
    try {
      const res = await clientAPI.getSessions();

      console.log(res);

      console.log(res?.data?.data);

      setClients(res.data.data);

    } catch (e) {
      toast.error('Failed to load clients');
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.user_id || !form.app_code || !form.api_secret || !form?.client_password) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await clientAPI.create(form);
      toast.success('Client added!');
      setForm({ name: '', user_id: '', app_code: '', api_secret: '', client_password: '' });
      setShowForm(false);
      loadClients();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add client');
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete client "${name}"?`)) return;
    try {
      await clientAPI.delete(id);
      toast.success('Client deleted');
      loadClients();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const handleGetLoginUrl = async (id, name) => {
    try {
      const res = await clientAPI.getLoginUrl(id);
      const url = res.data.data.loginUrl;
      window.open(url, '_blank');
      setAuthModal({ id, name });
      console.log(id);
      console.log(name)
      const userData = {
        id,
        name
      }
      localStorage.setItem("modelIdName", JSON.stringify(userData))
    } catch (e) {
      toast.error('Failed to get login URL');
      console.log(e);

    }
  };

  const handleActivateSession = async () => {
    if (!authCode.trim()) { toast.error('Enter auth code'); return; }
    try {
      await clientAPI.activateSession(authModal.id, authCode.trim());
      toast.success(`Session activated for ${authModal.name}!`);
      setAuthModal(null);
      setAuthCode('');
      loadClients();
      localStorage.removeItem("modelIdName")
      // navigate("/", { state: { showModal: true } });
      navigate("/")
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to activate session');
    }
  };

  return (
    <div className="client-manager">
      <style>{`
        .client-manager {
          padding: 20px;
        }

        /* Header */
        .cm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .cm-header-left h2 {
          color: #e2e8f0;
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }
        .cm-header-left p {
          color: #64748b;
          margin: 4px 0 0;
          font-size: 13px;
        }
        .cm-header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Add client form */
        .cm-form-card {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid #6366f1;
        }
        .cm-form-title {
          color: #e2e8f0;
          margin: 0 0 16px;
          font-size: 15px;
        }
        .cm-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .cm-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        /* Client cards */
        .cm-card {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid #334155;
        }
        .cm-card-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .cm-card-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cm-card-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cm-card-details {
          min-width: 160px;
        }
        .cm-card-name {
          color: #e2e8f0;
          font-weight: 600;
        }
        .cm-card-userid {
          color: #64748b;
          font-size: 12px;
        }
        .cm-card-expiry {
          color: #64748b;
          font-size: 11px;
        }
        .cm-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Auth modal */
        .cm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .cm-modal {
          background: #1e293b;
          border-radius: 12px;
          padding: 28px;
          width: 100%;
          max-width: 420px;
          border: 1px solid #334155;
        }

        /* Empty state */
        .cm-empty {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cm-form-grid {
            grid-template-columns: 1fr;
          }
          .cm-card-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .cm-card-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .cm-modal {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .client-manager {
            padding: 12px;
          }
          .cm-header-left h2 {
            font-size: 18px;
          }
          .cm-header-left p {
            font-size: 12px;
          }
          .cm-header-actions button {
            padding: 6px 10px;
            font-size: 12px;
          }
          .cm-card-avatar {
            width: 32px;
            height: 32px;
          }
          .cm-card-name {
            font-size: 14px;
          }
          .cm-card-userid,
          .cm-card-expiry {
            font-size: 10px;
          }
          .cm-card-actions button {
            padding: 6px 10px;
            font-size: 12px;
          }
          .cm-modal {
            padding: 16px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="cm-header">
        <div className="cm-header-left">
          <h2>Client Manager</h2>
          <p>Manage multiple Alice Blue trading accounts</p>
        </div>
        <div className="cm-header-actions">
          <button onClick={loadClients} style={styles.btn('#334155')}>
            <RefreshCw size={14} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} style={styles.btn()}>
              <Plus size={14} /> Add Client
            </button>
          )
          }
        </div>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div className="cm-form-card">
          <h3 className="cm-form-title">New Client</h3>
          <div className="cm-form-grid">
            {[
              ['Client Name', 'name', 'text', 'e.g. Rahul Sharma'],
              ['User ID (Alice Blue ID)', 'user_id', 'text', 'e.g. AB12345'],
              ['App Code', 'app_code', 'text', 'From Alice Blue developer portal'],
              ['API Secret', 'api_secret', 'password', 'Keep this confidential'],
              ['Client Password', 'client_password', 'password', 'Client Login Password']
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label style={styles.label}>{label}</label>
                <input
                  style={styles.input} type={type} placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="cm-form-actions">
            <button onClick={handleSubmit} disabled={loading} style={styles.btn('#22c55e')}>
              <Check size={14} /> {loading ? 'Saving...' : 'Save Client'}
            </button>
            <button onClick={() => { setShowForm(false), localStorage.removeItem("modelIdName") }} style={styles.btn('#ef4444')}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="cm-empty">
          <User size={40} color="#334155" style={{ marginBottom: 12 }} />
          <p>No clients added yet. Add your first client above.</p>
        </div>
      ) : (
        <div>
          {clients.map(client => (
            <div key={client.id} className="cm-card">
              <div className="cm-card-row">
                <div className="cm-card-info">
                  <div className="cm-card-avatar">
                    <User size={18} color="#94a3b8" />
                  </div>
                  <div className="cm-card-details">
                    <div className="cm-card-name">{client.name}</div>
                    <div className="cm-card-userid">ID: {client.user_id}</div>
                    {client.session_expires_at && (
                      <div className="cm-card-expiry">
                        Expires: {new Date(client.session_expires_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="cm-card-actions">
                  <SessionBadge status={client.session_status} />
                  <button
                    onClick={() => handleGetLoginUrl(client.id, client.name)}
                    style={styles.btn('#0ea5e9')}
                    title="Login to Alice Blue & get auth code"
                  >
                    <Link size={12} /> Login
                  </button>
                  <button onClick={() => handleDelete(client.id, client.name)} style={styles.btn('#ef4444')}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auth Code Modal */}
      {authModal && (
        <div className="cm-modal-overlay">
          <div className="cm-modal">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={20} color="#6366f1" />
              <h3 style={{ color: '#e2e8f0', margin: 0 }}>Activate Session - {authModal.name}</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
              After logging in through the Alice Blue page that opened, copy the <strong style={{ color: '#6366f1' }}>authCode</strong> from the redirect URL and paste it below.
            </p>
            <label style={styles.label}>Auth Code (from redirect URL)</label>
            <input
              style={styles.input} type="text" placeholder="Paste authCode here..."
              value={authCode} onChange={e => setAuthCode(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={handleActivateSession} style={styles.btn('#22c55e')}>
                <Check size={14} /> Activate
              </button>
              <button onClick={() => { setAuthModal(null); setAuthCode(''); }} style={styles.btn('#ef4444')}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}