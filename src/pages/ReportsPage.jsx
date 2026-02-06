import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportType, setReportType] = useState('daily');
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [selectedDate, reportType]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      if (reportType === 'daily') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const result = await window.electronAPI.invoke('reports:daily', { date: dateStr });
        setDailyData(result);
      } else {
        const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const result = await window.electronAPI.invoke('reports:weekly', { startDate: weekStart });
        setWeeklyData(result);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const days = reportType === 'daily' ? 1 : 7;
    setSelectedDate(prev => 
      direction === 'prev' ? subDays(prev, days) : addDays(prev, days)
    );
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      if (reportType === 'daily' && dailyData) {
        // Export daily sales summary
        const summaryData = [{
          'Date': format(selectedDate, 'yyyy-MM-dd'),
          'Total Revenue': dailyData.sales?.total_revenue || 0,
          'Total Orders': dailyData.sales?.total_orders || 0,
          'Cash Amount': dailyData.sales?.cash_amount || 0,
          'Card Amount': dailyData.sales?.card_amount || 0,
          'UPI Amount': dailyData.sales?.upi_amount || 0,
        }];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Daily Summary');
        
        // Export orders
        if (dailyData.orders?.length > 0) {
          const ordersData = dailyData.orders.map(order => ({
            'Order #': order.order_number,
            'Time': new Date(order.created_at).toLocaleTimeString(),
            'Type': order.order_type,
            'Payment': order.payment_method,
            'Amount': order.total_amount
          }));
          const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
          XLSX.utils.book_append_sheet(wb, ordersSheet, 'Orders');
        }
        
        // Export top items
        if (dailyData.topItems?.length > 0) {
          const topItemsData = dailyData.topItems.map(item => ({
            'Item Name': item.item_name,
            'Quantity Sold': item.total_quantity,
            'Revenue': item.total_revenue
          }));
          const topItemsSheet = XLSX.utils.json_to_sheet(topItemsData);
          XLSX.utils.book_append_sheet(wb, topItemsSheet, 'Top Items');
        }
        
        XLSX.writeFile(wb, `Daily_Report_${format(selectedDate, 'yyyy-MM-dd')}.xlsx`);
      } else if (weeklyData.length > 0) {
        // Export weekly data
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weeklyExportData = weeklyData.map(day => ({
          'Date': day.date,
          'Day': format(new Date(day.date), 'EEEE'),
          'Total Revenue': day.total_revenue || 0,
          'Total Orders': day.total_orders || 0,
          'Total Tax': day.total_tax || 0,
          'Total Discount': day.total_discount || 0
        }));
        
        // Add totals row
        weeklyExportData.push({
          'Date': 'TOTAL',
          'Day': '',
          'Total Revenue': weeklyData.reduce((sum, d) => sum + (d.total_revenue || 0), 0),
          'Total Orders': weeklyData.reduce((sum, d) => sum + (d.total_orders || 0), 0),
          'Total Tax': weeklyData.reduce((sum, d) => sum + (d.total_tax || 0), 0),
          'Total Discount': weeklyData.reduce((sum, d) => sum + (d.total_discount || 0), 0)
        });
        
        const weeklySheet = XLSX.utils.json_to_sheet(weeklyExportData);
        XLSX.utils.book_append_sheet(wb, weeklySheet, 'Weekly Summary');
        
        XLSX.writeFile(wb, `Weekly_Report_${format(weekStart, 'yyyy-MM-dd')}.xlsx`);
      }
      
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report: ' + error.message);
    }
  };

  const COLORS = ['var(--success-500)', 'var(--primary-500)', 'var(--secondary-500)'];

  const paymentData = dailyData?.sales ? [
    { name: 'Cash', value: dailyData.sales.cash_amount || 0 },
    { name: 'Card', value: dailyData.sales.card_amount || 0 },
    { name: 'UPI', value: dailyData.sales.upi_amount || 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--spacing-6)'
      }}>
        <div>
          <h1>Sales Reports</h1>
          <p className="text-muted">View your sales analytics and insights</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button 
            className={`btn ${reportType === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('daily')}
          >
            Daily
          </button>
          <button 
            className={`btn ${reportType === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('weekly')}
          >
            Weekly
          </button>
          <button 
            className="btn btn-secondary"
            onClick={exportToExcel}
            disabled={isLoading}
            title="Export to Excel"
          >
            <FileSpreadsheet size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)'
      }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigateDate('prev')}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) var(--spacing-4)',
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          fontWeight: 600
        }}>
          <Calendar size={20} />
          {reportType === 'daily' 
            ? format(selectedDate, 'EEEE, MMMM d, yyyy')
            : `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'MMM d, yyyy')}`
          }
        </div>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={() => navigateDate('next')}
          disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <div className="loading-spinner" />
          <p className="mt-4">Loading report...</p>
        </div>
      ) : reportType === 'daily' ? (
        <DailyReport data={dailyData} paymentData={paymentData} />
      ) : (
        <WeeklyReport data={weeklyData} startDate={startOfWeek(selectedDate, { weekStartsOn: 1 })} />
      )}
    </div>
  );
};

