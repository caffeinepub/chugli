import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Users, MapPin, Loader2, AlertCircle, Search, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRoomsByLocation, useCreateRoom } from '../hooks/useQueries';
import { useAreaSelection } from '../hooks/useAreaSelection';
import { useAuthControls } from '../hooks/useAuthControls';
import { setPostLoginRedirect } from '../utils/auth/postLoginRedirect';
import { isAuthError, extractErrorMessage } from '../utils/auth/isAuthError';
import { ALL_AREAS_ID } from '../storage/areaSelectionStorage';
import { toast } from 'sonner';

export default function RoomsPage() {
  const navigate = useNavigate();
  const { selection } = useAreaSelection();
  const { isAuthenticated } = useAuthControls();
  
  // Map ALL_AREAS_ID sentinel to null for backend query
  const locationParam = selection.areaId === ALL_AREAS_ID ? null : selection.areaId;
  const { data: rooms, isLoading } = useRoomsByLocation(locationParam);
  
  const createRoom = useCreateRoom();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  const isAllAreasSelected = selection.areaId === ALL_AREAS_ID;

  // Filter rooms based on applied search query - exact match on room.id
  const filteredRooms = rooms?.filter((room) => {
    const trimmedQuery = appliedSearchQuery.trim();
    if (!trimmedQuery) {
      return true; // Show all rooms when query is empty
    }
    return room.id === trimmedQuery;
  });

  const handleLoginClick = () => {
    setPostLoginRedirect('/');
    navigate({ to: '/login' });
  };

  const handleCreateRoomClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a room');
      handleLoginClick();
      return;
    }

    if (!selection.areaId) {
      toast.error('Please select an area first');
      navigate({ to: '/settings' });
      return;
    }

    // Block room creation when "All areas" is selected
    if (isAllAreasSelected) {
      toast.error('Please select a specific area to create a room');
      navigate({ to: '/settings' });
      return;
    }

    setIsDialogOpen(true);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    if (!selection.areaId) {
      toast.error('Please select an area first');
      navigate({ to: '/settings' });
      return;
    }

    // Block room creation when "All areas" is selected
    if (isAllAreasSelected) {
      toast.error('Please select a specific area to create a room');
      navigate({ to: '/settings' });
      return;
    }

    try {
      await createRoom.mutateAsync({
        name: roomName.trim(),
        location: selection.areaId,
      });
      toast.success('Room created!');
      setIsDialogOpen(false);
      setRoomName('');
    } catch (error) {
      // Check if this is an authentication/authorization error
      if (isAuthError(error)) {
        toast.error('Please log in to create a room');
        setIsDialogOpen(false);
        setPostLoginRedirect('/');
        navigate({ to: '/login' });
      } else {
        // For other errors, show the backend error message for diagnosis
        const errorMsg = extractErrorMessage(error);
        toast.error(`Failed to create room: ${errorMsg}`);
        console.error('Room creation error:', error);
      }
    }
  };

  const handleJoinRoom = (roomId: string) => {
    navigate({ to: '/chat/$roomId', params: { roomId } });
  };

  const handleSearch = () => {
    setAppliedSearchQuery(draftSearchQuery.trim());
  };

  const handleClear = () => {
    setDraftSearchQuery('');
    setAppliedSearchQuery('');
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setDraftSearchQuery(appliedSearchQuery);
  };

  return (
    <div className="container h-full overflow-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rooms</h1>
            <p className="text-muted-foreground mt-1">
              {selection.areaLabel ? `Showing rooms in ${selection.areaLabel}` : 'Select an area to see rooms'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <Button onClick={handleCreateRoomClick}>
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </Button>
          </div>
        </div>

        {/* Login prompt for guests */}
        {!isAuthenticated && (
          <Alert>
            <LogIn className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You're browsing as a guest. Log in to create rooms and send messages.</span>
              <Button onClick={handleLoginClick} size="sm" variant="outline" className="ml-4">
                Log in
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRooms && filteredRooms.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No rooms found</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {appliedSearchQuery.trim()
                  ? `No room found with ID "${appliedSearchQuery.trim()}"`
                  : isAllAreasSelected
                    ? 'No rooms available yet'
                    : 'Be the first to create a room in this area'}
              </p>
              {!appliedSearchQuery.trim() && !isAllAreasSelected && isAuthenticated && (
                <Button onClick={handleCreateRoomClick}>
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Room
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rooms List */}
        {!isLoading && filteredRooms && filteredRooms.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleJoinRoom(room.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex-1">{room.name}</span>
                    <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </CardTitle>
                  {room.location && (
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {room.location}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Create Room Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Room</DialogTitle>
              <DialogDescription>
                Start a conversation in {selection.areaLabel || 'your area'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  placeholder="e.g., Weekend Plans, Local Events"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoom} disabled={createRoom.isPending || !roomName.trim()}>
                {createRoom.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search Dialog */}
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search Rooms</DialogTitle>
              <DialogDescription>Find a room by entering its unique room ID</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Enter room ID..."
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                    setIsSearchOpen(false);
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={() => {
                  handleSearch();
                  setIsSearchOpen(false);
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
