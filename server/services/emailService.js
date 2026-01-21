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

// Social media and contact links
const socialLinks = {
  whatsapp: '03341542572',
  whatsappUrl: 'https://wa.me/923341542572',
  instagram: 'https://www.instagram.com/angelbabydresses_official?igsh=MWlnM3VidGJtaHMzeA==',
  facebook: 'https://www.facebook.com/share/17kYD7ba11/',
  website: process.env.CLIENT_URL || 'https://angelbabydresses.com'
};

// Common email footer with social links
const getEmailFooter = (isUrdu = false) => `
  <div style="background: linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%); padding: 30px 20px; text-align: center; margin-top: 30px;">
    <p style="color: white; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
      ${isUrdu ? 'ہم سے جڑے رہیں!' : 'Stay Connected With Us!'}
    </p>
    <div style="margin-bottom: 20px;">
      <a href="${socialLinks.whatsappUrl}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/733/733585.png" alt="WhatsApp" style="width: 32px; height: 32px;" />
      </a>
      <a href="${socialLinks.instagram}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" alt="Instagram" style="width: 32px; height: 32px;" />
      </a>
      <a href="${socialLinks.facebook}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" style="width: 32px; height: 32px;" />
      </a>
    </div>
    <p style="color: white; margin: 0 0 5px 0; font-size: 14px;">
      ${isUrdu ? 'واٹس ایپ:' : 'WhatsApp:'} <a href="${socialLinks.whatsappUrl}" style="color: white;">${socialLinks.whatsapp}</a>
    </p>
    <p style="color: white; margin: 0; font-size: 12px; opacity: 0.9;">
      ${isUrdu ? '© 2026 اینجل بیبی ڈریسز۔ جملہ حقوق محفوظ ہیں۔' : '© 2026 Angel Baby Dresses. All rights reserved.'}
    </p>
    <p style="color: white; margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">
      ${isUrdu ? 'وصیف شاہ نے بنایا 🇵🇰' : 'Made by Wasif Shah 🇵🇰'}
    </p>
  </div>
`;

