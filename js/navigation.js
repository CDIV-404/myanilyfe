/* ANIlyfe — extracted from the original single-file prototype (index.html) */

/* Hash router: renders the active view into #app and wires up global
   click / keydown / change / submit delegation for the whole prototype. */

let timers = [];
const clearTimers = () => { timers.forEach(t=>{clearInterval(t);clearTimeout(t);}); timers = []; };

let routeLoaderTimer = null;
let lastRenderedHash = '';
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
  const requestedHash = location.hash || '#/';
  if(requestedHash==='#/control-room'||requestedHash.startsWith('#/control-room/')){
    if(!['ADMIN','SUPER_ADMIN'].includes(window.currentUser?.()?.role||'')){location.hash='#/';toast('Administrator access is required.','shield-alert');return;}
    location.hash='#/admin-dashboard';
    return;
  }
  const h = requestedHash;
  const loaderMessage = h.startsWith('#/admin') ? 'Loading admin workspace...' : h.startsWith('#/seller') ? 'Loading Seller Center...' : h.startsWith('#/checkout') ? 'Loading checkout...' : h.startsWith('#/orders') ? 'Loading orders...' : h.startsWith('#/cart') ? 'Loading cart...' : h.startsWith('#/auth') ? 'Loading authentication...' : h.startsWith('#/marketplace') ? 'Loading marketplace products...' : 'Loading marketplace view...';
  const isSellerWorkspace = hash => hash.startsWith('#/seller') && !hash.startsWith('#/seller/application') && !hash.startsWith('#/seller-application');
  if(!(isSellerWorkspace(lastRenderedHash) && isSellerWorkspace(h))) showRouteLoader(loaderMessage);
  closeAllDrops();
  window.closeModal?.();
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
    app.innerHTML = `<div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5"><div class="card p-10 max-w-lg text-center"><div class="w-16 h-16 rounded-2xl bg-[#E7F1FF] flex items-center justify-center mx-auto mb-4"><i data-lucide="wrench" style="width:28px;height:28px;color:#334EAC"></i></div><div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1]">MARKETPLACE NOTICE</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C] mt-2">ANIlyfe is temporarily unavailable</h1><p class="text-sm text-slate-500 mt-3">The marketplace is currently in maintenance mode. Please check back shortly.</p></div></div>`;
    afterRender();
    hideRouteLoader();
    return;
  }
  let html = '';
  if(h.startsWith('#/admin-dashboard') || h === '#/admin' || h.startsWith('#/admin/dashboard'))      html = viewAdminDash();
  else if(h==='#/admin-signup')                html = viewAdminSignup();
  else if(h.startsWith('#/admin-login'))      html = viewAdminLogin();
  else if(h==='#/login')                      { authMode='login'; html=viewAuth(); }
  else if(h.startsWith('#/forgot-password'))   html=viewForgotPassword();
  else if(h.startsWith('#/reset-password'))    html=viewResetPassword();
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
  else if(h==='#/seller-application/policy')  html = viewSellerPolicyGate();
  else if(h==='#/seller/application')          html = viewSellerApplicationStatus();
  else if(h.startsWith('#/contact'))          html = viewContact();
  else if(h.startsWith('#/wishlist'))         html = viewWishlist();
  else if(h.startsWith('#/orders'))           html = viewOrders();
  else if(h.startsWith('#/product/'))         html = viewProduct(h.replace('#/product/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/store/'))           html = viewSellerStore(h.replace('#/store/','').split('/')[0].split('?')[0]);
  else if(h.startsWith('#/category/'))        html = viewCategory(decodeURIComponent(h.replace('#/category/','').split('/')[0].split('?')[0]));
  else if(h.startsWith('#/seller/dashboard')) html = viewSellerCenter('dashboard');
  else if(h === '#/seller-center' || h.startsWith('#/seller-center/')) html = viewSellerCenter('dashboard');
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
  else if(h.startsWith('#/seller/founders'))  html = viewSellerCenter('founders');
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
  lastRenderedHash = h;
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
  if(!t){
    const sellerLink=e.target.closest('a[href="#/auth"]');
    if(sellerLink&&/become a seller/i.test(sellerLink.textContent||'')){
      e.preventDefault();
      sellerTermsAccepted=false;
      location.hash='#/seller-application/policy';
    }
    const sellerCenterLink=e.target.closest('a[href="#/seller-center"]');
    if(sellerCenterLink&&String(window.sellerOf?.(window.currentUser?.()?.id)?.status||'').toLowerCase()!=='approved'){
      e.preventDefault();
      location.hash='#/seller/application';
    }
    return;
  }
  const act = t.dataset.action;
  const toggle = id => { const d=document.getElementById(id); const was=d.classList.contains('open'); closeAllDrops(); if(!was) d.classList.add('open'); };

  switch(act){
    case 'retry-bootstrap': window.ANILyfeAPI?.retryBootstrap?.(); break;
    case 'auth-mode': authMode=t.dataset.mode; route(); break;
    case 'auth-switch': authMode=t.dataset.mode;if(t.dataset.mode==='create'&&t.dataset.role==='seller'){sellerTermsAccepted=false;location.hash='#/seller-application/policy';}else openAuthModal(t.dataset.mode,t.dataset.role);break;
    case 'auth-open': if(t.dataset.mode==='create'&&t.dataset.role==='seller'){sellerTermsAccepted=false;location.hash='#/seller-application/policy';}else openAuthModal(t.dataset.mode,t.dataset.role);break;
    case 'close-modal': case 'close-modal-bg': closeModal(); break;
    case 'seller-policy-continue': {
      if(!document.getElementById('seller-policy-accept')?.checked){toast('Accept the Founding Seller Programme Policy before continuing.','shield-alert');break;}
      sellerTermsAccepted=true;
      const u=window.currentUser?.();
      if(u)openSellerAppModal();else{authMode='create';openAuthModal('create','seller');}
      break;
    }
    case 'become-seller': {
      const u = window.currentUser ? window.currentUser() : null;
      if(!u){ sellerTermsAccepted=false;location.hash='#/seller-application/policy';break; }
      const seller = window.sellerOf ? window.sellerOf(u.id) : (typeof sellerOf==='function' ? sellerOf(u.id) : null);
      if(seller){ location.hash=String(seller.status).toUpperCase()==='APPROVED'?'#/seller-center':'#/seller/application';break; }
      sellerTermsAccepted=false;
      location.hash='#/seller-application/policy';
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
    case 'add-cart': cartAdd(t.dataset.id,document.getElementById('productVariantSelect')?.value||undefined); break;
    case 'cart-remove': cartRemove(t.dataset.id); break;
    case 'checkout': checkoutNow(); break;

    case 'logout': {
      const api=window.ANILyfeAPI;
      const finish=()=>{api?.setUser?.(null);if(api?.state){api.state.user=null;api.state.seller=null;}toast('Logged out.','log-out');location.hash='#/';};
      if(api?.request)api.request('/api/auth/logout',{method:'POST',body:'{}'}).catch(()=>{}).finally(finish);else finish();
      break;
    }
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
    case 'profile-tab': {
      const tab=t.dataset.tab||'profile';
      document.querySelectorAll('[data-action="profile-tab"]').forEach(btn=>{const active=btn.dataset.tab===tab;btn.classList.toggle('btn-primary',active);btn.classList.toggle('btn-ghost',!active);btn.setAttribute('aria-selected',String(active));});
      document.querySelectorAll('[data-profile-panel]').forEach(panel=>panel.classList.toggle('hidden',panel.dataset.profilePanel!==tab));
      break;
    }
    case 'profile-address-new': {
      const form=document.getElementById('addressBookForm');
      if(!form)break;
      form.reset();form.elements.addressId.value='';form.querySelector('[type="submit"]').textContent='Save address';
      form.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>form.elements.recipientName?.focus(),250);
      break;
    }
    case 'profile-address-delete': window.ANILyfeAPI.request('/api/auth/me/addresses/'+encodeURIComponent(t.dataset.id),{method:'DELETE'}).then(()=>route()).catch(e=>toast(e.message||'Unable to delete address.','alert-triangle')); break;
    case 'profile-address-default': window.ANILyfeAPI.request('/api/auth/me/addresses/'+encodeURIComponent(t.dataset.id),{method:'PATCH',body:JSON.stringify({isDefault:true})}).then(()=>route()).catch(e=>toast(e.message||'Unable to set default address.','alert-triangle')); break;
    case 'profile-address-edit': window.ANILyfeAPI.request('/api/auth/me/addresses').then(rows=>{const a=rows.find(x=>x.id===t.dataset.id),form=document.getElementById('addressBookForm');if(!a||!form)return;for(const key of ['recipientName','recipientPhone','state','city','lga','addressLine'])form.elements[key].value=a[key]||'';form.elements.addressId.value=a.id;form.elements.isDefault.checked=!!a.isDefault;form.querySelector('[type="submit"]').textContent='Update address';form.scrollIntoView({behavior:'smooth',block:'center'});}).catch(e=>toast(e.message||'Unable to load address.','alert-triangle'));break;
    case 'buyer-withdrawal-quote': quoteBuyerWithdrawal(); break;
    case 'buyer-withdrawal-submit': submitBuyerWithdrawal(); break;
    case 'buyer-confirm-delivery': window.orderService.confirmDelivery(t.dataset.id).then(()=>window.ANILyfeAPI.refresh()).then(()=>{toast('Delivery confirmed. Your seller payout is now subject to the release hold.','badge-check');route();}).catch(e=>toast(e.message||'Unable to confirm delivery.','alert-triangle'));break;
    case 'buyer-open-dispute': {const reason=prompt('Tell us what went wrong (10–2,000 characters):','');if(reason===null)return;if(reason.trim().length<10||reason.trim().length>2000){toast('Enter a dispute reason between 10 and 2,000 characters.','alert-triangle');break;}window.orderService.openDispute(t.dataset.id,reason.trim()).then(()=>window.ANILyfeAPI.refresh()).then(()=>{toast('Dispute submitted. Seller funds are held while ANIlyfe reviews it.','shield-alert');route();}).catch(e=>toast(e.message||'Unable to open dispute.','alert-triangle'));break;}
    case 'email-verification-resend': {const email=document.getElementById('emailVerificationForm')?.dataset.email||'';if(email)window.ANILyfeAPI.request('/api/auth/resend-verification',{method:'POST',body:JSON.stringify({email})}).then(()=>toast('A new verification code has been sent.','mail-check')).catch(err=>toast(err.message||'Unable to resend code.','alert-triangle'));else toast('Start signup again to request a new code.','alert-triangle');break;}
    case 'admin-application-resend': {const email=document.getElementById('adminApplicationOtpForm')?.dataset.email||'';window.ANILyfeAPI.request('/api/auth/resend-verification',{method:'POST',body:JSON.stringify({email})}).then(()=>toast('A new verification code has been sent.','mail-check')).catch(err=>toast(err.message||'Unable to resend code.','alert-triangle'));break;}
    case 'del-product': productDelete(t); break;

    case 'admin-tab': adminTab=t.dataset.tab; route(); break;
    case 'admin-view': adminView=t.dataset.view; adminDetailType=null; adminDetailId=null; adminProductPreviewId=null; route(); break;
    case 'admin-view-sel': /* handled on change */ break;
    case 'admin-user-tab': adminUserTab=['all','buyers','sellers','admins','suspended'].includes(t.dataset.tab)?t.dataset.tab:'all';route();break;
    case 'admin-seller-tab': adminSellerTab=['pending','suspended','founding'].includes(t.dataset.tab)?t.dataset.tab:'all';route();break;
    case 'admin-seller-status': adminUpdateSellerStatus(t.dataset.id, t.dataset.status); break;
    case 'admin-seller-commission-save': {const rate=Number(document.getElementById('admin-seller-commission')?.value);window.ANILyfeAPI.request('/api/admin/sellers/'+encodeURIComponent(t.dataset.id)+'/commission',{method:'PATCH',body:JSON.stringify({commissionRate:rate})}).then(()=>window.ANILyfeAPI.refresh()).then(()=>{toast('Seller commission updated.','check');route();}).catch(e=>toast(e.message||'Unable to update commission.','alert-triangle'));break;}
    case 'admin-seller-founding-toggle': window.ANILyfeAPI.request('/api/admin/sellers/'+encodeURIComponent(t.dataset.id)+'/founding-status',{method:'PATCH',body:JSON.stringify({active:t.dataset.active==='true'})}).then(()=>window.ANILyfeAPI.refresh()).then(()=>{toast('Founding Seller status updated.','badge-check');route();}).catch(e=>toast(e.message||'Unable to update Founding Seller status.','alert-triangle')); break;
    case 'admin-remove-admin': if(confirm('Remove administrator access from this account?'))window.ANILyfeAPI.request('/api/admin/management/'+encodeURIComponent(t.dataset.id),{method:'DELETE'}).then(()=>window.ANILyfeAPI.refresh()).then(()=>{toast('Administrator access removed.','shield-off');route();}).catch(e=>toast(e.message||'Unable to remove administrator.','alert-triangle')); break;
    case 'admin-product-preview': adminOpenProductPreview(t.dataset.id); break;
    case 'admin-product-preview-close': adminCloseProductPreview(); break;
    case 'admin-payout-hold': window.adminTogglePayoutHold(t.dataset.id,t.dataset.held==='true'); break;
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
    case 'admin-save-settings': (window.adminSetSettingsFromForm||adminSaveSettings)(); break;
    case 'admin-process-withdrawal': adminProcessWithdrawal(t.dataset.id); break;
    case 'admin-resolve-dispute': adminResolveDispute(t.dataset.id,t.dataset.status); break;
    case 'admin-expire-reservations': adminExpireReservations(); break;
    case 'admin-setting-toggle': (window.adminToggleSetting||adminHandleSettingToggle)(t.dataset.key, t.dataset.enabled === 'true'); break;
    case 'approve-seller': adminApproveSeller(t.dataset.id); break;
    case 'remove-seller': adminRemoveSeller(t.dataset.id); break;
    case 'restore-seller': adminRestoreSeller(t.dataset.id); break;
    case 'exit-admin': adminExit(); break;
    case 'toast': toast(t.dataset.msg,'info'); break;
  }
});

