/* ANIlyfe — extracted from the original single-file prototype (index.html) */

/* Sign in / create account view + modal. */

let authMode = 'create'; // create | login
let sellerTermsAccepted = false;

function viewSellerPolicyGate(){
  const policy=[
    {n:'1',title:'Eligibility',lead:'To qualify, you must:',items:[
      'Have at least 20 eligible products listed on ANILyfe.',
      'Complete the required seller verification.',
      'Complete your shop profile.',
      "Comply with ANILyfe's seller policies and marketplace rules.",
      'Receive approval from the ANILyfe administration team.'
    ],note:'Meeting these requirements does not guarantee acceptance.'},
    {n:'2',title:'Founding Seller Benefits',lead:'Approved founding sellers receive:',items:[
      'A unique Founding Seller number.',
      'An exclusive Founding Seller badge.',
      'Access to the Founders Hub.',
      "A reduced commission rate of 10% for one year, starting from ANILyfe's official launch date.",
      'Eligibility for selected future promotions, announcements, events, and early-access opportunities.'
    ],note:'These benefits do not guarantee sales, visibility, or promotional placement.'},
    {n:'3',title:'Commission',paragraphs:[
      'Standard sellers pay a 15% commission on applicable sales. Approved founding sellers pay a reduced 10% commission for the specified one-year period.',
      "The reduced rate begins on ANILyfe's official launch date, not the date you apply, register, or receive approval.",
      'Other applicable fees, payment charges, refunds, and adjustments may affect the final amount payable.'
    ]},
    {n:'4',title:'Seller Responsibilities',lead:'As a founding seller, you agree to:',items:[
      'Provide accurate account, shop, and verification information.',
      'List products accurately and ensure you have the right to sell them.',
      'Honour orders and follow applicable delivery, cancellation, and refund policies.',
      'Treat buyers fairly and communicate professionally.',
      "Follow ANILyfe's marketplace rules and applicable laws."
    ]},
    {n:'5',title:'Payments and Withdrawals',paragraphs:[
      "Seller earnings are subject to ANILyfe's payment procedures, applicable commissions, fees, refunds, and adjustments.",
      'A 48-hour holding period applies before eligible seller earnings can be withdrawn, subject to order status and applicable marketplace conditions. Earnings may be withheld where a dispute, refund, suspected fraud, or other legitimate issue requires investigation.'
    ]},
    {n:'6',title:'Programme Limit',paragraphs:[
      'The Founding Seller Programme is limited to the first 50 sellers approved by ANILyfe. Applying or meeting the eligibility requirements does not automatically secure a place.'
    ]},
    {n:'7',title:'Verification and Programme Status',paragraphs:[
      'Founding Seller status is separate from Business Verification. A seller may qualify for both, but receiving a Founding Seller badge does not mean the seller is a registered business or that every listed product has been independently authenticated.',
      'ANILyfe may suspend or withdraw programme benefits where a seller provides false information, engages in fraudulent activity, or seriously violates marketplace rules. Where appropriate, the seller will be informed of the reason.'
    ]},
    {n:'8',title:'Acceptance',paragraphs:[
      'By clicking “Agree & Continue,” you confirm that you have read, understood, and agreed to this Founding Seller Programme Policy and the applicable ANILyfe seller policies.'
    ]}
  ];
  return `<main class="min-h-screen bg-[#F6FCFF] px-5 py-10"><section class="card mx-auto max-w-3xl p-6 sm:p-9">
    <a class="text-sm font-bold text-[#334EAC] hover:underline" href="#/profile">← Back</a>
    <p class="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#708BD1]">Founding Seller Programme</p>
    <h1 class="mt-2 font-display text-3xl font-extrabold text-[#081F5C]">Founding Seller Programme Policy</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">Welcome to the ANILyfe Founding Seller Programme! The programme recognises the first 50 approved sellers who join ANILyfe and contribute to building our anime marketplace. Please read the following terms before continuing.</p>
    <div class="mt-6 space-y-4">
      ${policy.map(section=>`<article class="rounded-2xl border border-[#D0E3FF] bg-white p-5">
        <h2 class="font-display text-base font-extrabold text-[#081F5C]"><span class="text-[#708BD1]">${section.n}.</span> ${section.title}</h2>
        ${section.lead?`<p class="mt-2 text-sm font-semibold text-slate-600">${section.lead}</p>`:''}
        ${section.items?`<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">${section.items.map(item=>`<li class="flex gap-2"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#334EAC]"></span><span>${item}</span></li>`).join('')}</ul>`:''}
        ${section.paragraphs?section.paragraphs.map(paragraph=>`<p class="mt-2 text-sm leading-6 text-slate-600">${paragraph}</p>`).join(''):''}
        ${section.note?`<p class="mt-2 text-xs font-bold text-[#92400E]">${section.note}</p>`:''}
      </article>`).join('')}
    </div>
    <p class="mt-6 text-xs font-semibold text-slate-500">Thank you for helping build ANILyfe.</p>
    <label class="mt-4 flex items-start gap-3 rounded-xl bg-[#E7F1FF] p-4 text-sm font-semibold text-[#081F5C]"><input id="seller-policy-accept" class="mt-1" type="checkbox"><span>I have read, understood, and agree to the Founding Seller Programme Policy and the applicable ANILyfe seller policies.</span></label>
    <button class="btn btn-primary mt-5 w-full sm:w-auto" data-action="seller-policy-continue" disabled>Agree &amp; Continue</button>
    <p class="mt-3 text-xs text-slate-500">You can also read the <a class="font-bold text-[#334EAC] hover:underline" href="#/seller-policy">Seller Policy</a> and the <a class="font-bold text-[#334EAC] hover:underline" href="#/kyc">Verification Guide</a>.</p>
  </section></main>`;
}
window.viewSellerPolicyGate=viewSellerPolicyGate;
function viewAuth(){
  const creating = authMode==='create';
  const marketplaceSettings = window.getMarketplaceSettings ? window.getMarketplaceSettings() : LS.get('marketplaceSettings', {});
  const sellerSignupOpen = marketplaceSettings.sellerRegistrationEnabled !== false;
  return `
  <div class="min-h-screen auth-ambient relative overflow-hidden">
    ${sparks(16,2)}
    <header class="relative z-10 max-w-7xl mx-auto px-5 py-5 flex items-center justify-between gap-3">
      ${LOGO('text-2xl')}
      <div class="flex items-center gap-3">
        ${regionSelect('!w-44')}
        <span class="hidden sm:inline-flex glass rounded-full px-4 py-2 text-[10px] font-extrabold tracking-[.2em] text-[#334EAC]">MARKETPLACE GATEWAY</span>
      </div>
    </header>

    <main class="relative z-10 max-w-7xl mx-auto px-5 pt-10 md:pt-20 pb-24">
      <img src="assets/images/auth.png" width="400" height="480" alt="" class="pointer-events-none absolute right-5 top-10 hidden aspect-[5/6] w-[340px] rounded-3xl border border-white/60 object-cover shadow-lift lg:block xl:w-[400px]" loading="lazy" onerror="this.remove()">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-bold text-[#334EAC] mb-6 reveal"><i data-lucide="sparkle" style="width:14px;height:14px"></i> An anime marketplace, made personal</div>
        <h1 class="font-display font-extrabold text-[#081F5C] text-5xl md:text-6xl leading-[1.05] reveal">Choose your <span class="text-[#334EAC]">ANIlyfe</span> path.</h1>
        <p class="mt-5 text-[#3D4D80] text-base md:text-lg leading-relaxed reveal">
          ${creating ? 'Start with the account that fits your role. Seller access is activated only after administrator approval.' : 'Welcome back. Sign in to your buyer account or seller identity to continue.'}
        </p>
        <div class="mt-7 flex items-center gap-3 reveal">
          <button class="btn ${creating?'btn-primary':'btn-ghost'} !py-2.5" data-action="auth-mode" data-mode="create">Create account <i data-lucide="arrow-right" style="width:15px;height:15px"></i></button>
          <button class="btn ${!creating?'btn-primary':'btn-ghost'} !py-2.5" data-action="auth-mode" data-mode="login">Log in</button>
        </div>
        <div class="mt-5 flex items-center gap-2 text-xs text-[#5A6A9C] font-semibold reveal"><i data-lucide="shield-check" style="width:15px;height:15px;color:#334EAC"></i> Seller shops go live after a quick review by our team.</div>
      </div>

      <div class="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl">
        <!-- 01 Buyer -->
        <div class="glass rounded-2xl p-7 flex flex-col reveal group hover:-translate-y-1.5 transition duration-300">
          <div class="flex items-start justify-between">
            <span class="w-11 h-11 rounded-xl bg-[#E7F1FF] border border-[#D0E3FF] flex items-center justify-center group-hover:bg-[#334EAC] transition"><i data-lucide="user-round" style="width:20px;height:20px;color:#334EAC" class="group-hover:!text-white"></i></span>
            <span class="font-tech text-xs font-bold text-[#708BD1]">01</span>
          </div>
          <h3 class="font-display font-bold text-2xl text-[#081F5C] mt-5">Buyer</h3>
          <p class="text-sm text-[#4A5A8C] mt-2 leading-relaxed flex-1">Discover approved products, save favourites, prepare a cart, and contact sellers.</p>
          <button class="btn btn-primary w-full mt-6" data-action="auth-open" data-mode="${authMode}" data-role="buyer">${creating?'Create buyer account':'Buyer log in'}</button>
          <button class="mt-3 text-xs font-bold text-[#334EAC] hover:underline" data-action="auth-switch" data-mode="${creating?'login':'create'}" data-role="buyer">${creating?'Already buying? Buyer log in':'New here? Create buyer account'}</button>
        </div>
        <!-- 02 Seller -->
        <div class="glass rounded-2xl p-7 flex flex-col reveal group hover:-translate-y-1.5 transition duration-300">
          <div class="flex items-start justify-between">
            <span class="w-11 h-11 rounded-xl bg-[#E7F1FF] border border-[#D0E3FF] flex items-center justify-center group-hover:bg-[#334EAC] transition"><i data-lucide="store" style="width:20px;height:20px;color:#334EAC" class="group-hover:!text-white"></i></span>
            <span class="font-tech text-xs font-bold text-[#708BD1]">02</span>
          </div>
          <h3 class="font-display font-bold text-2xl text-[#081F5C] mt-5">Seller</h3>
          <p class="text-sm text-[#4A5A8C] mt-2 leading-relaxed flex-1">Create an identity, apply for a shop, then add listings, prices and stock after approval.</p>
          ${sellerSignupOpen || !creating ? `<button class="btn btn-primary w-full mt-6" data-action="auth-open" data-mode="${authMode}" data-role="seller">${creating?'Create seller identity':'Seller log in'}</button>` : `<div class="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 text-center">Seller registration is currently closed by ANIlyfe administration.</div>`}
          <button class="mt-3 text-xs font-bold text-[#334EAC] hover:underline" data-action="auth-switch" data-mode="${creating?'login':'create'}" data-role="seller">${creating?'Already selling? Seller log in':'New here? Create seller identity'}</button>
        </div>
      </div>

      <p class="mt-10 text-xs text-[#5A6A9C] font-semibold">Buying in <b>${region().name}</b> — prices display in <b>${region().symbol.trim()}</b>. Change region any time from the top bar.</p>
    </main>
  </div>`;
}

/* ---------- auth modal ---------- */
function openAuthModal(mode, role){
  const creating = mode==='create';
  const existingUser=window.currentUser?.();
  if(existingUser){
    if(creating&&role==='seller'&&existingUser.role==='BUYER'){
      const existingSeller=window.sellerOf?.(existingUser.id);
      if(existingSeller){location.hash=String(existingSeller.status).toLowerCase()==='approved'?'#/seller-center':'#/seller/application';return;}
      location.hash='#/seller-application/policy';return;
    }
    const requestedRole=role==='seller'?'SELLER':'BUYER';
    if(!creating&&existingUser.role!==requestedRole){
      const api=window.ANILyfeAPI;
      if(!api?.logout){toast('Please log out before switching accounts.','log-out');return;}
      api.logout().then(()=>openAuthModal(mode,role)).catch(error=>toast(error.message||'Could not safely switch accounts. Please log out and try again.','alert-triangle'));
      return;
    }
    const destination=existingUser.role==='SELLER'?'#/seller-center':(['ADMIN','SUPER_ADMIN'].includes(existingUser.role)?'#/admin-dashboard':'#/marketplace');
    if(creating)toast('You are already signed in. Log out before creating another account, or use Become a Seller to upgrade this account.','user-check');
    else location.hash=destination;
    return;
  }
  const root = document.getElementById('modal-root');
  root.innerHTML = `
  <div class="modal-back" data-action="close-modal-bg">
    <div class="modal-card form-modal-card glass rounded-3xl w-full max-w-md p-5 sm:p-8 relative" onclick="event.stopPropagation()">
      <button class="!absolute top-4 right-4 icon-btn !w-9 !h-9" data-action="close-modal"><i data-lucide="x" style="width:17px;height:17px"></i></button>
      <div class="flex items-center gap-3 mb-1">
        <span class="w-10 h-10 rounded-xl bg-[#334EAC] flex items-center justify-center"><i data-lucide="${role==='seller'?'store':'user-round'}" style="width:18px;height:18px;color:#fff"></i></span>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1]">${creating?'CREATE ACCOUNT':'LOG IN'} · ${region().flag}</div>
          <h3 class="font-display font-bold text-xl text-[#081F5C]">${role==='seller'?'Seller identity':'Buyer account'}</h3>
        </div>
      </div>
      <p class="text-xs text-[#5A6A9C] mb-5">${creating ? (role==='seller'?'Your shop goes to Pending Approval after signup.':'Start browsing and saving favourites instantly.') : 'Enter your credentials to continue.'}</p>
      <form id="authForm" data-role="${role==='seller'?'SELLER':'BUYER'}" class="space-y-3 sm:space-y-4">
        ${creating?`<div><label class="lbl">Full name</label><input class="inp" name="name" required placeholder="e.g. Ada Okafor"/></div>`:''}
        ${creating?`<div><label class="lbl">Phone</label><input class="inp" name="phone" required placeholder="080..." inputmode="tel"/></div><div class="grid grid-cols-2 gap-3"><div><label class="lbl">State</label><select class="inp" name="state" required><option value="">Select state</option>${NIGERIAN_STATES_SHARED.map(st=>`<option>${esc(st)}</option>`).join('')}</select></div><div><label class="lbl">City</label><input class="inp" name="city" required placeholder="City"/></div></div><div><label class="lbl">LGA</label><input class="inp" name="lga" required placeholder="Local Government Area"/></div>`:''}
        <div><label class="lbl">Email</label><input class="inp" type="email" name="email" required placeholder="you@anilyfe.com"/></div>
        <div><label class="lbl">Password</label><div class="relative"><input class="inp pr-12" type="password" name="password" required minlength="${creating?'8':'1'}" placeholder="${creating?'Minimum 8 characters':'Enter your password'}"/><button type="button" data-password-toggle class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#334EAC]" aria-label="Show password"><i data-lucide="eye" style="width:17px;height:17px"></i></button></div>${!creating?'<a class="mt-2 inline-block text-xs font-bold text-[#334EAC] hover:underline" href="#/forgot-password">Forgot password?</a>':''}</div>
        ${creating&&role==='seller'?`
          <div><label class="lbl">Business name</label><input class="inp" name="business" required placeholder="e.g. Chibi Corner"/></div>
          <div><label class="lbl">What you sell</label><input class="inp" name="sells" required placeholder="Figures, hoodies…"/></div>
          <input type="hidden" name="hasAcceptedTerms" value="${sellerTermsAccepted?'true':'false'}"><input type="hidden" name="foundingPoliciesAccepted" value="${sellerTermsAccepted?'true':'false'}">`:''}
        <button class="btn btn-primary w-full !py-3" type="submit">${creating?'Create '+(role==='seller'?'seller identity':'buyer account'):'Log in'} <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>
      </form>
    </div>
  </div>`;
  lucide.createIcons();
  document.getElementById('authForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const email = (f.get('email')||'').trim().toLowerCase();
    const pass = f.get('password')||'';
    const users = LS.get('users',[]);
    if(creating){
      if(role==='seller' && (window.getMarketplaceSettings ? window.getMarketplaceSettings() : LS.get('marketplaceSettings', {})).sellerRegistrationEnabled === false){ toast('Seller registration is currently closed by ANIlyfe administration.','store'); return; }
      if(users.find(u=>u.email===email)){ toast('An account with this email already exists.','alert-triangle'); return; }
      const u = {id:uid('USR'), name:(f.get('name')||'').trim(), email, password:pass, role, region:region().code, createdAt:Date.now()};
      users.push(u); LS.set('users',users); LS.set('session',u.id);
      if(role==='seller'){
        const sellers = LS.get('sellers',[]);
        sellers.push({id:uid('SLR'), userId:u.id, businessName:(f.get('business')||'').trim(), sells:(f.get('sells')||'').trim(), status:'pending', rating:0, sales:0, createdAt:Date.now()});
        LS.set('sellers',sellers);
      }
      closeModal();
      toast(`Account created. Welcome to ANIlyfe, ${esc(u.name.split(' ')[0])}.`,'user-check');
      location.hash = role==='seller' ? '#/seller' : '#/marketplace';
    } else {
      const u = users.find(x=>x.email===email && x.password===pass);
      if(!u){ toast('Invalid email or password.','lock-keyhole'); return; }
      if(role==='seller' && !sellerOf(u.id)){ toast('No seller identity found for this account. Sign up as a seller or apply from your profile.','store'); return; }
      LS.set('session',u.id);
      closeModal();
      toast(`Welcome back, ${esc(u.name.split(' ')[0])}.`,'user-check');
      location.hash = (role==='seller') ? '#/seller' : '#/marketplace';
    }
  });
}

