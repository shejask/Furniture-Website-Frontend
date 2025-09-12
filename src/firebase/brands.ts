import { ref, get } from 'firebase/database';
import { database } from './config';

export interface Brand {
  id: string;
  name: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchBrands = async (): Promise<Brand[]> => {
  try {
    const brandsRef = ref(database, 'brands');
    const snapshot = await get(brandsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as any)
      })) as Brand[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
};
