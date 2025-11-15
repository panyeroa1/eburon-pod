
import { supabase } from './supabaseClient';

// Helper function to convert base64 to a Blob
const base64ToBlob = (base64: string, contentType: string = 'image/png'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

/**
 * Uploads an image to Supabase Storage and saves its metadata to the database.
 * @param userId The ID of the authenticated user.
 * @param prompt The prompt used to generate the image.
 * @param imageBase64 The base64-encoded image data.
 */
export const saveImage = async (userId: string, prompt: string, imageBase64: string): Promise<void> => {
  const imageBlob = base64ToBlob(imageBase64);
  const filePath = `${userId}/${new Date().toISOString()}.png`;

  // 1. Upload the image file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('user_images')
    .upload(filePath, imageBlob);

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
  }

  // 2. Insert the image metadata into the `user_images` table
  const { error: insertError } = await supabase
    .from('user_images')
    .insert({
      user_id: userId,
      prompt: prompt,
      storage_path: filePath,
    });

  if (insertError) {
    console.error("Database insert error:", insertError);
    // Attempt to clean up the orphaned storage object
    await supabase.storage.from('user_images').remove([filePath]);
    throw new Error(`Failed to save image metadata: ${insertError.message}`);
  }
};


/**
 * Fetches all images for a given user from the gallery.
 * @param userId The ID of the authenticated user.
 * @returns A promise that resolves to an array of user image objects.
 */
export const getUserImages = async (userId: string) => {
    const { data: imagesData, error: dbError } = await supabase
        .from('user_images')
        .select('id, prompt, storage_path, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (dbError) {
        throw new Error(`Failed to fetch image records: ${dbError.message}`);
    }

    if (!imagesData || imagesData.length === 0) {
        return [];
    }

    const signedUrlPromises = imagesData.map(image => 
        supabase.storage.from('user_images').createSignedUrl(image.storage_path, 3600) // URL valid for 1 hour
    );

    const signedUrlResults = await Promise.all(signedUrlPromises);
    
    return imagesData.map((image, index) => {
        const { data, error } = signedUrlResults[index];
        if (error || !data) {
            console.error(`Failed to get signed URL for ${image.storage_path}`, error);
            return { ...image, url: '' }; // Handle failure case
        }
        return { ...image, url: data.signedUrl };
    });
};

/**
 * Deletes an image from storage and its corresponding database record.
 * @param userId The ID of the authenticated user.
 * @param storagePath The path of the image in Supabase Storage.
 */
export const deleteImage = async (userId: string, storagePath: string): Promise<void> => {
    // 1. Delete the image from Supabase Storage
    const { error: storageError } = await supabase.storage
        .from('user_images')
        .remove([storagePath]);
    
    if (storageError) {
        throw new Error(`Failed to delete image from storage: ${storageError.message}`);
    }

    // 2. Delete the metadata record from the `user_images` table
    const { error: dbError } = await supabase
        .from('user_images')
        .delete()
        .eq('user_id', userId)
        .eq('storage_path', storagePath);
    
    if (dbError) {
        // This is not ideal as the file is already deleted, but we should log it.
        console.error("Failed to delete image metadata from database:", dbError.message);
        throw new Error(`Failed to delete image record: ${dbError.message}`);
    }
}
