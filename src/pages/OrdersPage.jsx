import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersHistoryContent from '../components/OrdersHistoryContent';

export default function OrdersPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 w-full flex justify-center pb-20 lg:pb-0">
      <div className="main-container max-w-[480px] w-full bg-[#f8fafc] dark:bg-[#0f172a]">
        <OrdersHistoryContent onBack={() => navigate(-1)} />
      </div>
    </div>
  );
}
