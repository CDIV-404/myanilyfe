/* ANILyfe V1 shared UI primitives. Original mascot/art only. */
(function(){
  const fallbackImage='assets/images/placeholder.svg';
  document.addEventListener('error',event=>{
    const image=event.target;
    if(!(image instanceof HTMLImageElement))return;
    if(image.dataset.fallbackApplied==='true'){
      image.classList.add('image-fallback-unavailable');
      return;
    }
    image.dataset.fallbackApplied='true';
    image.src=fallbackImage;
    event.stopImmediatePropagation();
  },true);
  const IMG = (name) => `assets/images/${name}.png`;
  /* ImageSlot: every image on the site is a PNG in assets/images/. Sets explicit dimensions to prevent layout shift. */
  const ImageSlot = (name, alt='', cls='', width=null, height=null) => `<img src="${IMG(name)}" alt="${esc(alt)}" class="${cls}" ${width?`width="${width}"`:''} ${height?`height="${height}"`:''} loading="lazy" onerror="this.style.display='none'">`;
  const imageRatios={homepage:[16,9],admin:[7,4],seller:[7,4],auth:[5,6],marketplace:[16,5],checkout:[5,3],'404':[10,7],empty:[4,3],splash:[9,16],figures:[1,1],manga:[1,1],apparel:[1,1],art:[1,1],collectibles:[1,1],accessories:[1,1],gaming:[1,1],game:[1,1]};
  const RotatingImage = (slot,alt='',cls='',width=null,height=null) => {
    const [rw,rh]=imageRatios[slot]||[1,1];
    return `<div data-rotating-image data-slot="${esc(slot)}" class="relative overflow-hidden ${cls}" style="aspect-ratio:${rw}/${rh}" ${width?`width="${width}"`:''} ${height?`height="${height}"`:''}>
      <img data-rotate-layer="0" src="assets/images/${esc(slot)}.png" alt="${esc(alt)}" class="absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-500" loading="lazy" onerror="window.ANILyfeUI?.hideRotatingImage(this)">
      <img data-rotate-layer="1" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500" loading="lazy">
    </div>`;
  };
  const rotationStates=new WeakMap();
  const hideRotatingImage=image=>{const frame=image.closest('[data-rotating-image]');if(!frame)return;const state=rotationStates.get(frame);if(state)state.failed.add(image.dataset.rotateSrc||image.getAttribute('src'));if(state&&state.failed.size>=state.sources.length){frame.hidden=true;clearTimeout(state.timer);}};
  const initRotatingImage=frame=>{
    if(rotationStates.has(frame))return;
    const slot=frame.dataset.slot;
    const sources=[`assets/images/${slot}.png`,...Array.from({length:4},(_,i)=>`assets/images/${slot}-${i+1}.png`)];
    const layers=[...frame.querySelectorAll('[data-rotate-layer]')];
    const state={sources,index:-1,active:0,failed:new Set(),timer:null,paused:document.hidden,reduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches,hasVariants:false};
    rotationStates.set(frame,state);
    const initial=layers[0];initial.dataset.rotateSrc=initial.getAttribute('src');state.index=0;
    initial.addEventListener('error',()=>{
      state.failed.add(sources[0]);
      if(state.reduced){frame.hidden=true;return;}
      state.index=0;advance();
    },{once:true});
    const schedule=()=>{if(!state.paused&&!state.reduced&&state.hasVariants)state.timer=setTimeout(advance,10000);};
    const advance=()=>{
      if(state.paused||state.reduced)return;
      let next=(state.index+1)%sources.length,attempts=0;
      const preload=()=>{
        if(attempts++>=sources.length){schedule();return;}
        const src=sources[next];
        if(state.failed.has(src)){next=(next+1)%sources.length;preload();return;}
        const probe=new Image();
        probe.onload=()=>{
          const inactive=1-state.active,target=layers[inactive];
          target.dataset.rotateSrc=src;target.src=src;target.classList.remove('opacity-0');target.classList.add('opacity-100');
          layers[state.active].classList.remove('opacity-100');layers[state.active].classList.add('opacity-0');
          state.active=inactive;state.index=next;
          schedule();
        };
        probe.onerror=()=>{
          state.failed.add(src);
          if(state.failed.size>=sources.length){frame.hidden=true;clearTimeout(state.timer);return;}
          next=(next+1)%sources.length;preload();
        };
        probe.src=src;
      };
      preload();
    };
    const findVariant=index=>{
      if(state.paused||state.reduced||index>=sources.length)return;
      const src=sources[index];
      const probe=new Image();
      probe.onload=()=>{state.hasVariants=true;schedule();};
      probe.onerror=()=>{state.failed.add(src);if(state.failed.size>=sources.length)frame.hidden=true;else findVariant(index+1);};
      probe.src=src;
    };
    state.advance=advance;state.schedule=schedule;state.findVariant=findVariant;
    if(!state.reduced)findVariant(1);
  };
  document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-rotating-image]').forEach(frame=>{
    const state=rotationStates.get(frame);if(!state)return;state.paused=document.hidden;
    if(state.paused)clearTimeout(state.timer);else if(!state.reduced){if(state.hasVariants)state.schedule();else state.findVariant(1);}
  }));
  const scanRotatingImages=root=>{
    if(root?.matches?.('[data-rotating-image]'))initRotatingImage(root);
    root?.querySelectorAll?.('[data-rotating-image]').forEach(initRotatingImage);
  };
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)scanRotatingImages(node);}))).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>scanRotatingImages(document));
  const mascot = (size='72') => `<div class="anilyfe-mascot relative mx-auto w-[${size}px] h-[${size}px]" aria-hidden="true"><svg viewBox="0 0 96 96" class="w-full h-full" fill="none" width="${size}" height="${size}"><rect x="10" y="10" width="76" height="76" rx="24" fill="#E7F1FF" stroke="#334EAC" stroke-width="3"/><path d="M31 42c5-9 29-9 34 0" stroke="#334EAC" stroke-width="4" stroke-linecap="round"/><circle cx="34" cy="52" r="5" fill="#334EAC"/><circle cx="62" cy="52" r="5" fill="#334EAC"/><path d="M36 67c7 5 17 5 24 0" stroke="#334EAC" stroke-width="4" stroke-linecap="round"/><path d="M48 10v-6M28 14l-4-5M68 14l4-5" stroke="#708BD1" stroke-width="3" stroke-linecap="round"/></svg><img src="assets/images/loader-mascot.png" width="512" height="512" alt="" class="absolute inset-0 h-full w-full object-contain" onload="var v=this.parentNode.querySelector('svg');if(v)v.style.display='none'" onerror="this.style.display='none'"></div>`;
  const AnimeLoader = (message='Loading marketplace data...') => `<div class="anilyfe-loader flex min-h-[220px] items-center justify-center p-8 text-center" role="status" aria-live="polite"><div>${mascot('72')}<div class="mt-4 font-display font-bold text-anilyfe-700">${esc(message)}</div><div class="mx-auto mt-3 h-1 w-32 overflow-hidden rounded-full bg-anilyfe-100"><div class="h-full w-1/2 rounded-full bg-anilyfe-500 animate-[anilyfe-loading_900ms_ease-in-out_infinite]"></div></div></div></div>`;
  const Skeleton = (kind='card') => kind==='table' ? `<div class="space-y-3 animate-pulse">${[1,2,3,4].map(()=>`<div class="h-12 rounded-xl bg-anilyfe-100"></div>`).join('')}</div>` : `<div class="grid grid-cols-2 gap-4 animate-pulse sm:grid-cols-3 lg:grid-cols-4">${[1,2,3,4].map(()=>`<div class="overflow-hidden rounded-2xl border border-anilyfe-100 bg-white"><div class="aspect-square bg-anilyfe-100"></div><div class="space-y-2 p-4"><div class="h-3 w-2/3 rounded bg-anilyfe-100"></div><div class="h-4 w-full rounded bg-anilyfe-100"></div><div class="h-3 w-1/2 rounded bg-anilyfe-100"></div></div></div>`).join('')}</div>`;
  const EmptyState = (title='No records to display', message='There is nothing here yet.', action='') => `<div class="rounded-3xl border border-dashed border-anilyfe-200 bg-white p-10 text-center">${RotatingImage('empty','Empty delivery box','mx-auto mb-4 h-36 w-full max-w-xs rounded-2xl',800,600)}<h3 class="mt-4 font-display text-lg font-bold text-anilyfe-700">${esc(title)}</h3><p class="mx-auto mt-2 max-w-md text-sm text-slate-500">${esc(message)}</p>${action}</div>`;
  const ErrorState = (title='Something went wrong', message='We could not load this section. Please try again.', retry='route()') => `<div class="rounded-3xl border border-red-100 bg-white p-10 text-center"><div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-error"><i data-lucide="alert-triangle" style="width:28px;height:28px"></i></div><h3 class="mt-4 font-display text-lg font-bold text-slate-800">${esc(title)}</h3><p class="mx-auto mt-2 max-w-md text-sm text-slate-500">${esc(message)}</p><button class="btn btn-primary mt-5" onclick="${retry}">Retry</button></div>`;
  const Badge = (text,type='info') => { const map={success:'bg-emerald-50 text-emerald-700 border-emerald-200',warning:'bg-amber-50 text-amber-700 border-amber-200',error:'bg-red-50 text-red-700 border-red-200',info:'bg-anilyfe-100 text-anilyfe-700 border-anilyfe-200'}; return `<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${map[type]||map.info}">${esc(text)}</span>`; };
  const Button = (label, cls='btn-primary', attrs='') => `<button class="btn ${cls}" ${attrs}>${label}</button>`;
  const Card = (content, cls='') => `<section class="card ${cls}">${content}</section>`;

  /* Full-screen image viewer for store branding. */
  const LIGHTBOX_SIZES={
    logo:{width:500,height:500,img:'max-h-[78vh] w-[500px] max-w-full rounded-3xl bg-white object-contain'},
    banner:{width:1920,height:480,img:'max-h-[46vh] w-full max-w-[1920px] rounded-2xl object-cover'},
    default:{width:1200,height:800,img:'max-h-[82vh] w-auto max-w-full rounded-2xl object-contain'}
  };
  const safeImageSource=value=>{const src=String(value||'').trim();return /^(https?:\/\/|\/\/|\/|\.\/|assets\/|data:image\/)/i.test(src)?src:'';};
  const LightboxAttrs=(src='',alt='',kind='default')=>safeImageSource(src)
    ? `data-action="anilyfe-lightbox" data-lightbox-src="${esc(src)}" data-lightbox-alt="${esc(alt)}" data-lightbox-kind="${kind}" role="button" tabindex="0" aria-label="View ${esc(alt||'image')} full size"`
    : '';
  function closeLightbox(){
    const root=document.getElementById('anilyfe-lightbox');
    if(!root)return;
    root.remove();
    document.body.classList.remove('overflow-hidden');
  }
  function openLightbox(src,alt='',kind='default'){
    const imageSource=safeImageSource(src);
    if(!imageSource)return;
    const size=LIGHTBOX_SIZES[kind]||LIGHTBOX_SIZES.default;
    closeLightbox();
    const root=document.createElement('div');
    root.id='anilyfe-lightbox';
    root.innerHTML=`<div class="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="${esc(alt||'Store image')}" data-action="anilyfe-lightbox-close">
      <button type="button" id="anilyfe-lightbox-close" class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20" data-action="anilyfe-lightbox-close" aria-label="Close image viewer"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      <img src="${esc(src)}" alt="${esc(alt)}" width="${size.width}" height="${size.height}" class="${size.img} shadow-2xl">
      <p class="text-[11px] font-bold uppercase tracking-wider text-white/70">${esc(alt||'Image')} · click outside or press Esc to close</p>
    </div>`;
    document.body.appendChild(root);
    document.body.classList.add('overflow-hidden');
    window.lucide?.createIcons?.();
    root.querySelector('#anilyfe-lightbox-close')?.focus();
    root.querySelectorAll('img').forEach(image=>image.addEventListener('click',event=>event.stopPropagation()));
    root.querySelectorAll('p').forEach(paragraph=>paragraph.addEventListener('click',event=>event.stopPropagation()));
  }
  document.addEventListener('click',event=>{
    const open=event.target.closest?.('[data-action="anilyfe-lightbox"]');
    if(open){event.preventDefault();openLightbox(open.dataset.lightboxSrc,open.dataset.lightboxAlt,open.dataset.lightboxKind);return;}
    if(event.target.closest?.('[data-action="anilyfe-lightbox-close"]'))closeLightbox();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.getElementById('anilyfe-lightbox')){closeLightbox();return;}
    if((event.key==='Enter'||event.key===' ')&&event.target?.dataset?.action==='anilyfe-lightbox'){
      event.preventDefault();
      openLightbox(event.target.dataset.lightboxSrc,event.target.dataset.lightboxAlt,event.target.dataset.lightboxKind);
    }
  });
  window.addEventListener('hashchange',closeLightbox);

  /* Shared storefront: the public #/store/:slug page and the seller preview render this exact markup. */
  function storefrontCard(store, products, opts) {
    const options = opts || {};
    const shareAction = options.shareAction || 'copy-store-url';
    const shareAttrs = options.shareAttrs || '';
    const list = Array.isArray(products) ? products : [];
    const money = (typeof fmt === 'function' ? fmt : (v => '₦' + Number(v || 0).toLocaleString()));
    const imageOf = p => {
      const first = Array.isArray(p.images) ? p.images[0] : null;
      return safeImageSource(typeof first === 'string' ? first : (first && first.url)) || p.img || window.ANILyfeCategoryImageFor?.(p.category) || '';
    };
    const name = store.storeName || store.businessName || 'ANILyfe Store';
    const logo = safeImageSource(store.logo || store.logoUrl || store.profileImageUrl);
    const banner = safeImageSource(store.banner || store.bannerUrl || store.bannerImageUrl);
    const bio = store.description || store.bio || '';
    const founding = store.foundingSellerActive === true && Number(store.foundingSellerNumber) > 0 && String(store.status || 'approved').toLowerCase() === 'approved';
    const verified = String(store.verificationStatus || '').toUpperCase() === 'APPROVED';
    const rating = Number(store.rating || 0);
    const reviewCount = Number(store.reviewCount || 0);
    const location = [store.city, store.state].filter(Boolean).join(', ') || 'Nigeria';
    return `
      <div class="relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl border border-[#D0E3FF] shadow-lg sm:min-h-[360px] lg:aspect-[1920/480] lg:min-h-[420px]">
        ${banner ? `<img src="${esc(banner)}" alt="${esc(name)} banner" width="1920" height="480" class="absolute inset-0 w-full h-full object-cover cursor-zoom-in" ${LightboxAttrs(banner, `${name} banner`, 'banner')} onerror="this.remove()" />` : `<img src="assets/images/web/figures-display.jpg" alt="" width="1920" height="480" class="absolute inset-0 w-full h-full object-cover opacity-80" onerror="this.remove()" />`}
        <div class="absolute inset-0 bg-gradient-to-t from-[#081F5C] via-[#081F5C]/75 to-transparent"></div>
        <div class="relative z-10 flex flex-col gap-6 p-6 text-white md:flex-row md:items-end md:justify-between md:p-8">
          <div class="flex items-start gap-4 sm:items-center sm:gap-6">
            ${logo
              ? `<img src="${esc(logo)}" alt="${esc(name)} logo" width="500" height="500" title="Click to view full size" class="h-40 w-40 shrink-0 rounded-3xl border-4 border-white/70 bg-white object-contain shadow-xl transition hover:scale-105 sm:h-56 sm:w-56 cursor-zoom-in" ${LightboxAttrs(logo, `${name} logo`, 'logo')} />`
              : `<div class="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl border-4 border-white/70 bg-white/10 font-display text-5xl font-extrabold sm:h-56 sm:w-56">${esc(name.slice(0, 1).toUpperCase())}</div>`}
            <div>
              <div class="mb-1 flex flex-wrap items-center gap-2">
                <h1 class="font-display text-2xl font-extrabold tracking-tight text-white md:text-3xl">${esc(name)}</h1>
                ${verified ? `<span class="inline-flex items-center gap-1 rounded-full bg-[#E6F7EC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#047857]"><i data-lucide="badge-check" style="width:12px;height:12px"></i><span>Verified Seller</span></span>` : ''}
                ${founding ? `<span class="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-extrabold text-[#B45309]"><i data-lucide="crown" style="width:12px;height:12px;color:#D97706"></i><span>Founding Seller #${String(store.foundingSellerNumber).padStart(3, '0')}</span></span>` : ''}
              </div>
              <p class="max-w-xl text-xs leading-relaxed text-[#D0E3FF]">${esc(bio || 'Anime figures, manga and collectibles from a trusted ANILyfe seller.')}</p>
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#C9D9F5]">
                <span>📍 ${esc(location)}</span>
                <span>·</span>
                <span>★ ${rating.toFixed ? rating.toFixed(1) : rating} (${reviewCount} review${reviewCount === 1 ? '' : 's'})</span>
                <span>·</span>
                <span>📦 ${list.length} Product${list.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button class="btn !border !border-white/40 !bg-white/20 !px-3 !py-2 text-xs font-bold !text-white hover:!bg-white/30" data-action="${esc(shareAction)}" ${shareAttrs}>
              <i data-lucide="share-2" style="width:14px;height:14px"></i>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-3.5 sm:grid-cols-3">
        <div class="rounded-2xl border border-white/60 bg-white p-4 shadow-xs">
          <div class="mb-1 flex items-center gap-2 text-xs font-extrabold text-[#081F5C]">
            <i data-lucide="truck" style="width:15px;height:15px;color:#334EAC"></i>
            <span>Nationwide Delivery</span>
          </div>
          <p class="text-[11px] leading-snug text-slate-500">Dispatches within 1-2 business days from ${esc(store.city || 'the seller dispatch location')}, ${esc(store.state || 'Nigeria')}.</p>
        </div>
        <div class="rounded-2xl border border-white/60 bg-white p-4 shadow-xs">
          <div class="mb-1 flex items-center gap-2 text-xs font-extrabold text-[#081F5C]">
            <i data-lucide="rotate-ccw" style="width:15px;height:15px;color:#334EAC"></i>
            <span>7-Day Return Guarantee</span>
          </div>
          <p class="text-[11px] leading-snug text-slate-500">${esc(store.returnPolicy || 'Returns follow the ANILyfe buyer protection policy. Contact the seller within 7 days of delivery.')}</p>
        </div>
        <div class="rounded-2xl border border-white/60 bg-white p-4 shadow-xs">
          <div class="mb-1 flex items-center gap-2 text-xs font-extrabold text-[#081F5C]">
            <i data-lucide="shield-check" style="width:15px;height:15px;color:#10B981"></i>
            <span>100% Authentic Collectibles</span>
          </div>
          <p class="text-[11px] leading-snug text-slate-500">Product authenticity information is supplied by the seller and subject to marketplace review.</p>
        </div>
      </div>

      <div class="rounded-3xl border border-white/60 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#334EAC]">Store Merchandise</span>
            <h2 class="mt-0.5 font-display text-lg font-extrabold text-[#0F172A]">Available Catalog (${list.length})</h2>
          </div>
        </div>
        ${list.length ? `<div class="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${list.map(p => `
          <div class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 transition hover:shadow-md">
            <div>
              <div class="relative mb-2.5 aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                <img src="${esc(imageOf(p))}" alt="${esc(p.name || '')}" class="h-full w-full object-cover" loading="lazy" onerror="this.src='assets/images/placeholder.svg'" />
                ${Number(p.discount) > 0 ? `<span class="absolute right-2 top-2 rounded-full bg-[#9BC7FF] px-2 py-0.5 text-[9px] font-extrabold text-[#081F5C]">-${Number(p.discount)}%</span>` : ''}
              </div>
              <div class="text-[9px] font-bold uppercase text-[#334EAC]">${esc(p.category || 'Collectibles')}</div>
              <h3 class="mt-0.5 line-clamp-2 font-display text-xs font-bold text-[#0F172A]">${esc(p.name || 'Anime product')}</h3>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
              <span class="font-display text-sm font-extrabold text-[#081F5C]">${money(Number(p.salePrice || p.price || 0))}</span>
              <a href="#/product/${encodeURIComponent(p.slug || p.id)}" class="btn btn-outline !px-2.5 !py-1 !text-[11px] font-bold">View</a>
            </div>
          </div>`).join('')}</div>` : `<p class="py-8 text-center text-xs font-semibold text-slate-400">This store has no published products yet.</p>`}
      </div>`;
  }

  window.ANILyfeUI={ImageSlot,RotatingImage,hideRotatingImage,IMG,mascot,AnimeLoader,Skeleton,EmptyState,ErrorState,Badge,Button,Card,LightboxAttrs,openLightbox,closeLightbox,storefrontCard};
})();
