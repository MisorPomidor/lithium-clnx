import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Camera, Clock, Trophy } from 'lucide-react';

interface PromotionRequirementsModalProps {
  rank: 'Test' | 'Main';
  open: boolean;
  onClose: () => void;
}

const PromotionRequirementsModal: React.FC<PromotionRequirementsModalProps> = ({ rank, open, onClose }) => {
  const requirements = rank === 'Test'
    ? [
        { icon: <Camera className="w-5 h-5 text-primary" />, text: '6 скринов с ГГ (3 сайга / 3 тяга) KD > 0.9' },
        { icon: <Camera className="w-5 h-5 text-success" />, text: '4 скрина с семейного МП' },
        { icon: <Clock className="w-5 h-5 text-warning" />, text: 'Откат с капта/МП' },
      ]
    : [
        { icon: <Camera className="w-5 h-5 text-primary" />, text: '8 скринов с ГГ (4 сайга / 4 тяга) KD > 1.2' },
        { icon: <Camera className="w-5 h-5 text-success" />, text: '8 скринов с семейного МП' },
        { icon: <Clock className="w-5 h-5 text-warning" />, text: 'Откаты с ГГ (Сайга/Тяга) 5 мин' },
        { icon: <Clock className="w-5 h-5 text-destructive" />, text: 'Откат с капта/МП' },
      ];

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Требования для повышения ({rank})
          </DialogTitle>
        </DialogHeader>
        <ul className="mt-4 space-y-3">
          {requirements.map((req, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              {req.icon} <span>{req.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-right">
          <DialogClose asChild>
            <Button variant="outline">Закрыть</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionRequirementsModal;
