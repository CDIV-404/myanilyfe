/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Hash router: renders the active view into #app and wires up global
   click / keydown / change / submit delegation for the whole prototype. */

let timers = [];
const clearTimers = () => { timers.forEach(t=>{clearInterval(t);clearTimeout(t);}); timers = []; };

let routeLoaderTimer = null;
function showRouteLoader(msg){
  clearTimeout(routeLoaderTimer);
  routeLoaderTimer = setTimeout(()=>{
    const routeLoader=document.getElementById('anilyfe-route-loader');
    if(routeLoader){
      const loaderMessage = routeLoader.querySelector('.text-sm');
      if(loaderMessage && msg) loaderMessage.textContent = msg;
      routeLoader.classList.remove('hidden');
      routeLoader.classList.add('flex');
      routeLoader.setAttribute('aria-hidden','false');
    }
  }, 300);
}
function hideRouteLoader(){
  clearTimeout(routeLoaderTimer);
  const routeLoader=document.getElementById('anilyfe-route-loader');
  if(routeLoader){
    routeLoader.classList.add('hidden');
    routeLoader.classList.remove('flex');
    routeLoader.setAttribute('aria-hidden','true');
  }
}

async function route(){
  clearTimers();
  const h = location.hash || '#/';
  const loaderMessage = h.startsWith('#/admin') ? 'Loading admin workspace...' : h.startsWith('#/seller') ? 'Loading Seller Center...' : h.startsWith('#/checkout') ? 'Loading checkout...' : h.startsWith('#/orders') ? 'Loading orders...' : h.startsWith('#/cart') ? 'Loading cart...' : h.startsWith('#/auth') ? 'Loading authentication...' : h.startsWith('#/marketplace') ? 'Loading marketplace products...' : 'Loading marketplace view...';
  showRouteLoader(loaderMessage);
  closeAllDrops();
  const app = document.getElementById('app');
  if(!app){ hideRouteLoader(); return; }
  if(window.ANILyfeAPI && !window.ANILyfeAPI.state.booted){
    app.innerHTML = window.ANILyfeUI?.AnimeLoader?.(loaderMessage) || '';
    hideRouteLoader();
    return;
  }
  const publicAdminRoute=h==='#/admin-login'||h==='#/admin-signup';
  if(h.startsWith('#/admin') && !publicAdminRoute && !window.currentAdmin?.()){
    location.hash='#/admin-login';
    hideRouteLoader();
    return;
  }
  const globalSettings = window.getMarketplaceSettings ? window.getMarketplaceSettings() : LS.get('marketplaceSettings', {});
  const isAdminRoute = h.startsWith('#/admin');
  if(globalSettings.maintenanceMode && !isAdminRoute && !(window.currentAdmin && window.currentAdmin())) {
    app.innerHTML = `<div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5"><div class="card p-10 max-w-lg text-center"><div class="w-16 h-16 rounded-2xl bg-[#E7F1FF] flex items-center justify-center mx-auto mb-4"><i data-lucide="wrench" style="width:28px;height:28px;color:#334EAC"></i></div><div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1]">MARKETPLACE NOTICE</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C] mt-2">ANILyfe is temporarily unavailable</h1><p class="text-sm text-slate-500 mt-3">The marketplace is currently in maintenance mode. Please check back shortly.</p></div></div>`;
    afterRender();
    hideRouteLoader();
    return;
  }
  let html = '';
  if(h.startsWith('#/admin-dashboard') || h === '#/admin' || h.startsWith('#/admin/dashboard'))      html = viewAdminDash();
  else if(h==='#/admin-signup')                html = viewAdminSignup();
  else if(h.startsWith('#/admin-login'))      html = viewAdminLogin();
  else if(h==='#/login')                      { authMode='login'; html=viewAuth(); }
  else if(['#/signup','#/buyer/signup','#/seller/signup'].includes(h)) { authMode='create'; html=viewAuth(); }
  else if(h.startsWith('#/buyer-protection'))  html = viewBuyerProtection();
  else if(h.startsWith('#/payment-security')) html = viewPaymentSecurity();
  else if(h.startsWith('#/seller-policy'))    html = viewSellerPolicy();
  else if(h.startsWith('#/marketplace-rules')) html = viewMarketplaceRules();
  else if(h.startsWith('#/kyc'))              html = viewKyc();
  else if(h.startsWith('#/cancellation'))     html = viewCancellation();
  else if(h.startsWith('#/help'))             html = viewHelp();
  else if(h.startsWith('#/faq'))              html = viewFaq();
  else if(h.startsWith('#/shipping'))         html = viewShipping();
  else if(h.startsWith('#/returns'))          html = viewReturns();
  else if(h.startsWith('#/privacy'))          html = viewPrivacy();
  else if(h.startsWith('#/terms'))            html = viewTerms();
  else if(h.startsWith('#/contact'))          html = viewContact();
  else if(h.startsWith('#/wishlist'))         html = viewWishlist();
  else if(h.startsWith('#/orders'))           html = viewOrders();
  else if(h.startsWith('#/product/'))         html = viewProduct(h.replace('#/product/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/store/'))           html = viewSellerStore(h.replace('#/store/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/category/'))        html = viewCategory(decodeURIComponent(h.replace('#/category/','').split('/')[0].split('?')[0]));
  else if(h.startsWith('#/seller/dashboard')) html = viewSellerCenter('dashboard');
  else if(h.startsWith('#/seller/orders/'))   html = viewSellerCenter('orders', h.replace('#/seller/orders/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/seller/orders'))    html = viewSellerCenter('orders');
  else if(h.startsWith('#/seller/products/new')) html = viewSellerCenter('products', 'new');
  else if(h.startsWith('#/seller/products/')) html = viewSellerCenter('products', h.replace('#/seller/products/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/seller/products'))  html = viewSellerCenter('products');
  else if(h.startsWith('#/seller/inventory')) html = viewSellerCenter('inventory');
  else if(h.startsWith('#/seller/reviews'))   html = viewSellerCenter('reviews');
  else if(h.startsWith('#/seller/earnings'))  html = viewSellerCenter('earnings');
  else if(h.startsWith('#/seller/payouts'))   html = viewSellerCenter('earnings');
  else if(h.startsWith('#/seller/analytics')) html = viewSellerCenter('analytics');
  else if(h.startsWith('#/seller/delivery'))  html = viewSellerCenter('delivery');
  else if(h.startsWith('#/seller/store/preview')) html = viewSellerCenter('storePreview');
  else if(h.startsWith('#/seller/store'))     html = viewSellerCenter('store');
  else if(h.startsWith('#/seller/verification')) html = viewSellerCenter('verification');
  else if(h.startsWith('#/seller/settings'))  html = viewSellerCenter('settings');
  else if(h.startsWith('#/seller/'))          html = viewSellerStore(h.replace('#/seller/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/marketplace'))      html = viewMarketplace();
  else if(h.startsWith('#/seller'))           html = viewSellerCenter('dashboard');
  else if(h.startsWith('#/profile'))          html = viewProfile();
  else if(h.startsWith('#/auth'))             html = viewAuth();
  else if(h.startsWith('#/cart'))             html = viewCart();
  else if(h.startsWith('#/checkout'))         html = viewCheckout();
  else if(h.startsWith('#/anime'))            html = viewMarketplace();
  else if(h.startsWith('#/manga'))            html = viewCategory('Manga & Books');
  else if(h.startsWith('#/notifications'))    html = viewNotifications();
  else if(h.startsWith('#/search'))           html = viewSearchResults();
  else if(h !== '#/' && h !== '#')           html = view404();
  else                                        html = viewLanding();

  if (html instanceof Promise || (html && typeof html.then === 'function')) {
    html = await html;
  }
  app.innerHTML = `<div class="anilyfe-page-enter min-h-screen">${html}</div>`;
  if(!h.startsWith('#/seller') && !app.querySelector('footer')){
    app.insertAdjacentHTML('beforeend', siteFooter('border-t border-[#D0E3FF] bg-white mt-8'));
  }
  afterRender();
  hideRouteLoader();
  if(h.startsWith('#/marketplace')) startCountdown();
}
function afterRender(){
  lucide.createIcons();
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  window.scrollTo({top:0});
}
window.addEventListener('hashchange', route);


