(function(){
  const KEY='adminNotifications';
  const all=()=>Array.isArray(LS.get(KEY,[]))?LS.get(KEY,[]):[];
  window.adminNotificationService={
    getAll:()=>all(), unread:()=>all().filter(n=>!n.read).length,
    add(data){const rows=all();const n={id:uid('AN'),createdAt:new Date().toISOString(),read:false,...data};rows.unshift(n);LS.set(KEY,rows);return n;},
    markRead(id){const rows=all();const i=rows.findIndex(n=>n.id===id);if(i>=0){rows[i].read=true;LS.set(KEY,rows);}},
    markAllRead(){LS.set(KEY,all().map(n=>({...n,read:true})));},
    emailLink(n){const s=LS.get('marketplaceSettings',{});const to=s.adminEmail||s.supportEmail||'';return to?'mailto:'+to+'?subject='+encodeURIComponent(n.title||'ANILyfe notification')+'&body='+encodeURIComponent(n.message||''):'#';}
  };
})();
