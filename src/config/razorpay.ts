// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RGKgzpPmzy0f7N',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YdKJsANkmnub2KjBKgGQb7Xm',
  currency: 'INR',
  name: 'Furniture Store',
  description: 'Payment for furniture purchase',
  image: '/images/logo.png', // Add your logo here
  theme: {
    color: '#3399cc'
  }
};

export const RAZORPAY_OPTIONS = {
  currency: RAZORPAY_CONFIG.currency,
  receipt: '',
  payment_capture: 1,
};
