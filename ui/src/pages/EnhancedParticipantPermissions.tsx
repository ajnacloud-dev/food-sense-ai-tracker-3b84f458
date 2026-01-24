
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import EnhancedPermissionManager from "@/components/participant/EnhancedPermissionManager";

const EnhancedParticipantPermissions = () => {
  const navigate = useNavigate();

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/participant')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Permissions</h1>
            <p className="text-gray-600">Control what your caretakers can access</p>
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Granular Permission Control
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Fine-Grained Control:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Grant access to specific data categories only</li>
                  <li>Perfect for specialized care (dietitian gets only food data)</li>
                  <li>Revoke access instantly when needed</li>
                  <li>Track when permissions were granted</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Use Cases:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Dietitian:</strong> Food entries + health metrics only</li>
                  <li><strong>Trainer:</strong> Workouts + health metrics only</li>
                  <li><strong>Doctor:</strong> All health data except receipts</li>
                  <li><strong>Family:</strong> Basic overview without sensitive data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Caretakers
            </CardTitle>
            <CardDescription>
              Manage individual permissions for each of your caretakers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedPermissionManager />
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default EnhancedParticipantPermissions;