document.addEventListener('keydown', e=>{
  if(e.key==='Escape'&&document.querySelector('#modal-root .modal-back')){e.preventDefault();window.closeModal?.();return;}
  if(e.key==='Enter' && e.target.matches && e.target.matches('[data-mqi]')){ e.preventDefault(); searchRunFromKeydown(e.target.value); }
});

document.addEventListener('change', e=>{
  const t=e.target;
  if(t.id==='seller-policy-accept'){const button=document.querySelector('[data-action="seller-policy-continue"]');if(button)button.disabled=!t.checked;}
  if(t.dataset.action==='set-region'){ LS.set('region', t.value); toast(`Region set to ${region().flag} ${region().name} — prices now in ${region().symbol.trim()}.`,'globe-2'); route(); }
  if(t.id==='mqCat'){ searchSetCategoryFromSelect(t.value); }
  if(t.id==='productVariantSelect'){const option=t.selectedOptions?.[0];const price=document.getElementById('productPrice');const stock=document.getElementById('productVariantStock');const add=document.querySelector('[data-action="add-cart"]');if(option?.value){if(price)price.textContent=fmt(Number(option.dataset.price||0));if(stock)stock.textContent=`${option.dataset.stock||0} available`;if(add)add.disabled=Number(option.dataset.stock||0)<1;}}
  if(t.dataset.action==='admin-view-sel'){ adminView=t.value; route(); }
  if(t.name==='images' && t.type==='file'){ previewProductImages(t); }
  if(t.id==='verificationAccountNumber'||t.id==='verificationBankCode') resolveSellerBankAccount();
});