// Daily Report Component
const DailyReport = ({ data, paymentData }) => {
  const sales = data?.sales || {};
  const orders = data?.orders || [];
  const topItems = data?.topItems || [];

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];
  const GRADIENT_COLORS = {
    primary: ['#6366f1', '#818cf8'],
    success: ['#10b981', '#34d399'],
    warning: ['#f59e0b', '#fbbf24'],
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', 
          color: 'white',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)'
        }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">₹{(sales.total_revenue || 0).toFixed(2)}</div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Revenue</div>
          </div>
        </div>

        <div className="stat-card" style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
          color: 'white',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)'
        }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <div className="stat-value">{sales.total_orders || 0}</div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Orders</div>
          </div>
        </div>

        <div className="stat-card" style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', 
          color: 'white',
          boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)'
        }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">
              ₹{sales.total_orders ? (sales.total_revenue / sales.total_orders).toFixed(2) : '0.00'}
            </div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Avg. Order Value</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: 'var(--spacing-6)',
        marginTop: 'var(--spacing-6)'
      }}>
        {/* Top Items */}
        <div className="card" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="card-header" style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} style={{ color: 'var(--primary-500)' }} />
              Top Selling Items
            </h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topItems} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a5b4fc" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="item_name" 
                    type="category" 
                    width={130} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'total_quantity' ? `${value} units` : `₹${value.toFixed(2)}`,
                      name === 'total_quantity' ? 'Quantity Sold' : 'Revenue'
                    ]}
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="total_quantity" 
                    fill="url(#barGradient)" 
                    radius={[0, 6, 6, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--spacing-6)' }}>
                <p className="text-muted">No sales data for this day</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="card-header" style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            <h3>💳 Payment Methods</h3>
          </div>
          <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <defs>
                    <linearGradient id="pieGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="pieGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="pieGradient3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={800}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#pieGradient${(index % 3) + 1})`}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                    contentStyle={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--spacing-6)' }}>
                <p className="text-muted">No payment data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ marginTop: 'var(--spacing-6)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="card-header" style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <h3>📋 Orders Today</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Time</th>
                <th>Type</th>
                <th>Payment</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.order_number}</td>
                    <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                    <td>{order.order_type.replace('_', ' ')}</td>
                    <td>
                      <span className="badge badge-gray">
                        {order.payment_method?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: 600 }}>
                      ₹{order.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--spacing-6)' }}>
                    No orders for this day
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Weekly Report Component
const WeeklyReport = ({ data, startDate }) => {
  // Create full week data with zeros for missing days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = format(addDays(startDate, i), 'yyyy-MM-dd');
    const dayData = data.find(d => d.date === date);
    return {
      day: format(addDays(startDate, i), 'EEE'),
      date,
      revenue: dayData?.total_revenue || 0,
      orders: dayData?.total_orders || 0,
    };
  });

  const totals = {
    revenue: data.reduce((sum, d) => sum + (d.total_revenue || 0), 0),
    orders: data.reduce((sum, d) => sum + (d.total_orders || 0), 0),
    tax: data.reduce((sum, d) => sum + (d.total_tax || 0), 0),
    discount: data.reduce((sum, d) => sum + (d.total_discount || 0), 0),
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', 
          color: 'white',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)'
        }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">₹{totals.revenue.toFixed(2)}</div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Weekly Revenue</div>
          </div>
        </div>

        <div className="stat-card" style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
          color: 'white',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)'
        }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <div className="stat-value">{totals.orders}</div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Orders</div>
          </div>
        </div>

        <div className="stat-card" style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', 
          color: 'white',
          boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)'
        }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">
              ₹{totals.orders ? (totals.revenue / totals.orders).toFixed(2) : '0.00'}
            </div>
            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Avg. Order Value</div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ marginTop: 'var(--spacing-6)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="card-header" style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 Daily Revenue Trend
          </h3>
        </div>
        <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `₹${value.toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="url(#revenueGradient)" 
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="card" style={{ marginTop: 'var(--spacing-6)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="card-header" style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Daily Orders Trend
          </h3>
        </div>
        <div className="card-body" style={{ padding: 'var(--spacing-4)' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#10b981' }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
        <div className="card-header">
          <h3>Daily Breakdown</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Tax</th>
                <th className="text-right">Discount</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map(day => {
                const dayData = data.find(d => d.date === day.date);
                return (
                  <tr key={day.date}>
                    <td style={{ fontWeight: 500 }}>{day.day} ({format(new Date(day.date), 'MMM d')})</td>
                    <td className="text-right">{dayData?.total_orders || 0}</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>
                      ₹{(dayData?.total_revenue || 0).toFixed(2)}
                    </td>
                    <td className="text-right">₹{(dayData?.total_tax || 0).toFixed(2)}</td>
                    <td className="text-right">₹{(dayData?.total_discount || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: 'var(--gray-50)', fontWeight: 600 }}>
                <td>Total</td>
                <td className="text-right">{totals.orders}</td>
                <td className="text-right">₹{totals.revenue.toFixed(2)}</td>
                <td className="text-right">₹{totals.tax.toFixed(2)}</td>
                <td className="text-right">₹{totals.discount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