function viewForgotPassword(){return `<main class="min-h-screen auth-ambient flex items-center justify-center p-5"><form id="forgotPasswordForm" class="glass w-full max-w-md rounded-3xl p-7"><h1 class="font-display text-2xl font-extrabold text-[#081F5C]">Reset your password</h1><p class="mt-2 mb-5 text-sm text-[#4A5A8C]">Enter your account email and we’ll send a reset link if it exists.</p><label class="lbl">Email</label><input class="inp mb-4" type="email" name="email" required autocomplete="email"><button class="btn btn-primary w-full" type="submit">Send reset link</button><a class="mt-4 inline-block text-sm font-bold text-[#334EAC]" href="#/auth">Back to sign in</a></form></main>`;}
function viewResetPassword(){return `<main class="min-h-screen auth-ambient flex items-center justify-center p-5"><form id="resetPasswordForm" class="glass w-full max-w-md rounded-3xl p-7"><h1 class="font-display text-2xl font-extrabold text-[#081F5C]">Choose a new password</h1><p class="mt-2 mb-5 text-sm text-[#4A5A8C]">Use at least 8 characters.</p><label class="lbl">New password</label><div class="relative"><input class="inp pr-12 mb-4" type="password" name="password" required minlength="8" autocomplete="new-password"><button type="button" data-password-toggle class="absolute right-3 top-1/3 -translate-y-1/2 text-xs font-bold text-[#334EAC]" aria-label="Show password"><i data-lucide="eye" style="width:17px;height:17px"></i></button></div><button class="btn btn-primary w-full" type="submit">Update password</button></form></main>`;}

