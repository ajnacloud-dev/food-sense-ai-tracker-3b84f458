
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, QrCode, Share, Trash2 } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

interface InvitationCode {
  id: string;
  code: string;
  caretaker_type: string;
  permission_level: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  created_at: string;
}

const InvitationCodeManager = () => {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState({
    caretaker_type: 'family_member',
    permission_level: 'view_only',
    expires_in_days: 7,
    max_uses: 1
  });

  useEffect(() => {
    fetchInvitationCodes();
  }, []);

  const fetchInvitationCodes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      const { data, error } = await backendApi
        .from('invitation_codes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching invitation codes:', error);
      toast.error('Failed to load invitation codes');
    } finally {
      setLoading(false);
    }
  };

  const generateInvitationCode = async () => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      // Generate unique code
      const { data: codeData } = await backendApi.rpc('generate_invitation_code');
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + createForm.expires_in_days);

      const { error } = await backendApi
        .from('invitation_codes')
        .insert({
          code: codeData,
          created_by: user.id,
          caretaker_type: createForm.caretaker_type as any,
          permission_level: createForm.permission_level as any,
          expires_at: expiresAt.toISOString(),
          max_uses: createForm.max_uses
        });

      if (error) throw error;

      toast.success('Invitation code created successfully!');
      setShowCreateDialog(false);
      fetchInvitationCodes();
    } catch (error) {
      console.error('Error creating invitation code:', error);
      toast.error('Failed to create invitation code');
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const shareInvitation = async (code: string) => {
    const shareText = `Join me on HealthApp! Use invitation code: ${code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HealthApp Invitation',
          text: shareText,
        });
      } catch (error) {
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const deleteCode = async (codeId: string) => {
    try {
      const { error } = await backendApi
        .from('invitation_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast.success('Invitation code deleted');
      fetchInvitationCodes();
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('Failed to delete code');
    }
  };

  const getStatusColor = (code: InvitationCode) => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    
    if (now > expiresAt) return 'bg-red-100 text-red-800';
    if (code.max_uses && code.current_uses >= code.max_uses) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (code: InvitationCode) => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    
    if (now > expiresAt) return 'Expired';
    if (code.max_uses && code.current_uses >= code.max_uses) return 'Used Up';
    return 'Active';
  };

  if (loading) {
    return <div>Loading invitation codes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Invitation Codes</CardTitle>
            <CardDescription>
              Generate and manage invitation codes for participants to join
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invitation Code</DialogTitle>
                <DialogDescription>
                  Generate a new invitation code for participants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="caretaker_type">Your Role</Label>
                  <Select
                    value={createForm.caretaker_type}
                    onValueChange={(value) => setCreateForm({ ...createForm, caretaker_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dietitian">Dietitian</SelectItem>
                      <SelectItem value="family_member">Family Member</SelectItem>
                      <SelectItem value="healthcare_provider">Healthcare Provider</SelectItem>
                      <SelectItem value="personal_trainer">Personal Trainer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permission_level">Permission Level</Label>
                  <Select
                    value={createForm.permission_level}
                    onValueChange={(value) => setCreateForm({ ...createForm, permission_level: value })}
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
                <div>
                  <Label htmlFor="expires_in_days">Expires In (Days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={createForm.expires_in_days}
                    onChange={(e) => setCreateForm({ ...createForm, expires_in_days: parseInt(e.target.value) || 7 })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.max_uses}
                    onChange={(e) => setCreateForm({ ...createForm, max_uses: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <Button onClick={generateInvitationCode} className="w-full">
                  Generate Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell>
                  <div className="font-mono font-medium">{code.code}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {code.caretaker_type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{code.permission_level.replace('_', ' ')}</TableCell>
                <TableCell>
                  {code.current_uses}/{code.max_uses}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(code)}`}>
                    {getStatusText(code)}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(code.expires_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(code.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => shareInvitation(code.code)}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCode(code.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No invitation codes yet. Create your first code to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default InvitationCodeManager;
