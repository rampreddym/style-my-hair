import { Bell, BellOff, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

interface NotificationToggleProps {
  variant?: 'button' | 'switch';
  showLabel?: boolean;
  className?: string;
}

export function NotificationToggle({ 
  variant = 'switch', 
  showLabel = true,
  className = ''
}: NotificationToggleProps) {
  const { user } = useAuth();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();
  const [testingNotification, setTestingNotification] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    
    setTestingNotification(true);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          action: 'send-reminder',
          userId: user.id,
          title: 'Test Notification 🎉',
          body: 'Push notifications are working! You will receive reminders 1 hour before your appointments.',
        }
      });

      if (error) {
        console.error('Test notification error:', error);
        toast.error('Failed to send test notification');
      } else {
        toast.success('Test notification sent!');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Failed to send test notification');
    } finally {
      setTestingNotification(false);
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isSubscribed ? 'secondary' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isSubscribed ? (
          <Bell className="h-4 w-4 mr-2" />
        ) : (
          <BellOff className="h-4 w-4 mr-2" />
        )}
        {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
      </Button>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        {showLabel && (
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              Push Notifications
            </span>
          </div>
        )}
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading || permission === 'denied'}
        />
      </div>
      {isSubscribed && (
        <Button
          variant="outline"
          size="sm"
          onClick={sendTestNotification}
          disabled={testingNotification}
          className="w-full"
        >
          {testingNotification ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Test Notification
        </Button>
      )}
    </div>
  );
}
