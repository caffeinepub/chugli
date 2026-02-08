import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Time "mo:core/Time";

module {
  type OldRoom = {
    id : Text;
    name : Text;
    location : ?Text;
    creator : Principal;
    createdTimestamp : Time.Time;
  };

  type OldMessage = {
    id : Text;
    roomId : Text;
    sender : Text;
    senderPrincipal : ?Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type OldReport = {
    id : Text;
    reporter : Text;
    reportedUser : ?Text;
    reportedMessage : ?Text;
    room : Text;
    reason : Text;
    timestamp : Time.Time;
  };

  type OldUserProfile = {
    username : Text;
    avatarURL : Text;
    bio : Text;
    joinedTimestamp : Time.Time;
    lastUpdated : Time.Time;
  };

  type OldActor = {
    adminPassword : Text;
    accessControlState : AccessControl.AccessControlState;
    messageCounter : Nat;
    roomCounter : Nat;
    reportCounter : Nat;
    rooms : Map.Map<Text, OldRoom>;
    messages : Map.Map<Text, List.List<OldMessage>>;
    mutes : Map.Map<Principal, List.List<Text>>;
    blocks : Map.Map<Principal, List.List<Text>>;
    reports : Map.Map<Text, List.List<OldReport>>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    bannedUsers : Map.Map<Principal, Bool>;
  };

  type NewActor = {
    adminPassword : Text;
    accessControlState : AccessControl.AccessControlState;
    messageCounter : Nat;
    roomCounter : Nat;
    reportCounter : Nat;
    rooms : Map.Map<Text, OldRoom>;
    messages : Map.Map<Text, List.List<OldMessage>>;
    mutes : Map.Map<Principal, List.List<Text>>;
    blocks : Map.Map<Principal, List.List<Text>>;
    reports : Map.Map<Text, List.List<OldReport>>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    bannedUsers : Map.Map<Principal, Bool>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
