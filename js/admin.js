/* Anilyfe — extracted from the original single-file prototype (index.html) */

/* Admin login + dashboard views, and the seller-moderation / admin-account
   actions used from admin/*.html. Not in the original file tree spec, but
   split out here so admin logic isn't buried inside app.js. */

let adminTab='login';
let adminView='dashboard';
let adminUserTab='active';
let adminSellerTab='all';

const ADMIN_VIEW_TYPES = [
  {k:'dashboard', i:'gauge', l:'Dashboard'},
  {k:'users', i:'users', l:'Users'},
  {k:'sellers', i:'store', l:'Sellers'},
  {k:'products', i:'package', l:'Products'},
  {k:'orders', i:'shopping-bag', l:'Orders'},
  {k:'payments', i:'wallet', l:'Payments'},
  {k:'reports', i:'flag', l:'Reports'},
  {k:'support', i:'life-buoy', l:'Support'},
  {k:'settings', i:'sliders-horizontal', l:'Settings'},
  {k:'announcements', i:'megaphone', l:'Announcements'},
  {k:'audit-logs', i:'scroll-text', l:'Audit Logs'},
  {k:'admin-applications', i:'user-round-check', l:'Admin applications'}
  ,{k:'admin-management', i:'shield-user', l:'Admin Management'}
];

let adminSearch = '';
let adminProductPreviewId = null;
let adminDetailType = null;
let adminDetailId = null;

function viewAdminLogin(){
  if(currentAdmin()){ location.hash='#/admin-dashboard'; return ''; }
  return `
  <div class="min-h-screen hero-ambient relative flex flex-col overflow-hidden">
    <div class="absolute inset-0 grid-lines"></div>${sparks(18,4)}
    <header class="relative z-10 max-w-6xl w-full mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO_D('text-xl')}
      <a href="#/" class="text-xs font-bold text-[#708BD1] hover:text-white transition flex items-center gap-1.5"><i data-lucide="arrow-left" style="width:13px;height:13px"></i> Back to marketplace</a>
    </header>
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
      <div class="glass-dark rounded-3xl p-8 w-full max-w-md reveal">
        <img src="assets/images/admin.png" width="400" height="144" alt="Anilyfe administrator control room" class="mb-6 h-36 w-full rounded-2xl border border-white/15 object-cover" loading="lazy" onerror="this.remove()">
        <div class="flex items-center gap-3 mb-6">
          <span class="w-11 h-11 rounded-2xl bg-[rgba(208,227,255,.12)] border border-[rgba(208,227,255,.2)] flex items-center justify-center"><i data-lucide="shield-check" style="width:20px;height:20px;color:#D0E3FF"></i></span>
          <div><div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#708BD1]">RESTRICTED ACCESS</div><h1 class="font-display font-bold text-xl text-white">Administrator Gateway</h1></div>
        </div>
        <div class="mb-6 rounded-xl bg-[rgba(8,31,92,.6)] px-4 py-3 text-xs font-semibold text-[#d2bce0]">Administrator access is restricted to authorized accounts.</div>
        <form id="adminLoginForm" class="space-y-4" aria-label="Administrator sign in">
          <div><label for="adminLoginEmail" class="lbl !text-[#708BD1]">Email</label><input id="adminLoginEmail" class="inp !bg-[rgba(255,255,255,.08)] !border-[rgba(208,227,255,.2)] !text-white placeholder:!text-[#5A6FA8]" type="email" name="email" required placeholder="admin@anilyfe.com" autocomplete="username"/></div>
          <div><label for="adminLoginPassword" class="lbl !text-[#708BD1]">Password</label><div class="relative"><input id="adminLoginPassword" class="inp pr-12 !bg-[rgba(255,255,255,.08)] !border-[rgba(208,227,255,.2)] !text-white placeholder:!text-[#5A6FA8]" type="password" name="password" required placeholder="••••••••" autocomplete="current-password"/><button type="button" data-password-toggle class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D0E3FF]" aria-label="Show password"><i data-lucide="eye" style="width:17px;height:17px"></i></button></div></div>
          <button class="btn btn-primary w-full !py-3" type="submit">Access Control Panel <i data-lucide="lock-open" style="width:15px;height:15px"></i></button>
        </form>
      </div>
    </main>
  </div>`;
}

function viewAdminSignup(){
  return `
  <div class="min-h-screen hero-ambient relative flex flex-col overflow-hidden">
    <div class="absolute inset-0 grid-lines"></div>${sparks(18,4)}
    <header class="relative z-10 max-w-6xl w-full mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO_D('text-xl')}
      <a href="#/admin-login" class="text-xs font-bold text-[#d2bce0] hover:text-white transition">Administrator sign in</a>
    </header>
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
      <div class="glass-dark rounded-3xl p-6 sm:p-8 w-full max-w-md reveal">
        <div class="flex items-center gap-3 mb-5">
          <span class="w-11 h-11 rounded-2xl bg-[rgba(208,227,255,.12)] border border-[rgba(208,227,255,.2)] flex items-center justify-center"><i data-lucide="shield-check" style="width:20px;height:20px;color:#D0E3FF"></i></span>
          <div><div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#d2bce0]">PRIVATE ADMIN URL</div><h1 class="font-display font-bold text-xl text-white">Admin application</h1></div>
        </div>
        <p class="mb-5 rounded-xl bg-[rgba(8,31,92,.6)] px-4 py-3 text-xs leading-relaxed text-[#C9D9F5]">Applications stay inactive until a super administrator reviews them and assigns an administrator role.</p>
        <form id="adminSignupForm" class="space-y-4" aria-label="Admin application submission">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label for="adminSignupFirstName" class="lbl !text-[#d2bce0]">First name</label><input id="adminSignupFirstName" class="inp !bg-[rgba(255,255,255,.08)] !border-[rgba(208,227,255,.2)] !text-white" name="firstName" autocomplete="given-name" required maxlength="80"></div>
            <div><label for="adminSignupLastName" class="lbl !text-[#d2bce0]">Last name</label><input id="adminSignupLastName" class="inp !bg-[rgba(255,255,255,.08)] !border-[rgba(208,227,255,.2)] !text-white" name="lastName" autocomplete="family-name" required maxlength="80"></div>
          </div>
          <div><label for="adminSignupEmail" class="lbl !text-[#d2bce0]">Email</label><input id="adminSignupEmail" class="inp !bg-[rgba(255,255,255,.08)] !border-[rgba(208,227,255,.2)] !text-white" type="email" name="email" autocomplete="email" required maxlength="254"></div>
          <div><label for="adminSignupPassword" class="lbl !text-[#d2bce0]">Password</label><div class="relative"><input id="adminSignupPassword" class="inp pr-12 !bg-[rgba(255,255,255,.08)] !border-[rgba(208,227,255,.2)] !text-white" type="password" name="password" autocomplete="new-password" minlength="12" required><button type="button" data-password-toggle class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D0E3FF]" aria-label="Show password"><i data-lucide="eye" style="width:17px;height:17px"></i></button></div><p class="mt-1 text-[10px] text-[#d2bce0]">Use at least 12 characters.</p></div>
          <button class="btn btn-primary w-full !py-3" type="submit">Submit for review <i data-lucide="send" style="width:15px;height:15px"></i></button>
        </form>
      </div>
    </main>
  </div>`;
}

