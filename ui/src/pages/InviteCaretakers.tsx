import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Copy, Mail, QrCode, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { formatDistanceToNow } from "date-fns";

interface InvitationCode {
  id: string;
  code: string;
  caretaker_type: string;
  permission_level: string;
  expires_at: string;
  current_uses: number;
  max_uses: number;
  created_at: string;
  used_by?: string;
  used_at?: string;
}

const InviteCaretakers = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caretakerType: 'family_member',
    permissionLevel: 'view_only',
    maxUses: 1,
    expiresInDays: 7
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      const { data, error } = await backendApi
        .from('invitation_codes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    }
  };

  const generateInvitation = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + formData.expiresInDays);

      // Generate a random code using the existing function
      const { data: codeData, error: codeError } = await backendApi.rpc('generate_invitation_code');
      if (codeError) throw codeError;

      const { data, error } = await backendApi
        .from('invitation_codes')
        .insert({
          code: codeData,
          created_by: user.id,
          caretaker_type: formData.caretakerType as any,
          permission_level: formData.permissionLevel as any,
          max_uses: formData.maxUses,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Invitation code generated successfully!');
      fetchInvitations();
      
      // Reset form
      setFormData({
        caretakerType: 'family_member',
        permissionLevel: 'view_only',
        maxUses: 1,
        expiresInDays: 7
      });
    } catch (error) {
      console.error('Error generating invitation:', error);
      toast.error('Failed to generate invitation code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const inviteUrl = `${window.location.origin}/join?invite=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invitation link copied to clipboard!');
  };

  const shareViaEmail = (code: string) => {
    const inviteUrl = `${window.location.origin}/join?invite=${code}`;
    const subject = encodeURIComponent('Health Monitoring Invitation');
    const body = encodeURIComponent(
      `You've been invited to be a caretaker. Use this link to join: ${inviteUrl}\n\nInvitation Code: ${code}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const getStatusBadge = (invitation: InvitationCode) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (invitation.current_uses >= invitation.max_uses) {
      return <Badge variant="secondary">Used</Badge>;
    } else if (now > expiresAt) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invite Caretakers</h1>
            <p className="text-gray-600">Generate invitation codes for your caretakers</p>
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">How the Invitation System Works</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2">
              <li>Generate an invitation code below with the appropriate permissions</li>
              <li>Share the invitation link with your caretaker via email or copy the link</li>
              <li>The caretaker clicks the link and is taken to a signup page</li>
              <li>They complete their account creation with the invitation code pre-filled</li>
              <li>Once they sign up, they automatically become your caretaker with the specified permissions</li>
            </ol>
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <strong>Note:</strong> Caretakers can also visit <code className="bg-blue-100 px-1 rounded">/join</code> directly and enter the invitation code manually.
            </div>
          </CardContent>
        </Card>

        {/* Generate New Invitation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate New Invitation
            </CardTitle>
            <CardDescription>
              Create an invitation code for a new caretaker
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caretaker-type">Caretaker Type</Label>
                <Select
                  value={formData.caretakerType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, caretakerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family_member">Family Member</SelectItem>
                    <SelectItem value="healthcare_provider">Healthcare Provider</SelectItem>
                    <SelectItem value="dietitian">Dietitian</SelectItem>
                    <SelectItem value="personal_trainer">Personal Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission-level">Permission Level</Label>
                <Select
                  value={formData.permissionLevel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, permissionLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">View Only</SelectItem>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="full_access">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-uses">Maximum Uses</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxUses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires-in">Expires In (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 7 }))}
                />
              </div>
            </div>

            <Button onClick={generateInvitation} disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Invitation Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Invitations
            </CardTitle>
            <CardDescription>
              Manage your existing invitation codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length > 0 ? (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {invitation.code}
                        </code>
                        {getStatusBadge(invitation)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(invitation.code)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareViaEmail(invitation.code)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{invitation.caretaker_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Permission:</span>
                        <p className="font-medium capitalize">{invitation.permission_level.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Uses:</span>
                        <p className="font-medium">{invitation.current_uses}/{invitation.max_uses}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
                <p>Generate your first invitation code to start inviting caretakers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default InviteCaretakers;
