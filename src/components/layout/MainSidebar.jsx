import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  ClipboardList,
  Package,
  BarChart3,
  Users,
  Settings,
  ChefHat,
  X,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const MainSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'POS / Billing', badge: null },
    { path: '/orders', icon: ClipboardList, label: 'Orders', badge: 3 },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/kot', icon: ChefHat, label: 'Kitchen (KOT)' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`pos-drawer-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
        style={{ zIndex: 1000 }}
      ></div>

      {/* Sidebar Drawer */}
      <aside 
        className={`pos-main-sidebar ${isOpen ? 'active' : ''}`}
        style={{
            position: 'fixed',
            top: 0,
            left: isOpen ? 0 : '-280px',
            width: '280px',
            height: '100vh',
            background: '#1A2327', // Darker theme
            color: 'white',
            zIndex: 1001,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #37474F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#D32F2F', padding: '8px', borderRadius: '8px' }}>
                    <UtensilsCrossed size={24} color="white" />
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>PetPooja</div>
                    <div style={{ fontSize: '12px', color: '#90A4AE' }}>POS System</div>
                </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#90A4AE', cursor: 'pointer' }}>
                <X size={24} />
            </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
            {navItems.map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => 
                 isActive ? 'active-nav-link' : ''
                }
                style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 24px',
                    color: isActive ? 'white' : '#B0BEC5',
                    textDecoration: 'none',
                    background: isActive ? '#D32F2F' : 'transparent',
                    borderLeft: isActive ? '4px solid #FFC107' : '4px solid transparent',
                    transition: 'all 0.2s'
                })}
            >
                <item.icon size={20} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                {item.badge && (
                <span style={{ marginLeft: 'auto', background: '#D32F2F', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                    {item.badge}
                </span>
                )}
            </NavLink>
            ))}
        </nav>

        {/* User Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #37474F', background: '#263238' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#455A64', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{user?.username || 'User'}</div>
                    <div style={{ fontSize: '12px', color: '#B0BEC5' }}>{user?.role || 'Staff'}</div>
                </div>
            </div>
            <button 
                onClick={() => { logout(); onClose(); }}
                style={{ width: '100%', padding: '10px', background: '#37474F', border: 'none', borderRadius: '4px', color: '#CFD8DC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
                <LogOut size={16} /> Logout
            </button>
        </div>
      </aside>
    </>
  );
};

export default MainSidebar;
