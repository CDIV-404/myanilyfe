/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Core storage, session and small shared UI helpers used across every page. */

const LS = {
  get(k, d){ try{ const v = JSON.parse(localStorage.getItem('anilyfe_'+k)); return v===null||v===undefined? d : v; }catch(e){ return d; } },
  set(k, v){ localStorage.setItem('anilyfe_'+k, JSON.stringify(v)); },
  del(k){ localStorage.removeItem('anilyfe_'+k); }
};
let sellerTab='dashboard';
const uid = p => (p||'ID') + '-' + Math.random().toString(36).slice(2,6).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));


const ANILyfeSupportEmails = ['myanilyfe@gmail.com','anilyfeofficial@gmail.com'];
const ANILyfeSupportPhones = ['070 7919 938','09041972501'];
const getMarketplaceSettings = () => { const st=window.ANILyfeAPI?.state; if(['ADMIN','SUPER_ADMIN'].includes(st?.user?.role)&&st.admin?.settings&&Object.keys(st.admin.settings).length)return st.admin.settings; if(st?.publicSettings&&Object.keys(st.publicSettings).length)return st.publicSettings; return LS.get('marketplaceSettings',{marketplaceName:'ANILyfe',marketplaceDescription:'Anime marketplace',commission:15,commissionRate:15,sellerRegistrationEnabled:true,reviewSystemEnabled:true,maintenanceMode:false,defaultCurrency:'NGN',supportEmail:'myanilyfe@gmail.com'}); };
const currentUser = () => window.ANILyfeAPI?.state?.user || null;
const currentAdmin = () => ['ADMIN','SUPER_ADMIN'].includes(window.ANILyfeAPI?.state?.user?.role) ? {...window.ANILyfeAPI.state.user,username:window.ANILyfeAPI.state.user.email,roleLabel:window.ANILyfeAPI.state.user.role==='SUPER_ADMIN'?'Super administrator':'Administrator'} : null;
const sellerOf = userId => { const s=window.ANILyfeAPI?.state?.seller; return s && (!userId || s.userId===userId) ? s : null; };
const approvedProducts = () => window.ANILyfeAPI?.state?.products?.filter(p=>['APPROVED','PUBLISHED','OUT_OF_STOCK'].includes(String(p.approvalStatus||p.status).toUpperCase())) || [];
window.currentUser = currentUser;
window.currentAdmin = currentAdmin;
window.sellerOf = sellerOf;
window.approvedProducts = approvedProducts;
window.getMarketplaceSettings = getMarketplaceSettings;


function kunaiSVG(dark){
  return `<svg class="kunai" viewBox="0 0 22 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9E3"/><stop offset=".34" stop-color="#FFD34E"/><stop offset=".72" stop-color="#F5A623"/><stop offset="1" stop-color="#C67C00"/></linearGradient></defs>
    <circle cx="11" cy="5.5" r="3.6" stroke="url(#kg)" stroke-width="2.6"/>
    <rect x="8.4" y="10" width="5.2" height="13" rx="1.4" fill="url(#kg)"/>
    <path d="M8.4 13h5.2M8.4 16.2h5.2M8.4 19.4h5.2" stroke="#081F5C" stroke-width="1"/>
    <rect x="7" y="23" width="8" height="3" rx="1.2" fill="url(#kg)"/>
    <path d="M11 51 L5.6 31 Q11 27.4 16.4 31 Z" fill="url(#kg)"/>
    <path d="M11 49 L11 29.4" stroke="#081F5C" stroke-width=".9"/>
  </svg>`;
}
function wordmark(cls, onDark){
  return `<span class="logo ${cls||''}"><span class="la">A</span><span class="ls ${onDark?'on-dark':''}">N</span>${kunaiSVG(onDark)}<span class="ls ${onDark?'on-dark':''}">LYFE</span></span>`;
}
/* Uses logo.png if present in root, otherwise the drawn wordmark */
function logoLink(href, onDark, size){
  const s = size||'text-2xl';
  return `<a href="${href}" class="inline-block ${s}" aria-label="Anilyfe home">
    <img src="logo.png" alt="Anilyfe" class="h-[1.15em] w-auto" onerror="this.outerHTML=window.__wm(this.dataset.od==='1',this.dataset.sz)" data-od="${onDark?'1':'0'}" data-sz="${s}">
  </a>`;
}
window.__wm = (od) => wordmark('', od);
/* simpler guaranteed version used directly in templates */
const LOGO  = (s) => `<a href="#/" class="${s||'text-2xl'} inline-block align-middle">${wordmark()}</a>`;
const LOGO_D = (s) => `<a href="#/" class="${s||'text-2xl'} inline-block align-middle">${wordmark('',true)}</a>`;