function closeAllDrops(){ document.querySelectorAll('.drop.open').forEach(d=>d.classList.remove('open')); }

document.addEventListener('click', e=>{
  const t = e.target.closest('[data-action]');
  // close dropdowns when clicking outside
  if(!e.target.closest('.drop') && !t){ closeAllDrops(); }
  if(!t) return;
  const act = t.dataset.action;
  const toggle = id => { const d=document.getElementById(id); const was=d.classList.contains('open'); closeAllDrops(); if(!was) d.classList.add('open'); };

  switch(act){
    case 'auth-mode': authMode=t.dataset.mode; route(); break;
    case 'auth-switch': authMode=t.dataset.mode; openAuthModal(t.dataset.mode, t.dataset.role); break;
    case 'auth-open': openAuthModal(t.dataset.mode, t.dataset.role); break;
    case 'close-modal': case 'close-modal-bg': closeModal(); break;
    case 'become-seller': {
      const u = window.currentUser ? window.currentUser() : null;
      if(!u){ openAuthModal('create','seller'); break; }
      const seller = window.sellerOf ? window.sellerOf(u.id) : (typeof sellerOf==='function' ? sellerOf(u.id) : null);
      if(seller){ location.hash='#/seller'; break; }
      if(window.openSellerAppModal){ window.openSellerAppModal(); } else { location.hash='#/auth'; }
      break;
    }

    case 'set-region': /* handled on change */ break;
    case 'toggle-cart': toggle('drop-cart'); break;
    case 'toggle-notif': toggle('drop-notif'); break;
    case 'toggle-wish-drop': toggle('drop-wish'); break;
    case 'toggle-user': toggle('drop-user'); break;

    case 'mq-search': searchRun(); break;
    case 'mq-cat': searchSetCategory(t.dataset.cat); break;

    case 'wish': wishlistToggle(t.dataset.id); break;
    case 'add-cart': cartAdd(t.dataset.id); break;
    case 'cart-remove': cartRemove(t.dataset.id); break;
    case 'checkout': checkoutNow(); break;

    case 'logout': window.ANILyfeAPI?.request('/api/auth/logout',{method:'POST',body:'{}'}).catch(()=>{}).finally(()=>{ if(window.ANILyfeAPI?.state){window.ANILyfeAPI.state.user=null;window.ANILyfeAPI.state.seller=null;} toast('Logged out.','log-out'); location.hash='#/'; }); break;
    case 'prof-tab': profTab=t.dataset.tab; route(); break;
    case 'seller-tab': sellerTab=t.dataset.tab; route(); break;

    case 'copy': navigator.clipboard?.writeText(t.dataset.text); toast('Seller ID copied to clipboard.','clipboard-check'); break;
    case 'copy-prod-url': {
      const pid = t.dataset.id || '';
      const url = `${window.location.origin}${window.location.pathname}#/product/${pid}`;
      navigator.clipboard?.writeText(url);
      toast('Product share link copied to clipboard.', 'share-2');
      break;
    }
    case 'copy-store-url': {
      const slug = t.dataset.slug || '';
      if(!slug){ toast('This store does not have a public link yet.','store'); break; }
      const url = `${window.location.origin}${window.location.pathname}#/store/${slug}`;
      navigator.clipboard?.writeText(url);
      toast('Storefront link copied to clipboard.', 'share-2');
      break;
    }
    case 'contact-store-modal': {
      toast('Approved seller contact details are shown on the seller storefront.','store');
      break;
    }
    case 'del-product': productDelete(t); break;

    case 'admin-tab': adminTab=t.dataset.tab; route(); break;
    case 'admin-view': adminView=t.dataset.view; adminDetailType=null; adminDetailId=null; adminProductPreviewId=null; route(); break;
    case 'admin-view-sel': /* handled on change */ break;
    case 'admin-seller-status': adminUpdateSellerStatus(t.dataset.id, t.dataset.status); break;
    case 'admin-product-preview': adminOpenProductPreview(t.dataset.id); break;
    case 'admin-product-preview-close': adminCloseProductPreview(); break;
    case 'admin-product-action': adminUpdateProductStatus(t.dataset.id, t.dataset.status); break;
    case 'admin-order-view': adminOpenDetail('order', t.dataset.id); break;
    case 'admin-order-action': toast('Order status is controlled by the seller. Admin order view is read-only.','shield'); break;
    case 'admin-user-status': adminUpdateUserStatus(t.dataset.id, t.dataset.status); break;
    case 'admin-application-review': {
      const decision=t.dataset.decision;
      const payload={decision};
      if(decision==='APPROVE')payload.role=document.getElementById('admin-role-'+t.dataset.id)?.value;
      window.ANILyfeAPI?.request('/api/admin/applications/'+encodeURIComponent(t.dataset.id)+'/review',{method:'PATCH',body:JSON.stringify(payload)}).then(()=>window.ANILyfeAPI.refresh()).then(()=>{toast(decision==='APPROVE'?'Application approved and role assigned.':'Application rejected.','shield-check');route();}).catch(e=>toast(e.message||'Unable to review admin application.','alert-triangle'));
      break;
    }
    case 'admin-user-view': adminOpenDetail('user', t.dataset.id); break;
    case 'admin-seller-view': adminOpenDetail('seller', t.dataset.id); break;
    case 'admin-seller-products': adminSearch=t.dataset.id; adminView='products'; route(); break;
    case 'admin-seller-orders': adminSearch=t.dataset.id; adminView='orders'; route(); break;
    case 'admin-alert': adminView=(t.dataset.kind||'').includes('seller')?'sellers':(t.dataset.kind||'').includes('product')?'products':(t.dataset.kind||'').includes('support')?'support':'reports'; route(); break;
    case 'admin-notification-open': if(window.adminNotificationService) window.adminNotificationService.markRead(t.dataset.id); if(t.dataset.orderId) adminOpenDetail('order',t.dataset.orderId); else route(); break;
    case 'admin-mark-notifications-read': window.adminNotificationService?.markAllRead(); route(); break;
    case 'mark-notifications-read': window.notificationService?.markAllAsRead().then(()=>route()).catch(e=>toast(e.message||'Unable to update notifications.','alert-triangle')); break;
    case 'admin-announcement-delete': window.ANILyfeAPI?.request('/api/admin/announcements/'+encodeURIComponent(t.dataset.id),{method:'DELETE'}).then(()=>window.ANILyfeAPI.refresh()).then(()=>route()).catch(e=>toast(e.message||'Unable to delete announcement.','alert-triangle')); break;
    case 'admin-ticket-view': adminOpenDetail('ticket', t.dataset.id); break;
    case 'admin-ticket-close': adminCloseDetail(); break;
    case 'dismiss-announcement': {const ids=LS.get('announcementDismissed',[]); if(!ids.includes(t.dataset.id)) ids.push(t.dataset.id); LS.set('announcementDismissed',ids); route(); break;}
    case 'admin-detail-close': adminCloseDetail(); break;
    case 'admin-seller-store': location.hash = '#/store/' + encodeURIComponent(t.dataset.id || ''); break;
    case 'admin-save-settings': adminSaveSettings(); break;
    case 'admin-setting-toggle': adminHandleSettingToggle(t.dataset.key, t.dataset.enabled === 'true'); break;
    case 'approve-seller': adminApproveSeller(t.dataset.id); break;
    case 'remove-seller': adminRemoveSeller(t.dataset.id); break;
    case 'restore-seller': adminRestoreSeller(t.dataset.id); break;
    case 'exit-admin': adminExit(); break;
    case 'toast': toast(t.dataset.msg,'info'); break;
  }
});

