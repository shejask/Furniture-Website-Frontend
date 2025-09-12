'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase/config';
import { Address, getUserAddresses, saveAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/firebase/addresses';

export const useAddresses = () => {
  const [user, userLoading] = useAuthState(auth);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadAddresses = useCallback(async (isRetry = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      console.log('Loading addresses for user:', user.uid, 'Retry:', retryCount);
      const userAddresses = await getUserAddresses(user.uid);
      console.log('Loaded addresses:', userAddresses.length, userAddresses);
      setAddresses(userAddresses);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load addresses';
      setError(errorMessage);
      console.error('Error loading addresses:', error);
      
      // Retry logic
      if (retryCount < 3) { // Maximum 3 retries
        console.log('Retrying address load, attempt:', retryCount + 1);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          loadAddresses(true);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [user, retryCount]);

  // Load addresses when user changes or on mount
  useEffect(() => {
    if (userLoading) {
      // User is still loading, don't do anything
      return;
    }
    
    if (user?.uid) {
      console.log('Loading addresses for user:', user.uid);
      loadAddresses();
    } else if (user === null) { // Only clear if we know user is not authenticated
      console.log('No user, clearing addresses');
      setAddresses([]);
      setLoading(false);
    }
  }, [user, userLoading, loadAddresses]);

  const addAddress = async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      setError('User must be logged in to save addresses');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Adding new address:', address);
      const addressId = await saveAddress(user.uid, address);
      console.log('Address saved with ID:', addressId);
      await loadAddresses(); // Reload addresses
      console.log('Addresses reloaded after adding');
      return addressId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address';
      setError(errorMessage);
      console.error('Error saving address:', error);
      console.error('Error details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const editAddress = async (addressId: string, updates: Partial<Address>) => {
    if (!user) {
      setError('User must be logged in to update addresses');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Editing address:', addressId, 'with updates:', updates);
      await updateAddress(user.uid, addressId, updates);
      console.log('Address updated successfully, reloading addresses...');
      await loadAddresses(); // Reload addresses
      console.log('Addresses reloaded successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address';
      setError(errorMessage);
      console.error('Error updating address:', error);
      console.error('Error details:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeAddress = async (addressId: string) => {
    if (!user) {
      setError('User must be logged in to delete addresses');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteAddress(user.uid, addressId);
      await loadAddresses(); // Reload addresses
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';
      setError(errorMessage);
      console.error('Error deleting address:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const makeDefault = async (addressId: string) => {
    if (!user) {
      setError('User must be logged in to set default address');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      await setDefaultAddress(user.uid, addressId);
      await loadAddresses(); // Reload addresses
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default address';
      setError(errorMessage);
      console.error('Error setting default address:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  };

  return {
    addresses,
    loading,
    error,
    addAddress,
    editAddress,
    removeAddress,
    makeDefault,
    getDefaultAddress,
    refreshAddresses: loadAddresses,
  };
};
