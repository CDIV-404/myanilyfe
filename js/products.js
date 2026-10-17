/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Product card rendering + seller-side product form helpers. */

function productCard(p){
  const wish = LS.get('wishlist',[]);
  const liked = wish.includes(p.id);
  const seller = LS.get('sellers',[]).find(s=>s.id===p.sellerId);
  const isFounding = Boolean(seller && (seller.foundingSeller || seller.foundingSellerNumber || seller.foundingSellerActive));
  return `
  <div class="prod-card card !rounded-2xl p-3 flex flex-col">
    <div class="prod-media">
      <div class="ph-icon"><i data-lucide="${CATS[catKey(p.category)] ? CATS[catKey(p.category)].icon : 'package'}" style="width:44px;height:44px"></i></div>
      ${p.img?`<img src="${p.img}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()"/>`:`<img src="${window.ANILyfeCategoryImageFor(p.category)}" alt="${esc(p.name)}" loading="lazy" class="w-full h-full object-cover" onerror="this.remove()"/>`}
      <span class="absolute bottom-2 left-2 badge !bg-[#081F5C]/85 !text-white backdrop-blur">${CATS[catKey(p.category)] ? CATS[catKey(p.category)].short : 'Anime'}</span>
      ${p.off?`<span class="absolute top-2 left-2 badge !bg-[#9BC7FF] !text-[#081F5C]">-${p.off}%</span>`:''}
      <button class="absolute top-2 right-2 w-8 h-8 rounded-full ${liked?'bg-[#334EAC]':'bg-white/90'} flex items-center justify-center transition hover:scale-110" data-action="wish" data-id="${p.id}" aria-label="wishlist">
        <i data-lucide="heart" style="width:15px;height:15px;color:${liked?'#fff':'#334EAC'};${liked?'fill:#fff':''}"></i>
      </button>
    </div>
    <div class="pt-3 flex-1 flex flex-col">
      <div class="text-[13px] font-extrabold leading-snug line-clamp-2 min-h-[2.3em]">${esc(p.name)}</div>
      <div class="text-[10px] text-[#708BD1] font-bold mt-.5 mb-1.5 flex items-center gap-1 truncate">
        <span>by ${esc(seller?seller.businessName:'Anilyfe')}</span>
        ${isFounding ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold"><i data-lucide="award" style="width:9px;height:9px"></i> #001</span>` : ''}
      </div>
      <div class="mt-auto flex items-end justify-between">
        <div>
          <div class="font-display font-extrabold text-[15px]">${fmt(p.price)}</div>
          <div class="flex items-center gap-1 text-[10px] text-[#708BD1] font-bold"><i data-lucide="star" style="width:10px;height:10px;color:#9BC7FF;fill:#9BC7FF"></i> ${p.rating} (${p.reviews || p.reviewsCount || 0})</div>
        </div>
        <div class="flex gap-2 items-center">
          <a href="#/product/${p.id}" class="btn btn-outline !py-1.5 !px-2 !text-[10px]">View</a>
          <button class="w-9 h-9 rounded-xl bg-[#E7F1FF] hover:bg-[#334EAC] group flex items-center justify-center transition" data-action="add-cart" data-id="${p.id}" aria-label="add to cart">
            <i data-lucide="plus" style="width:16px;height:16px;color:#334EAC" class="group-hover:!text-white"></i>
          </button>
        </div>
      </div>
      ${p.stock<=5?`<div class="mt-2 text-[10px] font-extrabold text-[#B7791F] flex items-center gap-1"><i data-lucide="alert-triangle" style="width:11px;height:11px"></i> Only ${p.stock} left</div>`:''}
    </div>
  </div>`;
}

async function viewProduct(id){
  let p = null;
  if (window.productService) {
    p = await window.productService.getProductById(id) || await window.productService.getProductBySlug(id);
  }
  if (!p) {
    const products = LS.get('products', []);
    p = products.find(x=>x.id===id || x.slug===id) || products[0];
  }

  if(!p) return `
  <div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5">
    <div class="card p-10 text-center">
      <div class="w-16 h-16 rounded-2xl bg-[#E7F1FF] flex items-center justify-center mx-auto mb-4"><i data-lucide="package-search" style="width:28px;height:28px;color:#334EAC"></i></div>
      <h1 class="font-display font-extrabold text-2xl">Product unavailable</h1>
      <p class="text-sm text-[#708BD1] mt-2">This item is no longer available on the marketplace.</p>
      <a href="#/marketplace" class="btn btn-primary mt-5">Browse products</a>
    </div>
  </div>`;

  let seller = (window.ANILyfeAPI?.state?.seller?.id===p.sellerId ? window.ANILyfeAPI.state.seller : null) || (window.ANILyfeAPI?.state?.admin?.sellers||[]).find(s=>s.id===p.sellerId) || null; if(!seller && window.ANILyfeAPI?.request){ try { const sf=await window.ANILyfeAPI.request('/api/sellers/'+encodeURIComponent(p.sellerId)); seller=sf?.profile||null; } catch(e){} }
  if(!seller || seller.status !== 'approved' || !['Published','Approved'].includes(p.approvalStatus || p.status)) return `<div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5"><div class="card p-10 text-center"><h1 class="font-display font-extrabold text-2xl">Product unavailable</h1><p class="text-sm text-[#708BD1] mt-2">This item is not currently published on the marketplace.</p><a href="#/marketplace" class="btn btn-primary mt-5">Browse products</a></div></div>`;

  const isFounding = Boolean(seller && (seller.foundingSeller || seller.foundingSellerNumber || seller.foundingSellerActive));
  const liked = LS.get('wishlist',[]).includes(p.id);
  const allProds = LS.get('products',[]);
  const approvedSellerIds = new Set(LS.get('sellers',[]).filter(s=>s.status==='approved').map(s=>s.id));
  const related = allProds.filter(x=>x.id!==p.id && x.category===p.category && approvedSellerIds.has(x.sellerId) && ['Published','Approved'].includes(x.approvalStatus || x.status)).slice(0,4);

  const images = (p.images && p.images.length) ? p.images : (p.img ? [p.img] : []);
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  const sku = p.sku || (p.variants && p.variants[0] ? p.variants[0].sku : 'ANL-' + p.id);
  const displayPrice = p.salePrice || p.price;
  const originalPrice = p.discount ? Math.round(displayPrice / (1 - (p.discount / 100))) : (p.off ? Math.round(displayPrice * (1 + p.off / 100)) : null);
  const storeSlug = seller.slug || seller.id;

  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D0E3FF]">
      <div class="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        ${LOGO('text-2xl')}
        <div class="flex items-center gap-2">
          <a href="#/marketplace" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Marketplace</a>
          <a href="#/store/${storeSlug}" class="btn btn-outline text-xs hidden sm:inline-flex"><i data-lucide="store" style="width:14px;height:14px"></i> Visit Store</a>
          <button class="btn btn-primary !py-2 !px-3.5 text-xs font-bold" data-action="add-cart" data-id="${p.id}"><i data-lucide="shopping-cart" style="width:14px;height:14px"></i> Add to cart</button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-5 py-8 pb-20">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
        <a href="#/marketplace" class="hover:text-[#334EAC]">Marketplace</a>
        <span>/</span>
        <a href="#/category/${encodeURIComponent(p.category || 'Figures & Collectibles')}" class="hover:text-[#334EAC]">${esc(p.category || 'Figures & Collectibles')}</a>
        <span>/</span>
        <span class="text-slate-800 font-bold truncate max-w-xs sm:max-w-md">${esc(p.name)}</span>
      </nav>

      <div class="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
        <!-- Media Gallery -->
        <div class="card p-4 reveal">
          <div class="rounded-2xl overflow-hidden bg-[#E7F1FF] border border-[#D0E3FF] relative shadow-inner">
            <div class="aspect-[4/3] w-full bg-[#E7F1FF] flex items-center justify-center overflow-hidden">
              <img id="mainProductImg" src="${images[0] || window.ANILyfeCategoryImageFor(p.category)}" alt="${esc(p.name)}" class="w-full h-full object-cover transition duration-300 hover:scale-105" onerror="this.src='assets/images/placeholder.svg'" />
            </div>
            <span class="absolute bottom-3 left-3 badge !bg-[#081F5C]/90 !text-white backdrop-blur-md shadow-xs">${esc(p.category || 'Figures')}</span>
            ${(p.discount || p.off) ? `<span class="absolute top-3 left-3 badge !bg-[#9BC7FF] !text-[#081F5C] font-extrabold shadow-xs">-${p.discount || p.off}% OFF</span>` : ''}
            ${isFounding ? `<span class="absolute top-3 right-3 badge !bg-gradient-to-r !from-amber-400 !to-amber-600 !text-white font-extrabold shadow-sm flex items-center gap-1"><i data-lucide="award" style="width:11px;height:11px"></i> Founding Seller #001</span>` : ''}
          </div>

          <!-- Thumbnails -->
          <div class="mt-4 grid grid-cols-4 gap-2.5">
            ${(images.length ? images : [window.ANILyfeCategoryImageFor(p.category)]).map((img, idx) => `
              <button onclick="window.selectProductImage('${img}', this)" class="prod-thumb aspect-square rounded-xl border border-[#D0E3FF] bg-[#F6FCFF] overflow-hidden transition hover:opacity-90 ${idx === 0 ? 'ring-2 ring-[#334EAC]' : 'opacity-70'}">
                <img src="${img}" alt="" class="w-full h-full object-cover" onerror="this.remove()" />
              </button>
            `).join('')}
          </div>

          <!-- Authenticity Guarantee Banner -->
          <div class="mt-5 p-3 rounded-2xl bg-gradient-to-r from-[#E7F1FF] to-white border border-[#D0E3FF] flex items-center gap-3 text-xs">
            <div class="w-9 h-9 rounded-xl bg-[#334EAC] text-white flex items-center justify-center shrink-0">
              <i data-lucide="shield-check" style="width:18px;height:18px"></i>
            </div>
            <div>
              <div class="font-bold text-[#081F5C]">ANILyfe Authenticity & Buyer Protection</div>
              <div class="text-slate-500 text-[11px] mt-0.5">100% verified authentic anime licensed collectible. Packaged in shock-proof bubble wrap.</div>
            </div>
          </div>
        </div>

        <!-- Product Details -->
        <div class="reveal">
          <div class="flex items-center gap-2">
            <span class="font-tech text-[11px] font-bold tracking-[.25em] text-[#334EAC] uppercase">${esc(p.brand || 'OFFICIAL ANIME MERCH')}</span>
            <span class="text-slate-300">·</span>
            <span class="text-xs text-slate-400 font-mono font-bold" id="productSkuDisplay">SKU: ${sku}</span>
          </div>

          <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#081F5C] mt-2 leading-tight">${esc(p.name)}</h1>

          <div class="flex items-center gap-3 mt-3 text-xs text-slate-600">
            <span class="inline-flex items-center gap-1 font-extrabold text-[#081F5C] bg-[#E7F1FF] px-2.5 py-1 rounded-full">
              <i data-lucide="star" style="width:13px;height:13px;color:#9BC7FF;fill:#9BC7FF"></i> ${Number(p.rating || 0)}
            </span>
            <span class="font-medium text-slate-500">(${p.reviews || p.reviewsCount || 0} verified customer ratings)</span>
            <span class="badge ${p.stock > 0 ? (p.stock <= 5 ? '!bg-amber-100 !text-amber-900' : '!bg-[#E6F7EC] !text-[#1F9D55]') : '!bg-rose-100 !text-rose-700'} font-bold">
              ${p.stock > 0 ? (p.stock <= 5 ? `Low Stock: Only ${p.stock} left` : `${p.stock} Available in stock`) : 'Out of stock'}
            </span>
          </div>

          <!-- Price Display -->
          <div class="mt-5 p-4 rounded-2xl bg-white border border-[#D0E3FF] shadow-xs">
            <div class="flex items-baseline gap-3">
              <div class="font-display font-extrabold text-3xl sm:text-4xl text-[#081F5C]">${fmt(displayPrice)}</div>
              ${originalPrice ? `<span class="text-sm line-through text-slate-400 font-bold">${fmt(originalPrice)}</span>` : ''}
              ${(p.discount || p.off) ? `<span class="badge !bg-[#9BC7FF] !text-[#081F5C] font-extrabold">Save ${p.discount || p.off}%</span>` : ''}
            </div>
            <p class="text-[11px] text-slate-500 mt-1 font-medium">Standard Nigerian marketplace settlement price inclusive of VAT.</p>
          </div>

          <!-- Variants (Color & Size) -->
          <div class="mt-5 card p-4 space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-700">Edition / Color:</span>
                <span class="text-xs font-extrabold text-[#334EAC]" id="selectedColorName">${colors[0] || 'Select color'}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${colors.length ? colors.map((c, idx) => `
                  <button onclick="window.selectProductColor(this, '${c}', '${sku}')" class="prod-color-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition ${idx === 0 ? 'bg-[#081F5C] text-white border-[#081F5C]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}">
                    ${c}
                  </button>
                `).join('') : '<p class="text-xs text-slate-400">No size variants specified.</p>'}
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-700">Scale / Size:</span>
                <span class="text-xs font-extrabold text-[#334EAC]" id="selectedSizeName">${sizes[0] || 'Select size'}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${sizes.length ? sizes.map((s, idx) => `
                  <button onclick="window.selectProductSize(this, '${s}')" class="prod-size-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition ${idx === 0 ? 'bg-[#E7F1FF] text-[#334EAC] border-[#334EAC]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}">
                    ${s}
                  </button>
                `).join('') : '<p class="text-xs text-slate-400">No size variants specified.</p>'}
              </div>
            </div>
          </div>

          <!-- Purchase CTAs -->
          <div class="mt-6 flex flex-wrap gap-3">
            <button class="btn btn-primary flex-1 min-w-[200px] !py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition" data-action="add-cart" data-id="${p.id}">
              <i data-lucide="shopping-cart" style="width:17px;height:17px"></i>
              <span>Add to Cart</span>
            </button>
            <button class="btn btn-outline !px-4 !py-3.5 text-xs font-bold flex items-center gap-1.5" data-action="wish" data-id="${p.id}">
              <i data-lucide="heart" style="width:16px;height:16px;${liked ? 'fill:#334EAC;color:#334EAC' : ''}"></i>
              <span>${liked ? 'Saved' : 'Wishlist'}</span>
            </button>
            <button class="btn btn-ghost !px-4 !py-3.5 text-xs font-bold flex items-center gap-1.5 text-slate-600 hover:text-[#334EAC]" data-action="copy-prod-url" data-id="${p.id}">
              <i data-lucide="share-2" style="width:16px;height:16px"></i>
              <span>Share</span>
            </button>
          </div>

          <!-- Seller Profile Card -->
          <div class="mt-6 card p-4 bg-gradient-to-br from-white to-[#F8FAFC]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sold by Marketplace Merchant</span>
              <a href="#/store/${storeSlug}" class="text-xs font-extrabold text-[#334EAC] hover:underline flex items-center gap-1">
                <span>Visit Storefront</span>
                <i data-lucide="arrow-right" style="width:12px;height:12px"></i>
              </a>
            </div>

            <div class="mt-3 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <img src="${seller.logo || ''}" alt="" class="w-12 h-12 rounded-2xl object-cover border border-[#D0E3FF] shadow-xs" />
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-display font-extrabold text-sm text-[#081F5C]">${esc(seller.businessName || seller.storeName || 'Seller')}</span>
                    ${isFounding ? `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold"><i data-lucide="award" style="width:11px;height:11px"></i> #001</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-500 mt-0.5">${esc(seller.sells || 'Official Anime Figures & Cyber Streetwear')}</div>
                  <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                    <span>⭐ ${Number(seller.rating || 0)} rating</span>
                    <span>·</span>
                    <span>📦 ${seller.sales || 0} fulfilled orders</span>
                    <span>·</span>
                    <span class="text-emerald-700"><i data-lucide="badge-check" style="width:10px;height:10px;display:inline"></i> Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Logistics & Delivery Rules -->
          <div class="mt-5 p-4 rounded-2xl bg-[#E7F1FF]/70 border border-[#D0E3FF] space-y-2 text-xs">
            <div class="flex items-start gap-2.5">
              <i data-lucide="truck" style="width:16px;height:16px;color:#334EAC" class="shrink-0 mt-0.5"></i>
              <div>
                <span class="font-bold text-[#081F5C]">Delivery Across Nigeria:</span>
                <p class="text-slate-600 text-[11px] mt-0.5">
                  Shipping availability and fees are based on this seller's configured delivery policy.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-2.5 pt-2 border-t border-purple-200/50">
              <i data-lucide="clock" style="width:16px;height:16px;color:#334EAC" class="shrink-0 mt-0.5"></i>
              <div>
                <span class="font-bold text-[#081F5C]">Dispatch Speed:</span>
                <span class="text-slate-600 text-[11px]"> Dispatch location and processing time are shown when configured by the seller.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description & Specs -->
      <div class="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mt-12">
        <div class="card p-6 reveal">
          <h2 class="font-display font-extrabold text-xl text-[#081F5C] mb-4">Product Description & Specs</h2>
          <p class="text-sm leading-relaxed text-slate-600 font-medium">
            ${esc(p.description || 'No product description provided by the seller.')}
          </p>

          <div class="mt-6 grid sm:grid-cols-3 gap-3 text-xs">
            <div class="rounded-xl bg-[#F6FCFF] border border-[#D0E3FF] p-3.5">
              <div class="font-bold text-[#081F5C]">Dimensions</div>
              <div class="mt-1 text-slate-500 font-medium">${p.dimensions?.width||p.dimensions?.height||p.dimensions?.depth ? `${p.dimensions?.width||'—'} × ${p.dimensions?.height||'—'} × ${p.dimensions?.depth||'—'} in` : 'Not specified'}</div>
            </div>
            <div class="rounded-xl bg-[#F6FCFF] border border-[#D0E3FF] p-3.5">
              <div class="font-bold text-[#081F5C]">Packaging</div>
              <div class="mt-1 text-slate-500 font-medium">Original Japanese Window Box</div>
            </div>
            <div class="rounded-xl bg-[#F6FCFF] border border-[#D0E3FF] p-3.5">
              <div class="font-bold text-[#081F5C]">Return Policy</div>
              <div class="mt-1 text-slate-500 font-medium">7-Day Sealed Window</div>
            </div>
          </div>
        </div>

        <div class="card p-6 reveal">
          <h2 class="font-display font-extrabold text-xl text-[#081F5C] mb-4">Why Nigerian Anime Collectors Trust ANILyfe</h2>
          <ul class="space-y-3.5 text-xs text-slate-600 font-medium">
            <li class="flex gap-3">
              <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold"><i data-lucide="badge-check" style="width:16px;height:16px"></i></span>
              <div>
                <strong class="text-slate-800">100% Authentic Collectible Guarantee:</strong>
                <p class="text-slate-500 mt-0.5">Strict quality control on all marketplace vendors. No bootlegs or unapproved knockoffs allowed.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-7 h-7 rounded-lg bg-purple-100 text-[#334EAC] flex items-center justify-center shrink-0 font-bold"><i data-lucide="box" style="width:16px;height:16px"></i></span>
              <div>
                <strong class="text-slate-800">Anti-Shock Protective Packaging:</strong>
                <p class="text-slate-500 mt-0.5">Every figure and fragile art piece is double bubble-wrapped inside high-impact cartons.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold"><i data-lucide="shield" style="width:16px;height:16px"></i></span>
              <div>
                <strong class="text-slate-800">Escrow Settlement & Safe Payouts:</strong>
                <p class="text-slate-500 mt-0.5">Seller payouts are held securely in platform escrow until delivery confirmation.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Related Products -->
      <div class="mt-12 reveal">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display font-extrabold text-xl text-[#081F5C]">More from this category</h2>
          <a href="#/marketplace" class="text-xs font-extrabold text-[#334EAC] hover:underline flex items-center gap-1">Browse all items <i data-lucide="arrow-right" style="width:12px;height:12px"></i></a>
        </div>
        <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          ${related.map(item => productCard(item)).join('') || '<div class="card p-8 text-sm text-[#708BD1]">No related products yet.</div>'}
        </div>
      </div>
    </main>
  </div>`;
}

// Global UI interaction helpers for Product Page
window.selectProductImage = function(src, thumbBtn) {
  const mainImg = document.getElementById('mainProductImg');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.prod-thumb').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-[#334EAC]');
    btn.classList.add('opacity-70');
  });
  if (thumbBtn) {
    thumbBtn.classList.remove('opacity-70');
    thumbBtn.classList.add('ring-2', 'ring-[#334EAC]');
  }
};

