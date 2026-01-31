import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Video, Image, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UploadReportDialogProps {
  onSubmit: (report: { type: 'video' | 'screenshot'; url: string; description: string }) => void;
}

const UploadReportDialog: React.FC<UploadReportDialogProps> = ({ onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'video' | 'screenshot'>('video');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !description) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }
    onSubmit({ type, url, description });
    setUrl('');
    setDescription('');
    setOpen(false);
    toast({
      title: 'Отчёт отправлен',
      description: 'Ваш отчёт успешно загружен',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glow" size="lg" className="gap-2">
          <Upload className="w-5 h-5" />
          Загрузить отчёт
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Загрузить отчёт</DialogTitle>
          <DialogDescription>
            Добавьте ссылку на видео с арены или скриншот с мероприятия
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label>Тип отчёта</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as 'video' | 'screenshot')}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 p-3 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <RadioGroupItem value="video" />
                <Video className="w-4 h-4 text-destructive" />
                <span className="text-sm">Видео YouTube</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <RadioGroupItem value="screenshot" />
                <Image className="w-4 h-4 text-primary" />
                <span className="text-sm">Скриншот</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              {type === 'video' ? 'Ссылка на YouTube' : 'Ссылка на изображение'}
            </Label>
            <Input
              id="url"
              placeholder={type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание отчёта..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary resize-none"
              rows={3}
            />
          </div>

          <Button type="submit" variant="glow" className="w-full gap-2">
            <Send className="w-4 h-4" />
            Отправить отчёт
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadReportDialog;
