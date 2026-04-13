import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads a file to Firebase Storage with a timeout and Base64 fallback.
 * @param file The file to upload
 * @param path The storage path (folder)
 * @param timeoutMs Timeout in milliseconds (default 30s)
 * @returns Promise resolving to the download URL or Base64 string
 */
export const uploadImage = async (file: File, path: string, timeoutMs: number = 30000): Promise<string> => {
  console.log(`Starting upload for ${file.name} to ${path}...`);
  
  // Validate file size (max 5MB for Storage, but Base64 fallback will be limited by Firestore/Memory)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit.");
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error("Only image files are allowed.");
  }

  const uploadToStorage = async () => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const convertToBase64 = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("STORAGE_TIMEOUT")), timeoutMs)
  );

  try {
    // Try uploading to Firebase Storage first
    return await Promise.race([uploadToStorage(), timeoutPromise]);
  } catch (error: any) {
    console.warn("Firebase Storage upload failed or timed out. Attempting Base64 fallback...", error);
    
    // If it's a timeout or a specific Firebase error, try Base64
    if (error.message === "STORAGE_TIMEOUT" || error.code?.startsWith('storage/')) {
      try {
        const base64 = await convertToBase64();
        console.log("Fallback to Base64 successful.");
        
        // Warn about size if it's large (Firestore has 1MB limit per doc)
        if (base64.length > 800000) {
          console.warn("Base64 string is very large (>800KB). This might cause issues when saving to the database.");
        }
        
        return base64;
      } catch (fallbackError) {
        console.error("Base64 fallback also failed:", fallbackError);
        throw new Error("Upload failed and fallback was unsuccessful.");
      }
    }
    
    // If it's some other error (like validation), re-throw it
    throw error;
  }
};
