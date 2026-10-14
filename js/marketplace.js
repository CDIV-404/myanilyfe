/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Marketplace browse view: search/category state, top bar, deal countdown. */

function viewMarketplace(){
  const u = currentUser();
  if(window.ANILyfeAPI?.state?.apiErrors?.products) return `<div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5"><div class="max-w-lg w-full">${window.ANILyfeUI?.ErrorState?.('Marketplace unavailable','We could not load marketplace products. Please try again.')||''}</div></div>`;
  const products = approvedProducts().filter(p=>{
    const okCat = mqState.cat==='All' || catKey(p.category)===catKey(mqState.cat);
    const okQ = !mqState.q || p.name.toLowerCase().includes(mqState.q.toLowerCase());
    return okCat && okQ;
  });
  const deal = approvedProducts().find(p=>Number(p.off||0)>0) || null;
  const cart = LS.get('cart',[]), wish = LS.get('wishlist',[]);

  const announcement=(LS.get('announcements',[])||[]).find(a=>a.active!==false && !(LS.get('announcementDismissed',[])||[]).includes(a.id));
  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    <!-- top bar -->
    ${announcement ? `<div class="bg-[#081F5C] text-white"><div class="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-3 text-xs"><i data-lucide="megaphone" style="width:14px;height:14px;color:#9BC7FF"></i>${announcement.image ? `<img src="${announcement.image}" class="w-7 h-7 rounded-md object-cover" alt="">` : ""}<span class="flex-1 font-bold">${esc(announcement.text)}</span>${announcement.link ? `<a href="${esc(announcement.link)}" target="_blank" rel="noopener" class="text-[#9BC7FF] font-extrabold">Open</a>` : ""}<button data-action="dismiss-announcement" data-id="${announcement.id}" class="text-white/70">✕</button></div></div>` : ""}
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#D0E3FF]">
      <div class="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
        ${LOGO('text-2xl shrink-0')}
        <div class="flex-1 max-w-2xl hidden md:flex">
          <div class="relative flex-1">
            <input data-mqi class="inp !rounded-l-xl !rounded-r-none !border-r-0 !bg-[#F6FCFF]" placeholder="Search for anime products, brands and more…" value="${esc(mqState.q)}"/>
          </div>
          <select id="mqCat" class="inp !w-44 !rounded-none !bg-[#E7F1FF] !border-[#D0E3FF]">
            <option value="All">All Categories</option>
            ${Object.keys(CATS).map(c=>`<option ${mqState.cat===c?'selected':''}>${c}</option>`).join('')}
          </select>
          <button class="btn btn-primary !rounded-l-none !px-5" data-action="mq-search"><i data-lucide="search" style="width:17px;height:17px"></i></button>
        </div>
        <div class="flex items-center gap-1 ml-auto">
          ${regionSelect('hidden lg:block !w-36')}
          <button class="icon-btn" data-action="toggle-wish-drop" aria-label="Wishlist"><i data-lucide="heart" style="width:19px;height:19px"></i>${wish.length?`<span class="count-badge">${wish.length}</span>`:''}</button>
          <button class="icon-btn" data-action="toggle-cart" aria-label="Cart"><i data-lucide="shopping-cart" style="width:19px;height:19px"></i>${cart.length?`<span class="count-badge">${cart.reduce((a,c)=>a+c.qty,0)}</span>`:''}</button>
          <button class="icon-btn" data-action="toggle-notif" aria-label="Notifications"><i data-lucide="bell" style="width:19px;height:19px"></i>${u&&sellerOf(u.id)?.status==='pending'?'<span class="count-badge !bg-[#9BC7FF]">1</span>':''}</button>

          <!-- cart drop -->
          <div class="drop glass rounded-2xl p-4 !w-80" id="drop-cart">
            <div class="font-display font-bold text-sm mb-3 flex items-center gap-2"><i data-lucide="shopping-bag" style="width:15px;height:15px;color:#334EAC"></i> Your Cart</div>
            ${cart.length? cart.map(c=>{ const p=LS.get('products',[]).find(x=>x.id===c.id); if(!p) return '';
              return `<div class="flex items-center gap-3 py-2 border-b border-[#E7F1FF] last:border-0">
                <div class="w-11 h-11 rounded-lg bg-[#E7F1FF] overflow-hidden shrink-0">${p.img?`<img src="${p.img}" class="w-full h-full object-cover" onerror="this.remove()"/>`:''}</div>
                <div class="flex-1 min-w-0"><div class="text-xs font-bold truncate">${esc(p.name)}</div><div class="text-[11px] text-[#708BD1] font-bold">${fmt(p.price)} × ${c.qty}</div></div>
                <button class="text-[#B42318]" data-action="cart-remove" data-id="${p.id}"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
              </div>`;}).join('') : '<div class="text-xs text-[#708BD1] font-semibold py-3">Your cart is empty — go find something legendary.</div>'}
            ${cart.length?`<div class="flex items-center justify-between mt-3 pt-3 border-t border-[#D0E3FF]"><span class="text-xs font-bold text-[#708BD1]">TOTAL</span><span class="font-display font-extrabold">${fmt(cart.reduce((a,c)=>{const p=LS.get('products',[]).find(x=>x.id===c.id);return a+(p?p.price*c.qty:0);},0))}</span></div>
            <button class="btn btn-primary w-full mt-3 !py-2.5" data-action="checkout">Checkout</button>`:''}
          </div>
          <!-- notif drop -->
          <div class="drop glass rounded-2xl p-4 !w-80" id="drop-notif">
            <div class="font-display font-bold text-sm mb-3 flex items-center gap-2"><i data-lucide="bell-ring" style="width:15px;height:15px;color:#334EAC"></i> Notifications</div>
            ${(()=>{ const s = u&&sellerOf(u.id);
              if(s&&s.status==='pending') return `<div class="flex gap-3 text-xs"><span class="w-8 h-8 rounded-lg bg-[#FFF7E0] flex items-center justify-center shrink-0"><i data-lucide="hourglass" style="width:15px;height:15px;color:#B7791F"></i></span><div><b>Seller application pending.</b><div class="text-[#708BD1] mt-.5">The primary administrator is reviewing “${esc(s.businessName)}”.</div></div></div>`;
              if(s&&s.status==='approved') return `<div class="flex gap-3 text-xs"><span class="w-8 h-8 rounded-lg bg-[#E6F7EC] flex items-center justify-center shrink-0"><i data-lucide="badge-check" style="width:15px;height:15px;color:#1F9D55"></i></span><div><b>You're an approved seller!</b><div class="text-[#708BD1] mt-.5">Your products are live on the marketplace.</div></div></div>`;
              return `<div class="text-xs text-[#708BD1] font-semibold py-1">No new notifications. Welcome to Anilyfe.</div>`; })()}
          </div>
          <!-- wishlist drop -->
          <div class="drop glass rounded-2xl p-4 !w-80" id="drop-wish">
            <div class="font-display font-bold text-sm mb-3 flex items-center gap-2"><i data-lucide="heart" style="width:15px;height:15px;color:#334EAC"></i> Wishlist</div>
            ${wish.length? wish.map(id=>{const p=LS.get('products',[]).find(x=>x.id===id); if(!p)return '';
              return `<div class="flex items-center gap-3 py-2 border-b border-[#E7F1FF] last:border-0">
                <div class="w-10 h-10 rounded-lg bg-[#E7F1FF] overflow-hidden shrink-0">${p.img?`<img src="${p.img}" width="40" height="40" class="w-full h-full object-cover" onerror="this.remove()"/>`:''}</div>
                <div class="flex-1 min-w-0"><div class="text-xs font-bold truncate">${esc(p.name)}</div><div class="text-[11px] text-[#708BD1] font-bold">${fmt(p.price)}</div></div>
                <button class="btn btn-outline !py-1 !px-2.5 !text-[10px]" data-action="add-cart" data-id="${p.id}">Add</button>
              </div>`;}).join('') : '<div class="text-xs text-[#708BD1] font-semibold py-3">Select the heart on any product to save it here.</div>'}
          </div>

          ${u ? `
          <div class="relative ml-1">
            <button class="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-[#E7F1FF] transition" data-action="toggle-user">
              <span class="w-9 h-9 rounded-full bg-gradient-to-br from-[#334EAC] to-[#081F5C] text-white flex items-center justify-center font-display font-bold text-sm">${esc(u.name[0].toUpperCase())}</span>
              <span class="hidden sm:block text-left"><span class="block text-xs font-extrabold leading-tight">${esc(u.name.split(' ')[0])}</span><span class="block text-[10px] text-[#708BD1] font-bold capitalize">${sellerOf(u.id)?'Seller':'Buyer'}</span></span>
              <i data-lucide="chevron-down" style="width:14px;height:14px;color:#708BD1"></i>
            </button>
            <div class="drop glass rounded-2xl p-2 !w-52" id="drop-user">
              <a href="#/profile" class="side-item"><i data-lucide="circle-user-round" style="width:16px;height:16px"></i> My Profile</a>
              <a href="#/orders" class="side-item"><i data-lucide="package-check" style="width:16px;height:16px"></i> My Orders</a>
              <a href="#/wishlist" class="side-item"><i data-lucide="heart" style="width:16px;height:16px"></i> Wishlist</a>
              ${sellerOf(u.id)?`<a href="#/seller" class="side-item"><i data-lucide="layout-dashboard" style="width:16px;height:16px"></i> Seller Dashboard</a>`:`<a href="#/profile" class="side-item"><i data-lucide="store" style="width:16px;height:16px"></i> Become a Seller</a>`}
              <button class="side-item !text-[#B42318] w-full" data-action="logout"><i data-lucide="log-out" style="width:16px;height:16px"></i> Log out</button>
            </div>
          </div>` : `<a href="#/auth" class="btn btn-primary !py-2 !text-xs ml-1">Login</a>`}
        </div>
      </div>
      <!-- mobile search -->
      <div class="md:hidden px-4 pb-3 flex gap-2">
        <input data-mqi class="inp !bg-[#F6FCFF]" placeholder="Search anime products…" value="${esc(mqState.q)}"/>
        <button class="btn btn-primary !px-4" data-action="mq-search"><i data-lucide="search" style="width:16px;height:16px"></i></button>
      </div>
    </header>
    <section class="max-w-[1400px] mx-auto px-4 pt-5"><div class="relative h-28 overflow-hidden rounded-3xl bg-[#081F5C] md:h-40"><img src="assets/images/marketplace.png" width="1400" height="160" alt="" class="h-full w-full object-cover" onerror="this.remove()"><div class="absolute inset-0 bg-gradient-to-r from-[#071B52]/80 to-transparent"></div><div class="absolute left-5 top-1/2 -translate-y-1/2"><div class="font-tech text-[10px] uppercase tracking-[.3em] text-[#d2bce0]">THE ANIME MARKETPLACE</div><div class="font-display text-lg font-extrabold text-white md:text-2xl">Find your next favourite</div></div></div></section>

    <div class="max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] gap-6">
      <!-- LEFT SIDEBAR -->
      <aside class="hidden lg:block space-y-5">
        <div class="card p-4">
          <div class="btn btn-primary w-full !justify-start mb-4"><i data-lucide="list" style="width:16px;height:16px"></i> Browse Categories</div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1] mb-2">CATEGORIES</div>
          <div class="space-y-1">
            <button class="side-item w-full ${mqState.cat==='All'?'active':''}" data-action="mq-cat" data-cat="All"><i data-lucide="layout-grid" style="width:16px;height:16px"></i> All Products</button>
            ${Object.entries(CATS).map(([k,v])=>`<button class="side-item w-full ${mqState.cat===k?'active':''}" data-action="mq-cat" data-cat="${k}"><i data-lucide="${v.icon}" style="width:16px;height:16px"></i> ${k}</button>`).join('')}
          </div>
        </div>
        <div class="card p-5 !bg-gradient-to-br !from-[#081F5C] !to-[#334EAC] !border-0">
          <div class="flex items-center gap-2 text-[#9BC7FF] font-display font-bold text-sm mb-2"><i data-lucide="crown" style="width:16px;height:16px"></i> Become a Seller</div>
          <p class="text-xs text-[#B9CCE8] leading-relaxed mb-4">Start your anime business on Anilyfe and reach thousands of fans.</p>
          <a href="${u&&sellerOf(u.id)?'#/seller':'#/auth'}" class="btn w-full !bg-white !text-[#081F5C] !py-2.5 !text-xs hover:!bg-[#D0E3FF]">Start Selling Today</a>
        </div>
        <div class="card p-5">
          <div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1] mb-3">WHY ANILYFE?</div>
          ${[['shield-check','Secure Payments','100% secure transactions'],['badge-check','Buyer Protection','Shop with confidence'],['truck','Fast Delivery','Nationwide & worldwide'],['headset','24/7 Support',"We're always here to help"]].map(x=>`
          <div class="flex items-start gap-3 py-2"><span class="w-8 h-8 rounded-lg bg-[#E7F1FF] flex items-center justify-center shrink-0"><i data-lucide="${x[0]}" style="width:15px;height:15px;color:#334EAC"></i></span><div><div class="text-xs font-extrabold">${x[1]}</div><div class="text-[11px] text-[#708BD1] font-semibold">${x[2]}</div></div></div>`).join('')}
        </div>
      </aside>

      <!-- CENTER -->
      <main class="min-w-0">
        <!-- hero banner -->
        <div class="relative rounded-2xl overflow-hidden mb-7 reveal" style="background:linear-gradient(115deg,#081F5C 0%,#0B2A7A 55%,#334EAC 100%)">
          <img src="assets/images/web/figures-display.jpg" class="absolute inset-0 w-full h-full object-cover opacity-30" onerror="this.remove()" alt=""/>
          <div class="absolute inset-0" style="background:linear-gradient(100deg,rgba(8,31,92,.92) 30%,rgba(8,31,92,.25))"></div>
          ${sparks(12,3)}<div class="shoot" style="top:20%;left:85%"></div>
          <div class="relative z-10 p-8 md:p-12 max-w-lg">
            <div class="font-tech text-[10px] font-bold tracking-[.35em] text-[#9BC7FF] mb-3">WELCOME TO</div>
            ${wordmark('text-5xl md:text-6xl', true)}
            <p class="mt-4 text-sm text-[#B9CCE8] leading-relaxed">The ultimate marketplace and community for anime lovers. Discover, connect and support the anime culture.</p>
            <div class="mt-6 flex gap-3">
              <a href="#niches-mq" class="btn btn-primary !py-2.5 !text-xs">Shop Now <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
            </div>
          </div>
        </div>

        <!-- category chips (mobile + quick) -->
        <div id="niches-mq" class="mb-7 reveal">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-display font-bold text-lg">Shop by Category</h2>
            <button class="text-xs font-bold text-[#334EAC] hover:underline" data-action="mq-cat" data-cat="All">View all</button>
          </div>
          <div class="flex gap-3 overflow-x-auto pb-2">
            ${Object.entries(CATS).map(([k,v])=>`
            <button class="flex flex-col items-center gap-2 shrink-0 group" data-action="mq-cat" data-cat="${k}">
              <span class="w-14 h-14 rounded-full bg-white border-2 ${mqState.cat===k?'!border-[#334EAC] bg-[#334EAC]':''} border-[#D0E3FF] flex items-center justify-center transition group-hover:-translate-y-1 group-hover:border-[#334EAC]"><i data-lucide="${v.icon}" style="width:21px;height:21px;color:${mqState.cat===k?'#fff':'#334EAC'}"></i></span>
              <span class="text-[11px] font-bold ${mqState.cat===k?'text-[#334EAC]':'text-[#5A6A9C]'}">${v.short}</span>
            </button>`).join('')}
          </div>
        </div>

        <!-- featured products -->
        <div class="reveal">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-bold text-lg">${mqState.q||mqState.cat!=='All'?'Search results':'Featured Products'} <span class="text-xs font-bold text-[#708BD1]">(${products.length})</span></h2>
            <button class="text-xs font-bold text-[#334EAC] hover:underline" data-action="mq-cat" data-cat="All">View all</button>
          </div>
          ${products.length? `<div class="grid grid-cols-2 md:grid-cols-3 gap-4">${products.map(p=>productCard(p)).join('')}</div>` :
          `<div class="card p-12 text-center">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-[#E7F1FF] flex items-center justify-center mb-4"><i data-lucide="package-open" style="width:28px;height:28px;color:#708BD1"></i></div>
            <div class="font-display font-bold text-lg">Nothing here yet</div>
            <p class="text-sm text-[#708BD1] mt-1">${mqState.q||mqState.cat!=='All'?'Try another search or category.':'New finds will appear here as sellers add their collections.'}</p>
            ${mqState.cat!=='All'||mqState.q?'<button class="btn btn-primary mt-5" data-action="mq-cat" data-cat="All">Browse all products</button>':''}
          </div>`}
        </div>
      </main>

      <!-- RIGHT SIDEBAR -->
      <aside class="space-y-5">
        ${deal ? `<div class="card p-5 reveal">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2 font-display font-bold text-sm"><span class="text-[#9BC7FF]"><i data-lucide="flame" style="width:16px;height:16px"></i></span> Hot Deals</div>
            <span class="text-[10px] font-extrabold text-[#334EAC] uppercase tracking-wider">Offer</span>
          </div>
          <div class="grid grid-cols-4 gap-2 mb-5">
            <div class="cd-box"><b id="cd-d">--</b><span>Days</span></div>
            <div class="cd-box"><b id="cd-h">--</b><span>Hours</span></div>
            <div class="cd-box"><b id="cd-m">--</b><span>Mins</span></div>
            <div class="cd-box"><b id="cd-s">--</b><span>Secs</span></div>
          </div>
          ${deal?`
          <div class="relative rounded-xl bg-[#F6FCFF] border border-[#D0E3FF] p-3 flex gap-3">
            ${deal.off?`<span class="absolute -top-2 left-3 badge !bg-[#334EAC] !text-white">${deal.off}% OFF</span>`:''}
            <div class="w-20 h-20 rounded-lg overflow-hidden bg-[#E7F1FF] shrink-0">${deal.img?`<img src="${deal.img}" class="w-full h-full object-cover" alt="${esc(deal.name)}"/>`:`<div class="w-full h-full flex items-center justify-center"><i data-lucide="${CATS[catKey(deal.category)]?.icon||'package'}" style="width:26px;height:26px;color:#708BD1"></i></div>`}</div>
            <div class="min-w-0">
              <div class="text-xs font-extrabold leading-snug">${esc(deal.name)}</div>
              <div class="mt-1 flex items-baseline gap-2"><span class="font-display font-extrabold text-[#081F5C]">${fmt(deal.price)}</span>${deal.off?`<span class="text-[10px] text-[#708BD1] line-through font-bold">${fmt(Math.round(deal.price/(1-deal.off/100)))}</span>`:''}</div>
              <div class="flex items-center gap-1 text-[10px] text-[#708BD1] font-bold mt-.5"><i data-lucide="star" style="width:11px;height:11px;color:#9BC7FF;fill:#9BC7FF"></i> ${deal.rating} (${deal.reviews})</div>
              <button class="btn btn-outline mt-2 !py-1 !px-3 !text-[10px]" data-action="add-cart" data-id="${deal.id}">Shop Now</button>
            </div>
          </div>`:''}
        </div>` : ''}

      </aside>
    </div>

    ${siteFooter('border-t border-[#D0E3FF] bg-white py-8 mt-6')}
  </div>`;
}


function viewCategory(category='All'){
  const selected = category && CATS[catKey(category)] ? catKey(category) : 'All';
  mqState.cat = selected;
  const u = currentUser();
  const products = approvedProducts().filter(p => selected === 'All' || catKey(p.category) === catKey(selected));
  const categoryLabel = selected === 'All' ? 'All Products' : selected;
  const categoryArt = selected === 'All'
    ? 'assets/images/web/figures-display.jpg'
    : ((window.ANILyfeCategories||[]).find(c=>catKey(c.title)===selected)||{}).image || 'assets/images/web/figures-display.jpg';
  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    ${marketTopBar(u || {id:''})}
    <main class="max-w-[1400px] mx-auto px-4 py-8">
      <div class="card p-6 md:p-8 reveal">
        <img src="${categoryArt}" alt="${esc(categoryLabel)} artwork" class="mb-6 h-40 w-full rounded-2xl object-cover md:h-52" loading="lazy" onerror="this.remove()">
        <div class="flex items-center justify-between gap-3">
          <div class="font-tech text-[10px] font-bold tracking-[.28em] text-[#708BD1]">CATEGORY</div>
          <a href="#/marketplace" class="btn btn-ghost !px-3 !py-2 !text-[11px]">Back to marketplace</a>
        </div>
        <h1 class="font-display font-extrabold text-3xl md:text-5xl mt-3 text-[#081F5C]">${esc(categoryLabel)}</h1>
        <p class="mt-2 text-sm text-[#5A6A9C] max-w-2xl">Browse all products sellers have posted in this category, including new arrivals and in-stock picks.</p>
      </div>

      <div class="mt-6 reveal">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-lg">Shop this category</h2>
          <span class="text-xs font-bold text-[#708BD1]">${products.length} listings</span>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2">
          <button class="flex items-center gap-2 shrink-0 px-3 py-2 rounded-full text-xs font-bold ${selected==='All'?'bg-[#334EAC] text-white':'bg-white border border-[#D0E3FF] text-[#334EAC]'}" data-action="mq-cat" data-cat="All">All products</button>
          ${Object.entries(CATS).map(([k,v])=>`<button class="flex items-center gap-2 shrink-0 px-3 py-2 rounded-full text-xs font-bold ${selected===k?'bg-[#334EAC] text-white':'bg-white border border-[#D0E3FF] text-[#334EAC]'}" data-action="mq-cat" data-cat="${k}"><i data-lucide="${v.icon}" style="width:14px;height:14px"></i> ${k}</button>`).join('')}
        </div>
      </div>

      <div class="mt-8">
        ${products.length ? `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">${products.map(p=>productCard(p)).join('')}</div>` : `
          <div class="card p-12 text-center reveal">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-[#E7F1FF] flex items-center justify-center mb-4"><i data-lucide="package-open" style="width:28px;height:28px;color:#708BD1"></i></div>
            <div class="font-display font-bold text-lg">No products to display</div>
            <p class="text-sm text-[#708BD1] mt-1">Sellers have not listed anything here yet. Check back soon or browse another category.</p>
            <a href="#/marketplace" class="btn btn-primary mt-5">Browse all categories</a>
          </div>`}
      </div>
    </main>
  </div>`;
}

function marketTopBar(u){
  return `<header class="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#D0E3FF]">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      ${LOGO('text-2xl')}
      <nav class="flex items-center gap-1">
        <a href="#/marketplace" class="icon-btn" title="Marketplace"><i data-lucide="store" style="width:18px;height:18px"></i></a>
        <a href="#/profile" class="icon-btn" title="Profile"><i data-lucide="circle-user-round" style="width:18px;height:18px"></i></a>
        ${u && sellerOf(u.id)?`<a href="#/seller" class="icon-btn" title="Seller dashboard"><i data-lucide="layout-dashboard" style="width:18px;height:18px"></i></a>`:''}
        <button class="icon-btn" data-action="logout" title="Log out"><i data-lucide="log-out" style="width:18px;height:18px"></i></button>
      </nav>
    </div>
  </header>`;
}

function startCountdown(){ return; }
