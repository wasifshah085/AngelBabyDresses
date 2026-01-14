import axios from 'axios';
import CryptoJS from 'crypto-js';

const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID;
const JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD;
const JAZZCASH_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT;
const JAZZCASH_RETURN_URL = process.env.JAZZCASH_RETURN_URL;
const JAZZCASH_API_URL = process.env.JAZZCASH_API_URL;

// Generate secure hash for JazzCash
const generateSecureHash = (data) => {
  // Sort parameters alphabetically and create hash string
  const sortedKeys = Object.keys(data).sort();
  let hashString = JAZZCASH_INTEGRITY_SALT;

  sortedKeys.forEach(key => {
    if (data[key] !== '' && key !== 'pp_SecureHash') {
      hashString += '&' + data[key];
    }
  });

  // Generate HMAC SHA256 hash
  const hash = CryptoJS.HmacSHA256(hashString, JAZZCASH_INTEGRITY_SALT);
  return hash.toString(CryptoJS.enc.Hex).toUpperCase();
};

// Format date for JazzCash (YYYYMMDDHHmmss)
const formatDateTime = (date = new Date()) => {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

// Format expiry date (YYYYMMDDHHmmss) - 1 hour from now
const getExpiryDateTime = () => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return formatDateTime(expiry);
};

// Initiate JazzCash payment
export const initiatePayment = async (order) => {
  try {
    const txnRefNo = `T${Date.now()}`;
    const txnDateTime = formatDateTime();
    const txnExpiryDateTime = getExpiryDateTime();
    const amount = Math.round(order.total * 100).toString(); // Amount in paisa

    const data = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: JAZZCASH_MERCHANT_ID,
      pp_SubMerchantID: '',
      pp_Password: JAZZCASH_PASSWORD,
      pp_BankID: 'TBANK',
      pp_ProductID: 'RETL',
      pp_TxnRefNo: txnRefNo,
      pp_Amount: amount,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: order.orderNumber,
      pp_Description: `Order ${order.orderNumber}`,
      pp_TxnExpiryDateTime: txnExpiryDateTime,
      pp_ReturnURL: JAZZCASH_RETURN_URL,
      pp_SecureHash: ''
    };

    // Generate secure hash
    data.pp_SecureHash = generateSecureHash(data);

    // Make API call to JazzCash
    const response = await axios.post(JAZZCASH_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.pp_ResponseCode === '000') {
      return {
        success: true,
        transactionRef: txnRefNo,
        redirectUrl: response.data.pp_BankURL || null,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.pp_ResponseMessage || 'Payment initiation failed',
        data: response.data
      };
    }
  } catch (error) {
    console.error('JazzCash payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify JazzCash payment callback
export const verifyPayment = (callbackData) => {
  try {
    const receivedHash = callbackData.pp_SecureHash;

    // Remove secure hash from data for verification
    const dataForHash = { ...callbackData };
    delete dataForHash.pp_SecureHash;

    // Generate hash from received data
    const calculatedHash = generateSecureHash(dataForHash);

    // Verify hash
    if (receivedHash !== calculatedHash) {
      return {
        success: false,
        error: 'Invalid secure hash'
      };
    }

    // Check response code
    if (callbackData.pp_ResponseCode === '000') {
      return {
        success: true,
        transactionId: callbackData.pp_TxnRefNo,
        billReference: callbackData.pp_BillReference,
        amount: parseInt(callbackData.pp_Amount) / 100, // Convert paisa to rupees
        data: callbackData
      };
    } else {
      return {
        success: false,
        error: callbackData.pp_ResponseMessage || 'Payment verification failed',
        data: callbackData
      };
    }
  } catch (error) {
    console.error('JazzCash verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get payment status
export const getPaymentStatus = async (txnRefNo) => {
  try {
    const txnDateTime = formatDateTime();

    const data = {
      pp_Version: '1.1',
      pp_TxnType: 'MIGS',
      pp_Language: 'EN',
      pp_MerchantID: JAZZCASH_MERCHANT_ID,
      pp_Password: JAZZCASH_PASSWORD,
      pp_TxnRefNo: txnRefNo,
      pp_TxnDateTime: txnDateTime,
      pp_SecureHash: ''
    };

    data.pp_SecureHash = generateSecureHash(data);

    const response = await axios.post(
      JAZZCASH_API_URL.replace('DoTransaction', 'TransactionInquiry'),
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      success: response.data.pp_ResponseCode === '000',
      data: response.data
    };
  } catch (error) {
    console.error('JazzCash status check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default { initiatePayment, verifyPayment, getPaymentStatus };
