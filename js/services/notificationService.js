/**
 * ANILyfe Notification Service
 * Handles categorized seller alerts across orders, products, finances, KYC verification, and security.
 */
(function() {
  const STORAGE_KEY = 'anilyfe_seller_notifications';

  function defaultNotifications() { return []; }

  function getStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = defaultNotifications();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
    return def;
  }

  const notificationService = {
    async getNotifications(category = 'All') {
      await new Promise(r => setTimeout(r, 30));
      let list = getStored();
      if (category && category !== 'All') {
        list = list.filter(n => n.category.toLowerCase() === category.toLowerCase());
      }
      return list;
    },

    async getUnreadCount() {
      const list = getStored();
      return list.filter(n => !n.read).length;
    },

    async markAsRead(id) {
      const list = getStored();
      const item = list.find(n => n.id === id);
      if (item) item.read = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('anilyfe:notifications-updated'));
      return true;
    },

    async markAllAsRead() {
      const list = getStored();
      list.forEach(n => { n.read = true; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('anilyfe:notifications-updated'));
      return true;
    },

    async addNotification(notif) {
      const list = getStored();
      list.unshift({
        id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
        timestamp: 'Just now',
        date: new Date().toISOString(),
        read: false,
        ...notif
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('anilyfe:notifications-updated'));
      return list[0];
    }
  };

  window.notificationService = notificationService;
})();
