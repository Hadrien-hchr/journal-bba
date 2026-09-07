import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockData, createDefaultBlock } from './ArticleBlock';
import { BlockProperties } from './BlockProperties';
import { ArticleCanvas } from './ArticleCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, Image, Heading1, Heading2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ArticleEditorProps {
  blocks: BlockData[];
  onBlocksChange: (blocks: BlockData[]) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 500;

export function ArticleEditor({
  blocks,
  onBlocksChange,
  backgroundColor,
  onBackgroundColorChange,
}: ArticleEditorProps) {
  const { t } = useTranslation('content');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const addBlock = (type: BlockData['type']) => {
    const newBlock = createDefaultBlock(type, CANVAS_WIDTH);
    // Offset y based on existing blocks
    newBlock.y = blocks.length * 30 + 20;
    onBlocksChange([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (updated: BlockData) => {
    onBlocksChange(blocks.map((b) => (b.id === updated.id ? updated : b)));
  };

  const deleteBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">{t('articleEditor.add')}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => addBlock('title')}>
          <Heading1 className="h-4 w-4 mr-1" /> {t('articleEditor.title')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addBlock('subtitle')}>
          <Heading2 className="h-4 w-4 mr-1" /> {t('articleEditor.subtitle')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addBlock('text')}>
          <Type className="h-4 w-4 mr-1" /> {t('articleEditor.text')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addBlock('image')}>
          <Image className="h-4 w-4 mr-1" /> {t('articleEditor.image')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs">{t('articleEditor.background')}</Label>
        <Input
          type="color"
          value={backgroundColor}
          onChange={(e) => onBackgroundColorChange(e.target.value)}
          className="h-8 w-12 p-1"
        />
      </div>

      {/* Canvas */}
      <div className="overflow-x-auto">
        <ArticleCanvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onUpdateBlock={updateBlock}
          backgroundColor={backgroundColor}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      </div>

      {/* Selected block properties */}
      {selectedBlock && (
        <BlockProperties
          block={selectedBlock}
          onChange={updateBlock}
          onDelete={() => deleteBlock(selectedBlock.id)}
        />
      )}
    </div>
  );
}

export { CANVAS_WIDTH, CANVAS_HEIGHT };
