
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role === 'admin') {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div>Loading...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarLayout>
      <AdminDashboard />
    </SidebarLayout>
  );
};

export default Admin;