function getAdminMetrics(){
  const api=window.ANILyfeAPI?.state?.admin;
  if(api&&['ADMIN','SUPER_ADMIN'].includes(window.currentUser?.()?.role)){
    const users=api.users||[], sellers=api.sellers||[], products=api.products||[], orders=api.orders||[], tickets=api.tickets||[], payouts=api.payouts||[];
    const stats=api.dashboard?.stats||{};
    const transactions=orders.flatMap(o=>(o.payments||[]).map(p=>({id:p.id||p.reference,buyer:o.buyer,seller:o.seller,amount:Number(p.amount||0),status:p.status,date:p.createdAt?new Date(p.createdAt).toLocaleDateString('en-NG'):'—'})));
    const reports=api.analytics?[{id:'ANALYTICS-30D',type:'Marketplace analytics',subject:'30-day marketplace overview',status:'Available',severity:'Info',date:new Date().toLocaleDateString('en-NG')}]:[];
    const approvedSellers=sellers.filter(x=>String(x.status).toUpperCase()==='APPROVED').length;
    const pendingSellers=sellers.filter(x=>String(x.status).toUpperCase()==='PENDING').length;
    const approvedProducts=products.filter(x=>['APPROVED','PUBLISHED','OUT_OF_STOCK'].includes(String(x.status).toUpperCase())).length;
    const pendingProducts=products.filter(x=>String(x.status||x.approvalStatus).toUpperCase()==='PENDING_APPROVAL').length;
    const failed=api.failedSections||[];
    return {users,sellers,products,orders,transactions,reports,tickets,payouts,announcements:api.announcements||[],auditLogs:api.auditLogs||[],settings:api.settings||{},totalUsers:Number(stats.users??users.length),totalOrders:Number(stats.orders??orders.length),approvedSellers:failed.includes('Sellers')?Math.max(0,Number(stats.sellers||0)-Number(stats.pendingSellers||0)):approvedSellers,pendingSellers:Number(stats.pendingSellers??pendingSellers),approvedProducts:failed.includes('Products')?Math.max(0,Number(stats.products||0)-Number(stats.pendingProducts||0)):approvedProducts,pendingProducts:Number(stats.pendingProducts??pendingProducts),outOfStock:products.filter(x=>Number(x.stock||0)<=0).length,totalMarketplaceSales:Number(stats.grossSales||0),totalCommission:Number(stats.commission||0),totalSellerEarnings:Number(stats.sellerEarnings||0),pendingWithdrawals:payouts.filter(p=>['PENDING','PROCESSING'].includes(String(p.status).toUpperCase())).reduce((n,p)=>n+Number(p.amount||0),0),sellerAvailableBalances:0,completedOrders:orders.filter(x=>x.orderStatus==='DELIVERED').length,pendingOrders:orders.filter(x=>!['DELIVERED','CANCELLED','REFUNDED'].includes(x.orderStatus)).length,cancelledOrders:orders.filter(x=>x.orderStatus==='CANCELLED').length,sellerPerformance:[],activityDays:[]};
  }

  const users = LS.get('users', []);
  const sellers = LS.get('sellers', []);
  const products = LS.get('products', []);
  const orders = LS.get('orders', []);
  const transactions = LS.get('transactions', []);
  const reports = LS.get('reports', []);
  const tickets = LS.get('tickets', []);
  const settings = LS.get('marketplaceSettings', {commission:15});
  const commissionRate = Math.max(0, Math.min(100, Number(settings.commission ?? 15))) / 100;

  const approvedSellers = sellers.filter(s => s.status === 'approved').length;
  const pendingSellers = sellers.filter(s => ['pending','under_review','Under Review'].includes(s.status) || ['Pending','Under Review'].includes(s.verificationStatus)).length;
  const activeUsers = users.filter(u => !['Suspended','Blocked','Deactivated'].includes(u.status)).length;
  const suspendedUsers = users.filter(u => ['Suspended','Blocked','Deactivated'].includes(u.status)).length;
  const approvedProducts = products.filter(p => ['approved','Published','Approved','Out of Stock'].includes(p.approvalStatus || p.status)).length;
  const pendingProducts = products.filter(p => ['pending','Pending Approval','Under Review'].includes(p.approvalStatus || p.status)).length;
  const outOfStock = products.filter(p => Number(p.stock || 0) <= 0).length;
  const eligibleOrders = orders.filter(o => ['Successful','Paid','Completed'].includes(o.paymentStatus) || ['Delivered','Completed'].includes(o.orderStatus || o.status));
  const totalMarketplaceSales = eligibleOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const totalCommission = eligibleOrders.reduce((sum, order) => sum + (Number.isFinite(Number(order.commissionAmount)) ? Number(order.commissionAmount) : (Number(order.total)||0) * commissionRate), 0);
  const totalSellerEarnings = eligibleOrders.reduce((sum, order) => { const gross=Number(order.total)||0; const commission=Number.isFinite(Number(order.commissionAmount)) ? Number(order.commissionAmount) : gross*commissionRate; return sum + (Number.isFinite(Number(order.sellerEarnings)) ? Number(order.sellerEarnings) : Math.max(0,gross-commission)); }, 0);
  const completedOrders = orders.filter(o => ['Delivered','Completed'].includes(o.orderStatus || o.status)).length;
  const pendingOrders = orders.filter(o => !['Delivered','Completed','Cancelled','Canceled','Refunded'].includes(o.orderStatus || o.status)).length;
  const cancelledOrders = orders.filter(o => ['Cancelled','Canceled'].includes(o.orderStatus || o.status)).length;

  const sellerPerformance = sellers.map(s => {
    const sellerOrders = eligibleOrders.filter(o => o.sellerId === s.id);
    const gross = sellerOrders.reduce((n,o)=>n + (Number(o.total)||0), 0);
    const commission = sellerOrders.reduce((n,o)=>n + (Number.isFinite(Number(o.commissionAmount)) ? Number(o.commissionAmount) : (Number(o.total)||0)*commissionRate), 0);
    return {...s, computedOrders:sellerOrders.length, computedSales:gross, computedCommission:commission, computedEarnings:Math.max(0,gross-commission)};
  });

  let pendingWithdrawals = 0;
  let sellerAvailableBalances = 0;
  sellerPerformance.forEach(s => {
    try {
      const payout = JSON.parse(localStorage.getItem('anilyfe_seller_payouts_' + s.id) || 'null');
      if(payout){
        sellerAvailableBalances += Number(payout.availableBalance)||0;
        pendingWithdrawals += (payout.history || []).filter(x=>['Processing','Pending'].includes(x.status)).reduce((n,x)=>n+(Number(x.amount)||0),0);
      }
    } catch(e){}
  });

  const recentActivities = [];
  users.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,5).forEach(u=>recentActivities.push({date:u.createdAt||0, label:'New user account created', detail:u.name || u.email || 'User', view:'users'}));
  sellers.slice().sort((a,b)=>(new Date(b.createdAt||0).getTime())-(new Date(a.createdAt||0).getTime())).slice(0,5).forEach(x=>recentActivities.push({date:new Date(x.createdAt||0).getTime(), label:'Seller application received', detail:x.businessName || x.id, view:'sellers'}));
  products.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5).forEach(x=>recentActivities.push({date:new Date(x.createdAt||0).getTime(), label:'Product listing created', detail:x.name || x.id, view:'products'}));
  orders.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5).forEach(x=>recentActivities.push({date:new Date(x.createdAt||0).getTime(), label:'Marketplace order recorded', detail:x.id, view:'orders'}));
  recentActivities.sort((a,b)=>b.date-a.date);

  const activityDays = Array.from({length:7}, (_,i)=>{
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(6-i));
    const next = new Date(d); next.setDate(next.getDate()+1);
    const dayOrders = eligibleOrders.filter(o=>{const t=new Date(o.createdAt||0); return t>=d && t<next;});
    return {label:d.toLocaleDateString('en-NG',{weekday:'short'}), orders:dayOrders.length, sales:dayOrders.reduce((n,o)=>n+(Number(o.total)||0),0)};
  });

  return {
    users, sellers, products, orders, transactions, reports, tickets, settings, commissionRate,
    approvedSellers, pendingSellers, activeUsers, suspendedUsers,
    approvedProducts, pendingProducts, outOfStock,
    totalMarketplaceSales, totalCommission, totalSellerEarnings, sellerAvailableBalances, pendingWithdrawals,
    completedOrders, pendingOrders, cancelledOrders, sellerPerformance, recentActivities, activityDays
  };
}

function adminMatchesSearch(value, text){
  if(!adminSearch) return true;
  return String(value || '').toLowerCase().includes(adminSearch.toLowerCase()) || String(text || '').toLowerCase().includes(adminSearch.toLowerCase());
}

function adminSplash(label){
  return `
    <div class="relative mb-7 h-28 overflow-hidden rounded-3xl border border-[#D0E3FF] bg-[#081F5C] md:h-32">
      <img src="assets/images/admin.png" width="1400" height="208" alt="" class="h-full w-full object-cover opacity-90" onerror="this.remove()">
      <div class="absolute inset-0 bg-gradient-to-r from-[#071B52]/85 via-[#071B52]/35 to-transparent"></div>
      <div class="absolute inset-0 flex flex-col justify-center px-5">
        <div class="font-tech text-[10px] font-bold uppercase tracking-[.3em] text-[#d2bce0]">Control room</div>
        <div class="font-display text-xl font-extrabold text-white md:text-2xl">${esc(label || 'Admin')}</div>
      </div>
    </div>`;
}

