import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './config';
import { BlogType } from '@/type/BlogType';

// Helper to normalize truthy boolean values commonly stored in RTDB
const isTruthyBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value === true;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  if (typeof value === 'number') return value === 1;
  return false;
};

// Helper to get a usable ISO date string
const getNormalizedDate = (createdAt?: string, updatedAt?: string): string => {
  return createdAt || updatedAt || new Date().toISOString();
};

// Test function to verify Firebase connectivity
export const testFirebaseConnection = async () => {
    try {
        console.log('Testing Firebase connection...');
        const testRef = ref(database, '.info/connected');
        const snapshot = await get(testRef);
        console.log('Connection test result:', snapshot.val());
        return true;
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        return false;
    }
};

export const fetchBlogs = async (): Promise<BlogType[]> => {
    try {
        console.log('Fetching blogs from Firebase...');
        console.log('Database reference:', database);
        console.log('Database URL:', database.app.options.databaseURL);
        
        // Test connection first
        const isConnected = await testFirebaseConnection();
        console.log('Firebase connection status:', isConnected);
        
        // Use the correct path - blogs at root level
        const blogsRef = ref(database, 'blogs');
        console.log('Blogs reference path:', blogsRef.toString());
        
        // Get all blogs first, then filter by isPublished
        console.log('Attempting to fetch blogs...');
        const snapshot = await get(blogsRef);
        console.log('Snapshot received:', snapshot);
        console.log('Snapshot exists:', snapshot.exists());
        console.log('Snapshot has children:', snapshot.hasChildren());
        console.log('Snapshot value type:', typeof snapshot.val());
        
        if (snapshot.exists()) {
            const blogsData = snapshot.val();
            const blogKeys = Object.keys(blogsData || {});
            console.log(`Found ${blogKeys.length} blogs in Firebase`);
            const blogs: BlogType[] = [];
            let processedCount = 0;
            let publishedCount = 0;
            
            // Process each blog entry from the object structure
            for (const blogId of blogKeys) {
                processedCount++;
                const blogData = blogsData[blogId];
                const normalizedCreatedAt = getNormalizedDate(blogData?.createdAt, blogData?.updatedAt);
                const published = isTruthyBoolean(blogData?.isPublished);

                console.log(`Processing blog ${processedCount}:`, {
                    id: blogId,
                    title: blogData?.title,
                    isPublished: blogData?.isPublished,
                    normalizedPublished: published,
                    hasTitle: !!blogData?.title,
                    normalizedCreatedAt,
                    rawData: blogData
                });
                
                // Skip blogs without required fields
                if (!blogData?.title) {
                    console.log(`Skipping blog ${blogId} - missing title`);
                    continue;
                }
                
                // Only include published blogs
                if (!published) {
                    console.log(`Skipping blog ${blogId} - not published`);
                    continue;
                }
                
                publishedCount++;
                const blog: BlogType = {
                    id: blogId,
                    title: blogData.title || '',
                    category: blogData.category || 'general',
                    tag: blogData.category || 'general', // Using category as tag for now
                    date: new Date(normalizedCreatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    author: '', // No author
                    avatar: '', // No avatar
                    thumbImg: blogData.imageUrl || '',
                    coverImg: blogData.imageUrl || '',
                    subImg: [blogData.imageUrl || ''],
                    shortDesc: blogData.description || '',
                    description: blogData.content || '',
                    slug: blogData.title?.toLowerCase().replace(/\s+/g, '-') || '',
                    imageUrl: blogData.imageUrl,
                    altText: blogData.altText,
                    createdAt: normalizedCreatedAt,
                    updatedAt: blogData.updatedAt,
                    isPublished: published,
                    content: blogData.content
                };
                blogs.push(blog);
            }
            
            console.log(`Processed ${processedCount} blogs, ${publishedCount} published, returning ${blogs.length} blogs`);
            
            // Sort by creation date (newest first)
            return blogs.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return 0;
            });
        } else {
            console.log('No blogs found in Firebase at blogs path');
            console.log('Snapshot value:', snapshot.val());
            return [];
        }
    } catch (error) {
        console.error('Error fetching blogs:', error);
        console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        return [];
    }
};

export const fetchBlogById = async (blogId: string): Promise<BlogType | null> => {
    try {
        console.log(`Fetching blog by ID: ${blogId}`);
        // Use the correct path - blogs at root level
        const blogRef = ref(database, `blogs/${blogId}`);
        const snapshot = await get(blogRef);
        
        if (snapshot.exists()) {
            const blogData = snapshot.val();
            console.log('Blog data found:', blogData);
            const normalizedCreatedAt = getNormalizedDate(blogData?.createdAt, blogData?.updatedAt);
            const published = isTruthyBoolean(blogData?.isPublished);
            
            return {
                id: blogId,
                title: blogData.title || '',
                category: blogData.category || '',
                tag: blogData.category || '',
                date: new Date(normalizedCreatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                author: '', // No author
                avatar: '', // No avatar
                thumbImg: blogData.imageUrl || '',
                coverImg: blogData.imageUrl || '',
                subImg: [blogData.imageUrl || ''],
                shortDesc: blogData.description || '',
                description: blogData.content || '',
                slug: blogData.title?.toLowerCase().replace(/\s+/g, '-') || '',
                imageUrl: blogData.imageUrl,
                altText: blogData.altText,
                createdAt: normalizedCreatedAt,
                updatedAt: blogData.updatedAt,
                isPublished: published,
                content: blogData.content
            };
        } else {
            console.log(`Blog with ID ${blogId} not found at blogs/${blogId}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching blog:', error);
        return null;
    }
};
