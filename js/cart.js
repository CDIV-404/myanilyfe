/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Cart + wishlist mutations. Cart/wishlist state itself lives in
   localStorage (see js/app.js LS helper); this file only holds the
   actions triggered from data-action="add-cart" / "cart-remove" / "wish". */

function findProduct(id){
  let p = LS.get('products', []).find(x=>x.id===id);
  if (!p && window.productService) {
    const scList = LS.get('anilyfe_seller_products', []);
    const found = scList.find(x => x.id === id);
    if (found) {
      p = {
        id: found.id,
        sellerId: found.sellerId,
        name: found.name,
        price: found.salePrice || found.price,
        stock: found.stock,
        category: found.category,
        img: (found.images && found.images[0]) || null,
        rating: Number(found.rating || 0),
        reviews: found.reviewsCount || 0
      };
    }
  }
  return p;
}

function cartAdd(id){
  const cart = LS.get('cart', []);
  const ex = cart.find(c=>c.id===id);
  if(ex) ex.qty++; else cart.push({id, qty:1});
  LS.set('cart', cart);
  const p = findProduct(id);
  toast(`Added "${esc(p?p.name:'item')}" to cart.`, 'shopping-cart');
  route();
}

function cartRemove(id){
  LS.set('cart', LS.get('cart', []).filter(c=>c.id!==id));
  route();
}

/* Cart page (pages/cart.html). Lists items currently in LS 'cart' with
   quantity, unit price and a running total in the active region's currency. */

function getCartTotals(stateOverride){
  const cart = LS.get('cart', []);
  const products = LS.get('products', []);
  const buyer = currentUser();
  const buyerState = stateOverride || buyer?.state || buyer?.location?.state || '';
  const items = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    if(!p) return null;
    const qty = Math.max(1, Number(c.qty) || 1);
    const unit = Number(p.salePrice || p.price || 0);
    const original = Number(p.price || unit);
    return { cart:c, product:p, qty, unit, original, lineTotal:unit*qty, savings:Math.max(0, original-unit)*qty };
  }).filter(Boolean);
  const subtotal = items.reduce((n,x)=>n+x.lineTotal,0);
  const savings = items.reduce((n,x)=>n+x.savings,0);
  const bySeller = new Map();
  items.forEach(x => { const arr=bySeller.get(x.product.sellerId)||[]; arr.push(x); bySeller.set(x.product.sellerId,arr); });
  let shipping = 0;
  const shippingBreakdown=[];
  for(const [sellerId, sellerItems] of bySeller){
    const seller=LS.get('sellers',[]).find(s=>s.id===sellerId);
    let settings={};
    try { settings=JSON.parse(localStorage.getItem('anilyfe_seller_delivery_'+sellerId)||'{}'); } catch(e) {}
    let fee=0, label='Shipping not configured';
    if(settings.pickupAvailable && buyerState && settings.dispatchState && buyerState.toLowerCase()===settings.dispatchState.toLowerCase()){ fee=0; label='Pickup / in-state'; }
    else if(settings.dispatchState){ const same=buyerState && buyerState.toLowerCase()===settings.dispatchState.toLowerCase(); fee=same && settings.freeShippingInState ? 0 : Number(same ? settings.sameStateFee : settings.outsideStateFee)||0; label=same ? (settings.freeShippingInState?'Free in-state shipping':'In-state shipping') : 'Nationwide shipping'; }
    shipping += fee; shippingBreakdown.push({sellerId, sellerName:seller?.storeName||seller?.businessName||'Seller', fee, label, itemCount:sellerItems.length});
  }
  return {items, subtotal, savings, shipping, total:subtotal+shipping, shippingBreakdown};
}
function viewCart(){
  const cart = LS.get('cart', []);
  const totals = getCartTotals();
  const rows = totals.items.map(({cart:c, product:p, qty, unit, lineTotal})=>{
    return `
    <div class="flex items-center gap-4 py-4 border-b" style="border-color:var(--light)">
      <div class="prod-media w-16 h-16 shrink-0"><img src="${p.img||window.ANILyfeCategoryImageFor(p.category)}" alt="" loading="lazy" onerror="this.remove()"></div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm truncate">${esc(p.name)}</div>
        <div class="text-xs" style="color:var(--mid)">Qty ${qty} · ${fmt(unit)} each</div>
      </div>
      <div class="font-display font-extrabold">${fmt(lineTotal)}</div>
      <button class="btn btn-danger !py-2 !px-3 text-xs" data-action="cart-remove" data-id="${p.id}"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button>
    </div>`;
  }).join('');
  const total = totals.total;
  return `
  <div class="min-h-screen" style="background:var(--off)">
    <header class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO('text-2xl')}
      <a href="#/marketplace" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Keep shopping</a>
    </header>
    <main class="max-w-3xl mx-auto px-5 pb-24">
      <h1 class="font-display text-2xl font-extrabold mb-6">Your cart</h1>
      ${cart.length? `<div class="card p-5">${rows}
        <div class="pt-5 space-y-2 border-t border-[#E7F1FF]">
          <div class="flex justify-between text-sm"><span>Subtotal</span><span>${fmt(totals.subtotal)}</span></div>
          ${totals.savings ? `<div class="flex justify-between text-sm text-emerald-700"><span>Savings</span><span>-${fmt(totals.savings)}</span></div>` : ''}
          <div class="flex justify-between text-sm"><span>Shipping</span><span>${fmt(totals.shipping)}</span></div>
          <div class="flex items-center justify-between pt-2"><div class="font-display text-lg font-extrabold">Total: ${fmt(total)}</div><a href="#/checkout" class="btn btn-primary">Checkout <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a></div>
        </div></div>`
      : `<div class="card p-10 text-center">${ANILyfeUI.RotatingImage('empty','Empty delivery box','mx-auto mb-4 h-36 w-full max-w-sm rounded-2xl',800,600)}<p class="text-sm" style="color:var(--mid)">Your cart is empty.</p></div>`}
    </main>
  </div>`;
}

