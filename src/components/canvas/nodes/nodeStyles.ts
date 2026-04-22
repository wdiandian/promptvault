// 节点样式 token — ImageNode / VideoNode 共用

export const NODE_W = 'w-[300px]'

export const card = (selected: boolean) =>
  `bg-[#1c1c1e] border rounded-2xl transition-all duration-200 ${
    selected
      ? 'border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
      : 'border-white/[0.06]'
  }`

export const mediaPlaceholder = 'flex flex-col items-center gap-2 py-10 text-zinc-700'
export const mediaPlaceholderText = 'text-[11px] text-zinc-600'

export const panel = 'px-3 pt-2.5 pb-3 flex flex-col gap-2'

export const tabActive = 'px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/10 text-zinc-100 transition-colors nodrag'
export const tabInactive = 'px-2.5 py-0.5 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors nodrag'

export const promptArea = 'w-full bg-transparent text-[12px] text-zinc-200 placeholder-zinc-600 outline-none resize-none leading-relaxed nodrag'

export const divider = 'h-px bg-white/[0.06] -mx-3'

export const toolbar = 'flex items-center gap-0.5 flex-wrap'

export const modelBtn = 'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors nodrag'

export const vDivider = 'w-px h-3 bg-white/10 mx-1'

export const sendBtn = (disabled: boolean) =>
  `ml-auto w-6 h-6 rounded-full flex items-center justify-center transition-colors nodrag ${
    disabled
      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
      : 'bg-zinc-200 hover:bg-white text-black'
  }`

export const HANDLE_COLORS: Record<string, string> = {
  text:  '!border-blue-500/60 hover:!border-blue-400',
  image: '!border-violet-500/60 hover:!border-violet-400',
  video: '!border-orange-500/60 hover:!border-orange-400',
  audio: '!border-green-500/60 hover:!border-green-400',
}

export const handleBase = '!w-2.5 !h-2.5 !rounded-full !bg-[#1c1c1e] !border-2 transition-colors'
