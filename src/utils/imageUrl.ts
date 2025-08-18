'use client'

export const cleanImageUrl = (url: string): string => {
    // Remove localhost prefix if present
    const cleanUrl = url.replace(/^http:\/\/localhost:\d+\//, '');
    
    // If it's already an absolute URL (e.g., Firebase Storage), return as is
    if (cleanUrl.startsWith('http')) {
        return cleanUrl;
    }
    
    // Remove leading slash if present
    return cleanUrl.replace(/^\//, '');
};
