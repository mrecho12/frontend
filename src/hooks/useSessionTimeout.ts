import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const DEFAULT_TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_DURATION = 2 * 60 * 1000; // 2 minutes
const DEFAULT_COUNTDOWN_INTERVAL = 1000; // 1 second

interface UseSessionTimeoutProps {
  timeoutDuration?: number;
  warningDuration?: number;
  countdownInterval?: number;
  onSessionExpired?: () => void;
  enabled?: boolean;
}

export const useSessionTimeout = ({
  timeoutDuration = DEFAULT_TIMEOUT_DURATION,
  warningDuration = DEFAULT_WARNING_DURATION,
  countdownInterval = DEFAULT_COUNTDOWN_INTERVAL,
  onSessionExpired,
  enabled = true,
}: UseSessionTimeoutProps = {}) => {
  const {
    isAuthenticated,
    logout,
    isSessionWarningVisible,
    setSessionWarningVisible,
    setRemainingTime,
    remainingTime,
    setLastActivityTime,
    lastActivityTime,
    isSessionActive,
    setSessionActive,
  } = useAuthStore();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningEndTimeRef = useRef<number>(0);

  // Reset the session timer
  const resetSession = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Hide warning and reset states
    setSessionWarningVisible(false);
    setSessionActive(true);
    setRemainingTime(timeoutDuration);
    setLastActivityTime(Date.now());

    // Set timeout for session expiration
    if (enabled && isAuthenticated) {
      // Schedule session warning
      warningTimeoutRef.current = setTimeout(() => {
        setSessionWarningVisible(true);
        setSessionActive(false);
        warningEndTimeRef.current = Date.now() + warningDuration;
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - warningEndTimeRef.current;
          const remaining = Math.max(0, warningDuration - elapsed);
          setRemainingTime(remaining);

          // Auto logout when countdown reaches zero
          if (remaining <= 0) {
            handleLogout();
          }
        }, countdownInterval);

        // Auto logout after warning duration
        timeoutRef.current = setTimeout(() => {
          handleLogout();
        }, warningDuration);
      }, timeoutDuration - warningDuration);
    }
  }, [
    enabled,
    isAuthenticated,
    timeoutDuration,
    warningDuration,
    countdownInterval,
    setSessionWarningVisible,
    setRemainingTime,
    setLastActivityTime,
    setSessionActive,
  ]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Hide warning modal
    setSessionWarningVisible(false);

    // Call custom callback
    if (onSessionExpired) {
      onSessionExpired();
    }

    // Perform logout
    try {
      await logout();
      toast.success('Session expired. Please login again.');
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout API fails
      window.location.href = '/login';
    }
  }, [logout, setSessionWarningVisible, onSessionExpired]);

  // Extend session (called when user clicks "Stay Logged In")
  const extendSession = useCallback(() => {
    resetSession();
    toast.success('Session extended');
  }, [resetSession]);

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (isAuthenticated && !isSessionWarningVisible) {
      resetSession();
    }
  }, [isAuthenticated, isSessionWarningVisible, resetSession]);

  // Setup activity listeners
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Reset session on mount
    resetSession();

    // Define activity events
    const events = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'mousemove',
    ];

    // Add event listeners for activity detection
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      // Clear all timeouts on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [enabled, isAuthenticated, resetSession, handleActivity]);

  // Update remaining time every second when warning is visible
  useEffect(() => {
    if (isSessionWarningVisible && isSessionActive === false) {
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - warningEndTimeRef.current;
        const remaining = Math.max(0, warningDuration - elapsed);
        setRemainingTime(remaining);

        if (remaining <= 0) {
          handleLogout();
        }
      }, countdownInterval);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [
    isSessionWarningVisible,
    isSessionActive,
    warningDuration,
    countdownInterval,
    setRemainingTime,
    handleLogout,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    resetSession,
    extendSession,
    logout: handleLogout,
    isSessionWarningVisible,
    remainingTime,
    isSessionActive,
    lastActivityTime,
  };
};

export default useSessionTimeout;