let sellerBankResolveKey='';
document.addEventListener('input',e=>{
  if(e.target.id!=='verificationAccountNumber')return;
  if(/^\d{10}$/.test(e.target.value))resolveSellerBankAccount();
  else sellerBankResolveKey='';
});

async function resolveSellerBankAccount(){
  const number=document.getElementById('verificationAccountNumber'),bank=document.getElementById('verificationBankCode'),name=document.getElementById('verificationAccountName');
  if(!number||!bank||!name||!/^\d{10}$/.test(number.value)||!bank.value)return;
  const lookupKey=`${number.value}:${bank.value}`;
  if(sellerBankResolveKey===lookupKey)return;
  sellerBankResolveKey=lookupKey;
  name.value='Checking account…';
  try{const result=await window.ANILyfeAPI.request(`/api/payments/resolve-account?account_number=${encodeURIComponent(number.value)}&bank_code=${encodeURIComponent(bank.value)}`);if(`${number.value}:${bank.value}`===lookupKey)name.value=result.accountName||'';}
  catch(error){if(`${number.value}:${bank.value}`===lookupKey){sellerBankResolveKey='';name.value='';toast(error.message||'Could not verify this bank account.','alert-triangle');}}
}

async function quoteBuyerWithdrawal(){
  const form=document.getElementById('buyerWithdrawalForm');
  const output=document.getElementById('buyerWithdrawalQuote');
  const submit=form?.querySelector('[data-action="buyer-withdrawal-submit"]');
  if(!form||!output||!submit)return;
  const amount=Number(form.elements.amount.value);
  submit.disabled=true;
  submit.dataset.amount='';
  submit.dataset.fee='';
  output.textContent='Loading fee quote…';
  try{
    const quote=await window.ANILyfeAPI.request('/api/withdrawals/quote?amount='+encodeURIComponent(amount));
    const money=value=>'₦'+Number(value||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});
    output.textContent=`Requested ${money(quote.requestedAmount)} · Fee ${money(quote.feeAmount)} · You receive ${money(quote.netAmount)}.`;
    if(!quote.sufficientBalance){output.textContent+=` Your available balance is ${money(quote.availableBalance)}.`;return;}
    if(Number(quote.netAmount)<=0){output.textContent+=' The requested amount must exceed the fee.';return;}
    submit.dataset.amount=String(quote.requestedAmount);
    submit.dataset.fee=String(quote.feeAmount);
    submit.disabled=false;
  }catch(error){
    output.textContent=error.message||'Unable to calculate the withdrawal fee.';
  }
}

