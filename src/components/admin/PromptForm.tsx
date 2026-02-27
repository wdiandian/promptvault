import { useState } from 'react';
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
}

interface Props {
  models: Model[];
  tags: Tag[];
  initial?: Partial<PromptData>;
  onClose?: () => void;
}

export default function PromptForm({ models, tags: _tags, initial, onClose }: Props) {
  const isEdit = !!initial?.id;

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
  });

  const [saving, setSaving] = useState(false);

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
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/prompts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          id: initial?.id,
          params: JSON.parse(form.params || '{}'),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          coverUrl: form.coverUrl || null,
        }),
      });

      if (res.ok) {
        showToast(isEdit ? 'Updated!' : 'Created!');
        window.location.reload();
      } else {
        showToast('Error saving');
      }
    } catch {
      showToast('Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3.5 mb-3.5">
        <div className="flex-1">
          <label className="block text-xs text-text-3 mb-1 font-medium">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. Cyberpunk City at Sunset"
            required
            className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3"
          />
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
        <label className="block text-xs text-text-3 mb-1 font-medium">Tags (comma separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => updateField('tags', e.target.value)}
          placeholder="Cyberpunk, Neon, Sunset"
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3"
        />
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
        <label className="block text-xs text-text-3 mb-1 font-medium">Cover URL (paste uploaded image/video URL)</label>
        <input
          type="text"
          value={form.coverUrl}
          onChange={(e) => updateField('coverUrl', e.target.value)}
          placeholder="https://cdn.getpt.net/uploads/..."
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3"
        />
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