window.selectProductColor = function(btn, color, sku) {
  document.querySelectorAll('.prod-color-btn').forEach(b => {
    b.className = 'prod-color-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition bg-white text-slate-700 border-slate-200 hover:border-slate-300';
  });
  btn.className = 'prod-color-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition bg-[#081F5C] text-white border-[#081F5C]';
  const label = document.getElementById('selectedColorName');
  if (label) label.textContent = color;
};

window.selectProductSize = function(btn, size) {
  document.querySelectorAll('.prod-size-btn').forEach(b => {
    b.className = 'prod-size-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition bg-white text-slate-700 border-slate-200 hover:border-slate-300';
  });
  btn.className = 'prod-size-btn px-3 py-1.5 rounded-xl border text-xs font-bold transition bg-[#E7F1FF] text-[#334EAC] border-[#334EAC]';
  const label = document.getElementById('selectedSizeName');
  if (label) label.textContent = size;
};

const PRODUCT_COLOR_OPTIONS = ['Black','White','Blue','Purple','Red','Pink','Green','Yellow','Orange','Grey','Silver','Gold','Brown','Navy','Beige','Teal','Cyan','Peach'];
const PRODUCT_SIZE_OPTIONS = ['XS','S','M','L','XL','XXL','XXXL','2XS','3XS','4XS','One Size','Custom'];

