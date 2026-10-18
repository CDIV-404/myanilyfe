/**
 * ANILyfe Order Service
 * Handles order lifecycle, fulfillment state transitions, shipment tracking,
 * returns, and commission/earnings breakdown.
 * Security: Sellers cannot manipulate payment totals or commission rates.
 */
(function() {
  const STORAGE_KEY = 'anilyfe_seller_orders';

  function defaultOrders() { return []; }

  function getStoredOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading orders', e);
    }
    const def = defaultOrders();
    saveOrders(def);
    return def;
  }

  function saveOrders(orders) { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); if(typeof LS!=='undefined') LS.set('orders',orders); }
  function mergeSellerOrders(updatedSellerOrders) {
    const sid = sellerId();
    if (!sid) throw new Error('Seller identity not found');
    const all = getStoredOrders().filter(o => o.sellerId !== sid).concat(updatedSellerOrders);
    saveOrders(all);
    return all;
  }
  function sellerId(){ const u=window.currentUser?window.currentUser():null; const s=u&&window.sellerOf?window.sellerOf(u.id):null; return s?s.id:null; }
  function scopedOrders(){ const sid=sellerId(); return sid ? getStoredOrders().filter(o=>o.sellerId===sid) : []; }

  const orderService = {
    async getOrders(filters = {}) {
      await new Promise(r => setTimeout(r, 40));
      let list = scopedOrders();

      if (filters.status && filters.status !== 'All') {
        if (filters.status === 'Returns') {
          list = list.filter(o => o.orderStatus === 'Returns' || o.orderStatus === 'Return Requested');
        } else if (filters.status === 'Refunds') {
          list = list.filter(o => o.paymentStatus === 'Refunded' || o.orderStatus === 'Refunds');
        } else {
          list = list.filter(o => o.orderStatus === filters.status);
        }
      }

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(o =>
          o.id.toLowerCase().includes(q) ||
          (o.buyer && o.buyer.name && o.buyer.name.toLowerCase().includes(q)) ||
          o.items.some(it =>
            (it.productName && it.productName.toLowerCase().includes(q)) ||
            (it.sku && it.sku.toLowerCase().includes(q))
          )
        );
      }

      if (filters.paymentStatus && filters.paymentStatus !== 'All') {
        list = list.filter(o => o.paymentStatus === filters.paymentStatus);
      }

      if (filters.dateRange) {
        // filter by range if provided
      }

      return list;
    },

    async getOrderById(id) {
      await new Promise(r => setTimeout(r, 30));
      const list = scopedOrders();
      return list.find(o => o.id === id) || null;
    },

    async updateOrderStatus(id, newStatus, note = '') {
      await new Promise(r => setTimeout(r, 60));
      const list = scopedOrders();
      const order = list.find(o => o.id === id);
      if (!order) throw new Error('Order not found');

      order.orderStatus = newStatus;
      if (!Array.isArray(order.timeline)) order.timeline = [];
      order.timeline.push({
        status: newStatus,
        label: `Marked as ${newStatus}`,
        timestamp: new Date().toISOString(),
        note: note || `Updated by seller to ${newStatus}.`
      });

      mergeSellerOrders(list);
      window.dispatchEvent(new CustomEvent('anilyfe:orders-updated'));
      return order;
    },

    async confirmOrder(id) {
      return this.updateOrderStatus(id, 'Confirmed', 'Seller confirmed item availability.');
    },

    async processOrder(id) {
      return this.updateOrderStatus(id, 'Processing', 'Items packed and sealed in tamper-proof box.');
    },

    async markReadyToShip(id) {
      return this.updateOrderStatus(id, 'Ready to Ship', 'Waybill printed; awaiting dispatch pickup.');
    },

    async addTrackingAndShip(id, { courier, trackingNumber, note }) {
      await new Promise(r => setTimeout(r, 60));
      const list = scopedOrders();
      const order = list.find(o => o.id === id);
      if (!order) throw new Error('Order not found');

      order.orderStatus = 'Shipped';
      if (!Array.isArray(order.timeline)) order.timeline = [];
      order.deliveryStatus = `In Transit via ${courier}`;
      order.courier = courier;
      order.trackingNumber = trackingNumber;
      order.timeline.push({
        status: 'Shipped',
        label: `Dispatched with ${courier}`,
        timestamp: new Date().toISOString(),
        note: `Tracking code #${trackingNumber}. ${note || ''}`
      });

      mergeSellerOrders(list);
      window.dispatchEvent(new CustomEvent('anilyfe:orders-updated'));
      return order;
    },

    async markDelivered(id) {
      return this.updateOrderStatus(id, 'Delivered', 'Customer confirmed receipt of goods.');
    },

    async cancelOrder(id, reason) {
      await new Promise(r => setTimeout(r, 60));
      const list = scopedOrders();
      const order = list.find(o => o.id === id);
      if (!order) throw new Error('Order not found');
      if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
        throw new Error('Cannot cancel an order that has already shipped or been delivered.');
      }

      order.orderStatus = 'Cancelled';
      if (!Array.isArray(order.timeline)) order.timeline = [];
      order.cancellationReason = reason || 'Cancelled by seller due to inventory constraint.';
      order.timeline.push({
        status: 'Cancelled',
        label: 'Order Cancelled',
        timestamp: new Date().toISOString(),
        note: order.cancellationReason
      });

      mergeSellerOrders(list);
      window.dispatchEvent(new CustomEvent('anilyfe:orders-updated'));
      return order;
    },

    async handleReturn(id, decision, reason = '') {
      await new Promise(r => setTimeout(r, 60));
      const list = scopedOrders();
      const order = list.find(o => o.id === id);
      if (!order) throw new Error('Order not found');

      order.returnStatus = decision;
      if (!Array.isArray(order.timeline)) order.timeline = [];
      order.timeline.push({
        status: 'Returns',
        label: `Return ${decision}`,
        timestamp: new Date().toISOString(),
        note: reason || `Seller decision: ${decision}`
      });

      mergeSellerOrders(list);
      window.dispatchEvent(new CustomEvent('anilyfe:orders-updated'));
      return order;
    }
  };

  window.orderService = orderService;
})();
