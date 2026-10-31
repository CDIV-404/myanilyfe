/* ANILyfe — route access rules.
 * Pure by design: no DOM, no globals, no fetches. This is the single place that decides whether a
 * hash may render, and it is unit-testable in Node (see test/route-access.test.js).
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.ANILyfeRouteAccess=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ADMIN_ROLES=['ADMIN','SUPER_ADMIN'];
  const ADMIN_PUBLIC=['#/admin-login','#/admin-signup'];
  /* Mirrors the router's own precedence: a known section name is the Seller Center, anything else
     under #/seller/ is a public storefront slug, #/seller/signup and #/seller/application are public. */
  const SELLER_SECTIONS=['dashboard','orders','products','inventory','reviews','earnings','payouts','analytics','delivery','store','founders','verification','settings','messages'];
  const ACCOUNT_ROUTES=['#/profile','#/orders','#/cart','#/checkout','#/wishlist','#/notifications'];

  function sellerWorkspaceSection(hash){
    if(hash==='#/seller-center'||hash.startsWith('#/seller-center/'))return 'dashboard';
    if(!hash.startsWith('#/seller/'))return '';
    /* Compared raw, exactly like the router's own startsWith tests — and a malformed percent-escape in
       a hand-typed URL must not throw its way through the guard. */
    const head=hash.slice('#/seller/'.length).split('/')[0];
    return SELLER_SECTIONS.includes(head)?head:'';
  }

  const PROTECTED_ROUTES=[
    {name:'admin',test:h=>(h.startsWith('#/admin')&&!ADMIN_PUBLIC.includes(h))||h==='#/control-room'||h.startsWith('#/control-room/'),roles:ADMIN_ROLES,guest:'#/admin-login'},
    {name:'seller',test:h=>Boolean(sellerWorkspaceSection(h)),roles:['SELLER'],guest:'#/auth'},
    {name:'account',test:h=>ACCOUNT_ROUTES.some(p=>h===p||h.startsWith(p+'/')||h.startsWith(p+'?')),roles:null,guest:'#/auth'}
  ];

  /* Order matters. Public routes render at once, then loading is answered before user/role — so a guard
     can never observe a session that is still being resolved and bounce a signed-in user to sign-in,
     and an anonymous visitor never waits on /api/auth/me to see the storefront. */
  function resolveRouteAccess(hash,session){
    const current=String(hash||'#/');
    const rule=PROTECTED_ROUTES.find(entry=>entry.test(current));
    if(!rule)return {kind:'public',route:current};
    if(session&&session.loading)return {kind:'loading',route:current,rule:rule.name};
    const user=session&&session.user;
    if(!user||!user.role)return {kind:'redirect',to:rule.guest,route:current,rule:rule.name};
    if(rule.roles&&!rule.roles.includes(user.role))return {kind:'forbidden',route:current,rule:rule.name};
    return {kind:'allow',route:current,rule:rule.name};
  }

  function dashboardFor(user){
    if(ADMIN_ROLES.includes(user&&user.role))return '#/admin-dashboard';
    if(user&&user.role==='SELLER')return '#/seller-center';
    if(user)return '#/marketplace';
    return '#/auth';
  }

  return {sellerWorkspaceSection,resolveRouteAccess,dashboardFor,PROTECTED_ROUTES,SELLER_SECTIONS,ACCOUNT_ROUTES};
});
