import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  ChefHat,
  BarChart3,
  Users,
  Settings,
  LogOut,
  FileText,
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    // Get app version
    window.electronAPI.invoke('app:getVersion').then(setAppVersion);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/pos', icon: LayoutDashboard, label: 'POS', roles: ['admin', 'cashier'] },
    { to: '/orders', icon: FileText, label: 'Orders', roles: ['admin', 'cashier'] },
    { to: '/menu', icon: UtensilsCrossed, label: 'Menu', roles: ['admin'] },
    { to: '/inventory', icon: Package, label: 'Inventory', roles: ['admin'] },
    { to: '/kot', icon: ChefHat, label: 'Kitchen', roles: ['admin', 'cashier', 'kitchen'] },
    { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
    { to: '/users', icon: Users, label: 'Staff', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(
    item => item.roles.includes(user?.role)
  );

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <UtensilsCrossed size={28} />
            <span>Restaurant POS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ 
            padding: 'var(--spacing-2)', 
            background: 'var(--success-50)', 
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-3)'
          }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success-600)' }}>Offline Mode</div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
            v{appVersion}
          </div>

          <button className="btn btn-ghost w-full" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <span style={{ fontWeight: 600 }}>Welcome, </span>
            <span>{user?.fullName}</span>
            <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>
              {user?.role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Current Time */}
            <CurrentTime />
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Current time component
const CurrentTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ fontWeight: 500, color: 'var(--gray-600)' }}>
      {time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}
    </div>
  );
};

export default Layout;
