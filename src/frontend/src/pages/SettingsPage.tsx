import { MapPin, User, Shield, Info, LogIn, LogOut, Loader2, Bug, Lock, Unlock } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAreaSelection } from '../hooks/useAreaSelection';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuthControls } from '../hooks/useAuthControls';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { AVAILABLE_AREAS, ALL_AREAS_ID } from '../storage/areaSelectionStorage';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { selection, enableLocationAccess, disableLocationAccess, setArea } = useAreaSelection();
  const { 
    profile, 
    updateProfile, 
    createDefaultProfile,
    isLoading: profileLoading, 
    isFetched, 
    isAuthenticated: profileIsAuthenticated,
    isProfileReady,
  } = useUserProfile();
  const { isAuthenticated, logout, isLoggingIn } = useAuthControls();
  const { identity } = useInternetIdentity();
  const { isUnlocked, unlock, lock, error: adminError } = useAdminAccess();
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Sort areas alphabetically, keeping "All areas" first
  const sortedAreas = useMemo(() => {
    const allAreasOption = AVAILABLE_AREAS.find(a => a.id === ALL_AREAS_ID);
    const otherAreas = AVAILABLE_AREAS.filter(a => a.id !== ALL_AREAS_ID).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    return allAreasOption ? [allAreasOption, ...otherAreas] : otherAreas;
  }, []);

  const handleLocationToggle = async (checked: boolean) => {
    if (checked) {
      // Enable: request geolocation
      setIsRequestingLocation(true);
      const result = await enableLocationAccess();
      setIsRequestingLocation(false);
      
      if (result.success && result.stateName) {
        toast.success(`Location enabled! Area set to ${result.stateName}`);
      } else if (result.error) {
        toast.error(result.error);
      }
    } else {
      // Disable: just turn off the flag
      disableLocationAccess();
      toast.success('Location access disabled');
    }
  };

  const handleAreaChange = (areaId: string) => {
    const area = AVAILABLE_AREAS.find(a => a.id === areaId);
    if (area) {
      setArea(area.id, area.label);
      toast.success(`Area changed to ${area.label}`);
    }
  };

  const handleNicknameChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nickname = formData.get('nickname') as string;
    if (nickname && nickname.trim()) {
      setIsSavingProfile(true);
      try {
        await updateProfile({ nickname: nickname.trim() });
        toast.success('Nickname updated!');
      } catch (error) {
        toast.error('Failed to update nickname');
        console.error(error);
      } finally {
        setIsSavingProfile(false);
      }
    }
  };

  const handleCreateDefaultProfile = async () => {
    setIsCreatingProfile(true);
    try {
      await createDefaultProfile();
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleLoginClick = () => {
    navigate({ to: '/login' });
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
      console.error(error);
    }
  };

  const handleAdminClick = () => {
    navigate({ to: '/admin' });
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlock(adminPassword);
    if (success) {
      setAdminPassword('');
      toast.success('Admin access unlocked');
    }
  };

  const handleAdminLock = () => {
    lock();
    toast.success('Admin access locked');
  };

  const showProfileSetup = isAuthenticated && isFetched;
  const showCreateProfileButton = isAuthenticated && isFetched && !profile && !profileLoading;

  // Get principal for display
  const principalString = identity?.getPrincipal().toString() || null;
  const isAnonymous = !identity || identity.getPrincipal().isAnonymous();

  return (
    <div className="container h-full overflow-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and privacy
          </p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isAuthenticated ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              Authentication
            </CardTitle>
            <CardDescription>
              {isAuthenticated
                ? 'You are logged in and can create rooms and send messages'
                : 'Log in to create rooms and join conversations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium">
                  {isAuthenticated ? 'Logged in' : 'Not logged in'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAuthenticated
                    ? 'You have full access to all features'
                    : 'You can browse rooms but cannot post'}
                </p>
              </div>
              {isAuthenticated ? (
                <Button
                  onClick={handleLogoutClick}
                  variant="outline"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Logging out...' : 'Log out'}
                </Button>
              ) : (
                <Button onClick={handleLoginClick}>
                  Log in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Admin Access */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isUnlocked ? <Unlock className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-primary" />}
              Admin Access
            </CardTitle>
            <CardDescription>
              {isUnlocked 
                ? 'Admin access is unlocked. You can perform moderation actions without re-entering the password.'
                : 'Unlock admin access to perform moderation actions across the app'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  {adminError && (
                    <p className="text-sm text-destructive">{adminError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Admin Access
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Admin access is active. You can delete rooms, messages, and manage users without re-entering the password.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button onClick={handleAdminClick} className="flex-1">
                    <Shield className="h-4 w-4 mr-2" />
                    Open Admin Panel
                  </Button>
                  <Button onClick={handleAdminLock} variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Lock
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your identity information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Principal ID</Label>
              <div className="p-3 rounded-lg bg-muted/50 font-mono text-xs break-all">
                {isAnonymous ? (
                  <span className="text-muted-foreground">Anonymous</span>
                ) : (
                  principalString
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isAuthenticated ? 'Your Profile' : 'Anonymous Profile'}
            </CardTitle>
            <CardDescription>
              {isAuthenticated 
                ? 'Your profile is saved to your account and persists across logins'
                : 'Your identity is anonymous. Only your nickname is visible to others.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Loading your profile...
                </AlertDescription>
              </Alert>
            )}

            {showCreateProfileButton && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>No profile found. Create a default profile to get started.</span>
                  <Button 
                    onClick={handleCreateDefaultProfile} 
                    size="sm" 
                    disabled={isCreatingProfile}
                    className="ml-4"
                  >
                    {isCreatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Profile'
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {showProfileSetup && profile && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="text-3xl">{profile.avatar}</div>
                  <div className="flex-1">
                    <p className="font-medium">{profile.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAuthenticated ? 'Your account profile' : 'Your current identity'}
                    </p>
                  </div>
                  {profile.color && (
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: profile.color }} />
                  )}
                </div>

                <form onSubmit={handleNicknameChange} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Change Nickname</Label>
                    <div className="flex gap-2">
                      <Input
                        id="nickname"
                        name="nickname"
                        placeholder="Enter new nickname"
                        defaultValue={profile.nickname}
                        maxLength={30}
                        disabled={isSavingProfile}
                      />
                      <Button type="submit" disabled={isSavingProfile}>
                        {isSavingProfile ? 'Saving...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Area
            </CardTitle>
            <CardDescription>
              We only use state/area level location. Your exact location is never stored or shared.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location-toggle">Location Access</Label>
                <p className="text-sm text-muted-foreground">
                  {isRequestingLocation ? 'Requesting location...' : 'Allow automatic area detection'}
                </p>
              </div>
              <Switch
                id="location-toggle"
                checked={selection.locationEnabled}
                onCheckedChange={handleLocationToggle}
                disabled={isRequestingLocation}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area-select">Select Your Area</Label>
              <Select value={selection.areaId || undefined} onValueChange={handleAreaChange}>
                <SelectTrigger id="area-select">
                  <SelectValue placeholder="Choose a state or area" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {sortedAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>
                  <strong className="text-foreground">Anonymous by default:</strong> Your messages are tied to your nickname, not your identity.
                </p>
                <p>
                  <strong className="text-foreground">Location privacy:</strong> We only store your state/area selection, never your exact coordinates.
                </p>
                <p>
                  <strong className="text-foreground">Message retention:</strong> Messages are automatically deleted after reaching the room limit to protect your privacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          © 2026. Built with ❤️ using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
