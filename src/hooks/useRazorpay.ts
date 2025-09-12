'use client';
import { useState } from 'react';
import { generateRazorpayOptions } from '@/utils/razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UserDetails {
  name: string;
  email: string;
  contact: string;
}

interface PaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const createOrder = async (amount: number, currency: string = 'INR') => {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create order');
    }
  };

  const verifyPayment = async (paymentData: PaymentData) => {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Payment verification failed');
    }
  };

  const initiatePayment = async (
    amount: number,
    userDetails: UserDetails,
    onSuccess: (data: any) => void,
    onFailure?: (error: any) => void
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create order
      const orderData = await createOrder(amount);

      // Configure payment options
      const options = generateRazorpayOptions(
        orderData.orderId,
        amount,
        userDetails,
        async (response: PaymentData) => {
          try {
            // Verify payment
            const verificationResult = await verifyPayment(response);
            onSuccess({
              ...response,
              ...verificationResult,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            setError(errorMessage);
            if (onFailure) onFailure({ error: errorMessage });
          }
        },
        (error: any) => {
          const errorMessage = 'Payment cancelled or failed';
          setError(errorMessage);
          if (onFailure) onFailure({ error: errorMessage });
        }
      );

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      setError(errorMessage);
      if (onFailure) onFailure({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    isLoading,
    error,
    setError,
  };
};
