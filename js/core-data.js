/* ANIlyfe V1 frontend core constants. Marketplace records are API-owned. */
const REGIONS=[
 {code:'NG',name:'Nigeria',flag:'🇳🇬',symbol:'₦',rate:1,dec:0},
 {code:'GH',name:'Ghana',flag:'🇬🇭',symbol:'₵',rate:.0104,dec:2},
 {code:'US',name:'United States',flag:'🇺🇸',symbol:'$',rate:.00066,dec:2},
 {code:'GB',name:'United Kingdom',flag:'🇬🇧',symbol:'£',rate:.00052,dec:2},
 {code:'KE',name:'Kenya',flag:'🇰🇪',symbol:'KSh ',rate:.086,dec:0},
 {code:'JP',name:'Japan',flag:'🇯🇵',symbol:'¥',rate:.101,dec:0},
 {code:'ZA',name:'South Africa',flag:'🇿🇦',symbol:'R',rate:.012,dec:2}
];
const region=()=>REGIONS.find(r=>r.code===LS.get('region','NG'))||REGIONS[0];
function formatCurrency(amount, selectedRegion=region()){
 const r=typeof selectedRegion==='string'?REGIONS.find(item=>item.code===selectedRegion)||REGIONS[0]:selectedRegion||REGIONS[0];
 const value=Number(amount);const safeValue=Number.isFinite(value)?value:0;
 return r.symbol+(safeValue*r.rate).toLocaleString(undefined,{minimumFractionDigits:r.dec,maximumFractionDigits:r.dec});
}
const fmt=amount=>formatCurrency(amount,region());
window.formatCurrency=formatCurrency;
const NIGERIAN_STATES_SHARED=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT'];
const CATS=Object.fromEntries(window.ANILyfeCategories.map(category=>[
 category.title,{icon:category.icon,short:category.short}
]));
const catKey=name=>{
 const value=String(name||'').trim().toLowerCase();
 const aliases={
  'figures & collectibles':'Figures','figures':'Figures','collectibles':'Collectibles',
  'clothing & apparel':'Apparel','hoodies':'Apparel','apparel':'Apparel',
  'keychains':'Accessories','accessories':'Accessories',
  'manga':'Manga & Books','manga & books':'Manga & Books',
  'posters & wall art':'Art','wall art':'Art','posters':'Art','art':'Art',
  'gaming':'Gaming Products','gaming products':'Gaming Products'
 };
 return aliases[value]||Object.keys(CATS).find(k=>k.toLowerCase()===value||CATS[k].short.toLowerCase()===value)||null;
};
const ANIME_PREFERENCES={
 'Attack on Titan':['Eren Yeager','Mikasa Ackerman','Levi Ackerman','Armin Arlert','Hange Zoë'],
 'Bleach':['Ichigo Kurosaki','Rukia Kuchiki','Sosuke Aizen','Uryu Ishida','Orihime Inoue'],
 'Chainsaw Man':['Denji','Makima','Aki Hayakawa','Power','Pochita'],
 'Death Note':['Light Yagami','L','Misa Amane','Near','Ryuk'],
 'Demon Slayer':['Tanjiro Kamado','Nezuko Kamado','Zenitsu Agatsuma','Inosuke Hashibira','Muzan Kibutsuji'],
 'Dragon Ball':['Goku','Vegeta','Bulma','Piccolo','Frieza','Gohan'],
 'Fullmetal Alchemist':['Edward Elric','Alphonse Elric','Winry Rockbell','Roy Mustang','Riza Hawkeye'],
 'Hunter x Hunter':['Gon Freecss','Killua Zoldyck','Kurapika','Leorio Paradinight','Hisoka Morow'],
 'Jujutsu Kaisen':['Yuji Itadori','Megumi Fushiguro','Nobara Kugisaki','Satoru Gojo','Ryomen Sukuna'],
 'My Hero Academia':['Izuku Midoriya','Katsuki Bakugo','Ochaco Uraraka','Shoto Todoroki','All Might'],
 'Naruto':['Naruto Uzumaki','Sasuke Uchiha','Sakura Haruno','Kakashi Hatake','Hinata Hyuga','Itachi Uchiha'],
 'One Piece':['Monkey D. Luffy','Roronoa Zoro','Nami','Sanji','Nico Robin','Portgas D. Ace'],
 'One Punch Man':['Saitama','Genos','Tatsumaki','Mumen Rider','Garou'],
 'Sailor Moon':['Usagi Tsukino','Ami Mizuno','Rei Hino','Makoto Kino','Minako Aino'],
 'Spy x Family':['Loid Forger','Anya Forger','Yor Forger','Franky Franklin'],
 'Tokyo Ghoul':['Ken Kaneki','Touka Kirishima','Rize Kamishiro','Shuu Tsukiyama']
};
