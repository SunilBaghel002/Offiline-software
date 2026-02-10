import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  ArrowRight,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

// Stat Card Component
const StatCard = ({ title, value, trend, trendValue, icon: Icon, color }) => {
  const isPositive = trend === 'up';
  
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${color}`}>
          <Icon size={20} />
        </div>
        <button className="stat-card-menu">
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div className="stat-card-content">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-value">{value}</span>
      </div>
      <div className={`stat-card-trend ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{trendValue}% from yesterday</span>
      </div>
    </div>
  );
};



// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
          borderRadius: '8px', padding: '24px', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}>
          <XCircle size={24} color="#546E7A" />
        </button>
        
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
          Order #{order.order_number}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
           <div>
             <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Date & Time</div>
             <div style={{ fontWeight: '500' }}>{new Date(order.created_at).toLocaleString()}</div>
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Order Type</div>
             <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{order.order_type?.replace('_', ' ')}</div>
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Payment Type</div>
             <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{order.payment_method || '-'}</div>
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Status</div>
             <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{order.status}</div>
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Customer Name</div>
             <div style={{ fontWeight: '500' }}>{order.customer_name || 'Walk-in'}</div>
           </div>
           <div>
             <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Phone</div>
             <div style={{ fontWeight: '500' }}>{order.customer_phone || '-'}</div>
           </div>
        </div>

        <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#34495e' }}>Order Items</h3>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
             <thead style={{ background: '#f8f9fa' }}>
               <tr>
                 <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Item</th>
                 <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>Qty</th>
                 <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Price</th>
               </tr>
             </thead>
             <tbody>
               {order.items?.map((item, idx) => (
                 <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                   <td style={{ padding: '8px 12px' }}>{item.item_name || item.name}</td>
                   <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                   <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{(item.price || item.unit_price) * item.quantity}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '16px' }}>
           <span>Total Amount</span>
           <span style={{ color: '#27ae60' }}>₹{order.total_amount || 0}</span>
        </div>
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onClick }) => {
  const statusColors = {
    active: 'info',
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    completed: 'success',
    cancelled: 'danger',
    held: 'warning'
  };

  const statusIcons = {
    active: Clock,
    pending: AlertCircle,
    preparing: Clock,
    ready: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    held: AlertCircle
  };

  const StatusIcon = statusIcons[order.status] || AlertCircle;

  return (
    <div className="order-card" onClick={() => onClick(order)} style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
      <div className="order-card-header">
        <div className="order-card-info">
          <span className="order-card-number">#{order.order_number}</span>
          <span className={`order-card-type ${order.order_type}`}>
            {order.order_type.replace('_', ' ')}
          </span>
        </div>
        <span className={`order-card-status ${statusColors[order.status]}`}>
          <StatusIcon size={14} />
          {order.status}
        </span>
      </div>
      <div className="order-card-body">
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
            <div style={{ fontWeight: '600', color: '#333' }}>{order.customer_name || 'Walk-in'}</div>
            <div>{order.customer_phone || '-'}</div>
        </div>
        <div className="order-card-items">
          {order.items?.slice(0, 3).map((item, idx) => (
            <span key={idx} className="order-card-item">
              {item.quantity}x {item.item_name || item.name}
            </span>
          ))}
          {order.items?.length > 3 && (
            <span className="order-card-more">+{order.items.length - 3} more</span>
          )}
        </div>
      </div>
      <div className="order-card-footer">
        <span className="order-card-time">
          <Clock size={12} />
          {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="order-card-total">₹{order.total_amount?.toFixed(0) || 0}</span>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    activeOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);



  const loadDashboardData = async () => {
    try {
      // Load today's report using existing API
      // Use date-fns for consistent formatting matching ReportsPage
      const today = format(new Date(), 'yyyy-MM-dd');
      
      console.log('Fetching dashboard data for:', today);

      // Use reports:daily which exists in the backend
      const reportResult = await window.electronAPI.invoke('reports:daily', { date: today });
      
      if (reportResult) {
        const sales = reportResult.sales || {};
        setStats(prev => ({
          ...prev,
          todayRevenue: sales.total_revenue || 0,
          totalOrders: sales.total_orders || 0,
          avgOrderValue: sales.total_orders > 0 ? (sales.total_revenue / sales.total_orders) : 0,
        }));
      }

      // Load recent orders using order:getRecent (which includes items)
      console.log('Fetching recent orders...');
      const ordersResult = await window.electronAPI.invoke('order:getRecent', { limit: 8 });
      console.log('Recent orders result:', ordersResult);

      if (Array.isArray(ordersResult)) {
        setRecentOrders(ordersResult);
        // Count active orders (status is 'active' in DB, or 'pending'/'preparing'/'ready' conceptually)
        const activeCount = ordersResult.filter(o => 
          ['active', 'pending', 'preparing', 'ready', 'held'].includes(o.status)
        ).length;
        setStats(prev => ({ ...prev, activeOrders: activeCount }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Optional: alert(error.message); 
      // Set empty defaults on error
      setStats({
        todayRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        activeOrders: 0
      });
      setRecentOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          trend="up"
          trendValue="12.5"
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          trend="up"
          trendValue="8.2"
          icon={ShoppingCart}
          color="success"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${stats.avgOrderValue.toFixed(0)}`}
          trend="down"
          trendValue="3.1"
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          trend="up"
          trendValue="15.0"
          icon={Clock}
          color="info"
        />
      </div>

      {/* Recent Orders Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Orders</h2>
          <a href="/orders" className="section-link">
            View all <ArrowRight size={16} />
          </a>
        </div>
        <div className="orders-grid">
          {recentOrders.length > 0 ? (
            recentOrders.map(order => (
              <OrderCard key={order.id} order={order} onClick={setSelectedOrder} />
            ))
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <p>No orders today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
