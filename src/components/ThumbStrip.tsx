import { useState } from 'react';

interface Asset {
  id: string;
  type: string;
  url: string;
  thumbUrl?: string | null;
  alt?: string | null;
}

interface Props {
  assets: Asset[];
  mainImageId?: string;
}

function isVideo(asset: Asset): boolean {
  return asset.type === 'video' || /\.(mp4|webm|mov)$/i.test(asset.url);
}

export default function ThumbStrip({ assets, mainImageId }: Props) {
  const [activeId, setActiveId] = useState(mainImageId ?? assets[0]?.id);

  const activeAsset = assets.find((a) => a.id === activeId) ?? assets[0];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {activeAsset && (
        isVideo(activeAsset) ? (
          <video
            key={activeAsset.id}
            src={activeAsset.url}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-h-[72vh] max-w-full rounded-[10px] object-contain bg-black"
          />
        ) : (
          <img
            src={activeAsset.url}
            alt={activeAsset.alt ?? ''}
            className="max-h-[72vh] max-w-full rounded-[10px] object-contain"
          />
        )
      )}

      {assets.length > 1 && (
        <div className="flex gap-1.5">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setActiveId(asset.id)}
              className={`w-[52px] h-[52px] rounded-sm overflow-hidden border-2 transition-all duration-150 relative ${
                activeId === asset.id
                  ? 'border-accent opacity-100'
                  : 'border-transparent opacity-35 hover:opacity-100'
              }`}
            >
              {isVideo(asset) ? (
                <>
                  <video src={asset.url} className="w-full h-full object-cover" muted preload="metadata" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-[.5rem] font-bold bg-black/30">▶</span>
                </>
              ) : (
                <img
                  src={asset.thumbUrl ?? asset.url}
                  alt={asset.alt ?? ''}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
