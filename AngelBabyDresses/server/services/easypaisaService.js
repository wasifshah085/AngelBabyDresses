import axios from 'axios';
import CryptoJS from 'crypto-js';

const EASYPAISA_STORE_ID = process.env.EASYPAISA_STORE_ID;
const EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY;
const EASYPAISA_API_URL = process.env.EASYPAISA_API_URL;
const CLIENT_URL = process.env.CLIENT_URL;

// Generate hash for Easypaisa
const generateHash = (data) => {
  const hashString = `${data.amount}${data.orderRefNum}${data.storeId}${EASYPAISA_HASH_KEY}`;
  return CryptoJS.SHA256(hashString).toString(CryptoJS.enc.Hex);
};

// Verify hash from callback
const verifyHash = (data) => {
  const hashString = `${data.amount}${data.orderRefNum}${data.storeId}${EASYPAISA_HASH_KEY}`;
  const calculatedHash = CryptoJS.SHA256(hashString).toString(CryptoJS.enc.Hex);
  return calculatedHash === data.hashRequest;
};

// Initiate Easypaisa payment
export const initiatePayment = async (order) => {
  try {
    const orderRefNum = `EP${Date.now()}`;
    const amount = order.total.toString();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    const expiryDateStr = expiryDate.toISOString().split('T')[0].replace(/-/g, '');

    const data = {
      storeId: EASYPAISA_STORE_ID,
      orderId: order.orderNumber,
      orderRefNum: orderRefNum,
      amount: amount,
      transactionType: 'MA', // Mobile Account
      mobileAccountNo: '', // To be filled by customer
      emailAddress: order.shippingAddress.email || '',
      expiryDate: expiryDateStr,
      postBackURL: `${CLIENT_URL}/payment/easypaisa/callback`,
      merchantHashedReq: ''
    };

    // Generate hash
    data.merchantHashedReq = generateHash(data);

    // For Easypaisa, we typically redirect to their payment page
    // Or use their hosted checkout
    return {
      success: true,
      orderRefNum: orderRefNum,
      paymentUrl: `${EASYPAISA_API_URL}/checkout`,
      data: data
    };
  } catch (error) {
    console.error('Easypaisa payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify Easypaisa payment callback
export const verifyPayment = (callbackData) => {
  try {
    // Verify the hash
    if (!verifyHash(callbackData)) {
      return {
        success: false,
        error: 'Invalid hash - payment verification failed'
      };
    }

    // Check response code
    if (callbackData.responseCode === '0000') {
      return {
        success: true,
        transactionId: callbackData.transactionRefNumber,
        orderRefNum: callbackData.orderRefNum,
        amount: parseFloat(callbackData.amount),
        data: callbackData
      };
    } else {
      return {
        success: false,
        error: callbackData.responseDesc || 'Payment failed',
        data: callbackData
      };
    }
  } catch (error) {
    console.error('Easypaisa verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get payment status inquiry
export const getPaymentStatus = async (orderRefNum) => {
  try {
    const data = {
      storeId: EASYPAISA_STORE_ID,
      orderRefNum: orderRefNum
    };

    data.merchantHashedReq = generateHash(data);

    const response = await axios.post(
      `${EASYPAISA_API_URL}/inquiry`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: response.data.responseCode === '0000',
      data: response.data
    };
  } catch (error) {
    console.error('Easypaisa status check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default { initiatePayment, verifyPayment, getPaymentStatus };