document.addEventListener('click',function(e){if(e.target.closest('a[href="#/forgot-password"]')){window.closeModal?.();return;}const button=e.target.closest('[data-password-toggle]');if(!button)return;const input=button.parentElement.querySelector('input');if(!input)return;const visible=input.type==='password';input.type=visible?'text':'password';button.setAttribute('aria-label',visible?'Hide password':'Show password');button.innerHTML=`<i data-lucide="${visible?'eye-off':'eye'}" style="width:17px;height:17px"></i>`;window.lucide?.createIcons?.();},true);

function openSellerAppModal(){
  const marketplaceSettings = window.getMarketplaceSettings ? window.getMarketplaceSettings() : LS.get('marketplaceSettings', {});
  if(marketplaceSettings.sellerRegistrationEnabled === false){
    toast('Seller registration is currently closed by ANIlyfe administration.','store');
    return;
  }
  const user = window.currentUser ? window.currentUser() : null;
  if(!user){ toast('Sign in or create an account before applying to become a seller.','user-check'); location.hash='#/auth'; return; }
  const root = document.getElementById('modal-root');
  if(!root) return;
  root.innerHTML = `
  <div class="modal-back" data-action="close-modal-bg">
    <div class="modal-card form-modal-card glass rounded-3xl w-full max-w-lg p-5 sm:p-8 relative" onclick="event.stopPropagation()">
      <button class="!absolute top-4 right-4 icon-btn !w-9 !h-9" data-action="close-modal"><i data-lucide="x" style="width:17px;height:17px"></i></button>
      <div class="flex items-center gap-3 mb-2">
        <span class="w-10 h-10 rounded-xl bg-[#334EAC] flex items-center justify-center"><i data-lucide="store" style="width:18px;height:18px;color:#fff"></i></span>
        <div>
          <div class="font-tech text-[10px] font-bold tracking-[.2em] text-[#708BD1]">SELLER ONBOARDING · ${region().flag}</div>
          <h3 class="font-display font-bold text-xl text-[#081F5C]">Become an ANILyfe Seller</h3>
        </div>
      </div>
      <p class="text-xs text-[#5A6A9C] mb-5">Tell us about your store. Your application stays on this account (${esc(user?.email||'')}) — no new login is created — and an administrator reviews it before approval. Identity and payout details are added later in Seller Center.</p>
      <form id="sellerAppForm" class="space-y-3 sm:space-y-4">
        <div>
          <label class="lbl">Store or business name</label>
          <input class="inp" name="businessName" required placeholder="e.g. Akihabara Collectibles"/>
        </div>
        <div>
          <label class="lbl">Primary category</label>
          <select class="inp" name="category" required>
            <option value="">Select category</option>
            ${(window.ANILyfeCategories||[]).map(c=>`<option value="${esc(c.title)}">${esc(c.title)}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label class="lbl">State</label>
            <select class="inp text-xs" name="state" required>
              <option value="">Select</option>
              ${NIGERIAN_STATES_SHARED.map(st=>`<option ${user?.state===st?'selected':''}>${esc(st)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="lbl">City</label>
            <input class="inp text-xs" name="city" required placeholder="City" value="${esc(user?.city||'')}"/>
          </div>
          <div>
            <label class="lbl">LGA</label>
            <input class="inp text-xs" name="lga" required placeholder="LGA" value="${esc(user?.lga||'')}"/>
          </div>
        </div>
        <div>
          <label class="lbl">Store description <span class="font-normal text-slate-400">(optional)</span></label>
          <textarea class="inp h-20 text-xs" name="bio" placeholder="Describe the items you sell and your shipping terms..."></textarea>
        </div>
        <input type="hidden" name="hasAcceptedTerms" value="${sellerTermsAccepted?'true':'false'}"/>
        <input type="hidden" name="foundingPoliciesAccepted" value="${sellerTermsAccepted?'true':'false'}"/>
        <button class="btn btn-primary w-full !py-3" type="submit">Agree &amp; Continue <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>
      </form>
    </div>
  </div>`;
  lucide.createIcons();
}
window.viewSellerApplicationStatus=function(){
  const user=window.currentUser?.();
  const seller=window.ANILyfeAPI?.state?.seller;
  if(!user){location.hash='#/auth';return '';}
  if(!seller){location.hash='#/seller-application/policy';return '';}
  if(String(seller.status).toUpperCase()==='APPROVED'){location.hash='#/seller-center';return '';}
  const rejected=String(seller.status).toUpperCase()==='REJECTED';
  return `<main class="min-h-screen bg-[#F6FCFF] flex items-center justify-center px-5 py-12"><section class="card max-w-xl p-8 text-center">
    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F1FF] text-[#334EAC]"><i data-lucide="${rejected?'circle-alert':'clock-3'}" style="width:26px;height:26px"></i></div>
    <h1 class="mt-5 font-display text-2xl font-extrabold text-[#081F5C]">${rejected?'Application Not Approved':'Application Under Review'}</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">${rejected?esc(seller.rejectionReason||'Please contact marketplace support for next steps.'):'Your application is attached to this account — no new login was created. An administrator reviews your store and verification details before approval.'}</p>
    ${rejected?'':`<ul class="mx-auto mt-5 max-w-md space-y-2 text-left text-xs text-slate-600"><li class="flex items-start gap-2"><span class="badge">1</span><span>Admin review of your business and KYC details.</span></li><li class="flex items-start gap-2"><span class="badge">2</span><span>You receive a notification when a decision is made.</span></li><li class="flex items-start gap-2"><span class="badge">3</span><span>Once approved, Seller Center and product submission unlock.</span></li></ul>`}
    <a href="#/marketplace" class="btn btn-primary mt-6">Return to marketplace</a>
  </section></main>`;
};
function closeModal(){ const root=document.getElementById('modal-root');if(!root)return;root.querySelectorAll('form').forEach(form=>form.reset());root.innerHTML=''; }
window.openSellerAppModal = openSellerAppModal;
