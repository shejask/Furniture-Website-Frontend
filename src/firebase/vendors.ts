import { ref, push, set, get } from 'firebase/database'
import { database } from './config'
import { VendorSignupType } from '@/type/VendorSignupType'

export interface Vendor {
  id: string
  businessName?: string
  storeName?: string
  name?: string
  email?: string
  phone?: string
  mobile?: string
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export const saveVendorSignup = async (data: Omit<VendorSignupType, 'id' | 'createdAt'>) => {
  const createdAt = new Date().toISOString()
  const node = ref(database, '/vendors_signups')
  const newRef = push(node)
  const record: VendorSignupType = { ...data, createdAt, id: newRef.key || undefined }
  await set(newRef, record)
  return record
}

export const fetchVendors = async (): Promise<Vendor[]> => {
  try {
    const vendorsRef = ref(database, '/vendors')
    const snapshot = await get(vendorsRef)
    if (!snapshot.exists()) return []

    const data = snapshot.val() as Record<string, Partial<Vendor>>
    const vendors: Vendor[] = Object.entries(data)
      .map(([id, value]) => ({
        id,
        businessName: value.businessName,
        storeName: value.storeName,
        name: value.name,
        email: value.email,
        phone: value.phone,
        mobile: value.mobile,
        status: value.status || 'active',
        createdAt: value.createdAt,
        updatedAt: value.updatedAt
      }))
      .filter((v) => !!(v.businessName || v.storeName || v.name))

    return vendors
  } catch (error) {
    console.error('Failed to fetch vendors:', error)
    return []
  }
}

// Get vendor details by ID
export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
  try {
    const vendorRef = ref(database, `/vendors/${vendorId}`)
    const snapshot = await get(vendorRef)
    
    if (snapshot.exists()) {
      const data = snapshot.val() as Partial<Vendor>
      return {
        id: vendorId,
        businessName: data.businessName,
        storeName: data.storeName,
        name: data.name,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        status: data.status || 'active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch vendor by ID:', error)
    return null
  }
}


