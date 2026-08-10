import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersHistoryContent from '../components/OrdersHistoryContent';
import DesktopHeader from '../components/DesktopHeader';
import Header from '../components/Header';

export default function OrdersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem('sweetohub_session');
    if (!session) {
      navigate('/login?redirect=/orders');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F6F9FE] dark:bg-[#0A1120] text-slate-900 dark:text-white transition-colors duration-300 w-full flex flex-col">
      {/* Desktop Fixed Header */}
      <div className="hidden md:block w-full">
        <DesktopHeader activePage="other" />
      </div>
      
      {/* Mobile Fixed Header */}
      <div className="md:hidden w-full">
        <Header />
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 flex-1">
        <OrdersHistoryContent onBack={() => navigate(-1)} />
      </main>
    </div>
  );
}
