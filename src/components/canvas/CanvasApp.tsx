import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type OnConnectEnd,
  type OnConnectStart,
  type DefaultEdgeOptions,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '../../lib/canvas/workflowStore'
import ImageNode from './nodes/ImageNode'
import VideoNode from './nodes/VideoNode'
import { MODEL_SCHEMAS } from '../../lib/canvas/modelSchemas'

const nodeTypes = { imageNode: ImageNode, videoNode: VideoNode }

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
  style: { strokeWidth: 2, stroke: '#7c3aed' },
}

function buildDefaultParams(modelId: string) {
  const schema = MODEL_SCHEMAS[modelId]
  const play = schema?.plays[0]
  if (!play) return {}
  return Object.fromEntries(play.parameters.map((p) => [p.key, p.default]))
}

function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, addEdgeConn } = useWorkflowStore()
  const { screenToFlowPosition } = useReactFlow()
  const idRef = useRef(1)
  const [menu, setMenu] = useState<{ x: number; y: number; fx: number; fy: number } | null>(null)
  const connectStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string | null } | null>(null)

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setMenu({ x: e.clientX, y: e.clientY, fx: pos.x, fy: pos.y })
  }, [screenToFlowPosition])

  const onConnectStart = useCallback<OnConnectStart>((_event, params) => {
    connectStartRef.current = {
      nodeId: params.nodeId ?? '',
      handleId: params.handleId ?? null,
      handleType: params.handleType ?? null,
    }
  }, [])

  const onConnectEnd = useCallback<OnConnectEnd>((event, connectionState) => {
    if (connectionState?.isValid) {
      connectStartRef.current = null
      return
    }
    const ev = event instanceof MouseEvent ? event : (event as TouchEvent).changedTouches[0]
    const clientX = 'clientX' in ev ? ev.clientX : 0
    const clientY = 'clientY' in ev ? ev.clientY : 0
    const pos = screenToFlowPosition({ x: clientX, y: clientY })
    requestAnimationFrame(() => {
      setMenu({ x: clientX, y: clientY, fx: pos.x, fy: pos.y })
    })
  }, [screenToFlowPosition])

  const createNodeAndConnect = useCallback((type: 'imageNode' | 'videoNode', modelId: string) => {
    if (!menu) return
    const newId = type === 'imageNode' ? `image-${idRef.current++}` : `video-${idRef.current++}`
    addNode({
      id: newId,
      type,
      position: { x: menu.fx, y: menu.fy },
      data: { modelId, activePlay: 0, prompt: '', params: buildDefaultParams(modelId) },
    })

    const start = connectStartRef.current
    if (start?.nodeId) {
      if (start.handleType === 'source') {
        const targetHandle = start.handleId === 'video_out' ? 'video_in' : 'image_in'
        addEdgeConn({ source: start.nodeId, sourceHandle: start.handleId, target: newId, targetHandle })
      } else {
        const sourceHandle = start.handleId === 'video_in' ? 'video_out' : 'image_out'
        addEdgeConn({ source: newId, sourceHandle, target: start.nodeId, targetHandle: start.handleId })
      }
    }
    connectStartRef.current = null
    setMenu(null)
  }, [menu, addNode, addEdgeConn])

  return (
    <div className="w-full h-full" onContextMenu={onContextMenu} onMouseDown={(e) => {
      if (!(e.target as Element).closest('.node-menu')) setMenu(null)
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        defaultEdgeOptions={defaultEdgeOptions}
        colorMode="dark"
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2a2a2a" />
        <Controls className="!bg-[#1c1c1e] !border-white/[0.08] !text-zinc-400" />
        <MiniMap
          style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.06)' }}
          maskColor="rgba(0,0,0,0.6)"
          nodeColor="#333"
        />
      </ReactFlow>

      {menu && (
        <div
          style={{ left: menu.x, top: menu.y }}
          className="node-menu fixed z-50 min-w-[160px] rounded-xl border border-white/[0.08] bg-[#1c1c1e]/95 backdrop-blur-sm shadow-2xl py-1.5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">添加节点</p>
          <button
            onClick={() => createNodeAndConnect('imageNode', 'seedream40')}
            className="w-full px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 text-left flex items-center gap-2 transition-colors"
          >
            <span className="w-4 h-4 rounded bg-violet-500/20 flex items-center justify-center text-[10px]">图</span>
            图像生成节点
          </button>
          <button
            onClick={() => createNodeAndConnect('videoNode', 'pixverse_v6')}
            className="w-full px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 text-left flex items-center gap-2 transition-colors"
          >
            <span className="w-4 h-4 rounded bg-orange-500/20 flex items-center justify-center text-[10px]">视</span>
            视频生成节点
          </button>
        </div>
      )}
    </div>
  )
}

export default function CanvasApp() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
