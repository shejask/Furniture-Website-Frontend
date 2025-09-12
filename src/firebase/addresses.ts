import { database } from './config';
import { ref, push, set, get, remove, update } from 'firebase/database';

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  streetAddress: string;
  state: string;
  zip: string;
  addressName?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Save a new address for a user
export const saveAddress = async (userId: string, address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const addressesRef = ref(database, `customers/${userId}/addresses`);
    const newAddressRef = push(addressesRef);
    
    const addressData = {
      ...address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(newAddressRef, addressData);
    return newAddressRef.key!;
  } catch (error) {
    console.error('Error saving address:', error);
    throw error;
  }
};

// Get all addresses for a user
export const getUserAddresses = async (userId: string): Promise<Address[]> => {
  try {
    const addressesRef = ref(database, `customers/${userId}/addresses`);
    const snapshot = await get(addressesRef);
    
    if (snapshot.exists()) {
      const addressesData = snapshot.val();
      return Object.keys(addressesData).map(key => ({
        id: key,
        ...addressesData[key]
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting addresses:', error);
    throw error;
  }
};

// Update an existing address
export const updateAddress = async (userId: string, addressId: string, updates: Partial<Address>): Promise<void> => {
  try {
    const addressRef = ref(database, `customers/${userId}/addresses/${addressId}`);
    
    // First get the existing address
    const snapshot = await get(addressRef);
    if (!snapshot.exists()) {
      throw new Error('Address does not exist');
    }

    const existingAddress = snapshot.val();
    
    // Only update the fields that have changed
    const updatedFields: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof Address] !== existingAddress[key]) {
        updatedFields[key] = updates[key as keyof Address];
      }
    });

    // If there are no changes, return early
    if (Object.keys(updatedFields).length === 0) {
      return;
    }

    // Update only the changed fields
    await update(addressRef, {
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    });

    console.log('Address updated successfully:', addressId);
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

// Delete an address
export const deleteAddress = async (userId: string, addressId: string): Promise<boolean> => {
  try {
    // First check if the address exists
    const addressRef = ref(database, `customers/${userId}/addresses/${addressId}`);
    const snapshot = await get(addressRef);
    
    if (!snapshot.exists()) {
      console.error('Address does not exist:', addressId);
      return false;
    }

    // Get all addresses first
    const allAddressesSnapshot = await get(ref(database, `customers/${userId}/addresses`));
    const allAddresses = allAddressesSnapshot.val() || {};
    const addressData = snapshot.val();
    const otherAddressIds = Object.keys(allAddresses).filter(id => id !== addressId);

    // If this is the only address, just delete it
    if (otherAddressIds.length === 0) {
      await remove(addressRef);
      console.log('Last address deleted successfully:', addressId);
      return true;
    }

    // If it's the default address, make another one default
    if (addressData.isDefault && otherAddressIds.length > 0) {
      const newDefaultRef = ref(database, `customers/${userId}/addresses/${otherAddressIds[0]}`);
      await update(newDefaultRef, { 
        isDefault: true,
        updatedAt: new Date().toISOString()
      });
      console.log('New default address set:', otherAddressIds[0]);
    }

    // Now delete the address
    await remove(addressRef);
    
    // Double check that the address was deleted
    const checkSnapshot = await get(addressRef);
    if (checkSnapshot.exists()) {
      console.error('Address still exists after deletion attempt:', addressId);
      return false;
    }

    console.log('Address deleted successfully:', addressId);
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
};

// Set an address as default
export const setDefaultAddress = async (userId: string, addressId: string): Promise<void> => {
  try {
    const addressesRef = ref(database, `customers/${userId}/addresses`);
    const snapshot = await get(addressesRef);
    
    if (snapshot.exists()) {
      const addressesData = snapshot.val();
      const updates: any = {};
      
      // Remove default from all addresses
      Object.keys(addressesData).forEach(key => {
        updates[`${key}/isDefault`] = false;
      });
      
      // Set the selected address as default
      updates[`${addressId}/isDefault`] = true;
      updates[`${addressId}/updatedAt`] = new Date().toISOString();
      
      await update(addressesRef, updates);
    }
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};
