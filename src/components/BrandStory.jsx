import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const BrandStory = () => {
  const { lang } = useLanguage();
  const { scrollYProgress } = useScroll();

  // Subtle scroll-linked animations for storytelling
  const opacity = useTransform(scrollYProgress, [0.05, 0.15], [0, 1]);
  const y = useTransform(scrollYProgress, [0.05, 0.15], [50, 0]);

  return (
    <section className="relative w-full pt-8 pb-16 md:pt-12 md:pb-24 bg-transparent flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-eas-blue/5 dark:bg-eas-blue/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <motion.div 
        style={{ opacity, y }}
        className="max-w-4xl mx-auto px-6 text-center"
      >
        <h2 className="text-3xl md:text-5xl font-light text-slate-800 dark:text-slate-200 tracking-tight leading-tight mb-8">
          {lang === 'fr' 
            ? <>Nous croyons que la technologie doit s'intégrer <span className="font-semibold italic text-slate-900 dark:text-white">harmonieusement</span> dans votre vie, avec élégance et simplicité.</>
            : <>We believe technology should blend <span className="font-semibold italic text-slate-900 dark:text-white">seamlessly</span> into your life, with elegance and simplicity.</>
          }
        </h2>
        
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {lang === 'fr'
            ? 'Chaque produit de notre collection est soigneusement sélectionné pour son design exceptionnel, ses performances de pointe et sa capacité à enrichir votre quotidien sans le compliquer.'
            : 'Every product in our collection is carefully curated for its exceptional design, cutting-edge performance, and ability to enrich your daily routine without complicating it.'
          }
        </p>

        <div className="mt-16 w-px h-24 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700 mx-auto" />
      </motion.div>
    </section>
  );
};

export default BrandStory;
