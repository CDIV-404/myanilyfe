/**
 * ANILyfe Store Service
 * Manages seller storefront branding, policies, featured product curation, and public store URL.
 * Strictly marketplace storefront management: No social feeds or followers.
 */
(function() {
  const storeService = {
    async getStorefront(idOrSlug = null) {
      let profile = null;
      if (idOrSlug) {
        const sellers = LS.get('sellers', []);
        profile = sellers.find(s => s.id === idOrSlug || String(s.slug || '').toLowerCase() === String(idOrSlug).toLowerCase()) || null;
        if (profile) {
          profile = {
            ...profile,
            storeName: profile.storeName || profile.businessName || '', slug: profile.slug || profile.id || '',
            logo: profile.logo || '', banner: profile.banner || '', description: profile.description || profile.sells || '',
            category: profile.category || '', country: profile.country || 'Nigeria', state: profile.state || '', city: profile.city || '', lga: profile.lga || '',
            contact: profile.contact || {phone:'',email:''}, rating: Number(profile.rating || 0), reviewCount: Number(profile.reviewCount || 0),
            badges: Array.isArray(profile.badges) ? profile.badges : [], foundingSellerNumber: profile.foundingSellerNumber || null,
            foundingSellerActive: Boolean(profile.foundingSellerActive), storeStatus: profile.storeStatus || 'Under Review',
            returnPolicy: profile.returnPolicy || '', refundPolicy: profile.refundPolicy || ''
          };
        }
      } else {
        profile = await window.sellerService.getProfile();
      }
      if (!profile) throw new Error('Seller store not found.');
      if (profile.status !== 'approved') throw new Error('Seller store is not publicly available.');
      const allProducts = LS.get('products', []);
      const publicProducts = allProducts.filter(p => p.sellerId === profile.id && ['Published','Approved','Out of Stock'].includes(p.approvalStatus || p.status));
      const featured = publicProducts.filter(p => Array.isArray(profile.featuredProductIds) && profile.featuredProductIds.includes(p.id));
      return { profile, products: publicProducts, featuredProducts: featured.length ? featured : publicProducts.slice(0,3), shareUrl: `${window.location.origin}/#/store/${profile.slug || profile.id}` };
    },
    async updateStorefront(data) { return window.sellerService.updateStore(data); },
    getShareableLink(slug) { const base = window.location.origin + window.location.pathname; return `${base}#/store/${slug || ''}`; }
  };

  window.storeService = storeService;
})();
