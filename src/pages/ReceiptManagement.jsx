import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Printer, X, CheckCircle, Search, Calendar, MapPin, Phone, Package, Download } from 'lucide-react';

const ReceiptManagement = () => {
  const { orders = [], settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // We only want completed/shipped orders for receipts usually, but let's show all for now
  const receipts = orders.filter(o => o.status === 'completed' || o.status === 'shipped' || o.status === 'processing');

  const filteredReceipts = receipts.filter(r => 
    (r.id?.toString() || '').includes(searchTerm) ||
    (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatId = (id) => `SWT-ORD-${String(id).padStart(4, '0')}`;
  
  const getCurrencySymbol = (curr) => {
    switch (curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'CA$';
      case 'INR': return '₹';
      default: return curr || 'FCFA';
    }
  };
  const currencySymbol = getCurrencySymbol(settings?.currency || 'FCFA');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="text-blue-500" />
            Digital Receipts
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage and print customer invoices</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input 
            type="text" 
            placeholder="Search Receipt ID or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Grid of Receipt Stubs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredReceipts.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <FileText className="mx-auto text-slate-300 mb-4" size={32} />
            <p className="text-slate-500 font-bold">No receipts found</p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => (
            <motion.div 
              key={receipt.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedReceipt(receipt)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm cursor-pointer hover:shadow-xl hover:border-blue-500/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {new Date(receipt.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="space-y-1 relative z-10">
                <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {formatId(receipt.id)}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {receipt.customer_name}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800 flex justify-between items-end relative z-10">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Paid</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {currencySymbol}{receipt.total_amount || receipt.total}
                  </span>
                </div>
                <div className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                  {receipt.status}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* FULL RECEIPT MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-100 dark:bg-slate-950 rounded-[2rem] shadow-2xl custom-scrollbar relative"
            >
              {/* Toolbar */}
              <div className="sticky top-0 z-20 flex justify-between items-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors">
                    <Printer size={14} /> Print Receipt
                  </button>
                  <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors">
                    <Download size={14} /> Export PDF
                  </button>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Printable Receipt Area */}
              <div className="p-8 sm:p-12" id="printable-receipt">
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  
                  {/* GIANT BACKGROUND WATERMARK */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.03] dark:opacity-[0.02]">
                    <h1 className="text-[120px] sm:text-[180px] font-black uppercase whitespace-nowrap -rotate-45 text-slate-900 dark:text-white select-none">
                      SWEETO HUB
                    </h1>
                  </div>

                  {/* Decorative corner lines */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl opacity-50 pointer-events-none z-10"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-3xl opacity-50 pointer-events-none z-10"></div>

                  <div className="relative z-10">
                    {/* Receipt Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">SWEETO HUB</h1>
                      <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Premium Tech Retailer</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-mono font-bold text-blue-500 mb-1">{formatId(selectedReceipt.id)}</p>
                      <p className="text-xs text-slate-500 font-medium">Date: {new Date(selectedReceipt.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Billed To</h4>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{selectedReceipt.customer_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={12}/> {selectedReceipt.customer_phone || selectedReceipt.customer_contact?.split('|')[0] || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Shipped To</h4>
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1 leading-relaxed">
                          <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400"/> 
                          {selectedReceipt.address || selectedReceipt.customer_contact?.split('|')[1] || 'Store Pickup'}
                          {selectedReceipt.city ? `, ${selectedReceipt.city}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="py-8">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Order Details</h4>
                    <div className="space-y-4">
                      {(() => {
                        let items = [];
                        try {
                          items = typeof selectedReceipt.items === 'string' ? JSON.parse(selectedReceipt.items) : (selectedReceipt.items || []);
                        } catch (e) {
                          items = [];
                        }

                        if (items.length === 0) {
                          return <p className="text-sm text-slate-500 italic">No item details available.</p>;
                        }

                        return items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 flex items-center justify-center p-1">
                                {item.image_url || item.image ? (
                                  <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-contain" />
                                ) : (
                                  <Package size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity || 1}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                              {currencySymbol}{item.price ? item.price.toLocaleString() : '0'}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Summary & Total */}
                  <div className="pt-8 border-t-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="flex flex-col sm:flex-row gap-6 w-full xl:w-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle className="text-emerald-500" size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Payment Status</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">SUCCESSFUL</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:border-l-2 border-slate-100 dark:border-slate-800 sm:pl-6">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                          <Package className="text-blue-500" size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Payment Method</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">Pay on Delivery</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">(Cash / Mobile Money)</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right bg-blue-50 dark:bg-blue-900/20 px-6 py-4 rounded-2xl border border-blue-100 dark:border-blue-800 w-full sm:w-auto">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Grand Total</p>
                      <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                        {currencySymbol}{selectedReceipt.total_amount || selectedReceipt.total}
                      </p>
                    </div>
                  </div>

                  {/* Footer Barcode visual */}
                  <div className="mt-12 text-center opacity-30 dark:opacity-50 flex flex-col items-center">
                    {/* Simulated Barcode */}
                    <div className="flex gap-0.5 h-10 mb-2">
                      {[...Array(40)].map((_, i) => (
                        <div key={i} className="bg-slate-900 dark:bg-white" style={{ width: `${Math.random() * 4 + 1}px` }}></div>
                      ))}
                    </div>
                    <p className="font-mono text-[8px] tracking-[0.3em]">{selectedReceipt.id}-{Date.now().toString().slice(-6)}</p>
                  </div>

                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Print Styles inserted inline so they work specifically for the receipt */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Override dark mode text for print */
          #printable-receipt .dark\\:text-white { color: #0f172a !important; }
          #printable-receipt .dark\\:bg-slate-900 { background: white !important; }
        }
      `}} />
    </div>
  );
};

export default ReceiptManagement;
