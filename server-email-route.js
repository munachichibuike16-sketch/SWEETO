// Backend Email Service for Order Notifications
// This file should be placed in your server directory (e.g., server.js or routes/email.js)

const express = require('express');
const router = express.Router();

// Email configuration (using NodeMailer or your preferred email service)
const nodemailer = require('nodemailer');

// Create transporter based on environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

// POST /send-email - Send order confirmation email
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject' 
      });
    }

    // Generate HTML email content
    const htmlContent = generateOrderConfirmationEmail(data);

    // Send email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'SWEETO Hub'}" <${process.env.EMAIL_FROM || 'noreply@sweetohub.com'}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Order confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to send email notification'
    });
  }
});

// Helper function to generate order confirmation email HTML
function generateOrderConfirmationEmail(orderData) {
  const { orderId, customerName, totalAmount, currency, orderDate, items } = orderData;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1F6FEB 0%, #1554C0 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; }
    .message { color: #64748b; line-height: 1.6; margin-bottom: 25px; }
    .order-box { background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .order-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .order-row:last-child { margin-bottom: 0; }
    .order-label { color: #64748b; font-weight: 500; }
    .order-value { color: #1e293b; font-weight: 700; }
    .total-row { border-top: 2px solid #e2e8f0; padding-top: 15px; margin-top: 15px; }
    .total-label { color: #1e293b; font-size: 16px; font-weight: 600; }
    .total-value { color: #1F6FEB; font-size: 24px; font-weight: 800; }
    .items-section { margin-top: 25px; }
    .items-title { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 15px; }
    .item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .item:last-child { border-bottom: none; }
    .item-name { color: #1e293b; font-weight: 500; font-size: 14px; }
    .item-qty { color: #64748b; font-size: 12px; margin-top: 4px; }
    .item-price { color: #1e293b; font-weight: 700; font-size: 14px; }
    .footer { background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { color: #64748b; font-size: 13px; line-height: 1.6; }
    .cta-button { display: inline-block; background: #1F6FEB; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .badge { display: inline-block; background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for shopping with SWEETO Hub</p>
      <span class="badge">✓ Order Placed Successfully</span>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${customerName || 'Valued Customer'},</div>
      
      <div class="message">
        Great news! Your order has been placed successfully and is waiting for confirmation. 
        We'll notify you once your order is confirmed and being processed.
      </div>
      
      <div class="order-box">
        <div class="order-row">
          <span class="order-label">Order Number:</span>
          <span class="order-value">${orderId || 'N/A'}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Order Date:</span>
          <span class="order-value">${orderDate || 'Today'}</span>
        </div>
        <div class="order-row">
          <span class="order-label">Items:</span>
          <span class="order-value">${items || 0} item(s)</span>
        </div>
        <div class="order-row total-row">
          <span class="total-label">Total Amount:</span>
          <span class="total-value">${currency || 'FCFA'} ${Number(totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://swto.site/#/orders" class="cta-button">Track Your Order</a>
      </div>
      
      <div class="items-section">
        <div class="items-title">📦 Order Summary</div>
        ${generateItemsList(items)}
      </div>
      
      <div class="message" style="margin-top: 25px; font-size: 13px;">
        <strong>What's Next?</strong><br>
        1️⃣ Our team will confirm your order shortly<br>
        2️⃣ You'll receive a notification when order is confirmed<br>
        3️⃣ We'll prepare and ship your items<br>
        4️⃣ Track your delivery in real-time
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <strong>SWEETO Hub</strong><br>
        Your trusted online shopping destination<br>
        Need help? Contact us at support@sweetohub.com
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper to generate items list HTML
function generateItemsList(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '<div style="color: #64748b; font-size: 14px;">No items details available</div>';
  }
  
  return items.slice(0, 5).map(item => `
    <div class="item">
      <div>
        <div class="item-name">${item.name || 'Product'}</div>
        <div class="item-qty">Qty: ${item.quantity || 1}</div>
      </div>
      <div class="item-price">${item.currency || 'FCFA'} ${Number(item.price || 0).toLocaleString()}</div>
    </div>
  `).join('');
}

module.exports = router;
