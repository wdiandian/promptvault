import { showToast } from '@/lib/stores';

interface Props {
  text: string;
  label?: string;
  variant?: 'sm' | 'fill' | 'outline';
  className?: string;
  slug?: string;
}

export default function CopyButton({ text, label = 'Copy', variant = 'sm', className = '', slug }: Props) {
  const copyText = async () => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand('copy');
      if (!copied) throw new Error('Copy command failed');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopy = async () => {
    try {
      await copyText();
      if (slug) {
        fetch(`/api/prompts/${slug}/copy`, { method: 'POST', keepalive: true });
      }
      showToast('Copied!');
    } catch {
      showToast('Failed to copy');
    }
  };

  const base = 'font-semibold transition-all duration-150';
  const variants: Record<string, string> = {
    sm: 'text-[.8125rem] px-3 py-1 rounded-sm bg-bg-hover text-text-2 border border-border hover:border-accent hover:text-accent',
    fill: 'text-[.875rem] px-4 py-2.5 rounded-sm bg-accent text-white hover:bg-accent-hover flex-1 text-center',
    outline: 'text-[.875rem] px-4 py-2.5 rounded-sm border border-border text-text-3 hover:border-border-hover hover:text-text-2 flex-1 text-center',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {label}
    </button>
  );
}
