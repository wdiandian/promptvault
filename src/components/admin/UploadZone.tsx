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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const total = files.length;
    let done = 0;

    for (const file of Array.from(files)) {
      setProgress(`Uploading ${done + 1}/${total}: ${file.name}`);

      const formData = new FormData();
      formData.append('file', file);
      if (promptItemId) formData.append('promptItemId', promptItemId);

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          setUploaded((prev) => [...prev, {
            name: file.name,
            url: data.url,
            type: file.type.startsWith('video/') ? 'video' : 'image',
          }]);
          showToast(`Uploaded: ${file.name}`);
          onUploaded?.(data.url);
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(`Failed: ${file.name} — ${err.error ?? 'Unknown error'}`);
        }
      } catch {
        showToast(`Network error uploading ${file.name}`);
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
                <p className="text-[.8125rem] text-text truncate">{file.name}</p>
                <p className="text-[.7rem] text-text-3">{file.type === 'video' ? 'Video' : 'Image'}</p>
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
