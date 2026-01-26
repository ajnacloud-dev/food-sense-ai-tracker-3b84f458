
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Mail, Check, X, Edit } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

interface CareRelationship {
  id: string;
  user_id: string;
  caretaker_type: string;
  permission_level: string;
  status: string;
  created_at: string;
  notes?: string;
  participant?: {
    full_name: string;
    email: string;
  };
}

interface CareRelationshipManagerProps {
  onRelationshipUpdated: () => void;
}

const CareRelationshipManager = ({ onRelationshipUpdated }: CareRelationshipManagerProps) => {
  const [relationships, setRelationships] = useState<CareRelationship[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    caretaker_type: 'family_member',
    permission_level: 'view_only',
    notes: ''
  });

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      const { data } = await backendApi
        .from('care_relationships')
        .select(`
          *,
          participant:users!care_relationships_user_id_fkey (full_name, email)
        `)
        .eq('caretaker_id', user.id)
        .order('created_at', { ascending: false });

      const formattedData = (data || []).map(rel => ({
        id: rel.id,
        user_id: rel.user_id,
        caretaker_type: rel.caretaker_type,
        permission_level: rel.permission_level,
        status: rel.status,
        created_at: rel.created_at,
        notes: rel.notes,
        participant: rel.participant
      }));

      setRelationships(formattedData);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteParticipant = async () => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      // First, check if user exists with this email
      const { data: existingUser } = await backendApi
        .from('users')
        .select('id')
        .eq('email', inviteForm.email.toLowerCase())
        .single();

      if (!existingUser) {
        toast.error('User with this email does not exist. They need to sign up first.');
        return;
      }

      // Check if relationship already exists
      const { data: existingRelation } = await backendApi
        .from('care_relationships')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('caretaker_id', user.id)
        .single();

      if (existingRelation) {
        toast.error('You already have a relationship with this user.');
        return;
      }

      // Create the care relationship
      const { error } = await backendApi
        .from('care_relationships')
        .insert({
          user_id: existingUser.id,
          caretaker_id: user.id,
          caretaker_type: inviteForm.caretaker_type as any,
          permission_level: inviteForm.permission_level as any,
          status: 'pending' as any,
          invited_by: user.id,
          notes: inviteForm.notes || null
        });

      if (error) throw error;

      toast.success('Care relationship invitation sent successfully!');
      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        caretaker_type: 'family_member',
        permission_level: 'view_only',
        notes: ''
      });
      fetchRelationships();
      onRelationshipUpdated();

    } catch (error) {
      console.error('Error creating care relationship:', error);
      toast.error('Failed to send invitation');
    }
  };

  const updateRelationshipStatus = async (relationshipId: string, status: 'active' | 'inactive' | 'rejected') => {
    try {
      const { error } = await backendApi
        .from('care_relationships')
        .update({ 
          status,
          approved_at: status === 'active' ? new Date().toISOString() : null
        })
        .eq('id', relationshipId);

      if (error) throw error;

      toast.success(`Relationship ${status} successfully`);
      fetchRelationships();
      onRelationshipUpdated();
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast.error('Failed to update relationship');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading relationships...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Care Relationships</CardTitle>
              <CardDescription>
                Manage your participant relationships and permissions
              </CardDescription>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Participant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite New Participant</DialogTitle>
                  <DialogDescription>
                    Send a care relationship invitation to a user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Participant Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="participant@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="caretaker_type">Your Role</Label>
                    <Select
                      value={inviteForm.caretaker_type}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, caretaker_type: value })}
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
                      value={inviteForm.permission_level}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, permission_level: value })}
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
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this relationship..."
                      value={inviteForm.notes}
                      onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleInviteParticipant} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
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
                <TableHead>Participant</TableHead>
                <TableHead>Your Role</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relationships.map((relationship) => (
                <TableRow key={relationship.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{relationship.participant?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{relationship.participant?.email || 'Unknown'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {relationship.caretaker_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{relationship.permission_level.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(relationship.status)}`}>
                      {relationship.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(relationship.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {relationship.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRelationshipStatus(relationship.id, 'active')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRelationshipStatus(relationship.id, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {relationship.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRelationshipStatus(relationship.id, 'inactive')}
                        >
                          Deactivate
                        </Button>
                      )}
                      {relationship.status === 'inactive' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRelationshipStatus(relationship.id, 'active')}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {relationships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No care relationships yet. Invite your first participant to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CareRelationshipManager;
