import Razorpay from 'razorpay';
import { RAZORPAY_CONFIG, RAZORPAY_OPTIONS } from '@/config/razorpay';

// Initialize Razorpay instance (server-side only)
export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_CONFIG.key_id,
  key_secret: RAZORPAY_CONFIG.key_secret,
});

// Create order function
export const createRazorpayOrder = async (amount: number, currency: string = 'INR') => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
};

// Verify payment signature
export const verifyRazorpayPayment = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_CONFIG.key_secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

// Client-side payment options generator
export const generateRazorpayOptions = (
  orderId: string,
  amount: number,
  userDetails: {
    name: string;
    email: string;
    contact: string;
  },
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  return {
    key: RAZORPAY_CONFIG.key_id,
    amount: amount * 100, // Amount in paise
    currency: RAZORPAY_CONFIG.currency,
    name: RAZORPAY_CONFIG.name,
    description: RAZORPAY_CONFIG.description,
    image: RAZORPAY_CONFIG.image,
    order_id: orderId,
    handler: onSuccess,
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.contact,
    },
    theme: RAZORPAY_CONFIG.theme,
    modal: {
      ondismiss: onFailure,
    },
  };
};
