import { database } from './config';
import { ref, push, set, get, update } from 'firebase/database';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  thumbImage?: string[];
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  streetAddress: string;
  state: string;
  zip: string;
  addressName?: string;
}

export interface Order {
  id?: string;
  orderId: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  address: OrderAddress;
  paymentMethod: 'razorpay' | 'cash-delivery';
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  orderNote?: string;
  couponCode?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Save order to both customer's orders and global orders
export const saveOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const orderId = order.orderId;
    const userId = order.userId;
    
    // Prepare order data with timestamps
    const orderData = {
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to global orders collection
    const globalOrderRef = ref(database, `orders/${orderId}`);
    await set(globalOrderRef, orderData);

    // Save to customer's orders collection using orderId as the key
    const customerOrderRef = ref(database, `customers/${userId}/orders/${orderId}`);
    await set(customerOrderRef, orderData);

    console.log('Order saved successfully:', orderId);
    console.log('Saved to global orders:', `orders/${orderId}`);
    console.log('Saved to customer orders:', `customers/${userId}/orders/${orderId}`);

    return orderId;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

// Get all orders for a customer
export const getCustomerOrders = async (userId: string): Promise<Order[]> => {
  try {
    const customerOrdersRef = ref(database, `customers/${userId}/orders`);
    const snapshot = await get(customerOrdersRef);
    
    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      // Convert object to array and sort by creation date (newest first)
      const orders = Object.values(ordersData) as Order[];
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return [];
  } catch (error) {
    console.error('Error getting customer orders:', error);
    throw error;
  }
};

// Get a specific order by order ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Order;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: Order['orderStatus']): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, {
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });

    // Also update in customer's orders
    const orderSnapshot = await get(orderRef);
    if (orderSnapshot.exists()) {
      const order = orderSnapshot.val();
      const customerOrderRef = ref(database, `customers/${order.userId}/orders/${orderId}`);
      await update(customerOrderRef, {
        orderStatus: status,
        updatedAt: new Date().toISOString(),
      });
    }

    console.log('Order status updated:', orderId, status);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Update payment status
export const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus'], razorpayPaymentId?: string): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date().toISOString(),
    };

    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    await update(orderRef, updateData);

    // Also update in customer's orders
    const orderSnapshot = await get(orderRef);
    if (orderSnapshot.exists()) {
      const order = orderSnapshot.val();
      const customerOrderRef = ref(database, `customers/${order.userId}/orders/${orderId}`);
      await update(customerOrderRef, updateData);
    }

    console.log('Payment status updated:', orderId, status);
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};
