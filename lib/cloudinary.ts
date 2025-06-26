import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
}

/**
 * Upload a base64 image to Cloudinary
 * @param base64Image - Base64 encoded image string
 * @param folder - Optional folder to store the image in
 * @returns Promise with upload result
 */
export async function uploadBase64Image(
  base64Image: string,
  folder = 'journal-images'
): Promise<CloudinaryUploadResult> {
  try {
    // Remove the data:image/xxx;base64, prefix if present
    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/png;base64,${base64Data}`,
        {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      );
    });

    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary by public_id
 * @param publicId - The public_id of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Extract public_id from a Cloudinary URL
 * @param url - Cloudinary URL
 * @returns The public_id or null if not a valid Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
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
    const publicId = fullPath.substring(0, fullPath.lastIndexOf('.'));
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}