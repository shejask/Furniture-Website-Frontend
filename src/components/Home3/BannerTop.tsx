'use client'

import React, { useEffect, useState } from 'react'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'

interface Props {
    props: string
    textColor: string
    bgLine: string
}

interface Notification {
    id: string
    title: string
    message: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

const BannerTop = ({ props, textColor, bgLine }: Props) => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const notificationsRef = ref(database, '/notifications')

        const fetchNotifications = async () => {
            try {
                const snapshot = await get(notificationsRef)
                
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const notificationsList = Object.entries(data)
                        .map(([id, value]) => ({
                            id,
                            ...(value as object)
                        }))
                        .filter((item): item is Notification => {
                            const notification = item as Notification
                            return notification.isActive === true
                        })
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    
                    setNotifications(notificationsList)
                } else {
                    setNotifications([])
                }
                setLoading(false)
            } catch (err) {
                console.error('Error fetching notifications:', err)
                setError('Failed to fetch notifications')
                setLoading(false)
            }
        }

        fetchNotifications()

        const refreshInterval = setInterval(fetchNotifications, 30000)

        return () => {
            clearInterval(refreshInterval)
        }
    }, [])

    // Rotate messages every 3 seconds
    useEffect(() => {
        if (notifications.length === 0) return
        setCurrentIndex(0)
        const rotate = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % notifications.length)
        }, 4000)
        return () => clearInterval(rotate)
    }, [notifications.length])

    if (loading) {
        return <div className={`banner-top ${props}`} />
    }

    if (error || notifications.length === 0) {
        return null
    }

    return (
        <div className={`banner-top ${props} w-full flex items-center justify-center`}>
            {notifications.length > 0 && (
                <div
                    key={notifications[currentIndex].id}
                    className={`text-button-uppercase px-8 text-center ${textColor}`}
                >
                    {notifications[currentIndex].message}
                </div>
            )}
        </div>
    )
}

export default BannerTop