import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import MobileMenu from './MobileMenu';
import SearchModal from '../common/SearchModal';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <MobileMenu />
      <SearchModal />
    </div>
  );
};

export default MainLayout;
