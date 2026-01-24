
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import PermissionManager from "@/components/participant/PermissionManager";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy & Permissions</h1>
            <p className="text-gray-600">Control what your caretakers can access</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permission Settings</CardTitle>
            <CardDescription>
              Grant or revoke access to different categories of your health data for each caretaker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionManager />
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Privacy;