document.addEventListener('keydown', e=>{
  if(e.key==='Enter' && e.target.matches && e.target.matches('[data-mqi]')){ e.preventDefault(); searchRunFromKeydown(e.target.value); }
});

document.addEventListener('change', e=>{
  const t=e.target;
  if(t.dataset.action==='set-region'){ LS.set('region', t.value); toast(`Region set to ${region().flag} ${region().name} — prices now in ${region().symbol.trim()}.`,'globe-2'); route(); }
  if(t.id==='mqCat'){ searchSetCategoryFromSelect(t.value); }
  if(t.dataset.action==='admin-view-sel'){ adminView=t.value; route(); }
  if(t.name==='images' && t.type==='file'){ previewProductImages(t); }
});

document.addEventListener('submit', e=>{
  if(e.target.id==='sellerAppForm'){ e.preventDefault(); sellerApply(e.target); }
  if(e.target.id==='sellerVerificationForm'){ e.preventDefault(); submitSellerVerification(e.target); }
  if(e.target.id==='productForm'){ e.preventDefault(); productAdd(e.target); }
  if(e.target.id==='adminLoginForm'){ e.preventDefault(); adminLogin(e.target); }
  if(e.target.id==='adminRegForm'){ e.preventDefault(); adminRegister(e.target); }
  if(e.target.id==='supportContactForm'){ e.preventDefault(); submitSupportRequest(e.target); }
  if(e.target.id==='adminAnnouncementForm'){ e.preventDefault(); publishAdminAnnouncement(e.target); }
});

