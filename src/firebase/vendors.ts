import { ref, push, set } from 'firebase/database'
import { database } from './config'
import { VendorSignupType } from '@/type/VendorSignupType'

export const saveVendorSignup = async (data: Omit<VendorSignupType, 'id' | 'createdAt'>) => {
  const createdAt = new Date().toISOString()
  const node = ref(database, '/vendors_signups')
  const newRef = push(node)
  const record: VendorSignupType = { ...data, createdAt, id: newRef.key || undefined }
  await set(newRef, record)
  return record
}


