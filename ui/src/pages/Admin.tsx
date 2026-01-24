
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/admin/AdminDashboard";
import SimpleModelManager from "@/components/admin/SimpleModelManager";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    try {
      // User is already checked by useAuth/AuthContext logic roughly, but let's double check
      if (!user) {
        // Wait for context? It loads fast. 
        // If loading is true, we wait.
        // Actually useEffect dependency on [user] helps.
        // But let's assume if we are here and loading is done effectively.
      }

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: allUsers } = await api.from('users').select();
      const userData = allUsers?.find((u: any) => u.id === user.id);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, models, and system settings
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="models">AI Models</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="models">
            <SimpleModelManager />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default Admin;
