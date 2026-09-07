import { useTranslation } from 'react-i18next';
import { BlockData } from './ArticleBlock';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { FileUploadInput } from '@/components/FileUploadInput';

interface BlockPropertiesProps {
  block: BlockData;
  onChange: (block: BlockData) => void;
  onDelete: () => void;
}

export function BlockProperties({ block, onChange, onDelete }: BlockPropertiesProps) {
  const { t } = useTranslation('content');
  const update = (partial: Partial<BlockData>) => onChange({ ...block, ...partial });

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{block.type}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {block.type === 'image' ? (
        <FileUploadInput
          label={t('blockProperties.imageLabel')}
          value={block.content}
          onChange={(url) => update({ content: url })}
          folder="articles"
        />
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">{t('blockProperties.content')}</Label>
          <Textarea
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            rows={3}
            className="text-xs"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {block.type !== 'image' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">{t('blockProperties.fontSize')}</Label>
              <Input
                type="number"
                value={block.fontSize || 14}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('blockProperties.alignment')}</Label>
              <Select value={block.textAlign || 'left'} onValueChange={(v) => update({ textAlign: v as any })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{t('blockProperties.alignLeft')}</SelectItem>
                  <SelectItem value="center">{t('blockProperties.alignCenter')}</SelectItem>
                  <SelectItem value="right">{t('blockProperties.alignRight')}</SelectItem>
                  <SelectItem value="justify">{t('blockProperties.alignJustify')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('blockProperties.color')}</Label>
              <Input
                type="color"
                value={block.color || '#000000'}
                onChange={(e) => update({ color: e.target.value })}
                className="h-8 p-1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('blockProperties.style')}</Label>
              <Select value={block.fontStyle || 'normal'} onValueChange={(v) => update({ fontStyle: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t('blockProperties.styleNormal')}</SelectItem>
                  <SelectItem value="italic">{t('blockProperties.styleItalic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        {block.type === 'image' && (
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">{t('blockProperties.fit')}</Label>
            <Select value={block.objectFit || 'cover'} onValueChange={(v) => update({ objectFit: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">{t('blockProperties.fitCover')}</SelectItem>
                <SelectItem value="contain">{t('blockProperties.fitContain')}</SelectItem>
                <SelectItem value="fill">{t('blockProperties.fitFill')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
