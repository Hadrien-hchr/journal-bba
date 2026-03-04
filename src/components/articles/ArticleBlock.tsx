export interface BlockData {
  id: string;
  type: 'text' | 'image' | 'title' | 'subtitle';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
}

export function createDefaultBlock(type: BlockData['type'], canvasWidth: number): BlockData {
  const id = crypto.randomUUID();
  const base = { id, x: 20, y: 20, color: '#000000' };

  switch (type) {
    case 'title':
      return { ...base, type, content: 'Titre', width: canvasWidth - 40, height: 60, fontSize: 32, fontWeight: 'bold', textAlign: 'center' };
    case 'subtitle':
      return { ...base, type, content: 'Sous-titre', width: canvasWidth - 40, height: 40, fontSize: 18, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' };
    case 'text':
      return { ...base, type, content: 'Votre texte ici...', width: canvasWidth - 40, height: 120, fontSize: 14, fontWeight: 'normal', textAlign: 'justify' };
    case 'image':
      return { ...base, type, content: '', width: 200, height: 200, objectFit: 'cover', borderRadius: 0 };
  }
}