function siteFooter(extraClass=''){
  const dark = (extraClass || '').includes('text-white');
  const links = [
    {label:'Help Center', href:'#/help'},
    {label:'Buyer Protection', href:'#/buyer-protection'},
    {label:'Payment & Security', href:'#/payment-security'},
    {label:'Shipping', href:'#/shipping'},
    {label:'Returns & Refunds', href:'#/returns'},
    {label:'Seller Policy', href:'#/seller-policy'},
    {label:'Marketplace Rules', href:'#/marketplace-rules'},
    {label:'KYC / Verification', href:'#/kyc'},
    {label:'Cancellation', href:'#/cancellation'},
    {label:'Privacy', href:'#/privacy'},
    {label:'Terms', href:'#/terms'},
    {label:'Contact / Support', href:'#/contact'}
  ];
  const textColor = dark ? '#fff' : 'inherit';
  const siteSettings = getMarketplaceSettings();
  const supportEmails = ANILyfeSupportEmails.map(email=>`<a href="mailto:${email}" class="hover:underline">${email}</a>`).join('<br>');
  const supportPhones = ANILyfeSupportPhones.map(phone=>`<a href="tel:${phone.replace(/\s/g,'')}" class="hover:underline">${phone}</a>`).join('<br>');
  const borderColor = dark ? 'rgba(255,255,255,0.15)' : '#D0E3FF';
  return `
  <footer class="${extraClass || 'border-t border-[rgba(208,227,255,.12)] py-8 bg-white/60 backdrop-blur-sm'}" style="color:${textColor};">
    <div class="max-w-7xl mx-auto px-5">
      <div class="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] py-8">
        <div>
          ${LOGO('text-2xl')}
          <p class="mt-4 text-sm max-w-xs leading-relaxed" style="color:${textColor}; opacity:${dark ? '.88' : '.82'};">ANILyfe is the anime marketplace for premium figures, manga, apparel, collectibles and trusted seller experiences across Nigeria.</p>
        </div>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] mb-3" style="color:${textColor}; opacity:${dark ? '.9' : '.8'};">SHOP</div>
          <ul class="space-y-2 text-sm" style="color:${textColor}; opacity:${dark ? '1' : '.9'};">
            <li><a href="https://linktr.ee/Anilyfe" target="_blank" rel="noopener noreferrer" class="font-semibold">Join Community</a></li><li><a href="#/marketplace" class="hover:opacity-100" style="color:${textColor};">Marketplace</a></li>
            <li><a href="#/marketplace" class="hover:opacity-100" style="color:${textColor};">Featured deals</a></li>
            <li><a href="#/marketplace" class="hover:opacity-100" style="color:${textColor};">Best sellers</a></li>
            <li><a href="#/auth" class="hover:opacity-100" style="color:${textColor};">Become a seller</a></li>
          </ul>
        </div>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] mb-3" style="color:${textColor}; opacity:${dark ? '.9' : '.8'};">HELP</div>
          <ul class="space-y-2 text-sm" style="color:${textColor}; opacity:${dark ? '1' : '.9'};">
            ${links.slice(0,6).map(l=>`<li><a href="${l.href}" class="hover:opacity-100" style="color:${textColor};">${l.label}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] mb-3" style="color:${textColor}; opacity:${dark ? '.9' : '.8'};">SUPPORT</div>
          <ul class="space-y-2 text-sm" style="color:${textColor}; opacity:${dark ? '1' : '.9'};">
            <li><span class="font-semibold" style="color:${textColor};">Email:</span><br>${supportEmails}</li>
            <li><span class="font-semibold" style="color:${textColor};">Phone:</span><br>${supportPhones}</li>
            <li><span class="font-semibold" style="color:${textColor};">Hours:</span> Mon–Sat, 8am–8pm</li>
            <li><a href="#/help" class="font-bold hover:underline" style="color:${textColor};">Need help? Visit Help Center</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold" style="border-color:${borderColor}; color:${textColor}; opacity:${dark ? '1' : '.9'};">
        <span>© ${new Date().getFullYear()} Anilyfe · The anime marketplace, made personal.</span>
        <div class="flex flex-wrap justify-center gap-4">
          ${links.map((link, idx)=>`<a href="${link.href}" class="${idx>=2?'hidden sm:inline':''}" style="color:${textColor};">${link.label}</a>`).join('')}<a href="assets/images/CREDITS.md" class="hover:underline" style="color:${textColor};">Photo credits</a>
        </div>
      </div>
    </div>
  </footer>`;
}

/* Rotates anime banner art across info/policy pages so every page gets artwork. */
function infoBannerArt(seedText){
  const art=['assets/images/web/anime-city-violet.png','assets/images/web/manga-books.png','assets/images/web/anime-city-street.png'];
  let h=0; for(const ch of String(seedText||'')) h=(h*31+ch.charCodeAt(0))>>>0;
  return art[h%art.length];
}

function viewInfoPage({eyebrow, title, subtitle, paragraphs = [], cards = [], sections = [], faq = [], ctaLabel='Browse marketplace', ctaLink='#/marketplace', contact = false, supportTitle='Need a direct hand?', supportText='', supportLabel='Contact support'}){
  const rows = cards.length ? `
    <div class="mt-8 grid lg:grid-cols-3 gap-6">
      ${cards.map(card => `
        <div class="card p-6 reveal">
          <div class="font-display font-bold text-xl mb-4">${card.title}</div>
          <ul class="space-y-3 text-sm text-[#4A5A8C]">
            ${card.items.map(item => `<li>• ${item}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>` : '';

  const customSections = sections.map(section => {
    if(section.type === 'cards') {
      const columns = section.items.length === 1 ? 'sm:grid-cols-1' : section.items.length === 2 ? 'sm:grid-cols-2' : section.items.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';
      return `
      <section class="mt-10 reveal">
        <h2 class="font-display font-extrabold text-2xl text-[#081F5C] mb-5">${section.title}</h2>
        <div class="grid gap-5 ${columns}">
          ${section.items.map(item => `<article class="card p-6"><h3 class="font-display font-bold text-lg text-[#081F5C]">${item.title}</h3><p class="mt-2 text-sm font-medium leading-relaxed text-[#4A5A8C]">${item.text}</p></article>`).join('')}
        </div>
      </section>`;
    }
    if(section.type === 'steps') return `
      <section class="mt-10 reveal">
        <h2 class="font-display font-extrabold text-2xl text-[#081F5C] mb-5">${section.title}</h2>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          ${section.items.map((item,index) => `<article class="card p-6"><div class="font-tech text-xs font-bold tracking-[.18em] text-[#708BD1]">${String(index+1).padStart(2,'0')}</div><h3 class="mt-3 font-display font-bold text-lg text-[#081F5C]">${item.title}</h3><p class="mt-2 text-sm font-medium leading-relaxed text-[#4A5A8C]">${item.text}</p></article>`).join('')}
        </div>
      </section>`;
    if(section.type === 'list') return `
      <section class="mt-10 card p-6 md:p-8 reveal">
        <h2 class="font-display font-extrabold text-2xl text-[#081F5C] mb-5">${section.title}</h2>
        <ul class="space-y-4 text-sm font-medium leading-relaxed text-[#4A5A8C]">
          ${section.items.map(item => `<li><strong class="text-[#081F5C]">${item.title}:</strong> ${item.text}</li>`).join('')}
        </ul>
      </section>`;
    if(section.type === 'bullets') return `
      <section class="mt-10 card p-6 md:p-8 reveal">
        <h2 class="font-display font-extrabold text-2xl text-[#081F5C] mb-5">${section.title}</h2>
        <ul class="grid gap-3 text-sm font-medium leading-relaxed text-[#4A5A8C] sm:grid-cols-2">
          ${section.items.map(item => `<li class="rounded-xl bg-[#F6FCFF] p-4">${item}</li>`).join('')}
        </ul>
      </section>`;
    return '';
  }).join('');

  const faqSection = faq.length ? `
    <div class="mt-10 card p-6 reveal">
      <div class="font-display font-bold text-2xl mb-6">FAQ</div>
      <div class="space-y-5">
        ${faq.map(item => `
          <div class="border-b border-[#D0E3FF] pb-4 last:border-b-0 last:pb-0">
            <div class="font-bold text-[#081F5C]">${item.q}</div>
            <p class="mt-2 text-sm font-medium text-[#4A5A8C] leading-relaxed">${item.a}</p>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const supportCard = contact ? `
    <div class="mt-10 card p-6 md:p-8 reveal">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#708BD1]">SUPPORT</div>
          <h2 class="font-display font-extrabold text-2xl text-[#081F5C] mt-3">${supportTitle}</h2>
          ${supportText ? `<p class="mt-2 max-w-xl text-sm font-medium leading-relaxed text-[#4A5A8C]">${supportText}</p>` : ''}
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="#/contact" class="btn btn-primary text-xs">${supportLabel}</a>
          <a href="#/marketplace" class="btn btn-ghost text-xs">Back to marketplace</a>
        </div>
      </div>
    </div>` : `
    <div class="mt-10 card p-6 md:p-8 reveal">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#708BD1]">ANILYFE</div>
          <h2 class="font-display font-extrabold text-2xl text-[#081F5C] mt-3">Still need help?</h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="#/contact" class="btn btn-primary text-xs">Contact us</a>
          <a href="${ctaLink}" class="btn btn-ghost text-xs">${ctaLabel}</a>
        </div>
      </div>
    </div>`;

  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    <header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between gap-3">
      ${LOGO('text-2xl')}
      <div class="flex items-center gap-3">
        <a href="#/marketplace" class="btn btn-ghost text-xs">Marketplace</a>
        <a href="#/auth" class="btn btn-primary text-xs">Sign in</a>
      </div>
    </header>
    <main class="max-w-6xl mx-auto px-5 pb-20">
      <div class="card p-8 md:p-10 reveal">
        <img src="${infoBannerArt(eyebrow)}" alt="" class="mb-6 h-36 w-full rounded-2xl object-cover md:h-44" loading="lazy" onerror="this.remove()">
        <div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#708BD1] mb-3">${eyebrow}</div>
        <h1 class="font-display font-extrabold text-4xl text-[#081F5C]">${title}</h1>
        <p class="mt-3 font-medium text-[#4A5A8C] max-w-2xl">${subtitle}</p>
        ${paragraphs.map(text => `<p class="mt-3 font-medium text-[#4A5A8C] max-w-3xl leading-relaxed">${text}</p>`).join('')}
      </div>
      ${rows}
      ${customSections}
      ${faqSection}
      ${supportCard}
    </main>
    ${siteFooter('border-t border-[#D0E3FF] bg-white mt-8')}
  </div>`;
}

function viewHelp(){
  const faqs = [
    {q:'How do I buy safely on ANILyfe?', a:'All purchases are handled through the marketplace checkout flow, with seller verification and buyer protection designed for secure transactions.'},
    {q:'How long does shipping take?', a:'Delivery times vary by seller and location, but most products are dispatched within 2–5 business days.'},
    {q:'Can I return an item?', a:'Yes. Eligible returns are managed through the buyer order and returns workflow, with refund status tracked in the account area.'},
    {q:'Is seller approval required?', a:'Yes. Sellers must complete registration and pass administrator review before they can publish products.'},
    {q:'What payment methods are supported?', a:'V1 supports Nigeria with NGN and Paystack-ready checkout flow. The architecture is ready for provider expansion later.'}
  ];

  return viewInfoPage({
    eyebrow:'HELP CENTER',
    title:'How can we help?',
    subtitle:'Browse common marketplace questions, shipping guidance, returns and seller support topics below.',
    cards:[
      {title:'Marketplace basics', items:['Find products by category, seller, and location','Compare prices and stock before checkout','Save products to your wishlist','Track orders and refunds in your account']},
      {title:'Buyers', items:['Secure checkout with Paystack-ready flow','Local and nationwide delivery options','Seller verification and ratings','Returns and refund management']},
      {title:'Sellers', items:['Apply through seller registration','Create products with variants and inventory','Manage orders, payouts and listings','Review product moderation and approvals']}
    ],
    faq:faqs,
    contact:true
  });
}

function viewFaq(){
  return viewInfoPage({
    eyebrow:'FAQ',
    title:'Frequently asked questions',
    subtitle:'Everything buyers and sellers need to know before they buy, sell, ship, or request support on ANILyfe.',
    faq:[
      {q:'How do I place an order?', a:'Add products to your cart, confirm the seller, shipping option and delivery address, then continue to checkout and complete payment.'},
      {q:'Are sellers verified?', a:'Verified status is granted after registration and review. Buyer protection is built around trusted seller verification and delivery tracking.'},
      {q:'Do you support local pickup?', a:'Yes. Some sellers offer pickup and local delivery depending on their dispatch location and product availability.'},
      {q:'Can I check stock before buying?', a:'Yes. Product pages display stock status, color and size availability, and seller inventory information.'},
      {q:'What happens if my order is delayed?', a:'You can monitor the order status from your account. If your order is delayed beyond the expected window, you can request support through the contact center.'}
    ],
    ctaLabel:'Go shopping',
    ctaLink:'#/marketplace'
  });
}

function viewShipping(){
  return viewInfoPage({
    eyebrow:'SHIPPING & DELIVERY',
    title:'Shipping & Delivery',
    subtitle:'Your next favourite find, delivered your way.',
    paragraphs:['From anime-inspired fashion and manga to collectibles, artwork, and gaming products, Anilyfe connects you with sellers offering products you\'ll love.','Each seller manages their own delivery arrangements, so available shipping options, fees, and delivery times may vary.'],
    sections:[
      {type:'cards',title:'Delivery Options',items:[
        {title:'Local Delivery',text:'Shop from sellers who offer delivery within their state or designated service areas.'},
        {title:'Nationwide Shipping',text:'Some sellers ship across Nigeria, allowing you to shop beyond your state and discover more anime products.'},
        {title:'Pickup',text:'Where offered, you can arrange to collect your order from an approved seller location.'}
      ]},
      {type:'steps',title:'How Delivery Works',items:[
        {title:'Discover Your Next Find',text:'Explore products and check the seller\'s available delivery options.'},
        {title:'Choose Your Delivery Option',text:'Select from the delivery methods offered by the seller at checkout.'},
        {title:'Seller Prepares Your Order',text:'The seller confirms product availability and prepares your order for dispatch.'},
        {title:'Receive Your Order',text:'Your order is delivered according to the seller\'s shipping arrangements, or you collect it if pickup is available.'}
      ]},
      {type:'list',title:'What You Should Know',items:[
        {title:'Seller-managed delivery',text:'Sellers determine their delivery coverage, shipping methods, and processing times.'},
        {title:'Shipping fees',text:'Applicable delivery fees depend on the seller and your location. Check the charges displayed at checkout before paying.'},
        {title:'Delivery timelines',text:'Delivery times vary according to the seller, dispatch location, destination, and shipping method.'},
        {title:'Order availability',text:'Orders are subject to product availability and seller confirmation.'},
        {title:'Free shipping',text:'Selected sellers or promotions may offer free shipping where applicable.'},
        {title:'Order tracking',text:'Tracking information is provided where supported by the seller\'s delivery method.'}
      ]}
    ],
    faq:[
      {q:'Can every seller deliver nationwide?',a:'Not necessarily. Each seller decides whether to offer local delivery, nationwide shipping, or both. Check the available delivery options before placing your order.'},
      {q:'Who is responsible for delivering my order?',a:'The seller is responsible for arranging delivery according to the shipping options they offer. Anilyfe provides the marketplace where buyers and sellers connect.'},
      {q:'Who pays for shipping?',a:'Buyers generally pay the applicable shipping fee unless the seller or a marketplace promotion offers free shipping. Any applicable fees should be displayed before payment.'},
      {q:'How long will delivery take?',a:'Delivery times depend on the seller\'s processing time, dispatch location, your destination, and the selected delivery method.'},
      {q:'Can I pick up my order instead?',a:'Pickup may be available if the seller offers it. Check the available options before completing your purchase.'},
      {q:'Can I track my order?',a:'Tracking availability depends on the seller\'s delivery method. Where tracking is supported, the relevant details will be provided after dispatch.'},
      {q:'What if my order is delayed?',a:'Contact the seller through the available support channels for an update. If you need further assistance, contact Anilyfe Support.'}
    ],
    contact:true,
    supportTitle:'Still need help?',
    supportText:'We\'re here to help make your shopping experience easier.',
    supportLabel:'Contact Anilyfe Support'
  });
}

function viewReturns(){
  return viewInfoPage({
    eyebrow:'RETURNS & REFUNDS',
    title:'Returns & Refunds',
    subtitle:'Shopping with confidence, every step of the way.',
    paragraphs:['At Anilyfe, we want every buyer to have a reliable shopping experience. If something goes wrong with your order, you can request a return or refund through the appropriate order support process.','Our returns process helps buyers, sellers, and the Anilyfe admin team resolve eligible issues fairly.'],
    sections:[{type:'steps',title:'How Returns Work',items:[
      {title:'Submit a Request',text:'Open the relevant order in your Anilyfe account and submit a return or refund request, explaining the reason for your request.'},
      {title:'Provide Order Details',text:'Include the necessary information about the issue. Photos or other supporting evidence may be requested where applicable.'},
      {title:'Request Review',text:'The seller and, where necessary, the Anilyfe admin team review the request and determine the appropriate next steps.'},
      {title:'Resolution',text:'Once a decision is made, the outcome is recorded against the order. Approved refunds are processed according to the applicable payment and refund procedures.'}
    ]}],
    ctaLabel:'Browse marketplace',
    ctaLink:'#/marketplace',
    contact:true
  });
}

function viewPrivacy(){
  return viewInfoPage({
    eyebrow:'PRIVACY',
    title:'Privacy policy',
    subtitle:'ANILyfe protects buyer, seller and admin information. Marketplace account data, payment data and documents are handled according to secure marketplace standards.',
    cards:[
      {title:'What we collect', items:['Profile details and delivery addresses','Order and payment information','Seller verification details for approval workflows']},
      {title:'How we use it', items:['Improve marketplace security and buyer experience','Support delivery, verification and order tracking','Maintain account and seller management tools']},
      {title:'Protection', items:['Sensitive payment data stays on the backend','Role-based access is enforced for seller and admin flows','Data is never shared publicly without consent']}
    ],
    faq:[
      {q:'Do you share seller data publicly?', a:'Seller data is shown only where needed for storefront and shipping details, not private verification records.'},
      {q:'Is payment data stored in the frontend?', a:'No. Financial and payment secrets are kept server-side only in the proper architecture.'}
    ]
  });
}

function viewTerms(){
  return viewInfoPage({
    eyebrow:'TERMS',
    title:'Marketplace terms and conditions',
    subtitle:'By using ANILyfe, you agree to responsible buying, safe selling, timely payments, secure transactions, and marketplace rules for all product and order activity.',
    cards:[
      {title:'For buyers', items:['Purchase only approved listings','Review seller information, stock and delivery options','Report suspicious activity or unsafe products']},
      {title:'For sellers', items:['Provide accurate product details and pricing','Maintain stock and dispatch information','Follow verification and moderation guidelines']},
      {title:'Marketplace rules', items:['Orders and financial actions are subject to platform review','Misuse of the marketplace may trigger account restrictions','Admin moderation decisions are final for policy enforcement']}
    ],
    faq:[
      {q:'Who moderates listings?', a:'Seller products move through a submission and moderation workflow, with admin review supporting approved or rejected outcomes.'},
      {q:'Can a seller be blocked?', a:'Yes. Sellers may be suspended or rejected if they violate marketplace rules, policy, or verification requirements.'}
    ]
  });
}

function viewContact(){
  return `
  <div class="min-h-screen bg-[#F6FCFF]">
    <header class="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between gap-3">
      ${LOGO('text-2xl')}
      <div class="flex items-center gap-3">
        <a href="#/help" class="btn btn-ghost text-xs">Help center</a>
        <a href="#/marketplace" class="btn btn-primary text-xs">Shop now</a>
      </div>
    </header>
    <main class="max-w-6xl mx-auto px-5 pb-20">
      <div class="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <div class="card p-8 reveal">
          <img src="assets/images/web/anime-city-street.png" alt="" class="mb-6 h-40 w-full rounded-2xl object-cover" loading="lazy" onerror="this.remove()">
          <div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#708BD1] mb-3">CONTACT</div>
          <h1 class="font-display font-extrabold text-4xl text-[#081F5C]">Talk to ANILyfe support</h1>
          <p class="mt-3 text-[#4A5A8C] leading-relaxed">Need help with an order, seller issue, refund, payment, or account problem? Reach out and we’ll guide you.</p>
          <div class="mt-8 space-y-4 text-sm text-[#4A5A8C]">
            <div class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="mail" style="width:16px;height:16px;color:#334EAC"></i></span><div><div class="font-bold text-[#081F5C]">Email</div><div>${ANILyfeSupportEmails.map(email=>`<a class="block hover:underline" href="mailto:${email}">${email}</a>`).join('')}</div></div></div>
            <div class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="phone" style="width:16px;height:16px;color:#334EAC"></i></span><div><div class="font-bold text-[#081F5C]">Phone</div><div>${ANILyfeSupportPhones.map(phone=>`<a class="block hover:underline" href="tel:${phone.replace(/\s/g,'')}">${phone}</a>`).join('')}</div></div></div>
            <div class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="clock-3" style="width:16px;height:16px;color:#334EAC"></i></span><div><div class="font-bold text-[#081F5C]">Hours</div><div>Mon–Sat · 8:00am–8:00pm</div></div></div>${getMarketplaceSettings().telegram?`<div class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="send" style="width:16px;height:16px;color:#334EAC"></i></span><div><div class="font-bold text-[#081F5C]">Telegram</div><div><a href="${esc(getMarketplaceSettings().telegram)}" target="_blank" rel="noopener">Contact us on Telegram</a></div></div></div>`:''}
          </div>
        </div>
        <div class="card p-8 reveal">
          <form id="supportContactForm">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Full name</label>
                <input class="inp" name="name" placeholder="Your full name" required>
              </div>
              <div>
                <label class="lbl">Email</label>
                <input class="inp" name="email" type="email" placeholder="you@anilyfe.com" required>
              </div>
            </div>
            <div class="mt-4">
              <label class="lbl">Topic</label>
              <select class="inp" name="topic">
                <option>Order issue</option>
                <option>Seller issue</option>
                <option>Payment concern</option>
                <option>Return or refund</option>
                <option>Account issue</option>
                <option>Other</option>
              </select>
            </div>
            <div class="mt-4">
              <label class="lbl">Message</label>
              <textarea class="inp min-h-[140px]" name="message" placeholder="Tell us what you need help with…" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-5">Send request</button>
          </form>
        </div>
      </div>
    </main>
    ${siteFooter('border-t border-[#D0E3FF] bg-white mt-8')}
  </div>`;
}

function siteFooter(extraClass=''){
  const dark = (extraClass || '').includes('text-white');
  const links = [
    {label:'Help Center', href:'#/help'},
    {label:'FAQ', href:'#/faq'},
    {label:'Shipping', href:'#/shipping'},
    {label:'Returns', href:'#/returns'},
    {label:'Payments', href:'#/help'},
    {label:'Contact', href:'#/contact'},
    {label:'Privacy', href:'#/privacy'},
    {label:'Terms', href:'#/terms'}
  ];
  const textColor = dark ? '#fff' : 'inherit';
  const siteSettings = getMarketplaceSettings();
  const supportEmails = ANILyfeSupportEmails.map(email=>`<a href="mailto:${email}" class="hover:underline">${email}</a>`).join('<br>');
  const supportPhones = ANILyfeSupportPhones.map(phone=>`<a href="tel:${phone.replace(/\s/g,'')}" class="hover:underline">${phone}</a>`).join('<br>');
  const borderColor = dark ? 'rgba(255,255,255,0.15)' : '#D0E3FF';
  return `
  <footer class="${extraClass || 'border-t border-[rgba(208,227,255,.12)] py-8 bg-white/60 backdrop-blur-sm'}" style="color:${textColor};">
    <div class="max-w-7xl mx-auto px-5">
      <div class="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-sm ${dark ? '' : 'hidden'}">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="font-tech text-[10px] font-bold tracking-[.2em] uppercase text-white/70">Stay in the loop</div>
            <div class="font-display font-bold text-xl text-white mt-1">Get anime drops, seller news and marketplace updates.</div>
          </div>
          <form class="flex flex-col sm:flex-row gap-2 w-full max-w-lg" onsubmit="event.preventDefault(); toast('You are subscribed to Anilyfe updates.','sparkles');">
            <input class="inp !bg-white/10 !text-white placeholder:text-white/60 !border-white/20 !rounded-xl flex-1" placeholder="Your email address" type="email" required>
            <button class="btn btn-primary !rounded-xl !px-4" type="submit">Join</button>
          </form>
        </div>
      </div>
      <div class="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] py-8">
        <div>
          ${LOGO('text-2xl')}
          <p class="mt-4 text-sm max-w-xs leading-relaxed" style="color:${textColor}; opacity:${dark ? '.88' : '.82'};">ANILyfe is the anime marketplace for premium figures, manga, apparel, collectibles and trusted seller experiences across Nigeria.</p>
          <div class="mt-5 flex flex-wrap gap-2">
            ${['Verified sellers','Secure checkout','Shipping across Nigeria','Buyer protection'].map(item => `<span class="badge ${dark ? '!bg-white/10 !text-white border border-white/10' : '!bg-[#E7F1FF] !text-[#334EAC]'} text-[10px] font-extrabold">${item}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] mb-3" style="color:${textColor}; opacity:${dark ? '.9' : '.8'};">SHOP</div>
          <ul class="space-y-2 text-sm" style="color:${textColor}; opacity:${dark ? '1' : '.9'};">
            <li><a href="#/marketplace" class="hover:opacity-100" style="color:${textColor};">Marketplace</a></li>
            <li><a href="#/marketplace" class="hover:opacity-100" style="color:${textColor};">Featured deals</a></li>
            <li><a href="#/marketplace" class="hover:opacity-100" style="color:${textColor};">Best sellers</a></li>
            <li><a href="#/auth" class="hover:opacity-100" style="color:${textColor};">Become a seller</a></li>
          </ul>
        </div>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] mb-3" style="color:${textColor}; opacity:${dark ? '.9' : '.8'};">HELP</div>
          <ul class="space-y-2 text-sm" style="color:${textColor}; opacity:${dark ? '1' : '.9'};">
            ${links.slice(0,6).map(l=>`<li><a href="${l.href}" class="hover:opacity-100" style="color:${textColor};">${l.label}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] mb-3" style="color:${textColor}; opacity:${dark ? '.9' : '.8'};">SUPPORT</div>
          <ul class="space-y-2 text-sm" style="color:${textColor}; opacity:${dark ? '1' : '.9'};">
            <li><span class="font-semibold" style="color:${textColor};">Email:</span><br>${supportEmails}</li>
            <li><span class="font-semibold" style="color:${textColor};">Phone:</span><br>${supportPhones}</li>
            <li><span class="font-semibold" style="color:${textColor};">Hours:</span> Mon–Sat, 8am–8pm</li>
            <li><a href="#/help" class="font-bold hover:underline" style="color:${textColor};">Need help? Visit Help Center</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold" style="border-color:${borderColor}; color:${textColor}; opacity:${dark ? '1' : '.9'};">
        <span>© ${new Date().getFullYear()} Anilyfe · The anime marketplace, made personal.</span>
        <div class="flex flex-wrap justify-center gap-4">
          ${links.map((link, idx)=>`<a href="${link.href}" class="${idx>=2?'hidden sm:inline':''}" style="color:${textColor};">${link.label}</a>`).join('')}<a href="assets/images/CREDITS.md" class="hover:underline" style="color:${textColor};">Photo credits</a>
        </div>
      </div>
    </div>
  </footer>`;
}

function regionSelect(extra){  return `<div class="relative ${extra||''}">    <i data-lucide="globe-2" class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="width:15px;height:15px;color:var(--blue)"></i>
    <select class="inp !pl-9 !py-2 !text-xs !font-bold" data-action="set-region" aria-label="Region & currency">
      ${REGIONS.map(r=>`<option value="${r.code}" ${r.code===region().code?'selected':''}>${r.flag} ${r.name} · ${r.symbol.trim()}</option>`).join('')}
    </select>
  </div>`;
}

/* ---------- shared: sparks ---------- */
function sparks(n, seedN){
  let out='';
  for(let i=0;i<(n||14);i++){
    const x=((i*137+ (seedN||0)*53)%100), y=((i*61+(seedN||0)*29)%100), s=(i%3)+2, d=(3+(i%5));
    out += `<span class="spark" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;--d:${d}s"></span>`;
  }
  return out;
}

/* ---------- shared: "coming soon" shell for not-yet-built sections ---------- */
function comingSoonView(title, icon, desc){
  return `
  <div class="min-h-screen" style="background:var(--off)">
    <header class="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO('text-2xl')}
      <a href="#/" class="btn btn-ghost text-xs"><i data-lucide="arrow-left" style="width:14px;height:14px"></i> Back home</a>
    </header>
    <main class="max-w-3xl mx-auto px-5 py-24 text-center reveal in">
      ${ANILyfeUI.RotatingImage('empty','Empty delivery box','mx-auto mb-6 h-40 w-full max-w-md rounded-2xl',800,600)}
      <div class="w-16 h-16 rounded-2xl bg-[var(--vlight)] border border-[var(--light)] flex items-center justify-center mx-auto mb-6">
        <i data-lucide="${icon||'sparkles'}" style="width:26px;height:26px;color:var(--blue)"></i>
      </div>
      <h1 class="font-display text-3xl font-extrabold mb-3">${esc(title)}</h1>
      <p class="text-sm" style="color:var(--mid)">${esc(desc||'This section of Anilyfe is on the roadmap and not wired up in this prototype yet.')}</p>
      <a href="#/marketplace" class="btn btn-primary mt-8 inline-flex"><i data-lucide="store" style="width:15px;height:15px"></i> Browse the marketplace</a>
    </main>
  </div>`;
}

/* ---------- boot ---------- */

/* V1 policy/service pages */
function viewPaymentSecurity(){ return viewInfoPage({
  eyebrow:'PAYMENT & SECURITY',title:'Payment & Security',subtitle:'Every transaction deserves confidence.',
  paragraphs:['At Anilyfe, we want buyers to shop confidently and sellers to manage their earnings with peace of mind. Our payment process is designed to support secure transactions, clear order records, and reliable payment verification.'],
  sections:[
    {type:'cards',title:'Secure Checkout',items:[
      {title:'Secure Payments',text:'Payments are processed through Paystack, our payment provider. Your card details are handled by the payment provider during checkout.'},
      {title:'Verified Transactions',text:'Payments are verified before orders proceed to fulfillment, helping protect buyers and sellers against unconfirmed transactions.'},
      {title:'Transparent Order Totals',text:'Product prices, applicable shipping fees, and other charges are calculated and displayed during checkout before you complete your payment.'}
    ]},
    {type:'cards',title:'Seller Earnings & Withdrawals',items:[
      {title:'Your Sales, Your Earnings',text:'Track your sales and monitor your earnings through your seller dashboard.'}
    ]}
  ],
  ctaLabel:'Start shopping',ctaLink:'#/marketplace'
}); }
function viewSellerPolicy(){ return viewInfoPage({
  eyebrow:'SELLER POLICY',title:'Seller Policy',subtitle:'Your Store. Your Responsibility. Our Shared Marketplace.',
  paragraphs:['Welcome to Anilyfe, the marketplace where anime culture meets commerce.','Anilyfe brings together sellers and buyers to discover, sell, and shop for anime-inspired fashion, manga, collectibles, artwork, and gaming products.','Our goal is to create a reliable, well-organized marketplace where sellers can grow their businesses and buyers can shop with confidence.','This Seller Policy outlines the standards, responsibilities, and financial terms that apply to sellers operating on Anilyfe.'],
  sections:[{type:'list',title:'01 — Seller Responsibilities',items:[
    {title:'Accurate Product Listings',text:'Provide clear product descriptions, accurate prices, relevant images, and complete product details. Your listings must reflect the actual products you intend to sell.'},
    {title:'Stock & Availability',text:'Keep your inventory up to date. Ensure products are available before accepting an order.'}
  ]}],
  ctaLabel:'Become a seller',ctaLink:'#/auth'
}); }
function viewMarketplaceRules(){ return viewInfoPage({
  eyebrow:'MARKETPLACE & COMMUNITY RULES',title:'Marketplace & Community Rules',subtitle:'Built around anime. Powered by trust.',
  paragraphs:['Anilyfe brings anime culture to life through shopping, communities, and groups where fans can discover products, connect over shared interests, and celebrate what they love.','These rules apply to everyone using Anilyfe, whether you’re buying products, running a storefront, participating in communities, or joining groups.','Our goal is to create a safe, welcoming, and reliable experience for anime fans across Nigeria.'],
  sections:[{type:'bullets',title:'01 — What Belongs on Anilyfe',items:[
    'Anime-inspired clothing and accessories.','Manga and anime-related books.','Figures, collectibles, and merchandise.','Anime artwork and creative products.','Gaming products.','Anime discussions, fan interests, and related community activities.','All products offered for sale must be legally permitted, accurately described, and relevant to the marketplace.'
  ]}],
  ctaLabel:'Browse marketplace',ctaLink:'#/marketplace'
}); }
function viewKyc(){ return viewInfoPage({
  eyebrow:'SELLER VERIFICATION',title:'Seller Verification',subtitle:'Verify your identity. Build trust. Start selling.',
  paragraphs:['At Anilyfe, seller verification helps us maintain a more trustworthy marketplace for buyers and sellers.','Our Know Your Customer (KYC) process allows Anilyfe to review seller information before granting verified seller status. All submissions are reviewed through our verification process.'],
  sections:[
    {type:'cards',title:'01 — Before You Apply',items:[
      {title:'Personal Information',text:'Use your correct legal name and provide accurate contact details.'},
      {title:'Business Information',text:'Provide your store or business name and any requested business information.'},
      {title:'Location Details',text:'Provide your Nigerian state and Local Government Area (LGA), along with any other location details requested during registration.'},
      {title:'Supporting Documents',text:'Prepare valid identity or business documents if requested during the verification process.'}
    ]},
    {type:'list',title:'Submission',items:[
      {title:'Genuine information',text:'Submit only genuine documents and information that you are authorized to provide.'}
    ]}
  ],
  ctaLabel:'Open Seller Center',ctaLink:'#/seller/verification'
}); }
function viewCancellation(){ return viewInfoPage({
  eyebrow:'ORDER CANCELLATION',title:'Order Cancellation',subtitle:'Need to cancel an order? Here’s what to know.',
  paragraphs:['Order cancellation depends on your order status and payment status. All cancellation decisions and related payment adjustments are handled through Anilyfe’s order management process.'],
  sections:[
    {type:'list',title:'Before Payment',items:[
      {title:'Unpaid orders',text:'Unpaid orders may remain pending or expire, depending on the system’s order rules.'},
      {title:'Pay safely',text:'Complete payments only through Anilyfe’s official checkout. Never send payment directly to a seller outside the platform.'}
    ]},
    {type:'list',title:'After Payment',items:[
      {title:'Request assistance',text:'If you need to cancel a paid order, contact Anilyfe Support for assistance.'},
      {title:'Cancellation is not guaranteed',text:'Cancellation is not guaranteed once payment has been completed or the seller has started processing your order.'},
      {title:'Confirmation',text:'Your cancellation is only confirmed when your order status reflects the decision.'}
    ]},
    {type:'list',title:'Refunds',items:[
      {title:'Eligible cancellations',text:'If your cancellation qualifies for a refund, it will be handled through Anilyfe’s refund process.'},
      {title:'Eligibility and processing',text:'Refund eligibility and processing depend on the order circumstances and payment status.'}
    ]}
  ],
  ctaLabel:'Contact Anilyfe Support',ctaLink:'#/contact',contact:true,supportTitle:'Still need help?',supportLabel:'Contact Anilyfe Support'
}); }function view404(){ return `<div class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5"><div class="max-w-md w-full card p-10 text-center"><img src="assets/images/404.png" width="192" height="160" alt="Confused ANILyfe mascot" class="mx-auto mb-2 h-40 w-48 max-w-full rounded-2xl object-cover object-[center_42%] motion-safe:animate-anilyfe-404-float" loading="eager"><div class="font-tech text-[10px] font-bold tracking-[.25em] text-[#708BD1] mt-3">404</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C] mt-2">Page not found</h1><p class="text-sm text-slate-500 mt-2">That ANILyfe route does not exist.</p><a href="#/" class="btn btn-primary mt-5">Back home</a></div></div>`;}

/* API-backed account page replaces the legacy localStorage profile renderer. */
window.viewProfile = function(){
  const u=window.ANILyfeAPI?.state?.user;
  if(!u){location.hash='#/auth';return '';}
  const s=window.ANILyfeAPI?.state?.seller;
  return `<div class="min-h-screen bg-[#F6FCFF]"><header class="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">${LOGO('text-2xl')}<a href="#/marketplace" class="btn btn-ghost text-xs">Marketplace</a></header><main class="max-w-5xl mx-auto px-5 pb-20"><div class="card p-7"><img src="assets/images/web/anime-city-violet.png" alt="" class="mb-6 h-36 w-full rounded-2xl object-cover md:h-44" loading="lazy" onerror="this.remove()"><div class="flex flex-col sm:flex-row sm:items-center gap-5"><div class="w-20 h-20 rounded-3xl bg-[#334EAC] text-white flex items-center justify-center font-display text-2xl font-extrabold">${esc((u.name||u.firstName||'U')[0].toUpperCase())}</div><div class="flex-1"><div class="text-[10px] uppercase tracking-widest text-[#708BD1] font-bold">ACCOUNT</div><h1 class="font-display font-extrabold text-2xl text-[#081F5C] mt-1">${esc(u.name||`${u.firstName||''} ${u.lastName||''}`.trim())}</h1><p class="text-sm text-slate-500 mt-1">${esc(u.email)}</p></div>${s?`<span class="badge !bg-[#E7F1FF] !text-[#334EAC]">Seller · ${esc(s.status||'pending')}</span>`:''}</div><div class="mt-7 grid sm:grid-cols-2 gap-4 text-sm"><div class="p-4 rounded-2xl bg-white border border-[#D0E3FF]"><div class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Location</div><div class="font-bold mt-1">${esc(u.city||'—')} · ${esc(u.state||'—')}</div><div class="text-xs text-slate-500 mt-1">LGA: ${esc(u.lga||'—')}</div></div><div class="p-4 rounded-2xl bg-white border border-[#D0E3FF]"><div class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Role</div><div class="font-bold mt-1">${esc(u.role)}</div><div class="text-xs text-slate-500 mt-1">Phone: ${esc(u.phone||'—')}</div></div></div><div class="mt-6 flex flex-wrap gap-3"><a href="#/orders" class="btn btn-primary">My orders</a>${s?`<a href="#/seller" class="btn btn-ghost">Seller Center</a>`:`<a href="#/auth" class="btn btn-ghost">Become a Seller</a>`}<button class="btn btn-danger" data-action="logout">Log out</button></div></div></main></div>`;
};
