/**
 * ANILyfe Seller Dashboard & Seller Center
 * Complete, professional, anime-focused marketplace management platform.
 * Strictly e-commerce marketplace: No social feeds, followers, or creator profiles.
 * Powered by async service layer (js/services/*) and localStorage persistence.
 */
(function() {
  'use strict';

  // Active state for Seller Center
  const SC = {
    section: 'dashboard',
    subSection: null,
    orderFilter: 'All',
    productFilter: 'All',
    reviewFilter: 'All',
    questionFilter: 'All',
    analyticsRange: '30d',
    analyticsMetric: 'revenue',
    searchQuery: '',
    isLoading: false,
    mobileMenuOpen: false,
    notifDrawerOpen: false,
    activeModal: null,
    modalData: null,
    wizardStep: 1,
    wizardData: {
      name: '',
      brand: '',
      category: 'Figures & Collectibles',
      subcategory: 'Scale Figures',
      shortDescription: '',
      description: '',
      price: '',
      discount: 0,
      saleStartDate: '',
      saleEndDate: '',
      stock: 0,
      lowStockThreshold: 5,
      sku: '',
      weightKg: 1.0,
      fragile: true,
      colors: [],
      sizes: [],
      images: [],
      variants: [], dimensions: {width:'',height:'',depth:'',unit:'in'}
    }
  };

  // Helper: format money in Nigerian Naira
  function fmtMoney(val) {
    const num = Number(val) || 0;
    return '₦' + num.toLocaleString('en-NG');
  }

  // Helper: format date
  function fmtDate(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return isoString;
    }
  }

  // Helper: Status badge color
  function badgeClasses(status) {
    const s = String(status || '').toLowerCase();
    if (['live', 'published', 'approved', 'verified', 'paid', 'completed', 'in stock', 'settled (available)'].includes(s)) {
      return 'bg-[#E6F7EC] text-[#10B981] border border-[#A7F3D0]';
    }
    if (['pending approval', 'under review', 'processing', 'pending', 'pending clearance', 'low stock', 'ready to ship', 'in transit', 'shipped'].includes(s)) {
      return 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]';
    }
    if (['rejected', 'out of stock', 'cancelled', 'suspended', 'temporarily closed', 'refund adjusted', 'refunded'].includes(s)) {
      return 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]';
    }
    if (['draft', 'archived', 'not started'].includes(s)) {
      return 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]';
    }
    return 'bg-[#E7F1FF] text-[#334EAC] border border-[#D0E3FF]';
  }

  // Render skeleton loader
  function renderSkeleton(type = 'cards') {
    if (type === 'cards') {
      return `
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          ${[1,2,3,4].map(() => `
            <div class="h-28 rounded-2xl bg-white/70 border border-[#E2E8F0] p-4 flex flex-col justify-between">
              <div class="h-4 w-24 bg-slate-200 rounded"></div>
              <div class="h-8 w-36 bg-slate-200 rounded"></div>
              <div class="h-3 w-28 bg-slate-100 rounded"></div>
            </div>
          `).join('')}
        </div>
      `;
    }
    return `<div class="h-64 rounded-2xl bg-white/70 border border-[#E2E8F0] animate-pulse p-6 flex items-center justify-center text-sm text-slate-400">Loading marketplace data...</div>`;
  }

  // Render empty state
  function renderEmptyState(title, desc, actionLabel = null, actionAction = null, icon = 'package') {
    return `
      <div class="rounded-3xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center max-w-lg mx-auto my-8">
        <div class="w-16 h-16 rounded-2xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center mx-auto mb-4">
          <i data-lucide="${icon}" style="width:28px;height:28px"></i>
        </div>
        <h3 class="font-display font-bold text-lg text-[#0F172A]">${title}</h3>
        <p class="text-sm text-[#64748B] mt-2 mb-6 max-w-md mx-auto leading-relaxed">${desc}</p>
        ${actionLabel ? `
          <button class="btn btn-primary" data-action="${actionAction || ''}">
            <i data-lucide="plus" style="width:16px;height:16px"></i>
            ${actionLabel}
          </button>
        ` : ''}
      </div>
    `;
  }

  // Top Persistent Header
  function renderHeader(seller, unreadCount) {
    const status = seller.storeStatus || 'Live';
    return `
      <header class="sticky top-2 z-30 mb-5 rounded-2xl border border-white/60 bg-white/85 backdrop-blur-xl px-4 py-3 shadow-[0_10px_30px_-15px_rgba(8,31,92,0.12)]">
        <div class="flex items-center justify-between gap-3">
          <!-- Left: Logo & Seller Center Title -->
          <div class="flex items-center gap-3">
            <button class="lg:hidden p-2 rounded-xl text-[#334EAC] hover:bg-[#E7F1FF] transition" data-action="sc-toggle-mobile-menu" aria-label="Toggle navigation">
              <i data-lucide="menu" style="width:20px;height:20px"></i>
            </button>
            <div class="flex items-center gap-2.5">
              ${wordmark('text-xl md:text-2xl', false)}
              <span class="hidden sm:inline-block h-5 w-px bg-[#CBD5E1]"></span>
              <div class="hidden sm:flex items-center gap-1.5 font-display font-bold text-sm tracking-wide text-[#081F5C]">
                <span>SELLER CENTER</span>
                <span class="text-[10px] uppercase font-tech px-2 py-0.5 rounded-full bg-[#E7F1FF] text-[#334EAC] font-extrabold border border-[#D0E3FF]">MARKETPLACE</span>
              </div>
            </div>
          </div>

          <!-- Middle: Status badge -->
          <div class="hidden md:flex items-center gap-2">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <span class="w-2 h-2 rounded-full ${status === 'Live' ? 'bg-[#10B981] animate-pulse' : status === 'Temporarily Closed' ? 'bg-[#D97706]' : 'bg-[#EF4444]'}"></span>
              <span class="text-xs font-bold text-[#334155]">Store Status:</span>
              <span class="text-xs font-extrabold ${status === 'Live' ? 'text-[#10B981]' : 'text-[#D97706]'}">${status}</span>
              <button class="text-[10px] text-[#334EAC] font-bold underline ml-1 hover:text-[#081F5C]" data-action="sc-change-status-modal">Change</button>
            </div>
          </div>

          <!-- Right: Action Buttons & Utilities -->
          <div class="flex items-center gap-2">
            <button class="hidden lg:inline-flex btn btn-ghost !px-3 !py-2 !text-xs !font-bold text-[#334EAC] border-[#D0E3FF] hover:bg-[#E7F1FF]" data-action="sc-open-sales-report" title="Generate sales report">
              <i data-lucide="file-spreadsheet" style="width:14px;height:14px"></i>
              <span>Sales Report</span>
            </button>

            <a href="#/marketplace" class="hidden sm:inline-flex btn btn-ghost !px-3 !py-2 !text-xs !font-bold text-[#334155] border-[#E2E8F0] hover:bg-[#F8FAFC]" title="View live buyer marketplace">
              <i data-lucide="shopping-bag" style="width:14px;height:14px"></i>
              <span>Marketplace</span>
            </a>

            <a href="#/seller/store/preview" class="btn btn-ghost !px-3 !py-2 !text-xs !font-bold text-[#334EAC] border-[#D0E3FF] hover:bg-[#E7F1FF]" title="Preview customer storefront">
              <i data-lucide="eye" style="width:14px;height:14px"></i>
              <span class="hidden sm:inline">Preview Store</span>
            </a>

            <button class="btn btn-primary !px-3.5 !py-2 !text-xs !font-bold shadow-md hover:shadow-lg" data-action="sc-nav-add-product">
              <i data-lucide="plus" style="width:14px;height:14px"></i>
              <span class="hidden sm:inline">Add Product</span>
            </button>

            <!-- Notification Bell -->
            <button class="relative w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center transition" data-action="sc-toggle-notifications" aria-label="Notifications">
              <i data-lucide="bell" style="width:18px;height:18px"></i>
              ${unreadCount > 0 ? `<span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">${unreadCount}</span>` : ''}
            </button>

            <!-- Profile menu avatar -->
            <a href="#/seller/settings" class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#081F5C] to-[#334EAC] text-white flex items-center justify-center font-display font-extrabold text-sm shadow-sm hover:ring-2 hover:ring-[#334EAC]/40 transition" title="Seller Account Settings">
              ${(seller.storeName || 'A').slice(0, 1).toUpperCase()}
            </a>
          </div>
        </div>
      </header>
    `;
  }

  // Persistent Left Sidebar
  function renderSidebar(activeSection, seller) {
    const navItems = [
      { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', path: '#/seller/dashboard' },
      { key: 'orders', label: 'Orders', icon: 'shopping-bag', path: '#/seller/orders' },
      { key: 'products', label: 'Products', icon: 'package', path: '#/seller/products' },
      { key: 'inventory', label: 'Inventory', icon: 'boxes', path: '#/seller/inventory' },
      { key: 'reviews', label: 'Reviews & Questions', icon: 'star', path: '#/seller/reviews' },
      { key: 'earnings', label: 'Earnings', icon: 'banknote', path: '#/seller/earnings' },
      { key: 'analytics', label: 'Analytics', icon: 'bar-chart-3', path: '#/seller/analytics' },
      { key: 'delivery', label: 'Delivery & Shipping', icon: 'truck', path: '#/seller/delivery' },
      { key: 'store', label: 'My Store', icon: 'store', path: '#/seller/store' },
      { key: 'storePreview', label: 'Preview Store', icon: 'eye', path: '#/seller/store/preview' },
      { key: 'verification', label: 'Verification', icon: 'badge-check', path: '#/seller/verification' },
      { key: 'settings', label: 'Settings', icon: 'settings', path: '#/seller/settings' }
    ];

    const hasFounding = seller.foundingSellerActive && seller.foundingSellerNumber;

    return `
      <aside class="w-full lg:w-64 shrink-0 flex flex-col gap-4">
        <!-- Store Identity Card -->
        <div class="rounded-3xl border border-white/60 bg-white p-4 shadow-[0_4px_20px_-8px_rgba(8,31,92,0.08)]">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#334EAC] to-[#081F5C] text-white flex items-center justify-center font-display font-extrabold text-lg shadow-sm">
              ${(seller.storeName || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="font-display font-extrabold text-sm text-[#0F172A] truncate" title="${seller.storeName}">${seller.storeName}</h2>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold ${badgeClasses(seller.storeStatus)}">
                  ${seller.storeStatus || 'Live'}
                </span>
                <span class="text-[10px] text-slate-400 font-bold">★ ${Number(seller.rating || 0)}</span>
              </div>
            </div>
          </div>

          <!-- Badges showcase -->
          <div class="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
            ${hasFounding ? `
              <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-[10px] font-extrabold">
                <i data-lucide="crown" style="width:13px;height:13px;color:#D97706"></i>
                <span>Founding Seller #${seller.foundingSellerNumber}</span>
              </div>
            ` : ''}

            <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#E6F7EC] border border-[#A7F3D0] text-[#047857] text-[10px] font-extrabold">
              <i data-lucide="badge-check" style="width:13px;height:13px;color:#10B981"></i>
              <span>Verified Anime Merchant</span>
            </div>
          </div>

          <!-- Commission Rate Box (Non-editable) -->
          <div class="mt-3.5 pt-3 border-t border-slate-100">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-bold text-slate-500 uppercase tracking-wider">Commission</span>
              <span class="font-extrabold text-[#334EAC] px-2 py-0.5 rounded-md bg-[#E7F1FF] border border-[#D0E3FF]">
                ${seller.commissionRate ? seller.commissionRate.rate : 15}%
              </span>
            </div>
            <p class="text-[9px] text-slate-400 mt-1 leading-tight">Rate set by ANILyfe platform authority.</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="rounded-3xl border border-white/60 bg-white p-2.5 shadow-[0_4px_20px_-8px_rgba(8,31,92,0.08)] flex flex-col gap-1">
          ${navItems.map(item => {
            const isActive = activeSection === item.key;
            return `
              <a href="${item.path}" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${isActive ? 'bg-[#334EAC] text-white shadow-md shadow-[#334EAC]/20 translate-x-1' : 'text-[#475569] hover:bg-[#E7F1FF] hover:text-[#334EAC]'}">
                <i data-lucide="${item.icon}" style="width:16px;height:16px"></i>
                <span class="flex-1">${item.label}</span>
                ${isActive ? '<i data-lucide="chevron-right" style="width:14px;height:14px;opacity:0.8"></i>' : ''}
              </a>
            `;
          }).join('')}
        </nav>

        <!-- Seller Support Card -->
        <div class="rounded-3xl border border-[#D0E3FF] bg-gradient-to-br from-[#E7F1FF] to-[#F8FAFC] p-4 text-xs">
          <div class="flex items-center gap-2 font-bold text-[#081F5C] mb-1">
            <i data-lucide="shield-alert" style="width:15px;height:15px;color:#334EAC"></i>
            <span>Seller Support</span>
          </div>
          <p class="text-slate-500 text-[11px] leading-relaxed">Need help with payouts, packaging standards or logistics?</p>
          <a href="#/help" class="inline-flex items-center gap-1 font-bold text-[#334EAC] hover:underline mt-2 text-[11px]">
            <span>Seller Help Center</span>
            <i data-lucide="external-link" style="width:11px;height:11px"></i>
          </a>
        </div>
      </aside>
    `;
  }

  // Mobile Bottom Navigation Bar
  function renderMobileBottomNav(activeSection) {
    const items = [
      { key: 'dashboard', label: 'Dash', icon: 'layout-dashboard', path: '#/seller/dashboard' },
      { key: 'orders', label: 'Orders', icon: 'shopping-bag', path: '#/seller/orders' },
      { key: 'products', label: 'Products', icon: 'package', path: '#/seller/products' },
      { key: 'inventory', label: 'Stock', icon: 'boxes', path: '#/seller/inventory' },
      { key: 'earnings', label: 'Earnings', icon: 'banknote', path: '#/seller/earnings' }
    ];

    return `
      <div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0] px-2 py-1.5 flex items-center justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.06)]">
        ${items.map(it => `
          <a href="${it.path}" class="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${activeSection === it.key ? 'text-[#334EAC] font-extrabold' : 'text-slate-500 font-bold'}">
            <i data-lucide="${it.icon}" style="width:18px;height:18px"></i>
            <span class="text-[10px]">${it.label}</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  // Mobile Drawer (Collapsible Menu)
  function renderMobileDrawer(activeSection, seller) {
    if (!SC.mobileMenuOpen) return '';
    return `
      <div class="fixed inset-0 z-50 lg:hidden flex">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" data-action="sc-toggle-mobile-menu"></div>
        <div class="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                ${wordmark('text-lg', false)}
                <span class="text-[10px] font-tech font-extrabold px-2 py-0.5 bg-[#E7F1FF] text-[#334EAC] rounded-full">SELLER</span>
              </div>
              <button class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500" data-action="sc-toggle-mobile-menu">
                <i data-lucide="x" style="width:18px;height:18px"></i>
              </button>
            </div>

            <div class="mt-4 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <div class="font-display font-bold text-sm text-[#0F172A]">${seller.storeName}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">${seller.city}, ${seller.state}</div>
            </div>

            <nav class="mt-4 space-y-1">
              ${[
                ['Dashboard', 'layout-dashboard', '#/seller/dashboard', 'dashboard'],
                ['Orders', 'shopping-bag', '#/seller/orders', 'orders'],
                ['Products', 'package', '#/seller/products', 'products'],
                ['Inventory', 'boxes', '#/seller/inventory', 'inventory'],
                ['Reviews & Questions', 'star', '#/seller/reviews', 'reviews'],
                ['Earnings', 'banknote', '#/seller/earnings', 'earnings'],
                ['Analytics', 'bar-chart-3', '#/seller/analytics', 'analytics'],
                ['Delivery & Shipping', 'truck', '#/seller/delivery', 'delivery'],
                ['My Store', 'store', '#/seller/store', 'store'],
                ['Preview Store', 'eye', '#/seller/store/preview', 'storePreview'],
                ['Verification', 'badge-check', '#/seller/verification', 'verification'],
                ['Settings', 'settings', '#/seller/settings', 'settings']
              ].map(([lbl, ic, href, k]) => `
                <a href="${href}" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold ${activeSection === k ? 'bg-[#334EAC] text-white' : 'text-slate-600 hover:bg-[#E7F1FF]'}" data-action="sc-close-mobile-menu">
                  <i data-lucide="${ic}" style="width:16px;height:16px"></i>
                  <span>${lbl}</span>
                </a>
              `).join('')}
            </nav>
          </div>

          <div class="pt-4 border-t border-slate-100 text-center">
            <a href="#/marketplace" class="btn btn-ghost w-full text-xs font-bold" data-action="sc-close-mobile-menu">
              <i data-lucide="store" style="width:14px;height:14px"></i>
              <span>Back to Marketplace</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Slide-over Notification Center Drawer
  function renderNotificationDrawer(notifications) {
    if (!SC.notifDrawerOpen) return '';
    return `
      <div class="fixed inset-0 z-50 flex justify-end">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" data-action="sc-toggle-notifications"></div>
        <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center">
                <i data-lucide="bell" style="width:16px;height:16px"></i>
              </div>
              <h3 class="font-display font-bold text-base text-[#0F172A]">Seller Notifications</h3>
            </div>
            <div class="flex items-center gap-2">
              <button class="text-xs font-bold text-[#334EAC] hover:underline" data-action="sc-notif-mark-all-read">Mark all read</button>
              <button class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100" data-action="sc-toggle-notifications">
                <i data-lucide="x" style="width:18px;height:18px"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            ${notifications.length ? notifications.map(n => `
              <div class="p-3.5 rounded-2xl border transition ${n.read ? 'bg-white border-slate-100' : 'bg-[#E7F1FF] border-[#D0E3FF]'} flex gap-3 items-start">
                <span class="w-8 h-8 rounded-xl shrink-0 mt-0.5 flex items-center justify-center ${n.category === 'orders' ? 'bg-amber-100 text-amber-700' : n.category === 'products' ? 'bg-purple-100 text-purple-700' : n.category === 'financial' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}">
                  <i data-lucide="${n.category === 'orders' ? 'shopping-bag' : n.category === 'products' ? 'package' : n.category === 'financial' ? 'wallet' : 'shield'}" style="width:15px;height:15px"></i>
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-bold text-xs text-[#0F172A] truncate">${n.title}</span>
                    <span class="text-[10px] text-slate-400 shrink-0">${n.timestamp}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${n.message}</p>
                  ${n.link ? `
                    <a href="${n.link}" class="inline-flex items-center gap-1 text-[11px] font-bold text-[#334EAC] mt-2 hover:underline" data-action="sc-toggle-notifications">
                      <span>View details</span>
                      <i data-lucide="arrow-right" style="width:11px;height:11px"></i>
                    </a>
                  ` : ''}
                </div>
              </div>
            `).join('') : '<div class="text-center py-12 text-sm text-slate-400">You are all caught up! No notifications.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 1: DASHBOARD HOME
  // =========================================================================
  async function renderDashboardView(seller) {
    const analytics = await window.analyticsService.getOverview(SC.analyticsRange);
    const orders = await window.orderService.getOrders();
    const products = await window.productService.getProducts();

    const pendingOrders = orders.filter(o => ['New', 'Confirmed', 'Processing'].includes(o.orderStatus));
    const recentOrders = orders.slice(0, 5);

    const kpis = [
      { label: "Today's Sales", val: fmtMoney(analytics.kpis.todaySales), sub: '+18.4% vs yesterday', icon: 'wallet', trend: 'up' },
      { label: 'Total Revenue', val: fmtMoney(analytics.kpis.totalRevenue), sub: 'Gross lifetime GMV', icon: 'circle-dollar-sign', trend: 'up' },
      { label: 'Total Orders', val: analytics.kpis.totalOrders, sub: `${pendingOrders.length} require action`, icon: 'shopping-bag', trend: 'neutral' },
      { label: 'Products Sold', val: analytics.kpis.productsSold, sub: 'Units shipped nationwide', icon: 'package', trend: 'up' },
      { label: 'Store Views', val: Number(analytics.kpis.storeViews).toLocaleString(), sub: 'Unique shoppers', icon: 'store', trend: 'up' },
      { label: 'Product Views', val: Number(analytics.kpis.productViews).toLocaleString(), sub: 'Listing impressions', icon: 'eye', trend: 'up' },
      { label: 'Pending Orders', val: pendingOrders.length, sub: 'Fulfillment queue', icon: 'clock', trend: pendingOrders.length > 0 ? 'warn' : 'neutral' },
      { label: 'Pending Returns', val: analytics.kpis.pendingReturns, sub: 'Awaiting inspection', icon: 'rotate-ccw', trend: 'neutral' },
      { label: 'Seller Rating', val: `★ ${Number(seller.rating || 0)}`, sub: `From ${Number(seller.reviewCount || 0)} buyers`, icon: 'star', trend: 'up' },
      { label: 'Available Balance', val: fmtMoney(analytics.kpis.availableBalance), sub: 'Ready for payout', icon: 'banknote', trend: 'up' },
      { label: 'Pending Balance', val: fmtMoney(analytics.kpis.pendingBalance), sub: 'Clearing in 24-48h', icon: 'hourglass', trend: 'neutral' }
    ];

    // Chart series data
    const chart = analytics.series;
    const metricKey = SC.analyticsMetric; // 'revenue' | 'orders' | 'productsSold'
    const values = chart[metricKey] || chart.revenue;
    const maxVal = Math.max(...values, 1);

    return `
      <div class="space-y-6">
        <!-- Welcome Banner with Quick Actions -->
        <div class="relative overflow-hidden rounded-3xl border border-[#D0E3FF] bg-gradient-to-r from-[#081F5C] via-[#0B2A7A] to-[#334EAC] p-6 text-white shadow-md">
          <img src="assets/images/seller.png" width="700" height="200" alt="" class="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-40 [mask-image:linear-gradient(to_left,#000,transparent)] md:block" loading="eager" onerror="this.remove()">
          <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold backdrop-blur-sm mb-2">
                <i data-lucide="sparkles" style="width:13px;height:13px;color:#FCD34D"></i>
                <span>Futuristic Anime Marketplace Dashboard</span>
              </div>
              <h1 class="font-display font-extrabold text-2xl md:text-3xl tracking-tight">Konnichiwa, ${seller.storeName}!</h1>
              <p class="text-xs text-purple-100 mt-1 max-w-xl">Your marketplace catalog is live across Nigeria. You have <strong class="text-amber-300 font-bold">${pendingOrders.length} pending orders</strong> awaiting dispatch today.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button class="btn !bg-white !text-[#081F5C] hover:!bg-purple-50 font-bold !text-xs !py-2 !px-3 shadow-md" data-action="sc-nav-add-product">
                <i data-lucide="plus-circle" style="width:15px;height:15px;color:#334EAC"></i>
                <span>Add Product</span>
              </button>
              <a href="#/seller/orders" class="btn !bg-white/15 !text-white hover:!bg-white/25 border border-white/30 font-bold !text-xs !py-2 !px-3">
                <i data-lucide="shopping-bag" style="width:15px;height:15px"></i>
                <span>Manage Orders</span>
              </a>
              <a href="#/seller/earnings" class="btn !bg-white/15 !text-white hover:!bg-white/25 border border-white/30 font-bold !text-xs !py-2 !px-3">
                <i data-lucide="wallet" style="width:15px;height:15px"></i>
                <span>Request Payout</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 11 KPI Cards -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-display font-extrabold text-base text-[#0F172A] tracking-tight">Marketplace Performance Highlights</h2>
            <span class="text-[11px] font-bold text-slate-400">Live 24-hour sync</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3.5">
            ${kpis.map((kpi, idx) => `
              <div class="rounded-2xl border border-white/60 bg-white p-3.5 shadow-sm hover:shadow-md transition flex flex-col justify-between ${idx === 0 || idx === 1 ? 'border-l-4 border-l-[#334EAC]' : ''}">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">${kpi.label}</span>
                  <span class="w-7 h-7 rounded-lg bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center shrink-0">
                    <i data-lucide="${kpi.icon}" style="width:14px;height:14px"></i>
                  </span>
                </div>
                <div class="mt-2.5 font-display font-extrabold text-xl text-[#0F172A] tracking-tight truncate">${kpi.val}</div>
                <div class="mt-1 text-[10px] text-slate-500 truncate flex items-center gap-1">
                  ${kpi.trend === 'up' ? '<i data-lucide="trending-up" style="width:12px;height:12px;color:#10B981"></i>' : ''}
                  <span>${kpi.sub}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Sales Chart & Alerts Grid -->
        <div class="grid xl:grid-cols-[1.5fr_1fr] gap-6">
          <!-- Interactive Sales Chart -->
          <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Revenue & Growth</span>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A] mt-0.5">Sales Trend Analytics</h3>
              </div>
              <!-- Controls: Metric toggles + Date filters -->
              <div class="flex flex-wrap items-center gap-2">
                <div class="inline-flex p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
                  <button class="px-2.5 py-1 rounded-lg transition ${metricKey === 'revenue' ? 'bg-white text-[#334EAC] shadow-xs' : 'text-slate-600'}" data-action="sc-chart-metric" data-metric="revenue">Revenue</button>
                  <button class="px-2.5 py-1 rounded-lg transition ${metricKey === 'orders' ? 'bg-white text-[#334EAC] shadow-xs' : 'text-slate-600'}" data-action="sc-chart-metric" data-metric="orders">Orders</button>
                  <button class="px-2.5 py-1 rounded-lg transition ${metricKey === 'productsSold' ? 'bg-white text-[#334EAC] shadow-xs' : 'text-slate-600'}" data-action="sc-chart-metric" data-metric="productsSold">Units</button>
                </div>
                <select class="inp !w-auto !py-1 !px-2.5 !text-xs !font-bold" data-action="sc-chart-range">
                  <option value="today" ${SC.analyticsRange === 'today' ? 'selected' : ''}>Today</option>
                  <option value="7d" ${SC.analyticsRange === '7d' ? 'selected' : ''}>7 Days</option>
                  <option value="30d" ${SC.analyticsRange === '30d' ? 'selected' : ''}>30 Days</option>
                  <option value="3m" ${SC.analyticsRange === '3m' ? 'selected' : ''}>3 Months</option>
                  <option value="6m" ${SC.analyticsRange === '6m' ? 'selected' : ''}>6 Months</option>
                </select>
              </div>
            </div>

            <!-- Dynamic Bar Chart Visualization -->
            <div class="pt-6 pb-2">
              <div class="flex items-end gap-3 h-52">
                ${values.map((v, i) => {
                  const pct = Math.max(10, Math.round((v / maxVal) * 100));
                  const label = chart.labels[i] || '';
                  const displayValue = metricKey === 'revenue' ? fmtMoney(v) : `${v} units`;
                  return `
                    <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      <div class="opacity-0 group-hover:opacity-100 transition absolute -top-8 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap z-20 pointer-events-none">
                        ${displayValue}
                      </div>
                      <div class="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#081F5C] to-[#334EAC] group-hover:to-[#7FB0FF] transition-all duration-300 shadow-sm" style="height: ${pct}%;"></div>
                      <span class="text-[10px] font-bold text-slate-500">${label}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Peak: <strong>${metricKey === 'revenue' ? fmtMoney(maxVal) : maxVal}</strong></span>
              <span class="text-emerald-600 font-bold flex items-center gap-1">
                <i data-lucide="shield-check" style="width:13px;height:13px"></i>
                <span>Automated settlement every Friday</span>
              </span>
            </div>
          </div>

          <!-- Marketplace Alerts & Notifications -->
          <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Action Items</span>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A] mt-0.5">Marketplace Alerts</h3>
              </div>
              <button class="text-xs font-bold text-[#334EAC] hover:underline" data-action="sc-toggle-notifications">View All</button>
            </div>

            <div class="space-y-2.5 my-3">
              <div class="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
                <span class="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
                  <i data-lucide="package-alert" style="width:16px;height:16px"></i>
                </span>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-xs text-[#92400E]">Low Stock Restock Warning</div>
                  <div class="text-[11px] text-amber-800/80 mt-0.5">Naruto Sage Mode Figure has only 5 units remaining in Lekki Warehouse.</div>
                  <a href="#/seller/inventory" class="text-[10px] font-extrabold text-[#B45309] underline mt-1 inline-block">Restock now</a>
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3">
                <span class="w-8 h-8 rounded-xl bg-rose-200/60 text-rose-800 flex items-center justify-center shrink-0">
                  <i data-lucide="alert-circle" style="width:16px;height:16px"></i>
                </span>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-xs text-[#991B1B]">Product Revision Required</div>
                  <div class="text-[11px] text-rose-800/80 mt-0.5">One Piece Box Set was rejected: Photos must clearly display packaging ISBN seal.</div>
                  <a href="#/seller/products" class="text-[10px] font-extrabold text-[#991B1B] underline mt-1 inline-block">Fix & Resubmit</a>
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-[#E6F7EC] border border-[#A7F3D0] flex items-start gap-3">
                <span class="w-8 h-8 rounded-xl bg-emerald-200/60 text-emerald-800 flex items-center justify-center shrink-0">
                  <i data-lucide="badge-check" style="width:16px;height:16px"></i>
                </span>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-xs text-[#065F46]">Verified Seller Status Active</div>
                  <div class="text-[11px] text-emerald-800/80 mt-0.5">Your Tier-1 KYC verification is verified. Founding Seller #001 badge displayed.</div>
                </div>
              </div>
            </div>

            <!-- Quick Actions Grid -->
            <div class="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <a href="#/seller/inventory" class="p-2.5 rounded-xl border border-slate-100 bg-[#F8FAFC] hover:bg-[#E7F1FF] text-center font-bold text-xs text-slate-700 transition flex items-center justify-center gap-1.5">
                <i data-lucide="boxes" style="width:14px;height:14px;color:#334EAC"></i>
                <span>Inventory</span>
              </a>
              <a href="#/seller/reviews" class="p-2.5 rounded-xl border border-slate-100 bg-[#F8FAFC] hover:bg-[#E7F1FF] text-center font-bold text-xs text-slate-700 transition flex items-center justify-center gap-1.5">
                <i data-lucide="message-square" style="width:14px;height:14px;color:#334EAC"></i>
                <span>Q&A & Reviews</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Recent Orders Section -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Fulfillment Queue</span>
              <h3 class="font-display font-extrabold text-lg text-[#0F172A] mt-0.5">Recent Customer Orders</h3>
            </div>
            <a href="#/seller/orders" class="btn btn-ghost !px-3 !py-1.5 !text-xs font-bold text-[#334EAC]">
              <span>View All (${orders.length})</span>
              <i data-lucide="arrow-right" style="width:13px;height:13px"></i>
            </a>
          </div>

          <div class="overflow-x-auto mt-2">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th class="py-3 px-2">Order ID</th>
                  <th class="py-3 px-2">Product Item</th>
                  <th class="py-3 px-2">Buyer</th>
                  <th class="py-3 px-2">Qty</th>
                  <th class="py-3 px-2">Amount</th>
                  <th class="py-3 px-2">Payment</th>
                  <th class="py-3 px-2">Status</th>
                  <th class="py-3 px-2">Date</th>
                  <th class="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                ${recentOrders.map(o => {
                  const firstItem = (o.items && o.items[0]) || {};
                  return `
                    <tr class="hover:bg-[#F8FAFC] transition">
                      <td class="py-3 px-2 font-mono font-bold text-[#334EAC]">${o.id}</td>
                      <td class="py-3 px-2">
                        <div class="flex items-center gap-2.5 max-w-xs">
                          <img src="${firstItem.productImage || ''}" alt="" class="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                          <div class="min-w-0">
                            <div class="font-bold text-[#0F172A] truncate">${firstItem.productName || 'Anime Item'}</div>
                            <div class="text-[10px] text-slate-400 truncate">${firstItem.variant || 'Standard'}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-2 text-slate-600 font-medium">${o.buyer ? o.buyer.name : 'Customer'}</td>
                      <td class="py-3 px-2 font-bold text-slate-700">${firstItem.quantity || 1}</td>
                      <td class="py-3 px-2 font-extrabold text-[#0F172A]">${fmtMoney(o.netProductTotal || o.subtotal)}</td>
                      <td class="py-3 px-2">
                        <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClasses(o.paymentStatus)}">
                          ${o.paymentStatus}
                        </span>
                      </td>
                      <td class="py-3 px-2">
                        <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClasses(o.orderStatus)}">
                          ${o.orderStatus}
                        </span>
                      </td>
                      <td class="py-3 px-2 text-slate-400 text-[11px]">${fmtDate(o.date)}</td>
                      <td class="py-3 px-2 text-right">
                        <button class="btn btn-ghost !px-2.5 !py-1 !text-xs font-bold text-[#334EAC]" data-action="sc-view-order-details" data-order-id="${o.id}">
                          View
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 2: ORDERS MANAGEMENT
  // =========================================================================
  async function renderOrdersView() {
    const orders = await window.orderService.getOrders({
      status: SC.orderFilter,
      search: SC.searchQuery
    });

    const tabs = ['All', 'New', 'Confirmed', 'Processing', 'Ready to Ship', 'Shipped', 'Delivered', 'Cancelled', 'Returns', 'Refunds'];

    return `
      <div class="space-y-5">
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Order Management</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Orders & Fulfillment</h2>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative w-full md:w-64">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style="width:14px;height:14px"></i>
                <input class="inp !pl-9 !py-1.5 !text-xs" placeholder="Search Order ID, Buyer, SKU..." value="${SC.searchQuery}" data-action="sc-orders-search" />
              </div>
            </div>
          </div>

          <!-- Status Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
            ${tabs.map(tab => `
              <button class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${SC.orderFilter === tab ? 'bg-[#334EAC] text-white shadow-sm' : 'bg-[#F8FAFC] text-slate-600 hover:bg-[#E7F1FF] hover:text-[#334EAC]'}" data-action="sc-orders-filter" data-filter="${tab}">
                ${tab}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Orders Table / List -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm overflow-hidden">
          ${orders.length ? `
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th class="py-3 px-3">Order ID</th>
                    <th class="py-3 px-3">Product & Variant</th>
                    <th class="py-3 px-3">Buyer & Destination</th>
                    <th class="py-3 px-3">Amount</th>
                    <th class="py-3 px-3">Marketplace Fee</th>
                    <th class="py-3 px-3">Seller Net</th>
                    <th class="py-3 px-3">Status</th>
                    <th class="py-3 px-3 text-right">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                  ${orders.map(o => {
                    const it = (o.items && o.items[0]) || {};
                    return `
                      <tr class="hover:bg-[#F8FAFC] transition">
                        <td class="py-3 px-3">
                          <div class="font-mono font-bold text-[#334EAC]">${o.id}</div>
                          <div class="text-[10px] text-slate-400 mt-0.5">${fmtDate(o.date)}</div>
                        </td>
                        <td class="py-3 px-3">
                          <div class="flex items-center gap-2.5 max-w-sm">
                            <img src="${it.productImage || ''}" alt="" class="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0" />
                            <div class="min-w-0">
                              <div class="font-bold text-[#0F172A] truncate">${it.productName || 'Product'}</div>
                              <div class="text-[10px] text-slate-400 truncate">Variant: ${it.variant || 'Standard'} · SKU: ${it.sku || 'ANL'}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-3">
                          <div class="font-bold text-[#0F172A]">${o.buyer ? o.buyer.name : 'Buyer'}</div>
                          <div class="text-[10px] text-slate-500">${o.buyer ? o.buyer.state : 'Nigeria'} · ${o.buyer ? o.buyer.phone : ''}</div>
                        </td>
                        <td class="py-3 px-3">
                          <div class="font-extrabold text-[#0F172A]">${fmtMoney(o.netProductTotal || o.subtotal)}</div>
                          <div class="text-[10px] text-slate-400">+ ${fmtMoney(o.shippingFee)} ship</div>
                        </td>
                        <td class="py-3 px-3 font-mono text-slate-500">-${fmtMoney(o.marketplaceCommission)}</td>
                        <td class="py-3 px-3 font-extrabold text-[#10B981]">${fmtMoney(o.sellerEarnings)}</td>
                        <td class="py-3 px-3">
                          <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClasses(o.orderStatus)}">
                            ${o.orderStatus}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <div class="flex items-center justify-end gap-1.5 flex-wrap">
                            <button class="btn btn-ghost !px-2.5 !py-1 !text-xs font-bold text-[#334EAC]" data-action="sc-view-order-details" data-order-id="${o.id}">
                              Details
                            </button>
                            ${o.orderStatus === 'New' ? `
                              <button class="btn btn-primary !px-2.5 !py-1 !text-xs font-bold" data-action="sc-order-confirm" data-order-id="${o.id}">Confirm</button>
                            ` : o.orderStatus === 'Confirmed' ? `
                              <button class="btn btn-primary !px-2.5 !py-1 !text-xs font-bold" data-action="sc-order-process" data-order-id="${o.id}">Pack & Process</button>
                            ` : o.orderStatus === 'Processing' ? `
                              <button class="btn btn-primary !px-2.5 !py-1 !text-xs font-bold" data-action="sc-order-ready" data-order-id="${o.id}">Ready to Ship</button>
                            ` : o.orderStatus === 'Ready to Ship' ? `
                              <button class="btn !bg-emerald-600 !text-white hover:!bg-emerald-700 !px-2.5 !py-1 !text-xs font-bold" data-action="sc-order-ship-modal" data-order-id="${o.id}">Add Tracking</button>
                            ` : o.orderStatus === 'Shipped' ? `
                              <button class="btn btn-ghost !px-2.5 !py-1 !text-xs font-bold text-emerald-700" data-action="sc-order-delivered" data-order-id="${o.id}">Mark Delivered</button>
                            ` : o.orderStatus === 'Returns' ? `
                              <button class="btn btn-ghost !px-2.5 !py-1 !text-xs font-bold text-amber-700" data-action="sc-order-return-modal" data-order-id="${o.id}">Inspect Return</button>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : renderEmptyState('No orders found', `There are no customer orders under the "${SC.orderFilter}" tab matching your criteria.`, null, null, 'shopping-bag')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 3: PRODUCTS MANAGEMENT
  // =========================================================================
  async function renderProductsView() {
    const products = await window.productService.getProducts({
      status: SC.productFilter,
      search: SC.searchQuery
    });

    const tabs = ['All', 'Active', 'Drafts', 'Pending Approval', 'Approved', 'Rejected', 'Out of Stock', 'Archived'];

    return `
      <div class="space-y-5">
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Marketplace Catalog</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Product Management</h2>
              <p class="text-xs text-slate-500 mt-1">Submitted products undergo administrative compliance review before public display.</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative w-full md:w-64">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style="width:14px;height:14px"></i>
                <input class="inp !pl-9 !py-1.5 !text-xs" placeholder="Search product or SKU..." value="${SC.searchQuery}" data-action="sc-products-search" />
              </div>
              <button class="btn btn-primary !px-4 !py-2 !text-xs font-bold shrink-0" data-action="sc-nav-add-product">
                <i data-lucide="plus" style="width:15px;height:15px"></i>
                <span>Add Product</span>
              </button>
            </div>
          </div>

          <!-- Status Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
            ${tabs.map(tab => `
              <button class="px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${SC.productFilter === tab ? 'bg-[#334EAC] text-white shadow-sm' : 'bg-[#F8FAFC] text-slate-600 hover:bg-[#E7F1FF] hover:text-[#334EAC]'}" data-action="sc-products-filter" data-filter="${tab}">
                ${tab}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Products Grid -->
        ${products.length ? `
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${products.map(p => {
              const mainImg = (p.images && p.images[0]);
              const isRejected = p.approvalStatus === 'Rejected';
              const isPending = p.approvalStatus === 'Pending Approval';
              const isDraft = p.approvalStatus === 'Draft';
              const isArchived = p.approvalStatus === 'Archived';

              return `
                <div class="rounded-3xl border border-white/60 bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between ${isRejected ? 'ring-2 ring-rose-400' : ''}">
                  <div>
                    <div class="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 mb-3 border border-slate-100">
                      <img src="${mainImg}" alt="${p.name}" class="w-full h-full object-cover" />
                      <span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-xs ${badgeClasses(p.approvalStatus)}">
                        ${p.approvalStatus}
                      </span>
                      ${p.discount > 0 ? `<span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#9BC7FF] text-[#081F5C] text-[10px] font-extrabold">-${p.discount}%</span>` : ''}
                      <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-mono backdrop-blur-xs">${p.sku}</span>
                    </div>

                    <div class="text-[10px] font-bold text-[#334EAC] uppercase tracking-wider">${p.category}</div>
                    <h3 class="font-display font-bold text-sm text-[#0F172A] mt-1 line-clamp-2 leading-snug" title="${p.name}">${p.name}</h3>

                    <!-- Price and Stock -->
                    <div class="mt-3 flex items-baseline justify-between">
                      <div class="flex items-baseline gap-1.5">
                        <span class="font-display font-extrabold text-base text-[#081F5C]">${fmtMoney(p.salePrice || p.price)}</span>
                        ${p.discount > 0 ? `<span class="text-xs line-through text-slate-400">${fmtMoney(p.price)}</span>` : ''}
                      </div>
                      <span class="text-xs font-bold ${p.stock <= 5 ? 'text-amber-600' : 'text-slate-600'}">
                        ${p.stock} in stock
                      </span>
                    </div>

                    <!-- Rejection Alert Callout if product was rejected -->
                    ${isRejected ? `
                      <div class="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                        <div class="font-bold flex items-center gap-1 text-rose-900">
                          <i data-lucide="alert-circle" style="width:12px;height:12px"></i>
                          <span>Rejection Reason:</span>
                        </div>
                        <p class="mt-1 leading-snug text-rose-700">${p.rejectionReason || 'Please review image and description specifications.'}</p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Action Buttons -->
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                    ${isRejected ? `
                      <button class="btn btn-primary !w-full !py-1.5 !text-xs font-bold" data-action="sc-product-resubmit-modal" data-product-id="${p.id}">
                        <i data-lucide="rotate-cw" style="width:13px;height:13px"></i>
                        <span>Resubmit Product</span>
                      </button>
                    ` : isDraft ? `
                      <button class="btn btn-primary !py-1.5 !px-2.5 !text-xs font-bold" data-action="sc-product-submit" data-product-id="${p.id}">Submit</button>
                      <button class="btn btn-ghost !py-1.5 !px-2 !text-xs text-rose-600 hover:bg-rose-50" data-action="sc-product-delete" data-product-id="${p.id}" title="Delete product"><i data-lucide="trash-2" style="width:13px;height:13px"></i> Delete</button>
                    ` : isPending ? `
                      <span class="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                        <i data-lucide="hourglass" style="width:12px;height:12px"></i>
                        <span>Under Admin Review</span>
                      </span>
                    ` : `
                      <button class="btn btn-ghost !py-1.5 !px-2.5 !text-xs font-bold text-[#334EAC]" data-action="sc-product-edit" data-product-id="${p.id}"><i data-lucide="pencil" style="width:13px;height:13px"></i> Edit</button>
                    `}

                    <div class="flex items-center gap-1 ml-auto">
                      <button class="btn btn-ghost !py-1.5 !px-2 !text-xs" data-action="sc-product-duplicate" data-product-id="${p.id}" title="Duplicate listing"><i data-lucide="copy" style="width:13px;height:13px"></i> Duplicate</button>
                      ${isArchived ? `
                        <button class="btn btn-ghost !py-1.5 !px-2 !text-xs text-emerald-600" data-action="sc-product-restore" data-product-id="${p.id}" title="Restore listing"><i data-lucide="refresh-ccw" style="width:13px;height:13px"></i> Restore</button>
                      ` : `
                        <button class="btn btn-ghost !py-1.5 !px-2 !text-xs" data-action="sc-product-archive" data-product-id="${p.id}" title="Archive listing"><i data-lucide="archive" style="width:13px;height:13px"></i> Archive</button>
                      `}
                      <a href="#/product/${p.slug || p.id}" class="p-1.5 rounded-lg text-slate-400 hover:bg-[#E7F1FF] hover:text-[#334EAC]" title="View public product page">
                        <i data-lucide="external-link" style="width:14px;height:14px"></i>
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : renderEmptyState('No products in this view', `No listings found in the "${SC.productFilter}" category.`, 'Add your first product', 'sc-nav-add-product', 'package')}
      </div>
    `;
  }

  // =========================================================================
  // VIEW 4: ADD PRODUCT WORKFLOW (14-STEP MULTI-STEP WIZARD)
  // =========================================================================
  function renderAddProductWizard() {
    const step = SC.wizardStep;
    const w = SC.wizardData;

    const steps = [
      { num: 1, label: 'Photos' },
      { num: 2, label: 'Basic Info' },
      { num: 3, label: 'Category' },
      { num: 4, label: 'Description' },
      { num: 5, label: 'Pricing' },
      { num: 6, label: 'Colors' },
      { num: 7, label: 'Sizes' },
      { num: 8, label: 'Variants' },
      { num: 9, label: 'Inventory' },
      { num: 10, label: 'Shipping' },
      { num: 11, label: 'Preview' },
      { num: 12, label: 'Submit' }
    ];

    // Compute preview price
    const baseP = Number(w.price || 0);
    const disc = Number(w.discount || 0);
    const saleP = disc > 0 ? Math.round(baseP * (1 - disc / 100)) : baseP;

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Wizard Header -->
        <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Product Creation Engine</span>
              <h2 class="font-display font-extrabold text-2xl text-[#0F172A] mt-0.5">Add New Marketplace Listing</h2>
            </div>
            <a href="#/seller/products" class="btn btn-ghost !px-3 !py-1.5 !text-xs font-bold text-slate-500">
              <i data-lucide="x" style="width:14px;height:14px"></i>
              <span>Cancel</span>
            </a>
          </div>

          <!-- Step Indicator Chips -->
          <div class="flex items-center gap-2 overflow-x-auto pt-4 pb-1 no-scrollbar">
            ${steps.map(s => `
              <button class="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${step === s.num ? 'bg-[#334EAC] text-white shadow-sm' : step > s.num ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}" data-action="sc-wizard-jump" data-step="${s.num}">
                <span>${s.num}.</span>
                <span>${s.label}</span>
                ${step > s.num ? '<i data-lucide="check" style="width:12px;height:12px"></i>' : ''}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Wizard Step Body -->
        <div class="rounded-3xl border border-white/60 bg-white p-6 md:p-8 shadow-sm">
          ${step === 1 ? `
            <!-- Step 1: Photos -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 1: Product Photos</h3>
                <p class="text-xs text-slate-500 mt-1">Upload high-resolution anime figure, apparel, or merch photography. First photo serves as marketplace cover.</p>
              </div>

              <div class="grid sm:grid-cols-3 gap-3 pt-2">
                ${w.images.map((img, i) => `
                  <div class="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 ${i === 0 ? 'border-[#334EAC] ring-2 ring-[#334EAC]/20' : 'border-slate-200'} bg-slate-50 group">
                    <img src="${img}" alt="" class="w-full h-full object-cover" />
                    ${i === 0 ? '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#334EAC] text-white text-[9px] font-extrabold uppercase">Primary Cover</span>' : ''}
                    <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button class="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700" data-action="sc-wizard-remove-photo" data-idx="${i}" title="Remove"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
                      ${i !== 0 ? `<button class="btn btn-ghost !text-white !p-1.5 !text-[10px]" data-action="sc-wizard-make-primary" data-idx="${i}">Set Primary</button>` : ''}
                    </div>
                  </div>
                `).join('')}

                <!-- Add image box -->
                <label class="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center hover:bg-[#E7F1FF] transition cursor-pointer">
                  <i data-lucide="image-plus" style="width:24px;height:24px;color:#334EAC"></i>
                  <span class="text-xs font-bold text-[#334EAC] mt-2">+ Add Product Photo</span>
                  <span class="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 2MB</span>
                  <input type="file" accept="image/*" multiple data-sc-wizard-photo-input class="hidden" />
                </label>
              </div>
            </div>
          ` : step === 2 ? `
            <!-- Step 2: Basic Info -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 2: Basic Information</h3>
                <p class="text-xs text-slate-500 mt-1">Specify official product title, manufacturer brand, and short summary.</p>
              </div>
              <div class="space-y-3 pt-2">
                <div>
                  <label class="lbl">Product Title *</label>
                  <input class="inp" placeholder="e.g. Monkey D. Luffy Gear 5 Masterpiece PVC Figure" value="${w.name}" data-action="sc-wizard-input" data-field="name" />
                </div>
                <div>
                  <label class="lbl">Brand / Manufacturer</label>
                  <input class="inp" placeholder="e.g. Megahouse / Bandai Spirits / Kotobukiya" value="${w.brand}" data-action="sc-wizard-input" data-field="brand" />
                </div>
                <div>
                  <label class="lbl">Short Description (1-2 sentences for search cards) *</label>
                  <input class="inp" placeholder="e.g. Authentic 24cm Japanese import figure with aura lightning effect and acrylic stand." value="${w.shortDescription}" data-action="sc-wizard-input" data-field="shortDescription" />
                </div>
              </div>
            </div>
          ` : step === 3 ? `
            <!-- Step 3: Category -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 3: Marketplace Category</h3>
                <p class="text-xs text-slate-500 mt-1">Pick the exact anime department and sub-genre for buyer catalog discovery.</p>
              </div>
              <div class="grid sm:grid-cols-2 gap-3 pt-2">
                ${[
                  'Figures & Collectibles',
                  'Clothing & Apparel',
                  'Manga & Books',
                  'Posters & Wall Art',
                  'Accessories',
                  'Cosplay'
                ].map(cat => `
                  <button class="p-4 rounded-2xl border text-left transition flex items-center justify-between ${w.category === cat ? 'border-[#334EAC] bg-[#E7F1FF] ring-2 ring-[#334EAC]/20' : 'border-slate-200 bg-white hover:bg-slate-50'}" data-action="sc-wizard-set-category" data-cat="${cat}">
                    <div>
                      <div class="font-bold text-sm text-[#0F172A]">${cat}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">ANILyfe curated anime catalog</div>
                    </div>
                    ${w.category === cat ? '<i data-lucide="check-circle-2" style="width:18px;height:18px;color:#334EAC"></i>' : ''}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : step === 4 ? `
            <!-- Step 4: Full Description -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 4: Product Specifications & Details</h3>
                <p class="text-xs text-slate-500 mt-1">Provide comprehensive materials, dimensions, packaging details, and care instructions.</p>
              </div>
              <div class="pt-2">
                <textarea class="inp min-h-[180px] font-sans text-sm leading-relaxed" placeholder="Detailed product specifications, materials used (PVC, French terry, foil paper), included accessories, box dimensions, and authenticity notes..." data-action="sc-wizard-input" data-field="description">${w.description || ''}</textarea>
              </div>
            </div>
          ` : step === 5 ? `
            <!-- Step 5: Pricing -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 5: Pricing & Discounts</h3>
                <p class="text-xs text-slate-500 mt-1">Set base listing price in Naira (₦) and optional promotional discounts.</p>
              </div>
              <div class="grid sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label class="lbl">Base Price (₦) *</label>
                  <input type="number" class="inp font-mono font-bold" placeholder="25000" value="${w.price}" data-action="sc-wizard-input" data-field="price" />
                </div>
                <div>
                  <label class="lbl">Discount (%)</label>
                  <input type="number" class="inp font-mono" placeholder="0" value="${w.discount}" data-action="sc-wizard-input" data-field="discount" />
                </div>
                <div>
                  <label class="lbl">Final Sale Price</label>
                  <div class="p-2.5 rounded-xl bg-slate-100 font-mono font-extrabold text-base text-[#081F5C]">${fmtMoney(saleP)}</div>
                </div>
              </div>
              <div class="p-4 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF] text-xs text-[#334EAC]">
                <strong>ANILyfe 15% Platform Commission:</strong> Upon item sale at ${fmtMoney(saleP)}, estimated marketplace fee is <strong>${fmtMoney(saleP * 0.15)}</strong> and estimated seller net earnings are <strong>${fmtMoney(saleP * 0.85)}</strong>.
              </div>
            </div>
          ` : step === 6 ? `
            <!-- Step 6: Colors -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 6: Color Variants</h3>
                <p class="text-xs text-slate-500 mt-1">Add available colorways (e.g. Onyx Black, Chalk White, Celestial Gold).</p>
              </div>
              <div class="flex flex-wrap gap-2 pt-2">
                ${w.colors.map((c, idx) => `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7F1FF] border border-[#D0E3FF] text-[#334EAC] font-bold text-xs">
                    <span>${c}</span>
                    <button class="hover:text-rose-600" data-action="sc-wizard-remove-color" data-idx="${idx}"><i data-lucide="x" style="width:12px;height:12px"></i></button>
                  </span>
                `).join('')}
              </div>
              <div class="flex gap-2 max-w-sm pt-2">
                <input id="newColorInput" class="inp !py-1.5 !text-xs" placeholder="Add another color..." />
                <button class="btn btn-ghost !py-1.5 !px-3 !text-xs font-bold text-[#334EAC]" data-action="sc-wizard-add-color">+ Add</button>
              </div>
            </div>
          ` : step === 7 ? `
            <!-- Step 7: Sizes -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 7: Sizing Options</h3>
                <p class="text-xs text-slate-500 mt-1">Select garment or collectible scale sizes.</p>
              </div>
              <div class="flex flex-wrap gap-2 pt-2">
                ${['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Standard (24cm)', 'A3', 'A2'].map(sz => {
                  const hasSz = w.sizes.includes(sz);
                  return `
                    <button class="px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition ${hasSz ? 'bg-[#334EAC] text-white border-[#334EAC]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}" data-action="sc-wizard-toggle-size" data-size="${sz}">
                      ${sz}
                    </button>
                  `;
                }).join('')}
              </div>
              <div class="mt-4 p-4 rounded-2xl border border-[#D0E3FF] bg-[#F8FAFC]"><div class="font-bold text-sm">Custom frame / wall-art dimensions (inches)</div><div class="grid grid-cols-3 gap-2 mt-3"><input class="inp" type="number" step="0.01" min="0" placeholder="Width" data-action="sc-wizard-input" data-field="dimensionWidth" value="${w.dimensions?.width||''}"><input class="inp" type="number" step="0.01" min="0" placeholder="Height" data-action="sc-wizard-input" data-field="dimensionHeight" value="${w.dimensions?.height||''}"><input class="inp" type="number" step="0.01" min="0" placeholder="Depth" data-action="sc-wizard-input" data-field="dimensionDepth" value="${w.dimensions?.depth||''}"></div></div>
            </div>
          ` : step === 8 ? `
            <!-- Step 8: Generated Variants Matrix -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 8: Variant Matrix</h3>
                  <p class="text-xs text-slate-500 mt-1">Combinations of selected Colors and Sizes with individual SKU, price and stock.</p>
                </div>
                <button class="btn btn-ghost !px-3 !py-1.5 !text-xs font-bold text-[#334EAC]" data-action="sc-wizard-regenerate-variants">
                  <i data-lucide="refresh-cw" style="width:13px;height:13px"></i>
                  <span>Regenerate Matrix</span>
                </button>
              </div>

              <div class="space-y-2 pt-2">
                ${w.colors.map(c => w.sizes.map(s => `
                  <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div class="font-bold text-[#0F172A] w-40">${c} / ${s}</div>
                    <div class="flex items-center gap-2">
                      <span class="text-slate-400 font-mono text-[10px]">SKU:</span>
                      <input class="inp !py-1 !px-2 !w-32 !text-xs font-mono" value="ANL-${c.slice(0,3).toUpperCase()}-${s.slice(0,2).toUpperCase()}" />
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-slate-400 text-[10px]">Stock:</span>
                      <input type="number" class="inp !py-1 !px-2 !w-20 !text-xs font-bold" value="5" />
                    </div>
                    <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">Active</span>
                  </div>
                `).join('')).join('')}
              </div>
            </div>
          ` : step === 9 ? `
            <!-- Step 9: Inventory -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 9: Inventory & Thresholds</h3>
                <p class="text-xs text-slate-500 mt-1">Configure aggregate initial stock and low-stock alert trigger.</p>
              </div>
              <div class="grid sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label class="lbl">Total Units *</label>
                  <input type="number" class="inp font-bold" value="${w.stock}" data-action="sc-wizard-input" data-field="stock" />
                </div>
                <div>
                  <label class="lbl">Low Stock Alert Threshold</label>
                  <input type="number" class="inp font-bold" value="${w.lowStockThreshold}" data-action="sc-wizard-input" data-field="lowStockThreshold" />
                </div>
                <div>
                  <label class="lbl">Master Item SKU</label>
                  <input class="inp font-mono" placeholder="ANL-LFY-01" value="${w.sku || 'ANL-' + Date.now().toString(36).slice(-5).toUpperCase()}" data-action="sc-wizard-input" data-field="sku" />
                </div>
              </div>
            </div>
          ` : step === 10 ? `
            <!-- Step 10: Shipping Preferences -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 10: Packaging & Shipping Preferences</h3>
                <p class="text-xs text-slate-500 mt-1">Set physical weight and packaging requirements.</p>
              </div>
              <div class="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label class="lbl">Estimated Weight (kg)</label>
                  <input type="number" step="0.1" class="inp" value="${w.weightKg}" data-action="sc-wizard-input" data-field="weightKg" />
                </div>
                <div>
                  <label class="lbl">Estimated Dispatch Lead Time</label>
                  <select class="inp">
                    <option>1-2 business days</option>
                    <option>2-3 business days</option>
                    <option>3-5 business days</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-3 rounded-2xl border border-slate-200 bg-slate-50">
                    <input type="checkbox" ${w.fragile ? 'checked' : ''} class="w-4 h-4 text-[#334EAC] rounded" />
                    <span>Fragile Collectible — Requires anti-shock bubble cushioning & rigid shipping carton</span>
                  </label>
                </div>
              </div>
            </div>
          ` : step === 11 ? `
            <!-- Step 11: Live Preview -->
            <div class="space-y-4">
              <div>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A]">Step 11: Customer-Facing Listing Preview</h3>
                <p class="text-xs text-slate-500 mt-1">Review how your listing appears to anime buyers on the marketplace before submission.</p>
              </div>

              <!-- Product Card Preview Preview -->
              <div class="max-w-sm mx-auto p-4 rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative mb-3">
                  <img src="${(w.images && w.images[0]) || ''}" alt="" class="w-full h-full object-cover" />
                  <span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#334EAC] text-white text-[10px] font-extrabold">${w.category}</span>
                  ${w.discount > 0 ? `<span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#9BC7FF] text-[#081F5C] text-[10px] font-extrabold">-${w.discount}%</span>` : ''}
                </div>
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${w.brand || 'Anime Collectible'}</div>
                <h4 class="font-display font-bold text-sm text-[#0F172A] mt-1 line-clamp-2">${w.name || 'Untitled Anime Collectible'}</h4>
                <div class="mt-2.5 flex items-baseline justify-between">
                  <span class="font-display font-extrabold text-base text-[#081F5C]">${fmtMoney(saleP)}</span>
                  <span class="text-xs text-slate-500 font-bold">In Stock</span>
                </div>
                <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Seller information</span>
                  <span class="text-[#047857] font-bold">Verified</span>
                </div>
              </div>
            </div>
          ` : `
            <!-- Step 12: Final Submission -->
            <div class="space-y-4 text-center max-w-lg mx-auto py-6">
              <div class="w-16 h-16 rounded-3xl bg-[#E7F1FF] text-[#334EAC] flex items-center justify-center mx-auto mb-3">
                <i data-lucide="shield-check" style="width:32px;height:32px"></i>
              </div>
              <h3 class="font-display font-extrabold text-xl text-[#0F172A]">Ready for Marketplace Submission</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Upon clicking <strong>Submit for Approval</strong>, this listing will enter the <strong>Pending Approval</strong> state. The ANILyfe admin team reviews image fidelity, authenticity seals, and accurate sizing before the product goes live.
              </p>
              <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button class="btn btn-ghost !w-full sm:!w-auto !py-2.5 !px-5 text-xs font-bold" data-action="sc-wizard-save-draft">
                  <i data-lucide="save" style="width:15px;height:15px"></i>
                  <span>Save as Draft</span>
                </button>
                <button class="btn btn-primary !w-full sm:!w-auto !py-2.5 !px-6 text-xs font-extrabold shadow-lg" data-action="sc-wizard-submit-approval">
                  <i data-lucide="send" style="width:15px;height:15px"></i>
                  <span>Submit for Approval</span>
                </button>
              </div>
            </div>
          `}

          <!-- Wizard Step Navigation Controls -->
          <div class="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
            <button class="btn btn-ghost !px-4 !py-2 !text-xs font-bold text-slate-500 ${step === 1 ? 'opacity-30 pointer-events-none' : ''}" data-action="sc-wizard-prev">
              <i data-lucide="arrow-left" style="width:14px;height:14px"></i>
              <span>Previous Step</span>
            </button>
            ${step < 12 ? `
              <button class="btn btn-primary !px-5 !py-2 !text-xs font-bold" data-action="sc-wizard-next">
                <span>Next Step</span>
                <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 5: INVENTORY MANAGEMENT
  // =========================================================================
  async function renderInventoryView() {
    const summary = await window.inventoryService.getInventorySummary();
    const items = await window.inventoryService.getInventoryItems({
      search: SC.searchQuery
    });

    return `
      <div class="space-y-5">
        <!-- Header & Summary Cards -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Stock Logistics</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Inventory & SKU Control</h2>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-ghost !px-3 !py-2 !text-xs font-bold text-[#334EAC]" data-action="sc-open-inventory-history">
                <i data-lucide="history" style="width:14px;height:14px"></i>
                <span>Stock History Log</span>
              </button>
              <div class="relative w-full md:w-56">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" style="width:14px;height:14px"></i>
                <input class="inp !pl-9 !py-1.5 !text-xs" placeholder="Search SKU or item..." value="${SC.searchQuery}" data-action="sc-inventory-search" />
              </div>
            </div>
          </div>

          <!-- 5 Summary Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Products</span>
              <div class="font-display font-extrabold text-2xl text-[#0F172A] mt-1">${summary.totalProducts}</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Units</span>
              <div class="font-display font-extrabold text-2xl text-[#334EAC] mt-1">${summary.totalStock}</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Low Stock</span>
              <div class="font-display font-extrabold text-2xl text-amber-700 mt-1">${summary.lowStockCount}</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA]">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Out of Stock</span>
              <div class="font-display font-extrabold text-2xl text-rose-700 mt-1">${summary.outOfStockCount}</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF]">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Reserved Orders</span>
              <div class="font-display font-extrabold text-2xl text-[#334EAC] mt-1">${summary.reservedStock}</div>
            </div>
          </div>
        </div>

        <!-- Inventory Table -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th class="py-3 px-3">Product Listing</th>
                  <th class="py-3 px-3">Variant</th>
                  <th class="py-3 px-3">SKU</th>
                  <th class="py-3 px-3">Current Stock</th>
                  <th class="py-3 px-3">Reserved</th>
                  <th class="py-3 px-3">Available</th>
                  <th class="py-3 px-3">Threshold</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                ${items.map(it => `
                  <tr class="hover:bg-[#F8FAFC] transition">
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2.5 max-w-xs">
                        <img src="${it.productImage}" alt="" class="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                        <span class="font-bold text-[#0F172A] truncate" title="${it.productName}">${it.productName}</span>
                      </div>
                    </td>
                    <td class="py-3 px-3 text-slate-600 font-medium">${it.variantName}</td>
                    <td class="py-3 px-3 font-mono text-[#334EAC] font-bold">
                      <span>${it.sku}</span>
                      <button class="ml-1 text-slate-400 hover:text-[#334EAC]" data-action="sc-edit-sku-modal" data-product-id="${it.productId}" data-variant-id="${it.variantId || ''}" data-current-sku="${it.sku}" title="Edit SKU"><i data-lucide="edit-2" style="width:11px;height:11px"></i></button>
                    </td>
                    <td class="py-3 px-3 font-display font-extrabold text-sm text-[#0F172A]">${it.currentStock}</td>
                    <td class="py-3 px-3 text-slate-400 font-mono">${it.reserved}</td>
                    <td class="py-3 px-3 font-bold text-emerald-600">${it.available}</td>
                    <td class="py-3 px-3">
                      <span>${it.threshold}</span>
                      <button class="ml-1 text-slate-400 hover:text-[#334EAC]" data-action="sc-set-threshold-modal" data-product-id="${it.productId}" data-current-threshold="${it.threshold}" title="Change threshold"><i data-lucide="sliders" style="width:11px;height:11px"></i></button>
                    </td>
                    <td class="py-3 px-3">
                      <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClasses(it.status)}">
                        ${it.status}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700" data-action="sc-stock-delta" data-product-id="${it.productId}" data-variant-id="${it.variantId || ''}" data-delta="-1" title="Decrease by 1">-</button>
                        <button class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700" data-action="sc-stock-delta" data-product-id="${it.productId}" data-variant-id="${it.variantId || ''}" data-delta="1" title="Increase by 1">+</button>
                        <button class="btn btn-ghost !py-1 !px-2 !text-[11px] font-bold text-[#334EAC]" data-action="sc-stock-delta" data-product-id="${it.productId}" data-variant-id="${it.variantId || ''}" data-delta="5">+5</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 6: REVIEWS & QUESTIONS
  // =========================================================================
  async function renderReviewsView() {
    const reviews = await window.reviewService.getReviews(SC.reviewFilter);
    const questions = await window.reviewService.getQuestions(SC.questionFilter);

    const filterTabs = ['All', '5 stars', '4 stars', '3 stars', '2 stars', '1 star', 'Unanswered', 'Verified purchases', 'Reviews with photos'];

    return `
      <div class="space-y-6">
        <!-- Reviews Section -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Customer Feedback</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Product Reviews & Ratings</h2>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500">Overall Rating: <strong class="text-[#081F5C] font-extrabold">★ ${Number(seller.rating || 0)} / 5.0</strong></span>
            </div>
          </div>

          <!-- Filter chips -->
          <div class="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
            ${filterTabs.map(tab => `
              <button class="px-3 py-1 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${SC.reviewFilter === tab ? 'bg-[#334EAC] text-white shadow-xs' : 'bg-[#F8FAFC] text-slate-600 hover:bg-[#E7F1FF]'}" data-action="sc-reviews-filter" data-filter="${tab}">
                ${tab}
              </button>
            `).join('')}
          </div>

          <!-- Reviews Cards -->
          <div class="space-y-3 pt-2">
            ${reviews.length ? reviews.map(r => `
              <div class="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] hover:bg-white transition">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span class="font-bold text-xs text-[#0F172A]">${r.buyerName}</span>
                    <span class="text-[11px] text-slate-400 ml-2">on <strong>${r.productName}</strong></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-extrabold text-xs">★ ${r.rating}.0</span>
                    ${r.verifiedPurchase ? '<span class="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Verified Purchase</span>' : ''}
                    <span class="text-[10px] text-slate-400">${r.date}</span>
                  </div>
                </div>

                <p class="text-xs text-slate-600 mt-2 leading-relaxed">${r.reviewText}</p>

                ${r.photos && r.photos.length ? `
                  <div class="mt-2.5 flex gap-2">
                    ${r.photos.map(p => `
                      <img src="${p}" alt="" class="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Seller Response -->
                ${r.sellerResponse ? `
                  <div class="mt-3 p-3 rounded-xl bg-[#E7F1FF] border border-[#D0E3FF] text-xs text-[#081F5C]">
                    <div class="font-extrabold text-[10px] text-[#334EAC] uppercase tracking-wider">Seller Response:</div>
                    <p class="mt-0.5 leading-relaxed">${r.sellerResponse}</p>
                  </div>
                ` : `
                  <div class="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <button class="btn btn-primary !py-1 !px-3 !text-xs font-bold" data-action="sc-review-reply-modal" data-review-id="${r.id}">
                      <i data-lucide="message-square" style="width:13px;height:13px"></i>
                      <span>Reply to Customer</span>
                    </button>
                    <button class="text-[11px] font-bold text-slate-400 hover:text-rose-600" data-action="sc-review-report" data-review-id="${r.id}">Report Inappropriate</button>
                  </div>
                `}
              </div>
            `).join('') : renderEmptyState('No reviews to display', 'There are no customer reviews matching this filter.', null, null, 'star')}
          </div>
        </div>

        <!-- Product Questions Section (E-Commerce Q&A) -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Pre-Purchase Inquiries</span>
              <h3 class="font-display font-extrabold text-lg text-[#0F172A] mt-0.5">Product Questions & Answers</h3>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-3 py-1 rounded-xl text-xs font-bold ${SC.questionFilter === 'All' ? 'bg-[#334EAC] text-white' : 'bg-slate-100 text-slate-600'}" data-action="sc-questions-filter" data-filter="All">All</button>
              <button class="px-3 py-1 rounded-xl text-xs font-bold ${SC.questionFilter === 'Unanswered' ? 'bg-[#334EAC] text-white' : 'bg-slate-100 text-slate-600'}" data-action="sc-questions-filter" data-filter="Unanswered">Unanswered</button>
            </div>
          </div>

          <div class="space-y-3 pt-3">
            ${questions.map(q => `
              <div class="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC]">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-[#0F172A]">${q.buyerName} asked about <strong>${q.productName}</strong></span>
                  <span class="text-[10px] text-slate-400">${q.date}</span>
                </div>
                <p class="text-xs text-slate-700 mt-1.5 font-medium">Q: "${q.questionText}"</p>

                ${q.answerText ? `
                  <div class="mt-2.5 p-2.5 rounded-xl bg-[#E7F1FF] text-xs text-[#081F5C] leading-relaxed">
                    <span class="font-extrabold text-[#334EAC]">A: </span>${q.answerText}
                  </div>
                ` : `
                  <div class="mt-3">
                    <button class="btn btn-primary !py-1 !px-3 !text-xs font-bold" data-action="sc-question-answer-modal" data-question-id="${q.id}">
                      <i data-lucide="edit-3" style="width:13px;height:13px"></i>
                      <span>Answer Question</span>
                    </button>
                  </div>
                `}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 7: EARNINGS & PAYOUTS
  // =========================================================================
  async function renderEarningsView(seller) {
    const payouts = await window.payoutService.getOverview();

    return `
      <div class="space-y-6">
        <!-- Financial KPI Cards -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Financial Ledger</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Earnings & Payout Center</h2>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-primary !px-4 !py-2 !text-xs font-extrabold shadow-md" data-action="sc-open-payout-modal">
                <i data-lucide="wallet" style="width:15px;height:15px"></i>
                <span>Request Payout</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 pt-4">
            <div class="p-3.5 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF]">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Available Balance</span>
              <div class="font-display font-extrabold text-xl text-[#081F5C] mt-1">${fmtMoney(payouts.availableBalance)}</div>
              <span class="text-[10px] text-emerald-600 font-bold">Ready to withdraw</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Pending Balance</span>
              <div class="font-display font-extrabold text-xl text-amber-800 mt-1">${fmtMoney(payouts.pendingBalance)}</div>
              <span class="text-[10px] text-amber-600">Settling in 24h</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Lifetime GMV</span>
              <div class="font-display font-extrabold text-xl text-[#0F172A] mt-1">${fmtMoney(payouts.totalEarnings)}</div>
              <span class="text-[10px] text-slate-400">Gross sales</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Withdrawn</span>
              <div class="font-display font-extrabold text-xl text-slate-700 mt-1">${fmtMoney(payouts.totalWithdrawn)}</div>
              <span class="text-[10px] text-slate-400">To bank account</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Marketplace Fees</span>
              <div class="font-display font-extrabold text-xl text-slate-700 mt-1">${fmtMoney(payouts.totalMarketplaceFees)}</div>
              <span class="text-[10px] text-slate-400">${seller.commissionRate ? seller.commissionRate.rate : 15}% commission</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Refund Adjustments</span>
              <div class="font-display font-extrabold text-xl text-rose-700 mt-1">${fmtMoney(payouts.totalRefundAdjustments)}</div>
              <span class="text-[10px] text-slate-400">Processed returns</span>
            </div>
          </div>
        </div>

        ${Number(payouts.totalEarnings||0) <= 0 ? '<div class="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center"><div class="font-display font-bold text-lg text-[#0F172A]">No earnings to display</div><p class="text-sm text-slate-500 mt-1">Seller earnings will appear here after successful marketplace orders are settled.</p></div>' : ''}

        <!-- Bank Account & Payout Schedule Info -->
        <div class="grid md:grid-cols-2 gap-5">
          <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2 font-display font-bold text-sm text-[#0F172A]">
                <i data-lucide="building-2" style="width:16px;height:16px;color:#334EAC"></i>
                <span>Registered Settlement Bank</span>
              </div>
              <button class="text-xs font-bold text-[#334EAC] hover:underline" data-action="sc-edit-bank-modal">Edit Account</button>
            </div>
            <div class="mt-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <div class="font-bold text-sm text-[#0F172A]">${payouts.bankAccount.bankName}</div>
              <div class="font-mono text-xs text-slate-600 mt-1">Account Number: <strong>${payouts.bankAccount.accountNumber}</strong></div>
              <div class="text-xs text-slate-500 mt-0.5">Account Name: <strong>${payouts.bankAccount.accountName}</strong></div>
              <div class="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <i data-lucide="check-circle-2" style="width:13px;height:13px"></i>
                <span>NUBAN Verified for Direct Transfer</span>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2 font-display font-bold text-sm text-[#0F172A]">
                <i data-lucide="calendar" style="width:16px;height:16px;color:#334EAC"></i>
                <span>Payout Schedule & Automated Settlement</span>
              </div>
            </div>
            <div class="mt-3 space-y-2 text-xs text-slate-600">
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span>Current Frequency:</span>
                <span class="font-bold text-[#0F172A]">${payouts.schedule}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span>Next Automated Transfer:</span>
                <span class="font-bold text-[#334EAC]">Friday, Sept 11, 2026</span>
              </div>
              <div class="flex justify-between py-1">
                <span>Minimum Withdrawal Limit:</span>
                <span class="font-bold text-[#0F172A]">₦10,000</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction Ledger Table -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Itemized Ledger</span>
              <h3 class="font-display font-extrabold text-base text-[#0F172A] mt-0.5">Recent Marketplace Transactions</h3>
            </div>
            <button class="btn btn-ghost !px-3 !py-1.5 !text-xs font-bold text-[#334EAC]" data-action="sc-open-sales-report">
              <i data-lucide="download" style="width:13px;height:13px"></i>
              <span>Export CSV</span>
            </button>
          </div>

          <div class="overflow-x-auto mt-2">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th class="py-3 px-3">Order ID</th>
                  <th class="py-3 px-3">Gross Sale</th>
                  <th class="py-3 px-3">Discount</th>
                  <th class="py-3 px-3">Shipping</th>
                  <th class="py-3 px-3">Marketplace 15%</th>
                  <th class="py-3 px-3">Refund Adj.</th>
                  <th class="py-3 px-3">Seller Net</th>
                  <th class="py-3 px-3">Settlement Date</th>
                  <th class="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                ${payouts.transactions.map(tx => `
                  <tr class="hover:bg-[#F8FAFC] transition">
                    <td class="py-3 px-3 font-mono font-bold text-[#334EAC]">${tx.id}</td>
                    <td class="py-3 px-3 text-slate-700">${fmtMoney(tx.gross)}</td>
                    <td class="py-3 px-3 text-slate-400">${tx.discount ? `-${fmtMoney(tx.discount)}` : '—'}</td>
                    <td class="py-3 px-3 text-slate-700">+${fmtMoney(tx.shipping)}</td>
                    <td class="py-3 px-3 font-mono text-slate-500">-${fmtMoney(tx.commission)}</td>
                    <td class="py-3 px-3 font-mono ${tx.adjustment < 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}">${tx.adjustment ? fmtMoney(tx.adjustment) : '—'}</td>
                    <td class="py-3 px-3 font-display font-extrabold text-sm text-[#10B981]">${fmtMoney(tx.earnings)}</td>
                    <td class="py-3 px-3 text-slate-400">${tx.date}</td>
                    <td class="py-3 px-3 text-right">
                      <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClasses(tx.status)}">
                        ${tx.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payout Request History -->
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 class="font-display font-extrabold text-base text-[#0F172A] mb-3">Withdrawal Payout History</h3>
          <div class="space-y-2">
            ${payouts.history.map(po => `
              <div class="p-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-[#0F172A]">${fmtMoney(po.amount)} transferred to ${po.bank}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Ref: ${po.reference} · Requested ${fmtDate(po.requestedAt)}</div>
                </div>
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClasses(po.status)}">
                  ${po.status}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 8: ANALYTICS
  // =========================================================================
  async function renderAnalyticsView() {
    const data = await window.analyticsService.getOverview(SC.analyticsRange);

    return `
      <div class="space-y-6">
        <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Aggregated Metrics</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Marketplace Store Analytics</h2>
            </div>
            <div class="flex items-center gap-2">
              <select class="inp !w-auto !py-1.5 !px-3 !text-xs !font-bold" data-action="sc-analytics-range">
                <option value="today" ${SC.analyticsRange === 'today' ? 'selected' : ''}>Today</option>
                <option value="7d" ${SC.analyticsRange === '7d' ? 'selected' : ''}>Past 7 Days</option>
                <option value="30d" ${SC.analyticsRange === '30d' ? 'selected' : ''}>Past 30 Days</option>
                <option value="3m" ${SC.analyticsRange === '3m' ? 'selected' : ''}>Past 3 Months</option>
                <option value="6m" ${SC.analyticsRange === '6m' ? 'selected' : ''}>Past 6 Months</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Visits</span>
              <div class="font-display font-extrabold text-2xl text-[#0F172A] mt-1">${Number(data.kpis.storeViews).toLocaleString()}</div>
              <span class="text-[10px] text-emerald-600 font-bold">+14% vs last period</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Product Impressions</span>
              <div class="font-display font-extrabold text-2xl text-[#334EAC] mt-1">${Number(data.kpis.productViews).toLocaleString()}</div>
              <span class="text-[10px] text-slate-500">Across search & home</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Conversion Rate</span>
              <div class="font-display font-extrabold text-2xl text-[#10B981] mt-1">4.6%</div>
              <span class="text-[10px] text-slate-500">Industry avg: 2.8%</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Order Completion</span>
              <div class="font-display font-extrabold text-2xl text-[#0F172A] mt-1">${data.ordersBreakdown.completionRate}</div>
              <span class="text-[10px] text-slate-500">${data.ordersBreakdown.completed} of ${data.ordersBreakdown.total} orders</span>
            </div>
          </div>
        </div>

        <!-- Regional Distribution (Nigerian States) -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Nigerian States Trends -->
          <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Geographic Demand</span>
            <h3 class="font-display font-extrabold text-base text-[#0F172A] mt-0.5 mb-4">Customer Orders by Nigerian Region</h3>

            <div class="space-y-3">
              ${data.locationTrends.topStates.map(st => `
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="font-bold text-[#0F172A]">${st.state}</span>
                    <span class="font-mono text-slate-500">${st.orders} orders (${st.share})</span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-[#081F5C] to-[#334EAC]" style="width: ${st.share};"></div>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">${st.status}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Best Sellers & Products -->
          <div class="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Merchandise Performance</span>
            <h3 class="font-display font-extrabold text-base text-[#0F172A] mt-0.5 mb-4">Top-Selling Anime Products</h3>

            <div class="space-y-3">
              ${data.productPerformance.bestSellers.map((item, idx) => `
                <div class="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-lg bg-[#E7F1FF] text-[#334EAC] font-bold text-xs flex items-center justify-center">${idx + 1}</span>
                    <div>
                      <div class="font-bold text-xs text-[#0F172A]">${item.name}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5">${item.unitsSold} units · Conversion: ${item.conversionRate}</div>
                    </div>
                  </div>
                  <span class="font-extrabold text-xs text-[#081F5C]">${fmtMoney(item.revenue)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 9: DELIVERY & SHIPPING SETTINGS
  // =========================================================================
  async function renderDeliveryView() {
    const del = await window.deliveryService.getSettings();

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Logistics & Dispatch</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Delivery & Shipping Rules</h2>
              <p class="text-xs text-slate-500 mt-1">Configure same-state free shipping, nationwide courier fees, and warehouse dispatch points.</p>
            </div>
            <button class="btn btn-primary !px-4 !py-2 !text-xs font-bold" data-action="sc-save-delivery">
              <i data-lucide="save" style="width:14px;height:14px"></i>
              <span>Save Rules</span>
            </button>
          </div>

          <form id="scDeliveryForm" class="space-y-6 pt-4">
            <!-- Shipping Methods Toggles -->
            <div>
              <label class="lbl">Supported Delivery Channels</label>
              <div class="grid sm:grid-cols-3 gap-3">
                <label class="flex items-center gap-2 p-3.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] cursor-pointer text-xs font-bold text-[#0F172A]">
                  <input type="checkbox" name="localDelivery" ${del.localDelivery ? 'checked' : ''} class="w-4 h-4 text-[#334EAC] rounded" />
                  <span>Local Same-State Delivery</span>
                </label>
                <label class="flex items-center gap-2 p-3.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] cursor-pointer text-xs font-bold text-[#0F172A]">
                  <input type="checkbox" name="nationwideDelivery" ${del.nationwideDelivery ? 'checked' : ''} class="w-4 h-4 text-[#334EAC] rounded" />
                  <span>Nationwide Shipping (Nigeria)</span>
                </label>
                <label class="flex items-center gap-2 p-3.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] cursor-pointer text-xs font-bold text-[#0F172A]">
                  <input type="checkbox" name="pickupAvailable" ${del.pickupAvailable ? 'checked' : ''} class="w-4 h-4 text-[#334EAC] rounded" />
                  <span>Physical Store Pickup</span>
                </label>
              </div>
            </div>

            <!-- In-State Free Shipping Toggle (Key Requirement) -->
            <div class="p-4 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF]">
              <div class="flex items-start gap-3">
                <span class="w-8 h-8 rounded-xl bg-[#334EAC] text-white flex items-center justify-center shrink-0">
                  <i data-lucide="truck" style="width:16px;height:16px"></i>
                </span>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-display font-bold text-sm text-[#081F5C]">Free Shipping in Seller's Nigerian State</span>
                    <input type="checkbox" name="freeShippingInState" ${del.freeShippingInState ? 'checked' : ''} class="w-5 h-5 text-[#334EAC] rounded cursor-pointer" />
                  </div>
                  <p class="text-xs text-[#334EAC]/80 mt-1 leading-relaxed">
                    When enabled, buyers ordering from within <strong>${del.dispatchState}</strong> receive 100% Free Shipping during checkout. Orders outside ${del.dispatchState} are billed the nationwide shipping fee.
                  </p>
                </div>
              </div>
            </div>

            <!-- Rates and Locations -->
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Same-State Shipping Fee (₦) — if free shipping disabled</label>
                <input type="number" name="sameStateFee" class="inp font-mono" value="${del.sameStateFee}" />
              </div>
              <div>
                <label class="lbl">Outside-State Nationwide Fee (₦) *</label>
                <input type="number" name="outsideStateFee" class="inp font-mono font-bold" value="${del.outsideStateFee}" />
              </div>
              <div>
                <label class="lbl">Primary Dispatch Warehouse Location *</label>
                <input name="dispatchLocation" class="inp" value="${del.dispatchLocation}" />
              </div>
              <div>
                <label class="lbl">Estimated Packaging & Dispatch Lead Time</label>
                <input name="processingTime" class="inp" value="${del.processingTime}" />
              </div>
            </div>

            <!-- Instructions -->
            <div class="space-y-4">
              <div>
                <label class="lbl">Delivery Notes for Customers</label>
                <textarea name="deliveryInstructions" class="inp text-xs min-h-[80px]">${del.deliveryInstructions}</textarea>
              </div>
              <div>
                <label class="lbl">Pickup Instructions & Hours</label>
                <textarea name="pickupInstructions" class="inp text-xs min-h-[80px]">${del.pickupInstructions}</textarea>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
              <i data-lucide="shield-check" style="width:16px;height:16px;color:#10B981"></i>
              <span><strong>Backend Authority:</strong> Actual shipping totals during customer checkout are computed and verified server-side based on the verified delivery address.</span>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 10: MY STORE (STOREFRONT IDENTITY MANAGEMENT)
  // =========================================================================
  async function renderStoreView(seller) {
    const sf = await window.storeService.getStorefront();

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Public Marketplace Identity</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Storefront Configuration</h2>
              <p class="text-xs text-slate-500 mt-1">Manage brand banner, logo, public description, and merchant return policies.</p>
            </div>
            <div class="flex items-center gap-2">
              <a href="#/seller/store/preview" class="btn btn-ghost !px-3 !py-2 !text-xs font-bold text-[#334EAC]">
                <i data-lucide="eye" style="width:14px;height:14px"></i>
                <span>Preview Store</span>
              </a>
              <button class="btn btn-primary !px-4 !py-2 !text-xs font-bold" data-action="sc-save-store">
                <i data-lucide="save" style="width:14px;height:14px"></i>
                <span>Save Store</span>
              </button>
            </div>
          </div>

          <form id="scStoreForm" class="space-y-5 pt-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Marketplace Store Name *</label>
                <input name="storeName" class="inp font-bold" value="${seller.storeName}" />
              </div>
              <div>
                <label class="lbl">Store Slug (URL Identifier)</label>
                <div class="flex items-center">
                  <span class="px-3 py-2 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs font-mono text-slate-500">/store/</span>
                  <input name="slug" class="inp !rounded-l-none font-mono text-xs" value="${seller.slug || ''}" />
                </div>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Store Banner Photo</label>
                <input name="bannerFile" class="inp !p-2" type="file" accept="image/*" data-store-image="banner" />
                ${seller.banner ? `<div class="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"><img src="${seller.banner}" alt="Current store banner" class="w-full h-24 object-cover" /></div>` : '<div class="mt-2 text-[11px] text-slate-400">No banner uploaded yet.</div>'}
              </div>
              <div>
                <label class="lbl">Store Logo Photo</label>
                <input name="logoFile" class="inp !p-2" type="file" accept="image/*" data-store-image="logo" />
                ${seller.logo ? `<div class="mt-2 flex items-center gap-3"><img src="${seller.logo}" alt="Current store logo" class="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-50" /></div>` : '<div class="mt-2 text-[11px] text-slate-400">No logo uploaded yet.</div>'}
              </div>
            </div>

            <div>
              <label class="lbl">Store Description (Visible to shoppers on your public storefront) *</label>
              <textarea name="description" class="inp min-h-[90px] text-xs leading-relaxed">${seller.description}</textarea>
            </div>

            <div class="grid sm:grid-cols-3 gap-3">
              <div>
                <label class="lbl">State (Nigeria) *</label>
                <input name="state" class="inp" value="${seller.state}" />
              </div>
              <div>
                <label class="lbl">City / Area *</label>
                <input name="city" class="inp" value="${seller.city}" />
              </div>
              <div>
                <label class="lbl">Primary Category</label>
                <input name="category" class="inp" value="${seller.category}" />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Customer Support Phone</label>
                <input name="phone" class="inp" value="${seller.contact ? seller.contact.phone : ''}" />
              </div>
              <div>
                <label class="lbl">Customer Support Email</label>
                <input name="email" class="inp" value="${seller.contact ? seller.contact.email : ''}" />
              </div>
            </div>

            <div class="space-y-3 pt-2">
              <div>
                <label class="lbl">Return Policy *</label>
                <textarea name="returnPolicy" class="inp min-h-[70px] text-xs">${seller.returnPolicy}</textarea>
              </div>
              <div>
                <label class="lbl">Refund Policy *</label>
                <textarea name="refundPolicy" class="inp min-h-[70px] text-xs">${seller.refundPolicy}</textarea>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 11: PREVIEW STORE & PUBLIC STOREFRONT
  // =========================================================================
  async function renderPreviewStoreView(seller) {
    const sf = await window.storeService.getStorefront();
    const hasFounding = seller.foundingSellerActive && seller.foundingSellerNumber;

    return `
      <div class="space-y-6 max-w-6xl mx-auto">
        <!-- Preview Actions Bar -->
        <div class="rounded-2xl border border-white/60 bg-white p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="text-xs font-bold text-[#0F172A]">Live Customer Storefront Preview</span>
            <span class="text-[10px] text-slate-400 font-mono">/store/${seller.slug}</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="#/seller/store" class="btn btn-ghost !px-3 !py-1.5 !text-xs font-bold">
              <i data-lucide="edit-3" style="width:13px;height:13px"></i>
              <span>Edit Store</span>
            </a>
            <button class="btn btn-primary !px-3.5 !py-1.5 !text-xs font-bold" data-action="sc-share-store-link">
              <i data-lucide="share-2" style="width:13px;height:13px"></i>
              <span>Share Store</span>
            </button>
            <a href="#/seller/dashboard" class="btn btn-ghost !px-3 !py-1.5 !text-xs font-bold text-slate-500">
              <i data-lucide="arrow-left" style="width:13px;height:13px"></i>
              <span>Back to Dashboard</span>
            </a>
          </div>
        </div>

        <!-- Storefront Hero Banner -->
        <div class="relative rounded-3xl overflow-hidden border border-[#D0E3FF] shadow-lg min-h-[260px] flex flex-col justify-end">
          <img src="${seller.banner}" alt="${seller.storeName}" class="absolute inset-0 w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#081F5C] via-[#081F5C]/75 to-transparent"></div>

          <div class="relative z-10 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="flex items-start sm:items-center gap-4">
              <img src="${seller.logo}" alt="" class="w-20 h-20 rounded-2xl object-cover border-2 border-white/60 shadow-md shrink-0 bg-slate-100" />
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h1 class="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">${seller.storeName}</h1>
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F7EC] text-[#047857] text-[10px] font-extrabold">
                    <i data-lucide="badge-check" style="width:12px;height:12px"></i>
                    <span>Verified Seller</span>
                  </span>
                  ${hasFounding ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] text-[10px] font-extrabold border border-[#FDE68A]">
                      <i data-lucide="crown" style="width:12px;height:12px;color:#D97706"></i>
                      <span>Founding Seller #${seller.foundingSellerNumber}</span>
                    </span>
                  ` : ''}
                </div>
                <p class="text-xs text-purple-100 max-w-xl leading-relaxed">${seller.description}</p>
                <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-purple-200">
                  <span>📍 ${seller.city}, ${seller.state}</span>
                  <span>·</span>
                  <span>★ ${Number(seller.rating || 0)} (${Number(seller.reviewCount || 0)} reviews)</span>
                  <span>·</span>
                  <span>📦 ${sf.products.length} Products</span>
                </div>
              </div>
            </div>

            <!-- Share & Contact on storefront -->
            <div class="flex items-center gap-2 shrink-0">
              <button class="btn !bg-white/20 !text-white hover:!bg-white/30 border border-white/40 !py-2 !px-3 text-xs font-bold" data-action="sc-share-store-link">
                <i data-lucide="share-2" style="width:14px;height:14px"></i>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Store Policies & Highlights -->
        <div class="grid sm:grid-cols-3 gap-3.5">
          <div class="p-4 rounded-2xl border border-white/60 bg-white shadow-xs">
            <div class="flex items-center gap-2 text-xs font-extrabold text-[#081F5C] mb-1">
              <i data-lucide="truck" style="width:15px;height:15px;color:#334EAC"></i>
              <span>Nationwide Delivery</span>
            </div>
            <p class="text-[11px] text-slate-500 leading-snug">Dispatches within 1-2 business days from ${seller.city || 'your dispatch location'}, ${seller.state || 'your state'}. Shipping rules are configured by the seller.</p>
          </div>
          <div class="p-4 rounded-2xl border border-white/60 bg-white shadow-xs">
            <div class="flex items-center gap-2 text-xs font-extrabold text-[#081F5C] mb-1">
              <i data-lucide="rotate-ccw" style="width:15px;height:15px;color:#334EAC"></i>
              <span>7-Day Return Guarantee</span>
            </div>
            <p class="text-[11px] text-slate-500 leading-snug">${seller.returnPolicy}</p>
          </div>
          <div class="p-4 rounded-2xl border border-white/60 bg-white shadow-xs">
            <div class="flex items-center gap-2 text-xs font-extrabold text-[#081F5C] mb-1">
              <i data-lucide="shield-check" style="width:15px;height:15px;color:#10B981"></i>
              <span>100% Authentic Collectibles</span>
            </div>
            <p class="text-[11px] text-slate-500 leading-snug">Product authenticity information is supplied by the seller and subject to marketplace review.</p>
          </div>
        </div>

        <!-- Storefront Product Catalog -->
        <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Store Merchandise</span>
              <h3 class="font-display font-extrabold text-lg text-[#0F172A] mt-0.5">Available Catalog (${sf.products.length})</h3>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
            ${sf.products.map(p => `
              <div class="rounded-2xl border border-slate-200 bg-white p-3 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div class="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-2.5 relative">
                    <img src="${(p.images && p.images[0]) || ''}" alt="" class="w-full h-full object-cover" />
                    ${p.discount > 0 ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#9BC7FF] text-[#081F5C] text-[9px] font-extrabold">-${p.discount}%</span>` : ''}
                  </div>
                  <div class="text-[9px] font-bold text-[#334EAC] uppercase">${p.category}</div>
                  <h4 class="font-display font-bold text-xs text-[#0F172A] mt-0.5 line-clamp-2">${p.name}</h4>
                </div>
                <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span class="font-display font-extrabold text-sm text-[#081F5C]">${fmtMoney(p.salePrice || p.price)}</span>
                  <a href="#/product/${p.slug || p.id}" class="btn btn-outline !py-1 !px-2.5 !text-[11px] font-bold">View</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 12: SELLER VERIFICATION CENTER
  // =========================================================================
  async function renderVerificationView() {
    const raw = await window.verificationService.getStatus();
    const v = {...(raw||{})};
    const statusMap={NOT_STARTED:'Not Started',UNDER_REVIEW:'Under Review',APPROVED:'Approved',REJECTED:'Rejected',SUBMITTED:'Submitted'};
    v.status=statusMap[String(v.status||'NOT_STARTED').toUpperCase()]||v.status||'Not Started';
    const docs=Array.isArray(v.submittedDocuments)?v.submittedDocuments:(v.submittedDocuments?.documents||[]);
    v.submittedDocuments=docs;

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Compliance & Trust</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Seller Verification Center</h2>
              <p class="text-xs text-slate-500 mt-1">Verified sellers receive the Verified Seller badge and higher marketplace buyer trust.</p>
            </div>
            <span class="inline-flex px-3 py-1 rounded-full text-xs font-extrabold ${badgeClasses(v.status)}">
              ${v.status}
            </span>
          </div>

          <!-- Status Highlight Card -->
          ${String(window.ANILyfeAPI?.state?.seller?.status||'').toLowerCase()==='pending' ? `<div class="mt-4 p-4 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF] text-[#334EAC]"><div class="flex items-center gap-2 font-display font-bold text-sm"><i data-lucide="hourglass" style="width:18px;height:18px"></i><span>Awaiting Admin Approval</span></div><p class="text-xs mt-1 leading-relaxed">Complete verification below. Your Seller Center stays restricted until an administrator approves the seller account.</p></div>` : ''}
          <div class="mt-4 p-4 rounded-2xl ${v.status === 'Approved' ? 'bg-[#E6F7EC] border border-[#A7F3D0] text-[#047857]' : 'bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309]'}">
            <div class="flex items-center gap-2 font-display font-bold text-sm">
              <i data-lucide="${v.status === 'Approved' ? 'badge-check' : 'hourglass'}" style="width:18px;height:18px"></i>
              <span>Verification Status: ${v.status}</span>
            </div>
            <p class="text-xs mt-1 leading-relaxed opacity-90">
              ${v.status === 'Approved' ? 'Your business entity and national identity have been verified by ANILyfe compliance. All published products display the verified merchant credential.' : 'Your submitted documents are currently undergoing review by compliance officers. Expected turnaround is 24-48 business hours.'}
            </p>
          </div>

          ${['Approved','Under Review'].includes(v.status) && v.status !== 'Rejected' ? '' : `
          <form id="sellerVerificationForm" class="mt-6 space-y-4" enctype="multipart/form-data">
            <div class="border-t border-slate-100 pt-5">
              <h3 class="font-display font-bold text-sm text-[#0F172A]">Verification Submission</h3>
              <p class="text-xs text-slate-500 mt-1">Provide truthful information. Sensitive identity details are stored with the seller verification record and are not displayed publicly.</p>
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div><label class="lbl">Legal business name</label><input class="inp" name="legalBusinessName" value="${esc(v.legalBusinessName||'')}" required></div>
              <div><label class="lbl">Registration / RC details</label><input class="inp" name="registrationType" value="${esc(v.registrationType||'')}" placeholder="CAC / registration details"></div>
              <div><label class="lbl">Tax identification number</label><input class="inp" name="taxIdentificationNumber" value="${esc(v.taxIdentificationNumber||'')}"></div>
              <div><label class="lbl">Director / representative name</label><input class="inp" name="directorName" value="${esc(v.directorName||'')}" required></div>
              <div><label class="lbl">National ID type</label><select class="inp" name="nationalIdType" required><option value="">Select ID type</option><option ${v.nationalIdType==='NIN'?'selected':''}>NIN</option><option ${v.nationalIdType==='Passport'?'selected':''}>Passport</option><option ${v.nationalIdType==='Driver Licence'?'selected':''}>Driver Licence</option><option ${v.nationalIdType==='Voter Card'?'selected':''}>Voter Card</option></select></div>
              <div><label class="lbl">National ID number</label><input class="inp" name="nationalIdNumber" value="${esc(v.nationalIdNumber||'')}" required autocomplete="off"></div>
              <div><label class="lbl">State</label><select class="inp" name="state" required><option value="">Select state</option>${NIGERIAN_STATES_SHARED.map(st=>`<option ${v.state===st?'selected':''}>${esc(st)}</option>`).join('')}</select></div>
              <div><label class="lbl">LGA</label><input class="inp" name="lga" value="${esc(v.lga||'')}" required placeholder="Local Government Area"></div>
              <div><label class="lbl">Phone</label><input class="inp" name="phone" value="${esc(v.phone||'')}" required placeholder="080..." inputmode="tel"></div>
              <div><label class="lbl">Business email</label><input class="inp" name="businessEmail" type="email" value="${esc(v.businessEmail||'')}" placeholder="business@example.com"></div>
              <div class="sm:col-span-2"><label class="lbl">Registered business address</label><textarea class="inp min-h-[90px]" name="registeredAddress" required>${esc(v.registeredAddress||'')}</textarea></div>
              <div><label class="lbl">Payout bank</label><input class="inp" name="payoutBank" value="${esc(v.payoutDetails?.bankName||'')}" placeholder="Bank name"></div>
              <div><label class="lbl">Payout account name</label><input class="inp" name="payoutAccountName" value="${esc(v.payoutDetails?.accountName||'')}" placeholder="Account name"></div>
              <div><label class="lbl">Payout account number</label><input class="inp" name="payoutAccountNumber" value="${esc(v.payoutDetails?.accountNumber||'')}" inputmode="numeric" autocomplete="off"></div>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
              <label class="block"><span class="lbl">CAC / registration document</span><input class="inp" type="file" name="cacDocument" accept=".pdf,.jpg,.jpeg,.png"></label>
              <label class="block"><span class="lbl">Identity document</span><input class="inp" type="file" name="identityDocument" accept=".pdf,.jpg,.jpeg,.png" required></label>
              <label class="block"><span class="lbl">Proof of address</span><input class="inp" type="file" name="addressDocument" accept=".pdf,.jpg,.jpeg,.png"></label>
            </div>
            <label class="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" name="declaration" required class="mt-0.5"> I confirm that my information is accurate, my products are legal/authentic, prices and stock are accurate, and I will follow ANILyfe marketplace policies.</label>
            <button class="btn btn-primary" type="submit"><i data-lucide="send" style="width:14px;height:14px"></i> ${v.status==='Rejected'?'Resubmit for Review':'Submit for Review'}</button>
          </form>`}

          <!-- Submitted Information -->
          <div class="mt-6 space-y-4 text-xs">
            <h3 class="font-display font-bold text-sm text-[#0F172A]">Registered Legal Entity</h3>
            <div class="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold">Business Name</span>
                <div class="font-bold text-[#0F172A] text-sm mt-0.5">${v.legalBusinessName}</div>
              </div>
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold">Registration / RC</span>
                <div class="font-mono font-bold text-[#0F172A] text-sm mt-0.5">${v.registrationType}</div>
              </div>
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold">Tax ID (TIN)</span>
                <div class="font-mono font-bold text-[#0F172A] text-sm mt-0.5">${v.taxIdentificationNumber}</div>
              </div>
              <div>
                <span class="text-slate-400 text-[10px] uppercase font-bold">Director Identity</span>
                <div class="font-bold text-[#0F172A] text-sm mt-0.5">${v.directorName} (${v.nationalIdType})</div>
              </div>
            </div>

            <!-- Uploaded Documents -->
            <h3 class="font-display font-bold text-sm text-[#0F172A] pt-2">Compliance Document Dossier</h3>
            <div class="space-y-2">
              ${v.submittedDocuments.map(doc => `
                <div class="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <i data-lucide="file-text" style="width:16px;height:16px;color:#334EAC"></i>
                    <div>
                      <div class="font-bold text-[#0F172A] text-xs">${doc.name}</div>
                      <div class="text-[10px] text-slate-400">${doc.size} · Uploaded ${doc.uploadedAt}</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">${doc.status}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW 13: SETTINGS CENTER (14 GRANULAR SECTIONS)
  // =========================================================================
  async function renderSettingsView(seller) {
    const settings = await window.settingsService.getSettings();

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Merchant Configuration</span>
              <h2 class="font-display font-extrabold text-xl text-[#0F172A] mt-0.5">Seller Settings Center</h2>
              <p class="text-xs text-slate-500 mt-1">Manage notifications, two-factor authentication, sessions, and operational modes.</p>
            </div>
            <button class="btn btn-primary !px-4 !py-2 !text-xs font-bold" data-action="sc-save-settings">
              <i data-lucide="save" style="width:14px;height:14px"></i>
              <span>Save Settings</span>
            </button>
          </div>

          <form id="scSettingsForm" class="space-y-8 pt-4">
            <!-- 1. Account Settings -->
            <div>
              <h3 class="font-display font-extrabold text-sm text-[#0F172A] mb-3 flex items-center gap-2">
                <i data-lucide="user" style="width:16px;height:16px;color:#334EAC"></i>
                <span>Seller Account Credentials</span>
              </h3>
              <div class="mb-4 p-4 rounded-2xl border border-[#D0E3FF] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-[#E7F1FF] border border-[#D0E3FF] flex items-center justify-center text-[#334EAC] font-extrabold">${settings.account.avatar ? `<img src="${settings.account.avatar}" alt="Seller profile photo" class="w-full h-full object-cover" />` : esc((seller.businessName || 'S')[0].toUpperCase())}</div>
                <div class="flex-1"><div class="font-bold text-sm">Seller profile photo</div><div class="text-xs text-slate-500 mt-1">Upload a photo used for your seller identity.</div></div>
                <label class="btn btn-primary !px-3 !py-2 !text-xs cursor-pointer">Upload photo<input type="file" accept="image/*" data-seller-profile-image class="hidden" /></label>
              </div>
              <div class="grid sm:grid-cols-3 gap-3">
                <div>
                  <label class="lbl">Representative Name</label>
                  <input name="accName" class="inp" value="${settings.account.name}" />
                </div>
                <div>
                  <label class="lbl">Notification Email</label>
                  <input name="accEmail" class="inp" value="${settings.account.email}" />
                </div>
                <div>
                  <label class="lbl">Primary Phone</label>
                  <input name="accPhone" class="inp" value="${settings.account.phone}" />
                </div>
              </div>
            </div>

            <!-- 2. Notification Preferences (12 Toggles) -->
            <div class="pt-4 border-t border-slate-100">
              <h3 class="font-display font-extrabold text-sm text-[#0F172A] mb-1 flex items-center gap-2">
                <i data-lucide="bell" style="width:16px;height:16px;color:#334EAC"></i>
                <span>Notification Alerts (12 Categories)</span>
              </h3>
              <p class="text-xs text-slate-500 mb-4">Choose which real-time alerts trigger browser & SMS notifications.</p>

              <div class="grid sm:grid-cols-3 gap-3 text-xs">
                ${[
                  ['orders', 'New Orders & Confirmations'],
                  ['payments', 'Payment Received & Settlements'],
                  ['shipping', 'Courier Dispatch & Tracking'],
                  ['returns', 'Return Requests & Disputes'],
                  ['refunds', 'Refund Adjustments'],
                  ['reviews', 'New Customer Reviews'],
                  ['questions', 'Pre-sale Product Inquiries'],
                  ['productApproval', 'Product Approvals'],
                  ['productRejection', 'Product Rejections & Feedback'],
                  ['verification', 'KYC Status Updates'],
                  ['security', 'New Logins & Security Alerts'],
                  ['announcements', 'Marketplace Policy Updates']
                ].map(([k, lbl]) => `
                  <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer hover:bg-white transition">
                    <input type="checkbox" name="notif_${k}" ${settings.notifications[k] ? 'checked' : ''} class="w-4 h-4 text-[#334EAC] rounded" />
                    <span class="font-bold text-[#0F172A]">${lbl}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- 3. Security & 2FA -->
            <div class="pt-4 border-t border-slate-100">
              <h3 class="font-display font-extrabold text-sm text-[#0F172A] mb-3 flex items-center gap-2">
                <i data-lucide="shield-check" style="width:16px;height:16px;color:#334EAC"></i>
                <span>Security & Active Sessions</span>
              </h3>
              <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div class="font-bold text-xs text-[#0F172A]">Two-Factor Authentication (2FA)</div>
                  <div class="text-[11px] text-slate-500">Secured via ${settings.security.twoFactorMethod}</div>
                </div>
                <span class="badge !bg-slate-100 !text-slate-500">V1 unavailable</span>
              </div>

              <!-- Active sessions -->
              <div class="space-y-2">
                ${settings.security.activeSessions.length ? settings.security.activeSessions.map(ses => `
                  <div class="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs">
                    <div>
                      <div class="font-bold text-[#0F172A]">${ses.device} ${ses.current ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold ml-1">Current Session</span>' : ''}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5">${ses.location} · IP: ${ses.ip} · ${ses.lastActive}</div>
                    </div>
                  </div>
                `).join('') : '<div class="text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 p-3">No other sessions to display.</div>'}
              </div>
              <div class="text-[11px] text-slate-400 mt-3">Multi-device session management is planned for a later release.</div>
              <!-- Other-device logout is intentionally not exposed until the backend supports it. -->
              <div class="hidden" data-action="sc-logout-other-sessions">
                <i data-lucide="log-out" style="width:13px;height:13px"></i>
                <span>Log Out All Other Devices</span>
              </div>
            </div>

            <!-- 4. Dangerous Store Management Actions -->
            <div class="pt-4 border-t border-rose-100">
              <h3 class="font-display font-extrabold text-sm text-rose-700 mb-1 flex items-center gap-2">
                <i data-lucide="alert-triangle" style="width:16px;height:16px;color:#DC2626"></i>
                <span>Store Lifecycle & Dangerous Actions</span>
              </h3>
              <p class="text-xs text-slate-500 mb-4">Temporary closures and store state management require confirmation.</p>

              <div class="grid sm:grid-cols-3 gap-3">
                <button type="button" class="btn btn-ghost !border-amber-200 !text-amber-700 hover:!bg-amber-50 !py-2 text-xs font-bold" data-action="sc-danger-pause">
                  Pause Store
                </button>
                <button type="button" class="btn btn-ghost !border-rose-200 !text-rose-700 hover:!bg-rose-50 !py-2 text-xs font-bold" data-action="sc-danger-close">
                  Temporarily Close Store
                </button>
                <button type="button" class="btn btn-danger !py-2 text-xs font-bold" data-action="sc-danger-delete">
                  Close Store Permanently
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MAIN ROUTE DISPATCHER
  // =========================================================================
  const SC_SPLASH_TITLES = {
    orders: 'Order Management', products: 'Product Listings', addProduct: 'Add a New Product',
    inventory: 'Inventory', reviews: 'Reviews & Ratings', earnings: 'Earnings & Payouts',
    analytics: 'Analytics', delivery: 'Delivery & Shipping', store: 'Store Profile',
    storePreview: 'Store Preview', verification: 'Seller Verification', settings: 'Settings'
  };
  function sellerSplash(section) {
    return `
      <div class="relative mb-6 overflow-hidden rounded-3xl border border-[#D0E3FF] shadow-sm">
        <img src="assets/images/seller.png" alt="" width="1200" height="220" class="h-24 w-full object-cover sm:h-28" onerror="this.remove()">
        <div class="absolute inset-0 bg-gradient-to-r from-[#081F5C]/90 via-[#0B2A7A]/55 to-[#334EAC]/15"></div>
        <div class="absolute inset-0 flex flex-col justify-center px-6">
          <p class="text-[10px] font-bold uppercase tracking-[.32em] text-[#9BC7FF]">Seller Center</p>
          <h2 class="font-display text-xl font-bold text-white sm:text-2xl">${SC_SPLASH_TITLES[section] || 'Seller Center'}</h2>
        </div>
      </div>`;
  }

  async function viewSellerCenter(section = 'dashboard', subParam = null) {
    const u = window.currentUser ? window.currentUser() : null;
    const identity = u && window.sellerOf ? window.sellerOf(u.id) : null;
    if (!identity) { location.hash = '#/auth'; return ''; }
    if (identity.status !== 'approved' && section !== 'verification') { location.hash = '#/seller/verification'; return ''; }
    SC.section = section;
    SC.subSection = subParam;

    // Check if adding new product
    if (section === 'products' && subParam === 'new') {
      SC.section = 'addProduct';
    }

    try {
      const seller = await window.sellerService.getProfile();
      const unread = await window.notificationService.getUnreadCount();
      const notifications = await window.notificationService.getNotifications();

      let mainContent = '';

      switch (SC.section) {
        case 'dashboard':
          mainContent = await renderDashboardView(seller);
          break;
        case 'orders':
          mainContent = await renderOrdersView();
          break;
        case 'products':
          mainContent = await renderProductsView();
          break;
        case 'addProduct':
          mainContent = renderAddProductWizard();
          break;
        case 'inventory':
          mainContent = await renderInventoryView();
          break;
        case 'reviews':
          mainContent = await renderReviewsView();
          break;
        case 'earnings':
          mainContent = await renderEarningsView(seller);
          break;
        case 'analytics':
          mainContent = await renderAnalyticsView();
          break;
        case 'delivery':
          mainContent = await renderDeliveryView();
          break;
        case 'store':
          mainContent = await renderStoreView(seller);
          break;
        case 'storePreview':
          mainContent = await renderPreviewStoreView(seller);
          break;
        case 'verification':
          mainContent = await renderVerificationView();
          break;
        case 'settings':
          mainContent = await renderSettingsView(seller);
          break;
        default:
          mainContent = await renderDashboardView(seller);
      }

      return `
        <div class="min-h-screen bg-[#F6FCFF] text-[#0F172A] pb-16 lg:pb-10 font-sans">
          <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
            ${renderHeader(seller, unread)}
            ${SC.section !== 'dashboard' ? sellerSplash(SC.section) : ''}

            <div class="flex flex-col lg:flex-row gap-6 items-start">
              ${renderSidebar(SC.section, seller)}
              <main class="flex-1 min-w-0 w-full">
                ${mainContent}
              </main>
            </div>
          </div>

          ${renderMobileBottomNav(SC.section)}
          ${renderMobileDrawer(SC.section, seller)}
          ${renderNotificationDrawer(notifications)}
          ${renderActiveModal()}
        </div>
      `;
    } catch (e) {
      console.error('Seller Center render error:', e);
      return `
        <div class="min-h-screen flex items-center justify-center p-6 text-center">
          <div class="card p-8 max-w-md">
            <h2 class="font-display font-bold text-lg text-rose-600">Seller Center unavailable</h2>
            <p class="text-xs text-slate-500 mt-2">${e.message || 'We could not load your Seller Center. Please try again.'}</p>
            <button class="btn btn-primary mt-4" onclick="location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  }

  // =========================================================================
  // MODALS RENDERING (Order Details, Payout, Reply, SKU Edit, Confirmations)
  // =========================================================================
  function renderActiveModal() {
    if (!SC.activeModal) return '';

    if (SC.activeModal === 'orderDetails') {
      const o = SC.modalData;
      if (!o) return '';
      const firstItem = (o.items && o.items[0]) || {};

      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" data-action="sc-close-modal"></div>
          <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Order Manifest</span>
                <h3 class="font-display font-extrabold text-lg text-[#0F172A] mt-0.5">Order #${o.id}</h3>
              </div>
              <button class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400" data-action="sc-close-modal">
                <i data-lucide="x" style="width:18px;height:18px"></i>
              </button>
            </div>

            <!-- Customer & Delivery Address -->
            <div class="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-slate-400 font-bold text-[10px] uppercase">Buyer Information</span>
                <div class="font-bold text-[#0F172A] mt-1">${o.buyer ? o.buyer.name : 'Buyer'}</div>
                <div class="text-slate-500 mt-0.5">${o.buyer ? o.buyer.phone : ''} · ${o.buyer ? o.buyer.email : ''}</div>
              </div>
              <div>
                <span class="text-slate-400 font-bold text-[10px] uppercase">Delivery Address</span>
                <div class="text-slate-700 mt-1">${o.buyer ? o.buyer.address : 'Nigeria'}</div>
                <div class="font-bold text-[#334EAC] mt-0.5">${o.buyer ? o.buyer.city : ''}, ${o.buyer ? o.buyer.state : ''}</div>
              </div>
            </div>

            <!-- Items list -->
            <div class="mt-4 space-y-2">
              <span class="text-slate-400 font-bold text-[10px] uppercase">Purchased Anime Merchandise</span>
              ${(o.items || []).map(it => `
                <div class="p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-3">
                    <img src="${it.productImage}" alt="" class="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" />
                    <div>
                      <div class="font-bold text-[#0F172A]">${it.productName}</div>
                      <div class="text-[11px] text-slate-400">Variant: ${it.variant} · SKU: ${it.sku} · Qty: ${it.quantity}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-extrabold text-sm text-[#0F172A]">${fmtMoney(it.salePrice * it.quantity)}</div>
                    <div class="text-[10px] text-slate-400">${fmtMoney(it.salePrice)} each</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Financial Settlement Breakdown -->
            <div class="mt-4 p-4 rounded-2xl bg-[#E7F1FF] border border-[#D0E3FF] space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Product Subtotal:</span>
                <span>${fmtMoney(o.subtotal)}</span>
              </div>
              ${o.discountTotal > 0 ? `
                <div class="flex justify-between text-slate-600">
                  <span>Store Discount Applied:</span>
                  <span>-${fmtMoney(o.discountTotal)}</span>
                </div>
              ` : ''}
              <div class="flex justify-between text-slate-600">
                <span>Shipping Fee (Customer Paid):</span>
                <span>+${fmtMoney(o.shippingFee)}</span>
              </div>
              <div class="flex justify-between text-slate-600 border-t border-purple-200/60 pt-1.5 font-bold">
                <span>ANILyfe 15% Platform Commission:</span>
                <span class="text-[#334EAC]">-${fmtMoney(o.marketplaceCommission)}</span>
              </div>
              <div class="flex justify-between font-display font-extrabold text-sm text-[#081F5C] border-t border-purple-200/60 pt-2">
                <span>Net Seller Settlement:</span>
                <span class="text-[#10B981]">${fmtMoney(o.sellerEarnings)}</span>
              </div>
            </div>

            <!-- Order Timeline -->
            <div class="mt-5">
              <span class="text-slate-400 font-bold text-[10px] uppercase">Fulfillment Tracking Timeline</span>
              <div class="mt-2.5 space-y-3 border-l-2 border-[#334EAC] ml-2 pl-4 text-xs">
                ${(o.timeline || []).map(t => `
                  <div class="relative">
                    <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#334EAC] border-2 border-white"></div>
                    <div class="font-bold text-[#0F172A]">${t.label}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">${t.note || ''}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">${fmtDate(t.timestamp)}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button class="btn btn-primary !px-5 !py-2 !text-xs font-bold" data-action="sc-close-modal">Close</button>
            </div>
          </div>
        </div>
      `;
    }

    if (SC.activeModal === 'payoutRequest') {
      const p = SC.modalData;
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" data-action="sc-close-modal"></div>
          <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="font-display font-extrabold text-base text-[#0F172A]">Request Payout Withdrawal</h3>
              <button class="p-1 rounded-lg text-slate-400 hover:bg-slate-100" data-action="sc-close-modal"><i data-lucide="x" style="width:16px;height:16px"></i></button>
            </div>

            <div class="mt-4 p-3.5 rounded-2xl bg-[#E7F1FF] text-xs text-[#081F5C]">
              <div class="font-bold">Available for Withdrawal:</div>
              <div class="font-display font-extrabold text-2xl text-[#334EAC] mt-0.5">${fmtMoney(p.availableBalance)}</div>
              <p class="text-[11px] text-slate-500 mt-1">Minimum payout amount is ₦10,000.</p>
            </div>

            <div class="mt-4 space-y-3 text-xs">
              <div>
                <label class="lbl">Withdrawal Amount (₦) *</label>
                <input id="payoutAmountInput" type="number" class="inp font-mono font-bold text-base" value="${Math.min(p.availableBalance, 100000)}" max="${p.availableBalance}" min="10000" />
              </div>
              <div class="p-3 rounded-xl border border-slate-200 bg-[#F8FAFC]">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Destination Bank Account</div>
                <div class="font-bold text-[#0F172A] text-xs mt-0.5">${p.bankAccount.bankName}</div>
                <div class="font-mono text-slate-600 text-xs">Account: ${p.bankAccount.accountNumber} · ${p.bankAccount.accountName}</div>
              </div>
            </div>

            <div class="mt-6 flex gap-2 justify-end">
              <button class="btn btn-ghost !px-4 !py-2 !text-xs font-bold" data-action="sc-close-modal">Cancel</button>
              <button class="btn btn-primary !px-5 !py-2 !text-xs font-bold" data-action="sc-submit-payout-request">Confirm Withdrawal</button>
            </div>
          </div>
        </div>
      `;
    }

    if (SC.activeModal === 'shipOrder') {
      const orderId = SC.modalData;
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" data-action="sc-close-modal"></div>
          <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="font-display font-extrabold text-base text-[#0F172A]">Add Tracking & Mark Shipped</h3>
              <button class="p-1 rounded-lg text-slate-400" data-action="sc-close-modal"><i data-lucide="x" style="width:16px;height:16px"></i></button>
            </div>
            <div class="mt-4 space-y-3 text-xs">
              <div>
                <label class="lbl">Courier Service *</label>
                <select id="shipCourierSelect" class="inp font-bold">
                  <option>GIG Logistics</option>
                  <option>DHL Express</option>
                  <option>Kwik Delivery</option>
                  <option>Fez Delivery</option>
                </select>
              </div>
              <div>
                <label class="lbl">Waybill / Tracking Code *</label>
                <input id="shipTrackingInput" class="inp font-mono" placeholder="e.g. GIG-NG-8892104" value="" />
              </div>
              <div>
                <label class="lbl">Dispatch Note (Optional)</label>
                <input id="shipNoteInput" class="inp" placeholder="Package sealed in protective tamper-proof bag" />
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button class="btn btn-ghost !px-4 !py-2 !text-xs font-bold" data-action="sc-close-modal">Cancel</button>
              <button class="btn btn-primary !px-5 !py-2 !text-xs font-bold" data-action="sc-submit-ship-order" data-order-id="${orderId}">Mark as Shipped</button>
            </div>
          </div>
        </div>
      `;
    }

    if (SC.activeModal === 'statusChange') {
      const current = SC.modalData;
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" data-action="sc-close-modal"></div>
          <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <h3 class="font-display font-extrabold text-base text-[#0F172A] mb-2">Change Store Operating Status</h3>
            <p class="text-xs text-slate-500 mb-4">Current status: <strong>${current}</strong></p>
            <div class="space-y-2 text-xs">
              ${['Live', 'Temporarily Closed', 'Under Review'].map(st => `
                <button class="w-full p-3 rounded-2xl border text-left font-bold transition flex items-center justify-between ${current === st ? 'border-[#334EAC] bg-[#E7F1FF] text-[#334EAC]' : 'border-slate-200 bg-white hover:bg-slate-50'}" data-action="sc-select-store-status" data-status="${st}">
                  <span>${st}</span>
                  ${current === st ? '<i data-lucide="check" style="width:16px;height:16px"></i>' : ''}
                </button>
              `).join('')}
            </div>
            <div class="mt-5 flex justify-end">
              <button class="btn btn-ghost !px-4 !py-2 !text-xs font-bold" data-action="sc-close-modal">Close</button>
            </div>
          </div>
        </div>
      `;
    }

    if (SC.activeModal === 'editProduct') {
      const p = SC.modalData || {};
      return `<div class="fixed inset-0 z-[90] bg-slate-950/60 flex items-center justify-center p-4" data-action="sc-close-modal">
        <div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-5"><div><div class="text-[10px] uppercase tracking-widest text-[#334EAC] font-bold">Edit listing</div><h3 class="font-display font-extrabold text-xl">${esc(p.name || 'Product')}</h3></div><button class="btn btn-ghost !px-2 !py-1" data-action="sc-close-modal">✕</button></div>
          <form id="scEditProductForm" class="space-y-4">
            <div><label class="lbl">Product name</label><input class="inp" name="name" required value="${esc(p.name || '')}" /></div>
            <div class="grid sm:grid-cols-2 gap-4"><div><label class="lbl">Price (₦)</label><input class="inp" name="price" type="number" min="1" required value="${Number(p.price || 0)}" /></div><div><label class="lbl">Stock</label><input class="inp" name="stock" type="number" min="0" required value="${Number(p.stock || 0)}" /></div></div>
            <div><label class="lbl">Description</label><textarea class="inp min-h-[120px]" name="description">${esc(p.description || '')}</textarea></div>
            <div><div class="flex items-center justify-between"><label class="lbl">Product images</label><label class="btn btn-ghost !py-1.5 !px-2 !text-[10px] cursor-pointer">Add images<input type="file" accept="image/*" multiple data-sc-edit-images class="hidden"></label></div><div class="grid grid-cols-4 gap-2 mt-2">${(p.images||[]).map((img,i)=>`<div class="relative aspect-square rounded-xl overflow-hidden border border-slate-200"><img src="${img}" class="w-full h-full object-cover" alt=""><button type="button" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white" data-action="sc-edit-remove-image" data-index="${i}">×</button></div>`).join('')||'<div class="col-span-4 text-xs text-slate-400 p-4 border border-dashed rounded-xl text-center">No images uploaded.</div>'}</div></div>
            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D0E3FF]"><div class="font-bold text-sm">Custom dimensions (inches)</div><div class="grid grid-cols-3 gap-2 mt-2"><input class="inp" type="number" step="0.01" min="0" name="dimensionWidth" placeholder="Width" value="${esc(p.dimensions?.width||'')}"><input class="inp" type="number" step="0.01" min="0" name="dimensionHeight" placeholder="Height" value="${esc(p.dimensions?.height||'')}"><input class="inp" type="number" step="0.01" min="0" name="dimensionDepth" placeholder="Depth" value="${esc(p.dimensions?.depth||'')}"></div></div>
            <div class="flex justify-end gap-2"><button type="button" class="btn btn-ghost" data-action="sc-close-modal">Cancel</button><button class="btn btn-primary" type="submit">Save changes</button></div>
          </form>
        </div>
      </div>`;
    }

    if (SC.activeModal === 'salesReport') {
      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" data-action="sc-close-modal"></div>
          <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-center">
            <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="file-spreadsheet" style="width:28px;height:28px"></i>
            </div>
            <h3 class="font-display font-extrabold text-lg text-[#0F172A]">ANILyfe Merchant Sales Report</h3>
            <p class="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Export comprehensive accounting ledger including gross items, 15% platform commission deductions, courier charges, and net payout settlements.
            </p>
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 text-left space-y-1 mb-4 font-mono">
              <div>Format: CSV / Excel UTF-8</div>
              <div>Date Range: Current seller order records</div>
              <div>Entries: Real seller order records</div>
            </div>
            <div class="flex gap-2 justify-center">
              <button class="btn btn-ghost !px-4 !py-2 !text-xs font-bold" data-action="sc-close-modal">Close</button>
              <button class="btn btn-primary !px-5 !py-2 !text-xs font-bold" data-action="sc-download-report">
                <i data-lucide="download" style="width:14px;height:14px"></i>
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  function sellerServiceState(){
    const u = window.currentUser ? window.currentUser() : null;
    return u && window.sellerOf ? (window.sellerOf(u.id) || {}) : {};
  }

  async function readImageFile(file) {
    if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Use a JPG, PNG, WEBP or GIF image.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Image must be 8 MB or smaller.');
    if(window.ANILyfeAPI?.request){ const fd=new FormData(); fd.append('file',file); const uploaded=await window.ANILyfeAPI.request('/api/uploads/image',{method:'POST',body:fd}); return uploaded.url; }
    throw new Error('Image upload service is unavailable.');
  }

  // =========================================================================
  // GLOBAL CLICK & SUBMIT EVENT DISPATCHER
  // =========================================================================
  document.addEventListener('click', async function(e) {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const act = t.dataset.action;

    if (act === 'sc-edit-remove-image') { const idx=Number(t.dataset.index); if(SC.modalData?.images){SC.modalData.images.splice(idx,1);route();} return; }
    if (act === 'sc-product-edit') {
      const id = t.dataset.productId;
      const products = await window.productService.getProducts();
      const product = products.find(p => p.id === id);
      if (!product) { toast('Product not found.', 'alert-circle'); return; }
      SC.activeModal = 'editProduct';
      SC.modalData = product;
      route();
      return;
    }
    if (act === 'sc-wizard-regenerate-variants') {
      const w = SC.wizardData;
      const colors = w.colors.length ? w.colors : ['Default'];
      const sizes = w.sizes.length ? w.sizes : ['Standard'];
      w.variants = colors.flatMap(c => sizes.map(sz => ({ color:c, size:sz, sku:(w.sku || 'ANL') + '-' + String(c).slice(0,3).toUpperCase() + '-' + String(sz).slice(0,3).toUpperCase(), price:Number(w.price)||0, stock:Number(w.stock)||0 })));
      toast(`${w.variants.length} variant${w.variants.length===1?'':'s'} generated.`, 'refresh-cw'); route();
      return;
    }

    // Navigation & drawer toggles
    if (act === 'sc-toggle-mobile-menu') {
      SC.mobileMenuOpen = !SC.mobileMenuOpen;
      route();
      return;
    }
    if (act === 'sc-close-mobile-menu') {
      SC.mobileMenuOpen = false;
      return;
    }
    if (act === 'sc-toggle-notifications') {
      SC.notifDrawerOpen = !SC.notifDrawerOpen;
      route();
      return;
    }
    if (act === 'sc-notif-mark-all-read') {
      await window.notificationService.markAllAsRead();
      toast('All notifications marked as read', 'check-circle-2');
      route();
      return;
    }

    // Modal controls
    if (act === 'sc-close-modal') {
      SC.activeModal = null;
      SC.modalData = null;
      route();
      return;
    }
    if (act === 'sc-change-status-modal') {
      const seller = await window.sellerService.getProfile();
      SC.activeModal = 'statusChange';
      SC.modalData = seller.storeStatus;
      route();
      return;
    }
    if (act === 'sc-select-store-status') {
      const st = t.dataset.status;
      await window.sellerService.setStoreStatus(st);
      SC.activeModal = null;
      toast(`Store status updated to ${st}`, 'badge-check');
      route();
      return;
    }
    if (act === 'sc-open-sales-report') {
      SC.activeModal = 'salesReport';
      route();
      return;
    }
    if (act === 'sc-download-report') {
      const rows = (await window.orderService.getOrders()).map(o => `${o.id},${o.orderStatus || ''},${o.total || 0},${o.createdAt || ''}`);
      const csv = ['Order ID,Status,Total,Created At', ...rows].join('\n');
      const blob = new Blob([csv], {type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ANILyfe_Sales_Report.csv'; a.click(); URL.revokeObjectURL(a.href);
      toast('Sales report generated from real seller orders.', 'download');
      SC.activeModal = null;
      route();
      return;
    }

    // Add Product wizard navigation
    if (act === 'sc-nav-add-product') {
      location.hash = '#/seller/products/new';
      return;
    }
    if (act === 'sc-wizard-next') {
      SC.wizardStep = Math.min(12, SC.wizardStep + 1);
      route();
      return;
    }
    if (act === 'sc-wizard-prev') {
      SC.wizardStep = Math.max(1, SC.wizardStep - 1);
      route();
      return;
    }
    if (act === 'sc-wizard-jump') {
      SC.wizardStep = Number(t.dataset.step || 1);
      route();
      return;
    }
    if (act === 'sc-wizard-add-sample-photo') {
      return;
    }
    if (act === 'sc-wizard-remove-photo') {
      const idx = Number(t.dataset.idx);
      SC.wizardData.images.splice(idx, 1);
      route();
      return;
    }
    if (act === 'sc-wizard-make-primary') {
      const idx = Number(t.dataset.idx);
      const [img] = SC.wizardData.images.splice(idx, 1);
      SC.wizardData.images.unshift(img);
      toast('Primary cover updated', 'check');
      route();
      return;
    }
    if (act === 'sc-wizard-set-category') {
      SC.wizardData.category = t.dataset.cat;
      route();
      return;
    }
    if (act === 'sc-wizard-add-color') {
      const inp = document.getElementById('newColorInput');
      if (inp && inp.value.trim()) {
        SC.wizardData.colors.push(inp.value.trim());
        route();
      }
      return;
    }
    if (act === 'sc-wizard-remove-color') {
      const idx = Number(t.dataset.idx);
      SC.wizardData.colors.splice(idx, 1);
      route();
      return;
    }
    if (act === 'sc-wizard-toggle-size') {
      const sz = t.dataset.size;
      const idx = SC.wizardData.sizes.indexOf(sz);
      if (idx > -1) {
        SC.wizardData.sizes.splice(idx, 1);
      } else {
        SC.wizardData.sizes.push(sz);
      }
      route();
      return;
    }
    if (act === 'sc-wizard-save-draft') {
      await window.productService.createProduct({
        ...SC.wizardData,
        submitForApproval: false
      });
      toast('Product draft saved successfully.', 'save');
      location.hash = '#/seller/products';
      return;
    }
    if (act === 'sc-wizard-submit-approval') {
      await window.productService.createProduct({
        ...SC.wizardData,
        submitForApproval: true
      });
      window.auditService.recordEvent('PRODUCT_SUBMITTED', { name: SC.wizardData.name });
      toast('Product submitted! Status is Pending Approval.', 'send');
      location.hash = '#/seller/products';
      return;
    }

    // Orders filters & actions
    if (act === 'sc-orders-filter') {
      SC.orderFilter = t.dataset.filter || 'All';
      route();
      return;
    }
    if (act === 'sc-view-order-details') {
      const orderId = t.dataset.orderId;
      const o = await window.orderService.getOrderById(orderId);
      if (o) {
        SC.activeModal = 'orderDetails';
        SC.modalData = o;
        route();
      }
      return;
    }
    if (act === 'sc-order-confirm') {
      await window.orderService.confirmOrder(t.dataset.orderId);
      toast('Order confirmed. Ready for packaging.', 'check-circle');
      route();
      return;
    }
    if (act === 'sc-order-process') {
      await window.orderService.processOrder(t.dataset.orderId);
      toast('Order moved to Processing.', 'box');
      route();
      return;
    }
    if (act === 'sc-order-ready') {
      await window.orderService.markReadyToShip(t.dataset.orderId);
      toast('Order ready for courier dispatch.', 'truck');
      route();
      return;
    }
    if (act === 'sc-order-ship-modal') {
      SC.activeModal = 'shipOrder';
      SC.modalData = t.dataset.orderId;
      route();
      return;
    }
    if (act === 'sc-submit-ship-order') {
      const orderId = t.dataset.orderId;
      const courier = document.getElementById('shipCourierSelect').value;
      const tracking = document.getElementById('shipTrackingInput').value;
      const note = document.getElementById('shipNoteInput').value;
      await window.orderService.addTrackingAndShip(orderId, { courier, trackingNumber: tracking, note });
      toast(`Order shipped with ${courier}.`, 'truck');
      SC.activeModal = null;
      route();
      return;
    }
    if (act === 'sc-order-delivered') {
      await window.orderService.markDelivered(t.dataset.orderId);
      toast('Order marked Delivered.', 'check');
      route();
      return;
    }
    if (act === 'sc-order-return-modal') {
      const decision = confirm('Inspect return: Click OK to Accept Return and refund customer, or Cancel to Decline.');
      await window.orderService.handleReturn(t.dataset.orderId, decision ? 'Accepted' : 'Declined');
      toast(decision ? 'Return accepted and authorized.' : 'Return declined.', 'rotate-ccw');
      route();
      return;
    }

    // Products filters & actions
    if (act === 'sc-products-filter') {
      SC.productFilter = t.dataset.filter || 'All';
      route();
      return;
    }
    if (act === 'sc-product-submit') {
      await window.productService.submitForApproval(t.dataset.productId);
      toast('Product submitted for administrative review.', 'send');
      route();
      return;
    }
    if (act === 'sc-product-resubmit-modal') {
      const note = prompt('Describe any fixes made to product specifications:', '');
      if (note !== null) {
        await window.productService.resubmitRejected(t.dataset.productId, { resubmitNote: note });
        window.auditService.recordEvent('PRODUCT_RESUBMITTED', { productId: t.dataset.productId, note });
        toast('Listing resubmitted! Returned to Pending Approval.', 'rotate-cw');
        route();
      }
      return;
    }
    if (act === 'sc-product-duplicate') {
      await window.productService.duplicateProduct(t.dataset.productId);
      toast('Product draft duplicated.', 'copy');
      route();
      return;
    }
    if (act === 'sc-product-archive') {
      await window.productService.archiveProduct(t.dataset.productId);
      toast('Listing moved to Archived.', 'archive');
      route();
      return;
    }
    if (act === 'sc-product-restore') {
      await window.productService.restoreProduct(t.dataset.productId);
      toast('Listing restored to active.', 'refresh-ccw');
      route();
      return;
    }
    if (act === 'sc-product-delete-draft' || act === 'sc-product-delete') {
      if (confirm('Permanently delete this product listing? This cannot be undone.')) {
        await window.productService.deleteProduct(t.dataset.productId);
        toast('Product deleted.', 'trash-2');
        route();
      }
      return;
    }

    // Inventory actions
    if (act === 'sc-stock-delta') {
      const pid = t.dataset.productId;
      const vid = t.dataset.variantId || null;
      const delta = Number(t.dataset.delta || 0);
      await window.inventoryService.adjustStock(pid, vid, delta);
      toast('Inventory updated.', 'boxes');
      route();
      return;
    }
    if (act === 'sc-edit-sku-modal') {
      const pid = t.dataset.productId;
      const vid = t.dataset.variantId || null;
      const cur = t.dataset.currentSku || '';
      const n = prompt('Enter updated SKU:', cur);
      if (n && n.trim() !== cur) {
        await window.inventoryService.updateSku(pid, vid, n.trim());
        toast('SKU updated.', 'edit-2');
        route();
      }
      return;
    }
    if (act === 'sc-set-threshold-modal') {
      const pid = t.dataset.productId;
      const cur = t.dataset.currentThreshold || '5';
      const n = prompt('Set low-stock alert threshold:', cur);
      if (n && !isNaN(Number(n))) {
        await window.inventoryService.setThreshold(pid, Number(n));
        toast('Threshold updated.', 'sliders');
        route();
      }
      return;
    }
    if (act === 'sc-open-inventory-history') {
      const hist = await window.inventoryService.getHistory();
      alert('Stock Movement History:\n\n' + hist.map(h => `${h.timestamp.slice(0,10)}: ${h.sku} (${h.change > 0 ? '+' : ''}${h.change}) - ${h.reason}`).join('\n'));
      return;
    }

    // Reviews & Questions
    if (act === 'sc-reviews-filter') {
      SC.reviewFilter = t.dataset.filter || 'All';
      route();
      return;
    }
    if (act === 'sc-questions-filter') {
      SC.questionFilter = t.dataset.filter || 'All';
      route();
      return;
    }
    if (act === 'sc-review-reply-modal') {
      const revId = t.dataset.reviewId;
      const reply = prompt('Write merchant response to customer review:', 'Thank you for your feedback! We take great pride in our anime collectible packaging.');
      if (reply && reply.trim()) {
        await window.reviewService.replyToReview(revId, reply.trim());
        toast('Reply published on product review.', 'message-square');
        route();
      }
      return;
    }
    if (act === 'sc-review-report') {
      const revId = t.dataset.reviewId;
      await window.reviewService.reportReview(revId);
      toast('Review flagged for administrative moderation.', 'shield-alert');
      route();
      return;
    }
    if (act === 'sc-question-answer-modal') {
      const qId = t.dataset.questionId;
      const ans = prompt('Answer customer pre-sale inquiry:');
      if (ans && ans.trim()) {
        await window.reviewService.answerQuestion(qId, ans.trim());
        toast('Answer published to product Q&A.', 'check-circle');
        route();
      }
      return;
    }

    // Payout actions
    if (act === 'sc-open-payout-modal') {
      const p = await window.payoutService.getOverview();
      SC.activeModal = 'payoutRequest';
      SC.modalData = p;
      route();
      return;
    }
    if (act === 'sc-submit-payout-request') {
      const amtInput = document.getElementById('payoutAmountInput');
      const amount = Number(amtInput ? amtInput.value : 0);
      try {
        await window.payoutService.requestPayout(amount);
        toast(`Payout request for ₦${amount.toLocaleString('en-NG')} submitted for bank settlement.`, 'wallet');
        SC.activeModal = null;
        route();
      } catch (err) {
        alert(err.message);
      }
      return;
    }
    if (act === 'sc-edit-bank-modal') {
      const nuban = prompt('Enter 10-digit Nigerian NUBAN account number:');
      if (nuban && nuban.length === 10) {
        await window.payoutService.updatePayoutAccount({ accountNumber: nuban });
        toast('Settlement bank account updated.', 'building-2');
        route();
      }
      return;
    }

    // Delivery & Store saves
    if (act === 'sc-save-delivery') {
      const form = document.getElementById('scDeliveryForm');
      if (form) {
        const formData = new FormData(form);
        await window.deliveryService.updateSettings({
          localDelivery: form.querySelector('[name="localDelivery"]').checked,
          nationwideDelivery: form.querySelector('[name="nationwideDelivery"]').checked,
          pickupAvailable: form.querySelector('[name="pickupAvailable"]').checked,
          freeShippingInState: form.querySelector('[name="freeShippingInState"]').checked,
          sameStateFee: Number(formData.get('sameStateFee') || 0),
          outsideStateFee: Number(formData.get('outsideStateFee') || 0),
          dispatchLocation: formData.get('dispatchLocation') || '',
          processingTime: formData.get('processingTime') || '',
          deliveryInstructions: formData.get('deliveryInstructions') || '',
          pickupInstructions: formData.get('pickupInstructions') || '',
          dispatchState: sellerServiceState()?.state || ''
        });
        toast('Shipping & delivery settings saved.', 'truck');
      }
      return;
    }
    if (act === 'sc-save-store') {
      const form = document.getElementById('scStoreForm');
      if (form) {
        const formData = new FormData(form);
        await window.sellerService.updateStore({
          storeName: formData.get('storeName'),
          slug: formData.get('slug'),
          banner: formData.get('banner'),
          logo: formData.get('logo'),
          description: formData.get('description'),
          state: formData.get('state'),
          city: formData.get('city'),
          category: formData.get('category'),
          contact: {
            phone: formData.get('phone'),
            email: formData.get('email')
          },
          returnPolicy: formData.get('returnPolicy'),
          refundPolicy: formData.get('refundPolicy')
        });
        toast('Store branding & policies saved.', 'store');
      }
      return;
    }
    if (act === 'sc-share-store-link') {
      const seller = await window.sellerService.getProfile();
      const link = window.storeService.getShareableLink(seller.slug);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).catch(() => {});
      }
      toast('Shareable store link copied: ' + link, 'share-2');
      return;
    }

    // Chart metrics
    if (act === 'sc-chart-metric') {
      SC.analyticsMetric = t.dataset.metric;
      route();
      return;
    }

    // Settings saves
    if (act === 'sc-save-settings') {
      const form = document.getElementById('scSettingsForm');
      if (!form) return;
      const fd = new FormData(form);
      const notifications = {};
      ['orders','payments','shipping','returns','refunds','reviews','questions','productApproval','productRejection','verification','security','announcements'].forEach(k => { notifications[k] = form.querySelector(`[name=\"notif_${k}\"]`)?.checked === true; });
      const account = { name: String(fd.get('accName') || '').trim(), email: String(fd.get('accEmail') || '').trim(), phone: String(fd.get('accPhone') || '').trim() };
      await window.settingsService.updateAccount(account);
      await window.settingsService.updateNotifications(notifications);
      toast('Seller settings saved successfully.', 'settings');
      route();
      return;
    }
    if (act === 'sc-toggle-2fa') {
      const s = await window.settingsService.getSettings();
      await window.settingsService.toggle2FA(!s.security.twoFactorEnabled);
      toast(s.security.twoFactorEnabled ? '2FA disabled.' : '2FA activated.', 'shield');
      route();
      return;
    }
    if (act === 'sc-logout-other-sessions') {
      await window.settingsService.logoutAllOtherSessions();
      toast('All other device sessions terminated.', 'log-out');
      route();
      return;
    }
    if (act === 'sc-danger-pause') {
      if (confirm('Pause store? Products will remain listed but orders will be paused.')) {
        await window.sellerService.setStoreStatus('Temporarily Closed');
        toast('Store paused.', 'pause-circle');
        route();
      }
      return;
    }
    if (act === 'sc-danger-close') {
      if (confirm('Temporarily close store? Storefront will display Temporarily Closed badge.')) {
        await window.sellerService.setStoreStatus('Temporarily Closed');
        toast('Store marked Temporarily Closed.', 'clock');
        route();
      }
      return;
    }
    if (act === 'sc-danger-delete') {
      alert('To close or delete a verified marketplace store, please contact ANILyfe compliance support.');
      return;
    }
  });

  document.addEventListener('submit', async function(e) {
    if (e.target.id !== 'scEditProductForm') return;
    e.preventDefault();
    const f = new FormData(e.target);
    const id = SC.modalData?.id;
    if (!id) return;
    try {
      const product = SC.modalData;
      const price = Number(f.get('price'));
      const stock = Number(f.get('stock'));
      if (!Number.isFinite(price) || price <= 0) throw new Error('Price must be greater than ₦0.');
      if (!Number.isFinite(stock) || stock < 0) throw new Error('Stock cannot be negative.');
      const variants = Array.isArray(product.variants) && product.variants.length ? product.variants.map(v => ({...v, price, stock: Math.max(0, Math.floor(stock / product.variants.length))})) : [{sku:product.sku || `SKU-${id}`, price, stock}];
      await window.productService.updateProduct(id, { name:String(f.get('name')||'').trim(), price, description:String(f.get('description')||''), stock, variants, images:product.images||[], dimensions:{width:f.get('dimensionWidth')||'',height:f.get('dimensionHeight')||'',depth:f.get('dimensionDepth')||'',unit:'in'} });
      SC.activeModal = null; SC.modalData = null;
      toast('Product updated successfully.', 'check-circle-2');
      route();
    } catch (err) { toast(err.message || 'Unable to update product.', 'alert-circle'); }
  });

  document.addEventListener('change', async function(e){ const input=e.target.closest('[data-sc-edit-images]'); if(!input)return; try{for(const file of Array.from(input.files||[])){const img=await readImageFile(file); if(!SC.modalData.images)SC.modalData.images=[]; SC.modalData.images.push(img);} route();}catch(err){toast(err.message,'alert-circle');} });
  // Input & Change listeners
  document.addEventListener('input', function(e) {
    const t = e.target;
    if (t.dataset.action === 'sc-wizard-input') {
      const field = t.dataset.field;
      if(field==='dimensionWidth'||field==='dimensionHeight'||field==='dimensionDepth'){SC.wizardData.dimensions={...(SC.wizardData.dimensions||{}),width:field==='dimensionWidth'?t.value:(SC.wizardData.dimensions?.width||''),height:field==='dimensionHeight'?t.value:(SC.wizardData.dimensions?.height||''),depth:field==='dimensionDepth'?t.value:(SC.wizardData.dimensions?.depth||''),unit:'in'};} else SC.wizardData[field] = t.value;
    }
    if (t.dataset.action === 'sc-orders-search') {
      SC.searchQuery = t.value;
      route();
    }
    if (t.dataset.action === 'sc-products-search') {
      SC.searchQuery = t.value;
      route();
    }
    if (t.dataset.action === 'sc-inventory-search') {
      SC.searchQuery = t.value;
      route();
    }
  });

  document.addEventListener('change', async function(e) {
    const t = e.target;
    if (t.dataset.sellerProfileImage) {
      const file = t.files && t.files[0];
      if (!file) return;
      try {
        const image = await readImageFile(file);
        await window.settingsService.updateAccount({ avatar: image });
        toast('Seller profile photo uploaded and saved.', 'image');
        route();
      } catch (err) { toast(err.message || 'Unable to upload image.', 'alert-circle'); }
      return;
    }
    if (t.dataset.storeImage) {
      const file = t.files && t.files[0];
      if (!file) return;
      try {
        const image = await readImageFile(file);
        await window.sellerService.updateStore({ [t.dataset.storeImage]: image });
        toast(`${t.dataset.storeImage === 'banner' ? 'Store banner' : 'Store logo'} uploaded and saved.`, 'image');
        route();
      } catch (err) { toast(err.message || 'Unable to upload image.', 'alert-circle'); }
      return;
    }
    if (t.dataset.scWizardPhotoInput !== undefined || t.hasAttribute('data-sc-wizard-photo-input')) {
      const files = Array.from(t.files || []);
      if (!files.length) return;
      try {
        for (const file of files) {
          const image = await readImageFile(file);
          SC.wizardData.images.push(image);
        }
        toast(`${files.length} product photo${files.length===1?'':'s'} added.`, 'image');
        route();
      } catch (err) { toast(err.message || 'Unable to upload product image.', 'alert-circle'); }
      return;
    }
    if (t.dataset.action === 'sc-chart-range') {
      SC.analyticsRange = t.value;
      route();
    }
    if (t.dataset.action === 'sc-analytics-range') {
      SC.analyticsRange = t.value;
      route();
    }
  });

  // Expose global entrypoint to router
  window.viewSellerCenter = viewSellerCenter;
})();
