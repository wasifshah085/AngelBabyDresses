import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
export const emailTemplates = {
  // Order confirmation email
  orderConfirmation: (order, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu
      ? `آرڈر کی تصدیق - ${order.orderNumber}`
      : `Order Confirmation - ${order.orderNumber}`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">
          <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">${item.size} / ${item.color?.name || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">Rs. ${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="${isUrdu ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Open Sans', sans-serif"}; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FFC0CB, #FFB6C1); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .order-number { background: #FFF5F5; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .order-number span { color: #FF69B4; font-size: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #FFC0CB; color: white; padding: 12px; text-align: ${isUrdu ? 'right' : 'left'}; }
          .total { background: #FFF5F5; padding: 20px; margin-top: 20px; border-radius: 8px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Angel Baby Dresses</h1>
          </div>
          <div class="content">
            <h2>${isUrdu ? 'آرڈر کی تصدیق کا شکریہ!' : 'Thank You for Your Order!'}</h2>
            <div class="order-number">
              <p>${isUrdu ? 'آرڈر نمبر' : 'Order Number'}</p>
              <span>${order.orderNumber}</span>
            </div>

            <h3>${isUrdu ? 'آرڈر کی تفصیلات' : 'Order Details'}</h3>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>${isUrdu ? 'پروڈکٹ' : 'Product'}</th>
                  <th>${isUrdu ? 'سائز/رنگ' : 'Size/Color'}</th>
                  <th>${isUrdu ? 'تعداد' : 'Qty'}</th>
                  <th>${isUrdu ? 'قیمت' : 'Price'}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total">
              <p><strong>${isUrdu ? 'ذیلی کل' : 'Subtotal'}:</strong> Rs. ${order.subtotal}</p>
              <p><strong>${isUrdu ? 'شپنگ' : 'Shipping'}:</strong> Rs. ${order.shippingCost}</p>
              ${order.discount > 0 ? `<p><strong>${isUrdu ? 'رعایت' : 'Discount'}:</strong> -Rs. ${order.discount}</p>` : ''}
              <p style="font-size: 18px; color: #FF69B4;"><strong>${isUrdu ? 'کل' : 'Total'}:</strong> Rs. ${order.total}</p>
            </div>

            <h3>${isUrdu ? 'شپنگ ایڈریس' : 'Shipping Address'}</h3>
            <p>
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.province}<br>
              ${order.shippingAddress.phone}
            </p>

            <p style="margin-top: 30px; color: #666;">
              ${isUrdu
                ? 'اگر آپ کے کوئی سوالات ہیں تو براہ کرم ہم سے رابطہ کریں۔'
                : 'If you have any questions, please contact us.'}
            </p>
          </div>
          <div class="footer">
            <p>Angel Baby Dresses</p>
            <p>Beautiful Clothes for Beautiful Kids</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Order shipped email
  orderShipped: (order, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu
      ? `آپ کا آرڈر شپ ہو گیا - ${order.orderNumber}`
      : `Your Order Has Been Shipped - ${order.orderNumber}`;

    const html = `
      <!DOCTYPE html>
      <html dir="${isUrdu ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Open Sans', sans-serif"}; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #FFC0CB, #FFB6C1); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; }
          .tracking-box { background: #FFF5F5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .tracking-number { font-size: 24px; color: #FF69B4; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Angel Baby Dresses</h1>
          </div>
          <div class="content">
            <h2>${isUrdu ? 'آپ کا آرڈر شپ ہو گیا!' : 'Your Order Has Been Shipped!'}</h2>
            <p>${isUrdu ? 'آرڈر نمبر' : 'Order Number'}: <strong>${order.orderNumber}</strong></p>

            ${order.trackingNumber ? `
              <div class="tracking-box">
                <p>${isUrdu ? 'ٹریکنگ نمبر' : 'Tracking Number'}</p>
                <p class="tracking-number">${order.trackingNumber}</p>
                ${order.trackingUrl ? `<a href="${order.trackingUrl}" style="color: #FF69B4;">${isUrdu ? 'آرڈر ٹریک کریں' : 'Track Your Order'}</a>` : ''}
              </div>
            ` : ''}

            <p>${isUrdu
              ? 'آپ کا آرڈر جلد آپ تک پہنچ جائے گا۔'
              : 'Your order is on its way and will arrive soon.'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Password reset email
  passwordReset: (resetUrl, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu ? 'پاس ورڈ ری سیٹ' : 'Password Reset Request';

    const html = `
      <!DOCTYPE html>
      <html dir="${isUrdu ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Open Sans', sans-serif"}; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #FFC0CB, #FFB6C1); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; text-align: center; }
          .button { display: inline-block; background: #FF69B4; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Angel Baby Dresses</h1>
          </div>
          <div class="content">
            <h2>${isUrdu ? 'پاس ورڈ ری سیٹ کی درخواست' : 'Password Reset Request'}</h2>
            <p>${isUrdu
              ? 'آپ نے پاس ورڈ ری سیٹ کی درخواست کی ہے۔ نیچے دیے گئے بٹن پر کلک کریں۔'
              : 'You requested a password reset. Click the button below to reset your password.'}</p>
            <a href="${resetUrl}" class="button">${isUrdu ? 'پاس ورڈ ری سیٹ کریں' : 'Reset Password'}</a>
            <p style="color: #666; font-size: 12px;">${isUrdu
              ? 'یہ لنک 10 منٹ بعد ختم ہو جائے گا۔'
              : 'This link will expire in 10 minutes.'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Custom design quote email
  customDesignQuote: (design, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu
      ? `کسٹم ڈیزائن کوٹ - ${design.designNumber}`
      : `Custom Design Quote - ${design.designNumber}`;

    const html = `
      <!DOCTYPE html>
      <html dir="${isUrdu ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Open Sans', sans-serif"}; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #FFC0CB, #FFB6C1); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; }
          .quote-box { background: #FFF5F5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .price { font-size: 28px; color: #FF69B4; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Angel Baby Dresses</h1>
          </div>
          <div class="content">
            <h2>${isUrdu ? 'آپ کے کسٹم ڈیزائن کا کوٹ' : 'Your Custom Design Quote'}</h2>
            <p>${isUrdu ? 'ڈیزائن نمبر' : 'Design Number'}: <strong>${design.designNumber}</strong></p>

            <div class="quote-box">
              <p>${isUrdu ? 'تخمینہ قیمت' : 'Estimated Price'}</p>
              <p class="price">Rs. ${design.quotedPrice}</p>
              <p>${isUrdu ? 'تخمینہ وقت' : 'Estimated Time'}: ${design.estimatedDays} ${isUrdu ? 'دن' : 'days'}</p>
            </div>

            ${design.designerNotes ? `
              <h3>${isUrdu ? 'ڈیزائنر کے نوٹس' : 'Designer Notes'}</h3>
              <p>${design.designerNotes}</p>
            ` : ''}

            <p>${isUrdu
              ? 'براہ کرم اپنے اکاؤنٹ میں لاگ ان کر کے آرڈر کی تصدیق کریں۔'
              : 'Please log in to your account to confirm and place the order.'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }
};

export default { sendEmail, emailTemplates };
