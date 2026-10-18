window.ANILyfeCategories = [
  {
    id: 'collectibles',
    title: 'Collectibles',
    short: 'Collectibles',
    description: 'Limited pieces, display items and fan collectibles',
    image: 'assets/images/collectibles.png',
    icon: 'sparkles'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    short: 'Accessories',
    description: 'Keychains, pins, charms and everyday anime gear',
    image: 'assets/images/accessories.png',
    icon: 'key-round'
  },
  {
    id: 'figures',
    title: 'Figures',
    short: 'Figures',
    description: 'Collectible figures, statues and character displays',
    image: 'assets/images/figures.png',
    icon: 'bot'
  },
  {
    id: 'manga',
    title: 'Manga & Books',
    short: 'Manga',
    description: 'Manga volumes, art books and light novels',
    image: 'assets/images/manga.png',
    icon: 'book-open'
  },
  {
    id: 'art',
    title: 'Art',
    short: 'Art',
    description: 'Wall art, prints and posters',
    image: 'assets/images/art.png',
    icon: 'image'
  },
  {
    id: 'apparel',
    title: 'Apparel',
    short: 'Apparel',
    description: 'Hoodies, tees and anime streetwear',
    image: 'assets/images/apparel.png',
    icon: 'shirt'
  },
  {
    id: 'gaming',
    title: 'Gaming Products',
    short: 'Gaming',
    description: 'Controllers, skins and gaming gear',
    image: 'assets/images/gaming.png',
    icon: 'gamepad-2'
  }
];

window.ANILyfeCategoryForId = function(id){
  return window.ANILyfeCategories.find(category => category.id === id) || null;
};

/* Category artwork used as the anime fallback for products without photos. */
window.ANILyfeCategoryImageFor = function(name){
  const key = window.catKey ? catKey(name) : null;
  const category = key
    ? window.ANILyfeCategories.find(category => catKey(category.title) === key)
    : null;
  return category ? category.image : 'assets/images/placeholder.svg';
};
