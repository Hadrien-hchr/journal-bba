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
          label="Image"
          value={block.content}
          onChange={(url) => update({ content: url })}
          folder="articles"
        />
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Contenu</Label>
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
              <Label className="text-xs">Taille police</Label>
              <Input
                type="number"
                value={block.fontSize || 14}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alignement</Label>
              <Select value={block.textAlign || 'left'} onValueChange={(v) => update({ textAlign: v as any })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Gauche</SelectItem>
                  <SelectItem value="center">Centre</SelectItem>
                  <SelectItem value="right">Droite</SelectItem>
                  <SelectItem value="justify">Justifié</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Couleur</Label>
              <Input
                type="color"
                value={block.color || '#000000'}
                onChange={(e) => update({ color: e.target.value })}
                className="h-8 p-1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Style</Label>
              <Select value={block.fontStyle || 'normal'} onValueChange={(v) => update({ fontStyle: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        {block.type === 'image' && (
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Ajustement</Label>
            <Select value={block.objectFit || 'cover'} onValueChange={(v) => update({ objectFit: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Couvrir</SelectItem>
                <SelectItem value="contain">Contenir</SelectItem>
                <SelectItem value="fill">Remplir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
