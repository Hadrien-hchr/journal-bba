import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Plus } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface MultiFileUploadProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function MultiFileUpload({
  label,
  values,
  onChange,
  folder = 'general',
  accept = 'image/*',
  maxFiles = 10,
  className,
}: MultiFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useFileUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxFiles - values.length;
    const filesToUpload = files.slice(0, remainingSlots);

    for (const file of filesToUpload) {
      const url = await uploadFile(file, folder);
      if (url) {
        onChange([...values, url]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const canAddMore = values.length < maxFiles;

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id={`multi-file-upload-${label}`}
        multiple
      />

      <div className="grid grid-cols-3 gap-2">
        {values.map((url, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={url}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {canAddMore && (
          <label
            htmlFor={`multi-file-upload-${label}`}
            className={cn(
              'flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              'hover:bg-accent/50 border-muted-foreground/25',
              isUploading && 'pointer-events-none opacity-50'
            )}
          >
            <Plus className="h-6 w-6 text-muted-foreground" />
          </label>
        )}
      </div>

      {isUploading && (
        <Progress value={progress} className="h-1" />
      )}

      <p className="text-xs text-muted-foreground">
        {values.length}/{maxFiles} images
      </p>
    </div>
  );
}
