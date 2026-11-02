/**
 * ANILyfe Inventory Service
 * Manages variant-level stock, reserved inventory, low-stock thresholds,
 * stock adjustments, SKU management, and audit movement history.
 */
(function() {
  const HISTORY_KEY = 'anilyfe_inventory_history';

  function defaultHistory() { return []; }

  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = defaultHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(def));
    return def;
  }

  function logMovement(entry) {
    const hist = getHistory();
    hist.unshift({
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 50)));
  }

  const inventoryService = {
    async getInventorySummary() {
      await new Promise(r => setTimeout(r, 40));
      const products = await window.productService.getProducts();

      let totalProducts = products.length;
      let totalStock = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let reservedStock = 0;

      products.forEach(p => {
        totalStock += Number(p.stock || 0);
        const threshold = (p.inventory && p.inventory.lowStockThreshold) || 5;
        const reserved = (p.inventory && p.inventory.reserved) || 0;
        reservedStock += reserved;

        if (p.stock === 0) {
          outOfStockCount++;
        } else if (p.stock <= threshold) {
          lowStockCount++;
        }
      });

      return {
        totalProducts,
        totalStock,
        lowStockCount,
        outOfStockCount,
        reservedStock
      };
    },

    async getInventoryItems(filter = {}) {
      await new Promise(r => setTimeout(r, 40));
      const products = await window.productService.getProducts();
      let rows = [];

      products.forEach(p => {
        const threshold = (p.inventory && p.inventory.lowStockThreshold) || 5;
        const reservedTotal = (p.inventory && p.inventory.reserved) || 0;

        if (Array.isArray(p.variants) && p.variants.length > 0) {
          p.variants.forEach(v => {
            const vStock = Number(v.stock || 0);
            let status = 'In Stock';
            if (vStock === 0) status = 'Out of Stock';
            else if (vStock <= threshold) status = 'Low Stock';
            if (p.approvalStatus === 'Archived') status = 'Archived';

            rows.push({
              productId: p.id,
              variantId: v.id,
              productName: p.name,
              productImage: (p.images && p.images[0]) || '',
              category: p.category,
              variantName: `${v.color} / ${v.size}`,
              sku: v.sku || p.sku,
              price: v.price || p.price,
              currentStock: vStock,
              reserved: Math.min(vStock, Math.ceil(reservedTotal / p.variants.length)),
              available: Math.max(0, vStock - Math.min(vStock, Math.ceil(reservedTotal / p.variants.length))),
              threshold,
              status,
              approvalStatus: p.approvalStatus
            });
          });
        } else {
          let status = 'In Stock';
          if (p.stock === 0) status = 'Out of Stock';
          else if (p.stock <= threshold) status = 'Low Stock';
          if (p.approvalStatus === 'Archived') status = 'Archived';

          rows.push({
            productId: p.id,
            variantId: null,
            productName: p.name,
            productImage: (p.images && p.images[0]) || '',
            category: p.category,
            variantName: 'Default Variant',
            sku: p.sku,
            price: p.price,
            currentStock: p.stock,
            reserved: reservedTotal,
            available: Math.max(0, p.stock - reservedTotal),
            threshold,
            status,
            approvalStatus: p.approvalStatus
          });
        }
      });

      if (filter.status && filter.status !== 'All') {
        rows = rows.filter(r => r.status === filter.status);
      }

      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        rows = rows.filter(r =>
          r.productName.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.variantName.toLowerCase().includes(q)
        );
      }

      return rows;
    },

    async adjustStock(productId, variantId, delta, reason = 'Manual seller adjustment') {
      await new Promise(r => setTimeout(r, 60));
      const p = await window.productService.getProductById(productId);
      if (!p) throw new Error('Product not found');

      let newStock = 0;
      let sku = p.sku;
      let variantName = 'Default';

      if (variantId && Array.isArray(p.variants)) {
        const v = p.variants.find(x => x.id === variantId);
        if (v) {
          v.stock = Math.max(0, Number(v.stock || 0) + delta);
          newStock = v.stock;
          sku = v.sku;
          variantName = `${v.color} / ${v.size}`;
        }
      } else {
        p.stock = Math.max(0, Number(p.stock || 0) + delta);
        newStock = p.stock;
      }

      // Update aggregate product
      await window.productService.updateProduct(productId, {
        variants: p.variants,
        stock: p.variants ? p.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) : p.stock
      });

      logMovement({
        sku,
        productName: p.name,
        variant: variantName,
        change: delta,
        newStock,
        reason
      });

      window.dispatchEvent(new CustomEvent('anilyfe:inventory-updated'));
      return { success: true, newStock };
    },

    async updateSku(productId, variantId, newSku) {
      await new Promise(r => setTimeout(r, 50));
      const p = await window.productService.getProductById(productId);
      if (!p) throw new Error('Product not found');

      if (variantId && Array.isArray(p.variants)) {
        const v = p.variants.find(x => x.id === variantId);
        if (v) v.sku = newSku.trim();
      } else {
        p.sku = newSku.trim();
      }

      await window.productService.updateProduct(productId, {
        sku: p.sku,
        variants: p.variants
      });

      window.dispatchEvent(new CustomEvent('anilyfe:inventory-updated'));
      return true;
    },

    async setThreshold(productId, threshold) {
      await new Promise(r => setTimeout(r, 50));
      const p = await window.productService.getProductById(productId);
      if (!p) throw new Error('Product not found');

      const inv = p.inventory || {};
      inv.lowStockThreshold = Number(threshold);

      await window.productService.updateProduct(productId, { inventory: inv });
      window.dispatchEvent(new CustomEvent('anilyfe:inventory-updated'));
      return true;
    },

    async getHistory() {
      await new Promise(r => setTimeout(r, 30));
      return getHistory();
    }
  };

  window.inventoryService = inventoryService;
})();
