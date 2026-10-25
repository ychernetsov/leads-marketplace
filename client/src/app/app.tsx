import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CatalogPage from '../pages/CatalogPage';
import { LoginSignupPage } from '../pages/LoginSignupPage';
import { ToastContainer } from '../components/ToastContainer';
import { OrdersPage } from '../pages/OrdersPage';
import { AdminUploadPage } from '../pages/AdminUploadPage';
import { AdminDatasetsPage } from '../pages/AdminDatasetsPage';
import { CheckoutSuccessPage } from '../pages/CheckoutSuccessPage';
import { CheckoutCancelPage } from '../pages/CheckoutCancelPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function App() {
  const { isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/login" element={<LoginSignupPage />} />
        <Route path="/signup" element={<LoginSignupPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
        <Route path="/admin/upload" element={<AdminUploadPage />} />
        <Route path="/admin/datasets" element={<AdminDatasetsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
