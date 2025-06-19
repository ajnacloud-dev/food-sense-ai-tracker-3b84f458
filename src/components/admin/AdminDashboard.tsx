
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserTable from "./AdminUserTable";
import CostAnalytics from "./CostAnalytics";
import PromptManager from "./PromptManager";
import ModelManager from "./ModelManager";
import { Users, DollarSign, MessageSquare, Settings } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users, costs, prompts, and system configuration</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analytics
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Prompts
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            AI Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUserTable />
        </TabsContent>

        <TabsContent value="costs">
          <CostAnalytics />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptManager />
        </TabsContent>

        <TabsContent value="models">
          <ModelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
