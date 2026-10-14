/** ANILyfe Seller Service — seller-owned data only. */
(function(){
  function currentSeller(){
    const u = window.currentUser ? window.currentUser() : null;
    return u && window.sellerOf ? window.sellerOf(u.id) : null;
  }
  function getStoredProfile(){
    const seller = currentSeller();
    if(!seller) return null;
    return {
      ...seller,
      storeName: seller.storeName || seller.businessName || '',
      slug: seller.slug || '',
      logo: seller.logo || '',
      banner: seller.banner || '',
      description: seller.description || seller.sells || '',
      category: seller.category || '',
      country: seller.country || 'Nigeria',
      state: seller.state || '', city: seller.city || '', lga: seller.lga || '',
      contact: seller.contact || {phone:'',email:(window.currentUser()?.email||''),dispatchAddress:''},
      rating: Number(seller.rating||0), reviewCount: Number(seller.reviewCount||0),
      verificationStatus: seller.verificationStatus || 'Not Started',
      badges: Array.isArray(seller.badges)?seller.badges:[],
      foundingSellerNumber: seller.foundingSellerNumber || null,
      foundingSellerActive: Boolean(seller.foundingSellerActive),
      commissionRate: seller.commissionRate || {rate:15,label:'Standard Seller (15%)',type:'standard'},
      storeStatus: seller.storeStatus || 'Under Review',
      deliverySettings: seller.deliverySettings || {},
      returnPolicy: seller.returnPolicy || '', refundPolicy: seller.refundPolicy || ''
    };
  }
  function saveProfile(profile){
    const seller=currentSeller(); if(!seller) throw new Error('Seller identity not found.');
    const sellers=LS.get('sellers',[]); const i=sellers.findIndex(s=>s.id===seller.id); if(i<0) throw new Error('Seller identity not found.');
    const protectedKeys=['commissionRate','foundingSellerNumber','foundingSellerActive','badges','verificationStatus','status'];
    const next={...sellers[i],...profile,updatedAt:new Date().toISOString()};
    protectedKeys.forEach(k=>{ if(profile[k]===undefined) return; next[k]=sellers[i][k]; });
    sellers[i]=next; LS.set('sellers',sellers); return next;
  }
  const sellerService={
    async getProfile(){await new Promise(r=>setTimeout(r,20)); return getStoredProfile();},
    async updateStore(updates){
      const current=getStoredProfile(); if(!current) throw new Error('Seller identity not found.');
      const {commissionRate,foundingSellerNumber,foundingSellerActive,badges,verificationStatus,status,...allowed}=updates||{};
      const normalized = {...current,...allowed,contact:{...current.contact,...(allowed.contact||{})}};
      if (allowed.storeName !== undefined) normalized.businessName = String(allowed.storeName || '').trim();
      if (allowed.state !== undefined) normalized.state = String(allowed.state || '').trim();
      if (allowed.city !== undefined) normalized.city = String(allowed.city || '').trim();
      if (allowed.lga !== undefined) normalized.lga = String(allowed.lga || '').trim();
      const next=saveProfile(normalized);
      window.dispatchEvent(new CustomEvent('anilyfe:seller-updated',{detail:next})); return next;
    },
    async setStoreStatus(status){ return this.updateStore({storeStatus:status}); },
    async getFoundingSellerBadge(){const p=getStoredProfile(); return p&&p.foundingSellerActive&&p.foundingSellerNumber?{number:p.foundingSellerNumber,label:`Founding Seller #${p.foundingSellerNumber}`,active:true}:null;},
    async getCommissionRate(){const p=getStoredProfile(); return p?p.commissionRate:{rate:15,label:'Standard Seller (15%)',type:'standard'};},
    async updateFeaturedProducts(ids){const p=getStoredProfile(); if(!p) throw new Error('Seller identity not found.'); return saveProfile({...p,featuredProductIds:Array.isArray(ids)?ids:[]});}
  };
  window.sellerService=sellerService;
})();
