import { NextRequest, NextResponse } from 'next/server';
import { uploadBase64Image } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const { base64Image, folder } = await request.json();

    if (!base64Image) {
      return NextResponse.json(
        { error: 'Base64 image is required' },
        { status: 400 }
      );
    }

    const result = await uploadBase64Image(base64Image, folder || 'journal-images');

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Error in Cloudinary upload API:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}