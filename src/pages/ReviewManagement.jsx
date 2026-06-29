import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, ShieldAlert, Check, Trash2, Shield, Plus, Search, Filter, RefreshCw, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-500 font-mono text-xs bg-red-50 dark:bg-red-900/10 rounded-2xl m-8">
          <h2 className="text-xl font-bold mb-4">ReviewManagement Crash Detected:</h2>
          <p className="font-bold">{this.state.error.message}</p>
          <pre className="mt-4 opacity-70 whitespace-pre-wrap">{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ReviewManagement() {
  const { products = [], showToast, requestConfirm } = useStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, flagged
  const [search, setSearch] = useState('');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('all'); // all, products, app
  
  const generateSKU = (productId) => {
    const prod = products.find(p => String(p.id) === String(productId));
    if (!prod) return `SWT-PRD-${String(productId).padStart(4, '0')}`;
    const prefix = prod.brand ? prod.brand.substring(0, 3) : (prod.category ? prod.category.substring(0, 3) : 'PRD');
    return `SWT-${prefix.toUpperCase()}-${String(prod.id).padStart(4, '0')}`;
  };

  // Review insertion modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReview, setNewReview] = useState({
    product_id: '',
    customer_name: '',
    rating: 5,
    comment: ''
  });

  // Fetch reviews on mount & real-time updates
  const fetchReviews = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(false);
    const interval = setInterval(() => {
      fetchReviews(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update status (Approve / Flag)
  const handleStatusUpdate = async (reviewId, newStatus, reviewObj = null) => {
    try {
      // Find review if not passed
      const review = reviewObj || reviews.find(r => r.id === reviewId) || {};
      const payload = {};
      
      // Dynamically support both schema structures
      if ('status' in review) payload.status = newStatus;
      if ('is_approved' in review || Object.keys(payload).length === 0) {
        payload.is_approved = newStatus === 'approved' ? 1 : (newStatus === 'flagged' ? -1 : 0);
      }

      const { error } = await supabase.from('reviews').update(payload).eq('id', reviewId);
      if (error) throw error;
      showToast(`Review ${newStatus} successfully`, 'success');
      fetchReviews();
    } catch (err) {
      console.error(err);
      showToast('Error updating review status: ' + err.message, 'error');
    }
  };

  // Delete review
  const handleDeleteReview = (reviewId) => {
    requestConfirm({
      title: 'Delete Review?',
      message: 'Are you sure you want to delete this customer review permanently? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
          if (error) throw error;
          showToast('Review deleted permanently', 'success');
          fetchReviews();
        } catch (err) {
          console.error(err);
          showToast('Error deleting review: ' + err.message, 'error');
        }
      }
    });
  };

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.product_id || !newReview.customer_name || !newReview.comment) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    try {
      const selectedProd = products.find(p => String(p.id) === String(newReview.product_id));
      const payload = {
        product_id: parseInt(newReview.product_id),
        product_name: selectedProd ? selectedProd.name : 'Unknown Product',
        reviewer_name: newReview.customer_name,
        customer_name: newReview.customer_name,
        rating: parseInt(newReview.rating),
        comment: newReview.comment,
        is_approved: 1,
        status: 'approved',
        created_at: new Date().toISOString()
      };

      // Strip keys that don't exist in Supabase by letting Supabase ignore them or we can just send it.
      // Usually Supabase might error if column doesn't exist, so we do a smart insert:
      const safePayload = {
        product_id: parseInt(newReview.product_id),
        rating: parseInt(newReview.rating),
        comment: newReview.comment,
        created_at: new Date().toISOString()
      };
      
      // Determine columns based on existing reviews or default to new schema
      if (reviews.length > 0) {
        if ('customer_name' in reviews[0]) safePayload.customer_name = newReview.customer_name;
        if ('reviewer_name' in reviews[0]) safePayload.reviewer_name = newReview.customer_name;
        if ('status' in reviews[0]) safePayload.status = 'approved';
        if ('is_approved' in reviews[0]) safePayload.is_approved = 1;
        if ('product_name' in reviews[0]) safePayload.product_name = selectedProd ? selectedProd.name : 'Unknown Product';
      } else {
        safePayload.reviewer_name = newReview.customer_name;
        safePayload.is_approved = 1;
      }

      const { error } = await supabase.from('reviews').insert([safePayload]);
      if (error) throw error;

      showToast('Mock review created successfully', 'success');
      setShowAddModal(false);
      setNewReview({ product_id: '', customer_name: '', rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      console.error(err);
      showToast('Error submitting review: ' + err.message, 'error');
    }
  };

  // Calculations
  const totalReviewsCount = reviews.length;
  const approvedReviewsCount = reviews.filter(r => (r.status === 'approved' || r.is_approved === 1)).length;
  const pendingReviewsCount = reviews.filter(r => (r.status === 'pending' || r.is_approved === 0)).length;
  const flaggedReviewsCount = reviews.filter(r => (r.status === 'flagged' || r.is_approved === -1)).length;
  
  const averageRating = approvedReviewsCount > 0 
    ? (reviews.filter(r => (r.status === 'approved' || r.is_approved === 1)).reduce((sum, r) => sum + r.rating, 0) / approvedReviewsCount).toFixed(1)
    : '0.0';

  // Filter lists
  const filteredReviews = reviews.filter(r => {
    const custName = r.customer_name || r.reviewer_name || '';
    const matchesSearch = custName.toLowerCase().includes(search.toLowerCase()) ||
                          (r.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.comment || '').toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    const rStatus = r.status || (r.is_approved === 1 ? 'approved' : r.is_approved === -1 ? 'flagged' : 'pending');
    if (filter !== 'all') {
      matchesStatus = rStatus === filter;
    }

    let matchesType = true;
    if (reviewTypeFilter === 'products') {
      matchesType = r.product_id !== null && r.product_id !== undefined;
    } else if (reviewTypeFilter === 'app') {
      matchesType = r.product_id === null || r.product_id === undefined;
    }
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <ErrorBoundary>
    <div className="space-y-8 pb-12">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalReviewsCount}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Product reviews received</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Star size={20} fill="currentColor" />
            </div>
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Score</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{averageRating} ★</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Average store rating</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Check size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Approved</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{approvedReviewsCount}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Active reviews on product page</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-yellow-500 tracking-wider">Pending</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{pendingReviewsCount}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Awaiting administrator approval</p>
        </div>
      </div>

      {/* Review Type Segment Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/60 pb-px">
        {[
          { id: 'all', label: 'All Feedback' },
          { id: 'products', label: 'Product Reviews' },
          { id: 'app', label: 'App Ratings' }
        ].map(tab => {
          const isActive = reviewTypeFilter === tab.id;
          const count = tab.id === 'all' 
            ? reviews.length 
            : tab.id === 'products'
              ? reviews.filter(r => r.product_id !== null && r.product_id !== undefined).length
              : reviews.filter(r => r.product_id === null || r.product_id === undefined).length;
          return (
            <button
              key={tab.id}
              onClick={() => setReviewTypeFilter(tab.id)}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer ${
                isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label} ({count})</span>
              {isActive && (
                <motion.div layoutId="activeReviewTypeUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Control panel and filters */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by customer name, rating, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Filters and actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
            }`}
          >
            Pending ({pendingReviewsCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              filter === 'approved'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            Approved ({approvedReviewsCount})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              filter === 'flagged'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
            }`}
          >
            Flagged ({flaggedReviewsCount})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={14} /> Add Test Review
          </button>
          
          <button
            onClick={fetchReviews}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl active:scale-95 transition-transform"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Reviews Grid */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-6">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="animate-spin mx-auto text-slate-400 mb-4" size={30} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading reviews list...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-24 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4 opacity-50" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No reviews found matching filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredReviews.map((r) => {
                const isAppFeedback = r.product_id === null || r.product_id === undefined;
                const matchingProd = products.find(p => String(p.id) === String(r.product_id));
                const productImg = isAppFeedback ? null : (matchingProd?.image_url || r.product_image || '/hero-banner.png');
                const productName = isAppFeedback ? "SWEETO HUB App Feedback" : (matchingProd?.name || r.product_name || 'Linked Product');

                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Customer info & Stars */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-white">{r.reviewer_name || r.customer_name || 'Anonymous'}</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Rating Stars */}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < r.rating ? "text-amber-500 fill-amber-500" : "text-slate-200 dark:text-slate-800"}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed mb-4">
                        "{r.comment}"
                      </p>
                    </div>

                    {/* Linked Product Bar */}
                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-3">
                        {isAppFeedback ? (
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <Star size={16} fill="currentColor" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-center">
                            <img
                              src={productImg}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/hero-banner.png'; }}
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 line-clamp-1">
                            {productName}
                          </p>
                          <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider font-mono">
                            {isAppFeedback ? 'App Preference Node' : `SKU: ${generateSKU(r.product_id)}`}
                          </span>
                        </div>
                      </div>

                      {/* Review status label */}
                      {(() => {
                        const rStatus = r.status || (r.is_approved === 1 ? 'approved' : r.is_approved === -1 ? 'flagged' : 'pending');
                        return (
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full ${
                            rStatus === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                              : rStatus === 'pending'
                                ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500'
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                          }`}>
                            {rStatus}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Moderate Actions bar */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-dashed border-slate-200/30">
                      {(() => {
                        const rStatus = r.status || (r.is_approved === 1 ? 'approved' : r.is_approved === -1 ? 'flagged' : 'pending');
                        return (
                          <>
                            {rStatus !== 'approved' && (
                              <button
                                onClick={() => handleStatusUpdate(r.id, 'approved', r)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
                                title="Approve Review"
                              >
                                <Check size={11} /> Approve
                              </button>
                            )}
                            
                            {rStatus !== 'flagged' && (
                              <button
                                onClick={() => handleStatusUpdate(r.id, 'flagged', r)}
                                className="px-2.5 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-600 hover:text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
                                title="Flag Review"
                              >
                                <ShieldAlert size={11} /> Flag
                              </button>
                            )}
                          </>
                        );
                      })()}

                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Mock Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Add Mock Review</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Product selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Select Product</label>
                <select
                  required
                  value={newReview.product_id}
                  onChange={(e) => setNewReview({ ...newReview, product_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold dark:text-white"
                >
                  <option value="">-- Choose target product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({generateSKU(p.id)})</option>
                  ))}
                </select>
              </div>

              {/* Author name */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Eto'o"
                  value={newReview.customer_name}
                  onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold dark:text-white"
                />
              </div>

              {/* Star Rating selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: stars })}
                      className="p-1 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star
                        size={24}
                        className={stars <= newReview.rating ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Review Comment</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Type a beautiful test comment..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md shadow-blue-500/20"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
