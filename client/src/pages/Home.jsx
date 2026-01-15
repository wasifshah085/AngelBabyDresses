import { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeart } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';
import { PageLoader } from '../components/common/Loader';
import { productsAPI } from '../services/api';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Static hero slide data - structure is language-independent
const HERO_SLIDES_DATA = [
  {
    id: 'hero-1',
    titleKey: 'hero.title',
    subtitleKey: 'hero.subtitle',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1920',
    ctaKey: 'hero.shopNow',
    link: '/shop'
  },
  {
    id: 'hero-2',
    titleKey: 'hero.newCollection',
    subtitleKey: 'hero.newCollectionSubtitle',
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1920',
    ctaKey: 'common.viewAll',
    link: '/shop?filter=new'
  },
  {
    id: 'hero-3',
    titleKey: 'hero.customDesigns',
    subtitleKey: 'hero.customDesignsSubtitle',
    image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=1920',
    ctaKey: 'hero.customDesign',
    link: '/custom-design'
  }
];

// Feature icons - language independent
const FEATURE_ICONS = [FiTruck, FiShield, FiRefreshCw, FiHeart];
const FEATURE_KEYS = [
  { titleKey: 'home.fastDelivery', descKey: 'home.fastDeliveryDesc' },
  { titleKey: 'home.qualityFabric', descKey: 'home.qualityFabricDesc' },
  { titleKey: 'home.customOrders', descKey: 'home.customOrdersDesc' },
  { titleKey: 'home.uniqueDesigns', descKey: 'home.uniqueDesignsDesc' }
];

// Memoized Hero Swiper to prevent re-initialization on language change
const HeroSwiper = memo(function HeroSwiper() {
  const { t } = useTranslation();

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation
      loop
      className="h-[60vh] lg:h-[80vh]"
      key="hero-swiper-static"
    >
      {HERO_SLIDES_DATA.map((slide) => (
        <SwiperSlide key={slide.id}>
          <div
            className="relative h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="container relative h-full flex items-center">
              <div className="max-w-xl text-white">
                <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-4 animate-fade-in">
                  {t(slide.titleKey)}
                </h1>
                <p className="text-lg lg:text-xl mb-8 text-white/90 animate-fade-in">
                  {t(slide.subtitleKey)}
                </p>
                <Link to={slide.link} className="btn btn-primary btn-lg animate-fade-in">
                  {t(slide.ctaKey)}
                  <FiArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
});

const Home = () => {
  const { t } = useTranslation();

  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsAPI.getFeatured(8)
  });

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productsAPI.getNewArrivals(8)
  });

  // Features with icons - memoized to prevent re-creation
  const features = useMemo(() => FEATURE_ICONS.map((icon, index) => ({
    icon,
    titleKey: FEATURE_KEYS[index].titleKey,
    descKey: FEATURE_KEYS[index].descKey
  })), []);

  return (
    <>
      <Helmet>
        <title>Angel Baby Dresses - Beautiful Clothes for Beautiful Kids</title>
        <meta name="description" content="Shop the finest collection of kids clothing in Pakistan. Quality dresses, outfits, and custom designs for your little angels." />
      </Helmet>

      {/* Hero Section - Memoized to prevent re-render on language change */}
      <section className="relative">
        <HeroSwiper />
      </section>

      {/* Features Section */}
      <section className="py-12 bg-primary-50">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-heading font-semibold text-gray-900 mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-gray-600">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold text-gray-900">
              {t('home.featuredProducts')}
            </h2>
            <Link to="/shop" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              {t('common.viewAll')}
              <FiArrowRight />
            </Link>
          </div>

          {loadingFeatured ? (
            <PageLoader />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts?.data?.data?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-heading font-bold text-gray-900">
              {t('home.newArrivals')}
            </h2>
            <Link to="/shop?filter=new" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              {t('common.viewAll')}
              <FiArrowRight />
            </Link>
          </div>

          {loadingNew ? (
            <PageLoader />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals?.data?.data?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Design CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="container text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
            {t('customDesign.title')}
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {t('customDesign.subtitle')}
          </p>
          <Link to="/custom-design" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
            {t('hero.customDesign')}
            <FiArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
