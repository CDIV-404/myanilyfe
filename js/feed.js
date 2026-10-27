/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Marketing landing page / logged-out home feed. */

function viewLanding(){
  const niches=window.ANILyfeCategories||[];
  const loop = niches.map(x=>`
    <a href="#/search?category=${encodeURIComponent(x.id)}" aria-label="Browse ${esc(x.title)}: ${esc(x.description)}" class="glass-dark rounded-2xl p-5 w-60 shrink-0 group block hover:-translate-y-1 transition">
      <img src="${x.image}" width="240" height="112" alt="${esc(x.title)}" class="mb-4 h-28 w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy">
      <div class="w-12 h-12 rounded-xl bg-[rgba(208,227,255,.12)] border border-[rgba(208,227,255,.2)] flex items-center justify-center mb-4 transition group-hover:bg-[#334EAC] group-hover:scale-110" style="transition:.3s">
        <i data-lucide="${x.icon}" style="width:22px;height:22px;color:#D0E3FF"></i>
      </div>
      <div class="font-display font-bold text-white text-lg">${esc(x.title)}</div>
      <div class="text-xs text-[#9FB8EE] mt-1 leading-relaxed">${esc(x.description)}</div>
    </a>`).join('');

  return `
  <div class="min-h-screen hero-ambient relative overflow-hidden">
    <div class="absolute inset-0 grid-lines"></div>

    ${(()=>{const a=(window.ANILyfeAPI?.getAnnouncements?.()||[]).find(x=>x.active!==false);return a?`<div class="relative z-20 bg-white/10 border-b border-white/10"><div class="max-w-7xl mx-auto px-5 py-2.5 flex items-center gap-3 text-white text-xs"><i data-lucide="megaphone" style="width:14px;height:14px;color:#9BC7FF"></i><span class="flex-1 font-bold">${esc(a.text)}</span>${a.link?`<a href="${esc(a.link)}" target="_blank" rel="noopener" class="text-[#9BC7FF] font-extrabold">Open</a>`:''}<button data-action="dismiss-announcement" data-id="${a.id}" class="text-white/70">✕</button></div></div>`:''})()}
    <!-- nav -->
    <header class="relative z-10 max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
      ${LOGO_D('text-2xl')}
      <nav class="hidden md:flex items-center gap-7 text-[#C9D9F5] text-sm font-semibold">
        <a href="#niches" class="hover:text-white transition">Niches</a>
        <a href="#sell" class="hover:text-white transition">Sell</a>
        <a href="#/marketplace" class="hover:text-white transition">Marketplace</a>
        <a href="https://linktr.ee/Anilyfe" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">Join Community</a>
      </nav>
      <div class="flex items-center gap-3">
        ${regionSelect('hidden sm:block !w-44 [&_select]:!bg-[rgba(8,31,92,.5)] [&_select]:!text-[#D0E3FF] [&_select]:!border-[rgba(208,227,255,.25)]')}
        <a href="#/auth" class="btn btn-ghost !py-2 !text-xs">Sign in</a>
      </div>
    </header>

    <!-- hero -->
    <section class="relative z-10 max-w-7xl mx-auto px-5 pt-14 pb-24 md:pt-24 md:pb-32">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 glass-dark rounded-full px-4 py-2 text-xs font-bold text-[#D0E3FF] mb-7 reveal">
          <span class="w-2 h-2 rounded-full bg-[#7FB0FF]"></span> NIGERIA'S FIRST ANIME MARKETPLACE
        </div>
        <h1 class="font-display font-extrabold text-white leading-[1.02] text-5xl md:text-7xl reveal">
          Welcome to<br/><span class="text-[#D0E3FF]">ANILyfe</span><span class="text-[#9BC7FF]">.</span>
        </h1>
        <p class="mt-6 text-[#C9D9F5] text-base font-medium md:text-lg leading-relaxed max-w-xl reveal">
          <strong>Discover. Shop. Collect. — All in One Place.</strong> Where shopping anime products is made easy. Discover figures, manga, art and everyday fan favourites from trusted sellers.
        </p>
        <div class="mt-9 flex flex-wrap gap-4 reveal">
          <a href="#/marketplace" class="btn btn-primary !px-7 !py-3.5 !text-sm">Ikuzo — explore marketplace <i data-lucide="arrow-right" style="width:17px;height:17px"></i></a>
          <button data-action="become-seller" class="btn !px-7 !py-3.5 !text-sm !bg-white/10 !text-white !border !border-[rgba(208,227,255,.3)] hover:!bg-white/20">Become a Seller</button>
        </div>
        <div class="mt-12 flex flex-wrap gap-8 reveal">
          ${[['7','Core categories'],['Buyer-first','Trusted shopping'],['Nigeria 🇳🇬','Made for Nigeria']].map(s=>`
            <div><div class="font-display font-extrabold text-2xl text-white">${s[0]}</div><div class="text-xs uppercase tracking-widest text-[#9FB8EE] font-bold mt-1">${s[1]}</div></div>`).join('')}
        </div>
      </div>

      <div class="absolute right-8 top-1/2 hidden w-[430px] -translate-y-1/2 lg:block xl:w-[520px]">
        <div class="relative">
          <img src="assets/images/homepage.png" width="640" height="360" alt="ANILyfe anime marketplace" class="anilyfe-art aspect-[16/10] w-full" loading="eager" onerror="this.parentNode.style.display='none'">

          <div class="absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-[#071B52]/90 to-transparent p-4 text-center font-tech text-xs font-bold italic tracking-widest text-[#9BC7FF]">EST. FOR THE CULTURE</div>
        </div>
      </div>
    </section>

    <section class="relative z-10 max-w-7xl mx-auto px-5 pb-12">
      <div class="grid md:grid-cols-[1.15fr_.85fr] gap-5">
        <div class="card marketplace-preview-card overflow-hidden backdrop-blur-xl">
          <div class="relative h-72 overflow-hidden">
            <img src="assets/images/marketplace.png" width="640" height="288" alt="ANILyfe anime marketplace shelves" class="w-full h-full object-cover" loading="eager" onerror="this.remove()">
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071B52]/95 to-transparent p-4"><div class="font-tech text-[9px] tracking-[.2em] text-white/80">ANILyfe marketplace preview</div></div>
          </div>
          <div class="grid grid-cols-2 gap-px bg-white/10">
            <img src="assets/images/figures.png" width="300" height="112" alt="Anime figures collection" class="w-full h-28 object-cover object-[center_70%] bg-transparent" loading="lazy">
            <img src="assets/images/manga.png" width="300" height="112" alt="Anime manga collection" class="w-full h-28 object-cover object-[center_70%] bg-transparent" loading="lazy">
          </div>
          <div class="p-5"><div class="font-tech text-[10px] uppercase tracking-[.25em] text-[#d2bce0]">Curated for the culture</div><h2 class="mt-2 font-display text-xl font-extrabold text-white">More Than Merch. It's Your World.</h2><p class="mt-2 text-base font-medium text-white/75 leading-relaxed">From iconic manga to everyday anime inspired essentials, discover products that bring your fandom to life. IKUZOOOO</p><a href="#/marketplace" class="btn btn-primary mt-4 w-fit">Discover your next find</a></div>
        </div>
        <div class="glass-dark rounded-3xl p-7 flex flex-col justify-center">
          <div class="font-tech text-[10px] uppercase tracking-[.25em] text-[#d2bce0]">Your next favourite is waiting.</div>
          <h2 class="mt-2 font-display text-2xl font-extrabold text-white">Your Next Favourite Find Starts Here.</h2>
          <p class="mt-3 text-base font-medium text-[#C9D9F5] leading-relaxed">Browse fan favourites and discover new finds as sellers add their collections. Discover standout finds, explore new collections, and shop products from sellers across Nigeria.</p>
          <a href="#/marketplace" class="btn btn-primary mt-5 w-fit">Discover the Marketplace <i data-lucide="arrow-right" style="width:15px;height:15px"></i></a>
        </div>
      </div>
    </section>

    <!-- niches marquee -->
    <section id="niches" class="relative z-10 py-16 border-t border-[rgba(208,227,255,.12)]">
      <div class="max-w-7xl mx-auto px-5 flex items-end justify-between mb-8">
        <div>
          <div class="font-tech text-xs font-bold tracking-[.25em] text-[#708BD1] mb-2">Explore the collection</div>
          <h2 class="font-display font-bold text-3xl text-white">Find your Anime Niche</h2>
          <p class="mt-2 max-w-2xl text-base font-medium text-[#C9D9F5]">From the pages of your favourite manga to the pieces you wear, find something that speaks to your fandom.</p>
        </div>
        <a href="#/marketplace" class="hidden sm:flex items-center gap-2 text-sm font-bold text-[#D0E3FF] hover:text-white transition">Explore All <i data-lucide="chevron-right" style="width:16px;height:16px"></i></a>
      </div>
      <div class="marquee"><div class="marquee-track pr-5">${loop}${loop}</div></div>
    </section>

    <!-- community -->
    <section id="community" class="relative z-10 py-8 md:py-12">
      <div class="max-w-7xl mx-auto px-5">
        <div class="glass rounded-3xl p-8 md:p-12">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div class="max-w-2xl">
              <div class="font-tech text-xs font-bold tracking-[.25em] text-[#334EAC] mb-3">COMMUNITY</div>
              <h2 class="font-display font-extrabold text-3xl md:text-4xl text-[#081F5C] leading-tight">Join the ANILyfe community</h2>
              <p class="mt-4 text-[#4A5A8C] leading-relaxed">Connect with collectors, creators and anime sellers across Nigeria. Discover releases, store updates, and catalog drops.</p>
            </div>
            <a class="btn btn-primary !px-7 !py-3.5 !text-sm" href="https://linktr.ee/Anilyfe" target="_blank" rel="noopener noreferrer">Join Community <i data-lucide="arrow-right" style="width:16px;height:16px"></i></a>
          </div>
        </div>
      </div>
    </section>

    <section class="relative z-10 py-16">
      <div class="max-w-7xl mx-auto px-5">
        <div class="grid md:grid-cols-3 gap-5">
          ${[
            ['How it works','Discover approved products → add to cart → confirm delivery → pay securely → track your order.','arrow-right'],
            ['Buyer protection','Seller approval, protected payments and responsive support help every order feel more secure.','shield-check'],
            ['Sell on ANILyfe','Create your seller identity → complete KYC → await approval → publish approved products → fulfil paid orders.','store']
          ].map(x=>`<div class="glass rounded-3xl p-7"><span class="w-11 h-11 rounded-xl bg-[#E7F1FF] flex items-center justify-center"><i data-lucide="${x[2]}" style="width:20px;height:20px;color:#334EAC"></i></span><h3 class="font-display font-extrabold text-xl text-[#081F5C] mt-5">${x[0]}</h3><p class="text-sm text-[#4A5A8C] mt-2 leading-relaxed">${x[1]}</p></div>`).join('')}
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          ${[['Buyer Protection','#/buyer-protection'],['Payment & Security','#/payment-security'],['Shipping','#/shipping'],['Returns & Refunds','#/returns'],['Seller Policy','#/seller-policy'],['Marketplace Rules','#/marketplace-rules'],['KYC','#/kyc'],['Cancellation','#/cancellation'],['Contact Support','#/contact']].map(x=>`<a href="${x[1]}" class="chip">${x[0]}</a>`).join('')}
        </div>
      </div>
    </section>

    <section class="relative z-10 py-12">
      <div class="max-w-7xl mx-auto px-5">
        <div class="glass-dark rounded-3xl p-8 md:p-10">
          <div class="font-tech text-[10px] uppercase tracking-[.25em] text-[#d2bce0]">COMMUNITY → DISTRIBUTION</div>
          <div class="mt-6 grid sm:grid-cols-5 gap-3">
            ${['Community','Awareness','Marketplace','Sellers','Buyers'].map((x,i)=>`<div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"><div class="text-[10px] font-bold text-[#708BD1]">0${i+1}</div><div class="mt-2 font-display font-bold text-white">${x}</div></div>`).join('')}
          </div>
          <p class="mt-5 text-xs text-[#C9D9F5]">Distribution channels: WhatsApp, Telegram, Discord, campus ambassadors, creators and seller referrals. These are awareness channels, not social features inside ANILyfe.</p>
        </div>
      </div>
    </section>

    <!-- become a seller -->
    <section id="sell" class="relative z-10 py-20">
      <div class="max-w-7xl mx-auto px-5">
        <div class="glass rounded-3xl p-8 md:p-14 grid md:grid-cols-2 gap-10 items-center reveal">
          <div>
            <div class="font-tech text-xs font-bold tracking-[.25em] text-[#334EAC] mb-3">SELLER ARC</div>
            <h2 class="font-display font-extrabold text-3xl md:text-4xl text-[#081F5C] leading-tight">Turn your passion into your next big move.</h2>
            <p class="mt-4 text-base font-medium text-[#4A5A8C] leading-relaxed">From anime inspired fits and manga to collectibles, artwork, and gaming, bring your inventory to ANILyfe and put your products in front of anime fans across Nigeria.</p>
            <div class="mt-6 space-y-4 text-base font-medium text-[#4A5A8C]">
              <div><h3 class="font-bold text-[#081F5C]">Your own seller dashboard</h3><p>Manage your products, orders, and earnings in one place.</p></div>
              <div><h3 class="font-bold text-[#081F5C]">Verified sellers. Trusted shopping.</h3><p>Our approval process helps build a safer marketplace for everyone.</p></div>
              <div><h3 class="font-bold text-[#081F5C]">Your shop. Your rules. Your growth.</h3><p>Set your prices in naira and grow your anime business at your own pace.</p></div>
            </div>
            <p class="mt-3 text-sm font-semibold text-[#4A5A8C]">Your journey starts with one application.</p>
          </div>
          <div class="relative">
            <div class="rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
              <img src="assets/images/web/figures-cabinet.jpg" width="400" height="288" alt="Anime figures on display" class="w-full h-72 object-cover" loading="lazy"/>
            </div>
            <div class="absolute -bottom-5 -left-5 glass rounded-2xl px-5 py-4">
              <div class="font-display font-extrabold text-2xl text-[#081F5C]">Real</div>
              <div class="text-[11px] font-bold uppercase tracking-widest text-[#708BD1]">seller activity only</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${siteFooter('relative z-10 border-t border-[rgba(208,227,255,.12)] bg-[rgba(8,31,92,.8)] text-white')}
  </div>`;
}
