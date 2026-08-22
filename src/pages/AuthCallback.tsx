import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const waitForSession = async () => {
      // Tokens may still be exchanged from the URL right after the OAuth redirect
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) return data.session;
        await new Promise((r) => setTimeout(r, 250));
      }
      return null;
    };

    const handleCallback = async () => {
      const session = await waitForSession();

      if (session?.user) {
        // Check if user already has a role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (existingRole) {
          // User has a role, navigate to their dashboard
          navigate(existingRole.role === 'stylist' ? '/stylist' : '/customer');
        } else {
          // New user - get pending role from localStorage
          const pendingRole = localStorage.getItem('pending_role') as 'customer' | 'stylist' | null;
          const role = pendingRole || 'customer';
          
          // Insert role
          await supabase.from('user_roles').insert({
            user_id: session.user.id,
            role
          });
          
          localStorage.removeItem('pending_role');
          navigate(role === 'stylist' ? '/stylist' : '/customer');
        }
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Completing sign in...</div>
    </div>
  );
};

export default AuthCallback;
