import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, Target, ArrowUpRight, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminAnalyticsDashboard() {
  const { lang } = useLanguage();

  // Mock analytics metrics
  const stats = [
    { label: lang === 'fr' ? 'Chiffre d\'Affaires' : 'Total Revenue', value: '3,840,000 FCFA', change: '+14.2%', icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { label: lang === 'fr' ? 'Total Commandes' : 'Total Orders', value: '148', change: '+8.4%', icon: ShoppingBag, color: 'from-blue-500 to-indigo-500' },
    { label: lang === 'fr' ? 'Taux de Conversion' : 'Conversion Rate', value: '3.42%', change: '+1.2%', icon: Target, color: 'from-violet-500 to-purple-500' },
    { label: lang === 'fr' ? 'Panier Moyen' : 'Average Order Value', value: '25,945 FCFA', change: '+3.1%', icon: TrendingUp, color: 'from-amber-500 to-orange-500' }
  ];

  const salesData = [
    { day: 'Lun', sales: 220000 },
    { day: 'Mar', sales: 450000 },
    { day: 'Mer', sales: 300000 },
    { day: 'Jeu', sales: 650000 },
    { day: 'Ven', sales: 500000 },
    { day: 'Sam', sales: 880000 },
    { day: 'Dim', sales: 740000 }
  ];

  // SVG coordinates calculations for line chart
  const width = 500;
  const height = 150;
  const padding = 20;
  const maxSales = Math.max(...salesData.map(d => d.sales));
  
  const points = salesData.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (salesData.length - 1);
    const y = height - padding - (d.sales / maxSales) * (height - padding * 2);
    return { x, y };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  
  // Area path coordinate string
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  return (
    <div className="space-y-8 font-sans text-left pb-10">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
          {lang === 'fr' ? 'Tableau de Bord Analytique' : 'Storefront Analytics'}
        </h2>
        <p className="text-xs text-slate-400">
          {lang === 'fr' ? 'Suivi en temps réel des performances de vente' : 'Real-time sales performance metrics'}
        </p>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</h3>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-emerald-500">{stat.change}</span>
                <span className="text-[9px] text-slate-400">vs last month</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.color} text-white flex items-center justify-center shadow-md`}>
              <stat.icon size={20} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Chart Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {lang === 'fr' ? 'Évolution des Ventes (Cette Semaine)' : 'Sales Evolution (This Week)'}
            </h3>
            <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full uppercase tracking-wider">
              {lang === 'fr' ? 'Hebdomadaire' : 'Weekly'}
            </span>
          </div>

          {/* SVG Animated Line Chart */}
          <div className="w-full relative h-48 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden flex items-center justify-center p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + ratio * (height - padding * 2);
                return (
                  <line 
                    key={idx} 
                    x1={padding} 
                    y1={y} 
                    x2={width - padding} 
                    y2={y} 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    className="text-slate-200 dark:text-slate-800" 
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Area Under Curve */}
              <path d={areaD} fill="rgba(59, 130, 246, 0.06)" />

              {/* Line path */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />

              {/* Interactive Point markers */}
              {points.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#3b82f6" 
                  stroke="white" 
                  strokeWidth="1.5" 
                  className="shadow-md cursor-pointer hover:r-6 transition-all"
                />
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between px-6 pt-3">
            {salesData.map((d, idx) => (
              <span key={idx} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{d.day}</span>
            ))}
          </div>
        </div>

        {/* Location Performance Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">
            {lang === 'fr' ? 'Ventes par Zone' : 'Sales by Location'}
          </h3>
          
          <div className="space-y-4">
            {[
              { zone: 'Cocody', pct: 42, color: 'bg-blue-500' },
              { zone: 'Yopougon', pct: 28, color: 'bg-emerald-500' },
              { zone: 'Marcory', pct: 18, color: 'bg-amber-500' },
              { zone: 'Plateau', pct: 12, color: 'bg-violet-500' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1 text-left">
                <div className="flex justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span>{item.zone}</span>
                  <span>{item.pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
