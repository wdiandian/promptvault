import { useCallback, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { VideoIcon, ArrowUp, ChevronDown } from 'lucide-react'
import { MODEL_SCHEMAS, VIDEO_MODELS } from '../../../lib/canvas/modelSchemas'
import ParamControls from '../ParamControls'
import {
  NODE_W, card, mediaPlaceholder, mediaPlaceholderText,
  panel, tabActive, tabInactive, promptArea, divider,
  toolbar, modelBtn, vDivider, sendBtn, HANDLE_COLORS, handleBase,
} from './nodeStyles'

interface VideoNodeData extends Record<string, unknown> {
  modelId: string
  activePlay: number
  prompt: string
  params: Record<string, string | number | boolean>
  videoUrl?: string
  isGenerating?: boolean
}

function buildDefaultParams(modelId: string, playIdx: number): Record<string, string | number | boolean> {
  const schema = MODEL_SCHEMAS[modelId]
  const play = schema?.plays[playIdx]
  if (!play) return {}
  return Object.fromEntries(play.parameters.map((p) => [p.key, p.default]))
}

function getImageLabel(play: { label: string; inputs: string[] }, index: number, total: number): string | null {
  if (play.label === '首尾帧') {
    if (index === 0) return '首帧'
    if (index === 1) return '尾帧'
  }
  if (total > 1) return String(index + 1)
  return null
}

export default function VideoNode({ id, data, selected }: NodeProps) {
  const nd = data as VideoNodeData
  const { updateNodeData, getNodes, getEdges } = useReactFlow()
  const [modelOpen, setModelOpen] = useState(false)

  const schema = MODEL_SCHEMAS[nd.modelId] ?? MODEL_SCHEMAS[VIDEO_MODELS[0].id]
  const activePlay = nd.activePlay ?? 0
  const play = schema.plays[activePlay] ?? schema.plays[0]
  const needsImage = play.inputs.includes('image')
  const needsVideo = play.inputs.includes('video')

  const edges = getEdges()
  const nodes = getNodes()
  const upstreamImageUrls: string[] = (() => {
    const imageEdges = edges.filter(e => e.target === id && e.targetHandle === 'image_in')
    const urls: string[] = []
    for (const e of imageEdges) {
      const src = nodes.find(n => n.id === e.source)
      const srcUrls = (src?.data as { imageUrls?: string[] } | undefined)?.imageUrls ?? []
      urls.push(...srcUrls)
    }
    return urls
  })()

  const upstreamVideoUrl = (() => {
    const e = edges.find(e => e.target === id && e.targetHandle === 'video_in')
    if (!e) return undefined
    const src = nodes.find(n => n.id === e.source)
    return (src?.data as { videoUrl?: string } | undefined)?.videoUrl
  })()

  const setPrompt = useCallback(
    (v: string) => updateNodeData(id, { prompt: v }),
    [id, updateNodeData]
  )
  const setModel = useCallback(
    (modelId: string) => {
      updateNodeData(id, { modelId, activePlay: 0, params: buildDefaultParams(modelId, 0) })
      setModelOpen(false)
    },
    [id, updateNodeData]
  )
  const setPlay = useCallback(
    (idx: number) => updateNodeData(id, { activePlay: idx, params: buildDefaultParams(nd.modelId, idx) }),
    [id, nd.modelId, updateNodeData]
  )
  const setParam = useCallback(
    (key: string, value: string | number | boolean) =>
      updateNodeData(id, { params: { ...nd.params, [key]: value } }),
    [id, nd.params, updateNodeData]
  )

  const handleGenerate = useCallback(async () => {
    if (needsImage && upstreamImageUrls.length === 0) return
    if (needsVideo && !upstreamVideoUrl) return
    updateNodeData(id, { isGenerating: true, videoUrl: undefined })
    try {
      const res = await fetch('/api/canvas/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: nd.prompt,
          params: nd.params ?? {},
          imageUrls: upstreamImageUrls,
          videoUrl: upstreamVideoUrl,
          apiIds: play.apiIds,
          payloadTemplate: play.payloadTemplate,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '生成失败')
      updateNodeData(id, { videoUrl: json.url, isGenerating: false })
    } catch (err) {
      console.error('[generate-video]', err)
      updateNodeData(id, { isGenerating: false })
    }
  }, [id, nd.prompt, nd.params, activePlay, needsImage, needsVideo, upstreamImageUrls, upstreamVideoUrl, updateNodeData, play])

  const canSend = !nd.isGenerating && !!nd.prompt?.trim()
    && !(needsImage && upstreamImageUrls.length === 0)
    && !(needsVideo && !upstreamVideoUrl)

  return (
    <div className={`flex flex-col ${NODE_W} select-none font-sans`}>

      <div className={`relative ${card(!!selected)}`}>
        <Handle type="target" position={Position.Left} id="image_in"
          style={{ top: needsVideo ? '35%' : '50%' }}
          className={`${handleBase} ${HANDLE_COLORS.image}`} />
        {needsVideo && (
          <Handle type="target" position={Position.Left} id="video_in"
            style={{ top: '65%' }}
            className={`${handleBase} ${HANDLE_COLORS.video}`} />
        )}
        <Handle type="source" position={Position.Right} id="video_out"
          style={{ top: '50%' }}
          className={`${handleBase} ${HANDLE_COLORS.video}`} />

        <div className="w-full bg-[#111] rounded-2xl overflow-hidden" style={{ minHeight: 160 }}>
          {nd.videoUrl ? (
            <video src={nd.videoUrl} controls className="w-full h-auto" />
          ) : (
            <div className={mediaPlaceholder}>
              <VideoIcon size={28} strokeWidth={1} />
              <span className={mediaPlaceholderText}>视频将在此展示</span>
            </div>
          )}
        </div>

        {upstreamImageUrls.length > 0 && (
          <div className="flex gap-1.5 px-2.5 pb-2.5 pt-1.5 flex-wrap">
            {upstreamImageUrls.map((url, i) => {
              const label = getImageLabel(play, i, upstreamImageUrls.length)
              return (
                <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {label && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-medium bg-black/60 text-white leading-4">
                      {label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {nd.isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {selected && (
        <div className={`mt-1 ${card(!!selected)} ${panel}`}>

          {schema.plays.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {schema.plays.map((p, i) => (
                <button key={i} onClick={() => setPlay(i)}
                  className={i === activePlay ? tabActive : tabInactive}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={nd.prompt ?? ''}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要生成的视频内容…"
            rows={2}
            className={promptArea}
          />

          <div className={divider} />

          <div className={toolbar}>
            <div className="relative">
              <button onClick={() => setModelOpen(v => !v)} className={modelBtn}>
                {schema.modelName}
                <ChevronDown size={9} className="text-zinc-600" />
              </button>
              {modelOpen && (
                <div className="absolute bottom-full mb-1.5 left-0 z-50 min-w-[140px] bg-[#222] border border-white/[0.08] rounded-xl shadow-2xl py-1 nodrag">
                  {VIDEO_MODELS.map((m) => (
                    <button key={m.id} onClick={() => setModel(m.id)}
                      className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                        nd.modelId === m.id ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}>
                      {m.modelName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={vDivider} />

            <ParamControls parameters={play.parameters} values={nd.params ?? {}} onChange={setParam} />

            <button
              onClick={handleGenerate}
              disabled={!canSend}
              title={
                needsImage && upstreamImageUrls.length === 0 ? '请先连接图片节点' :
                needsVideo && !upstreamVideoUrl ? '请先连接视频节点' : undefined
              }
              className={sendBtn(!canSend)}
            >
              <ArrowUp size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