async function submitSupportRequest(form){
  const f=new FormData(form);
  const customer=String(f.get('name')||'').trim(), email=String(f.get('email')||'').trim(), category=String(f.get('topic')||'Other'), message=String(f.get('message')||'').trim();
  if(!customer||!email||!message){toast('Complete your name, email and message.','alert-circle');return;}
  try{
    await window.ANILyfeAPI.request('/api/support',{method:'POST',body:JSON.stringify({subject:category,message,email})});
    toast('Support request sent. The admin team has received it.','mail');
    form.reset();
  }catch(e){toast(e.message||'Support is unavailable. Please try again.','alert-triangle');}
}

async function publishAdminAnnouncement(form){
  const f=new FormData(form), file=f.get('image');
  const text=String(f.get('text')||'').trim(), link=String(f.get('link')||'').trim();
  if(!text){toast('Announcement text is required.','alert-circle');return;}
  try{
    let imageUrl='';
    if(file&&file.name){
      if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){toast('Announcement image must be JPG, PNG, WEBP or GIF.','alert-circle');return;}
      if(file.size>8*1024*1024){toast('Announcement image must be 8 MB or smaller.','alert-circle');return;}
      const fd=new FormData();fd.append('file',file);
      const uploaded=await window.ANILyfeAPI.request('/api/uploads/image',{method:'POST',body:fd}); imageUrl=uploaded.url;
    }
    await window.ANILyfeAPI.request('/api/admin/announcements',{method:'POST',body:JSON.stringify({text,imageUrl,linkUrl:link||undefined,active:true})});
    await window.ANILyfeAPI.refresh(); toast('Announcement published.','megaphone'); route();
  }catch(e){toast(e.message||'Announcement publishing failed.','alert-triangle');}
}

