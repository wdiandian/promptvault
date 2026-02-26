import { useStore } from '@nanostores/react';
import { $toast } from '@/lib/stores';

export default function Toast() {
  const message = useStore($toast);

  return (
    <div
      className={`fixed top-5 right-5 bg-[#1a1a1a] text-white px-[22px] py-3 rounded-[10px] font-semibold text-[.875rem] z-[9999] pointer-events-none shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-[250ms] ${
        message
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-2.5 scale-[0.96]'
      }`}
    >
      {message ?? ''}
    </div>
  );
}
