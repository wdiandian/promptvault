import { useState, useRef, type DragEvent } from 'react';
import { showToast } from '@/lib/stores';

interface Props {
  promptItemId?: string;
  onUploaded?: (url: string) => void;
}

export default function UploadZone({ promptItemId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      if (promptItemId) formData.append('promptItemId', promptItemId);

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          showToast(`Uploaded: ${file.name}`);
          onUploaded?.(data.url);
        } else {
          showToast(`Failed: ${file.name}`);
        }
      } catch {
        showToast(`Error uploading ${file.name}`);
      }
    }

    setUploading(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-[10px] p-7 text-center text-[.8125rem] cursor-pointer transition-all duration-150 ${
        dragging
          ? 'border-accent text-text-2 bg-accent-soft'
          : 'border-border text-text-3 hover:border-text-3 hover:text-text-2'
      }`}
    >
      {uploading ? (
        <p>Uploading…</p>
      ) : (
        <>
          <p>Drop files here or <span className="text-accent font-semibold">browse</span></p>
          <p className="text-[.7rem] mt-1 text-text-3">JPG, PNG, WebP, MP4 — max 50MB</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
