'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BlogPage = () => {
    const router = useRouter()

    useEffect(() => {
        // Redirect to the grid blog page
        router.replace('/blog/grid')
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Redirecting to blog...</p>
            </div>
        </div>
    )
}

export default BlogPage