function readImageFile(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

function previewProductImages(inputEl){
  const wrap = document.getElementById('productImagePreview');
  if(!wrap || !inputEl.files || !inputEl.files.length){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = '';
  Array.from(inputEl.files).slice(0,4).forEach(file => {
    const url = URL.createObjectURL(file);
    const node = document.createElement('div');
    node.className = 'aspect-square rounded-xl overflow-hidden border border-[#D0E3FF] bg-[#F6FCFF]';
    node.innerHTML = `<img src="${url}" class="w-full h-full object-cover" onerror="this.remove()" />`;
    wrap.appendChild(node);
  });
}

/* Fired on submit of #productForm, from the seller dashboard. */
async function productAdd(formEl){
  const f = new FormData(formEl), u = currentUser(), s = sellerOf(u.id);
  const products = LS.get('products', []);
  const fileInput = formEl.querySelector('input[name="images"]');
  const colorSelect = formEl.querySelector('select[name="colors"]');
  const sizeSelect = formEl.querySelector('select[name="sizes"]');
  const files = Array.from(fileInput?.files || []).slice(0,4);
  const images = files.length ? await Promise.all(files.map(file => readImageFile(file))) : [];
  const colors = colorSelect ? (colorSelect.multiple ? Array.from(colorSelect.selectedOptions).map(o => o.value.trim()).filter(Boolean) : [colorSelect.value].filter(Boolean)) : (f.get('colors') || '').split(',').map(v => v.trim()).filter(Boolean);
  const sizes = sizeSelect ? (sizeSelect.multiple ? Array.from(sizeSelect.selectedOptions).map(o => o.value.trim()).filter(Boolean) : [sizeSelect.value].filter(Boolean)) : (f.get('sizes') || '').split(',').map(v => v.trim()).filter(Boolean);
  const description = ((f.get('description')||'').trim());
  if(!description){ toast('Product description is required.', 'alert-circle'); return; }
  if(description.length > 500){ toast('Product description must be 500 characters or less.', 'alert-circle'); return; }
  const product = {
    id: uid('PRD'), sellerId: s.id,
    name: (f.get('name')||'').trim(),
    description,
    price: Number(f.get('price'))||0,
    stock: Number(f.get('stock'))||0,
    category: f.get('category') || 'Figures & Collectibles',
    img: images[0] || null,
    gallery: images,
    colors,
    sizes,
    rating: 0, reviews: 0, off: 0, createdAt: Date.now()
  };
  products.push(product);
  LS.set('products', products);
  toast(`"${esc(product.name)}" added to your catalog.`, 'package-plus');
  sellerTab = 'dashboard';
  route();
}

/* Fired from a "Delete" button in the seller product table
   (data-action="del-product"). Two-step confirm: first click arms it,
   second click within ~2.6s actually deletes. */
function productDelete(btnEl){
  if(btnEl.dataset.armed){
    LS.set('products', LS.get('products', []).filter(p=>p.id!==btnEl.dataset.id));
    toast('Product deleted.', 'trash-2');
    route();
  } else {
    btnEl.dataset.armed = '1';
    btnEl.innerHTML = 'Confirm?';
    btnEl.classList.add('!bg-[#B42318]', '!text-white', '!border-transparent');
    setTimeout(()=>{
      if(btnEl.isConnected){
        delete btnEl.dataset.armed;
        btnEl.innerHTML = '<i data-lucide="trash-2" style="width:12px;height:12px"></i> Delete';
        lucide.createIcons();
        btnEl.classList.remove('!bg-[#B42318]', '!text-white', '!border-transparent');
      }
    }, 2600);
  }
}
