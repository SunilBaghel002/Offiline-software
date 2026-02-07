import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  X,
  Printer,
  FileText,
  Calendar,
  Filter,
  Download,
  Check,
  Clock,
  XCircle
} from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.invoke('order:getAll', {});
      setOrders(result || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number?.toString().includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_phone?.includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      filtered = filtered.filter(order => 
        order.created_at?.startsWith(today)
      );
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= weekAgo
      );
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= monthAgo
      );
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = async (order) => {
    try {
      const fullOrder = await window.electronAPI.invoke('order:getById', { id: order.id });
      setSelectedOrder(fullOrder);
      setShowViewModal(true);
    } catch (error) {
      console.error('Failed to load order:', error);
    }
  };

  const handleEditOrder = async (order) => {
    try {
      const fullOrder = await window.electronAPI.invoke('order:getById', { id: order.id });
      setSelectedOrder(fullOrder);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to load order:', error);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm(`Are you sure you want to delete Order #${order.order_number}? This cannot be undone.`)) {
      try {
        await window.electronAPI.invoke('order:delete', { id: order.id });
        loadOrders();
      } catch (error) {
        console.error('Failed to delete order:', error);
        alert('Failed to delete order: ' + error.message);
      }
    }
  };

  const handlePrintBill = async (order) => {
    try {
      const fullOrder = await window.electronAPI.invoke('order:getById', { id: order.id });
      await window.electronAPI.invoke('print:receipt', { order: fullOrder });
      alert('Bill printed successfully!');
    } catch (error) {
      console.error('Failed to print:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'badge-warning', icon: Clock, text: 'Active' },
      completed: { class: 'badge-success', icon: Check, text: 'Completed' },
      cancelled: { class: 'badge-error', icon: XCircle, text: 'Cancelled' },
    };
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    return (
      <span className={`badge ${badge.class}`}>
        <Icon size={12} style={{ marginRight: '4px' }} />
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" />
        <p className="mt-4">Loading orders...</p>
      </div>
    );
  }

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
          <h1>Bills & Orders</h1>
          <p className="text-muted">View, edit, and manage all orders</p>
        </div>
      </div>

      {/* Filters Row */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-4)', 
        marginBottom: 'var(--spacing-4)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '350px' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)'
              }} 
            />
            <input
              type="text"
              className="input"
              placeholder="Search by order #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Calendar size={18} style={{ color: 'var(--gray-500)' }} />
          <select
            className="input select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Filter size={18} style={{ color: 'var(--gray-500)' }} />
          <select
            className="input select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-4)'
      }}>
        <div className="stat-card" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
          <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{filteredOrders.length}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--success-50)', borderColor: 'var(--success-200)' }}>
          <div className="stat-value" style={{ color: 'var(--success-600)' }}>
            ₹{filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(0)}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--warning-50)', borderColor: 'var(--warning-200)' }}>
          <div className="stat-value" style={{ color: 'var(--warning-600)' }}>
            {filteredOrders.filter(o => o.status === 'active').length}
          </div>
          <div className="stat-label">Active Orders</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--gray-50)', borderColor: 'var(--gray-200)' }}>
          <div className="stat-value" style={{ color: 'var(--gray-600)' }}>
            {filteredOrders.filter(o => o.status === 'completed').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>
                  <strong>#{order.order_number}</strong>
                </td>
                <td>{formatDate(order.created_at)}</td>
                <td>
                  <div>{order.customer_name || '-'}</div>
                  {order.customer_phone && (
                    <div className="text-xs text-muted">{order.customer_phone}</div>
                  )}
                </td>
                <td>
                  <span className="badge badge-gray">
                    {order.order_type?.replace('_', ' ').toUpperCase() || 'DINE IN'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>₹{(order.total_amount || 0).toFixed(2)}</td>
                <td>
                  {order.payment_method && (
                    <span className="badge badge-success">
                      {order.payment_method.toUpperCase()}
                    </span>
                  )}
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleViewOrder(order)}
                      title="View Bill"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleEditOrder(order)}
                      title="Edit Order"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handlePrintBill(order)}
                      title="Print Bill"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleDeleteOrder(order)}
                      title="Delete Order"
                      style={{ color: 'var(--error-500)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <FileText size={48} />
            <p className="empty-state-title">No orders found</p>
            <p className="text-muted">Adjust your filters or create a new order</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <BillViewModal 
          order={selectedOrder} 
          onClose={() => setShowViewModal(false)}
          onPrint={() => handlePrintBill(selectedOrder)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <OrderEditModal 
          order={selectedOrder} 
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            loadOrders();
          }}
        />
      )}
    </div>
  );
};

