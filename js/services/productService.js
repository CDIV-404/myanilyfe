/**
 * ANILyfe Product Service
 * Handles product catalog, multi-step creation data, variant management,
 * and the strict product approval lifecycle:
 * Draft -> Pending Approval -> Admin Review -> Approved -> Published
 * Rejected -> Rejection Reason -> Fix -> Resubmit -> Pending Approval
 */
(function() {
  const STORAGE_KEY = 'anilyfe_seller_products';

  function defaultProducts() { return []; }

  function getStoredProducts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading products', e);
    }
    const def = defaultProducts();
    saveProducts(def);
    return def;
  }

  function saveProducts(list) {
    const clean = Array.isArray(list) ? list : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    localStorage.setItem('anilyfe_products', JSON.stringify(clean));
    if (typeof LS !== 'undefined') LS.set('products', clean);
  }

  const productService = {
    async getProducts(filter = {}) {
      await new Promise(r => setTimeout(r, 40));
      let list = getStoredProducts();
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && seller) list = list.filter(p => p.sellerId === seller.id);

      if (filter.status && filter.status !== 'All') {
        if (filter.status === 'Active' || filter.status === 'Published') {
          list = list.filter(p => p.approvalStatus === 'Published');
        } else if (filter.status === 'Drafts') {
          list = list.filter(p => p.approvalStatus === 'Draft');
        } else {
          list = list.filter(p => p.approvalStatus === filter.status);
        }
      }

      if (filter.category && filter.category !== 'All') {
        list = list.filter(p => p.category === filter.category);
      }

      if (filter.search) {
        const query = filter.search.toLowerCase().trim();
        list = list.filter(p =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
        );
      }

      return list;
    },

    async getProductById(id) {
      await new Promise(r => setTimeout(r, 30));
      const list = getStoredProducts();
      return list.find(p => p.id === id) || null;
    },

    async getProductBySlug(slug) {
      await new Promise(r => setTimeout(r, 30));
      const list = getStoredProducts();
      return list.find(p => p.slug === slug || p.id === slug) || null;
    },

    async createProduct(data) {
      await new Promise(r => setTimeout(r, 60));
      const list = getStoredProducts();
      const id = `PRD-${Date.now().toString(36).toUpperCase()}`;
      const slug = (data.name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const basePrice = Math.max(0, Number(data.price || 0));
      const discount = Math.max(0, Math.min(100, Number(data.discount || 0)));
      if (!data.name || !String(data.name).trim()) throw new Error('Product name is required.');
      if (basePrice <= 0) throw new Error('Product price must be greater than ₦0.');
      const salePrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

      // Calculate aggregate stock from variants if variants are supplied
      let variants = Array.isArray(data.variants) && data.variants.length ? data.variants : [
        {
          id: `VAR-${Date.now()}-1`,
          color: (data.colors && data.colors[0]) || 'Standard',
          size: (data.sizes && data.sizes[0]) || 'Standard',
          sku: data.sku || `SKU-${id}`,
          price: basePrice,
          stock: Number(data.stock || 0),
          available: true
        }
      ];

      const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      if (!seller) throw new Error('Seller identity not found.');
      if (seller.status !== 'approved') throw new Error('Your seller account must be approved before creating products.');

      if (data.submitForApproval && (!Array.isArray(data.images) || data.images.filter(Boolean).length === 0)) {
        throw new Error('Add at least one product photo before submitting for approval.');
      }

      const newProduct = {
        id,
        sellerId: seller.id,
        name: data.name || 'Untitled Product',
        slug,
        brand: data.brand || '',
        category: data.category || 'Figures & Collectibles',
        subcategory: data.subcategory || '',
        price: basePrice,
        discount,
        salePrice,
        saleStartDate: data.saleStartDate || '',
        saleEndDate: data.saleEndDate || '',
        shortDescription: data.shortDescription || '',
        description: data.description || '',
        images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
        colors: Array.isArray(data.colors) ? data.colors : [],
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
        variants,
        dimensions: data.dimensions || {width:'',height:'',depth:'',unit:'in'},
        sku: data.sku || `ANL-${id}`,
        stock: totalStock,
        inventory: {
          reserved: 0,
          available: totalStock,
          lowStockThreshold: Number(data.lowStockThreshold || 5)
        },
        shipping: data.shipping || {
          weightKg: Number(data.weightKg || 1),
          fragile: Boolean(data.fragile),
          freeShippingInState: false,
          dispatchDays: '1-3 business days'
        },
        // STRICT REQUIREMENT: When submitting for approval, product goes to 'Pending Approval', NEVER directly to 'Approved' or 'Published'
        approvalStatus: data.submitForApproval ? 'Pending Approval' : 'Draft',
        rejectionReason: null,
        rejectedAt: null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rating: 0,
        reviewsCount: 0
      };

      list.unshift(newProduct);
      saveProducts(list);
      if (typeof LS !== 'undefined') LS.set('products', list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return newProduct;
    },

    async updateProduct(id, updates) {
      await new Promise(r => setTimeout(r, 60));
      const list = getStoredProducts();
      const index = list.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Product not found');

      const existing = list[index];
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || existing.sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');

      // SECURITY REQUIREMENT: Sellers cannot set approvalStatus directly to Approved or Published!
      if (updates.approvalStatus && ['Approved', 'Published'].includes(updates.approvalStatus) && !updates.__adminOverride) {
        delete updates.approvalStatus;
      }

      const basePrice = updates.price !== undefined ? Number(updates.price) : existing.price;
      const discount = updates.discount !== undefined ? Number(updates.discount) : existing.discount;
      const salePrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

      let variants = updates.variants || existing.variants;
      let totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

      const updated = {
        ...existing,
        ...updates,
        price: basePrice,
        discount,
        salePrice,
        variants,
        stock: totalStock,
        inventory: {
          ...existing.inventory,
          available: Math.max(0, totalStock - (existing.inventory.reserved || 0)),
          ...(updates.inventory || {})
        },
        updatedAt: new Date().toISOString()
      };

      list[index] = updated;
      if (!isAdmin && ['Published','Approved','Out of Stock'].includes(existing.approvalStatus)) {
        updated.approvalStatus = 'Pending Approval';
        updated.status = 'Pending Approval';
        updated.publishedAt = null;
      }

      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return updated;
    },

    async submitForApproval(id) {
      // Moves Draft or Rejected product to Pending Approval
      await new Promise(r => setTimeout(r, 60));
      const list = getStoredProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Product not found');
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || item.sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');

      item.approvalStatus = 'Pending Approval';
      item.rejectionReason = null;
      item.rejectedAt = null;
      item.updatedAt = new Date().toISOString();

      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return item;
    },

    async resubmitRejected(id, fixes = {}) {
      // Allows seller to update product with corrections and resubmit to Pending Approval
      await new Promise(r => setTimeout(r, 70));
      const list = getStoredProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Product not found');
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || item.sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');


      Object.assign(item, fixes);
      item.approvalStatus = 'Pending Approval';
      item.rejectionReason = null;
      item.rejectedAt = null;
      item.updatedAt = new Date().toISOString();

      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return item;
    },

    async archiveProduct(id) {
      await new Promise(r => setTimeout(r, 50));
      const list = getStoredProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Product not found');
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || item.sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');

      item.approvalStatus = 'Archived';
      item.updatedAt = new Date().toISOString();
      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return item;
    },

    async restoreProduct(id) {
      await new Promise(r => setTimeout(r, 50));
      const list = getStoredProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Product not found');
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || item.sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');

      item.approvalStatus = item.stock > 0 ? 'Published' : 'Draft';
      item.updatedAt = new Date().toISOString();
      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return item;
    },

    async duplicateProduct(id) {
      await new Promise(r => setTimeout(r, 60));
      const list = getStoredProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Product not found');
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || item.sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');


      const dupId = `PRD-${Date.now().toString(36).toUpperCase()}`;
      const copy = JSON.parse(JSON.stringify(item));
      copy.id = dupId;
      copy.name = `${item.name} (Copy)`;
      copy.slug = `${item.slug}-copy-${Date.now().toString(36).slice(-4)}`;
      copy.approvalStatus = 'Draft';
      copy.rejectionReason = null;
      copy.rejectedAt = null;
      copy.publishedAt = null;
      copy.createdAt = new Date().toISOString();
      copy.updatedAt = new Date().toISOString();

      list.unshift(copy);
      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return copy;
    },

    async deleteDraft(id) {
      return this.deleteProduct(id);
    },

    async deleteProduct(id) {
      await new Promise(r => setTimeout(r, 50));
      const list = getStoredProducts();
      const index = list.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Product not found');
      const user = window.currentUser ? window.currentUser() : null;
      const seller = user && window.sellerOf ? window.sellerOf(user.id) : null;
      const isAdmin = window.currentAdmin && window.currentAdmin();
      if (!isAdmin && (!seller || list[index].sellerId !== seller.id)) throw new Error('You can only manage products belonging to your seller account.');
      list.splice(index, 1);
      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return true;
    },

    /**
     * Admin Simulator Method
     * Used ONLY to demonstrate the approval lifecycle in this prototype.
     * Real backend executes this securely in the Admin Service.
     */
    async simulateAdminReview(id, decision, reason = '') {
      await new Promise(r => setTimeout(r, 60));
      if (!window.currentAdmin || !window.currentAdmin()) throw new Error('Administrator authentication required.');
      const list = getStoredProducts();
      const item = list.find(p => p.id === id);
      if (!item) throw new Error('Product not found');
      const seller = LS.get('sellers',[]).find(s=>s.id===item.sellerId);
      if (!seller || seller.status !== 'approved') throw new Error('Seller must be approved before a product can be published.');

      if (decision === 'approve') {
        item.approvalStatus = 'Published';
        item.publishedAt = new Date().toISOString();
        item.rejectionReason = null;
      } else if (decision === 'reject') {
        item.approvalStatus = 'Rejected';
        item.rejectionReason = reason || 'Product specifications do not meet marketplace standards. Please provide studio photos and accurate sizing.';
        item.rejectedAt = new Date().toISOString();
      }
      item.updatedAt = new Date().toISOString();

      saveProducts(list);
      window.dispatchEvent(new CustomEvent('anilyfe:products-updated'));
      return item;
    }
  };

  window.productService = productService;
})();
