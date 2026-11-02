/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Toast notifications shown across every page (bottom-right stack, #toasts). */

function toast(msg, icon){
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="mt-.5 shrink-0 text-[#7FB0FF]"><i data-lucide="${icon||'sparkles'}" style="width:17px;height:17px"></i></span><span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  lucide.createIcons();
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),320); }, 3200);
}

/* Notifications page (pages/notifications.html). The prototype only ever
   shows toasts for immediate feedback; this renders a static placeholder
   history until notifications are actually persisted. */
function viewNotifications(){
  return comingSoonView('Notifications', 'bell', 'A full notification history — order updates, price drops, seller replies — will land here.');
}
