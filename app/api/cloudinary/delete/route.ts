import { NextRequest, NextResponse } from 'next/server';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteCloudinaryImage(publicId);

    return NextResponse.json({
      success: result,
      message: result ? 'Image deleted successfully' : 'Failed to delete image'
    });
  } catch (error) {
    console.error('Error in Cloudinary delete API:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}