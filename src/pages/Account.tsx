import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useProfile, 
  useUpdateProfile, 
  useFriends, 
  useFriendRequests,
  useSearchProfiles,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  Profile
} from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Camera, 
  Search, 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  Loader2,
  Users,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Account() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  
  const updateProfile = useUpdateProfile();
  const searchProfiles = useSearchProfiles();
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const getDisplayName = (p: Profile | null | undefined) => {
    if (!p) return 'Utilisateur';
    if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`;
    if (p.full_name) return p.full_name;
    return p.email?.split('@')[0] || 'Utilisateur';
  };

  const getInitials = (p: Profile | null | undefined) => {
    if (!p) return 'U';
    if (p.first_name && p.last_name) {
      return `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
    }
    if (p.full_name) {
      const parts = p.full_name.split(' ');
      return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : p.full_name[0].toUpperCase();
    }
    return p.email?.[0]?.toUpperCase() || 'U';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Path format: avatars/{user_id}/{filename} to match RLS policy
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      toast.success('Photo de profil mise à jour');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const results = await searchProfiles.mutateAsync(searchTerm);
      
      // Filter out existing friends and pending requests
      const friendIds = friends?.map(f => f.friend?.id) || [];
      const pendingIds = [
        ...(requests?.outgoing.map(r => r.to_user_id) || []),
        ...(requests?.incoming.map(r => r.from_user_id) || []),
      ];
      
      const filtered = results.filter(p => 
        !friendIds.includes(p.id) && !pendingIds.includes(p.id)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleSendRequest = async (toUserId: string) => {
    try {
      await sendRequest.mutateAsync(toUserId);
      setSearchResults(prev => prev.filter(p => p.id !== toUserId));
      toast.success('Demande d\'ami envoyée');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const handleAcceptRequest = async (request: typeof requests extends { incoming: infer T } ? T extends (infer U)[] ? U : never : never) => {
    try {
      await acceptRequest.mutateAsync(request);
      toast.success('Demande acceptée');
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast.success('Demande refusée');
    } catch (error) {
      toast.error('Erreur lors du refus');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend.mutateAsync(friendId);
      toast.success('Ami supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-16 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display font-bold ml-2">Mon Compte</h1>
        </div>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-lg mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl gradient-red text-primary-foreground">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              
              <h2 className="mt-4 text-xl font-display font-bold">
                {getDisplayName(profile)}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Amis ({friends?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Demandes ({requests?.incoming.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 mt-4">
            {/* Search */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ajouter un ami</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleSearch}
                    disabled={searchProfiles.isPending}
                  >
                    {searchProfiles.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {searchResults.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(p)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{getDisplayName(p)}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(p.id)}
                          disabled={sendRequest.isPending}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friends List */}
            {friendsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : friends && friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friendship) => (
                  <Card key={friendship.id} className="shadow-soft">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friendship.friend?.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(friendship.friend)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getDisplayName(friendship.friend)}</p>
                            <p className="text-xs text-muted-foreground">
                              {friendship.friend?.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => friendship.friend && handleRemoveFriend(friendship.friend.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Vous n'avez pas encore d'amis
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recherchez des utilisateurs pour les ajouter
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-4">
            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Incoming Requests */}
                {requests?.incoming && requests.incoming.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Demandes reçues
                    </h3>
                    {requests.incoming.map((request) => (
                      <Card key={request.id} className="shadow-soft">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={request.from_user?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(request.from_user)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{getDisplayName(request.from_user)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Souhaite vous ajouter
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleAcceptRequest(request)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Outgoing Requests */}
                {requests?.outgoing && requests.outgoing.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Demandes envoyées
                    </h3>
                    {requests.outgoing.map((request) => (
                      <Card key={request.id} className="shadow-soft border-dashed">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.to_user?.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(request.to_user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getDisplayName(request.to_user)}</p>
                              <p className="text-xs text-muted-foreground">
                                En attente de réponse...
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {(!requests?.incoming || requests.incoming.length === 0) && 
                 (!requests?.outgoing || requests.outgoing.length === 0) && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Mail className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Aucune demande en attente
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
