/* ANILyfe API integration layer.
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
  /* Single-flight promise for the initial /api/auth/me probe. Declared early: setUser() resets it. */
  let sessionPromise=null;
  const SESSION_TIMEOUT_MS=10000;
  function storageGet(key){try{return localStorage.getItem(key)}catch{return null}}
  function tokenKeyFor(user){return ['ADMIN','SUPER_ADMIN'].includes(user?.role)?'anilyfe_admin_token':'anilyfe_access_token'}
  function cachedUser(){try{return JSON.parse(storageGet(USER_CACHE_KEY)||'null')}catch{return null}}
  function sessionToken(user=state?.user||cachedUser()){return storageGet(tokenKeyFor(user))||''}
  function loadCachedSession(){
    const user=cachedUser();
    if(!user||!sessionToken(user))return {user:null,seller:null};
    try{return {user,seller:JSON.parse(storageGet(SELLER_CACHE_KEY)||'null')}}catch{return {user:null,seller:null}}
  }
  const cachedSession=loadCachedSession();
  const state = { user:cachedSession.user, seller:cachedSession.seller, products:[], cart:null, publicSettings:{}, announcements:[], apiErrors:{}, admin:{dashboard:null,users:[],sellers:[],products:[],orders:[],tickets:[],announcements:[],settings:{},notifications:[],payouts:[],withdrawals:{summary:{},withdrawals:[]},disputes:[],analytics:null,auditLogs:[],applications:[],management:[],reconciliation:null,applicationError:null,failedSections:[],error:null}, booted:false, bootTimedOut:false, authLoading:true, authResolved:false, sessionError:null };
  window.ANILyfeAPI = { baseUrl: API_BASE, state };

  /* Requests that answer with 401/403 as a normal credential result, never as an expired session. */
  const CREDENTIAL_PATHS=['/api/auth/login','/api/auth/register','/api/auth/forgot-password','/api/auth/reset-password','/api/auth/verify-email','/api/auth/admin-application','/api/auth/change-password','/api/auth/logout'];
  let unauthorizedInFlight=false;
  function apiError(message,status,code,path){ const err=new Error(message); err.status=status; err.code=code; err.path=path; return err; }
  /* Session expiry is handled once per burst: refresh() fires many requests in parallel. */
  function handleUnauthorized(){
    if(unauthorizedInFlight)return;
    unauthorizedInFlight=true;
    const hadSession=Boolean(state.user);
    setUser(null);
    state.authResolved=true; state.authLoading=false; state.sessionError=null;
    if(hadSession){
      toast?.('Your session expired. Please sign in again.','log-out');
      if(!['#/auth','#/login','#/signup','#/admin-login'].includes(location.hash))location.hash='#/auth';
    }
  }
  /* 401 is the interceptor's job: a dead session must end the session cleanly instead of leaving a
     guard to render a half-loaded page. Everything else travels to the caller with a status so the
     page owner can pick 403/404/500. */
  function handleApiFailure(err){
    const path=String(err.path||'');
    const isCredentialCall=CREDENTIAL_PATHS.some(prefix=>path.startsWith(prefix));
    if(err.status===401 && !isCredentialCall && !err.sessionProbe) handleUnauthorized();
  }
  async function request(path, options={}){
    if(!API_BASE){
      throw apiError('Marketplace services are not connected yet. Please try again later.',0,'API_BASE_URL_MISSING',path);
    }
    const token=sessionToken();
    const headers = {'Accept':'application/json', ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...(token?{Authorization:`Bearer ${token}`}:{ }), ...(options.headers||{})};
    const retryMe=path==='/api/auth/me'&&(!options.method||String(options.method).toUpperCase()==='GET');
    const {sessionProbe,...fetchOptions}=options;
    let res;
    for(let attempt=0;;attempt++){
      try{res=await fetch(API_BASE + path, {credentials:'include', ...fetchOptions, headers});}
      catch(err){
        if(retryMe&&attempt===0){await new Promise(resolve=>setTimeout(resolve,250));continue;}
        if(err?.name==='AbortError')throw apiError('The marketplace took too long to respond.',0,'REQUEST_TIMEOUT',path);
        const unreachable=apiError('We could not reach the ANILyfe servers. Check your connection and try again.',0,'NETWORK_UNREACHABLE',path);
        handleApiFailure(unreachable);
        throw unreachable;
      }
      if(retryMe&&res.status>=500&&attempt===0){await new Promise(resolve=>setTimeout(resolve,250));continue;}
      break;
    }
    const text = await res.text(); let body=null; try{ body=text?JSON.parse(text):null; }catch{}
    if(!res.ok || body?.success===false){
      const err = apiError(body?.error?.message || `Request failed (${res.status})`, res.status, body?.error?.code || `HTTP_${res.status}`, path);
      if(sessionProbe)err.sessionProbe=true;
      handleApiFailure(err);
      throw err;
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
  function normalizeSeller(s){ const fallback=s?.id?`Seller #${String(s.id).slice(-6)}`:'Seller';const name=s?.businessName||s?.storeName||fallback;return s ? {...s, status:String(s.status||'').toLowerCase(), businessName:name,storeName:s.storeName||name,description:s.description??s.bio??'',logo:s.logo||s.logoUrl||'',banner:s.banner||s.bannerUrl||'',contact:{phone:s.contact?.phone||s.phone||'',email:s.contact?.email||s.businessEmail||'',dispatchAddress:s.contact?.dispatchAddress||''},returnPolicy:s.returnPolicy||'',refundPolicy:s.refundPolicy||''} : s; }
  function setUser(u,token){
    const previousUserId=state.user?.id;
    const fullName=u?`${u.firstName||''} ${u.lastName||''}`.trim():'';
    state.user=u?{...u,name:u.name||fullName||(u.id?`Member #${String(u.id).slice(-6)}`:'ANILyfe member'),region:u.region||'NG'}:null;
    if(state.user){
      unauthorizedInFlight=false;
      /* A freshly issued token invalidates the memoised probe so the next refresh re-reads /api/auth/me. */
      if(token)sessionPromise=null;
    }
    if(previousUserId&&previousUserId!==state.user?.id){state.seller=null;try{localStorage.removeItem(SELLER_CACHE_KEY);}catch{}}
    try{
      if(state.user){
        if(token){TOKEN_KEYS.forEach(key=>localStorage.removeItem(key));localStorage.setItem(['ADMIN','SUPER_ADMIN'].includes(state.user.role)?'anilyfe_admin_token':'anilyfe_access_token',token);}
        const {id,email,firstName,lastName,name,phone,role,state:region,city,lga,region:userRegion,profileImageUrl,favoriteAnime,favoriteCharacter}=state.user;
        localStorage.setItem(USER_CACHE_KEY,JSON.stringify({id,email,firstName,lastName,name,phone,role,state:region,city,lga,region:userRegion,profileImageUrl,favoriteAnime,favoriteCharacter}));
      }else{
        TOKEN_KEYS.forEach(key=>localStorage.removeItem(key));localStorage.removeItem(USER_CACHE_KEY);localStorage.removeItem(SELLER_CACHE_KEY);state.seller=null;
      }
    }catch(e){console.warn('ANILyfe session storage is unavailable.');}
    window.currentUser=()=>state.user; window.currentAdmin=()=>['ADMIN','SUPER_ADMIN'].includes(state.user?.role)?{...state.user,username:state.user.email,roleLabel:state.user.role==='SUPER_ADMIN'?'Super administrator':'Administrator'}:null; window.sellerOf=id=>state.seller&&state.seller.userId===id?normalizeSeller(state.seller):null;
  }
  window.ANILyfeAPI.setUser=setUser;
  window.ANILyfeAPI.logout=async function(){
    if(state.user){
      try{await request('/api/auth/logout',{method:'POST',body:'{}'});}
      catch(error){if(error.status!==401)throw error;}
    }
    setUser(null);
    state.cart={items:[]};
  };
  function cacheSeller(seller){
    state.seller=seller||null;
    try{
      if(!seller){localStorage.removeItem(SELLER_CACHE_KEY);return;}
      const fields=['id','userId','businessName','storeName','slug','status','verificationStatus','verification','category','country','state','city','lga','phone','businessEmail','bio','description','storeStatus','foundingSellerNumber','foundingSellerActive','foundingPoliciesAcceptedAt','hasAcceptedTerms','logoUrl','bannerUrl','logo','banner','returnPolicy','refundPolicy','commissionRate','effectiveCommissionRate','rank','contact','rating','reviewCount'];
      localStorage.setItem(SELLER_CACHE_KEY,JSON.stringify(Object.fromEntries(fields.filter(key=>seller[key]!==undefined).map(key=>[key,seller[key]]))));
    }catch(e){console.warn('ANILyfe seller session cache is unavailable.');}
  }
  function authRedirect(user){
    if(['ADMIN','SUPER_ADMIN'].includes(user?.role))return '#/admin-dashboard';
    if(user?.role==='SELLER')return '#/seller-center';
    return '#/marketplace';
  }

  /* Resolves "who is signed in" exactly once: read the persisted token, then confirm it with
     GET /api/auth/me. isLoading stays true until that answer lands, so no route guard can see a
     half-loaded session. A network failure never clears a cached session — only a real 401 does. */
  async function resolveSession(force=false){
    if(sessionPromise&&!force)return sessionPromise;
    sessionPromise=(async()=>{
      state.authLoading=true;
      const storedToken=sessionToken();
      const cached=cachedUser();
      /* Paint from the cached session while the probe is in flight; the probe is authoritative. */
      if(cached&&storedToken&&!state.user)setUser(cached);
      let me=null,probeError=null;
      if(API_BASE){
        const controller=typeof AbortController==='function'?new AbortController():null;
        const timer=controller?setTimeout(()=>controller.abort(),SESSION_TIMEOUT_MS):null;
        try{ me=await request('/api/auth/me',{sessionProbe:true,...(controller?{signal:controller.signal}:{})}); }
        catch(error){ probeError=error; }
        finally{ if(timer)clearTimeout(timer); }
      }
      if(me){ setUser(me); cacheSeller(me.seller||null); state.sessionError=null; state.apiErrors.seller=null; }
      else if(probeError?.status===401){ setUser(null); state.seller=null; }
      else if(probeError) state.sessionError=probeError;
      state.authResolved=true;
      state.authLoading=false;
      window.dispatchEvent(new CustomEvent('anilyfe:auth-ready',{detail:state}));
      return state;
    })();
    return sessionPromise;
  }
  window.ANILyfeAPI.auth={
    isLoading:()=>state.authLoading,
    isResolved:()=>state.authResolved,
    ready:()=>resolveSession(),
    retry:()=>resolveSession(true)
  };

  async function refresh(){
    await resolveSession();
    try{ const pub=await request('/api/settings'); state.publicSettings=pub||{}; }catch{}
    try{ state.announcements=(await request('/api/announcements')||[]).map(a=>({...a,image:a.image||a.imageUrl||'',link:a.link||a.linkUrl||''})); state.apiErrors.announcements=null; }catch(e){ state.apiErrors.announcements=e; }
    try{ const p=await request('/api/products?limit=100'); state.products=(p.items||p||[]).map(normalizeProduct); state.apiErrors.products=null; }catch(e){ console.warn('ANILyfe product refresh:',e.message); state.apiErrors.products=e; }
    if(state.user?.role==='SELLER'){
      /* A failed revalidation must not eject an approved seller out of Seller Center. */
      try{ cacheSeller(await request('/api/sellers/me/profile')); state.apiErrors.seller=null; }
      catch(error){ state.apiErrors.seller=error; }
    }
    try{ state.cart=state.user ? await request('/api/cart') : {items:[]}; state.apiErrors.cart=null; }catch(e){ state.apiErrors.cart=e; state.cart={items:[]}; }
    if(['ADMIN','SUPER_ADMIN'].includes(state.user?.role)){
      const adminEndpoints=['Dashboard','Users','Sellers','Products','Orders','Support','Announcements','Settings','Notifications','Payouts','Analytics','Audit log','Admin applications','Admin management','Withdrawals','Disputes','Reconciliation'];
      const jobs=await Promise.allSettled([request('/api/admin/dashboard'),request('/api/admin/users'),request('/api/admin/sellers'),request('/api/admin/products'),request('/api/admin/orders'),request('/api/admin/support'),request('/api/admin/announcements'),request('/api/admin/settings'),request('/api/notifications'),request('/api/payouts/admin'),request('/api/analytics/overview?dateRange=30d'),request('/api/admin/audit-logs'),state.user.role==='SUPER_ADMIN'?request('/api/admin/applications'):Promise.resolve([]),state.user.role==='SUPER_ADMIN'?request('/api/admin/management'):Promise.resolve([]),request('/api/withdrawals/admin'),request('/api/withdrawals/admin/disputes'),request('/api/admin/reconciliation')]);
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
      state.admin.withdrawals=valueAt(14,{summary:{},withdrawals:[]});
      state.admin.disputes=valueAt(15,[]);
      state.admin.reconciliation=valueAt(16,null);
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
        const pendingApplication=Boolean(pendingSignup.application);
        if(pendingApplication){const application=await request('/api/sellers/apply',{method:'POST',body:JSON.stringify(pendingSignup.application)});cacheSeller(application);}
        const name=verified.user.firstName||'there';pendingSignup=null;closeModal?.();toast?.(`Email verified. Welcome to ANILyfe, ${name}!`,'party-popper');await refresh();location.hash=pendingApplication?'#/seller/application':authRedirect(state.user||verified.user);
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
        if(!['ADMIN','SUPER_ADMIN'].includes(d.user.role)) throw new Error('This account is not authorized as an ANILyfe administrator.');
        setUser(d.user,d.accessToken); closeModal?.(); toast?.('Administrator session started.','shield-check'); await refresh(); location.hash=authRedirect(state.user||d.user); return;
      }
      // Existing auth modal has role in its surrounding UI; infer from business field.
      const creating=typeof authMode!=='undefined' && authMode==='create';
      if(creating){
        if(state.user){
          const requestedSeller=String(form.dataset.role||'BUYER').toUpperCase()==='SELLER';
          if(requestedSeller&&state.user.role==='BUYER'){closeModal?.();window.openSellerAppModal?.();return;}
          throw new Error('You are already signed in. Use Become a Seller to upgrade this account instead of creating a new one.');
        }
        const name=String(f.get('name')||'').trim().split(/\s+/); const firstName=name.shift()||'User', lastName=name.join(' ')||'User';
        const isSellerSignup=String(form.dataset.role||'BUYER').toUpperCase()==='SELLER';
        const business=String(f.get('business')||'').trim();
        const reg=await request('/api/auth/register',{method:'POST',body:JSON.stringify({email,password,firstName,lastName,phone:String(f.get('phone')||'').trim()||undefined,state:String(f.get('state')||'').trim()||undefined,city:String(f.get('city')||'').trim()||undefined,lga:String(f.get('lga')||'').trim()||undefined,accountType:'BUYER'})});
        if(reg.verificationRequired){pendingSignup={email:reg.email,application:isSellerSignup?sellerApplicationPayload(form):null};form.id='emailVerificationForm';form.dataset.email=reg.email;form.innerHTML=`<div class="space-y-4"><h3 class="font-display text-xl font-bold">Verify your email</h3><p class="text-sm text-slate-600">Enter the 6-digit code sent to ${esc(reg.email)}. The code expires in 10 minutes.</p><label class="lbl" for="emailOtp">Verification code</label><input id="emailOtp" class="inp" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required><button class="btn btn-primary w-full" type="submit">Verify and continue</button><button class="btn btn-ghost w-full" type="button" data-action="email-verification-resend">Send a new code</button></div>`;return;}
        setUser(reg.user,reg.accessToken);
        if(reg.seller)cacheSeller(reg.seller);else cacheSeller(null);
        if(isSellerSignup){
          await submitSellerApplication(form);
          await refresh();
          closeModal?.();
          toast?.('Application Under Review. We will notify you after the administrator review.','shield-check');
          location.hash='#/seller/application';
          return;
        }
        closeModal?.(); toast?.(`Welcome to ANILyfe Marketplace, ${firstName}! 🎉`,'party-popper'); await refresh(); location.hash=authRedirect(state.user||reg.user);
      }else{
        const d=await request('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});
        const requestedRole=String(form.dataset.role||'BUYER').toUpperCase();
        if(d.user.role!==requestedRole)throw new Error(requestedRole==='SELLER'?'This account is not registered as a seller. Choose the buyer login or apply to become a seller.':'This is a seller account. Use Seller log in.');
        setUser(d.user,d.accessToken); closeModal?.(); toast?.(`Welcome back, ${d.user.firstName}.`,'hand'); await refresh(); location.hash=state.seller&&String(state.seller.status).toUpperCase()==='PENDING'?'#/seller/application':authRedirect(state.user||d.user);
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
    async getProfile(){ if(state.seller) return normalizeSeller(state.seller); const row=await request('/api/sellers/me/profile'); state.seller=row; cacheSeller(row); return normalizeSeller(row); },
    async updateStore(updates){ const body={...(updates||{})};if(body.logo!==undefined){body.logoUrl=body.logo;delete body.logo;}if(body.banner!==undefined){body.bannerUrl=body.banner;delete body.banner;}state.seller=await request('/api/sellers/me/profile',{method:'PATCH',body:JSON.stringify(body)});cacheSeller(state.seller);return normalizeSeller(state.seller); },
    async updateFeaturedProducts(ids){ return this.updateStore({featuredProductIds:ids}); },
    async acceptFoundingPolicies(){ const r=await request('/api/sellers/me/founding-policies',{method:'POST',body:'{}'}); await refresh(); return r; },
    async setStoreStatus(status){ return this.updateStore({storeStatus:status}); },
    getCommissionRate(){ return Number(state.seller?.commissionRate??15); },
    getFoundingSellerBadge(){ return {active:Boolean(state.seller?.foundingSellerActive),number:state.seller?.foundingSellerNumber||null}; }
  };
  window.storeService={...(window.storeService||{}), async getStorefront(id){ return await request('/api/sellers/'+encodeURIComponent(id||state.seller?.id||'')); }, async updateStorefront(d){ return request('/api/sellers/me/profile',{method:'PATCH',body:JSON.stringify(d)}); }, getShareableLink(slug){return `${location.origin}${location.pathname}#/store/${slug}`;} };

  window.deliveryService={...(window.deliveryService||{}), async getSettings(){const d=await request('/api/sellers/me/settings');return d||{};}, async updateSettings(d){return request('/api/sellers/me/settings',{method:'PATCH',body:JSON.stringify(d)});}, async simulateCalculateShipping(customerState){const s=await this.getSettings();const same=String(s.dispatchState||'').toLowerCase()===String(customerState||'').toLowerCase();const rules=s.deliveryRules||{};return {isSameState:same,fee:same&&rules.freeShippingInState?0:Number(same?rules.sameStateFee:rules.outsideStateFee)||0,isFree:same&&!!rules.freeShippingInState};}};
  window.verificationService={...(window.verificationService||{}), async getStatus(){return request('/api/sellers/me/verification');}, async submitVerification(d){return request('/api/sellers/me/verification',{method:'POST',body:JSON.stringify(d)});}, async resubmit(d){return this.submitVerification(d);}};
  window.inventoryService={...(window.inventoryService||{}), async getInventoryItems(){return request('/api/inventory');}, async getInventorySummary(){const rows=await request('/api/inventory');return {totalProducts:new Set(rows.map(x=>x.productId)).size,totalStock:rows.reduce((n,x)=>n+Number(x.stock||0),0),reservedStock:rows.reduce((n,x)=>n+Number(x.reserved||0),0),lowStockCount:rows.filter(x=>x.stock>0&&x.stock<=5).length,outOfStockCount:rows.filter(x=>x.stock===0).length};}, async updateSku(productId,variantId,newSku){return request('/api/inventory/variants/'+variantId,{method:'PATCH',body:JSON.stringify({sku:newSku,stock:0})});}, async adjustStock(productId,variantId,delta){const rows=await request('/api/inventory');const v=rows.find(x=>x.variantId===variantId);if(!v)throw new Error('Variant not found');return request('/api/inventory/variants/'+variantId,{method:'PATCH',body:JSON.stringify({stock:Math.max(0,Number(v.stock)+Number(delta)),sku:v.sku})});}, async setThreshold(){return true;}, async getHistory(){return request('/api/inventory/history');}};
  const ORDER_STATUS_LABELS={PENDING_PAYMENT:'New',CONFIRMED:'Confirmed',PROCESSING:'Processing',READY_TO_SHIP:'Ready to Ship',SHIPPED:'Shipped',DELIVERED:'Delivered',CANCELLED:'Cancelled',REFUND_PENDING:'Refund Pending',REFUNDED:'Refunded',RETURN_REQUESTED:'Returns',RETURNED:'Returned'};
  const PAYMENT_STATUS_LABELS={PENDING:'Pending',AUTHORIZED:'Authorized',PAID:'Paid',FAILED:'Failed',REFUNDED:'Refunded'};
  const presentOrder=o=>{
    if(!o||typeof o!=='object')return o;
    const items=(o.items||[]).map(item=>({...item,salePrice:item.salePrice??item.unitPrice,productImage:item.productImage||item.imageSnapshot||item.productSnapshot?.images?.[0]?.url||'',productName:item.productName||item.productNameSnapshot||'Product',variant:item.variant||item.variantName||item.skuSnapshot||'Standard',sku:item.sku||item.skuSnapshot||''}));
    const buyerSnapshot=o.buyerSnapshot&&typeof o.buyerSnapshot==='object'?o.buyerSnapshot:{};
    const delivery=o.deliverySnapshot&&typeof o.deliverySnapshot==='object'?o.deliverySnapshot:{};
    const buyer={
      name:[buyerSnapshot.firstName,buyerSnapshot.lastName].filter(Boolean).join(' ')||delivery.recipientName||'Buyer',
      email:buyerSnapshot.email||'',
      phone:delivery.recipientPhone||'',
      state:delivery.state||'',
      city:delivery.city||'',
      address:[delivery.addressLine,delivery.lga].filter(Boolean).join(', ')
    };
    return {
      ...o,
      items,
      buyer,
      timeline:(o.timeline||[]).map(entry=>({...entry,label:entry.label||ORDER_STATUS_LABELS[String(entry.status||'').toUpperCase()]||entry.status||'Update',timestamp:entry.timestamp||entry.createdAt})),
      orderNumber:o.orderNumber||o.id,
      orderStatusCode:o.orderStatus,
      paymentStatusCode:o.paymentStatus,
      orderStatus:ORDER_STATUS_LABELS[String(o.orderStatus||'').toUpperCase()]||o.orderStatus,
      paymentStatus:PAYMENT_STATUS_LABELS[String(o.paymentStatus||'').toUpperCase()]||o.paymentStatus,
      date:o.createdAt||o.date,
      netProductTotal:o.netProductTotal??o.subtotal,
      shippingFee:o.shippingFee??o.shipping,
      marketplaceCommission:o.marketplaceCommission??o.commissionAmount
    };
  };
  window.orderService={...(window.orderService||{}), async getOrders(filters={}){const d=await request('/api/orders');let rows=(d||[]).map(presentOrder);if(filters.status&&filters.status!=='All')rows=rows.filter(o=>o.orderStatus===filters.status);return rows;}, async getOrderById(id){return presentOrder(await request('/api/orders/'+encodeURIComponent(id)));}, async updateOrderStatus(id,status,note=''){return request('/api/orders/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status,note})});}, async confirmOrder(id){return this.updateOrderStatus(id,'CONFIRMED');}, async processOrder(id){return this.updateOrderStatus(id,'PROCESSING');}, async markReadyToShip(id){return this.updateOrderStatus(id,'READY_TO_SHIP');}, async addTrackingAndShip(id,tracking=''){return this.updateOrderStatus(id,'SHIPPED',tracking);}, async markDelivered(id){return this.updateOrderStatus(id,'DELIVERED');}, async confirmDelivery(id){return request('/api/orders/'+encodeURIComponent(id)+'/confirm-delivery',{method:'POST',body:'{}'});}, async openDispute(id,reason){return request('/api/orders/'+encodeURIComponent(id)+'/disputes',{method:'POST',body:JSON.stringify({reason})});}};
  window.notificationService={...(window.notificationService||{}), async getNotifications(){return request('/api/notifications');}, async getUnreadCount(){const x=await request('/api/notifications');return x.filter(n=>!n.read).length;}, async markAsRead(id){return request('/api/notifications/'+id+'/read',{method:'PATCH',body:'{}'});}, async markAllAsRead(){return request('/api/notifications/read-all',{method:'POST',body:'{}'});}, async addNotification(){return null;}};
  window.adminNotificationService={getAll:async()=>request('/api/notifications'),unread:async()=>{const x=await request('/api/notifications');return x.filter(n=>!n.read).length;},markRead:id=>request('/api/notifications/'+id+'/read',{method:'PATCH',body:'{}'}),markAllRead:()=>request('/api/notifications/read-all',{method:'POST',body:'{}'}),emailLink:()=>''};
  window.reviewService={...(window.reviewService||{}), async getReviews(filter='All'){const p=filter?.productId||filter;return request('/api/reviews/product/'+encodeURIComponent(p));}, async replyToReview(id,replyText){return request('/api/reviews/'+id+'/reply',{method:'POST',body:JSON.stringify({reply:replyText})});}, async getQuestions(productId){return request('/api/reviews/questions/'+encodeURIComponent(productId));}, async answerQuestion(id,answerText){return request('/api/reviews/questions/'+id+'/answer',{method:'POST',body:JSON.stringify({answer:answerText})});}};
  window.payoutService={...(window.payoutService||{}), async getOverview(){const response=await request('/api/payouts');return {...(response.balance||{}),...response,pendingBalance:response.balance?.pendingClearance||0};}, async getNigerianBanks(){return request('/api/payments/banks');}, async verifyAccount(bankCode,accountNumber){return request('/api/payments/resolve-account?bank_code='+encodeURIComponent(bankCode)+'&account_number='+encodeURIComponent(accountNumber));}, async updatePayoutAccount(d){return request('/api/sellers/me/settings',{method:'PATCH',body:JSON.stringify({bankAccount:d})});}, async quoteWithdrawal(amount){return request('/api/withdrawals/quote?amount='+encodeURIComponent(amount));}, async requestPayout(amount,expectedFeeAmount){return request('/api/withdrawals',{method:'POST',body:JSON.stringify({amount:Number(amount),expectedFeeAmount:Number(expectedFeeAmount),confirmed:true,idempotencyKey:crypto.randomUUID()})});}};
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
    try{const rows=await window.notificationService.getNotifications();return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">Marketplace</a></header><main class="max-w-5xl mx-auto px-5 pb-20"><div class="flex items-center justify-between mb-5"><div><div class="text-[10px] uppercase tracking-widest text-[#708BD1] font-bold">ACCOUNT</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C]">Notifications</h1></div><button class="btn btn-ghost text-xs" data-action="mark-notifications-read">Mark all read</button></div>${rows.length?`<div class="space-y-3">${rows.map(n=>`<div class="card p-4 ${n.read?'':'border-[#334EAC] bg-white'}"><div class="flex items-start gap-3"><div class="w-9 h-9 rounded-xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center"><i data-lucide="bell" style="width:15px;height:15px"></i></div><div class="flex-1"><div class="text-sm font-bold">${esc(n.title||'Notification')}</div><div class="text-xs text-slate-500 mt-1">${esc(n.message||'')}</div><div class="text-[10px] text-slate-400 mt-2">${n.createdAt?new Date(n.createdAt).toLocaleString('en-NG'):'—'}</div></div></div></div>`).join('')}</div>`:(window.ANILyfeUI?.EmptyState?.('No notifications to display','New order, verification and account updates will appear here.'))}</main></div>`;}catch(e){return window.ANILyfeUI.renderApiError(e,'Notifications unavailable');}}

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
    }catch(e){return window.ANILyfeUI.renderApiError(e,'Product unavailable');}
  };
  window.viewSellerStore=async function(idOrSlug){
    try{
      const d=await window.storeService.getStorefront(idOrSlug);
      const s=d.profile||{};
      const products=d.products||[];
      const slug=s.slug||idOrSlug;
      return `<div class="min-h-screen bg-[#F6FCFF]">
        <header class="sticky top-0 z-40 border-b border-[#D0E3FF] bg-white/95 backdrop-blur-md"><div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">${LOGO('text-2xl')}<div class="flex items-center gap-2"><a href="#/marketplace" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Marketplace</a><button class="btn btn-outline text-xs" data-action="copy-store-url" data-slug="${esc(slug)}"><i data-lucide="share-2" style="width:14px;height:14px"></i> Share store</button></div></div></header>
        <main class="mx-auto max-w-6xl space-y-6 px-5 py-8 pb-20">
          ${window.ANILyfeUI.storefrontCard(s,products,{shareAction:'copy-store-url',shareAttrs:`data-slug="${esc(slug)}"`,showMessage:String(s.id)!==String(state.seller?.id||'')})}
        </main>
      </div>`;
    }catch(e){return window.ANILyfeUI.renderApiError(e,'Store unavailable');}}

  /* Store messaging: buyers open a thread from a storefront, sellers answer it in Seller Center. */
  window.storeMessageService={
    async send(storeId,storeName,message){
      const u=state.user;
      if(!u){const err=new Error('Sign in before messaging a seller.');err.code='AUTH_REQUIRED';throw err;}
      const body=String(message||'').trim();
      if(body.length<10)throw new Error('Write at least 10 characters so the seller can help you.');
      return request('/api/support',{method:'POST',body:JSON.stringify({subject:`Message to ${storeName||'seller'}`,message:body,email:u.email||'',sellerId:storeId})});
    },
    async list(){return request('/api/support/store');},
    async reply(ticketId,message){return request('/api/support/'+encodeURIComponent(ticketId)+'/reply',{method:'POST',body:JSON.stringify({message:String(message||'').trim()})});}
  };
  window.openStoreMessageModal=function(sellerId,sellerName){
    if(!state.user){toast?.('Sign in to message a seller.','user-check');location.hash='#/auth';return;}
    const root=document.getElementById('modal-root');
    if(!root)return;
    root.innerHTML=`
    <div class="modal-back" data-action="close-modal-bg" data-backdrop="1">
      <div class="modal-card form-modal-card glass rounded-3xl w-full max-w-md p-5 sm:p-7 relative">
        <button class="!absolute top-4 right-4 icon-btn !w-9 !h-9" data-action="close-modal" aria-label="Close"><i data-lucide="x" style="width:17px;height:17px"></i></button>
        <div class="flex items-center gap-3 mb-1">
          <span class="w-10 h-10 rounded-xl bg-[#334EAC] flex items-center justify-center"><i data-lucide="message-square-text" style="width:18px;height:18px;color:#fff"></i></span>
          <div>
            <div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1]">STORE MESSAGE</div>
            <h3 class="font-display font-bold text-xl text-[#081F5C]">${esc(sellerName||'Seller')}</h3>
          </div>
        </div>
        <p class="mb-4 text-xs text-[#5A6A9C]">Ask about an item, stock or delivery. Your message is saved to this store's ANILyfe inbox — never pay a seller outside checkout.</p>
        <form id="storeMessageForm" data-seller-id="${esc(sellerId)}" data-seller-name="${esc(sellerName||'')}" class="space-y-3">
          <div><label class="lbl" for="storeMessageBody">Your message</label><textarea id="storeMessageBody" class="inp min-h-[120px]" name="message" required maxlength="4000" placeholder="e.g. Is the Gojo figure still in stock and how long does delivery to Lagos take?"></textarea></div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button class="btn btn-ghost sm:w-32 !py-3" type="button" data-action="close-modal">Cancel</button>
            <button class="btn btn-primary flex-1 !py-3" type="submit">Send message <i data-lucide="send" style="width:15px;height:15px"></i></button>
          </div>
        </form>
      </div>
    </div>`;
    window.lucide?.createIcons?.();
    document.getElementById('storeMessageBody')?.focus();
  };
  window.viewStoreInbox=async function(){
    if(!state.user||state.user.role!=='SELLER'){location.hash=state.user?'#/seller-center':'#/auth';return '';}
    let rows=[];
    try{rows=await window.storeMessageService.list();}
    catch(e){return window.ANILyfeUI.renderApiError(e,'Messages unavailable');}
    const threads=rows.map(t=>{
      const messages=(t.messages||[]).slice().sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
      const last=messages[messages.length-1];
      return `<article class="card p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div><div class="text-[10px] font-extrabold uppercase tracking-widest text-[#708BD1]">${esc(t.subject||'Store message')}</div><h2 class="mt-1 font-display text-base font-extrabold text-[#081F5C]">${esc([t.user?.firstName,t.user?.lastName].filter(Boolean).join(' ')||t.user?.email||'ANILyfe buyer')}</h2><p class="mt-0.5 text-[11px] font-semibold text-slate-500">${esc([t.user?.email,t.user?.phone].filter(Boolean).join(' · ')||'Contact details not provided')}</p></div>
          <span class="text-[11px] font-bold text-slate-500">${last&&last.createdAt?new Date(last.createdAt).toLocaleString('en-NG'):''}</span>
        </div>
        <div class="mt-3 space-y-2">${messages.length?messages.map(m=>`<div class="rounded-xl border border-[#D0E3FF] p-3 text-sm ${m.senderType==='CUSTOMER'?'bg-white':'bg-[#E7F1FF]'}"><div class="text-[10px] font-extrabold uppercase tracking-widest text-[#334EAC]">${m.senderType==='CUSTOMER'?'Buyer':m.senderType==='ADMIN'?'ANILyfe':'You'}</div><p class="mt-1 whitespace-pre-wrap leading-relaxed text-[#1B3265]">${esc(m.message||'')}</p></div>`).join(''):`<div class="rounded-xl bg-white p-3 text-sm leading-relaxed text-[#1B3265]">${esc(t.message||'No message content.')}</div>`}</div>
        <form class="storeReplyForm mt-4 flex flex-col gap-2 sm:flex-row sm:items-center" data-ticket="${esc(t.id)}">
          <input class="inp flex-1" name="message" required maxlength="4000" placeholder="Write a reply…">
          <button class="btn btn-primary sm:w-36 !py-2.5" type="submit">Reply</button>
        </form>
      </article>`;
    }).join('');
    return `<div class="min-h-screen bg-[#F6FCFF]">
      <header class="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-5">${LOGO('text-2xl')}<a href="#/seller-center" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Seller Center</a></header>
      <main class="mx-auto max-w-4xl space-y-4 px-5 pb-20">
        <div><div class="text-[10px] font-extrabold uppercase tracking-widest text-[#708BD1]">SELLER TOOLBOX</div><h1 class="mt-1 font-display text-2xl font-extrabold text-[#081F5C]">Store messages</h1><p class="mt-2 text-sm font-semibold text-[#1B3265]">Buyer questions about your store and listings. ${rows.length?`${rows.length} conversation${rows.length===1?'':'s'}.`:''}</p></div>
        ${rows.length?threads:(window.ANILyfeUI?.EmptyState?.('No store messages yet','When a buyer uses Message Seller on your storefront, the conversation appears here.'))}
      </main>
    </div>`;
  };

  // Core cart bridge. Cart IDs and quantities are backend-owned; no marketplace cart is persisted in localStorage.
  async function loadCart(){state.cart=state.user?await request('/api/cart'):{items:[]};return state.cart;}
  window.cartAdd=async function(id,selectedVariantId){if(!state.user){location.hash='#/auth';return;}const p=productById(id)||await window.productService.getProductById(id);const available=(p.variants||[]).filter(item=>Number(item.stock||0)-Number(item.reserved||0)>0);if(available.length>1&&!selectedVariantId){toast?.('Choose a size or option before adding this product to your cart.','list-checks');return;}const v=selectedVariantId?p.variants?.find(item=>item.id===selectedVariantId):available[0];if(!v){toast?.('This product has no available stock.','alert-triangle');return;}if(Number(v.stock||0)-Number(v.reserved||0)<=0){toast?.('This product option is out of stock.','alert-triangle');return;}await request('/api/cart/items',{method:'POST',body:JSON.stringify({productId:p.id,variantId:v.id,quantity:1})});await loadCart();toast?.(`Added "${esc(p.name)}" to cart.`,'shopping-cart');window.route?.();};
  window.cartRemove=async function(id){const c=state.cart||await loadCart();const item=(c.items||[]).find(i=>i.productId===id);if(item)await request('/api/cart/items/'+item.id,{method:'DELETE'});await loadCart();window.route?.();};
  window.getCartTotals=function(){const items=(state.cart?.items||[]).map(i=>{const p=normalizeProduct(i.product);const qty=Number(i.quantity||1),unit=Number(i.unitPrice||p.salePrice||p.price||0);return {cart:{id:p.id,qty},product:p,qty,unit,original:Number(p.price||unit),lineTotal:unit*qty,savings:Math.max(0,Number(p.price||unit)-unit)*qty};});const subtotal=items.reduce((n,x)=>n+x.lineTotal,0);return {items,subtotal,savings:items.reduce((n,x)=>n+x.savings,0),shipping:0,total:subtotal,shippingBreakdown:[]};};

  // API-backed checkout; server calculates all money. Paystack initialization returns its hosted checkout URL.
  window.checkoutNow=async function(){const u=state.user;if(!u){location.hash='#/auth';return;}const stateEl=document.getElementById('checkoutState'),city=document.getElementById('checkoutCity')?.value.trim(),lga=document.getElementById('checkoutLga')?.value.trim(),address=document.getElementById('checkoutAddress')?.value.trim();const destination=stateEl?.value;if(!destination||!city||!address){toast?.('Complete the delivery state, city and address.','map-pin');return;}try{await request('/api/orders/quote',{method:'POST',body:JSON.stringify({state:destination})});const created=await request('/api/orders',{method:'POST',body:JSON.stringify({country:'Nigeria',state:destination,city,lga,addressLine:address,recipientName:`${u.firstName||''} ${u.lastName||''}`.trim(),recipientPhone:u.phone||''})});const multi=Boolean(created.checkoutSession?.id);const pay=multi?await request('/api/payments/initialize-session',{method:'POST',body:JSON.stringify({checkoutSessionId:created.checkoutSession.id})}):await request('/api/payments/initialize',{method:'POST',body:JSON.stringify({orderId:created.id})});if(pay.checkoutUrl){location.href=pay.checkoutUrl;return;}await loadCart();toast?.('Order created. Payment configuration is required to continue.','credit-card');location.hash='#/orders';}catch(e){toast?.(e.message||'Unable to create order.','alert-triangle');}};

  // Seller application used by the profile/seller page. Onboarding collects store basics only; KYC and bank details come later.
  function sellerApplicationPayload(formEl){
    const f=new FormData(formEl),business=String(f.get('businessName')||f.get('business')||'').trim();
    const slug=business.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||`seller-${Date.now()}`;
    return {
      businessName:business,slug,bio:String(f.get('bio')||'').trim(),
      category:String(f.get('category')||f.get('sells')||'').trim(),
      state:String(f.get('state')||'').trim(),city:String(f.get('city')||'').trim(),
      lga:String(f.get('lga')||'').trim(),phone:String(f.get('phone')||'').trim(),
      hasAcceptedTerms:String(f.get('hasAcceptedTerms'))==='true',
      foundingPoliciesAccepted:String(f.get('foundingPoliciesAccepted'))==='true'
    };
  }
  async function submitSellerApplication(formEl){
    return request('/api/sellers/apply',{method:'POST',body:JSON.stringify(sellerApplicationPayload(formEl))});
  }
  // Direct seller signup: create the account, then file the store application on the new account.
  window.sellerDirectSignup=async function(formEl){
    const f=new FormData(formEl);
    const email=String(f.get('email')||'').trim().toLowerCase(), password=String(f.get('password')||'');
    if(password.length<8)throw new Error('Use a password of at least 8 characters.');
    const parts=String(f.get('name')||'').trim().split(/\s+/);
    const firstName=parts.shift()||'Seller', lastName=parts.join(' ')||'Seller';
    const reg=await request('/api/auth/register',{method:'POST',body:JSON.stringify({email,password,firstName,lastName,phone:String(f.get('phone')||'').trim()||undefined,state:String(f.get('state')||'').trim()||undefined,accountType:'BUYER'})});
    if(reg.verificationRequired)throw new Error('Confirm your email address before applying — we sent a code to '+reg.email+'.');
    setUser(reg.user,reg.accessToken);
    cacheSeller(reg.seller||null);
    cacheSeller(await submitSellerApplication(formEl));
    await refresh();
    toast?.('Application Under Review. We will notify you after the administrator review.','shield-check');
    location.hash='#/seller/application';
  };
  window.sellerApply=async function(formEl){
    try{
      cacheSeller(await submitSellerApplication(formEl));
      window.closeModal?.();
      await refresh();
      toast?.('Application Under Review. We will notify you after the administrator review.','shield-check');
      location.hash='#/seller/application';
      return true;
    }catch(e){toast?.(e.message||'Unable to submit seller application.','alert-triangle');return false;}
  };

  // Logout is backend-session based.
  const oldLogout=document.querySelector;
  document.addEventListener('click',async function(e){const t=e.target.closest('[data-action="logout"]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();try{await request('/api/auth/logout',{method:'POST',body:'{}'});}catch{}setUser(null);state.seller=null;state.cart={items:[]};toast?.('Logged out.','log-out');location.hash='#/';},true);

  /* Route access is decided inside route() itself, after the session resolves. The previous wrapper
     here re-bound window.route after navigation.js had already registered the raw function on
     hashchange, so the guard never ran on real navigation — and the second listener below re-rendered
     only once booted, which is what produced the flash-of-unavailable and manual-refresh behaviour. */
  window.addEventListener('anilyfe:auth-ready',()=>window.route?.());


  // API-backed page renderers. They use the in-memory API state only; marketplace records are not read from localStorage.
  window.viewCart=function(){
    if(state.apiErrors.cart) return window.ANILyfeUI.renderApiError(state.apiErrors.cart,'Cart unavailable');
    if(!state.user){location.hash='#/auth';return '';}
    const items=(state.cart?.items||[]).map(i=>{const p=normalizeProduct(i.product||{});const qty=Number(i.quantity||1),unit=Number(i.unitPrice||p.salePrice||p.price||0);return {item:i,product:p,qty,unit,lineTotal:unit*qty};});
    const subtotal=items.reduce((n,x)=>n+x.lineTotal,0);
    const rows=items.map(x=>`<div class="flex items-center gap-4 py-4 border-b" style="border-color:var(--light)"><div class="prod-media w-16 h-16 shrink-0"><img src="${x.product.img||window.ANILyfeCategoryImageFor(x.product.category)}" alt="${esc(x.product.name)}" loading="lazy" onerror="this.remove()"></div><div class="flex-1 min-w-0"><div class="font-bold text-sm truncate">${esc(x.product.name)}</div><div class="text-xs" style="color:var(--mid)">Qty ${x.qty} · ${fmt(x.unit)} each</div></div><div class="font-display font-extrabold">${fmt(x.lineTotal)}</div><button class="btn btn-danger !py-2 !px-3 text-xs" data-action="cart-remove" data-id="${x.product.id}"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button></div>`).join('');
    return `<div class="min-h-screen" style="background:var(--off)"><header class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">← Keep shopping</a></header><main class="max-w-3xl mx-auto px-5 pb-24"><h1 class="font-display text-2xl font-extrabold mb-6">Your cart</h1>${items.length?`<div class="card p-5">${rows}<div class="pt-5 space-y-2 border-t border-[#E7F1FF]"><div class="flex justify-between text-sm"><span>Subtotal</span><span>${fmt(subtotal)}</span></div><div class="flex justify-between text-sm"><span>Shipping</span><span>Calculated at checkout</span></div><div class="flex items-center justify-between pt-2"><div class="font-display text-lg font-extrabold">Subtotal: ${fmt(subtotal)}</div><a href="#/checkout" class="btn btn-primary">Checkout <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a></div></div></div>`:(window.ANILyfeUI?.EmptyState?.('Your cart is empty','Add a published product to start your order.','<a href=\"#/marketplace\" class=\"btn btn-primary mt-5\">Browse marketplace</a>')||'')}</main></div>`;
  };
  window.getCartTotals=function(){const items=(state.cart?.items||[]).map(i=>{const p=normalizeProduct(i.product||{}),qty=Number(i.quantity||1),unit=Number(i.unitPrice||p.salePrice||p.price||0);return {cart:i,product:p,qty,unit,original:Number(p.price||unit),lineTotal:unit*qty,savings:Math.max(0,Number(p.price||unit)-unit)*qty};});const subtotal=items.reduce((n,x)=>n+x.lineTotal,0);return {items,subtotal,savings:items.reduce((n,x)=>n+x.savings,0),shipping:null,total:null,shippingBreakdown:[]};};
  window.viewOrders=function(){if(state.apiErrors.orders) return window.ANILyfeUI.renderApiError(state.apiErrors.orders,'Orders unavailable');if(!state.user){location.hash='#/auth';return '';}const orders=state._orders||[];return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">← Market</a></header><main class="max-w-6xl mx-auto px-5 pb-20"><h1 class="font-display font-extrabold text-2xl mb-6">My orders</h1>${orders.length?`<div class="space-y-4">${orders.map(o=>`<section class="card p-5 reveal"><div class="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div class="font-display font-extrabold text-lg">${esc(o.orderNumber||o.id)}</div><div class="text-xs text-[#708BD1] font-bold mt-1">${o.createdAt?new Date(o.createdAt).toLocaleDateString():'—'}</div><div class="text-xs text-slate-500 mt-1">Sold by ${esc(o.sellerSnapshot?.businessName||'ANILyfe seller')}</div></div><div class="flex items-center gap-3"><span class="badge">${esc(ORDER_STATUS_LABELS[String(o.orderStatus||'').toUpperCase()]||o.orderStatus||'New')}</span><span class="text-xs font-bold text-[#5A6A9C]">${o.items?.length||0} items</span><span class="font-display font-extrabold text-lg">${fmt(o.total||0)}</span></div></div>${o.orderStatus==='DELIVERED'&&!o.deliveryConfirmedAt?`<div class="flex gap-2 mt-4"><button class="btn btn-primary !py-2 !px-3 !text-xs" data-action="buyer-confirm-delivery" data-id="${esc(o.id)}">Confirm delivery</button><button class="btn btn-ghost !py-2 !px-3 !text-xs" data-action="buyer-open-dispute" data-id="${esc(o.id)}">Report a problem</button></div>`:o.deliveryConfirmedAt?`<p class="text-xs text-emerald-700 mt-3">Delivery confirmed. Payout release is scheduled for ${new Date(o.payoutEligibleAt).toLocaleString()}.</p>`:['SHIPPED','DELIVERED'].includes(o.orderStatus)?`<button class="btn btn-ghost !py-2 !px-3 !text-xs mt-4" data-action="buyer-open-dispute" data-id="${esc(o.id)}">Report a problem</button>`:''}</section>`).join('')}</div>`:(window.ANILyfeUI?.EmptyState?.('No orders to display','Your completed and current orders will appear here.','<a href=\"#/marketplace\" class=\"btn btn-primary mt-5\">Start shopping</a>')||'')}</main></div>`;};
  const previousRefresh=refresh;
  refresh=async function(){const r=await previousRefresh(); if(state.user){try{state._orders=await request('/api/orders');state.apiErrors.orders=null;}catch(e){state.apiErrors.orders=e;state._orders=[];}} return r;};
  window.ANILyfeAPI.refresh=refresh;
  window.ANILyfeAPI.getAnnouncements=()=>state.announcements||[];

  // API-backed admin mutations used by the existing dashboard UI.
  window.adminUpdateSellerStatus=async function(id,status){try{const s=status==='approved'?'APPROVED':status==='suspended'?'SUSPENDED':'REJECTED';let rejectionReason='';if(s==='REJECTED'){rejectionReason=prompt('Reason for rejecting this seller (required):','')||'';if(!rejectionReason.trim())return;}await request('/api/admin/sellers/'+encodeURIComponent(id)+'/approval',{method:'PATCH',body:JSON.stringify({status:s,rejectionReason})});await refresh();toast?.('Seller status updated.','store');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminUpdateProductStatus=async function(id,status){try{let rejectionReason='';if(status==='rejected'){rejectionReason=prompt('Reason for rejecting this product (required):','')||'';if(!rejectionReason.trim())return;}const mapped=status==='approved'?'PUBLISHED':'REJECTED';await request('/api/admin/products/'+encodeURIComponent(id)+'/approval',{method:'PATCH',body:JSON.stringify({status:mapped,rejectionReason})});await refresh();toast?.('Product moderation updated.','package-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminUpdateUserStatus=async function(id,status){try{await request('/api/admin/users/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:JSON.stringify({status:String(status).toUpperCase()==='SUSPENDED'?'SUSPENDED':'ACTIVE'})});await refresh();toast?.('User status updated.','user-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminUpdateOrderStatus=async function(){toast?.('Admin order viewing is read-only for fulfillment status.','shield-check');};
  window.adminSetSettingsFromForm=async function(){try{const data={marketplaceName:document.getElementById('admin-market-name')?.value||'ANILyfe',supportEmail:document.getElementById('admin-market-email')?.value||'',adminEmail:document.getElementById('admin-admin-email')?.value||'',telegram:document.getElementById('admin-telegram')?.value||'',commissionRate:Number(document.getElementById('admin-market-commission')?.value||15)};data.payoutReleaseHours={founding:Number(document.getElementById('admin-founding-payout-hours')?.value),standard:Number(document.getElementById('admin-standard-payout-hours')?.value)};if(Object.values(data.payoutReleaseHours).some(hours=>!Number.isInteger(hours)||hours<1||hours>8760))throw new Error('Payout holds must be whole hours between 1 and 8,760.');const ttlInput=document.getElementById('admin-reservation-ttl-minutes');if(ttlInput){const ttl=Number(ttlInput.value);if(!Number.isInteger(ttl)||ttl<5||ttl>10080)throw new Error('Stock reservation lifetime must be a whole number of minutes between 5 and 10,080.');data.reservationTtlMinutes=ttl;}const limits=[10000,30000,50000,100000,null];data.withdrawalFees={BUYER:['buyer','buyer','buyer','buyer','buyer'].map((_,index)=>({upTo:limits[index],fee:Number(document.getElementById(`admin-buyer-withdrawal-fee-${index}`)?.value)})),SELLER:['seller','seller','seller','seller','seller'].map((_,index)=>({upTo:limits[index],fee:Number(document.getElementById(`admin-seller-withdrawal-fee-${index}`)?.value)}))};if(Object.values(data.withdrawalFees).some(tiers=>tiers.some(tier=>!Number.isFinite(tier.fee)||tier.fee<0)))throw new Error('Withdrawal fees must be non-negative numbers.');const saved=await request('/api/admin/settings',{method:'PATCH',body:JSON.stringify(data)});state.publicSettings={...(state.publicSettings||{}),...(saved||data)};state.admin.settings={...(state.admin.settings||{}),...(saved||data)};await refresh();toast?.('Marketplace, withdrawal fee, and payout release settings updated.','badge-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminProcessWithdrawal=async function(id){if(!confirm('Submit this withdrawal to the configured Paystack transfer provider?'))return;try{await request('/api/withdrawals/admin/'+encodeURIComponent(id)+'/process',{method:'POST',body:'{}'});await refresh();toast?.('Withdrawal transfer submitted. Final status will update from Paystack.','wallet');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminExpireReservations=async function(){if(!confirm('Release stock for expired reservations and cancel their unpaid orders?'))return;try{const result=await request('/api/admin/reconciliation/expire-reservations',{method:'POST',body:'{}'});await refresh();toast?.(`Released ${Number(result?.released||0)} reservation(s), cancelled ${Number(result?.cancelledOrders||0)} order(s).`,'package-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminTogglePayoutHold=async function(id,held){let reason=null;if(!held){reason=prompt('Provide the reason for placing this payout hold (10-1,000 characters):','');if(reason===null)return;if(reason.trim().length<10||reason.trim().length>1000){toast?.('Enter a hold reason between 10 and 1,000 characters.','alert-triangle');return;}}else if(!confirm('Remove the administrative payout hold from this order?'))return;try{await request('/api/admin/orders/'+encodeURIComponent(id)+'/payout-hold',{method:'PATCH',body:JSON.stringify({held:!held,...(reason?{reason:reason.trim()}:{})})});await refresh();toast?.(held?'Payout hold removed.':'Payout placed on hold.','shield-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminResolveDispute=async function(id,status){const resolution=prompt('Enter the resolution and rationale (10–2,000 characters):','');if(resolution===null)return;if(resolution.trim().length<10||resolution.trim().length>2000){toast?.('Enter a resolution between 10 and 2,000 characters.','alert-triangle');return;}try{await request('/api/withdrawals/admin/disputes/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status,resolution:resolution.trim()})});await refresh();toast?.('Dispute decision recorded.','shield-check');route();}catch(e){toast?.(e.message,'alert-triangle');}};
  window.adminToggleSetting=async function(key,enabled){try{const next=!Boolean(enabled);const saved=await request('/api/admin/settings',{method:'PATCH',body:JSON.stringify({[key]:next})});state.publicSettings={...(state.publicSettings||{}),[key]:next};state.admin.settings={...(state.admin.settings||{}),[key]:next,...(saved||{})};await refresh();toast?.(`${key.replace(/([A-Z])/g,' $1')} ${next?'enabled':'disabled'}.`,'toggle-left');route();}catch(e){toast?.(e.message,'alert-triangle');}};
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
  /* The session probe gates every render; the data bootstrap runs behind it and never blocks auth.
     The watchdog stops slow data from parking a protected route on the spinner — it deliberately does
     NOT resolve the session, which is what used to let guards see a logged-in user as null. */
  let bootstrapTimer=null;
  function armBootstrapWatchdog(){
    clearTimeout(bootstrapTimer);
    bootstrapTimer=setTimeout(()=>{
      state.bootTimedOut=true;
      window.dispatchEvent(new CustomEvent('anilyfe:api-ready',{detail:state}));
      revealApplication(true);
      window.route?.();
    },5000);
  }
  armBootstrapWatchdog();
  window.ANILyfeAPI.retryBootstrap=async function(){
    state.booted=false; state.bootTimedOut=false; state.apiErrors={};
    armBootstrapWatchdog();
    const app=document.getElementById('app');
    if(app)app.innerHTML=window.ANILyfeUI?.FullPageSpinner?.('Reconnecting to the marketplace...')||'';
    try{ await resolveSession(true); await refresh(); await handlePaymentReturn(); }
    catch(error){ console.warn('ANILyfe bootstrap retry:',error?.message); }
    finally{ clearTimeout(bootstrapTimer); state.bootTimedOut=true; revealApplication(true); window.route?.(); }
  };
  resolveSession()
    .then(()=>{ window.route?.(); return refresh(); })
    .then(()=>handlePaymentReturn())
    .then(()=>{ clearTimeout(bootstrapTimer); revealApplication(); window.route?.(); })
    .catch(error=>{
      console.warn('ANILyfe bootstrap:',error?.message);
      clearTimeout(bootstrapTimer);
      state.booted=true; state.bootTimedOut=true;
      window.dispatchEvent(new CustomEvent('anilyfe:api-ready',{detail:state}));
      revealApplication();
      window.route?.();
    });
})();
