import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Clock } from 'lucide-react';

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface SessionTimeoutModalProps {
  remainingTime: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  remainingTime,
  onExtend,
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Warning Header */}
        <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800">
                {t('session.timeoutWarning')}
              </h3>
              <p className="text-sm text-amber-600">
                {t('session.inactiveWarning')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Countdown Display */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-secondary-100 rounded-lg px-6 py-4">
              <Clock className="h-5 w-5 text-secondary-600" />
              <span className="text-2xl font-mono font-bold text-secondary-800">
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-secondary-600 text-sm">
              {t('session.autoLogoutMessage')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex-1"
            >
              {t('session.logoutNow')}
            </Button>
            <Button
              variant="primary"
              onClick={onExtend}
              className="flex-1"
            >
              {t('session.stayLoggedIn')}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary-100">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.max(0, (remainingTime / (2 * 60 * 1000)) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;

