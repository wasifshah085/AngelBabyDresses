import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { FiCheckCircle, FiClock, FiPackage, FiTruck, FiArrowRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuthStore } from '../store/useStore';

const OrderSuccess = () => {
  const { orderNumber } = useParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  const steps = [
    {
      icon: FiClock,
      title: 'Payment Verification',
      description: 'Our team will verify your advance payment within 24 hours. Please be patient while we confirm your payment.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: FiCheckCircle,
      title: 'Order Confirmation',
      description: 'Once payment is verified, you\'ll receive a confirmation via email and WhatsApp. Your order will enter production.',
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      icon: FiPackage,
      title: 'Production & Quality Check',
      description: 'Your dress will be carefully crafted (7-14 days). We\'ll notify you when it\'s ready for shipping.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      icon: FiTruck,
      title: 'Delivery & Final Payment',
      description: 'Pay the remaining 50% + shipping (Rs 350/kg) via Cash on Delivery when you receive your order.',
      color: 'text-primary-500',
      bgColor: 'bg-primary-100'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Order Placed Successfully | Angel Baby Dresses</title>
      </Helmet>

      <div className="container py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <FiCheckCircle className="w-10 h-10 text-green-500" />
            </div>

            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-3">
              Thank You for Your Order!
            </h1>

            <p className="text-gray-600 mb-2">
              Your order has been placed successfully.
            </p>

            {orderNumber && (
              <div className="inline-block bg-primary-50 px-6 py-3 rounded-lg mt-2">
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="text-xl font-bold text-primary-600">{orderNumber}</p>
              </div>
            )}
          </div>

          {/* What Happens Next */}
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6 text-center">
              What Happens Next?
            </h2>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full ${step.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">STEP {index + 1}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <p className="text-yellow-800 text-sm text-center">
              <strong>Note:</strong> Payment verification typically takes within 24 hours. If you haven't received confirmation, please contact us on WhatsApp.
            </p>
          </div>

          {/* Contact Support */}
          <div className="bg-green-50 rounded-xl p-6 text-center mb-8">
            <FaWhatsapp className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about your order, feel free to reach out.
            </p>
            <a
              href="https://wa.me/923471504434"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
            >
              <FaWhatsapp className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/orders" className="btn btn-primary">
                View My Orders
                <FiArrowRight className="w-5 h-5 ms-2" />
              </Link>
            ) : (
              <Link to={`/track-order`} className="btn btn-primary">
                Track Your Order
                <FiArrowRight className="w-5 h-5 ms-2" />
              </Link>
            )}
            <Link to="/shop" className="btn btn-outline">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
