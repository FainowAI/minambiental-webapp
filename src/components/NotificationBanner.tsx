import { X, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationWithContract } from '@/services/notificationService';
import { useNavigate } from 'react-router-dom';

interface NotificationBannerProps {
  notification: NotificationWithContract;
  onDismiss: (notificationId: string) => void;
}

const NotificationBanner = ({ notification, onDismiss }: NotificationBannerProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (notification.licenca_id && notification.contractId) {
      navigate(`/view-contract/${notification.licenca_id}/${notification.contractId}`);
    }
  };

  const handleDismiss = () => {
    onDismiss(notification.id);
  };

  // Extrair o texto do link da mensagem
  const messageParts = notification.mensagem.split('Clique aqui para realizar a apuração.');
  const messageText = messageParts[0] || notification.mensagem;
  const hasLink = notification.mensagem.includes('Clique aqui');

  return (
    <Alert className="bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500">
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded bg-yellow-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-sm text-yellow-900">
            <span>{messageText}</span>
            {hasLink && (
              <button
                onClick={handleClick}
                className="underline font-semibold text-yellow-900 hover:text-yellow-700 ml-1"
                disabled={!notification.licenca_id || !notification.contractId}
              >
                Clique aqui para realizar a apuração.
              </button>
            )}
          </AlertDescription>
        </div>

        {/* Botão fechar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="flex-shrink-0 h-8 w-8 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};

export default NotificationBanner;

