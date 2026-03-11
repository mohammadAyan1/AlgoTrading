

import { ContractMasterProvider } from '../context/ContractMasterContext';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { WSProvider } from '../context/WSContext';
import LivePriceTicker from '../components/LivePriceTicker';
import CandlestickChart from '../components/CandlestickChart';
import OrderPanel from '../components/OrderPanel';
import ConditionalOrders from '../components/ConditionalOrders';
import ClientManager from '../components/ClientManager';
import Portfolio from '../components/Portfolio';
import {
  BarChart2, Users, Target, Briefcase, Settings,
  TrendingUp, Activity, Menu, X
} from 'lucide-react';
import { UserContext } from '../context/AuthContext';
import { useContext } from 'react';
import { useSearchParams, useLocation } from "react-router-dom";
import ProtectedComponents from './ProtectedComponents';
import api from '../services/api';


// const NAVITEMS = [
//   { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
//   { id: 'conditional', label: 'Conditional Orders', icon: Target },
//   { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
//   { id: 'clients', label: 'Clients', icon: Users },
// ];

export default function AuthComponents() {



  const [activeView, setActiveView] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('TATAMOTORS');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const [authcode, setAuthCode] = useState('');

  const [admin, setAdmin] = useState(false);


  const NAVITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },

    ...(admin
      ? [{ id: 'conditional', label: 'Conditional Orders', icon: Target }]
      : []),

    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'clients', label: 'Clients', icon: Users },
  ];


  const checkAuth = async () => {
    try {

      const res = await api.get("/auth", {
        withCredentials: true
      });
      console.log('====================================');
      console.log(res);
      console.log('====================================');
      if (res?.data?.success) {
        if (res?.data?.data?.role == "admin") {
          setAdmin(true)
        }
      }

    } catch (error) {
      console.log(error);

    }


  };

  useEffect(() => {
    checkAuth();
  }, []);


  const navStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 2,
    transition: 'all 0.2s',
    background: active ? '#312e81' : 'transparent',
    color: active ? '#a5b4fc' : '#64748b',
    fontWeight: active ? 600 : 400,
    fontSize: 13,
    border: 'none',
    width: '100%',
    textAlign: 'left',
  });


  const location = useLocation();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const authCode = searchParams.get("authCode");
    const userId = searchParams.get("userId");
    // setAuthCode(authCode)
    setActiveView("clients")
    console.log(authCode);
    console.log(userId);
  }, [location])


  return (
    <>


      <ContractMasterProvider>
        <WSProvider>

          {/* Main app container */}
          <div className="app-root">
            {/* Responsive styles injected directly */}
            <style>{`
            /* Base styles */
            .app-root {
              display: flex;
              height: 100vh;
              background: #020617;
              font-family: 'Inter', -apple-system, sans-serif;
              overflow: hidden;
            }

            /* Sidebar */
            .sidebar {
              background: #0f172a;
              border-right: 1px solid #1e293b;
              display: flex;
              flex-direction: column;
              transition: width 0.2s;
              flex-shrink: 0;
              width: 220px;
            }
            .sidebar.closed {
              width: 60px;
            }

            /* Main content area (center + right sidebar) */
            .main-wrapper {
              flex: 1;
              display: flex;
              overflow: hidden;
            }

            /* Center content (charts / pages) */
            .center-content {
              flex: 1;
              overflow-y: auto;
            }

            /* Right sidebar (market watch + order panel) */
            .right-sidebar {
              width: 280px;
              border-left: 1px solid #1e293b;
              display: flex;
              flex-direction: column;
              background: #0f172a;
              flex-shrink: 0;
            }

            /* Market watch and order panel containers */
            .market-watch {
              flex: 6;
              min-height: 0;
              overflow: hidden;
            }
            .order-panel {
              flex: 5;
              min-height: 0;
              border-top: 1px solid #1e293b;
              overflow: hidden;
            }

            /* ---------- Responsive breakpoints ---------- */

            /* Tablets (≤1024px) */
            @media (max-width: 1024px) {
              .sidebar {
                width: 200px;
              }
              .sidebar.closed {
                width: 60px;
              }
              .right-sidebar {
                width: 240px;
              }
            }

            /* Small screens (≤768px) – switch to bottom navigation */
            @media (max-width: 768px) {
              .app-root {
                flex-direction: column;
              }

              /* Sidebar becomes bottom navigation bar */
              .sidebar {
                width: 100% !important;
                height: auto;
                border-right: none;
                border-top: 1px solid #1e293b;
                flex-direction: row;
                align-items: center;
                padding: 4px 8px;
                order: 3; /* place at bottom */
              }
              .sidebar.closed {
                width: 100% !important;
              }

              /* Logo and collapse button hidden on mobile */
              .sidebar .logo-area {
                display: none;
              }

              /* Navigation items in a row */
              .sidebar nav {
                display: flex;
                flex-direction: row;
                justify-content: space-around;
                padding: 0;
                width: 100%;
              }
              .sidebar nav button {
                flex-direction: column;
                padding: 8px 4px;
                font-size: 11px;
                gap: 4px;
                margin-bottom: 0;
              }
              .sidebar nav button svg {
                width: 20px;
                height: 20px;
              }

              /* Hide status indicator on mobile */
              .sidebar .status-indicator {
                display: none;
              }

              /* Main wrapper stacks vertically */
              .main-wrapper {
                flex-direction: column;
                overflow: auto;
              }

              /* Center content takes full width */
              .center-content {
                width: 100%;
                overflow-y: visible;
              }

              /* Right sidebar becomes a tabbed panel below main content */
              .right-sidebar {
                width: 100%;
                border-left: none;
                border-top: 1px solid #1e293b;
                flex-direction: column;
              }

              /* Let market watch and order panel share height */
              .market-watch,
              .order-panel {
                flex: 1;
                min-height: 200px;
              }
            }

            /* Very small phones (≤480px) */
            @media (max-width: 480px) {
              .right-sidebar {
                flex-direction: column;
              }
              .market-watch,
              .order-panel {
                min-height: 180px;
              }
              .sidebar nav button {
                font-size: 10px;
                padding: 6px 2px;
              }
            }
          `}</style>

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
              {/* Logo area */}
              <div className="logo-area" style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid #1e293b'
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TrendingUp size={18} color="white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 14, lineHeight: 1 }}>
                      AliceTrade
                    </div>
                    <div style={{ color: '#6366f1', fontSize: 10, fontWeight: 600 }}>
                      MULTI-CLIENT
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 2
                  }}
                >
                  {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
                </button>
              </div>

              {/* Navigation items */}
              <nav style={{ padding: 8, flex: 1 }}>
                {NAVITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveView(id)}
                    style={navStyle(activeView === id)}
                  >
                    <Icon size={16} />
                    {sidebarOpen && label}
                  </button>
                ))}
              </nav>

              {/* Status indicator */}
              <div className="status-indicator" style={{
                padding: '12px 16px',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Activity size={12} color="#22c55e" />
                {sidebarOpen && <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
                  Markets Active
                </span>}
              </div>
            </div>

            {/* Main content + right sidebar wrapper */}
            <div className="main-wrapper">
              {/* Center content */}
              <div className="center-content">
                {activeView === 'dashboard' && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Top Bar */}
                    <div style={{
                      padding: '12px 20px',
                      background: '#0f172a',
                      borderBottom: '1px solid #1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}>
                      <BarChart2 size={16} color="#6366f1" />
                      <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Live Trading Dashboard</span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        Click any symbol in Market Watch to view its chart
                      </span>
                    </div>

                    {/* Chart area */}
                    <div style={{ flex: 1, padding: 16, minHeight: 0 }}>
                      <ProtectedComponents>
                        <CandlestickChart symbol={selectedSymbol} />
                      </ProtectedComponents>

                    </div>
                  </div>
                )}

                {activeView === 'conditional' && (
                  <ProtectedComponents>
                    <ConditionalOrders selectedSymbol={selectedSymbol} />
                  </ProtectedComponents>
                )}

                {activeView === 'portfolio' && (
                  <ProtectedComponents>
                    <Portfolio isAdmin={admin} />
                  </ProtectedComponents>
                )}
                {activeView === 'clients' && (
                  <ProtectedComponents>
                    <ClientManager />
                  </ProtectedComponents>
                )}
              </div>

              {/* Right sidebar (market watch + order panel) */}
              <div className="right-sidebar">
                <div className="market-watch">
                  <LivePriceTicker onSelectSymbol={setSelectedSymbol} />
                </div>
                <div className="order-panel">
                  {
                    admin && (
                      <OrderPanel selectedSymbol={selectedSymbol} />
                    )
                  }
                </div>
              </div>
            </div>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }
            }}
          />
        </WSProvider>
      </ContractMasterProvider>
    </>
  );
}
