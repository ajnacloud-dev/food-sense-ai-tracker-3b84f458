
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SidebarLayout from "@/components/layout/SidebarLayout";
import CaretakerDashboard from "@/components/caretaker/CaretakerDashboard";

const Caretaker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isCaretaker, setIsCaretaker] = useState(false);

  useEffect(() => {
    checkCaretakerAccess();
  }, []);

  const checkCaretakerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has caretaker role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const hasCaretakerRole = userData?.role === 'caretaker' || userData?.role === 'dietitian' || userData?.role === 'admin';
      
      if (!hasCaretakerRole) {
        navigate('/dashboard');
        return;
      }

      setIsCaretaker(true);
    } catch (error) {
      console.error('Error checking caretaker access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Checking access permissions...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!isCaretaker) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Access denied. Caretaker role required.</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <CaretakerDashboard />
    </SidebarLayout>
  );
};

export default Caretaker;
