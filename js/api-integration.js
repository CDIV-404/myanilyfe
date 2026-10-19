/* AniLife API integration layer.
 * Keeps the existing UI/routes while replacing marketplace persistence with the real API.
 * Auth uses an HttpOnly cookie plus persisted bearer access tokens for cross-site browser requests.
 */
(function(){
  const configuredApiBase=(window.ANILyfeConfig&&window.ANILyfeConfig.apiBaseUrl)||
    document.querySelector('meta[name="anilyfe-api"]')?.content||'';
  const isLocalHost=['localhost','127.0.0.1'].includes(location.hostname);
  const API_BASE=String(configuredApiBase).trim().replace(/\/+$/,'')||(isLocalHost?'http://localhost:4000':'');
  const TOKEN_KEYS=['anilyfe_admin_token','anilyfe_access_token'];
  const USER_CACHE_KEY='anilyfe_session_user';
  const SELLER_CACHE_KEY='anilyfe_session_seller';
  let pendingSignup=null;
  function storageGet(key){try{return localStorage.getItem(key)}catch{return null}}
  function sessionToken(){return storageGet('anilyfe_admin_token')||storageGet('anilyfe_access_token')||''}
  function loadCachedSession(){
    if(!sessionToken())return {user:null,seller:null};
    try{return {user:JSON.parse(storageGet(USER_CACHE_KEY)||'null'),seller:JSON.parse(storageGet(SELLER_CACHE_KEY)||'null')}}catch{return {user:null,seller:null}}
  }
  const cachedSession=loadCachedSession();
  const state = { user:cachedSession.user, seller:cachedSession.seller, products:[], cart:null, publicSettings:{}, announcements:[], apiErrors:{}, admin:{dashboard:null,users:[],sellers:[],products:[],orders:[],tickets:[],announcements:[],settings:{},notifications:[],payouts:[],analytics:null,auditLogs:[],applications:[],management:[],applicationError:null,failedSections:[],error:null}, booted:false };
  window.ANILyfeAPI = { baseUrl: API_BASE, state };

  async function request(path, options={}){
    if(!API_BASE){
      const err=new Error('Marketplace services are not connected yet. Please try again later.');
      err.code='API_BASE_URL_MISSING';
      throw err;
    }
    const token=sessionToken();
    const headers = {'Accept':'application/json', ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...(token?{Authorization:`Bearer ${token}`}:{ }), ...(options.headers||{})};
    const retryMe=path==='/api/auth/me'&&(!options.method||String(options.method).toUpperCase()==='GET');
    let res;
    for(let attempt=0;;attempt++){
      try{res=await fetch(API_BASE + path, {credentials:'include', ...options, headers});}
      catch(err){if(retryMe&&attempt===0){await new Promise(resolve=>setTimeout(resolve,250));continue;}throw err;}
      if(retryMe&&res.status>=500&&attempt===0){await new Promise(resolve=>setTimeout(resolve,250));continue;}
      break;
    }
    const text = await res.text(); let body=null; try{ body=text?JSON.parse(text):null; }catch{}
    if(!res.ok || body?.success===false){
      const err = new Error(body?.error?.message || `Request failed (${res.status})`);
      err.code = body?.error?.code || `HTTP_${res.status}`; err.status=res.status; throw err;
    }
    return body?.data ?? body;
  }
  window.ANILyfeAPI.request=request;
  window.ANILyfeAPI.checkoutQuote=async function(data){return request('/api/orders/quote',{method:'POST',body:JSON.stringify(data)})};

  function normalizeProduct(p){
    if(!p) return p;
    return {...p, img:p.img || p.images?.[0]?.url || p.images?.[0] || null,
      off:Number(p.off ?? p.discount ?? 0), reviews:Number(p.reviews ?? p.reviewsCount ?? 0),
      stock:p.stock ?? p.variants?.reduce((n,v)=>n+Number(v.stock||0),0) ?? 0};
  }
  function normalizeSeller(s){ const fallback=s?.id?`Seller #${String(s.id).slice(-6)}`:'Seller';const name=s?.businessName||s?.storeName||fallback;return s ? {...s, status:String(s.status||'').toLowerCase(), businessName:name,storeName:s.storeName||name,logo:s.logo||s.logoUrl||'',banner:s.banner||s.bannerUrl||''} : s; }
  function setUser(u,token){
    const previousUserId=state.user?.id;
    const fullName=u?`${u.firstName||''} ${u.lastName||''}`.trim():'';
    state.user=u?{...u,name:u.name||fullName||(u.id?`Member #${String(u.id).slice(-6)}`:'AniLife member'),region:u.region||'NG'}:null;
    if(previousUserId&&previousUserId!==state.user?.id){state.seller=null;try{localStorage.removeItem(SELLER_CACHE_KEY);}catch{}}
    try{
      if(state.user){
        if(token){TOKEN_KEYS.forEach(key=>localStorage.removeItem(key));localStorage.setItem(['ADMIN','SUPER_ADMIN'].includes(state.user.role)?'anilyfe_admin_token':'anilyfe_access_token',token);}
        const {id,email,firstName,lastName,name,phone,role,state:region,city,lga,region:userRegion,profileImageUrl,favoriteAnime,favoriteCharacter}=state.user;
        localStorage.setItem(USER_CACHE_KEY,JSON.stringify({id,email,firstName,lastName,name,phone,role,state:region,city,lga,region:userRegion,profileImageUrl,favoriteAnime,favoriteCharacter}));
      }else{
        TOKEN_KEYS.forEach(key=>localStorage.removeItem(key));localStorage.removeItem(USER_CACHE_KEY);localStorage.removeItem(SELLER_CACHE_KEY);state.seller=null;
      }
    }catch(e){console.warn('AniLife session storage is unavailable.');}
    window.currentUser=()=>state.user; window.currentAdmin=()=>['ADMIN','SUPER_ADMIN'].includes(state.user?.role)?{...state.user,username:state.user.email,roleLabel:state.user.role==='SUPER_ADMIN'?'Super administrator':'Administrator'}:null; window.sellerOf=id=>state.seller&&state.seller.userId===id?normalizeSeller(state.seller):null;
  }
  window.ANILyfeAPI.setUser=setUser;
  function cacheSeller(seller){
    state.seller=seller||null;
    try{
      if(!seller){localStorage.removeItem(SELLER_CACHE_KEY);return;}
      const fields=['id','userId','businessName','storeName','slug','status','verificationStatus','category','state','city','lga','storeStatus','foundingSellerNumber','foundingSellerActive','logoUrl','bannerUrl','logo','banner'];
      localStorage.setItem(SELLER_CACHE_KEY,JSON.stringify(Object.fromEntries(fields.filter(key=>seller[key]!==undefined).map(key=>[key,seller[key]]))));
    }catch(e){console.warn('AniLife seller session cache is unavailable.');}
  }
  function authRedirect(user){
    if(['ADMIN','SUPER_ADMIN'].includes(user?.role))return '#/admin-dashboard';
    if(user?.role==='SELLER')return '#/seller-center';
    return '#/marketplace';
  }

  async function refresh(){
    try{
      const me=await request('/api/auth/me'); setUser(me); cacheSeller(me.seller||null);
    }catch(e){ if(e.status===401){setUser(null);state.seller=null;} else console.warn('AniLife session refresh:',e.message); }
    try{ const pub=await request('/api/settings'); state.publicSettings=pub||{}; }catch{}
    try{ state.announcements=(await request('/api/announcements')||[]).map(a=>({...a,image:a.image||a.imageUrl||'',link:a.link||a.linkUrl||''})); state.apiErrors.announcements=null; }catch(e){ state.apiErrors.announcements=e; }
    try{ const p=await request('/api/products?limit=100'); state.products=(p.items||p||[]).map(normalizeProduct); state.apiErrors.products=null; }catch(e){ console.warn('AniLife product refresh:',e.message); state.apiErrors.products=e; }
    if(state.user?.role==='SELLER'){
      try{ cacheSeller(await request('/api/sellers/me/profile')); }catch{}
    }
    try{ state.cart=state.user ? await request('/api/cart') : {items:[]}; state.apiErrors.cart=null; }catch(e){ state.apiErrors.cart=e; state.cart={items:[]}; }
    if(['ADMIN','SUPER_ADMIN'].includes(state.user?.role)){
      const adminEndpoints=['Dashboard','Users','Sellers','Products','Orders','Support','Announcements','Settings','Notifications','Payouts','Analytics','Audit log','Admin applications','Admin management'];
      const jobs=await Promise.allSettled([request('/api/admin/dashboard'),request('/api/admin/users'),request('/api/admin/sellers'),request('/api/admin/products'),request('/api/admin/orders'),request('/api/admin/support'),request('/api/admin/announcements'),request('/api/admin/settings'),request('/api/notifications'),request('/api/payouts/admin'),request('/api/analytics/overview?dateRange=30d'),request('/api/admin/audit-logs'),state.user.role==='SUPER_ADMIN'?request('/api/admin/applications'):Promise.resolve([]),state.user.role==='SUPER_ADMIN'?request('/api/admin/management'):Promise.resolve([])]);
      const valueAt=(index,fallback)=>jobs[index].status==='fulfilled'?jobs[index].value:fallback;
      state.admin.dashboard=valueAt(0,null);
      state.admin.users=valueAt(1,[]).map(u=>({...u,name:`${u.firstName||''} ${u.lastName||''}`.trim(),createdAt:u.createdAt}));
      state.admin.sellers=valueAt(2,[]).map(x=>({...x,status:String(x.status||'').toLowerCase(),verificationStatus:String(x.verificationStatus||'').toLowerCase(),rating:Number(x.rating||0),reviewCount:Number(x.reviewCount||0)}));
      state.admin.products=valueAt(3,[]).map(x=>normalizeProduct({...x,approvalStatus:x.status}));
      state.admin.orders=valueAt(4,[]).map(o=>({...o,buyer:o.buyer?`${o.buyer.firstName||''} ${o.buyer.lastName||''}`.trim():o.buyerSnapshot?.email||'Buyer',seller:o.seller?.businessName||o.sellerSnapshot?.businessName||'Seller',product:o.items?.[0]?.productNameSnapshot||'—',status:o.orderStatus,total:Number(o.total||0)}));
      state.admin.tickets=valueAt(5,[]);
      state.admin.announcements=valueAt(6,[]).map(a=>({...a,image:a.image||a.imageUrl||'',link:a.link||a.linkUrl||''}));
      state.admin.settings=valueAt(7,{});
      state.admin.notifications=valueAt(8,[]).map(n=>({...n,orderId:n.orderId||n.data?.orderId,ticketId:n.ticketId||n.data?.ticketId}));
      state.admin.payouts=valueAt(9,[]);
      state.admin.analytics=valueAt(10,null);
      state.admin.auditLogs=valueAt(11,[]);
      state.admin.applications=valueAt(12,[]);
      state.admin.applicationError=jobs[12].status==='rejected'?jobs[12].reason:null;
      state.admin.management=valueAt(13,[]);
      state.admin.failedSections=jobs.flatMap((job,index)=>job.status==='rejected'?[adminEndpoints[index]]:[]);
      state.admin.error=null;
    }
    state.booted=true;
    window.dispatchEvent(new CustomEvent('anilyfe:api-ready',{detail:state}));
    return state;
  }
  window.ANILyfeAPI.refresh=refresh;
  window.ANILyfeAPI.getAnnouncements=()=>state.announcements||[];

  function productById(id){ return state.products.find(p=>p.id===id)||null; }
  window.approvedProducts=()=>state.products.filter(p=>['APPROVED','PUBLISHED','OUT_OF_STOCK'].includes(String(p.approvalStatus||p.status).toUpperCase()));

  // Auth: capture existing forms without changing the UI.
  document.addEventListener('submit', async function(e){
    const form=e.target;
    if(form.id==='adminApplicationOtpForm'){
      e.preventDefault();e.stopImmediatePropagation();
      try{const code=String(new FormData(form).get('code')||'').trim();await request('/api/auth/verify-email',{method:'POST',body:JSON.stringify({email:form.dataset.email,code})});toast?.('Email verified. Your administrator application is awaiting review.','shield-check');location.hash='#/admin-login';}
      catch(err){toast?.(err.message||'Email verification failed.','alert-triangle');}return;
    }
    if(form.id==='forgotPasswordForm'||form.id==='resetPasswordForm'){
      e.preventDefault();e.stopImmediatePropagation();const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;
      try{
        if(form.id==='forgotPasswordForm'){
          await request('/api/auth/forgot-password',{method:'POST',body:JSON.stringify({email:String(new FormData(form).get('email')||'').trim().toLowerCase()})});
          toast?.('If that email is registered, a reset link has been sent.','mail-check');
        }else{
          const token=new URLSearchParams(location.hash.split('?')[1]||'').get('token');if(!token)throw new Error('This reset link is missing or invalid. Request a new one.');
          await request('/api/auth/reset-password',{method:'POST',body:JSON.stringify({token,newPassword:String(new FormData(form).get('password')||'')})});
          toast?.('Password updated. Please log in with your new password.','shield-check');location.hash='#/auth';return;
        }
      }catch(err){toast?.(err.message||'Unable to complete password reset.','alert-triangle');}
      finally{if(button)button.disabled=false;}return;
    }
    if(form.id==='emailVerificationForm'){
      e.preventDefault();e.stopImmediatePropagation();
      try{
        if(!pendingSignup)throw new Error('Please start signup again to request a new verification code.');
        const code=String(new FormData(form).get('code')||'').trim();
        const verified=await request('/api/auth/verify-email',{method:'POST',body:JSON.stringify({email:pendingSignup.email,code})});
        setUser(verified.user,verified.accessToken);
        if(pendingSignup.business){const business=pendingSignup.business;const slug=business.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||`seller-${Date.now()}`;const application=await request('/api/sellers/apply',{method:'POST',body:JSON.stringify({businessName:business,slug,category:pendingSignup.category})});cacheSeller(application);setUser({...verified.user,role:'SELLER'},application.accessToken);}
        const name=verified.user.firstName||'there';pendingSignup=null;closeModal?.();toast?.(`Email verified. Welcome to AniLife, ${name}!`,'party-popper');await refresh();location.hash=authRedirect(state.user||verified.user);
      }catch(err){toast?.(err.message||'Email verification failed.','alert-triangle');}
      return;
    }
    if(form.id!=='authForm' && form.id!=='adminLoginForm' && form.id!=='adminRegForm' && form.id!=='adminSignupForm') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const submitButton=form.querySelector('[type="submit"]');
    const submitLabel=submitButton?.innerHTML;
    if(submitButton){submitButton.disabled=true;submitButton.setAttribute('aria-busy','true');submitButton.textContent='Please wait…';}
    const f=new FormData(form);
    try{
      if(form.id==='adminRegForm') throw Object.assign(new Error('Administrator accounts are created through the private admin application flow.'),{code:'ADMIN_REGISTRATION_DISABLED'});
      const email=String(f.get('email')||f.get('username')||'').trim().toLowerCase(), password=String(f.get('password')||'');
      if(form.id==='adminSignupForm'){
        const d=await request('/api/auth/admin-application',{method:'POST',body:JSON.stringify({email,password,firstName:String(f.get('firstName')||'').trim(),lastName:String(f.get('lastName')||'').trim()})});
        if(d.verificationRequired){form.id='adminApplicationOtpForm';form.dataset.email=d.email;form.innerHTML=`<h2 class="font-display text-xl font-bold">Verify your email</h2><p class="text-sm text-slate-600 mt-2 mb-4">Enter the 6-digit code sent to ${esc(d.email)}.</p><label class="lbl">Verification code</label><input class="inp mb-4" name="code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required><button class="btn btn-primary w-full" type="submit">Verify application email</button><button class="btn btn-ghost w-full mt-2" type="button" data-action="admin-application-resend">Send a new code</button>`;return d;}
        toast?.(`Application submitted. A super administrator must approve it and assign your role before you can sign in.`,'shield-check');
        location.hash='#/admin-login';
        return d;
      }
      if(form.id==='adminLoginForm'){
        const d=await request('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});
        if(!['ADMIN','SUPER_ADMIN'].includes(d.user.role)) throw new Error('This account is not authorized as an AniLife administrator.');
        setUser(d.user,d.accessToken); closeModal?.(); toast?.('Administrator session started.','shield-check'); await refresh(); location.hash=authRedirect(state.user||d.user); return;
      }
      // Existing auth modal has role in its surrounding UI; infer from business field.
      const creating=typeof authMode!=='undefined' && authMode==='create';
      if(creating){
        if(state.user)throw new Error('Log out before creating a new account. To become a seller, use Become a Seller to upgrade this account.');
        const name=String(f.get('name')||'').trim().split(/\s+/); const firstName=name.shift()||'User', lastName=name.join(' ')||'User';
        const business=String(f.get('business')||'').trim();
        const reg=await request('/api/auth/register',{method:'POST',body:JSON.stringify({email,password,firstName,lastName,phone:String(f.get('phone')||'').trim()||undefined,state:String(f.get('state')||'').trim()||undefined,city:String(f.get('city')||'').trim()||undefined,lga:String(f.get('lga')||'').trim()||undefined,accountType:business?'SELLER':'BUYER',businessName:business||undefined,category:String(f.get('sells')||'').trim()||undefined})});
        if(reg.verificationRequired){pendingSignup={email:reg.email,business:String(f.get('business')||'').trim(),category:String(f.get('sells')||'').trim()};form.id='emailVerificationForm';form.dataset.email=reg.email;form.innerHTML=`<div class="space-y-4"><h3 class="font-display text-xl font-bold">Verify your email</h3><p class="text-sm text-slate-600">Enter the 6-digit code sent to ${esc(reg.email)}. The code expires in 10 minutes.</p><label class="lbl" for="emailOtp">Verification code</label><input id="emailOtp" class="inp" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required><button class="btn btn-primary w-full" type="submit">Verify and continue</button><button class="btn btn-ghost w-full" type="button" data-action="email-verification-resend">Send a new code</button></div>`;return;}
        setUser(reg.user,reg.accessToken);
        if(reg.seller)cacheSeller(reg.seller);else cacheSeller(null);
        closeModal?.(); toast?.(`Welcome to AniLife Marketplace, ${firstName}! 🎉`,'party-popper'); await refresh(); location.hash=authRedirect(state.user||reg.user);
      }else{
        const d=await request('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});
        const requestedRole=String(form.dataset.role||'BUYER').toUpperCase();
        if(d.user.role!==requestedRole)throw new Error(requestedRole==='SELLER'?'This account is not registered as a seller. Choose the buyer login or apply to become a seller.':'This is a seller account. Use Seller log in.');
        setUser(d.user,d.accessToken); closeModal?.(); toast?.(`Welcome back, ${d.user.firstName}.`,'hand'); await refresh(); location.hash=authRedirect(state.user||d.user);
      }
    }catch(err){ toast?.(err.message||'Authentication failed.','alert-triangle'); }
    finally{if(submitButton?.isConnected){submitButton.disabled=false;submitButton.removeAttribute('aria-busy');submitButton.innerHTML=submitLabel;}}
  },true);

  // Service adapters.
  const ps=window.productService||{};
  window.productService={...ps,
    async getProducts(filter={}){ const q=new URLSearchParams(); if(filter.search)q.set('search',filter.search); if(filter.category&&filter.category!=='All')q.set('category',filter.category); if(filter.status&&filter.status!=='All')q.set('status',filter.status); if(filter.sellerId)q.set('sellerId',filter.sellerId); const d=await request((state.user?.role==='SELLER' && !filter.publicOnly)?'/api/sellers/me/products':'/api/products?'+q); const rows=(d.items||d||[]).map(normalizeProduct); state.products=rows; return rows; },
    async getProductById(id){ return normalizeProduct(await request('/api/products/'+encodeURIComponent(id))); },
    async getProductBySlug(slug){ return normalizeProduct(await request('/api/products/'+encodeURIComponent(slug))); },
    async createProduct(data){ const d=await request('/api/products',{method:'POST',body:JSON.stringify(data)}); const p=normalizeProduct(d); state.products=[p,...state.products.filter(x=>x.id!==p.id)]; return p; },
    async updateProduct(id,updates){ const d=await request('/api/products/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(updates)}); const p=normalizeProduct(d); state.products=state.products.map(x=>x.id===id?p:x); return p; },
    async submitForApproval(id){ return normalizeProduct(await request('/api/products/'+encodeURIComponent(id)+'/submit',{method:'POST',body:'{}'})); },
    async resubmitRejected(id,fixes={}){ if(Object.keys(fixes).length) await this.updateProduct(id,fixes); return this.submitForApproval(id); },
    async archiveProduct(id){ return normalizeProduct(await request('/api/products/'+encodeURIComponent(id)+'/archive',{method:'POST',body:'{}'})); },
    async deleteProduct(id){ return await request('/api/products/'+encodeURIComponent(id),{method:'DELETE'}); },
    async deleteDraft(id){ return this.deleteProduct(id); },
    async restoreProduct(id){ return normalizeProduct(await request('/api/products/'+encodeURIComponent(id)+'/restore',{method:'POST',body:'{}'})); },
    async duplicateProduct(id){ const p=await this.getProductById(id); const copy={...p}; delete copy.id; delete copy.slug; delete copy.createdAt; delete copy.updatedAt; copy.name=`${p.name} Copy`; copy.images=(p.images||[]).map(x=>x.url||x); copy.submitForApproval=false; return this.createProduct(copy); }
  };

  window.sellerService={...(window.sellerService||{}),
    async getProfile(){ return state.seller ? normalizeSeller(state.seller) : normalizeSeller(await request('/api/sellers/me/profile')); },
    async updateStore(updates){ const body={...(updates||{})};if(body.logo!==undefined){body.logoUrl=body.logo;delete body.logo;}if(body.banner!==undefined){body.bannerUrl=body.banner;delete body.banner;}state.seller=await request('/api/sellers/me/profile',{method:'PATCH',body:JSON.stringify(body)});cacheSeller(state.seller);return normalizeSeller(state.seller); },
    async updateFeaturedProducts(ids){ return this.updateStore({featuredProductIds:ids}); },
    async setStoreStatus(status){ return this.updateStore({storeStatus:status}); },
    getCommissionRate(){ return Number(state.seller?.commissionRate??15); },
    getFoundingSellerBadge(){ return {active:Boolean(state.seller?.foundingSellerActive),number:state.seller?.foundingSellerNumber||null}; }
  };
  window.storeService={...(window.storeService||{}), async getStorefront(id){ return await request('/api/sellers/'+encodeURIComponent(id||state.seller?.id||'')); }, async updateStorefront(d){ return request('/api/sellers/me/profile',{method:'PATCH',body:JSON.stringify(d)}); }, getShareableLink(slug){return `${location.origin}${location.pathname}#/store/${slug}`;} };

  window.deliveryService={...(window.deliveryService||{}), async getSettings(){const d=await request('/api/sellers/me/settings');return d||{};}, async updateSettings(d){return request('/api/sellers/me/settings',{method:'PATCH',body:JSON.stringify(d)});}, async simulateCalculateShipping(customerState){const s=await this.getSettings();const same=String(s.dispatchState||'').toLowerCase()===String(customerState||'').toLowerCase();const rules=s.deliveryRules||{};return {isSameState:same,fee:same&&rules.freeShippingInState?0:Number(same?rules.sameStateFee:rules.outsideStateFee)||0,isFree:same&&!!rules.freeShippingInState};}};
  window.verificationService={...(window.verificationService||{}), async getStatus(){return request('/api/sellers/me/verification');}, async submitVerification(d){return request('/api/sellers/me/verification',{method:'POST',body:JSON.stringify(d)});}, async resubmit(d){return this.submitVerification(d);}};
  window.inventoryService={...(window.inventoryService||{}), async getInventoryItems(){return request('/api/inventory');}, async getInventorySummary(){const rows=await request('/api/inventory');return {totalProducts:new Set(rows.map(x=>x.productId)).size,totalStock:rows.reduce((n,x)=>n+Number(x.stock||0),0),reservedStock:rows.reduce((n,x)=>n+Number(x.reserved||0),0),lowStockCount:rows.filter(x=>x.stock>0&&x.stock<=5).length,outOfStockCount:rows.filter(x=>x.stock===0).length};}, async updateSku(productId,variantId,newSku){return request('/api/inventory/variants/'+variantId,{method:'PATCH',body:JSON.stringify({sku:newSku,stock:0})});}, async adjustStock(productId,variantId,delta){const rows=await request('/api/inventory');const v=rows.find(x=>x.variantId===variantId);if(!v)throw new Error('Variant not found');return request('/api/inventory/variants/'+variantId,{method:'PATCH',body:JSON.stringify({stock:Math.max(0,Number(v.stock)+Number(delta)),sku:v.sku})});}, async setThreshold(){return true;}, async getHistory(){return request('/api/inventory/history');}};
  window.orderService={...(window.orderService||{}), async getOrders(filters={}){const d=await request('/api/orders');let rows=d||[];if(filters.status&&filters.status!=='All')rows=rows.filter(o=>String(o.orderStatus||'')===String(filters.status));return rows;}, async getOrderById(id){return request('/api/orders/'+encodeURIComponent(id));}, async updateOrderStatus(id,status,note=''){return request('/api/orders/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status,note})});}, async confirmOrder(id){return this.updateOrderStatus(id,'CONFIRMED');}, async processOrder(id){return this.updateOrderStatus(id,'PROCESSING');}, async markReadyToShip(id){return this.updateOrderStatus(id,'READY_TO_SHIP');}, async addTrackingAndShip(id,tracking=''){return this.updateOrderStatus(id,'SHIPPED',tracking);}, async markDelivered(id){return this.updateOrderStatus(id,'DELIVERED');}};
  window.notificationService={...(window.notificationService||{}), async getNotifications(){return request('/api/notifications');}, async getUnreadCount(){const x=await request('/api/notifications');return x.filter(n=>!n.read).length;}, async markAsRead(id){return request('/api/notifications/'+id+'/read',{method:'PATCH',body:'{}'});}, async markAllAsRead(){return request('/api/notifications/read-all',{method:'POST',body:'{}'});}, async addNotification(){return null;}};
  window.adminNotificationService={getAll:async()=>request('/api/notifications'),unread:async()=>{const x=await request('/api/notifications');return x.filter(n=>!n.read).length;},markRead:id=>request('/api/notifications/'+id+'/read',{method:'PATCH',body:'{}'}),markAllRead:()=>request('/api/notifications/read-all',{method:'POST',body:'{}'}),emailLink:()=>''};
  window.reviewService={...(window.reviewService||{}), async getReviews(filter='All'){const p=filter?.productId||filter;return request('/api/reviews/product/'+encodeURIComponent(p));}, async replyToReview(id,replyText){return request('/api/reviews/'+id+'/reply',{method:'POST',body:JSON.stringify({reply:replyText})});}, async getQuestions(productId){return request('/api/reviews/questions/'+encodeURIComponent(productId));}, async answerQuestion(id,answerText){return request('/api/reviews/questions/'+id+'/answer',{method:'POST',body:JSON.stringify({answer:answerText})});}};
  window.payoutService={...(window.payoutService||{}), async getOverview(){return request('/api/payouts');}, async updatePayoutAccount(d){return request('/api/sellers/me/settings',{method:'PATCH',body:JSON.stringify({bankAccount:d})});}, async requestPayout(amount){return request('/api/payouts/request',{method:'POST',body:JSON.stringify({amount:Number(amount)})});}};
  window.analyticsService={...(window.analyticsService||{}), async getOverview(dateRange='30d'){
    const data=await request('/api/analytics/overview?dateRange='+encodeURIComponent(dateRange));
    const kpis=data?.kpis||{}, ordersBreakdown=data?.ordersBreakdown||{};
    const total=Number(ordersBreakdown.total??kpis.totalOrders??0), completed=Number(ordersBreakdown.completed??0);
    const series=data?.series||{};
    const fillSeries=(values)=>Array.isArray(values)?values:Array(7).fill(0);
    return {
      ...data,
      kpis:{todaySales:0,totalRevenue:0,totalOrders:0,productsSold:0,storeViews:0,productViews:0,pendingOrders:0,pendingReturns:0,sellerRating:0,availableBalance:0,pendingBalance:0,...kpis},
      series:{labels:Array.isArray(series.labels)?series.labels:['1','2','3','4','5','6','7'],revenue:fillSeries(series.revenue),orders:fillSeries(series.orders),productsSold:fillSeries(series.productsSold)},
      ordersBreakdown:{total,completed,cancelled:0,returned:0,completionRate:total?`${((completed/total)*100).toFixed(1)}%`:'0%',...ordersBreakdown},
      productPerformance:{bestSellers:[],lowPerforming:[],...(data?.productPerformance||{})},
      locationTrends:{topStates:[],topCities:[],...(data?.locationTrends||{})}
    };
  }};

  window.viewNotifications=async function(){
    if(!state.user){location.hash='#/auth';return '';}
    try{const rows=await window.notificationService.getNotifications();return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">Marketplace</a></header><main class="max-w-5xl mx-auto px-5 pb-20"><div class="flex items-center justify-between mb-5"><div><div class="text-[10px] uppercase tracking-widest text-[#708BD1] font-bold">ACCOUNT</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C]">Notifications</h1></div><button class="btn btn-ghost text-xs" data-action="mark-notifications-read">Mark all read</button></div>${rows.length?`<div class="space-y-3">${rows.map(n=>`<div class="card p-4 ${n.read?'':'border-[#334EAC] bg-white'}"><div class="flex items-start gap-3"><div class="w-9 h-9 rounded-xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center"><i data-lucide="bell" style="width:15px;height:15px"></i></div><div class="flex-1"><div class="text-sm font-bold">${esc(n.title||'Notification')}</div><div class="text-xs text-slate-500 mt-1">${esc(n.message||'')}</div><div class="text-[10px] text-slate-400 mt-2">${n.createdAt?new Date(n.createdAt).toLocaleString('en-NG'):'—'}</div></div></div></div>`).join('')}</div>`:(window.ANILyfeUI?.EmptyState?.('No notifications to display','New order, verification and account updates will appear here.'))}</main></div>`;}catch(e){return window.ANILyfeUI?.ErrorState?.('Notifications unavailable',e.message||'We could not load your notifications.');}}

  window.viewCheckout=function(){
    const u=state.user;if(!u){location.hash='#/auth';return '';}
    const states=NIGERIAN_STATES_SHARED||[]; const totals=window.getCartTotals();
    if(!totals.items.length) return `<div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5"><div class="max-w-lg w-full">${window.ANILyfeUI?.EmptyState?.('No items to checkout','Your cart is empty. Add a published product before starting checkout.', '<a href="#/marketplace" class="btn btn-primary mt-5">Browse marketplace</a>')||''}</div></div>`;
    return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/cart" class="btn btn-ghost text-xs">← Back to cart</a></header><main class="max-w-2xl mx-auto px-5 pb-24"><h1 class="font-display text-2xl font-extrabold mb-6">Secure checkout</h1>${ANILyfeUI.RotatingImage('checkout','Delivery package','mb-6 h-32 w-full rounded-2xl md:h-40',1000,600)}<div class="card p-6 space-y-5"><div><div class="font-display font-bold">Delivery information</div><p class="text-xs text-slate-500 mt-1">Shipping is calculated by the backend using seller rules and your destination.</p><div class="grid sm:grid-cols-2 gap-3 mt-4"><div><label class="lbl">Country</label><input class="inp" value="Nigeria" readonly></div><div><label class="lbl">State *</label><select class="inp" id="checkoutState" required><option value="">Select state</option>${states.map(st=>`<option value="${esc(st)}" ${st===u.state?'selected':''}>${esc(st)}</option>`).join('')}</select></div><div><label class="lbl">City / Town *</label><input class="inp" id="checkoutCity" value="${esc(u.city||'')}" required></div><div><label class="lbl">LGA / Area</label><input class="inp" id="checkoutLga" value="${esc(u.lga||'')}"></div><div class="sm:col-span-2"><label class="lbl">Delivery address *</label><textarea class="inp min-h-[90px]" id="checkoutAddress" required></textarea></div></div></div><div class="border-t pt-4 space-y-2"><div class="flex justify-between text-sm"><span>Subtotal</span><b>${fmt(totals.subtotal)}</b></div><div class="flex justify-between text-sm"><span>Shipping</span><span class="text-slate-500">Calculated after destination</span></div><div class="flex justify-between font-display font-extrabold text-lg"><span>Subtotal</span><span>${fmt(totals.subtotal)}</span></div></div><p class="text-xs text-slate-500">Your final total is calculated by the backend immediately before payment. Payment confirmation is also backend-controlled.</p><button class="btn btn-primary w-full" data-action="checkout">Continue to secure payment</button></div></main></div>`;
  };

  // Public product/store pages use backend data directly. This prevents legacy renderers from reading stale browser records.
  window.viewProduct=async function(idOrSlug){
    try{
      const p=await window.productService.getProductBySlug(idOrSlug);
      const seller=p.seller||{};
      const images=(p.images||[]).map(x=>typeof x==='string'?x:x.url).filter(Boolean);
      const variants=(p.variants||[]).filter(v=>v.available!==false&&Number(v.stock||0)>Number(v.reserved||0));
      const variantOptions=variants.length>1?`<label class="lbl mt-5 block" for="productVariantSelect">Choose size or option</label><select class="inp max-w-sm" id="productVariantSelect"><option value="">Select an option</option>${variants.map(v=>`<option value="${esc(v.id)}" data-price="${Number(v.price||p.salePrice||p.price)}" data-stock="${Math.max(0,Number(v.stock||0)-Number(v.reserved||0))}">${esc([v.color,v.size].filter(Boolean).join(' / ')||v.sku)} · ${fmt(v.price||p.salePrice||p.price)}</option>`).join('')}</select>`:'';
      const price=variants.length===1?(variants[0].price||p.salePrice||p.price):(p.salePrice||p.price||0);
      return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">← Marketplace</a></header><main class="max-w-6xl mx-auto px-5 pb-20"><div class="grid lg:grid-cols-2 gap-7"><div class="card p-4"><div class="aspect-square rounded-2xl overflow-hidden bg-[#E7F1FF]"><img src="${esc(images[0]||window.ANILyfeCategoryImageFor(p.category))}" alt="${esc(p.name)}" class="w-full h-full object-cover" onerror="this.src='assets/images/placeholder.svg'"></div>${images.length>1?`<div class="grid grid-cols-4 gap-2 mt-3">${images.slice(0,4).map(src=>`<img src="${esc(src)}" alt="" class="aspect-square rounded-xl object-cover border border-[#D0E3FF]">`).join('')}</div>`:''}</div><div class="py-2"><div class="text-[10px] uppercase tracking-widest font-bold text-[#708BD1]">${esc(p.category||'Anime merchandise')}</div><h1 class="font-display font-extrabold text-3xl text-[#081F5C] mt-2">${esc(p.name)}</h1><p class="mt-3 text-sm text-[#4A5A8C]">${esc(p.description||p.shortDescription||'No description provided.')}</p>${variantOptions}<div id="productPrice" class="mt-6 font-display font-extrabold text-2xl">${fmt(price)}</div><div id="productVariantStock" class="mt-3 text-xs font-bold text-[#708BD1]">${Number(p.stock||0)>0?`${Number(p.stock)} available`:'Out of stock'}</div><div class="mt-6 flex flex-wrap gap-3"><button class="btn btn-primary" data-action="add-cart" data-id="${esc(p.id)}" ${Number(p.stock||0)<=0?'disabled':''}>Add to cart</button><button class="btn btn-ghost" data-action="wish" data-id="${esc(p.id)}"><i data-lucide="heart" style="width:15px;height:15px"></i> Save</button></div><div class="mt-8 p-4 rounded-2xl bg-white border border-[#D0E3FF]"><div class="text-[10px] uppercase tracking-widest text-[#708BD1] font-bold">SELLER</div><div class="font-display font-bold mt-1">${esc(seller.businessName||'Approved seller')}</div>${seller.slug?`<a class="text-xs font-bold text-[#334EAC] mt-2 inline-block" href="#/store/${encodeURIComponent(seller.slug)}">View store →</a>`:''}</div></div></div></main></div>`;
    }catch(e){return window.ANILyfeUI?.ErrorState?.('Product unavailable',e.status===404?'This product is not currently published on AniLife.':(e.message||'We could not load this product.'));}
  };
  window.viewSellerStore=async function(idOrSlug){
    try{const d=await window.storeService.getStorefront(idOrSlug);const s=d.profile||{};const products=d.products||[];return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">← Marketplace</a></header><main class="max-w-6xl mx-auto px-5 pb-20"><div class="card overflow-hidden"><div class="h-44 bg-[#081F5C] overflow-hidden">${s.bannerUrl?`<img src="${esc(s.bannerUrl)}" alt="" class="w-full h-full object-cover">`:`<img src="assets/images/web/figures-display.jpg" alt="" class="w-full h-full object-cover opacity-80" onerror="this.remove()">`}</div><div class="p-6 flex flex-col md:flex-row md:items-end gap-5 -mt-10"><div class="w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-card overflow-hidden flex items-center justify-center text-2xl font-black text-[#334EAC]">${s.profileImageUrl?`<img src="${esc(s.profileImageUrl)}" alt="" class="w-full h-full object-cover">`:(esc((s.businessName||'S')[0]))}</div><div class="flex-1"><div class="text-[10px] uppercase tracking-widest text-[#708BD1] font-bold">Approved seller${s.foundingSellerActive&&s.foundingSellerNumber?` · Founding Seller #${s.foundingSellerNumber}`:''}</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C]">${esc(s.businessName||'Seller')}</h1><p class="text-sm text-[#4A5A8C] mt-1">${esc(s.bio||'Anime marketplace seller')}</p></div><button class="btn btn-outline" data-action="copy-store-url" data-slug="${esc(s.slug||idOrSlug)}">Share store</button></div></div><div class="mt-7"><div class="flex items-center justify-between mb-4"><h2 class="font-display font-bold text-xl">Products</h2><span class="text-xs font-bold text-[#708BD1]">${products.length}</span></div>${products.length?`<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${products.map(p=>`<a href="#/product/${encodeURIComponent(p.slug||p.id)}" class="card p-3 block"><div class="aspect-square rounded-xl bg-[#E7F1FF] overflow-hidden"><img src="${esc(p.images?.[0]?.url||window.ANILyfeCategoryImageFor(p.category))}" alt="${esc(p.name)}" class="w-full h-full object-cover" loading="lazy" onerror="this.remove()"></div><div class="text-xs font-bold mt-3 line-clamp-2">${esc(p.name)}</div><div class="font-display font-extrabold mt-1">${fmt(p.salePrice||p.price||0)}</div></a>`).join('')}</div>`:(window.ANILyfeUI?.EmptyState?.('No products to display','This seller has no published products yet.'))}</div></main></div>`;}catch(e){return window.ANILyfeUI?.ErrorState?.('Store unavailable',e.status===404?'This seller store does not exist or is not public.':(e.message||'We could not load this store.'));}}

  // Core cart bridge. Cart IDs and quantities are backend-owned; no marketplace cart is persisted in localStorage.
  async function loadCart(){state.cart=state.user?await request('/api/cart'):{items:[]};return state.cart;}
  window.cartAdd=async function(id,selectedVariantId){if(!state.user){location.hash='#/auth';return;}const p=productById(id)||await window.productService.getProductById(id);const available=(p.variants||[]).filter(item=>Number(item.stock||0)-Number(item.reserved||0)>0);if(available.length>1&&!selectedVariantId){toast?.('Choose a size or option before adding this product to your cart.','list-checks');return;}const v=selectedVariantId?p.variants?.find(item=>item.id===selectedVariantId):available[0];if(!v){toast?.('This product has no available stock.','alert-triangle');return;}if(Number(v.stock||0)-Number(v.reserved||0)<=0){toast?.('This product option is out of stock.','alert-triangle');return;}await request('/api/cart/items',{method:'POST',body:JSON.stringify({productId:p.id,variantId:v.id,quantity:1})});await loadCart();toast?.(`Added "${esc(p.name)}" to cart.`,'shopping-cart');window.route?.();};
  window.cartRemove=async function(id){const c=state.cart||await loadCart();const item=(c.items||[]).find(i=>i.productId===id);if(item)await request('/api/cart/items/'+item.id,{method:'DELETE'});await loadCart();window.route?.();};
  window.getCartTotals=function(){const items=(state.cart?.items||[]).map(i=>{const p=normalizeProduct(i.product);const qty=Number(i.quantity||1),unit=Number(i.unitPrice||p.salePrice||p.price||0);return {cart:{id:p.id,qty},product:p,qty,unit,original:Number(p.price||unit),lineTotal:unit*qty,savings:Math.max(0,Number(p.price||unit)-unit)*qty};});const subtotal=items.reduce((n,x)=>n+x.lineTotal,0);return {items,subtotal,savings:items.reduce((n,x)=>n+x.savings,0),shipping:0,total:subtotal,shippingBreakdown:[]};};

  // API-backed checkout; server calculates all money. Paystack initialization returns its hosted checkout URL.
  window.checkoutNow=async function(){const u=state.user;if(!u){location.hash='#/auth';return;}const stateEl=document.getElementById('checkoutState'),city=document.getElementById('checkoutCity')?.value.trim(),lga=document.getElementById('checkoutLga')?.value.trim(),address=document.getElementById('checkoutAddress')?.value.trim();const destination=stateEl?.value;if(!destination||!city||!address){toast?.('Complete the delivery state, city and address.','map-pin');return;}try{const quote=await request('/api/orders/quote',{method:'POST',body:JSON.stringify({state:destination})});if(quote.sellerCount>1){toast?.('Your cart contains products from multiple sellers. Checkout one seller at a time.','shopping-bag');return;}const order=await request('/api/orders',{method:'POST',body:JSON.stringify({country:'Nigeria',state:destination,city,lga,addressLine:address,recipientName:`${u.firstName||''} ${u.lastName||''}`.trim(),recipientPhone:u.phone||''})});const pay=await request('/api/payments/initialize',{method:'POST',body:JSON.stringify({orderId:order.id})});if(pay.checkoutUrl){location.href=pay.checkoutUrl;return;}await loadCart();toast?.('Order created. Payment configuration is required to continue.','credit-card');location.hash='#/orders';}catch(e){toast?.(e.message||'Unable to create order.','alert-triangle');}};

  // Seller application used by the profile/seller page.
  window.sellerApply=async function(formEl){try{const f=new FormData(formEl);const business=String(f.get('businessName')||f.get('business')||'').trim();const slug=business.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||`seller-${Date.now()}`;const d=await request('/api/sellers/apply',{method:'POST',body:JSON.stringify({businessName:business,slug,bio:String(f.get('bio')||'').trim(),category:String(f.get('category')||f.get('sells')||'').trim(),state:String(f.get('state')||'').trim(),city:String(f.get('city')||'').trim(),lga:String(f.get('lga')||'').trim(),phone:String(f.get('phone')||'').trim(),businessEmail:String(f.get('businessEmail')||'').trim()||undefined})});cacheSeller(d);setUser({...state.user,role:'SELLER'},d.accessToken);window.closeModal?.();await refresh();toast?.('Seller application submitted for administrator approval.','shield-check');location.hash='#/seller-center';}catch(e){toast?.(e.message||'Unable to submit seller application.','alert-triangle');}};

  // Logout is backend-session based.
  const oldLogout=document.querySelector;
  document.addEventListener('click',async function(e){const t=e.target.closest('[data-action="logout"]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();try{await request('/api/auth/logout',{method:'POST',body:'{}'});}catch{}setUser(null);state.seller=null;state.cart={items:[]};toast?.('Logged out.','log-out');location.hash='#/';},true);

  // Admin route must never be granted merely because a URL is visited.
  const originalRoute=window.route;
  window.route=async function(){
    if(!state.booted) await refresh();
    if(location.hash.startsWith('#/admin') && !['ADMIN','SUPER_ADMIN'].includes(state.user?.role) && location.hash!=='#/admin-login' && location.hash!=='#/admin-signup'){location.hash='#/admin-login';return;}
    return originalRoute.apply(this,arguments);
  };
  window.addEventListener('hashchange',()=>{ if(state.booted) window.route(); });


  // API-backed page renderers. They use the in-memory API state only; marketplace records are not read from localStorage.
  window.viewCart=function(){
    if(state.apiErrors.cart) return window.ANILyfeUI?.ErrorState?.('Cart unavailable','We could not load your cart. Please try again.');
    if(!state.user){location.hash='#/auth';return '';}
    const items=(state.cart?.items||[]).map(i=>{const p=normalizeProduct(i.product||{});const qty=Number(i.quantity||1),unit=Number(i.unitPrice||p.salePrice||p.price||0);return {item:i,product:p,qty,unit,lineTotal:unit*qty};});
    const subtotal=items.reduce((n,x)=>n+x.lineTotal,0);
    const rows=items.map(x=>`<div class="flex items-center gap-4 py-4 border-b" style="border-color:var(--light)"><div class="prod-media w-16 h-16 shrink-0"><img src="${x.product.img||window.ANILyfeCategoryImageFor(x.product.category)}" alt="${esc(x.product.name)}" loading="lazy" onerror="this.remove()"></div><div class="flex-1 min-w-0"><div class="font-bold text-sm truncate">${esc(x.product.name)}</div><div class="text-xs" style="color:var(--mid)">Qty ${x.qty} · ${fmt(x.unit)} each</div></div><div class="font-display font-extrabold">${fmt(x.lineTotal)}</div><button class="btn btn-danger !py-2 !px-3 text-xs" data-action="cart-remove" data-id="${x.product.id}"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button></div>`).join('');
    return `<div class="min-h-screen" style="background:var(--off)"><header class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">← Keep shopping</a></header><main class="max-w-3xl mx-auto px-5 pb-24"><h1 class="font-display text-2xl font-extrabold mb-6">Your cart</h1>${items.length?`<div class="card p-5">${rows}<div class="pt-5 space-y-2 border-t border-[#E7F1FF]"><div class="flex justify-between text-sm"><span>Subtotal</span><span>${fmt(subtotal)}</span></div><div class="flex justify-between text-sm"><span>Shipping</span><span>Calculated at checkout</span></div><div class="flex items-center justify-between pt-2"><div class="font-display text-lg font-extrabold">Subtotal: ${fmt(subtotal)}</div><a href="#/checkout" class="btn btn-primary">Checkout <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a></div></div></div>`:(window.ANILyfeUI?.EmptyState?.('Your cart is empty','Add a published product to start your order.','<a href=\"#/marketplace\" class=\"btn btn-primary mt-5\">Browse marketplace</a>')||'')}</main></div>`;
  };
  window.getCartTotals=function(){const items=(state.cart?.items||[]).map(i=>{const p=normalizeProduct(i.product||{}),qty=Number(i.quantity||1),unit=Number(i.unitPrice||p.salePrice||p.price||0);return {cart:i,product:p,qty,unit,original:Number(p.price||unit),lineTotal:unit*qty,savings:Math.max(0,Number(p.price||unit)-unit)*qty};});const subtotal=items.reduce((n,x)=>n+x.lineTotal,0);return {items,subtotal,savings:items.reduce((n,x)=>n+x.savings,0),shipping:null,total:null,shippingBreakdown:[]};};
  window.viewOrders=function(){if(state.apiErrors.orders) return window.ANILyfeUI?.ErrorState?.('Orders unavailable','We could not load your orders. Please try again.');if(!state.user){location.hash='#/auth';return '';}const orders=state._orders||[];return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">← Market</a></header><main class="max-w-6xl mx-auto px-5 pb-20"><h1 class="font-display font-extrabold text-2xl mb-6">My orders</h1>${orders.length?`<div class="space-y-4">${orders.map(o=>`<a href="#/orders/${o.id}" class="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 reveal block"><div><div class="font-display font-extrabold text-lg">${esc(o.orderNumber||o.id)}</div><div class="text-xs text-[#708BD1] font-bold mt-1">${o.createdAt?new Date(o.createdAt).toLocaleDateString():'—'}</div></div><div class="flex items-center gap-3"><span class="badge">${esc(o.orderStatus||'New')}</span><span class="text-xs font-bold text-[#5A6A9C]">${o.items?.length||0} items</span><span class="font-display font-extrabold text-lg">${fmt(o.total||0)}</span></div></a>`).join('')}</div>`:(window.ANILyfeUI?.EmptyState?.('No orders to display','Your completed and current orders will appear here.','<a href=\"#/marketplace\" class=\"btn btn-primary mt-5\">Start shopping</a>')||'')}</main></div>`;};
  const previousRefresh=refresh;
  refresh=async function(){const r=await previousRefresh(); if(state.user){try{state._orders=await request('/api/orders');state.apiErrors.orders=null;}catch(e){state.apiErrors.orders=e;state._orders=[];}} return r;};
  window.ANILyfeAPI.refresh=refresh;
  window.ANILyfeAPI.getAnnouncements=()=>state.announcements||[];

  // API-backed admin mutations used by the existing dashboard UI.
  window.adminUpdateSellerStatus=async function(id,status){try{const s=status==='approved'?'APPROVED':status==='suspended'?'SUSPENDED':'REJECTED';let rejectionReason='';if(s==='REJECTED'){rejectionReason=prompt('Reason for rejecting this seller (required):','')||'';if(!rejectionReason.trim())return;}await request('/api/admin/sellers/'+encodeURIComponent(id)+'/approval',{method:'PATCH',body:JSON.stringify({status:s,rejectionReason})});await refresh();toast?.('Seller status updated.','store');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminUpdateProductStatus=async function(id,status){try{let rejectionReason='';if(status==='rejected'){rejectionReason=prompt('Reason for rejecting this product (required):','')||'';if(!rejectionReason.trim())return;}const mapped=status==='approved'?'PUBLISHED':'REJECTED';await request('/api/admin/products/'+encodeURIComponent(id)+'/approval',{method:'PATCH',body:JSON.stringify({status:mapped,rejectionReason})});await refresh();toast?.('Product moderation updated.','package-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminUpdateUserStatus=async function(id,status){try{await request('/api/admin/users/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status:String(status).toUpperCase()==='SUSPENDED'?'SUSPENDED':'ACTIVE'})});await refresh();toast?.('User status updated.','user-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminUpdateOrderStatus=async function(){toast?.('Admin order viewing is read-only for fulfillment status.','shield-check');};
  window.adminSetSettingsFromForm=async function(){try{const data={marketplaceName:document.getElementById('admin-market-name')?.value||'AniLife',supportEmail:document.getElementById('admin-market-email')?.value||'',adminEmail:document.getElementById('admin-admin-email')?.value||'',telegram:document.getElementById('admin-telegram')?.value||'',commissionRate:Number(document.getElementById('admin-market-commission')?.value||15)};await request('/api/admin/settings',{method:'PATCH',body:JSON.stringify(data)});await refresh();toast?.('Marketplace settings updated.','badge-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminToggleSetting=async function(key,enabled){try{await request('/api/admin/settings',{method:'PATCH',body:JSON.stringify({[key]:!Boolean(enabled)})});await refresh();toast?.(`${key.replace(/([A-Z])/g,' $1')} ${!Boolean(enabled)?'enabled':'disabled'}.`,'toggle-left');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminSaveSettings=window.adminSetSettingsFromForm;
  window.adminExit=async function(){try{await request('/api/auth/logout',{method:'POST',body:'{}'});}catch{}setUser(null);state.seller=null;location.hash='#/';};


  // Compatibility bridge for legacy renderers: protected marketplace reads come from API state.
  // Writes to server-owned records are intentionally blocked so stale localStorage cannot become a second database.
  if(typeof LS!=='undefined'){
    const lsGet=LS.get.bind(LS), lsSet=LS.set.bind(LS);
    const serverKeys=new Set(['users','sellers','products','orders','transactions','reviews','questions','payouts','notifications','inventoryHistory','marketplaceSettings','cart','tickets','announcements']);
    LS.get=function(k,d){
      if(k==='users') return state.admin.users?.length?state.admin.users:(state.user?[state.user]:d);
      if(k==='sellers') return state.admin.sellers?.length?state.admin.sellers:(state.seller?[state.seller]:d);
      if(k==='products') return state.products||[];
      if(k==='orders') return state._orders||[];
      if(k==='cart') return (state.cart?.items||[]).map(i=>({id:i.productId,productId:i.productId,variantId:i.variantId,qty:i.quantity}));
      if(k==='marketplaceSettings') return state.admin.settings||d;
      if(k==='tickets') return state.admin.tickets||d;
      if(k==='announcements') return state.admin.announcements||state.announcements||d;
      if(k==='notifications') return state.admin.notifications||d;
      return lsGet(k,d);
    };
    LS.set=function(k,v){ if(serverKeys.has(k)) return; return lsSet(k,v); };
  }

  // Paystack return verification: the backend/webhook remains authoritative.
  async function handlePaymentReturn(){
    const params=new URLSearchParams(location.search); const reference=params.get('reference')||params.get('trxref');
    if(!reference) return;
    try{await request('/api/payments/verify/'+encodeURIComponent(reference),{method:'POST',body:'{}'});toast?.('Payment confirmed.','badge-check');history.replaceState({},'',location.pathname);await refresh();location.hash='#/orders';}
    catch(e){console.warn('Payment return verification:',e.message);toast?.('Payment is still being verified. Check your order status shortly.','clock-3');history.replaceState({},'',location.pathname);location.hash='#/orders';}
  }

  // Initial bootstrap happens once; it is safe when the backend is offline.
  function revealApplication(immediate=false){ const splash=document.getElementById('anilyfe-splash'); if(!splash) return; const reveal=()=>{splash.classList.add('opacity-0','pointer-events-none'); setTimeout(()=>splash.remove(),420);}; if(immediate)reveal();else setTimeout(reveal,650); }
  let bootstrapTimedOut=false;
  let bootstrapTimer=setTimeout(()=>{
    bootstrapTimedOut=true;state.booted=true;
    window.dispatchEvent(new CustomEvent('anilyfe:api-ready',{detail:state}));
    revealApplication(true);
    const app=document.getElementById('app');
    if(app)app.innerHTML='<main class="min-h-screen bg-[#F6FCFF] flex items-center justify-center p-5"><section class="card max-w-md w-full p-8 text-center"><h1 class="font-display text-xl font-extrabold text-[#081F5C]">Taking too long...</h1><p class="mt-2 text-sm text-slate-600">The marketplace could not finish connecting. Retry, or sign in while we check the connection.</p><button class="btn btn-primary mt-5" data-action="retry-bootstrap">Retry</button><a class="btn btn-ghost mt-2" href="#/auth">Go to sign in</a></section></main>';
  },5000);
  window.ANILyfeAPI.retryBootstrap=async function(){
    clearTimeout(bootstrapTimer);bootstrapTimedOut=false;state.booted=false;
    const app=document.getElementById('app');if(app)app.innerHTML=window.ANILyfeUI?.AnimeLoader?.('Retrying marketplace connection...')||'';
    try{await refresh();await handlePaymentReturn();revealApplication(true);if(typeof window.route==='function')window.route();}
    catch(error){state.booted=true;revealApplication(true);if(app)app.innerHTML='<main class="min-h-screen bg-[#F6FCFF] flex items-center justify-center p-5"><section class="card max-w-md w-full p-8 text-center"><h1 class="font-display text-xl font-extrabold text-[#081F5C]">Connection failed</h1><p class="mt-2 text-sm text-slate-600">Please try again in a moment.</p><button class="btn btn-primary mt-5" data-action="retry-bootstrap">Retry</button></section></main>';}
  };
  refresh().then(()=>handlePaymentReturn()).then(()=>{ clearTimeout(bootstrapTimer); revealApplication(); if(typeof window.route==='function') window.route(); }).catch(()=>{clearTimeout(bootstrapTimer);state.booted=true;window.dispatchEvent(new CustomEvent('anilyfe:api-ready',{detail:state}));revealApplication();if(typeof window.route==='function')window.route();});
})();