// Email templates
export const emailTemplates = {
  // Order confirmation email
  orderConfirmation: (order, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu
      ? `آرڈر کی تصدیق - ${order.orderNumber} - ایڈوانس ادائیگی درکار`
      : `Order Confirmation - ${order.orderNumber} - Advance Payment Required`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">
          <img src="${item.image || ''}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">${item.ageRange || item.size || '-'} / ${item.color?.name || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">Rs. ${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const advanceAmount = order.advancePayment?.amount || Math.ceil(order.subtotal / 2);
    const finalAmount = order.finalPayment?.amount || (order.subtotal - advanceAmount);

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
          .payment-box { background: #FFF9E6; border: 2px solid #FFD700; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .payment-box h3 { color: #B8860B; margin-top: 0; }
          .account-info { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
          .important { background: #FFE4E4; border-left: 4px solid #FF69B4; padding: 15px; margin: 20px 0; }
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

            <div class="important">
              <strong>${isUrdu ? 'اہم:' : 'Important:'}</strong>
              ${isUrdu
                ? 'آپ کا آرڈر ایڈوانس ادائیگی کی تصدیق کے بعد شروع ہوگا۔'
                : 'Your order will only start production after advance payment is verified.'}
            </div>

            <div class="payment-box">
              <h3>${isUrdu ? '💳 ادائیگی کی تفصیلات' : '💳 Payment Details'}</h3>
              <p><strong>${isUrdu ? 'ایڈوانس ادائیگی (50%):' : 'Advance Payment (50%):'}</strong> <span style="font-size: 20px; color: #FF69B4;">Rs. ${advanceAmount}</span></p>
              <p><strong>${isUrdu ? 'باقی ادائیگی + شپنگ (COD):' : 'Final Payment + Shipping (COD):'}</strong> Rs. ${finalAmount} + Rs. 350/kg</p>

              <h4>${isUrdu ? 'ادائیگی کے اکاؤنٹس:' : 'Payment Accounts:'}</h4>
              <div class="account-info">
                <p><strong>JazzCash / Easypaisa:</strong> 03341542572</p>
                <p><strong>Account Name:</strong> Quratulain Syed</p>
              </div>
              <div class="account-info">
                <p><strong>Bank Transfer (HBL):</strong></p>
                <p>Account #: 16817905812303</p>
                <p>Account Name: Quratulain Syed</p>
              </div>

              <p style="color: #B8860B; margin-top: 15px;">
                ${isUrdu
                  ? '⚠️ ادائیگی کے بعد، اپنے آرڈر پیج پر اسکرین شاٹ اپلوڈ کریں یا WhatsApp پر بھیجیں۔'
                  : '⚠️ After payment, upload screenshot on your order page or send via WhatsApp.'}
              </p>
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
              ${order.discount > 0 ? `<p><strong>${isUrdu ? 'رعایت' : 'Discount'}:</strong> -Rs. ${order.discount}</p>` : ''}
              <p><strong>${isUrdu ? 'شپنگ' : 'Shipping'}:</strong> ${isUrdu ? 'ڈیلیوری پر وزن کے مطابق (350/کلو)' : 'Calculated at delivery (Rs 350/kg)'}</p>
              <hr style="border: 1px solid #FFE4E9; margin: 15px 0;">
              <p><strong>${isUrdu ? 'ابھی ادا کریں (50%)' : 'Pay Now (50%)'}:</strong> <span style="font-size: 18px; color: #FF69B4;">Rs. ${advanceAmount}</span></p>
              <p><strong>${isUrdu ? 'ڈیلیوری پر ادا کریں' : 'Pay on Delivery'}:</strong> Rs. ${finalAmount} + Shipping</p>
            </div>

            <h3>${isUrdu ? 'شپنگ ایڈریس' : 'Shipping Address'}</h3>
            <p>
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.province}<br>
              ${order.shippingAddress.phone}
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://wa.me/923471504434" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">
                ${isUrdu ? 'WhatsApp پر رابطہ کریں' : 'Contact on WhatsApp'}
              </a>
            </div>

            <p style="margin-top: 30px; color: #666; text-align: center;">
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
  },

  // Admin notification for new order
  adminNewOrder: (order) => {
    const hasScreenshot = order.advancePayment?.screenshot?.url;
    const subject = hasScreenshot
      ? `🔔 URGENT: Payment Screenshot Received - ${order.orderNumber} - Verify Now!`
      : `📦 New Order - ${order.orderNumber} - Awaiting Payment`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.ageRange || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.color?.name || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">Rs. ${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const advanceAmount = order.advancePayment?.amount || Math.ceil(order.subtotal / 2);
    const finalAmount = order.finalPayment?.amount || (order.subtotal - advanceAmount);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: ${hasScreenshot ? '3px solid #FF69B4' : '1px solid #ddd'}; }
          .header { background: ${hasScreenshot ? '#FF69B4' : '#6c757d'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .urgent-alert { background: #FFE4E4; border: 2px solid #FF69B4; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .urgent-alert h2 { color: #FF69B4; margin: 0 0 10px 0; }
          .waiting-alert { background: #FFF3CD; border: 1px solid #FFECB5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
          .payment-highlight { background: #E8F5E9; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .btn { display: inline-block; background: #FF69B4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .btn-whatsapp { background: #25D366; }
          .screenshot-box { background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${hasScreenshot ? '🔔 Payment Verification Required!' : '📦 New Order Received'}</h1>
          </div>
          <div class="content">
            ${hasScreenshot ? `
              <div class="urgent-alert">
                <h2>⚡ ACTION REQUIRED</h2>
                <p>Customer has submitted payment screenshot. Please verify immediately!</p>
              </div>
            ` : `
              <div class="waiting-alert">
                <strong>📋 Status:</strong> Waiting for customer to submit advance payment (Rs. ${advanceAmount})
              </div>
            `}

            <div class="info-box">
              <p><strong>Order Number:</strong> <span style="font-size: 18px; color: #FF69B4;">${order.orderNumber}</span></p>
              <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'N/A'}</p>
              <p><strong>Payment Status:</strong> <span style="color: ${hasScreenshot ? '#4CAF50' : '#FF9800'};">${order.paymentStatus || 'pending_advance'}</span></p>
            </div>

            <div class="payment-highlight">
              <h3 style="margin-top: 0; color: #2E7D32;">💰 Payment Summary</h3>
              <p><strong>Total Order Value:</strong> Rs. ${order.subtotal}</p>
              <p><strong>Advance Payment (50%):</strong> <span style="font-size: 20px; color: #FF69B4;">Rs. ${advanceAmount}</span></p>
              <p><strong>COD Amount:</strong> Rs. ${finalAmount} + Shipping (Rs 350/kg)</p>
            </div>

            ${hasScreenshot ? `
              <div class="screenshot-box">
                <h3 style="margin-top: 0;">📸 Payment Screenshot Submitted</h3>
                <p>Customer claims to have paid <strong>Rs. ${advanceAmount}</strong></p>
                <a href="${order.advancePayment.screenshot.url}" target="_blank" style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0;">
                  👁️ View Screenshot
                </a>
                <p style="color: #666; font-size: 12px;">Submitted at: ${order.advancePayment.submittedAt ? new Date(order.advancePayment.submittedAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : 'Just now'}</p>
              </div>
            ` : ''}

            <h3>👤 Customer Details</h3>
            <div class="info-box">
              <p><strong>Name:</strong> ${order.shippingAddress?.fullName || 'N/A'}</p>
              <p><strong>Phone:</strong> <a href="tel:${order.shippingAddress?.phone}">${order.shippingAddress?.phone || 'N/A'}</a></p>
              <p><strong>Email:</strong> ${order.shippingAddress?.email || '-'}</p>
              <p><strong>Address:</strong> ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.province || ''}</p>
            </div>

            <h3>🛍️ Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Age</th>
                  <th>Color</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.CLIENT_URL || 'https://angelbabydresses.com'}/admin/orders/${order._id}" class="btn">
                📋 Review in Admin Panel
              </a>
              <a href="https://wa.me/${order.shippingAddress?.phone?.replace(/[^0-9]/g, '')}" class="btn btn-whatsapp">
                💬 WhatsApp Customer
              </a>
            </div>

            <p style="text-align: center; color: #666; margin-top: 20px; font-size: 12px;">
              This is an automated notification from Angel Baby Dresses.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Order status update emails
  orderStatusUpdate: (order, status, extraInfo = {}) => {
    const statusConfig = {
      confirmed: {
        emoji: '✅',
        title: 'Payment Approved - Order Confirmed!',
        urduTitle: 'ادائیگی منظور - آرڈر کی تصدیق!',
        message: 'Great news! Your advance payment has been verified and your order is now confirmed. We will start working on your order soon.',
        urduMessage: 'خوشخبری! آپ کی ایڈوانس ادائیگی کی تصدیق ہو گئی ہے اور آپ کا آرڈر کنفرم ہو گیا ہے۔',
        color: '#4CAF50'
      },
      processing: {
        emoji: '🧵',
        title: 'Your Order is Being Made!',
        urduTitle: 'آپ کا آرڈر بنایا جا رہا ہے!',
        message: 'Your beautiful dress is now being carefully crafted by our skilled artisans. We will notify you once it\'s ready for shipping.',
        urduMessage: 'آپ کا خوبصورت لباس ہمارے ماہر کاریگروں کی طرف سے احتیاط سے بنایا جا رہا ہے۔',
        color: '#FF9800'
      },
      shipped: {
        emoji: '📦',
        title: 'Your Order Has Been Shipped!',
        urduTitle: 'آپ کا آرڈر شپ ہو گیا!',
        message: 'Exciting news! Your order is on its way to you.',
        urduMessage: 'خوشخبری! آپ کا آرڈر آپ کی طرف روانہ ہو گیا ہے۔',
        color: '#2196F3'
      },
      out_for_delivery: {
        emoji: '🚚',
        title: 'Out for Delivery - Get Ready!',
        urduTitle: 'ڈیلیوری کے لیے نکل گیا!',
        message: 'Your order is out for delivery and will reach you today! Please keep the COD amount ready.',
        urduMessage: 'آپ کا آرڈر ڈیلیوری کے لیے نکل گیا ہے اور آج آپ تک پہنچ جائے گا! براہ کرم COD رقم تیار رکھیں۔',
        color: '#9C27B0'
      },
      delivered: {
        emoji: '🎉',
        title: 'Order Delivered Successfully!',
        urduTitle: 'آرڈر کامیابی سے ڈیلیور ہو گیا!',
        message: 'Your order has been delivered! We hope your little one loves their new dress. Thank you for shopping with Angel Baby Dresses!',
        urduMessage: 'آپ کا آرڈر ڈیلیور ہو گیا! امید ہے آپ کے بچے کو ان کا نیا لباس پسند آئے گا۔ Angel Baby Dresses سے خریداری کا شکریہ!',
        color: '#4CAF50'
      },
      cancelled: {
        emoji: '❌',
        title: 'Order Cancelled',
        urduTitle: 'آرڈر منسوخ',
        message: 'Your order has been cancelled. If you have any questions, please contact us.',
        urduMessage: 'آپ کا آرڈر منسوخ کر دیا گیا ہے۔ اگر آپ کے کوئی سوالات ہیں تو براہ کرم ہم سے رابطہ کریں۔',
        color: '#f44336'
      }
    };

    const config = statusConfig[status] || {
      emoji: '📋',
      title: `Order Update - ${status}`,
      urduTitle: `آرڈر اپڈیٹ - ${status}`,
      message: `Your order status has been updated to: ${status}`,
      urduMessage: `آپ کے آرڈر کی حیثیت اپڈیٹ ہو گئی ہے`,
      color: '#607D8B'
    };

    const lang = extraInfo.lang || 'en';
    const isUrdu = lang === 'ur';

    const subject = `${config.emoji} ${isUrdu ? config.urduTitle : config.title} - ${order.orderNumber}`;

    const trackingHtml = (status === 'shipped' || status === 'out_for_delivery') && order.trackingNumber ? `
      <div style="background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="margin-top: 0; color: #1976D2;">📍 ${isUrdu ? 'ٹریکنگ کی معلومات' : 'Tracking Information'}</h3>
        <p><strong>${isUrdu ? 'کورئیر سروس:' : 'Courier Service:'}</strong> ${extraInfo.courierService || order.shippingCarrier || 'Standard Courier'}</p>
        <p><strong>${isUrdu ? 'ٹریکنگ نمبر:' : 'Tracking Number:'}</strong></p>
        <p style="font-size: 24px; color: #1976D2; font-weight: bold; background: white; padding: 10px; border-radius: 4px;">${order.trackingNumber}</p>
        ${order.trackingUrl ? `<a href="${order.trackingUrl}" style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">${isUrdu ? 'آرڈر ٹریک کریں' : 'Track Your Order'}</a>` : ''}
      </div>
    ` : '';

    const codHtml = (status === 'shipped' || status === 'out_for_delivery') && order.finalPayment?.amount ? `
      <div style="background: #FFF9E6; border: 2px solid #FFD700; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #B8860B;">💵 ${isUrdu ? 'ڈیلیوری پر ادائیگی' : 'Cash on Delivery Amount'}</h4>
        <p style="font-size: 24px; color: #FF69B4; font-weight: bold;">Rs. ${order.finalPayment.amount.toLocaleString()}</p>
        <p style="color: #666; font-size: 12px;">${isUrdu ? 'براہ کرم یہ رقم ڈیلیوری پر تیار رکھیں' : 'Please keep this amount ready for the delivery person'}</p>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html dir="${isUrdu ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Open Sans', sans-serif"}; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: ${config.color}; padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .header .emoji { font-size: 48px; display: block; margin-bottom: 10px; }
          .content { padding: 30px; }
          .order-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .status-badge { display: inline-block; background: ${config.color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="emoji">${config.emoji}</span>
            <h1>${isUrdu ? config.urduTitle : config.title}</h1>
          </div>
          <div class="content">
            <div class="order-info">
              <p><strong>${isUrdu ? 'آرڈر نمبر:' : 'Order Number:'}</strong> <span style="color: #FF69B4; font-size: 18px;">${order.orderNumber}</span></p>
              <p><strong>${isUrdu ? 'موجودہ حیثیت:' : 'Current Status:'}</strong> <span class="status-badge">${status.replace(/_/g, ' ').toUpperCase()}</span></p>
            </div>

            <p style="font-size: 16px; line-height: 1.6;">${isUrdu ? config.urduMessage : config.message}</p>

            ${trackingHtml}
            ${codHtml}

            ${extraInfo.adminNotes ? `
              <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>${isUrdu ? 'نوٹ:' : 'Note:'}</strong> ${extraInfo.adminNotes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://angelbabydresses.com'}/orders/${order._id}" style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">
                ${isUrdu ? 'آرڈر کی تفصیلات دیکھیں' : 'View Order Details'}
              </a>
              <a href="https://wa.me/923471504434" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">
                ${isUrdu ? 'WhatsApp پر رابطہ کریں' : 'Contact on WhatsApp'}
              </a>
            </div>
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

  // Payment approved email
  paymentApproved: (order, paymentType = 'advance') => {
    const isAdvance = paymentType === 'advance';
    const subject = isAdvance
      ? `✅ Advance Payment Approved - Order #${order.orderNumber} Confirmed!`
      : `✅ Final Payment Approved - Order #${order.orderNumber} Complete!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Open Sans', sans-serif; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: #4CAF50; padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; }
          .success-box { background: #E8F5E9; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .amount { font-size: 28px; color: #4CAF50; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Approved!</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <p>Your ${isAdvance ? 'advance' : 'final'} payment has been verified!</p>
              <p class="amount">Rs. ${isAdvance ? order.advancePayment?.amount : order.finalPayment?.amount}</p>
            </div>

            <p><strong>Order Number:</strong> ${order.orderNumber}</p>

            ${isAdvance ? `
              <p>Your order is now <strong>confirmed</strong> and will start production soon. We'll keep you updated on the progress.</p>
              <div style="background: #FFF9E6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Remaining Payment (COD):</strong> Rs. ${order.finalPayment?.amount || 'TBD'} + Shipping</p>
                <p style="font-size: 12px; color: #666;">This will be collected when your order is delivered.</p>
              </div>
            ` : `
              <p>Your order is now <strong>fully paid</strong>! Thank you for your purchase.</p>
            `}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://angelbabydresses.com'}/orders" style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                View My Orders
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Payment rejected email
  paymentRejected: (order, reason, paymentType = 'advance') => {
    const subject = `❌ Payment Rejected - Order #${order.orderNumber} - Action Required`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Open Sans', sans-serif; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: #f44336; padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; }
          .alert-box { background: #FFEBEE; border: 2px solid #f44336; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Rejected</h1>
          </div>
          <div class="content">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>

            <div class="alert-box">
              <p><strong>Reason:</strong> ${reason || 'Payment could not be verified'}</p>
            </div>

            <p>Please submit a new payment screenshot. Make sure:</p>
            <ul>
              <li>The payment amount matches: <strong>Rs. ${paymentType === 'advance' ? order.advancePayment?.amount : order.finalPayment?.amount}</strong></li>
              <li>The screenshot is clear and shows the transaction details</li>
              <li>Payment was made to the correct account</li>
            </ul>

            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Payment Accounts:</strong></p>
              <p>JazzCash/Easypaisa: 03341542572</p>
              <p>Bank (HBL): 16817905812303</p>
              <p>Account Name: Quratulain Syed</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://angelbabydresses.com'}/orders/${order._id}" style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                Submit New Payment
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Shipping charges set notification email
  shippingChargesSet: (order, shippingInfo) => {
    const { weightKg, shippingCost, remainingProductCost, codAmount } = shippingInfo;

    const subject = `📦 Shipping Update - Order #${order.orderNumber} - COD Amount: Rs ${codAmount.toLocaleString()}`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9;">
          ${item.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9; text-align: center;">${item.ageRange || item.size || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #FFE4E9; text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Open Sans', Arial, sans-serif; background: #FFF5F5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FFC0CB, #FFB6C1); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .header .emoji { font-size: 48px; display: block; margin-bottom: 10px; }
          .content { padding: 30px; }
          .order-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .shipping-box { background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .cod-box { background: #FFF9E6; border: 2px solid #FFD700; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .cod-amount { font-size: 32px; color: #FF69B4; font-weight: bold; }
          .breakdown { background: #FFF5F5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #FFC0CB; color: white; padding: 12px; text-align: left; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="emoji">📦</span>
            <h1>Your Order is Ready for Shipping!</h1>
          </div>
          <div class="content">
            <p>Dear ${order.shippingAddress?.fullName || 'Customer'},</p>

            <p>Great news! Your order has been prepared and weighed for shipping. Here are your shipping and payment details:</p>

            <div class="order-info">
              <p><strong>Order Number:</strong> <span style="color: #FF69B4; font-size: 18px;">${order.orderNumber}</span></p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div class="shipping-box">
              <h3 style="margin-top: 0; color: #1976D2;">⚖️ Package Details</h3>
              <p><strong>Package Weight:</strong> <span style="font-size: 20px;">${weightKg} kg</span></p>
              <p><strong>Shipping Rate:</strong> Rs 350 per kg</p>
              <p><strong>Shipping Cost:</strong> <span style="font-size: 20px; color: #2196F3;">Rs ${shippingCost.toLocaleString()}</span></p>
            </div>

            <div class="cod-box">
              <h3 style="margin-top: 0; color: #B8860B;">💵 Cash on Delivery Amount</h3>
              <p class="cod-amount">Rs ${codAmount.toLocaleString()}</p>
              <p style="color: #666; margin-bottom: 0;">Please keep this exact amount ready for the delivery person</p>
            </div>

            <div class="breakdown">
              <h3 style="margin-top: 0;">📋 Payment Breakdown</h3>
              <table style="width: 100%;">
                <tr>
                  <td>Order Subtotal:</td>
                  <td style="text-align: right;">Rs ${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Advance Paid (50%):</td>
                  <td style="text-align: right; color: #4CAF50;">- Rs ${order.advancePayment.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Remaining Product Cost:</td>
                  <td style="text-align: right;">Rs ${remainingProductCost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Shipping (${weightKg}kg × Rs 350):</td>
                  <td style="text-align: right;">Rs ${shippingCost.toLocaleString()}</td>
                </tr>
                <tr style="border-top: 2px solid #FFE4E9;">
                  <td style="padding-top: 10px;"><strong>Total COD Amount:</strong></td>
                  <td style="text-align: right; padding-top: 10px;"><strong style="color: #FF69B4; font-size: 18px;">Rs ${codAmount.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            <h3>🛍️ Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Size</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <h3>📍 Delivery Address</h3>
            <div class="order-info">
              <p style="margin: 0;">
                ${order.shippingAddress?.fullName}<br>
                ${order.shippingAddress?.address}<br>
                ${order.shippingAddress?.city}, ${order.shippingAddress?.province}<br>
                ${order.shippingAddress?.phone}
              </p>
            </div>

            <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>✅ What happens next?</strong></p>
              <p style="margin: 10px 0 0 0;">Your order will be handed over to our courier partner soon. We'll send you tracking details once the order is shipped!</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'https://angelbabydresses.com'}/orders/${order._id}" style="display: inline-block; background: #FF69B4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">
                View Order Details
              </a>
              <a href="https://wa.me/923471504434" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">
                Contact on WhatsApp
              </a>
            </div>

            <p style="margin-top: 30px; color: #666; text-align: center;">
              Thank you for shopping with Angel Baby Dresses! 🎀
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

  // Admin notification for payment screenshot submission
  adminPaymentScreenshot: (order, paymentType = 'advance') => {
    const isAdvance = paymentType === 'advance';
    const amount = isAdvance
      ? (order.advancePayment?.amount || Math.ceil(order.subtotal / 2))
      : (order.finalPayment?.amount || Math.ceil(order.subtotal / 2));

    const screenshot = isAdvance
      ? order.advancePayment?.screenshot
      : order.finalPayment?.screenshot;

    const subject = `🔔 URGENT: ${isAdvance ? 'Advance' : 'Final'} Payment Screenshot - ${order.orderNumber} - Verify Now!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 3px solid #FF69B4; }
          .header { background: #FF69B4; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .urgent-alert { background: #FFE4E4; border: 2px solid #FF69B4; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .urgent-alert h2 { color: #FF69B4; margin: 0 0 10px 0; }
          .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
          .payment-highlight { background: #E8F5E9; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .screenshot-box { background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .btn { display: inline-block; background: #FF69B4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .btn-whatsapp { background: #25D366; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 ${isAdvance ? 'Advance' : 'Final'} Payment Verification Required!</h1>
          </div>
          <div class="content">
            <div class="urgent-alert">
              <h2>⚡ ACTION REQUIRED</h2>
              <p>Customer has submitted ${isAdvance ? 'advance (50%)' : 'final'} payment screenshot. Please verify immediately!</p>
            </div>

            <div class="info-box">
              <p><strong>Order Number:</strong> <span style="font-size: 18px; color: #FF69B4;">${order.orderNumber}</span></p>
              <p><strong>Order Type:</strong> ${order.customDesign ? '🎨 Custom Design Order' : '🛍️ Regular Order'}</p>
              <p><strong>Payment Type:</strong> ${isAdvance ? 'Advance Payment (50%)' : 'Final Payment'}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'N/A'}</p>
            </div>

            <div class="payment-highlight">
              <h3 style="margin-top: 0; color: #2E7D32;">💰 Payment Details</h3>
              <p><strong>Amount Claimed:</strong> <span style="font-size: 24px; color: #FF69B4;">Rs. ${amount}</span></p>
              <p><strong>Total Order Value:</strong> Rs. ${order.subtotal}</p>
            </div>

            <div class="screenshot-box">
              <h3 style="margin-top: 0;">📸 Payment Screenshot</h3>
              <p>Please verify the payment details in the screenshot below:</p>
              ${screenshot?.url ? `
                <a href="${screenshot.url}" target="_blank" style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0;">
                  👁️ View Screenshot
                </a>
              ` : '<p style="color: red;">Screenshot URL not available</p>'}
              <p style="color: #666; font-size: 12px;">Submitted at: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
            </div>

            <h3>👤 Customer Details</h3>
            <div class="info-box">
              <p><strong>Name:</strong> ${order.shippingAddress?.fullName || order.user?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> <a href="tel:${order.shippingAddress?.phone}">${order.shippingAddress?.phone || 'N/A'}</a></p>
              <p><strong>Email:</strong> ${order.shippingAddress?.email || order.user?.email || '-'}</p>
              <p><strong>Address:</strong> ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.province || ''}</p>
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.CLIENT_URL || 'https://angelbabydresses.com'}/admin/orders/${order._id}" class="btn">
                ✅ Review & Approve in Admin
              </a>
              <a href="https://wa.me/${(order.shippingAddress?.phone || '').replace(/[^0-9]/g, '')}" class="btn btn-whatsapp">
                💬 WhatsApp Customer
              </a>
            </div>

            <p style="text-align: center; color: #666; margin-top: 20px; font-size: 12px;">
              This is an automated notification from Angel Baby Dresses.<br>
              Please verify the payment as soon as possible to avoid delays.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Thank you email after order completion
  orderCompleted: (order, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu
      ? `شکریہ! آپ کا آرڈر مکمل ہو گیا - ${order.orderNumber} 🎀`
      : `Thank You! Your Order is Complete - ${order.orderNumber} 🎀`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .thank-you-box { background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px; }
          .thank-you-box h2 { color: #2E7D32; margin: 0 0 10px 0; font-size: 24px; }
          .order-summary { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
          .review-box { background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px; }
          .btn { display: inline-block; background: #FF69B4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 10px 5px; }
          .btn-review { background: #FF9800; }
          .btn-whatsapp { background: #25D366; }
          .promo-box { background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ${isUrdu ? 'آپ کا شکریہ!' : 'Thank You!'}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${isUrdu ? 'آپ کا آرڈر کامیابی سے مکمل ہو گیا' : 'Your order has been successfully completed'}</p>
          </div>
          <div class="content">
            <div class="thank-you-box">
              <h2>✨ ${isUrdu ? 'ہم آپ کے شکر گزار ہیں!' : 'We Appreciate You!'} ✨</h2>
              <p style="color: #388E3C; margin: 0; font-size: 16px;">
                ${isUrdu
                  ? 'Angel Baby Dresses سے خریداری کرنے کا شکریہ۔ ہمیں امید ہے کہ آپ کو اپنا نیا لباس پسند آئے گا!'
                  : 'Thank you for shopping with Angel Baby Dresses. We hope your little one loves their new outfit!'}
              </p>
            </div>

            <div class="order-summary">
              <h3 style="margin-top: 0; color: #333;">📦 ${isUrdu ? 'آرڈر کا خلاصہ' : 'Order Summary'}</h3>
              <p><strong>${isUrdu ? 'آرڈر نمبر:' : 'Order Number:'}</strong> ${order.orderNumber}</p>
              <p><strong>${isUrdu ? 'کل رقم:' : 'Total Amount:'}</strong> Rs. ${order.total?.toLocaleString()}</p>
              <p><strong>${isUrdu ? 'ڈیلیوری پتہ:' : 'Delivered To:'}</strong> ${order.shippingAddress?.fullName}, ${order.shippingAddress?.city}</p>
            </div>

            <div class="review-box">
              <h3 style="margin-top: 0; color: #E65100;">⭐ ${isUrdu ? 'اپنا جائزہ دیں!' : 'Share Your Experience!'} ⭐</h3>
              <p style="color: #F57C00; margin-bottom: 20px;">
                ${isUrdu
                  ? 'ہمیں بتائیں کہ آپ کو ہماری مصنوعات کیسی لگیں۔ آپ کی رائے ہمارے لیے بہت اہم ہے!'
                  : 'We\'d love to hear what you think about your purchase. Your feedback helps us improve!'}
              </p>
              <a href="${socialLinks.website}/orders/${order._id}" class="btn btn-review">
                ✍️ ${isUrdu ? 'جائزہ لکھیں' : 'Write a Review'}
              </a>
            </div>

            <div class="promo-box">
              <h3 style="margin-top: 0; color: #C2185B;">🛍️ ${isUrdu ? 'مزید خریداری کریں!' : 'Shop More!'}</h3>
              <p style="color: #AD1457; margin-bottom: 15px;">
                ${isUrdu
                  ? 'ہمارے نئے کلیکشن اور خصوصی آفرز دیکھیں'
                  : 'Check out our new collections and exclusive offers'}
              </p>
              <a href="${socialLinks.website}/shop" class="btn">
                🛒 ${isUrdu ? 'ابھی خریدیں' : 'Shop Now'}
              </a>
            </div>

            <div style="text-align: center; margin-top: 25px;">
              <p style="color: #666; margin-bottom: 15px;">
                ${isUrdu ? 'کوئی سوال ہے؟ ہم سے رابطہ کریں!' : 'Have questions? Contact us!'}
              </p>
              <a href="${socialLinks.whatsappUrl}" class="btn btn-whatsapp">
                💬 WhatsApp: ${socialLinks.whatsapp}
              </a>
            </div>
          </div>
          ${getEmailFooter(isUrdu)}
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // Sale promotion email
  salePromotion: (sale, products, lang = 'en') => {
    const isUrdu = lang === 'ur';
    const subject = isUrdu
      ? `🔥 بڑی سیل! ${sale.name} - ${sale.discountPercentage}% رعایت! 🔥`
      : `🔥 Big Sale! ${sale.name} - ${sale.discountPercentage}% OFF! 🔥`;

    const productsHtml = products.slice(0, 6).map(product => `
      <div style="display: inline-block; width: 45%; margin: 10px 2%; vertical-align: top; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <img src="${product.images?.[0]?.url || ''}" alt="${product.name?.en || product.name}" style="width: 100%; height: 150px; object-fit: cover;" />
        <div style="padding: 10px;">
          <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px; color: #333;">${product.name?.en || product.name}</p>
          <p style="margin: 0;">
            <span style="text-decoration: line-through; color: #999; font-size: 12px;">Rs. ${product.price}</span>
            <span style="color: #FF69B4; font-weight: bold; font-size: 16px; margin-left: 5px;">Rs. ${Math.round(product.price * (1 - sale.discountPercentage / 100))}</span>
          </p>
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #FF1744 0%, #FF69B4 100%); color: white; padding: 30px; text-align: center; }
          .discount-badge { display: inline-block; background: #FFEB3B; color: #333; padding: 10px 25px; border-radius: 25px; font-size: 24px; font-weight: bold; margin: 15px 0; }
          .content { padding: 30px; }
          .products-grid { text-align: center; margin: 20px 0; }
          .btn { display: inline-block; background: #FF69B4; color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; margin: 20px 0; }
          .urgency-box { background: #FFF3E0; border: 2px dashed #FF9800; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🎉 ${sale.name} 🎉</h1>
            <div class="discount-badge">${sale.discountPercentage}% OFF!</div>
            <p style="margin: 10px 0 0 0; font-size: 16px;">
              ${isUrdu ? 'بچوں کے خوبصورت کپڑوں پر زبردست رعایت!' : 'Amazing discounts on beautiful kids\' clothing!'}
            </p>
          </div>
          <div class="content">
            <div class="urgency-box">
              <p style="margin: 0; color: #E65100; font-weight: bold; font-size: 16px;">
                ⏰ ${isUrdu ? 'محدود وقت کی پیشکش!' : 'Limited Time Offer!'}
              </p>
              <p style="margin: 5px 0 0 0; color: #F57C00;">
                ${isUrdu ? 'سیل ختم ہونے سے پہلے خریداری کریں' : 'Shop before the sale ends'}:
                <strong>${new Date(sale.endDate).toLocaleDateString('en-PK')}</strong>
              </p>
            </div>

            <h2 style="text-align: center; color: #333;">🛍️ ${isUrdu ? 'سیل کی مصنوعات' : 'Sale Products'}</h2>
            <div class="products-grid">
              ${productsHtml}
            </div>

            <div style="text-align: center;">
              <a href="${socialLinks.website}/shop?sale=${sale._id}" class="btn">
                🛒 ${isUrdu ? 'ابھی خریدیں' : 'Shop Now'}
              </a>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #FCE4EC; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #C2185B; font-weight: bold;">
                ${isUrdu ? 'سوالات ہیں؟ ہم سے بات کریں!' : 'Questions? Chat with us!'}
              </p>
              <a href="${socialLinks.whatsappUrl}" style="display: inline-block; background: #25D366; color: white; padding: 12px 25px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                💬 WhatsApp: ${socialLinks.whatsapp}
              </a>
            </div>
          </div>
          ${getEmailFooter(isUrdu)}
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }
};

export { socialLinks };
export default { sendEmail, emailTemplates, socialLinks };
