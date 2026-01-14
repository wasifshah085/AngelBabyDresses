import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Send WhatsApp message using WhatsApp Business API
export const sendWhatsAppMessage = async (to, message) => {
  try {
    // Format phone number (remove leading 0 and add country code if needed)
    let formattedPhone = to.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '92' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('92')) {
      formattedPhone = '92' + formattedPhone;
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('WhatsApp message sent:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Send WhatsApp template message
export const sendWhatsAppTemplate = async (to, templateName, parameters = []) => {
  try {
    let formattedPhone = to.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '92' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('92')) {
      formattedPhone = '92' + formattedPhone;
    }

    const components = parameters.length > 0 ? [{
      type: 'body',
      parameters: parameters.map(param => ({
        type: 'text',
        text: param
      }))
    }] : [];

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('WhatsApp template sent:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp template error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// WhatsApp message templates
export const whatsappMessages = {
  // Order confirmation
  orderConfirmation: (order, lang = 'en') => {
    if (lang === 'ur') {
      return `السلام علیکم! 🎀

آپ کے آرڈر کا شکریہ!

آرڈر نمبر: ${order.orderNumber}
کل رقم: Rs. ${order.total}

ہم جلد آپ کا آرڈر پروسیس کریں گے۔

Angel Baby Dresses`;
    }
    return `Hello! 🎀

Thank you for your order!

Order Number: ${order.orderNumber}
Total: Rs. ${order.total}

We will process your order shortly.

Angel Baby Dresses`;
  },

  // Order shipped
  orderShipped: (order, lang = 'en') => {
    if (lang === 'ur') {
      return `السلام علیکم! 📦

آپ کا آرڈر شپ ہو گیا ہے!

آرڈر نمبر: ${order.orderNumber}
${order.trackingNumber ? `ٹریکنگ نمبر: ${order.trackingNumber}` : ''}

جلد آپ تک پہنچ جائے گا!

Angel Baby Dresses`;
    }
    return `Hello! 📦

Your order has been shipped!

Order Number: ${order.orderNumber}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}

It will arrive soon!

Angel Baby Dresses`;
  },

  // Order delivered
  orderDelivered: (order, lang = 'en') => {
    if (lang === 'ur') {
      return `السلام علیکم! 🎉

آپ کا آرڈر پہنچ گیا!

آرڈر نمبر: ${order.orderNumber}

امید ہے آپ کو پسند آیا! براہ کرم ریویو دیں۔

Angel Baby Dresses`;
    }
    return `Hello! 🎉

Your order has been delivered!

Order Number: ${order.orderNumber}

We hope you love it! Please leave us a review.

Angel Baby Dresses`;
  },

  // Custom design quote
  customDesignQuote: (design, lang = 'en') => {
    if (lang === 'ur') {
      return `السلام علیکم! ✨

آپ کے کسٹم ڈیزائن کا کوٹ تیار ہے!

ڈیزائن نمبر: ${design.designNumber}
قیمت: Rs. ${design.quotedPrice}
وقت: ${design.estimatedDays} دن

براہ کرم اپنے اکاؤنٹ میں لاگ ان کر کے آرڈر کی تصدیق کریں۔

Angel Baby Dresses`;
    }
    return `Hello! ✨

Your custom design quote is ready!

Design Number: ${design.designNumber}
Price: Rs. ${design.quotedPrice}
Time: ${design.estimatedDays} days

Please log in to confirm your order.

Angel Baby Dresses`;
  }
};

export default { sendWhatsAppMessage, sendWhatsAppTemplate, whatsappMessages };
