/* API-backed Seller Center settings. No marketplace/account persistence in localStorage. */
(function(){
  const defaults={account:{name:'',email:'',phone:'',avatar:''},notifications:{orders:true,payments:true,shipping:true,returns:true,refunds:true,reviews:true,questions:true,productApproval:true,productRejection:true,verification:true,security:true,announcements:false},payoutSchedule:'',security:{twoFactorEnabled:false,twoFactorMethod:'',activeSessions:[]},privacy:{storeVisibility:'Public',searchIndexing:true},storeStatus:'Live'};
  async function getSeller(){return window.sellerService?.getProfile?.()||{};}
  const settingsService={
    async getSettings(){const seller=await getSeller();const s=await window.deliveryService.getSettings();const u=window.currentUser?.();return {...defaults,account:{name:u?.name||'',email:u?.email||'',phone:u?.phone||seller?.phone||'',avatar:u?.profileImageUrl||seller?.profileImageUrl||''},notifications:{...defaults.notifications,...(s.notifications||{})},payoutSchedule:s.payoutSchedule||'',security:{...defaults.security,...(s.security||{})},storeStatus:s.storeStatus||seller?.storeStatus||'Live'};},
    async updateAccount(account){const u=window.currentUser?.();const name=String(account.name||'').trim().split(/\s+/);const data={firstName:name.shift()||'',lastName:name.join(' ')||'',phone:String(account.phone||'').trim()};const updated=await window.ANILyfeAPI.request('/api/auth/me',{method:'PATCH',body:JSON.stringify(data)});if(window.ANILyfeAPI?.state?.user){window.ANILyfeAPI.state.user={...window.ANILyfeAPI.state.user,...updated,name:`${updated.firstName||''} ${updated.lastName||''}`.trim()};}if(account.avatar&&window.sellerService?.updateStore){await window.sellerService.updateStore({profileImageUrl:account.avatar});} return {name:`${updated.firstName||''} ${updated.lastName||''}`.trim(),email:updated.email,phone:updated.phone,avatar:account.avatar||u?.profileImageUrl||''};},
    async updateNotifications(toggles){const current=await window.deliveryService.getSettings();await window.deliveryService.updateSettings({notifications:{...(current.notifications||{}),...toggles}});return toggles;},
    async toggle2FA(){throw new Error('Two-factor authentication is not enabled in ANILyfe V1 yet.');},
    async logoutAllOtherSessions(){throw new Error('Session management is not enabled in ANILyfe V1 yet.');},
    async setStoreStatus(status){return window.sellerService.setStoreStatus(status);}
  };
  window.settingsService=settingsService;
})();
