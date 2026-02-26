import { useState, useRef, type DragEvent } from 'react';
import { showToast } from '@/lib/stores';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface Props {
  promptItemId?: string;
  onUploaded?: (url: string) => void;
}

export default function UploadZone({ promptItemId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    // Step 1: Get presigned URL from our API
    const presignRes = await fetch('/api/admin/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to get upload URL');
    }

    const { presignedUrl, publicUrl } = await presignRes.json();

    // Step 2: Upload directly to R2 (no extra headers to avoid CORS preflight issues)
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      mode: 'cors',
    });

    if (!uploadRes.ok) {
      throw new Error('Upload to storage failed');
    }

    // Step 3: Save asset record in DB
    if (promptItemId) {
      await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: publicUrl,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          format: file.name.split('.').pop(),
          size: file.size,
          alt: file.name,
          promptItemId,
        }),
      });
    }

    return {
      name: file.name,
      url: publicUrl,
      type: file.type.startsWith('video/') ? 'video' : 'image',
    };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const total = files.length;
    let done = 0;

    for (const file of Array.from(files)) {
      setProgress(`Uploading ${done + 1}/${total}: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

      try {
        const result = await uploadFile(file);
        if (result) {
          setUploaded((prev) => [...prev, result]);
          showToast(`Uploaded: ${file.name}`);
          onUploaded?.(result.url);
        }
      } catch (err: any) {
        showToast(`Failed: ${file.name} — ${err.message}`);
      }

      done++;
    }

    setUploading(false);
    setProgress('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setUploaded((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[10px] p-7 text-center text-[.875rem] transition-all duration-150 ${
          uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'
        } ${
          dragging
            ? 'border-accent text-text-2 bg-accent-soft'
            : 'border-border text-text-3 hover:border-border-hover hover:text-text-2'
        }`}
      >
        {uploading ? (
          <div>
            <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-text-2">{progress}</p>
          </div>
        ) : (
          <>
            <p>Drop files here or <span className="text-accent font-semibold">browse</span></p>
            <p className="text-[.75rem] mt-1 text-text-3">JPG, PNG, WebP, MP4, WebM — max 50MB per file</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {uploaded.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-text-3">{uploaded.length} file{uploaded.length > 1 ? 's' : ''} uploaded</p>
          {uploaded.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-bg-input border border-border rounded-sm px-3 py-2">
              {file.type === 'video' ? (
                <video src={file.url} className="w-12 h-12 rounded object-cover bg-bg-hover" muted />
              ) : (
                <img src={file.url} alt={file.name} className="w-12 h-12 rounded object-cover bg-bg-hover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[.875rem] text-text truncate">{file.name}</p>
                <p className="text-[.75rem] text-text-3">{file.type === 'video' ? 'Video' : 'Image'}</p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="text-text-3 hover:text-red text-xs font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
