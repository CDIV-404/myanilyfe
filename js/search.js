/* ANILyfe — extracted from the original single-file prototype (index.html) */

/* Marketplace search box + category filter state, shared by marketplace.js
   and the global click/keydown listeners in navigation.js. */

let mqState = {cat:'All', q:''};

function categoryForSearchId(id){
  const category=window.ANILyfeCategoryForId?.(id);
  return category ? category.title : null;
}

function searchHash(){
  const params=new URLSearchParams();
  if(mqState.q)params.set('q',mqState.q);
  if(mqState.cat&&mqState.cat!=='All'){
    const category=(window.ANILyfeCategories||[]).find(item=>item.title===mqState.cat);
    if(category)params.set('category',category.id);
  }
  return '#/search'+(params.size?`?${params}`:'');
}

/* Fired from the search button (data-action="mq-search") */
function searchRun(){
  const vis = [...document.querySelectorAll('[data-mqi]')].find(el=>el.offsetParent!==null);
  const q = (vis && vis.value) || [...document.querySelectorAll('[data-mqi]')].map(e=>e.value).find(v=>v) || '';
  const c = document.getElementById('mqCat');
  mqState.q = q;
  if(c) mqState.cat = c.value;
  location.hash=searchHash();
}

/* Fired from a category chip (data-action="mq-cat" data-cat="...") */
function searchSetCategory(cat){
  mqState.cat = cat==='All'?'All':catKey(cat);
  location.hash=searchHash();
}

/* Fired on Enter inside a search input (data-mqi) */
function searchRunFromKeydown(value){
  const c = document.getElementById('mqCat');
  mqState.q = value;
  if(c) mqState.cat = c.value;
  location.hash=searchHash();
}

/* Fired when the category <select id="mqCat"> changes */
function searchSetCategoryFromSelect(value){
  mqState.cat = value;
  location.hash=searchHash();
}

/* Dedicated search-results page (pages/search.html). Reuses mqState so a
   search started from any page lands on filtered marketplace results. */
function viewSearchResults(){
  const query=location.hash.split('?')[1]||'';
  const params=new URLSearchParams(query);
  const categoryId=params.get('category');
  const category=categoryId?categoryForSearchId(categoryId):null;
  if(category)mqState.cat=category;
  else if(categoryId)mqState.cat='All';
  mqState.q=params.get('q')||'';
  return viewMarketplace();
}
