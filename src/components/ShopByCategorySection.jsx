import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

const ShopByCategorySection = () => {
  const navigate = useNavigate();
  const { lang, t, t_smart } = useLanguage();
  const { products, categories = [], settings } = useStore();

  const isFr = lang === 'fr';

  // Find 3 fashion/clothing products from active products to showcase in the Viva banner
  const fashionProducts = React.useMemo(() => {
    const list = products?.filter(p => 
      p.status === 'active' && 
      p.stock > 0 &&
      (p.category?.toLowerCase().includes('clothing') || 
       p.category?.toLowerCase().includes('fashion') || 
       p.category?.toLowerCase().includes('vêtements') ||
       p.category?.toLowerCase().includes('mode'))
    ) || [];
    
    // If not enough fashion products, fallback to first active products
    if (list.length < 3) {
      const active = products?.filter(p => p.status === 'active' && p.stock > 0) || [];
      return active.slice(0, 3);
    }
    return list.slice(0, 3);
  }, [products]);

  // Fallback data for the Viva products if database is empty
  const defaultVivaProducts = [
    {
      id: 'viva-1',
      name: isFr ? 'Robe d\'été beige' : 'Beige Summer Dress',
      price: 23.10,
      original_price: 30.00,
      rating: 4.6,
      sold_count: 1024,
      image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'viva-2',
      name: isFr ? 'Robe de soirée élégante' : 'Elegant Evening Gown',
      price: 13.99,
      original_price: 23.32,
      rating: 4.8,
      sold_count: 480,
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'viva-3',
      name: isFr ? 'Maillot de bain deux pièces' : 'Two-Piece Swimsuit',
      price: 13.11,
      original_price: 23.83,
      rating: 4.8,
      sold_count: 183,
      image_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=300'
    }
  ];

  const displayVivaProducts = fashionProducts.length >= 3 
    ? fashionProducts.map((p, idx) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_price: p.original_price || p.price * 1.3,
        rating: 4.5 + (idx * 0.15),
        sold_count: 100 + (idx * 150),
        image_url: p.image_url || p.image || '/hero-banner.png'
      }))
    : defaultVivaProducts;

  // Deduplicate and select up to 6 categories from the database (prioritizing parents)
  const displayCategories = React.useMemo(() => {
    const parents = categories.filter(c => !c.parent_id) || [];
    if (parents.length >= 6) {
      return parents.slice(0, 6);
    }
    const allCats = [...parents, ...categories.filter(c => c.parent_id)];
    const uniqueCats = [];
    const seen = new Set();
    allCats.forEach(c => {
      if (c && !seen.has(c.id)) {
        seen.add(c.id);
        uniqueCats.push(c);
      }
    });
    return uniqueCats.slice(0, 6);
  }, [categories]);

  // Helper to resolve a category's representative image
  const getCategoryImage = (cat) => {
    if (cat.image_url) return cat.image_url;
    if (cat.image) return cat.image;
    
    // Fallback to first product image in this category
    const catProducts = products?.filter(p => p.category === cat.name || Number(p.category_id) === Number(cat.id)) || [];
    if (catProducts.length > 0) {
      return catProducts[0].image_url || catProducts[0].image;
    }
    
    // Keyword matching fallback Unsplash images
    const fallbacks = [
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1559251606-c623743a6d76?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=300'
    ];
    
    const catName = cat.name?.toLowerCase() || '';
    if (catName.includes('femme') || catName.includes('women') || catName.includes('girl')) return fallbacks[0];
    if (catName.includes('homme') || catName.includes('men') || catName.includes('boy')) return fallbacks[1];
    if (catName.includes('meuble') || catName.includes('furniture') || catName.includes('home') || catName.includes('maison')) return fallbacks[2];
    if (catName.includes('jouet') || catName.includes('toy') || catName.includes('game') || catName.includes('jeu')) return fallbacks[3];
    if (catName.includes('chaussure') || catName.includes('shoe') || catName.includes('boot')) return fallbacks[4];
    if (catName.includes('beauté') || catName.includes('beauty') || catName.includes('cosmetic') || catName.includes('santé') || catName.includes('health')) return fallbacks[5];
    
    const idHash = Number(cat.id) || 0;
    return fallbacks[idHash % fallbacks.length];
  };

  const handleCategoryClick = (catName) => {
    navigate(`/category/${encodeURIComponent(catName)}`);
  };

  const handleProductClick = (id) => {
    if (typeof id === 'string' && id.startsWith('viva-')) {
      navigate('/category/Clothing');
    } else {
      navigate(`/product/${id}`);
    }
  };

  return (
    <section className="hidden lg:block w-full px-4 md:px-10 pt-6 pb-12 select-none bg-transparent mb-10">
      {/* Centered Heading */}
      <div className="text-center mb-6 mt-4 select-none">
        <h2 className="text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight">
          {isFr ? 'Acheter par catégorie' : 'Shop by category'}
        </h2>
      </div>

      {/* Grid of Section */}
      <div className="grid grid-cols-12 gap-5 min-h-[410px] xl:min-h-[480px] w-full relative">
        {/* Left Column: Viva Fashion Banner (5/12 width) */}
        <div className="col-span-5 bg-gradient-to-b from-[#bdeeff] to-[#e8faff] rounded-[2rem] p-5 flex flex-col justify-between relative overflow-hidden h-full shadow-sm">
          {/* Top Info block */}
          <div className="z-10 text-left">
            <h3 className="font-serif italic text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              Viva
            </h3>
            <p className="text-slate-800 text-[13px] font-bold mt-1.5 leading-none">
              {isFr ? 'Votre sélection mode' : 'Your fashion selection'}
            </p>
            <button 
              onClick={() => handleCategoryClick(isFr ? 'Vêtements' : 'Clothing')}
              className="bg-black text-white text-[10.5px] font-black px-4.5 py-2.5 rounded-[10px] mt-4 hover:opacity-85 active:scale-95 transition-all uppercase tracking-wider leading-none cursor-pointer border-none"
            >
              {isFr ? 'Profitez-en maintenant' : 'Shop Now'}
            </button>
          </div>

          {/* Absolute model image overlay */}
          <div className="absolute right-0 top-0 h-[62%] w-[42%] pointer-events-none select-none z-0">
            <img 
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=350"
              alt=""
              className="h-full w-full object-contain object-bottom select-none"
            />
          </div>

          {/* Underneath Products Showcase Row */}
          <div className="grid grid-cols-3 gap-3 w-full mt-auto z-10 pt-4 border-t border-white/40">
            {displayVivaProducts.map((p) => {
              const discount = p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 30;
              return (
                <div 
                  key={p.id}
                  onClick={() => handleProductClick(p.id)}
                  className="bg-white rounded-2xl p-2 flex flex-col justify-between relative group cursor-pointer shadow-sm hover:shadow-md transition-shadow text-left h-[175px] xl:h-[210px] overflow-hidden"
                >
                  <div className="w-full aspect-square bg-[#f4f4f4] rounded-xl flex items-center justify-center p-1 relative overflow-hidden mb-1.5">
                    <img 
                      src={p.image_url} 
                      alt={p.name}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col text-left space-y-0.5 leading-none">
                    <div className="flex items-baseline flex-wrap gap-1">
                      <span className="text-[12px] font-black text-slate-900">
                        {settings?.currency || 'FCFA'} {p.price.toLocaleString()}
                      </span>
                      {p.original_price && p.original_price > p.price && (
                        <span className="text-[8px] font-bold text-slate-400 line-through font-mono">
                          {p.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-amber-500 pt-0.5">
                      <Star size={8} fill="currentColor" className="text-amber-500" />
                      <span>{p.rating}</span>
                      {p.sold_count > 0 && (
                        <span className="text-slate-400 font-medium ml-1">
                          {p.sold_count >= 1000 ? `+1 000 ${isFr ? 'vendus' : 'sold'}` : `${p.sold_count} ${isFr ? 'vendu(s)' : 'sold'}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 2x3 Grid of Categories (7/12 width) */}
        <div className="col-span-7 grid grid-cols-2 grid-rows-3 gap-4 h-full">
          {displayCategories.map((cat, idx) => (
            <div 
              key={cat.id || idx}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-[#f4f4f4] dark:bg-slate-905 rounded-[1.5rem] p-4.5 flex justify-between items-center relative overflow-hidden hover:scale-[1.01] hover:shadow-sm transition-all cursor-pointer text-left h-full group"
            >
              {/* Category Title */}
              <div className="flex flex-col justify-center text-left max-w-[60%] z-10">
                <span className="text-[13px] sm:text-[14px] font-black text-slate-850 dark:text-white uppercase tracking-tight group-hover:text-[#ff0a24] transition-colors leading-tight">
                  {t_smart(cat.name)}
                </span>
              </div>

              {/* Category Image */}
              <div className="h-[85%] w-[38%] flex justify-end items-center pointer-events-none select-none z-0">
                <img 
                  src={getCategoryImage(cat)} 
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategorySection;