async function submitBuyerWithdrawal(){
  const form=document.getElementById('buyerWithdrawalForm');
  const output=document.getElementById('buyerWithdrawalQuote');
  const submit=form?.querySelector('[data-action="buyer-withdrawal-submit"]');
  if(!form||!output||!submit)return;
  const amount=Number(form.elements.amount.value);
  if(submit.disabled||Number(submit.dataset.amount)!==amount){toast('Preview the current withdrawal fee before confirming.','alert-triangle');return;}
  const bank=form.elements.bankCode.selectedOptions[0];
  const accountNumber=String(form.elements.accountNumber.value||'').trim();
  if(!bank?.value||!/^\d{10}$/.test(accountNumber)){toast('Choose a bank and enter a valid 10-digit account number.','alert-triangle');return;}
  const fee=Number(submit.dataset.fee);
  const net=amount-fee;
  const money=value=>'₦'+Number(value||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(!confirm(`Confirm withdrawal of ${money(amount)}?\nFee: ${money(fee)}\nNet payout: ${money(net)}\nBank: ${bank.textContent}\nAccount: ••••${accountNumber.slice(-4)}`))return;
  submit.disabled=true;
  try{
    await window.ANILyfeAPI.request('/api/withdrawals',{method:'POST',body:JSON.stringify({
      amount,expectedFeeAmount:fee,confirmed:true,idempotencyKey:crypto.randomUUID(),
      accountNumber,bankCode:bank.value,bankName:bank.dataset.bankName
    })});
    toast('Withdrawal request submitted.','wallet');
    route();
  }catch(error){
    submit.disabled=false;
    toast(error.message||'Unable to submit withdrawal.','alert-triangle');
  }
}

document.addEventListener('input',event=>{
  if(event.target?.form?.id!=='buyerWithdrawalForm'||event.target.name!=='amount')return;
  const submit=event.target.form.querySelector('[data-action="buyer-withdrawal-submit"]');
  const output=document.getElementById('buyerWithdrawalQuote');
  if(submit){submit.disabled=true;submit.dataset.amount='';submit.dataset.fee='';}
  if(output)output.textContent='The amount changed. Preview the updated fee before confirming.';
});

document.addEventListener('change',event=>{
  const animeSelect=event.target.closest?.('[data-profile-anime]');
  if(animeSelect){
    const characterSelect=animeSelect.form?.querySelector('[data-profile-character]');
    if(characterSelect){const previous=characterSelect.value;characterSelect.innerHTML=animeCharacterOptions(animeSelect.value,'');characterSelect.value=ANIME_PREFERENCES[animeSelect.value]?.includes(previous)?previous:'';}
    return;
  }
  const avatarInput=event.target.closest?.('#profileSettingsForm input[name="avatar"]');
  if(avatarInput){
    const file=avatarInput.files?.[0],preview=document.getElementById('profileAvatarPreview');
    if(file&&preview&&/^image\//.test(file.type)){preview.src=URL.createObjectURL(file);preview.classList.remove('hidden');}
  }
});

document.addEventListener('submit', e=>{
  if(e.target.id==='sellerAppForm'){ e.preventDefault(); sellerApply(e.target); }
  if(e.target.id==='sellerVerificationForm'){ e.preventDefault(); submitSellerVerification(e.target); }
  if(e.target.id==='productForm'){ e.preventDefault(); productAdd(e.target); }
  if(e.target.id==='adminLoginForm'){ e.preventDefault(); adminLogin(e.target); }
  if(e.target.id==='adminRegForm'){ e.preventDefault(); adminRegister(e.target); }
  if(e.target.id==='supportContactForm'){ e.preventDefault(); submitSupportRequest(e.target); }
  if(e.target.id==='adminAnnouncementForm'){ e.preventDefault(); publishAdminAnnouncement(e.target); }
  if(e.target.id==='adminManagementForm'){ e.preventDefault(); grantAdminAccess(e.target); }
  if(e.target.id==='adminUserNotesForm'){e.preventDefault();saveAdminUserNotes(e.target);}
  if(e.target.id==='profileSettingsForm'){ e.preventDefault(); saveProfileSettings(e.target); }
  if(e.target.id==='addressBookForm'){ e.preventDefault(); saveProfileAddress(e.target); }
  if(e.target.id==='changePasswordForm'){ e.preventDefault(); changeProfilePassword(e.target); }
  if(e.target.id==='emailChangeRequestForm'){ e.preventDefault(); requestProfileEmailChange(e.target); }
  if(e.target.id==='emailChangeConfirmForm'){ e.preventDefault(); confirmProfileEmailChange(e.target); }
});

async function grantAdminAccess(form){try{const f=new FormData(form);await window.ANILyfeAPI.request('/api/admin/management',{method:'POST',body:JSON.stringify({email:String(f.get('email')||'').trim().toLowerCase(),role:String(f.get('role')||'ADMIN')})});await window.ANILyfeAPI.refresh();toast('Administrator access granted.','shield-check');route();}catch(e){toast(e.message||'Unable to grant administrator access.','alert-triangle');}}
async function saveAdminUserNotes(form){try{const notes=String(new FormData(form).get('notes')||'');await window.ANILyfeAPI.request('/api/admin/users/'+encodeURIComponent(form.dataset.userId)+'/notes',{method:'PATCH',body:JSON.stringify({notes})});await window.ANILyfeAPI.refresh();toast('Admin notes saved.','notebook-pen');route();}catch(e){toast(e.message||'Unable to save admin notes.','alert-triangle');}}

async function saveProfileSettings(form){try{const f=new FormData(form);let profileImageUrl;const avatar=f.get('avatar');if(avatar?.name){if(!/^image\/(jpeg|png|webp)$/.test(avatar.type)||avatar.size>8*1024*1024)throw new Error('Choose a JPG, PNG or WEBP avatar under 8 MB.');const fd=new FormData();fd.append('file',avatar);profileImageUrl=(await window.ANILyfeAPI.request('/api/uploads/image',{method:'POST',body:fd})).url;}const body={};for(const key of ['firstName','lastName','phone','state','city','lga','favoriteAnime','favoriteCharacter'])body[key]=String(f.get(key)||'').trim();if(profileImageUrl)body.profileImageUrl=profileImageUrl;const updated=await window.ANILyfeAPI.request('/api/auth/me',{method:'PATCH',body:JSON.stringify(body)});window.ANILyfeAPI.setUser?.(updated);await window.ANILyfeAPI.refresh();toast('Profile updated.','check');route();}catch(e){toast(e.message||'Unable to save profile.','alert-triangle');}}
async function saveProfileAddress(form){try{const f=new FormData(form);const data={};for(const key of ['recipientName','recipientPhone','state','city','lga','addressLine'])data[key]=String(f.get(key)||'').trim();data.isDefault=f.get('isDefault')==='on';const id=String(f.get('addressId')||'');await window.ANILyfeAPI.request(id?'/api/auth/me/addresses/'+encodeURIComponent(id):'/api/auth/me/addresses',{method:id?'PATCH':'POST',body:JSON.stringify(data)});toast(id?'Delivery address updated.':'Delivery address saved.','map-pin');route();}catch(e){toast(e.message||'Unable to save address.','alert-triangle');}}
async function changeProfilePassword(form){try{const f=new FormData(form);const next=String(f.get('newPassword')||''),confirm=String(f.get('confirmPassword')||'');if(next!==confirm)throw new Error('New password and confirmation do not match.');const result=await window.ANILyfeAPI.request('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword:f.get('currentPassword'),newPassword:next})});window.ANILyfeAPI.setUser?.(window.currentUser?.(),result.accessToken);toast('Password updated.','shield-check');form.reset();}catch(e){toast(e.message||'Unable to change password.','alert-triangle');}}
async function requestProfileEmailChange(form){try{const email=String(new FormData(form).get('email')||'').trim().toLowerCase();await window.ANILyfeAPI.request('/api/auth/me/email-change/request',{method:'POST',body:JSON.stringify({email})});const confirm=document.getElementById('emailChangeConfirmForm')?.elements.email;if(confirm)confirm.value=email;toast('Confirmation code sent to the new email address.','mail-check');}catch(e){toast(e.message||'Unable to request email change.','alert-triangle');}}
async function confirmProfileEmailChange(form){try{const f=new FormData(form);const result=await window.ANILyfeAPI.request('/api/auth/me/email-change/confirm',{method:'POST',body:JSON.stringify({email:String(f.get('email')||'').trim().toLowerCase(),code:String(f.get('code')||'').trim()})});toast(`Email changed to ${result.email}.`,'mail-check');await window.ANILyfeAPI.refresh();route();}catch(e){toast(e.message||'Unable to verify new email.','alert-triangle');}}

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
    const rawNin=String(f.get('nationalIdNumber')||'').trim();
    if(!/^\d{11}$/.test(rawNin))throw new Error('Enter your complete 11-digit NIN.');
    const payoutBankCode=String(f.get('payoutBankCode')||'').trim(), payoutAccountNumber=String(f.get('payoutAccountNumber')||'').trim(), payoutAccountName=String(f.get('payoutAccountName')||'').trim();
    if(!payoutBankCode||!/^\d{10}$/.test(payoutAccountNumber)||!payoutAccountName||payoutAccountName==='Checking account…')throw new Error('Choose a bank and verify your 10-digit account number.');
    const statusEl=document.getElementById('ninVerificationStatus');if(statusEl){statusEl.innerHTML='<span class="inline-flex items-center gap-2"><i data-lucide="loader-circle" class="animate-spin" style="width:14px;height:14px"></i> Verifying your NIN securely…</span>';window.lucide?.createIcons?.();}
    try{
      const identity=window.currentUser?.()||{};
      const names=String(f.get('directorName')||`${identity.firstName||''} ${identity.lastName||''}`).trim().split(/\s+/);
      const result=await window.ANILyfeAPI.request('/api/sellers/me/verification/nin',{method:'POST',body:JSON.stringify({nin:rawNin,firstName:names[0]||'Seller',lastName:names.slice(1).join(' ')||'Seller'})});
      const ninVerified=!!result.verified;
      if(statusEl){statusEl.className=`mt-2 text-xs ${ninVerified?'text-emerald-700':'text-amber-700'}`;statusEl.textContent=ninVerified?'✓ NIN verified successfully.':'We couldn’t verify your NIN automatically. Your application will be reviewed manually.';}
    }catch(verificationError){
      if(verificationError.code==='VALIDATION_ERROR'||verificationError.code==='INVALID_NIN')throw new Error('Enter a valid 11-digit NIN.');
      if(statusEl){statusEl.className='mt-2 text-xs text-amber-700';statusEl.textContent='We couldn’t verify your NIN automatically. Your application will be reviewed manually.';}
    }
    const selectedBank=document.getElementById('verificationBankCode')?.selectedOptions?.[0]?.textContent||'';
    const data={legalBusinessName:String(f.get('directorName')||'').trim(),directorName:String(f.get('directorName')||'').trim(),nationalIdType:'NIN',nationalIdNumber:`•••••••${rawNin.slice(-4)}`,submittedDocuments:{payoutDetails:{bankName:selectedBank,bankCode:payoutBankCode,accountName:payoutAccountName,accountNumber:payoutAccountNumber}}};
    await window.verificationService.submitVerification(data);
    await window.payoutService.updatePayoutAccount({bankName:selectedBank,bankCode:payoutBankCode,accountName:payoutAccountName,accountNumber:payoutAccountNumber});
    toast('Verification submitted for admin review.','shield-check'); route();
  } catch(err){ toast(err.message||'Verification submission failed.','alert-triangle'); }
}
