import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const deals = [
  { id: 1, title: 'Gaming Pro X1', price: '$899', originalPrice: '$1,299', discount: '30% OFF', color: 'from-blue-600 to-indigo-700', image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'Ultra Sound Buds', price: '$129', originalPrice: '$199', discount: '35% OFF', color: 'from-blue-500 to-sky-600', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'Tech Gear Pro', price: '$45', originalPrice: '$80', discount: '43% OFF', color: 'from-blue-400 to-blue-600', image: 'https://images.unsplash.com/photo-1542393545-b42f61e2b07e?auto=format&fit=crop&q=80&w=400' },
  { id: 4, title: 'Smart Watch Z', price: '$199', originalPrice: '$299', discount: '33% OFF', color: 'from-indigo-500 to-blue-600', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
  { id: 5, title: 'Pro Camera V2', price: '$1,200', originalPrice: '$1,800', discount: '33% OFF', color: 'from-blue-600 to-cyan-700', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400' },
];

export default function FlashyDealsSection({ section }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const slide = () => {
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollContainer.scrollLeft = 0;
        scrollAmount = 0;
      } else {
        scrollAmount += 1;
        scrollContainer.scrollLeft = scrollAmount;
      }
    };

    const interval = setInterval(slide, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full py-12 bg-white dark:bg-slate-900 overflow-hidden my-4 rounded-[2rem]">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tighter">
            {section?.title || 'Flashy Deals'}
          </h2>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-hidden scroll-smooth pb-4"
        >
          {deals.map((deal) => (
            <div 
              key={deal.id} 
              className="flex-shrink-0 w-56 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 overflow-hidden shadow-sm"
            >
              <div className="h-32 w-full overflow-hidden">
                <img src={deal.image} alt={deal.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
              </div>

              <div className="p-4">
                <div className={`inline-block bg-gradient-to-r ${deal.color} text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-2`}>
                  {deal.discount}
                </div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-white mb-2 truncate">{deal.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400">{deal.price}</span>
                  <span className="text-blue-400 dark:text-slate-500 line-through text-[10px] font-medium">{deal.originalPrice}</span>
                </div>
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-md hover:shadow-blue-500/20">
                  Buy Now <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
