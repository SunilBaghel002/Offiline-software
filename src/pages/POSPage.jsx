import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Smartphone,
  X,
  Printer,
  Check,
  Search,
  Leaf,
  FileText
} from 'lucide-react';

const POSPage = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuthStore();
  const cart = useCartStore();

  // Load categories and menu items
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categoriesResult = await window.electronAPI.invoke('menu:getCategories');
      setCategories(categoriesResult);
      
      if (categoriesResult.length > 0) {
        setSelectedCategory(categoriesResult[0].id);
      }

      const itemsResult = await window.electronAPI.invoke('menu:getItems', {});
      setMenuItems(itemsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter menu items by category and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.is_available;
  });

  const handleAddToCart = (item) => {
    cart.addItem(item);
  };

  const handleCheckout = () => {
    if (cart.items.length > 0) {
      setShowPayment(true);
    }
  };

  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" />
        <p className="mt-4">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      {/* Left Panel - Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', overflow: 'hidden' }}>
        {/* Search Bar */}
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
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', background: 'white' }}
          />
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          <button
            className={`category-tab ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredItems.length > 0 ? (
            <div className="menu-grid">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`menu-item-card ${item.is_vegetarian ? 'vegetarian' : 'non-vegetarian'}`}
                  onClick={() => handleAddToCart(item)}
                >
                  {/* Veg/Non-Veg Indicator Box */}
                  <div style={{ 
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${item.is_vegetarian ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.is_vegetarian ? '#22c55e' : '#ef4444'
                    }} />
                  </div>
                  <div className="menu-item-name">{item.name}</div>
                  <div className="menu-item-price">₹{item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <p>No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="cart-panel">
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <ShoppingCart size={20} />
              <span style={{ fontWeight: 600 }}>Current Order</span>
            </div>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)' }}>
              {cart.getItemCount()} items
            </span>
          </div>

          {/* Order Type Selection */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-2)', 
            marginTop: 'var(--spacing-3)' 
          }}>
            {['dine_in', 'takeaway', 'delivery'].map(type => (
              <button
                key={type}
                onClick={() => cart.setOrderType(type)}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-2)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: cart.orderType === type 
                    ? 'white' 
                    : 'rgba(255,255,255,0.2)',
                  color: cart.orderType === type 
                    ? 'var(--primary-700)' 
                    : 'white',
                }}
              >
                {type.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Table Number (for dine-in) */}
          {cart.orderType === 'dine_in' && (
            <input
              type="text"
              className="input"
              placeholder="Table Number"
              value={cart.tableNumber}
              onChange={(e) => cart.setTableNumber(e.target.value)}
              style={{ marginTop: 'var(--spacing-2)' }}
            />
          )}
        </div>

        {/* Cart Items */}
        <div className="cart-items">
          {cart.items.length > 0 ? (
            cart.items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{item.unitPrice.toFixed(2)} each</div>
                </div>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>
                    {item.quantity}
                  </span>
                  <button 
                    className="quantity-btn"
                    onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ 
                  minWidth: '70px', 
                  textAlign: 'right', 
                  fontWeight: 600,
                  color: 'var(--gray-900)'
                }}>
                  ₹{(item.unitPrice * item.quantity).toFixed(2)}
                </div>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => cart.removeItem(item.id)}
                  style={{ color: 'var(--error-500)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <p className="empty-state-title">Cart is empty</p>
              <p className="text-sm text-muted">Add items from the menu</p>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span>₹{cart.getSubtotal().toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Tax</span>
                <span>₹{cart.getTax().toFixed(2)}</span>
              </div>
              {cart.discountAmount > 0 && (
                <div className="cart-total-row" style={{ color: 'var(--success-600)' }}>
                  <span>Discount</span>
                  <span>-₹{cart.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="cart-total-row grand-total">
                <span>Total</span>
                <span>₹{cart.getTotal().toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => cart.clearCart()}
              >
                Clear
              </button>
              <button 
                className="btn btn-success btn-lg"
                style={{ flex: 1 }}
                onClick={handleCheckout}
              >
                <CreditCard size={18} />
                Pay ₹{cart.getTotal().toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={cart.getTotal()}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            loadData(); // Refresh menu
          }}
          userId={user.id}
        />
      )}
    </div>
  );
};

// Bill Preview Modal Component
const BillPreviewModal = ({ order, onClose, onPrint }) => {
  if (!order) return null;

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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1001 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: '400px', 
        background: '#fff',
        fontFamily: 'monospace'
      }}>
        <div className="modal-header">
          <h3 className="modal-title">Bill Preview</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          {/* Bill Content */}
          <div style={{ 
            background: '#fafafa', 
            padding: 'var(--spacing-4)', 
            border: '1px dashed var(--gray-300)',
            margin: 'var(--spacing-3)',
            borderRadius: 'var(--radius-md)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '4px' }}>
                Restaurant POS
              </h3>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)' }}>
                {formatDate(order.created_at)}
              </div>
            </div>

            <div style={{ 
              borderTop: '1px dashed var(--gray-400)', 
              borderBottom: '1px dashed var(--gray-400)',
              padding: 'var(--spacing-2) 0',
              marginBottom: 'var(--spacing-2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span>Bill No:</span>
                <strong>#{order.order_number}</strong>
              </div>
              {order.table_number && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Table:</span>
                  <span>{order.table_number}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span>Type:</span>
                <span>{order.order_type?.replace('_', ' ').toUpperCase()}</span>
              </div>
              {order.customer_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Customer:</span>
                  <span>{order.customer_name}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 600,
                fontSize: 'var(--font-size-xs)',
                borderBottom: '1px solid var(--gray-300)',
                paddingBottom: '4px',
                marginBottom: '4px'
              }}>
                <span>Item</span>
                <span>Qty</span>
                <span>Amount</span>
              </div>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                  padding: '2px 0'
                }}>
                  <span style={{ flex: 2 }}>{item.item_name}</span>
                  <span style={{ flex: 0.5, textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>₹{(item.item_total || 0).toFixed(2)}</span>
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

            {/* Payment Info */}
            {order.payment_method && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: 'var(--spacing-3)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--gray-600)'
              }}>
                Paid via {order.payment_method.toUpperCase()}
              </div>
            )}

            {/* Footer */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: 'var(--spacing-3)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--gray-500)'
            }}>
              Thank you for dining with us!
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onPrint}>
            <Printer size={18} />
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};

// Payment Modal Component with Customer Info Step
const PaymentModal = ({ total, onClose, onSuccess, userId }) => {
  const [step, setStep] = useState('customer'); // 'customer' or 'payment'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  const cart = useCartStore();

  const handleProceedToPayment = () => {
    // Update cart with customer info
    cart.setCustomerName(customerName);
    cart.setCustomerPhone(customerPhone);
    setStep('payment');
  };

  const handlePayment = async (method) => {
    setPaymentMethod(method);
    setIsProcessing(true);

    try {
      // Create order
      const result = await cart.createOrder(userId);

      if (result.success) {
        // Get the full order details
        const order = await window.electronAPI.invoke('order:getById', { id: result.id });

        // 1. Print KOT to Kitchen immediately when order is placed
        console.log('Printing KOT to kitchen...');
        await window.electronAPI.invoke('print:kot', { 
          order: order,
          items: order.items 
        });

        // 2. Complete the order with payment method
        await window.electronAPI.invoke('order:complete', {
          id: result.id,
          paymentMethod: method,
        });

        // 3. Refresh order with payment info and print Receipt to customer
        const completedOrder = await window.electronAPI.invoke('order:getById', { id: result.id });
        console.log('Printing receipt to customer...');
        await window.electronAPI.invoke('print:receipt', { order: completedOrder });

        setOrderId(result.id);
        setOrderNumber(result.orderNumber);
        setOrderComplete(true);
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // View Bill handler
  const handleViewBill = async () => {
    try {
      const order = await window.electronAPI.invoke('order:getById', { id: orderId });
      setViewingOrder(order);
      setShowBillPreview(true);
    } catch (error) {
      console.error('Failed to load order:', error);
      alert('Failed to load bill: ' + error.message);
    }
  };

  // Reprint Bill handler
  const handleReprintBill = async () => {
    try {
      const order = await window.electronAPI.invoke('order:getById', { id: orderId });
      await window.electronAPI.invoke('print:receipt', { order });
      alert('Bill reprinted successfully!');
    } catch (error) {
      console.error('Failed to print:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  if (orderComplete) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center', padding: 'var(--spacing-8)', maxWidth: '400px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--success-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-4)',
          }}>
            <Check size={40} style={{ color: 'var(--success-500)' }} />
          </div>
          <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Order Complete!</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-2)' }}>
            Order #{orderNumber} has been placed successfully.
          </p>
          <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-4)' }}>
            KOT sent to kitchen • Receipt printed
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={handleViewBill}
            >
              <FileText size={18} />
              View Bill
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={handleReprintBill}
            >
              <Printer size={18} />
              Reprint
            </button>
          </div>
          
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onSuccess}>
            New Order
          </button>
        </div>

        {/* Bill Preview Modal */}
        {showBillPreview && viewingOrder && (
          <BillPreviewModal 
            order={viewingOrder} 
            onClose={() => setShowBillPreview(false)}
            onPrint={handleReprintBill}
          />
        )}
      </div>
    );
  }

  // Customer Info Step
  if (step === 'customer') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Customer Information</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-3)',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-4)',
            }}>
              <div style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
                Total Amount
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-2xl)', 
                fontWeight: 700, 
                color: 'var(--primary-600)' 
              }}>
                ₹{total.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div>
                <label className="label">Customer Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email (Optional)</label>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              onClick={handleProceedToPayment}
              disabled={!customerName.trim() || !customerPhone.trim()}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Payment</h3>
          <button className="btn btn-ghost btn-icon" onClick={() => setStep('customer')}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-4)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-4)',
          }}>
            <div style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
              {customerName} • {customerPhone}
            </div>
            <div style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>
              Total Amount
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-4xl)', 
              fontWeight: 700, 
              color: 'var(--primary-600)' 
            }}>
              ₹{total.toFixed(2)}
            </div>
          </div>

          <p style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spacing-4)',
            color: 'var(--gray-600)'
          }}>
            Select payment method
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <button
              className="btn btn-lg"
              style={{
                background: 'var(--success-50)',
                color: 'var(--success-700)',
                border: '2px solid var(--success-200)',
                justifyContent: 'flex-start',
                padding: 'var(--spacing-4)',
              }}
              onClick={() => handlePayment('cash')}
              disabled={isProcessing}
            >
              <Banknote size={24} />
              <span style={{ flex: 1, textAlign: 'left', marginLeft: 'var(--spacing-3)' }}>
                Cash
              </span>
            </button>

            <button
              className="btn btn-lg"
              style={{
                background: 'var(--primary-50)',
                color: 'var(--primary-700)',
                border: '2px solid var(--primary-200)',
                justifyContent: 'flex-start',
                padding: 'var(--spacing-4)',
              }}
              onClick={() => handlePayment('card')}
              disabled={isProcessing}
            >
              <CreditCard size={24} />
              <span style={{ flex: 1, textAlign: 'left', marginLeft: 'var(--spacing-3)' }}>
                Card
              </span>
            </button>

            <button
              className="btn btn-lg"
              style={{
                background: 'var(--secondary-50)',
                color: 'var(--secondary-700)',
                border: '2px solid var(--secondary-200)',
                justifyContent: 'flex-start',
                padding: 'var(--spacing-4)',
              }}
              onClick={() => handlePayment('upi')}
              disabled={isProcessing}
            >
              <Smartphone size={24} />
              <span style={{ flex: 1, textAlign: 'left', marginLeft: 'var(--spacing-3)' }}>
                UPI
              </span>
            </button>
          </div>

          {isProcessing && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: 'var(--spacing-4)',
              gap: 'var(--spacing-2)'
            }}>
              <div className="loading-spinner" style={{ width: '24px', height: '24px' }} />
              <span>Processing payment...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSPage;
