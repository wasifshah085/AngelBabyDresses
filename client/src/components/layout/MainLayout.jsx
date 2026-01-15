import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import MobileMenu from './MobileMenu';
import SearchModal from '../common/SearchModal';
import { useLanguageStore } from '../../store/useStore';

const MainLayout = () => {
  const { direction } = useLanguageStore();

  return (
    <div className="flex flex-col min-h-screen" dir={direction}>
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
