import { useState, type FormEvent } from 'react';
import { showToast } from '@/lib/stores';

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface BlogData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  status: string;
}

interface Props {
  initial?: Partial<BlogData>;
}

export default function BlogForm({ initial }: Props) {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<BlogData>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    coverUrl: initial?.coverUrl ?? '',
    status: initial?.status ?? 'draft',
  });

  const [saving, setSaving] = useState(false);
  const [aiUrl, setAiUrl] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateFromUrl = async () => {
    if (!aiUrl.trim()) { showToast('Enter a URL'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/blog-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aiUrl.trim(), context: aiContext.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Generation failed');
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        slug: data.title ? slugify(data.title) : prev.slug,
        excerpt: data.excerpt || prev.excerpt,
        content: data.content || prev.content,
      }));
      showToast('Article generated! Review and edit before publishing.');
    } catch (err: any) {
      showToast(`AI error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (field: keyof BlogData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !isEdit) next.slug = slugify(value);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: initial?.id }),
      });

      if (res.ok) {
        showToast(isEdit ? 'Updated!' : 'Published!');
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Error: ${err.error ?? 'Save failed'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* AI Generate from URL */}
      <div className="mb-5 p-4 bg-bg-hover border border-border rounded-[10px]">
        <label className="block text-xs text-text-3 mb-1.5 font-medium">AI Generate from URL</label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            placeholder="Paste a URL…"
            className="flex-1 bg-bg border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3"
          />
          <button
            type="button"
            onClick={generateFromUrl}
            disabled={generating || !aiUrl.trim()}
            className="shrink-0 px-4 py-2.5 rounded-sm text-[.8125rem] font-semibold border border-accent text-accent hover:bg-accent hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating…' : 'AI Generate ✦'}
          </button>
        </div>
        <textarea
          value={aiContext}
          onChange={(e) => setAiContext(e.target.value)}
          placeholder="Optional: describe what this link is about to help AI understand the content better (e.g. 'This tweet shows a demo of Seedance 2.0 generating a car commercial video from a text prompt')"
          className="w-full bg-bg border border-border rounded-sm px-3.5 py-2 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[60px] resize-y"
        />
        <p className="text-[.7rem] text-text-3 mt-1.5">For social media links (X, YouTube etc.), add a description above so AI knows exactly what the content is about.</p>
      </div>

      <div className="flex gap-3.5 mb-3.5">
        <div className="flex-1">
          <label className="block text-xs text-text-3 mb-1 font-medium">Title</label>
          <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. How to Write Prompts for Seedance 2.0" required
            className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3" />
        </div>
        <div className="w-[140px]">
          <label className="block text-xs text-text-3 mb-1 font-medium">Status</label>
          <select value={form.status} onChange={(e) => updateField('status', e.target.value)}
            className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Slug</label>
        <input type="text" value={form.slug} onChange={(e) => updateField('slug', e.target.value)}
          placeholder="auto-generated" required
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3" />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Excerpt (short summary for listing)</label>
        <textarea value={form.excerpt} onChange={(e) => updateField('excerpt', e.target.value)}
          placeholder="A brief summary shown on the blog listing page…"
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[60px] resize-y" />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Content (Markdown supported)</label>
        <textarea value={form.content} onChange={(e) => updateField('content', e.target.value)}
          placeholder="Write your article here… Supports **bold**, *italic*, ## headings, [links](url), ![images](url)"
          required
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 min-h-[300px] resize-y font-mono leading-relaxed" />
      </div>

      <div className="mb-3.5">
        <label className="block text-xs text-text-3 mb-1 font-medium">Cover Image URL (optional)</label>
        <input type="text" value={form.coverUrl} onChange={(e) => updateField('coverUrl', e.target.value)}
          placeholder="https://cdn.getpt.net/uploads/..."
          className="w-full bg-bg-input border border-border rounded-sm px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3" />
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-3.5 border-t border-border">
        <button type="submit" disabled={saving}
          className="px-[22px] py-2.5 rounded-sm text-[.8125rem] font-semibold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