function viewAdminDash(){
  const a = currentAdmin();
  if(!a){ location.hash='#/admin-login'; return ''; }

  const metrics = getAdminMetrics();
  const adminState=window.ANILyfeAPI?.state?.admin;
  const adminLoadFailures=adminState?.failedSections?.length?adminState.failedSections:(adminState?.error?['Some administrator sections']:[]);
  if(!Array.isArray(metrics.recentActivities)){
    const activities=(records,label,detail,view)=>records.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5).map(item=>({date:item.createdAt||0,label,detail:item[detail]||item.id,view}));
    metrics.recentActivities=[
      ...activities(metrics.users,'New user account created','name','users'),
      ...activities(metrics.sellers,'Seller application received','businessName','sellers'),
      ...activities(metrics.products,'Product listing created','name','products'),
      ...activities(metrics.orders,'Marketplace order recorded','id','orders')
    ].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  }
  const users = metrics.users.filter(u => adminMatchesSearch(u.id, `${u.name} ${u.email} ${u.status}`));
  const sellers = metrics.sellers.filter(s => adminMatchesSearch(s.id, `${s.businessName} ${s.status} ${s.sells}`));
  const products = metrics.products.filter(p => adminMatchesSearch(p.id, `${p.name} ${p.category} ${p.status} ${p.sellerId}`));
  const orders = metrics.orders.filter(o => adminMatchesSearch(o.id, `${o.buyer} ${o.seller} ${o.product} ${o.status} ${o.sellerId}`));
  const transactions = metrics.transactions.filter(t => adminMatchesSearch(t.id, `${t.buyer} ${t.seller} ${t.status}`));
  const reports = metrics.reports.filter(r => adminMatchesSearch(r.id, `${r.type} ${r.subject} ${r.status}`));
  const tickets = metrics.tickets.filter(t => adminMatchesSearch(t.id, `${t.customer} ${t.category} ${t.topic} ${t.status}`));
  const topSellers = [...sellers]
    .filter(s => s.status === 'approved')
    .sort((a, b) => (Number(b.sales) || 0) - (Number(a.sales) || 0) || (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, 5);

  const isSuperAdmin=a.role==='SUPER_ADMIN';
  const applications=window.ANILyfeAPI?.state?.admin?.applications||[];
  const nav = ADMIN_VIEW_TYPES.filter(item=>(item.k!=='admin-applications'&&item.k!=='admin-management')||isSuperAdmin).map(item => ({...item, badge: item.k === 'sellers' ? metrics.pendingSellers : item.k === 'products' ? metrics.pendingProducts : item.k === 'admin-applications' ? applications.filter(x=>x.status==='PENDING').length : 0 }));
  if(!nav.some(item=>item.k===adminView))adminView='dashboard';
  const selected = nav.find(n => n.k === adminView) || nav[0];

  let body = '';

  if(adminView === 'dashboard') {
    const statData = [
      ['users', 'Total Users', metrics.totalUsers??metrics.users.length, 'users'],
      ['store', 'Active Sellers', metrics.approvedSellers, 'sellers'],
      ['package', 'Published Products', metrics.approvedProducts, 'products'],
      ['shopping-bag', 'Total Orders', metrics.totalOrders??metrics.orders.length, 'orders'],
      ['banknote', 'Marketplace Sales', fmt(metrics.totalMarketplaceSales), 'orders'],
      ['wallet', 'Anilyfe Commission', fmt(metrics.totalCommission), 'payments'],
      ['coins', 'Seller Earnings', fmt(metrics.totalSellerEarnings), 'sellers'],
      ['clock-3', 'Pending Withdrawals', fmt(metrics.pendingWithdrawals), 'payments']
    ];
    const maxActivity = Math.max(1, ...metrics.activityDays.map(x=>x.orders));
    body = `
      <div class="relative mb-7 h-40 overflow-hidden rounded-3xl border border-[#D0E3FF] bg-[#081F5C] md:h-52"><img src="assets/images/admin.png" width="1400" height="208" alt="" class="h-full w-full object-cover opacity-90" loading="eager" onerror="this.remove()"><div class="absolute inset-0 bg-gradient-to-r from-[#071B52]/85 via-[#071B52]/30 to-transparent"></div><div class="absolute bottom-4 left-5"><div class="font-tech text-[10px] font-bold uppercase tracking-[.3em] text-[#d2bce0]">CONTROL ROOM</div><div class="font-display text-xl font-extrabold text-white md:text-2xl">Marketplace command centre</div></div></div>
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        ${statData.map((x, idx) => `
          <button class="card p-5 reveal text-left hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-[#334EAC]" data-action="admin-view" data-view="${x[3]}" style="transition-delay:${idx * 40}ms">
            <div class="flex items-center justify-between mb-3"><span class="w-10 h-10 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="${x[0]}" style="width:18px;height:18px;color:#334EAC"></i></span><i data-lucide="arrow-up-right" style="width:14px;height:14px;color:#94A3B8"></i></div>
            <div class="font-display font-extrabold text-2xl">${x[2]}</div>
            <div class="text-[10px] font-bold uppercase tracking-widest text-[#708BD1] mt-1">${x[1]}</div>
          </button>
        `).join('')}
      </div>

      <div class="card p-5 mb-5 reveal"><div class="flex items-center justify-between"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Admin inbox</div><h3 class="font-display font-bold text-xl mt-1">Recent notifications</h3></div><button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-mark-notifications-read">Mark all read</button></div>${(()=>{const ns=window.ANILyfeAPI?.state?.admin?.notifications||[];return ns.slice(0,8).map(n=>`<button class="w-full text-left mt-3 p-3 rounded-2xl border ${n.read?'border-slate-100':'border-[#D0E3FF] bg-[#F8FAFC]'}" data-action="admin-notification-open" data-id="${n.id}" data-order-id="${n.orderId||''}"><div class="text-xs font-bold">${esc(n.title||'Notification')}</div><div class="text-xs text-slate-500 mt-1">${esc(n.message||'')}</div></button>`).join('')||'<div class="text-sm text-slate-500 mt-4">No notifications yet.</div>';})()}</div>

      <div class="grid xl:grid-cols-[1.3fr_0.7fr] gap-5 mb-5">
        ${metrics.pendingProducts===0&&metrics.pendingSellers===0?'<div class="xl:col-span-2 rounded-2xl border border-dashed border-[#D0E3FF] bg-white px-5 py-4 text-sm text-[#5A6A9C]">No pending products or seller applications.</div>':''}
        <div class="card p-5 reveal">
          <div class="flex items-center justify-between mb-4"><div><h3 class="font-display font-bold text-xl">Marketplace activity</h3><p class="text-[11px] text-slate-500 mt-1">Real completed/paid orders from the last 7 days</p></div><button class="btn btn-ghost !py-1.5 !px-2.5 !text-[10px]" data-action="admin-view" data-view="orders">View orders</button></div>
          ${metrics.orders.length ? `<div class="grid grid-cols-7 gap-2 items-end h-40">${metrics.activityDays.map(x=>`<div class="flex flex-col items-center gap-2 h-full justify-end"><div class="text-[9px] font-bold text-[#708BD1]">${x.orders}</div><div class="w-full max-w-8 rounded-t-xl bg-[#334EAC]" style="height:${Math.max(4,(x.orders/maxActivity)*100)}%"></div><div class="text-[9px] font-bold text-[#708BD1]">${x.label}</div></div>`).join('')}</div>` : `<div class="h-40 flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl">No marketplace activity yet.</div>`}
        </div>

        <div class="card p-5 reveal">
          <div class="flex items-center justify-between mb-4"><h3 class="font-display font-bold text-xl">Admin alerts</h3><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live</span></div>
          <div class="space-y-3">
            <button class="w-full flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] px-3 py-2.5 text-left hover:bg-[#E7F1FF] transition" data-action="admin-view" data-view="sellers"><span class="text-xs font-bold text-[#475569]">New seller applications</span><span class="w-7 h-7 rounded-full bg-[#FFF7E0] text-[#B7791F] flex items-center justify-center text-[10px] font-extrabold">${metrics.pendingSellers}</span></button>
            <button class="w-full flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] px-3 py-2.5 text-left hover:bg-[#E7F1FF] transition" data-action="admin-view" data-view="products"><span class="text-xs font-bold text-[#475569]">Products pending review</span><span class="w-7 h-7 rounded-full bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center text-[10px] font-extrabold">${metrics.pendingProducts}</span></button>
            <button class="w-full flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] px-3 py-2.5 text-left hover:bg-[#E7F1FF] transition" data-action="admin-view" data-view="orders"><span class="text-xs font-bold text-[#475569]">Pending orders</span><span class="w-7 h-7 rounded-full bg-[#FFF7E0] text-[#B7791F] flex items-center justify-center text-[10px] font-extrabold">${metrics.pendingOrders}</span></button>
            <button class="w-full flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] px-3 py-2.5 text-left hover:bg-[#E7F1FF] transition" data-action="admin-view" data-view="payments"><span class="text-xs font-bold text-[#475569]">Pending withdrawals</span><span class="w-7 h-7 rounded-full bg-[#FEF3F2] text-[#B42318] flex items-center justify-center text-[10px] font-extrabold">${metrics.pendingWithdrawals ? fmt(metrics.pendingWithdrawals) : '0'}</span></button>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-5 mb-5">
        <div class="card p-5 reveal">
          <div class="flex items-center justify-between mb-4"><div><h3 class="font-display font-bold text-xl">Seller earnings</h3><p class="text-[11px] text-slate-500 mt-1">Seller earnings are separate from Anilyfe commission</p></div><button class="btn btn-ghost !py-1.5 !px-2.5 !text-[10px]" data-action="admin-view" data-view="sellers">Manage sellers</button></div>
          <div class="grid grid-cols-2 gap-3"><div class="rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] p-4"><div class="text-[10px] uppercase font-bold text-slate-400">Total seller earnings</div><div class="font-display font-extrabold text-xl mt-1">${fmt(metrics.totalSellerEarnings)}</div></div><div class="rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] p-4"><div class="text-[10px] uppercase font-bold text-slate-400">Seller balances</div><div class="font-display font-extrabold text-xl mt-1">${fmt(metrics.sellerAvailableBalances)}</div></div></div>
          ${metrics.sellerPerformance.filter(s=>s.computedEarnings>0).slice().sort((a,b)=>b.computedEarnings-a.computedEarnings).slice(0,4).map(s=>`<button class="w-full flex items-center gap-3 py-3 border-b border-[#E7F1FF] last:border-0 text-left hover:bg-[#F8FAFC]" data-action="admin-view" data-view="sellers"><span class="w-8 h-8 rounded-xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center font-bold">${esc((s.businessName||'S')[0])}</span><span class="flex-1 min-w-0"><span class="block text-xs font-extrabold truncate">${esc(s.businessName||'Seller')}</span><span class="block text-[10px] text-slate-400">${s.computedOrders} paid/completed orders</span></span><span class="font-bold text-xs">${fmt(s.computedEarnings)}</span></button>`).join('') || '<div class="text-sm text-slate-400 mt-4">Seller earnings will appear after successful/completed orders.</div>'}
        </div>

        <div class="card p-5 reveal">
          <div class="flex items-center justify-between mb-4"><h3 class="font-display font-bold text-xl">Recent activity</h3><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Real records</span></div>
          ${metrics.recentActivities.slice(0,6).map(a=>`<button class="w-full flex items-center gap-3 py-3 border-b border-[#E7F1FF] last:border-0 text-left hover:bg-[#F8FAFC]" data-action="admin-view" data-view="${a.view}"><span class="w-8 h-8 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="activity" style="width:14px;height:14px;color:#334EAC"></i></span><span class="flex-1 min-w-0"><span class="block text-xs font-extrabold truncate">${esc(a.label)}</span><span class="block text-[10px] text-slate-400 truncate">${esc(a.detail)}</span></span><span class="text-[10px] text-slate-400">${a.date ? new Date(a.date).toLocaleDateString('en-NG',{day:'numeric',month:'short'}) : '—'}</span></button>`).join('') || '<div class="text-sm text-slate-400">No recent activity yet.</div>'}
        </div>
      </div>

      <div class="card p-5 reveal mb-5">
        <div class="flex items-center justify-between mb-4"><div><h3 class="font-display font-bold text-xl">Top sellers</h3><p class="text-[11px] text-slate-500 mt-1">Ranked by real paid/completed sales</p></div><button class="btn btn-ghost !py-1.5 !px-2.5 !text-[10px]" data-action="admin-view" data-view="sellers">View all</button></div>
        ${metrics.sellerPerformance.filter(s=>s.status==='approved').sort((a,b)=>b.computedSales-a.computedSales).slice(0,5).map((seller,index)=>`<button class="w-full flex items-center gap-3 py-3 border-b border-[#E7F1FF] last:border-0 text-left hover:bg-[#F8FAFC]" data-action="admin-view" data-view="sellers"><span class="w-8 h-8 rounded-xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center font-display font-extrabold text-sm">#${index+1}</span><span class="flex-1 min-w-0"><span class="block text-xs font-extrabold truncate">${esc(seller.businessName || 'Seller')}</span><span class="block text-[10px] text-[#708BD1] font-bold">${seller.computedOrders} paid/completed orders</span></span><span class="text-right"><span class="block font-bold text-xs">${fmt(seller.computedSales)}</span><span class="block text-[10px] text-slate-400">seller gross sales</span></span></button>`).join('') || '<div class="text-sm text-[#708BD1]">No approved sellers are ranking yet.</div>'}
      </div>

      <div class="grid lg:grid-cols-2 gap-5">
        <div class="card p-5 reveal"><div class="flex items-center justify-between mb-4"><h3 class="font-display font-bold text-xl">Recent seller applications</h3><button class="btn btn-ghost !py-1.5 !px-2.5 !text-[10px]" data-action="admin-view" data-view="sellers">Open</button></div>${sellers.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,4).map(s=>`<button class="w-full flex items-center gap-3 py-2.5 border-b border-[#E7F1FF] last:border-0 text-left hover:bg-[#F8FAFC]" data-action="admin-view" data-view="sellers"><span class="w-9 h-9 rounded-xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center font-bold text-sm">${esc((s.businessName||'S')[0])}</span><span class="flex-1 min-w-0"><span class="block text-xs font-extrabold truncate">${esc(s.businessName||'Seller')}</span><span class="block text-[10px] text-[#708BD1] font-bold">${esc(s.status||'pending')}</span></span><span class="badge ${s.status==='approved'?'!bg-[#E6F7EC] !text-[#1F9D55]':'!bg-[#FFF7E0] !text-[#B7791F]'}">${esc(s.status||'pending')}</span></button>`).join('') || '<div class="text-sm text-[#708BD1]">No seller applications yet.</div>'}</div>
        <div class="card p-5 reveal"><div class="flex items-center justify-between mb-4"><h3 class="font-display font-bold text-xl">Inventory health</h3><button class="btn btn-ghost !py-1.5 !px-2.5 !text-[10px]" data-action="admin-view" data-view="products">Open products</button></div>${Object.keys(CATS).slice(0,5).map(cat=>{const n=products.filter(p=>p.category===cat).length; const high=Math.max(1,products.length||1); return `<div class="mb-3"><div class="flex justify-between text-[11px] font-bold mb-1"><span>${esc(cat)}</span><span class="text-[#708BD1]">${n}</span></div><div class="h-2 rounded-full bg-[#E7F1FF] overflow-hidden"><div class="h-full rounded-full bg-[#334EAC]" style="width:${Math.min(100,(n/high)*100)}%"></div></div></div>`}).join('') || '<div class="text-sm text-slate-400">No products yet.</div>'}</div>
      </div>
    `;
  }

  if(adminView === 'users') {
    const buyerUsers=users.filter(u=>String(u.role||'').toUpperCase()==='BUYER');
    const displayedUsers=buyerUsers.filter(u=>adminUserTab==='suspended'?String(u.status).toUpperCase()==='SUSPENDED':String(u.status).toUpperCase()!=='SUSPENDED');
    body = `
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between gap-3 flex-wrap">
          <h3 class="font-display font-bold text-xl">User management</h3>
          <div class="flex items-center gap-2"><button class="btn ${adminUserTab==='active'?'btn-primary':'btn-ghost'} !py-1.5 !text-xs" data-action="admin-user-tab" data-tab="active">Buyers (${buyerUsers.filter(u=>String(u.status).toUpperCase()!=='SUSPENDED').length})</button><button class="btn ${adminUserTab==='suspended'?'btn-primary':'btn-ghost'} !py-1.5 !text-xs" data-action="admin-user-tab" data-tab="suspended">Suspended buyers (${buyerUsers.filter(u=>String(u.status).toUpperCase()==='SUSPENDED').length})</button></div>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl w-full min-w-[900px]">
            <thead><tr><th>Name</th><th>Email / Phone</th><th>Location</th><th>Status</th><th>Role</th><th>Joined</th><th class="!text-right">Actions</th></tr></thead>
            <tbody>
              ${displayedUsers.map(u => `
                <tr>
                  <td><div class="flex items-center gap-2">${u.profileImageUrl?`<img class="w-8 h-8 rounded-full object-cover" src="${esc(u.profileImageUrl)}" alt="">`:`<span class="w-8 h-8 rounded-full bg-[#E7F1FF] text-[#334EAC] inline-flex items-center justify-center font-bold">${esc((u.name||'U')[0])}</span>`}<div class="font-extrabold text-xs">${esc(u.name || 'User')}</div></div></td>
                  <td class="text-xs text-[#475569]">${esc(u.email || '—')}<div class="text-[10px] text-slate-400">${esc(u.phone||'—')}</div></td>
                  <td class="text-xs text-[#475569]">${esc([u.city,u.state].filter(Boolean).join(', ')||'—')}</td>
                  <td><span class="badge ${String(u.status).toUpperCase() === 'ACTIVE' ? '!bg-[#E6F7EC] !text-[#1F9D55]' : '!bg-[#FEF3F2] !text-[#B42318]'}">${esc(u.status || 'ACTIVE')}</span></td>
                  <td class="text-xs font-bold text-[#708BD1] capitalize">${esc(u.role || 'buyer')}</td>
                  <td class="text-xs text-[#475569]">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td><div class="flex justify-end gap-2"><button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-user-view" data-id="${u.id}">View</button><button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-user-status" data-id="${u.id}" data-status="${String(u.status).toUpperCase() === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}">${String(u.status).toUpperCase() === 'ACTIVE' ? 'Suspend' : 'Restore'}</button></div></td>
                </tr>
              `).join('') || '<tr><td colspan="7" class="text-center text-sm text-[#708BD1] py-5">No users found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if(adminView === 'admin-applications') {
    const applicationError=window.ANILyfeAPI?.state?.admin?.applicationError;
    body=`
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF]"><h3 class="font-display font-bold text-xl">Administrator applications</h3><p class="mt-1 text-xs text-slate-500">Only super administrators can approve applications and assign roles.</p></div>
        ${applicationError?`<div class="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">${esc(applicationError.message||'Could not load admin applications.')}</div>`:''}
        <div class="overflow-x-auto"><table class="tbl w-full min-w-[760px]"><thead><tr><th>Applicant</th><th>Email</th><th>Submitted</th><th>Status / role</th><th class="!text-right">Review</th></tr></thead><tbody>
          ${applications.map(app=>`<tr><td class="text-xs font-bold">${esc(`${app.user?.firstName||''} ${app.user?.lastName||''}`.trim()||'Applicant')}</td><td class="text-xs">${esc(app.user?.email||'—')}</td><td class="text-xs">${app.createdAt?new Date(app.createdAt).toLocaleString('en-NG'):'—'}</td><td><span class="badge ${app.status==='APPROVED'?'!bg-[#E6F7EC] !text-[#1F9D55]':app.status==='REJECTED'?'!bg-[#FEF3F2] !text-[#B42318]':'!bg-[#FFF7E0] !text-[#B7791F]'}">${esc(app.status)}${app.assignedRole?` · ${esc(app.assignedRole)}`:''}</span></td><td><div class="flex justify-end items-center gap-2">${app.status==='PENDING'?`<select class="inp !w-auto !py-1.5 !text-xs" id="admin-role-${esc(app.id)}" aria-label="Role to assign to ${esc(app.user?.email||'applicant')}"><option value="ADMIN">Administrator</option><option value="SUPER_ADMIN">Super administrator</option></select><button class="btn btn-primary !py-1.5 !px-2 !text-[10px]" data-action="admin-application-review" data-id="${esc(app.id)}" data-decision="APPROVE">Approve</button><button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-application-review" data-id="${esc(app.id)}" data-decision="REJECT">Reject</button>`:'—'}</div></td></tr>`).join('')||`<tr><td colspan="5" class="py-8 text-center text-sm text-slate-500">No administrator applications yet.</td></tr>`}
        </tbody></table></div>
      </div>`;
  }

  if(adminView === 'admin-management') {
    const admins=window.ANILyfeAPI?.state?.admin?.management||[];
    body=`<div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-5"><section class="card p-5"><h3 class="font-display font-bold text-xl">Add administrator</h3><p class="text-xs text-slate-500 mt-1">Assign access only to an existing verified Anilyfe account.</p><form id="adminManagementForm" class="mt-4 space-y-3"><div><label class="lbl">Account email</label><input class="inp" type="email" name="email" required></div><div><label class="lbl">Role</label><select class="inp" name="role"><option value="ADMIN">Administrator</option><option value="SUPER_ADMIN">Super administrator</option></select></div><button class="btn btn-primary w-full" type="submit">Grant access</button></form></section><section class="card overflow-hidden"><div class="p-5 border-b border-[#E7F1FF]"><h3 class="font-display font-bold text-xl">Administrator accounts</h3></div><div class="divide-y divide-slate-100">${admins.map(a=>`<div class="p-4 flex items-center justify-between gap-3"><div><div class="font-bold text-sm">${esc(`${a.firstName||''} ${a.lastName||''}`.trim()||a.email)}</div><div class="text-xs text-slate-500">${esc(a.email)} · ${esc(a.role)}</div></div>${a.id!==window.currentUser?.()?.id?`<button class="btn btn-ghost !py-1.5 !text-xs" data-action="admin-remove-admin" data-id="${esc(a.id)}">Remove access</button>`:'<span class="badge">You</span>'}</div>`).join('')||'<p class="p-5 text-sm text-slate-500">No administrator accounts found.</p>'}</div></section></div>`;
  }

  if(adminView === 'sellers') {
    const displayedSellers=sellers.filter(s=>adminSellerTab==='pending'?String(s.status).toUpperCase()==='PENDING':adminSellerTab==='suspended'?String(s.status).toUpperCase()==='SUSPENDED':adminSellerTab==='founding'?!!s.foundingSellerActive: true);
    body = `
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between gap-3 flex-wrap">
          <h3 class="font-display font-bold text-xl">Seller management</h3>
          <div class="flex flex-wrap gap-2">${[['all','All Sellers'],['pending','Pending Approval'],['suspended','Suspended'],['founding','Founding Sellers']].map(([key,label])=>`<button class="btn ${adminSellerTab===key?'btn-primary':'btn-ghost'} !py-1.5 !text-xs" data-action="admin-seller-tab" data-tab="${key}">${label}</button>`).join('')}</div>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl w-full min-w-[960px]">
            <thead><tr><th>Store / Owner</th><th>Category</th><th>Verification</th><th>Commission</th><th>Status</th><th class="!text-right">Actions</th></tr></thead>
            <tbody>
              ${displayedSellers.map(s => `
                <tr>
                  <td><div class="flex items-center gap-3"><span class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#081F5C] to-[#334EAC] text-white flex items-center justify-center font-bold text-sm shrink-0">${esc((s.businessName || 'S')[0])}</span><div><div class="font-extrabold text-xs">${esc(s.businessName || 'Seller')}</div><div class="text-[10px] text-[#708BD1] font-bold">${esc(`${s.user?.firstName||''} ${s.user?.lastName||''}`.trim()||s.user?.email||'Owner unavailable')}</div></div></div></td>
                  <td class="text-xs text-[#475569]">${esc(s.category||s.sells||'Marketplace seller')}</td>
                  <td class="text-xs">${esc(s.verificationStatus||s.verification?.status||'not started')}</td>
                  <td class="text-xs font-bold">${Number(s.commissionRate??15).toFixed(2)}%</td>
                  <td><span class="badge ${s.status === 'approved' ? '!bg-[#E6F7EC] !text-[#1F9D55]' : s.status === 'pending' ? '!bg-[#FFF7E0] !text-[#B7791F]' : '!bg-[#FEF3F2] !text-[#B42318]'}">${esc(s.status || 'pending')}${s.foundingSellerActive?' · Founding':''}</span></td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-seller-view" data-id="${s.id}">View</button>
                      ${s.status !== 'approved' ? `<button class="btn btn-primary !py-1.5 !px-2 !text-[10px]" data-action="admin-seller-status" data-id="${s.id}" data-status="approved">Approve</button><button class="btn btn-danger !py-1.5 !px-2 !text-[10px]" data-action="admin-seller-status" data-id="${s.id}" data-status="rejected">Reject</button>` : ''}
                      <button class="btn btn-danger !py-1.5 !px-2 !text-[10px]" data-action="admin-seller-status" data-id="${s.id}" data-status="suspended">Suspend</button>
                    </div>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center text-sm text-slate-500 py-5">No sellers in this view.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if(adminView === 'products') {
    body = `
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between">
          <h3 class="font-display font-bold text-xl">Product moderation</h3>
          <span class="badge !bg-[#E7F1FF] !text-[#334EAC]">${metrics.pendingProducts} pending</span>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl w-full min-w-[920px]">
            <thead><tr><th>Product</th><th>Seller</th><th>Category</th><th>Status</th><th>Stock</th><th class="!text-right">Actions</th></tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="${CATS[catKey(p.category)]?.icon || 'package'}" style="width:16px;height:16px;color:#334EAC"></i></div><div><div class="font-extrabold text-xs">${esc(p.name)}</div><div class="text-[10px] text-[#708BD1] font-bold">${esc(p.id)}</div></div></div></td>
                  <td class="text-xs text-[#475569]">${esc((metrics.sellers.find(s => s.id === p.sellerId) || {}).businessName || 'Unknown')}</td>
                  <td class="text-xs font-bold text-[#708BD1]">${esc(p.category)}</td>
                  <td><span class="badge ${['approved','Published','Approved'].includes(p.approvalStatus || p.status) ? '!bg-[#E6F7EC] !text-[#1F9D55]' : ['pending','Pending Approval','Under Review'].includes(p.approvalStatus || p.status) ? '!bg-[#FFF7E0] !text-[#B7791F]' : '!bg-[#FEF3F2] !text-[#B42318]'}">${esc(p.approvalStatus || p.status || 'pending')}</span></td>
                  <td class="text-xs font-bold ${p.stock <= 0 ? 'text-[#B42318]' : 'text-[#475569]'}">${p.stock}</td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-product-preview" data-id="${p.id}">View</button>
                      ${['Published','Approved','Out of Stock'].includes(p.approvalStatus || p.status) ? `<button class="btn btn-danger !py-1.5 !px-2 !text-[10px]" data-action="admin-product-action" data-id="${p.id}" data-status="rejected">Reject</button>` : `<button class="btn btn-primary !py-1.5 !px-2 !text-[10px]" data-action="admin-product-action" data-id="${p.id}" data-status="approved">Approve & Publish</button><button class="btn btn-danger !py-1.5 !px-2 !text-[10px]" data-action="admin-product-action" data-id="${p.id}" data-status="rejected">Reject</button>`}
                    </div>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center text-sm text-[#708BD1] py-5">No products found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if(adminView === 'orders') {
    body = `
      <div class="card overflow-hidden reveal"><div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between"><div><h3 class="font-display font-bold text-xl">Order management</h3><p class="text-xs text-slate-500 mt-1">Read-only marketplace visibility. Sellers control fulfillment status.</p></div><span class="badge !bg-[#E7F1FF] !text-[#334EAC]">${orders.length} records</span></div>
      <div class="overflow-x-auto"><table class="tbl w-full min-w-[1100px]"><thead><tr><th>Order ID</th><th>Seller</th><th>Buyer</th><th>Product(s)</th><th>Status</th><th>Total</th><th>Country / State</th><th>Date</th><th>Actions</th></tr></thead><tbody>
      ${orders.map(o=>{const st=o.orderStatus||o.status||'New';const seller=metrics.sellers.find(x=>x.id===o.sellerId);const loc=o.deliveryLocation||o.buyer||{};const names=(o.items||[]).map(i=>i.productName).join(', ');return `<tr><td class="font-tech text-xs font-bold text-[#334EAC]">${esc(o.id)}</td><td class="text-xs font-bold">${esc(o.sellerName||seller?.businessName||'Seller')}</td><td class="text-xs">${esc(o.buyer?.name||o.buyer||'Buyer')}</td><td class="text-xs max-w-[220px] truncate">${esc(names||o.product||'—')}</td><td><span class="badge">${esc(st)}</span></td><td class="font-extrabold text-xs">${fmt(o.total||0)}</td><td class="text-xs">${esc(loc.country||o.country||'Nigeria')} · ${esc(loc.state||'')}</td><td class="text-xs">${o.createdAt?new Date(o.createdAt).toLocaleDateString('en-NG'):'—'}</td><td><button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-order-view" data-id="${o.id}">View</button></td></tr>`;}).join('')||'<tr><td colspan="9" class="text-center text-sm text-[#708BD1] py-5">No orders to display.</td></tr>'}
      </tbody></table></div></div>`;
  }

  if(adminView === 'payments') {
    body = `
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between">
          <h3 class="font-display font-bold text-xl">Payments & payouts</h3>
          <span class="badge !bg-[#E6F7EC] !text-[#1F9D55]">${transactions.filter(t => t.status === 'Successful').length} successful</span>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl w-full min-w-[840px]">
            <thead><tr><th>Transaction</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${transactions.map(tx => `
                <tr>
                  <td class="font-tech text-xs font-bold text-[#334EAC]">${esc(tx.id)}</td>
                  <td class="text-xs text-[#475569]">${esc(tx.buyer)}</td>
                  <td class="text-xs text-[#475569]">${esc(tx.seller)}</td>
                  <td class="font-extrabold text-xs">${fmt(tx.amount || 0)}</td>
                  <td><span class="badge ${tx.status === 'Successful' ? '!bg-[#E6F7EC] !text-[#1F9D55]' : '!bg-[#FEF3F2] !text-[#B42318]'}">${esc(tx.status)}</span></td>
                  <td class="text-xs text-[#475569]">${esc(tx.date)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center text-sm text-[#708BD1] py-5">No transactions found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if(adminView === 'reports') {
    body = `
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between">
          <h3 class="font-display font-bold text-xl">Marketplace reports</h3>
          <span class="badge !bg-[#FEF3F2] !text-[#B42318]">${reports.length} active</span>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl w-full min-w-[760px]">
            <thead><tr><th>ID</th><th>Type</th><th>Subject</th><th>Status</th><th>Severity</th><th>Date</th></tr></thead>
            <tbody>
              ${reports.map(r => `
                <tr>
                  <td class="font-tech text-xs font-bold text-[#334EAC]">${esc(r.id)}</td>
                  <td class="text-xs font-bold text-[#708BD1]">${esc(r.type)}</td>
                  <td class="text-xs text-[#475569]">${esc(r.subject)}</td>
                  <td><span class="badge ${r.status === 'Resolved' ? '!bg-[#E6F7EC] !text-[#1F9D55]' : '!bg-[#FFF7E0] !text-[#B7791F]'}">${esc(r.status)}</span></td>
                  <td class="text-xs font-bold ${r.severity === 'High' ? 'text-[#B42318]' : 'text-[#B7791F]'}">${esc(r.severity)}</td>
                  <td class="text-xs text-[#475569]">${esc(r.date)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center text-sm text-[#708BD1] py-5">No reports found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if(adminView === 'support') {
    body = `
      <div class="card overflow-hidden reveal">
        <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between">
          <h3 class="font-display font-bold text-xl">Support center</h3>
          <span class="badge !bg-[#E7F1FF] !text-[#334EAC]">${tickets.length} tickets</span>
        </div>
        <div class="overflow-x-auto">
          <table class="tbl w-full min-w-[820px]">
            <thead><tr><th>ID</th><th>Customer</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              ${tickets.map(ticket => `
                <tr>
                  <td class="font-tech text-xs font-bold text-[#334EAC]">${esc(ticket.id)}</td>
                  <td class="text-xs text-[#475569]">${esc(ticket.customer)}</td>
                  <td class="text-xs font-bold text-[#708BD1]">${esc(ticket.category)}</td>
                  <td><span class="badge ${ticket.priority === 'High' ? '!bg-[#FEF3F2] !text-[#B42318]' : '!bg-[#FFF7E0] !text-[#B7791F]'}">${esc(ticket.priority)}</span></td>
                  <td><span class="badge ${ticket.status === 'Open' ? '!bg-[#E7F1FF] !text-[#334EAC]' : '!bg-[#E6F7EC] !text-[#1F9D55]'}">${esc(ticket.status)}</span></td>
                  <td class="text-xs text-[#475569]">${esc(ticket.date)}</td>
                  <td><button class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" data-action="admin-ticket-view" data-id="${ticket.id}">View</button>${ticket.email?`<a class="btn btn-ghost !py-1.5 !px-2 !text-[10px]" href="mailto:${esc(ticket.email)}">Email</a>`:''}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center text-sm text-[#708BD1] py-5">No support tickets found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if(adminView === 'announcements') {
    const announcements=window.ANILyfeAPI?.state?.admin?.announcements||[];
    body=`<div class="grid lg:grid-cols-[1fr_1.2fr] gap-5"><div class="card p-5"><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Broadcast</div><h3 class="font-display font-bold text-xl mt-1">Publish announcement</h3><p class="text-xs text-slate-500 mt-1">Text, image and optional link.</p><form id="adminAnnouncementForm" class="space-y-3 mt-5"><div><label class="lbl">Message *</label><textarea class="inp min-h-[100px]" name="text" required></textarea></div><div><label class="lbl">Image</label><input class="inp" type="file" name="image" accept="image/*"></div><div><label class="lbl">Link</label><input class="inp" type="url" name="link" placeholder="https://..."></div><button class="btn btn-primary w-full">Publish announcement</button></form></div><div class="card p-5"><h3 class="font-display font-bold text-xl mb-4">Announcements</h3>${announcements.length?announcements.map(a=>`<div class="p-4 rounded-2xl border border-[#E7F1FF] mb-3"><div class="flex gap-3">${a.image?`<img src="${a.image}" class="w-14 h-14 rounded-xl object-cover" alt="">`:''}<div class="flex-1"><div class="text-sm font-bold">${esc(a.text)}</div>${a.link?`<a href="${esc(a.link)}" target="_blank" rel="noopener" class="text-xs text-[#334EAC] break-all">${esc(a.link)}</a>`:''}</div><button class="btn btn-danger !py-1.5 !px-2 !text-[10px]" data-action="admin-announcement-delete" data-id="${a.id}">Delete</button></div></div>`).join(''):'<div class="text-sm text-slate-500 text-center py-8">No announcements to display.</div>'}</div></div>`;
  }

  if(adminView === 'audit-logs') {
    const logs=window.ANILyfeAPI?.state?.admin?.auditLogs||[];
    body=`<div class="card overflow-hidden reveal"><div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between"><div><h3 class="font-display font-bold text-xl">Audit logs</h3><p class="text-xs text-slate-500 mt-1">Authoritative administrator and seller operations recorded by the backend.</p></div><span class="badge !bg-[#E7F1FF] !text-[#334EAC]">${logs.length} records</span></div><div class="overflow-x-auto"><table class="tbl w-full min-w-[900px]"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Actor</th><th>Metadata</th></tr></thead><tbody>${logs.map(l=>`<tr><td class="text-xs">${l.createdAt?new Date(l.createdAt).toLocaleString('en-NG'):'—'}</td><td class="text-xs font-bold text-[#334EAC]">${esc(l.action||'—')}</td><td class="text-xs">${esc(l.targetType||'—')} ${l.targetId?`· ${esc(l.targetId)}`:''}</td><td class="text-xs">${esc(l.actorUserId||'System')}</td><td class="text-xs max-w-[360px] truncate">${esc(JSON.stringify(l.metadata||{}))}</td></tr>`).join('')||'<tr><td colspan="5" class="text-center text-sm text-[#708BD1] py-8">No audit logs to display.</td></tr>'}</tbody></table></div></div>`;
  }

  if(adminView === 'settings') {
    const settings = window.ANILyfeAPI?.state?.admin?.settings || { marketplaceName:'Anilyfe', commissionRate:15, maintenanceMode:false };
    body = `
      <div class="grid lg:grid-cols-2 gap-5">
        <div class="card p-5 reveal">
          <h3 class="font-display font-bold text-xl mb-4">Marketplace settings</h3>
          <div class="space-y-4">
            <div><label class="lbl">Marketplace name</label><input class="inp" id="admin-market-name" value="${esc(settings.marketplaceName || 'Anilyfe')}" /></div>
            <div><label class="lbl">Support email</label><input class="inp" id="admin-market-email" value="${esc(settings.supportEmail || 'myanilyfe@gmail.com')}" /></div><div><label class="lbl">Admin notification email</label><input class="inp" id="admin-admin-email" type="email" value="${esc(settings.adminEmail || '')}" placeholder="admin@anilyfe.com" /></div><div><label class="lbl">Telegram</label><input class="inp" id="admin-telegram" value="${esc(settings.telegram || '')}" placeholder="https://t.me/Anilyfe" /></div>
            <div><label class="lbl">Commission (%)</label><input class="inp" id="admin-market-commission" type="number" min="0" max="100" value="${settings.commissionRate ?? settings.commission ?? 15}" /></div>
          </div>
          <div class="mt-5 flex justify-end">
            <button class="btn btn-primary" data-action="admin-save-settings">Save settings</button>
          </div>
        </div>

        <div class="card p-5 reveal">
          <h3 class="font-display font-bold text-xl mb-4">System toggles</h3>
          <div class="space-y-3">
            ${[
              ['Seller registration', 'sellerRegistrationEnabled', settings.sellerRegistrationEnabled !== false],
              ['Review system', 'reviewSystemEnabled', settings.reviewSystemEnabled !== false],
              ['Maintenance mode', 'maintenanceMode', !!settings.maintenanceMode]
            ].map(([label, key, enabled]) => `
              <div class="flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E7F1FF] px-3 py-2.5">
                <span class="text-sm font-bold text-[#475569]">${label}</span>
                <button class="btn btn-ghost !py-1.5 !px-2 !text-[10px] ${enabled ? '!bg-[#E6F7EC] !text-[#1F9D55]' : '!bg-[#FEF3F2] !text-[#B42318]'}" data-action="admin-setting-toggle" data-key="${key}" data-enabled="${enabled}">${enabled ? 'Enabled' : 'Disabled'}</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="min-h-screen bg-[#F6FCFF] flex">
      <aside class="hidden md:flex flex-col w-72 shrink-0 bg-[#081F5C] text-white p-5 sticky top-0 h-screen">
        ${LOGO_D('text-2xl')}
        <div class="mt-2 mb-6 font-tech text-[9px] tracking-[.3em] text-[#708BD1] font-bold">ADMIN</div>
        <nav class="space-y-1.5 flex-1">
          ${nav.map(n => `
            <button class="side-item w-full !text-[#C9D9F5] hover:!bg-white/10 ${selected.k === n.k ? '!bg-white/15 !text-white' : ''}" data-action="admin-view" data-view="${n.k}">
              <i data-lucide="${n.i}" style="width:17px;height:17px"></i> ${n.l}
              ${n.badge ? `<span class="ml-auto min-w-5 h-5 px-1 rounded-full bg-[#9BC7FF] text-[#081F5C] text-[10px] font-extrabold flex items-center justify-center">${n.badge}</span>` : ''}
            </button>
          `).join('')}
        </nav>
        <div class="pt-5 border-t border-white/10">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm">${esc(a.username[0].toUpperCase())}</span>
            <div>
              <div class="text-xs font-extrabold">${esc(a.username)}</div>
              <div class="text-[10px] text-[#708BD1] font-bold">${esc(a.roleLabel || 'Administrator')}</div>
            </div>
          </div>
          <button class="side-item w-full !text-[#FFB4A8] hover:!bg-[#B42318]/30" data-action="exit-admin"><i data-lucide="door-open" style="width:17px;height:17px"></i> Exit Admin</button>
        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#D0E3FF] px-5 py-3.5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="md:hidden">${LOGO_D('text-lg')}</span>
            <h2 class="font-display font-bold text-lg capitalize hidden md:block">${selected.l}</h2>
          </div>
          <div class="flex items-center gap-3 w-full max-w-xl justify-end">
            <input class="inp !py-2 !text-xs !w-full max-w-xs" data-admin-search placeholder="Search users, sellers, products..." value="${esc(adminSearch)}" />
            <select class="inp !w-auto !py-2 !text-xs md:hidden" data-action="admin-view-sel">
              ${nav.map(n => `<option value="${n.k}" ${selected.k === n.k ? 'selected' : ''}>${n.l}</option>`).join('')}
            </select>
          </div>
        </header>
        <main class="p-5 md:p-8">${adminLoadFailures.length?`<div class="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><div><div class="text-sm font-bold">Some administrator data is temporarily unavailable.</div><p class="mt-1 text-xs">Unavailable sections: ${esc(adminLoadFailures.join(', '))}. Other dashboard sections remain open.</p></div><button class="btn btn-primary !py-2 !px-4" data-action="admin-refresh">Retry loading</button></div>`:''}${adminView !== 'dashboard' ? adminSplash(selected.l) : ''}${body}</main>
        ${adminProductPreviewId ? renderAdminProductPreview(adminProductPreviewId, metrics) : ''}${adminDetailType ? renderAdminDetail(metrics) : ''}
      </div>
    </div>
  `;
}

function adminOpenDetail(type, id){
  if(!currentAdmin()){ toast('Administrator authentication required.','shield-alert'); return; }
  adminDetailType = type; adminDetailId = id; route();
}
function adminCloseDetail(){ adminDetailType = null; adminDetailId = null; route(); }
function renderAdminDetail(metrics){
  if(!adminDetailType || !adminDetailId) return '';
  const close = '<button class="btn btn-ghost !px-2 !py-1" data-action="admin-detail-close">✕</button>';
  if(adminDetailType === 'ticket'){ const t=(LS.get('tickets',[])||[]).find(x=>x.id===adminDetailId); if(!t)return ''; return `<div class="fixed inset-0 z-[86] bg-slate-950/60 flex items-center justify-center p-4" data-action="admin-detail-close"><div class="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6" onclick="event.stopPropagation()"><div class="flex items-center justify-between"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Support ticket</div><h3 class="font-display font-extrabold text-xl">${esc(t.id)}</h3></div>${close}</div><div class="mt-5 space-y-3 text-sm"><div><span class="text-xs text-slate-400">Customer</span><div class="font-bold">${esc(t.customer||'')} · ${esc(t.email||'')}</div></div><div><span class="text-xs text-slate-400">Topic</span><div class="font-bold">${esc(t.category||'Support')}</div></div><div class="p-4 rounded-2xl bg-slate-50 whitespace-pre-wrap">${esc(t.message||'')}</div></div><div class="mt-5 flex justify-end gap-2"><a class="btn btn-primary" href="mailto:${esc(t.email||'')}">Email customer</a><button class="btn btn-ghost" data-action="admin-detail-close">Close</button></div></div></div>`; }
  if(adminDetailType === 'order'){ const o=metrics.orders.find(x=>x.id===adminDetailId); if(!o)return ''; const seller=metrics.sellers.find(x=>x.id===o.sellerId); const loc=o.deliveryLocation||o.buyer||{}; const st=o.orderStatus||o.status||'New'; const rows=(o.items||[]).map(i=>`<div class="flex gap-3 p-3 rounded-xl border border-slate-100"><div class="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">${i.productImage?`<img src="${i.productImage}" class="w-full h-full object-cover" alt="">`:''}</div><div class="flex-1"><div class="text-sm font-bold">${esc(i.productName||'Product')}</div><div class="text-[11px] text-slate-400">Qty ${i.quantity||1} · ${fmt(i.unitPrice||0)}</div></div><b>${fmt(i.lineTotal||0)}</b></div>`).join(''); return `<div class="fixed inset-0 z-[86] bg-slate-950/60 flex items-center justify-center p-4" data-action="admin-detail-close"><div class="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl" onclick="event.stopPropagation()"><div class="p-5 border-b border-slate-100 flex justify-between"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Read-only order</div><h3 class="font-display font-extrabold text-xl">${esc(o.id)}</h3></div>${close}</div><div class="p-5 space-y-4"><div class="grid sm:grid-cols-2 gap-3"><div class="p-4 rounded-2xl bg-[#F8FAFC]"><div class="text-[10px] text-slate-400 uppercase">Seller</div><div class="font-bold mt-1">${esc(o.sellerName||seller?.businessName||'Seller')}</div></div><div class="p-4 rounded-2xl bg-[#F8FAFC]"><div class="text-[10px] text-slate-400 uppercase">Buyer</div><div class="font-bold mt-1">${esc(o.buyer?.name||'Buyer')}</div><div class="text-xs text-slate-500">${esc(o.buyer?.email||'')}</div></div></div><div class="p-4 rounded-2xl bg-[#F8FAFC]"><div class="text-[10px] text-slate-400 uppercase">Delivery</div><div class="font-bold mt-1">${esc(loc.country||'Nigeria')} · ${esc(loc.state||'')}</div><div class="text-xs text-slate-500">${esc(loc.city||'')} ${loc.lga?'· '+esc(loc.lga):''} · ${esc(loc.address||'')}</div></div>${rows||'<div class="text-sm text-slate-500">No items to display.</div>'}<div class="p-4 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF] text-xs space-y-1"><div class="flex justify-between"><span>Subtotal</span><b>${fmt(o.subtotal||0)}</b></div><div class="flex justify-between"><span>Shipping</span><b>${fmt(o.shippingFee||o.shipping||0)}</b></div><div class="flex justify-between"><span>Anilyfe commission</span><b>${fmt(o.marketplaceCommission||o.commissionAmount||0)}</b></div><div class="flex justify-between font-display font-extrabold text-sm border-t pt-2"><span>Total</span><span>${fmt(o.total||0)}</span></div></div><div class="flex justify-between"><span class="badge">${esc(st)}</span><span class="text-xs text-slate-400">${o.createdAt?new Date(o.createdAt).toLocaleString('en-NG'):'—'}</span></div></div></div></div>`; }
  if(adminDetailType === 'user'){
    const u = metrics.users.find(x=>x.id===adminDetailId); if(!u) return '';
    const orders = metrics.orders.filter(o=>o.buyerId===u.id || o.buyer?.id===u.id);
    const tickets = metrics.tickets.filter(t=>t.userId===u.id);
    const totalSpent=orders.filter(o=>String(o.paymentStatus||'').toUpperCase()==='PAID').reduce((sum,o)=>sum+Number(o.total||0),0);
    const orderRows = orders.map(o => '<button class="w-full flex justify-between gap-3 py-3 border-b border-slate-100 text-left hover:bg-slate-50" data-action="admin-order-view" data-id="'+esc(o.id)+'"><span class="text-xs font-bold">'+esc(o.id)+'</span><span class="text-xs text-slate-500">'+esc(o.orderStatus||o.status||'New')+' · '+fmt(o.total||0)+'</span></button>').join('') || '<div class="text-sm text-slate-400">No orders recorded for this user.</div>';
    return '<div class="fixed inset-0 z-[85] bg-slate-950/60 flex items-center justify-center p-4" data-action="admin-detail-close"><div class="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl" onclick="event.stopPropagation()"><div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">User account</div><h3 class="font-display font-extrabold text-xl">'+esc(u.name||'User')+'</h3></div>'+close+'</div><div class="p-5 grid sm:grid-cols-2 gap-4 text-sm"><div><span class="text-slate-400">Email</span><div class="font-bold">'+esc(u.email||'—')+'</div></div><div><span class="text-slate-400">Role</span><div class="font-bold capitalize">'+esc(u.role||'buyer')+'</div></div><div><span class="text-slate-400">Status</span><div class="font-bold">'+esc(u.status||'Active')+'</div></div><div><span class="text-slate-400">Joined</span><div class="font-bold">'+(u.createdAt?new Date(u.createdAt).toLocaleDateString('en-NG'):'—')+'</div></div><div><span class="text-slate-400">Total Orders</span><div class="font-bold">'+orders.length+'</div></div><div><span class="text-slate-400">Total Spent</span><div class="font-bold">'+fmt(totalSpent)+'</div></div><div><span class="text-slate-400">Support Tickets</span><div class="font-bold">'+tickets.length+'</div></div></div><div class="px-5 pb-5"><form id="adminUserNotesForm" data-user-id="'+esc(u.id)+'"><label class="lbl">Admin notes</label><textarea class="inp min-h-[90px]" name="notes" maxlength="4000">'+esc(u.adminNotes||'')+'</textarea><button class="btn btn-ghost mt-2 !py-2 !text-xs" type="submit">Save notes</button></form><h4 class="font-display font-bold text-lg mt-5 mb-3">Order activity</h4>'+orderRows+'</div><div class="p-5 border-t border-[#E7F1FF] flex justify-end"><button class="btn btn-ghost" data-action="admin-detail-close">Close</button></div></div></div>';
  }
  const seller = metrics.sellerPerformance.find(x=>x.id===adminDetailId) || metrics.sellers.find(x=>x.id===adminDetailId); if(!seller) return '';
  const products = metrics.products.filter(p=>p.sellerId===seller.id);
  const orders = metrics.orders.filter(o=>o.sellerId===seller.id);
  const productRows = products.map(pr => '<button class="w-full flex justify-between gap-3 py-3 border-b border-slate-100 text-left hover:bg-slate-50" data-action="admin-product-preview" data-id="'+esc(pr.id)+'"><span class="text-xs font-bold">'+esc(pr.name||'Product')+'</span><span class="text-xs text-slate-500">'+esc(pr.approvalStatus||pr.status||'Draft')+' · '+fmt(pr.salePrice||pr.price||0)+'</span></button>').join('') || '<div class="text-sm text-slate-400">No products listed.</div>';
  const orderRows = orders.map(o => '<button class="w-full flex justify-between gap-3 py-3 border-b border-slate-100 text-left hover:bg-slate-50" data-action="admin-order-view" data-id="'+esc(o.id)+'"><span class="text-xs font-bold">'+esc(o.id)+'</span><span class="text-xs text-slate-500">'+esc(o.orderStatus||o.status||'New')+' · '+fmt(o.total||0)+'</span></button>').join('') || '<div class="text-sm text-slate-400">No orders recorded.</div>';
  return '<div class="fixed inset-0 z-[85] bg-slate-950/60 flex items-center justify-center p-4" data-action="admin-detail-close"><div class="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl" onclick="event.stopPropagation()"><div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Seller account</div><h3 class="font-display font-extrabold text-xl">'+esc(seller.businessName||'Seller')+'</h3></div>'+close+'</div><div class="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><div class="rounded-2xl bg-[#F8FAFC] p-4"><div class="text-[10px] text-slate-400 uppercase font-bold">Status</div><div class="font-bold mt-1">'+esc(seller.status||'pending')+'</div></div><div class="rounded-2xl bg-[#F8FAFC] p-4"><div class="text-[10px] text-slate-400 uppercase font-bold">Verification</div><div class="font-bold mt-1">'+esc(seller.verificationStatus||seller.verification?.status||'not started')+'</div></div><div class="rounded-2xl bg-[#F8FAFC] p-4"><div class="text-[10px] text-slate-400 uppercase font-bold">Products</div><div class="font-bold mt-1">'+products.length+'</div></div><div class="rounded-2xl bg-[#F8FAFC] p-4"><div class="text-[10px] text-slate-400 uppercase font-bold">Seller earnings</div><div class="font-bold mt-1">'+fmt(seller.computedEarnings||0)+'</div></div></div><div class="px-5 pb-5"><div class="flex flex-wrap gap-2 mb-5"><button class="btn btn-primary !py-2 !text-xs" data-action="admin-seller-store" data-id="'+esc(seller.id)+'">View Store</button><button class="btn btn-ghost !py-2 !text-xs" data-action="admin-seller-products" data-id="'+esc(seller.id)+'">View Products</button><button class="btn btn-ghost !py-2 !text-xs" data-action="admin-seller-orders" data-id="'+esc(seller.id)+'">View Orders</button><button class="btn btn-primary !py-2 !text-xs" data-action="admin-seller-status" data-id="'+esc(seller.id)+'" data-status="approved">Approve seller</button><button class="btn btn-ghost !py-2 !text-xs" data-action="admin-seller-status" data-id="'+esc(seller.id)+'" data-status="rejected">Reject</button></div><div class="grid sm:grid-cols-2 gap-3 rounded-2xl bg-[#F8FAFC] p-4 mb-5"><div><label class="lbl">Commission rate (%)</label><input id="admin-seller-commission" class="inp" type="number" min="0" max="100" step="0.01" value="'+Number(seller.commissionRate||15)+'"></div><div class="flex items-end gap-3"><button class="btn btn-primary !py-2 !text-xs" data-action="admin-seller-commission-save" data-id="'+esc(seller.id)+'">Save commission</button><button class="btn btn-ghost !py-2 !text-xs" data-action="admin-seller-founding-toggle" data-id="'+esc(seller.id)+'" data-active="'+(!seller.foundingSellerActive)+'">'+(seller.foundingSellerActive?'Remove Founding Seller':'Enable Founding Seller')+'</button></div></div><h4 class="font-display font-bold text-lg mb-3">Seller products</h4>'+productRows+'<h4 class="font-display font-bold text-lg mt-6 mb-3">Order activity</h4>'+orderRows+'</div><div class="p-5 border-t border-[#E7F1FF] flex justify-end"><button class="btn btn-ghost" data-action="admin-detail-close">Close</button></div></div></div>';
}

function renderAdminProductPreview(id, metrics){
  const p = metrics.products.find(x => x.id === id);
  if(!p) return '';
  const seller = metrics.sellers.find(x => x.id === p.sellerId);
  const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : (p.img ? [p.img] : []);
  return `<div class="fixed inset-0 z-[80] bg-slate-950/60 flex items-center justify-center p-4" data-action="admin-product-preview-close">
    <div class="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl" onclick="event.stopPropagation()">
      <div class="p-5 border-b border-[#E7F1FF] flex items-center justify-between"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Product review</div><h3 class="font-display font-extrabold text-xl">${esc(p.name)}</h3></div><button class="btn btn-ghost !px-2 !py-1" data-action="admin-product-preview-close">✕</button></div>
      <div class="p-5 grid md:grid-cols-2 gap-5">
        <div>${imgs.length ? `<div class="rounded-2xl overflow-hidden border border-[#D0E3FF] bg-[#F8FAFC]"><img src="${imgs[0]}" alt="${esc(p.name)}" class="w-full aspect-square object-cover" /></div><div class="grid grid-cols-4 gap-2 mt-2">${imgs.slice(0,4).map(src=>`<img src="${src}" alt="" class="w-full aspect-square object-cover rounded-xl border border-slate-200" />`).join('')}</div>` : `<div class="aspect-square rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-sm text-slate-400">No product image uploaded</div>`}</div>
        <div class="space-y-3 text-sm"><div><span class="text-slate-400">Seller</span><div class="font-bold">${esc(seller?.businessName || 'Unknown')}</div></div><div><span class="text-slate-400">Category</span><div class="font-bold">${esc(p.category || '—')}</div></div><div><span class="text-slate-400">Price</span><div class="font-display font-extrabold text-lg">${fmt(p.salePrice || p.price || 0)}</div></div><div><span class="text-slate-400">Stock</span><div class="font-bold">${Number(p.stock || 0)}</div></div><div><span class="text-slate-400">SKU</span><div class="font-mono font-bold">${esc(p.sku || '—')}</div></div><div><span class="text-slate-400">Dimensions</span><div class="font-bold">${p.dimensions?.width||p.dimensions?.height||p.dimensions?.depth ? `${p.dimensions?.width||'—'} × ${p.dimensions?.height||'—'} × ${p.dimensions?.depth||'—'} in` : 'Not specified'}</div></div><div><span class="text-slate-400">Description</span><p class="mt-1 leading-relaxed text-slate-600">${esc(p.description || p.shortDescription || 'No description provided.')}</p></div>${p.rejectionReason ? `<div class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700"><b>Previous rejection:</b> ${esc(p.rejectionReason)}</div>`:''}</div>
      </div>
      <div class="p-5 border-t border-[#E7F1FF] flex flex-wrap justify-end gap-2"><button class="btn btn-ghost" data-action="admin-product-preview-close">Close</button>${['Published','Approved','Out of Stock'].includes(p.approvalStatus || p.status) ? `<button class="btn btn-danger" data-action="admin-product-action" data-id="${p.id}" data-status="rejected">Reject with note</button>` : `<button class="btn btn-danger" data-action="admin-product-action" data-id="${p.id}" data-status="rejected">Reject with note</button><button class="btn btn-primary" data-action="admin-product-action" data-id="${p.id}" data-status="approved">Approve & Publish</button>`}</div>
    </div>
  </div>`;
}

function adminSetSettingsFromForm(){
  const settings = LS.get('marketplaceSettings', {});
  const name = document.getElementById('admin-market-name')?.value || settings.marketplaceName || 'Anilyfe';
  const email = document.getElementById('admin-market-email')?.value || settings.supportEmail || 'myanilyfe@gmail.com';
  const commission = Number(document.getElementById('admin-market-commission')?.value || settings.commission || 15);
  LS.set('marketplaceSettings', {
    ...settings,
    marketplaceName: name,
    supportEmail: email,
    adminEmail: document.getElementById('admin-admin-email')?.value.trim() || settings.adminEmail || email,
    telegram: document.getElementById('admin-telegram')?.value.trim() || settings.telegram || '',
    commission: Math.max(0, Math.min(100, commission))
  });
  toast('Marketplace settings updated.', 'badge-check');
  route();
}

function adminToggleSetting(key, enabled){
  const settings = LS.get('marketplaceSettings', {});
  settings[key] = !Boolean(enabled);
  LS.set('marketplaceSettings', settings);
  toast(`${key.replace(/([A-Z])/g, ' $1')} ${settings[key] ? 'enabled' : 'disabled'}.`, 'toggle-left');
  route();
}

function adminSaveSettings(){ adminSetSettingsFromForm(); }

function adminHandleSettingToggle(key, enabled){ adminToggleSetting(key, enabled); }

function adminUpdateUserStatus(id, status){
  if(currentAdmin()?.id===id&&String(status).toUpperCase()==='SUSPENDED'){toast('You cannot suspend the current administrator.','shield-alert');return;}
  if(!currentAdmin()){ toast('Administrator authentication required.','shield-alert'); return; }
  const users = LS.get('users', []);
  const user = users.find(u => u.id === id);
  if(user){
    user.status = status;
    LS.set('users', users);
    toast(`User status updated to ${status}.`, 'user-check');
    route();
  }
}

function adminUpdateSellerStatus(id, status){
  if(!currentAdmin()){ toast('Administrator authentication required.','shield-alert'); return; }
  if(window.ANILyfeAPI?.request){
    const apiStatus=String(status||'').toUpperCase();
    window.ANILyfeAPI.request('/api/admin/sellers/'+encodeURIComponent(id)+'/approval',{method:'PATCH',body:JSON.stringify({status:apiStatus})})
      .then(()=>window.ANILyfeAPI.refresh())
      .then(()=>{toast(`Seller ${status}.`,'store');route();})
      .catch(error=>toast(error.message||'Unable to update seller approval.','alert-triangle'));
    return;
  }
  const sellers = LS.get('sellers', []);
  const seller = sellers.find(s => s.id === id);
  if(seller){
    seller.status = status;
    if(status==='approved'){ seller.verificationStatus='Verified'; seller.badges=Array.isArray(seller.badges)?seller.badges:[]; if(!seller.badges.some(b=>String(b).toLowerCase().includes('verified'))){ seller.badges.push('Verified Seller'); } }
    if(status!=='approved') seller.verificationStatus = status==='suspended' ? 'Suspended' : (seller.verificationStatus || 'Under Review');
    LS.set('sellers', sellers);
    toast(`Seller status updated to ${status}.`, 'store');
    route();
  }
}

function adminOpenProductPreview(id){
  if(!currentAdmin()){ toast('Administrator authentication required.','shield-alert'); return; }
  adminProductPreviewId = id;
  route();
}
function adminCloseProductPreview(){ adminProductPreviewId = null; route(); }

function adminUpdateProductStatus(id, status){
  if(!currentAdmin()){ toast('Administrator authentication required.','shield-alert'); return; }
  const products = LS.get('products', []);
  const product = products.find(p => p.id === id);
  if(product){
    if(status==='approved'){
      const seller=LS.get('sellers',[]).find(x=>x.id===product.sellerId);
      if(!seller || seller.status!=='approved'){ toast('Only products belonging to approved sellers can be published.','shield-alert'); return; }
      product.approvalStatus='Published'; product.status='Published'; product.publishedAt=new Date().toISOString();
    } else {
      product.approvalStatus=status==='rejected'?'Rejected':status;
      product.status=product.approvalStatus;
      if(status==='rejected'){
        const note = prompt('Reason for rejecting this product (required):', product.rejectionReason || '');
        if(note === null) return;
        if(!note.trim()){ toast('A rejection note is required.', 'alert-circle'); return; }
        product.rejectionReason = note.trim();
        product.rejectedAt = new Date().toISOString();
      }
    }
    LS.set('products', products);
    localStorage.setItem('anilyfe_seller_products', JSON.stringify(products));
    toast(`Product marked as ${status}.`, 'package-check');
    route();
  }
}

function adminUpdateOrderStatus(id, status){
  if(!currentAdmin()){ toast('Administrator authentication required.','shield-alert'); return; }
  const orders = LS.get('orders', []);
  const order = orders.find(o => o.id === id);
  if(order){
    order.status = status;
    LS.set('orders', orders);
    toast(`Order ${id} updated to ${status}.`, 'shopping-bag');
    route();
  }
}

function adminApproveSeller(id){ adminUpdateSellerStatus(id, 'approved'); }
function adminRemoveSeller(id){ adminUpdateSellerStatus(id, 'removed'); }
function adminRestoreSeller(id){ adminUpdateSellerStatus(id, 'pending'); }
async function adminExit(){ await window.ANILyfeAPI?.request('/api/auth/logout',{method:'POST',body:'{}'}).catch(()=>{}); if(window.ANILyfeAPI?.state){window.ANILyfeAPI.state.user=null;window.ANILyfeAPI.state.seller=null;} toast('Exited admin panel.', 'door-open'); location.hash = '#/'; }

function adminLogin(formEl){ toast('Use the administrator gateway. Authentication is handled by the backend.','shield-check'); }

function adminRegister(){ toast('Public administrator registration is disabled.','shield-alert'); }


let adminTicketDetailId=null;
function adminOpenTicketDetail(id){adminTicketDetailId=id;route();}
function adminCloseTicketDetail(){adminTicketDetailId=null;route();}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action="admin-refresh"]');
  if(!button)return;
  button.disabled=true;
  window.ANILyfeAPI?.refresh?.()
    .then(()=>window.route?.())
    .catch(()=>toast('Administrator data could not be refreshed. Please try again.','alert-triangle'))
    .finally(()=>{if(button.isConnected)button.disabled=false;});
});
