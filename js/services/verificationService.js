/** ANILyfe Seller Verification Service — seller-scoped records only. */
(function(){
  function seller(){const u=window.currentUser?window.currentUser():null; return u&&window.sellerOf?window.sellerOf(u.id):null;}
  function key(){const s=seller(); return s?`anilyfe_seller_verification_${s.id}`:null;}
  function blank(){return {status:'Not Started',tier:'',badgeActive:false,legalBusinessName:'',registrationType:'',taxIdentificationNumber:'',directorName:'',nationalIdType:'',nationalIdNumber:'',registeredAddress:'',submittedDocuments:[],rejectionReason:null,reviewedByAdminAt:null,submissionHistory:[]};}
  function get(){const k=key(); if(!k) return blank(); try{const x=JSON.parse(localStorage.getItem(k)); if(x)return x;}catch(e){} const d=blank(); localStorage.setItem(k,JSON.stringify(d)); return d;}
  const svc={
    async getStatus(){await new Promise(r=>setTimeout(r,20)); return get();},
    async submitVerification(data){const s=seller(); if(!s) throw new Error('Seller identity not found.'); const old=get(); const next={...old,...data,status:'Under Review',rejectionReason:null,submissionHistory:[...(old.submissionHistory||[]),{status:'Under Review',timestamp:new Date().toISOString(),note:'Seller verification submitted for administrative review.'}]}; localStorage.setItem(key(),JSON.stringify(next)); const sellers=LS.get('sellers',[]); const i=sellers.findIndex(x=>x.id===s.id); if(i>=0){sellers[i]={...sellers[i],verificationStatus:'Under Review'}; LS.set('sellers',sellers);} window.dispatchEvent(new CustomEvent('anilyfe:verification-updated',{detail:next})); return next;},
    async resubmit(data){return this.submitVerification(data);}
  }; window.verificationService=svc;
})();
