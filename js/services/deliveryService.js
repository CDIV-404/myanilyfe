/**
 * ANILyfe Delivery & Shipping Service
 * Manages seller shipping rules, in-state free shipping, nationwide rates,
 * dispatch locations, and pickup instructions.
 * Security: The final shipping calculation is performed authoritatively on backend.
 */
(function() {
  const STORAGE_PREFIX = 'anilyfe_seller_delivery_';
  function storageKey(){ const u=window.currentUser?.(); const seller=u && window.sellerOf ? window.sellerOf(u.id) : null; return STORAGE_PREFIX + (seller?.id || 'anonymous'); }

  function defaultDelivery() { return {localDelivery:true,nationwideDelivery:true,pickupAvailable:false,freeShippingInState:false,sameStateFee:0,outsideStateFee:0,dispatchLocation:'',dispatchState:'',processingTime:'',deliveryInstructions:'',pickupInstructions:'',supportedCouriers:[],updatedAt:new Date().toISOString()}; }

  function getStoredDelivery() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = defaultDelivery();
    localStorage.setItem(storageKey(), JSON.stringify(def));
    return def;
  }

  const deliveryService = {
    async getSettings() {
      await new Promise(r => setTimeout(r, 40));
      return getStoredDelivery();
    },

    async updateSettings(updates) {
      await new Promise(r => setTimeout(r, 60));
      const current = getStoredDelivery();
      const updated = {
        ...current,
        ...updates,
        sameStateFee: Number(updates.sameStateFee !== undefined ? updates.sameStateFee : current.sameStateFee),
        outsideStateFee: Number(updates.outsideStateFee !== undefined ? updates.outsideStateFee : current.outsideStateFee),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(storageKey(), JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('anilyfe:delivery-updated', { detail: updated }));
      return updated;
    },

    /**
     * Backend Simulation:
     * Calculates fee based on customer's state versus seller's state
     */
    async simulateCalculateShipping(customerState) {
      const settings = getStoredDelivery();
      if (!settings.dispatchState) { const seller = window.currentUser?.() && window.sellerOf?.(window.currentUser().id); if (seller?.state) settings.dispatchState = seller.state; }
      const isSameState = (customerState || '').toLowerCase().trim() === settings.dispatchState.toLowerCase().trim();

      if (!settings.dispatchState) return {isSameState:false,fee:settings.outsideStateFee||0,isFree:false,label:'Shipping rate not configured'};
      if (isSameState) {
        return {
          isSameState: true,
          fee: settings.freeShippingInState ? 0 : settings.sameStateFee,
          isFree: settings.freeShippingInState,
          label: settings.freeShippingInState ? `Free In-State Delivery (${settings.dispatchState})` : `Standard ${settings.dispatchState} Delivery`
        };
      } else {
        return {
          isSameState: false,
          fee: settings.outsideStateFee,
          isFree: false,
          label: `Nationwide Shipping (${customerState})`
        };
      }
    }
  };

  window.deliveryService = deliveryService;
})();