/* ---------- countdown ---------- */

async function submitSellerVerification(formEl){
  try {
    const f=new FormData(formEl);
    const required=['identityDocument'];
    for(const name of required){const file=f.get(name);if(!file||!file.name)throw new Error(`${name==='identityDocument'?'Identity document':''} is required.`);}
    const documents=[];
    for(const name of ['cacDocument','identityDocument','addressDocument']){
      const file=f.get(name); if(file&&file.name){
        if(file.size>10*1024*1024) throw new Error('Each verification document must be 10 MB or smaller.');
        const fd=new FormData();fd.append('file',file);
        const uploaded=await window.ANILyfeAPI.request('/api/uploads/document',{method:'POST',body:fd});
        documents.push({name:file.name,url:uploaded.url,mimeType:uploaded.mimeType,size:`${Math.max(1,Math.round(file.size/1024))} KB`,uploadedAt:new Date().toISOString().slice(0,10),status:'Pending Review'});
      }
    }
    const state=String(f.get('state')||'').trim(), lga=String(f.get('lga')||'').trim(), phone=String(f.get('phone')||'').trim(), businessEmail=String(f.get('businessEmail')||'').trim();
    if(!state||!lga||!phone) throw new Error('Complete your state, LGA and phone number.');
    await window.sellerService.updateStore({state, lga, phone, businessEmail:businessEmail||undefined});
    const data={legalBusinessName:String(f.get('legalBusinessName')||'').trim(),registrationType:String(f.get('registrationType')||'').trim(),taxIdentificationNumber:String(f.get('taxIdentificationNumber')||'').trim(),directorName:String(f.get('directorName')||'').trim(),nationalIdType:String(f.get('nationalIdType')||'').trim(),nationalIdNumber:String(f.get('nationalIdNumber')||'').trim(),registeredAddress:String(f.get('registeredAddress')||'').trim(),submittedDocuments:{documents,payoutDetails:{bankName:String(f.get('payoutBank')||'').trim(),accountName:String(f.get('payoutAccountName')||'').trim(),accountNumber:String(f.get('payoutAccountNumber')||'').trim()}}};
    if(!data.legalBusinessName||!data.directorName||!data.nationalIdType||!data.nationalIdNumber||!data.registeredAddress) throw new Error('Complete all required verification fields.');
    await window.verificationService.submitVerification(data);
    toast('Verification submitted for admin review.','shield-check'); route();
  } catch(err){ toast(err.message||'Verification submission failed.','alert-triangle'); }
}
