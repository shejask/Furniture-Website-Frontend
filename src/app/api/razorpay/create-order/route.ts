import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/utils/razorpay';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const result = await createRazorpayOrder(amount, currency);

    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in create-order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
