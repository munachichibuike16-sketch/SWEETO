/**
 * Storage Helper Utility
 * Routes uploads to the local server API
 */

import { supabase } from '../lib/supabase';
import { API_BASE_URL } from './api';

export const uploadToStorage = async (fileBlob, folder = 'products') => {
  const ext = fileBlob.type?.split('/')[1] || 'jpg';
  const fileName = `${folder}/upload_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  
  const file = new File([fileBlob], fileName, { type: fileBlob.type || 'image/jpeg' });
  
  try {
    const { data, error } = await supabase.storage.from('uploads').upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Supabase storage failed, falling back to local upload...', err);
    
    // Fallback to local server endpoint
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Local upload failed');
      
      const resData = await res.json();
      return `${API_BASE_URL}${resData.url}`;
    } catch (localErr) {
      throw new Error('Upload completely failed on both cloud and local: ' + localErr.message);
    }
  }
};

export const uploadVideoToStorage = async (fileBlob, folder = 'videos') => {
  return uploadToStorage(fileBlob, folder);
};