function viewWishlist(){
  const u = currentUser();
  if(!u){ location.hash='#/auth'; return ''; }
  const products = LS.get('products',[]);
  const saved = LS.get('wishlist',[]);
  const rows = saved.map(id=> products.find(p=>p.id===id)).filter(Boolean);
  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    <header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO('text-2xl')}
      <a href="#/marketplace" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Keep browsing</a>
    </header>
    <main class="max-w-6xl mx-auto px-5 pb-20">
      <h1 class="font-display font-extrabold text-2xl mb-6">Saved products</h1>
      ${rows.length ? `<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">${rows.map(p=>`
        <div class="card p-3">
          <div class="rounded-2xl overflow-hidden bg-[#E7F1FF] border border-[#D0E3FF]">
            ${p.img?`<img src="${p.img}" alt="${esc(p.name)}" class="w-full h-40 object-cover" onerror="this.remove()"/>`:`<img src="${window.ANILyfeCategoryImageFor(p.category)}" alt="${esc(p.name)}" class="w-full h-40 object-cover" loading="lazy" onerror="this.remove()"/>`}
          </div>
          <div class="mt-3">
            <div class="text-sm font-extrabold">${esc(p.name)}</div>
            <div class="font-display font-extrabold text-lg mt-1">${fmt(p.price)}</div>
            <div class="mt-3 flex gap-2">
              <a href="#/product/${p.id}" class="btn btn-outline !px-3 !py-2 !text-[10px] flex-1">View</a>
              <button class="btn btn-primary !px-3 !py-2 !text-[10px] flex-1" data-action="add-cart" data-id="${p.id}">Cart</button>
            </div>
          </div>
        </div>`).join('')}</div>` : `<div class="card p-12 text-center">${ANILyfeUI.RotatingImage('empty','Empty delivery box','mx-auto mb-4 h-36 w-full max-w-sm rounded-2xl',800,600)}<p class="text-sm text-[#708BD1]">No saved products yet.</p><a href="#/marketplace" class="btn btn-primary mt-4">Explore Marketplace</a></div>`}
    </main>
  </div>`;
}

function viewOrders(){
  const u = currentUser();
  if(!u){ location.hash='#/auth'; return ''; }
  const all = LS.get('orders', []);
  const orders = all.filter(o => !o.buyerId || o.buyerId === u.id);
  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    <header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO('text-2xl')}
      <a href="#/marketplace" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Market</a>
    </header>
    <main class="max-w-6xl mx-auto px-5 pb-20">
      <h1 class="font-display font-extrabold text-2xl mb-6">My orders</h1>
      ${orders.length ? `<div class="space-y-4">${orders.map(order=>`
          <div class="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 reveal">
            <div><div class="font-display font-extrabold text-lg">${esc(order.id)}</div><div class="text-xs text-[#708BD1] font-bold mt-1">${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</div></div>
            <div class="flex items-center gap-3"><span class="badge">${esc(order.orderStatus || order.status || 'New')}</span><span class="text-xs font-bold text-[#5A6A9C]">${order.items?.length || 0} items</span><span class="font-display font-extrabold text-lg">${fmt(order.total || 0)}</span></div>
          </div>`).join('')}</div>` : `<div class="card p-10 text-center">${ANILyfeUI.RotatingImage('empty','Empty delivery box','mx-auto mb-3 h-36 w-full max-w-sm rounded-2xl',800,600)}<p class="text-sm text-[#708BD1]">No orders yet.</p><a href="#/marketplace" class="btn btn-primary mt-4">Start shopping</a></div>`}
    </main>
  </div>`;
}

function wishlistToggle(id){
  let w = LS.get('wishlist', []);
  if(w.includes(id)){
    w = w.filter(x=>x!==id);
    toast('Removed from wishlist.', 'heart-off');
  } else {
    w.push(id);
    toast('Saved to wishlist ♥', 'heart');
  }
  LS.set('wishlist', w);
  route();
}