// Bill View Modal
const BillViewModal = ({ order, onClose, onPrint }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Bill #{order.order_number}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ 
            background: '#fafafa', 
            padding: 'var(--spacing-4)', 
            border: '1px dashed var(--gray-300)',
            margin: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3)' }}>
              <h3 style={{ marginBottom: '4px' }}>Restaurant POS</h3>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                {formatDate(order.created_at)}
              </div>
            </div>

            <div style={{ 
              borderTop: '1px dashed var(--gray-400)', 
              borderBottom: '1px dashed var(--gray-400)',
              padding: 'var(--spacing-2) 0',
              marginBottom: 'var(--spacing-2)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bill No:</span>
                <strong>#{order.order_number}</strong>
              </div>
              {order.table_number && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Table:</span>
                  <span>{order.table_number}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Type:</span>
                <span>{order.order_type?.replace('_', ' ').toUpperCase()}</span>
              </div>
              {order.customer_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer:</span>
                  <span>{order.customer_name}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                  padding: '4px 0'
                }}>
                  <span>{item.item_name} x {item.quantity}</span>
                  <span>₹{(item.item_total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ 
              borderTop: '1px dashed var(--gray-400)',
              paddingTop: 'var(--spacing-2)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{(order.subtotal || 0).toFixed(2)}</span>
              </div>
              {order.tax_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <span>₹{(order.tax_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-600)' }}>
                  <span>Discount:</span>
                  <span>-₹{(order.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 'var(--font-size-lg)',
                marginTop: 'var(--spacing-2)',
                paddingTop: 'var(--spacing-2)',
                borderTop: '2px solid var(--gray-900)'
              }}>
                <span>TOTAL:</span>
                <span>₹{(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {order.payment_method && (
              <div style={{ textAlign: 'center', marginTop: 'var(--spacing-3)', color: 'var(--gray-600)' }}>
                Paid via {order.payment_method.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onPrint}>
            <Printer size={18} />
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};

// Order Edit Modal with full items editing
const OrderEditModal = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || '',
    order_type: order.order_type || 'dine_in',
    table_number: order.table_number || '',
    status: order.status || 'active',
    discount_amount: order.discount_amount || 0,
    notes: order.notes || '',
  });
  const [items, setItems] = useState(order.items?.map(item => ({
    ...item,
    unit_price: item.unit_price || (item.item_total / item.quantity),
    quantity: item.quantity || 1
  })) || []);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxAmount = items.reduce((sum, item) => sum + ((item.unit_price * item.quantity) * (item.tax_rate || 0) / 100), 0);
  const totalAmount = subtotal + taxAmount - (parseFloat(formData.discount_amount) || 0);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unit_price' ? parseFloat(value) || 0 : value,
      item_total: field === 'quantity' 
        ? (parseFloat(value) || 0) * updatedItems[index].unit_price
        : field === 'unit_price'
        ? (parseFloat(value) || 0) * updatedItems[index].quantity
        : updatedItems[index].item_total
    };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      alert('Order must have at least one item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update order details and totals only (no individual item updates)
      await window.electronAPI.invoke('order:update', {
        id: order.id,
        updates: {
          ...formData,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          discount_amount: parseFloat(formData.discount_amount) || 0
        }
      });
      
      onSave();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update order: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Order #{order.order_number}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Customer Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
              <div className="input-group">
                <label className="input-label">Customer Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Customer Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
              <div className="input-group">
                <label className="input-label">Order Type</label>
                <select
                  className="input select"
                  value={formData.order_type}
                  onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                >
                  <option value="dine_in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Table Number</label>
                <input
                  type="text"
                  className="input"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Status</label>
                <select
                  className="input select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ 
              background: 'var(--gray-50)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--spacing-3)',
              marginBottom: 'var(--spacing-4)'
            }}>
              <h4 style={{ marginBottom: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                Order Items
              </h4>
              {items.map((item, idx) => (
                <div key={item.id || idx} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 80px 100px 100px auto', 
                  gap: 'var(--spacing-2)',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-2)',
                  padding: 'var(--spacing-2)',
                  background: 'white',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{item.item_name}</div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      style={{ textAlign: 'center', padding: '6px' }}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      style={{ padding: '6px' }}
                    />
                  </div>
                  <div style={{ fontWeight: 600, textAlign: 'right' }}>
                    ₹{(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => handleRemoveItem(idx)}
                    style={{ color: 'var(--error-500)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {/* Labels row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 80px 100px 100px auto', 
                gap: 'var(--spacing-2)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--gray-500)',
                paddingLeft: 'var(--spacing-2)'
              }}>
                <span>Item</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span>Price</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span></span>
              </div>
            </div>

            {/* Totals */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 'var(--spacing-4)',
              marginBottom: 'var(--spacing-4)'
            }}>
              <div className="input-group">
                <label className="input-label">Discount Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                />
              </div>
              
              <div style={{ 
                background: 'var(--primary-50)', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Tax:</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                {parseFloat(formData.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--success-600)' }}>
                    <span>Discount:</span>
                    <span>-₹{parseFloat(formData.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 'var(--spacing-2)', paddingTop: 'var(--spacing-2)', borderTop: '1px solid var(--primary-200)' }}>
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Notes</label>
              <textarea
                className="input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrdersPage;
