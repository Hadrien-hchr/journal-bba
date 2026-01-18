import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image, Link } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface FileUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  className?: string;
}

export function FileUploadInput({
  label,
  value,
  onChange,
  folder = 'general',
  accept = 'image/*',
  className,
}: FileUploadInputProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useFileUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, folder);
    if (url) {
      onChange(url);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === 'upload' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('upload')}
            className="h-7 px-2 text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Fichier
          </Button>
          <Button
            type="button"
            variant={mode === 'url' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('url')}
            className="h-7 px-2 text-xs"
          >
            <Link className="h-3 w-3 mr-1" />
            URL
          </Button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-${label}`}
          />
          
          {!value ? (
            <label
              htmlFor={`file-upload-${label}`}
              className={cn(
                'flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                'hover:bg-accent/50 border-muted-foreground/25',
                isUploading && 'pointer-events-none opacity-50'
              )}
            >
              <div className="flex flex-col items-center justify-center pt-2 pb-3">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">
                  Cliquez pour télécharger
                </p>
              </div>
            </label>
          ) : (
            <div className="relative">
              <img
                src={value}
                alt="Preview"
                className="w-full h-24 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {isUploading && (
            <Progress value={progress} className="h-1" />
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="url"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://..."
            className="flex-1"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
