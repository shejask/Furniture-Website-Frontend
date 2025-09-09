import { ref, get } from 'firebase/database'
import { database } from './config'
import { CategoryType } from '@/type/CategoryType'

export const fetchCategories = async (): Promise<CategoryType[]> => {
  try {
    const categoriesRef = ref(database, '/categories')
    const snapshot = await get(categoriesRef)
    if (!snapshot.exists()) return []

    const data = snapshot.val() as Record<string, Partial<CategoryType>>
    const categories: CategoryType[] = Object.entries(data)
      .map(([id, value]) => ({
        id,
        name: value.name || '',
        description: value.description,
        metaTitle: value.metaTitle,
        metaDescription: value.metaDescription,
        icon: value.icon,
        image: value.image,
        showInMainMenu: value.showInMainMenu ?? false,
        createdAt: value.createdAt,
        updatedAt: value.updatedAt
      }))
      .filter((c) => !!c.name)

    return categories
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}


