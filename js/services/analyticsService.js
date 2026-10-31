/** ANILyfe Analytics Service — derives metrics from actual stored seller records. */
(function(){
 const svc={async getOverview(dateRange='30d'){
  await new Promise(r=>setTimeout(r,20));
  const u=window.currentUser?window.currentUser():null, seller=u&&window.sellerOf?window.sellerOf(u.id):null;
  const products=LS.get('products',[]).filter(p=>!seller||p.sellerId===seller.id);
  const orders=LS.get('orders',[]).filter(o=>!seller||o.sellerId===seller.id);
  const completed=orders.filter(o=>['Delivered','Completed'].includes(o.orderStatus||o.status));
  const revenue=completed.reduce((n,o)=>n+Number(o.sellerEarnings||o.total||0),0);
  const labels=['1','2','3','4','5','6','7'];
  return {dateRange,series:{labels,revenue:Array(7).fill(0),orders:Array(7).fill(0),productsSold:Array(7).fill(0)},kpis:{todaySales:0,totalRevenue:revenue,totalOrders:orders.length,productsSold:completed.reduce((n,o)=>n+(o.items||[]).reduce((a,i)=>a+Number(i.quantity||0),0),0),storeViews:0,productViews:0,pendingOrders:orders.filter(o=>!['Delivered','Completed','Cancelled','Refunded'].includes(o.orderStatus||o.status)).length,pendingReturns:orders.filter(o=>String(o.orderStatus||'').toLowerCase().includes('return')).length,sellerRating:Number(seller?.rating||0),availableBalance:0,pendingBalance:0},ordersBreakdown:{total:orders.length,completed:completed.length,cancelled:orders.filter(o=>['Cancelled','Canceled'].includes(o.orderStatus||o.status)).length,returned:orders.filter(o=>String(o.orderStatus||'').toLowerCase().includes('return')).length,completionRate:orders.length?`${((completed.length/orders.length)*100).toFixed(1)}%`:'0%'},productPerformance:{bestSellers:[],lowPerforming:[]},locationTrends:{inStatePercentage:0,outsideStatePercentage:0,topStates:[],topCities:[]}};
 }}; window.analyticsService=svc;
})();
