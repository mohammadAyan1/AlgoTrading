import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
const modalOverlayStyle = {
    position: "fixed", inset: 0,
    background: "rgba(8, 8, 20, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease"
};

const modalStyle = {
    background: "linear-gradient(145deg, #0f0f1a, #1a1a2e)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "20px",
    padding: "48px 40px",
    width: "100%", maxWidth: "420px",
    boxShadow: "0 0 60px rgba(99,102,241,0.2), 0 25px 50px rgba(0,0,0,0.6)",
    animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    position: "relative", overflow: "hidden"
};

export default function LoginModal() {

    const navigate = useNavigate()

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [focusedField, setFocusedField] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleLogin = async () => {
        if (!userId || !password) return;

        const res = await api.post("/login-user", { userId, password })

        console.log('====================================');
        console.log(res);
        console.log('====================================');
        setLoading(true);
        setTimeout(() => { setLoading(false); setSuccess(true); navigate("/") }, 1800);
    };



    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@300;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:0.5 } }
        @keyframes checkDraw { from { stroke-dashoffset:50 } to { stroke-dashoffset:0 } }
        .login-input { width:100%; padding:14px 16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:15px; outline:none; box-sizing:border-box; transition:all 0.25s ease; }
        .login-input:focus { border-color:rgba(99,102,241,0.7); background:rgba(99,102,241,0.08); box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
        .login-input::placeholder { color:rgba(148,163,184,0.5); }
        .login-btn { width:100%; padding:15px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:white; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.25s ease; letter-spacing:0.3px; }
        .login-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 25px rgba(99,102,241,0.45); }
        .login-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .close-btn { position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.05); border:none; color:rgba(148,163,184,0.7); width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .close-btn:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }
      `}</style>

            <div style={modalOverlayStyle} onClick={(e) => e.target === e.currentTarget && setIsVisible(false)}>
                <div style={modalStyle}>
                    {/* Decorative blobs */}
                    <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "180px", height: "180px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

                    {/* <button className="close-btn" onClick={() => setIsVisible(false)}>×</button> */}

                    {success ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ width: "64px", height: "64px", background: "rgba(34,197,94,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <path d="M6 14l6 6 10-12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="0" style={{ animation: "checkDraw 0.5s ease forwards" }} />
                                </svg>
                            </div>
                            <h2 style={{ fontFamily: "'Sora',sans-serif", color: "#f1f5f9", fontSize: "22px", margin: "0 0 8px" }}>Welcome back!</h2>
                            <p style={{ color: "rgba(148,163,184,0.7)", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", margin: 0 }}>Login successful. Redirecting...</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div style={{ marginBottom: "36px" }}>
                                <div style={{ width: "44px", height: "44px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="white" />
                                    </svg>
                                </div>
                                <h1 style={{ fontFamily: "'Sora',sans-serif", color: "#f1f5f9", fontSize: "26px", fontWeight: 700, margin: "0 0 6px" }}>Sign In</h1>
                                <p style={{ color: "rgba(148,163,184,0.6)", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", margin: 0 }}>Enter your credentials to continue</p>
                            </div>

                            {/* Fields */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
                                <div>
                                    <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: "13px", fontWeight: 500, color: "rgba(148,163,184,0.8)", marginBottom: "8px", letterSpacing: "0.3px" }}>USER ID</label>
                                    <input className="login-input" type="text" placeholder="Enter your user ID" value={userId} onChange={e => setUserId(e.target.value)} onFocus={() => setFocusedField("userId")} onBlur={() => setFocusedField(null)} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: "13px", fontWeight: 500, color: "rgba(148,163,184,0.8)", marginBottom: "8px", letterSpacing: "0.3px" }}>PASSWORD</label>
                                    <input className="login-input" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                                </div>
                            </div>

                            {/* Button */}
                            <button className="login-btn" onClick={handleLogin} disabled={loading || !userId || !password}>
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : "Sign In"}
                            </button>

                            {/* <p style={{ textAlign: "center", marginTop: "20px", fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "rgba(148,163,184,0.45)" }}>
                                Forgot password? <span style={{ color: "#818cf8", cursor: "pointer" }}>Reset here</span>
                            </p> */}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}