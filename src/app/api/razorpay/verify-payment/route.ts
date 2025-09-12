import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPayment } from '@/utils/razorpay';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isValid) {
      // Here you can add your order processing logic
      // e.g., update database, send confirmation email, etc.
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
      });
    } else {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in verify-payment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
