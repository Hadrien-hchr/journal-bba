import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, folder: string = 'general'): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      setProgress(100);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[], folder: string = 'general'): Promise<string[]> => {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const url = await uploadFile(files[i], folder);
      if (url) urls.push(url);
    }
    
    setProgress(100);
    return urls;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    progress,
  };
}
