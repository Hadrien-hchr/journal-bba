import { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { BlockData } from './ArticleBlock';
import { cn } from '@/lib/utils';

interface ArticleCanvasProps {
  blocks: BlockData[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (block: BlockData) => void;
  backgroundColor: string;
  canvasWidth: number;
  canvasHeight: number;
  readOnly?: boolean;
}

export function ArticleCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  backgroundColor,
  canvasWidth,
  canvasHeight,
  readOnly = false,
}: ArticleCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const renderBlock = (block: BlockData) => {
    const style: React.CSSProperties = {};

    if (block.type === 'image') {
      return (
        <img
          src={block.content}
          alt=""
          className="w-full h-full pointer-events-none"
          style={{
            objectFit: block.objectFit || 'cover',
            borderRadius: block.borderRadius || 0,
          }}
        />
      );
    }

    return (
      <div
        className="w-full h-full overflow-hidden whitespace-pre-wrap"
        style={{
          fontSize: block.fontSize || 14,
          fontWeight: block.fontWeight || 'normal',
          fontStyle: block.fontStyle || 'normal',
          textAlign: block.textAlign || 'left',
          color: block.color || '#000000',
          lineHeight: 1.4,
        }}
      >
        {block.content}
      </div>
    );
  };

  if (readOnly) {
    return (
      <div
        className="relative overflow-hidden rounded-lg shadow-md mx-auto"
        style={{ width: canvasWidth, minHeight: canvasHeight, backgroundColor }}
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            className="absolute"
            style={{
              left: block.x,
              top: block.y,
              width: block.width,
              height: block.height,
            }}
          >
            {renderBlock(block)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden"
      style={{ width: canvasWidth, minHeight: canvasHeight, backgroundColor }}
      onClick={(e) => {
        if (e.target === canvasRef.current) onSelectBlock(null);
      }}
    >
      {blocks.map((block) => (
        <Rnd
          key={block.id}
          position={{ x: block.x, y: block.y }}
          size={{ width: block.width, height: block.height }}
          onDragStop={(_, d) => onUpdateBlock({ ...block, x: d.x, y: d.y })}
          onResizeStop={(_, __, ref, ___, pos) => {
            onUpdateBlock({
              ...block,
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              x: pos.x,
              y: pos.y,
            });
          }}
          bounds="parent"
          className={cn(
            'cursor-move',
            selectedBlockId === block.id && 'ring-2 ring-primary ring-offset-1'
          )}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectBlock(block.id);
          }}
        >
          {renderBlock(block)}
        </Rnd>
      ))}
    </div>
  );
}
