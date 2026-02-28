import { useState, useRef, type DragEvent } from 'react';
import { showToast } from '@/lib/stores';
import { slugify } from '@/lib/utils';

interface Model {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface PromptData {
  id?: string;
  title: string;
  slug: string;
  modelId: string;
  promptText: string;
  negativePrompt: string;
  params: string;
  notes: string;
  tags: string;
  status: string;
  coverUrl: string;
  mediaList: MediaItem[];
}

interface Props {
  models: Model[];
  tags: Tag[];
  initial?: Partial<PromptData>;
  onClose?: () => void;
}

export default function PromptForm({ models, tags: _tags, initial, onClose }: Props) {
  const isEdit = !!initial?.id;

  const initialMedia: MediaItem[] = (initial as any)?.mediaList ?? 
    (initial?.coverUrl ? [{ url: initial.coverUrl, type: (/\.(mp4|webm|mov)$/i.test(initial.coverUrl) ? 'video' : 'image') as 'image' | 'video' }] : []);

  const [form, setForm] = useState<PromptData>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    modelId: initial?.modelId ?? models[0]?.id ?? '',
    promptText: initial?.promptText ?? '',
    negativePrompt: initial?.negativePrompt ?? '',
    params: initial?.params ?? '{}',
    notes: initial?.notes ?? '',
    tags: initial?.tags ?? '',
    status: initial?.status ?? 'draft',
    coverUrl: initial?.coverUrl ?? '',
    mediaList: initialMedia,
  });

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateTitle = async () => {
    if (!form.promptText.trim()) {
      showToast('Enter a prompt first');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: form.promptText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed');
      }
      const { title } = await res.json();
      updateField('title', title);
      showToast('Title generated!');
    } catch (err: any) {
      showToast(`AI error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (field: keyof PromptData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !isEdit) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);

    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(form.params || '{}');
      } catch {
        showToast('Invalid JSON in Parameters field');
        setSaving(false);
        return;
      }

      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/prompts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          id: initial?.id,
          params: parsedParams,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          coverUrl: form.mediaList[0]?.url || form.coverUrl || null,
          mediaList: form.mediaList,
        }),
      });

      if (res.ok) {
        showToast(isEdit ? 'Updated!' : 'Created!');
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Error: ${err.error ?? 'Save failed'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message ?? 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3.5 mb-3.5">
        <div className="flex-1">
          <label className="block text-xs text-text-3 mb-1 font-medium">Title</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Cyberpunk City at Sunset"
              required
              className="flex-1 bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3"
            />
            <button
              type="button"
              onClick={generateTitle}
              disabled={generating || !form.promptText.trim()}
              className="shrink-0 px-3 py-2 rounded-sm text-[.75rem] font-semibold border border-accent text-accent hover:bg-accent hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="AI generate title from prompt"
            >
              {generating ? '...' : 'AI ✦'}
            </button>
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-3 mb-1 font-medium">Model</label>
          <select
            value={form.modelId}
            onChange={(e) => updateField('modelId', e.target.value)}
            className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3.5 mb-3.5">
        <div className="flex-1">
          <label className="block text-xs text-text-3 mb-1 font-medium">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            placeholder="auto-generated-from-title"
            required
            className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-3 mb-1 font-medium">Status</label>
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {_tags.map((tag) => {
            const selected = form.tags.split(',').map((t) => t.trim()).filter(Boolean).includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  const current = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
                  const next = selected
                    ? current.filter((t) => t !== tag.name)
                    : [...current, tag.name];
                  updateField('tags', next.join(', '));
                }}
                className={`px-3 py-1 rounded-full text-[.8125rem] font-medium transition-all duration-150 border ${
                  selected
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg-input text-text-3 border-border hover:border-border-hover hover:text-text-2'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Prompt</label>
        <textarea
          value={form.promptText}
          onChange={(e) => updateField('promptText', e.target.value)}
          placeholder="Enter the main prompt…"
          required
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[100px] resize-y"
        />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Negative Prompt</label>
        <textarea
          value={form.negativePrompt}
          onChange={(e) => updateField('negativePrompt', e.target.value)}
          placeholder="Optional negative prompt…"
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[70px] resize-y"
        />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Parameters (JSON)</label>
        <textarea
          value={form.params}
          onChange={(e) => updateField('params', e.target.value)}
          placeholder='{"--ar": "4:5", "--stylize": "750"}'
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[60px] resize-y font-mono"
        />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">
          Media ({form.mediaList.length} file{form.mediaList.length !== 1 ? 's' : ''})
          {form.mediaList.length > 0 && <span className="text-text-3 font-normal"> — first = cover</span>}
        </label>

        {form.mediaList.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {form.mediaList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-bg-input border border-border rounded-sm px-3 py-2">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-14 h-14 rounded object-cover bg-bg-hover" muted preload="metadata" />
                ) : (
                  <img src={item.url} alt="" className="w-14 h-14 rounded object-cover bg-bg-hover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[.8125rem] text-text truncate">{item.url.split('/').pop()}</p>
                  <p className="text-[.7rem] text-text-3">{idx === 0 ? 'Cover' : `#${idx + 1}`} · {item.type}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...form.mediaList];
                        [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                        setForm((prev) => ({ ...prev, mediaList: list }));
                      }}
                      className="text-text-3 hover:text-text-2 text-xs font-medium transition-colors"
                      title="Move up (set as cover)"
                    >↑</button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        mediaList: prev.mediaList.filter((_, i) => i !== idx),
                      }));
                    }}
                    className="text-text-3 hover:text-red text-xs font-medium transition-colors"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <InlineUpload onUploaded={(url) => {
          const type: 'image' | 'video' = /\.(mp4|webm|mov)$/i.test(url) ? 'video' : 'image';
          setForm((prev) => ({
            ...prev,
            mediaList: [...prev.mediaList, { url, type }],
          }));
        }} />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Reproduction Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Tips for reproducing this result…"
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[60px] resize-y"
        />
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-3.5 border-t border-border">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-[22px] py-2.5 rounded-sm text-[.8125rem] font-semibold text-text-3 border border-border hover:border-border-hover transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-[22px] py-2.5 rounded-sm text-[.8125rem] font-semibold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function InlineUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress(`Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    try {
      const presignRes = await fetch('/api/admin/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to get upload URL');
      }

      const { presignedUrl, publicUrl } = await presignRes.json();

      const uploadRes = await fetch(presignedUrl, { method: 'PUT', body: file, mode: 'cors' });
      if (!uploadRes.ok) throw new Error('Upload failed');

      showToast(`Uploaded: ${file.name}`);
      onUploaded(publicUrl);
    } catch (err: any) {
      showToast(`Failed: ${err.message}`);
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-sm p-5 text-center text-[.8125rem] transition-all duration-150 ${
        uploading ? 'cursor-wait opacity-70 border-accent' : 'cursor-pointer border-border hover:border-border-hover text-text-3 hover:text-text-2'
      }`}
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-text-2">{progress}</span>
        </div>
      ) : (
        <span>Drop file here or <span className="text-accent font-semibold">browse</span></span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        className="hidden"
      />
    </div>
  );
}
