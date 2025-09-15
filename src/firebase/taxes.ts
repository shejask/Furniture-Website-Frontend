import { ref, get } from 'firebase/database';
import { database } from './config';

export interface TaxType {
    id: string;
    name: string;
    rate: number;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Fetch tax information by tax ID
 * @param taxId - The tax ID to fetch
 * @returns Promise<TaxType | null>
 */
export const getTaxById = async (taxId: string): Promise<TaxType | null> => {
    try {
        console.log('🔥 Firebase taxes service - fetching tax for ID:', taxId);
        const taxRef = ref(database, `/taxes/${taxId}`);
        const snapshot = await get(taxRef);
        
        console.log('🔥 Firebase taxes service - snapshot exists:', snapshot.exists());
        
        if (snapshot.exists()) {
            const taxData = snapshot.val();
            console.log('🔥 Firebase taxes service - raw tax data:', taxData);
            
            const result = {
                id: taxId,
                ...taxData
            };
            
            console.log('🔥 Firebase taxes service - formatted result:', result);
            return result;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching tax data:', error);
        return null;
    }
};

/**
 * Fetch all active taxes
 * @returns Promise<TaxType[]>
 */
export const getAllActiveTaxes = async (): Promise<TaxType[]> => {
    try {
        const taxesRef = ref(database, '/taxes');
        const snapshot = await get(taxesRef);
        
        if (snapshot.exists()) {
            const taxesData = snapshot.val();
            const taxes: TaxType[] = [];
            
            Object.keys(taxesData).forEach(key => {
                if (taxesData[key].isActive) {
                    taxes.push({
                        id: key,
                        ...taxesData[key]
                    });
                }
            });
            
            return taxes;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching taxes:', error);
        return [];
    }
};
