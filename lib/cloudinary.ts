/**
 * Cloudinary utilities for image handling
 * 
 * Note: This file uses browser-compatible methods for Cloudinary operations
 * instead of the Node.js SDK to avoid Convex compatibility issues.
 */

/**
 * Extract public_id from a Cloudinary URL
 * @param url - Cloudinary URL
 * @returns The public_id or null if not a valid Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Check if it's a Cloudinary URL
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    // Parse the URL to extract the public_id
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the upload part
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload' but before the file extension
    const relevantParts = pathParts.slice(uploadIndex + 1);
    const fullPath = relevantParts.join('/');
    
    // Remove file extension
    const lastDotIndex = fullPath.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 
      ? fullPath.substring(0, lastDotIndex) 
      : fullPath;
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

/**
 * Generate a Cloudinary URL with transformation parameters
 * @param publicId - The public_id of the image
 * @param options - Transformation options
 * @returns The transformed Cloudinary URL
 */
export function generateCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  
  // Build transformation string
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  
  const format = options.format || 'auto';
  transformations.push(`f_${format}`);
  
  // Add quality auto and fetch format auto for optimal delivery
  transformations.push('q_auto');
  
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/' 
    : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}${publicId}`;
}