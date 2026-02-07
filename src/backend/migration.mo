import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  // Old types
  type Room = {
    id : Text;
    name : Text;
    location : ?Text;
    creator : Principal;
    createdTimestamp : Time.Time;
  };

  type Member = {
    principal : Principal;
    name : Text;
    roomId : Text;
    joinedTimestamp : Time.Time;
  };

  type Report = {
    id : Text;
    reporter : Text;
    reportedUser : ?Text;
    reportedMessage : ?Text;
    room : Text;
    reason : Text;
    timestamp : Time.Time;
  };

  type UserProfile = {
    username : Text;
    avatarURL : Text;
    bio : Text;
    joinedTimestamp : Time.Time;
    lastUpdated : Time.Time;
  };

  type OldMessage = {
    id : Text;
    roomId : Text;
    sender : Text;
    content : Text;
    timestamp : Time.Time;
  };

  type OldActor = {
    rooms : Map.Map<Text, Room>;
    messages : Map.Map<Text, List.List<OldMessage>>;
    mutes : Map.Map<Principal, List.List<Text>>;
    blocks : Map.Map<Principal, List.List<Text>>;
    reports : Map.Map<Text, List.List<Report>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    messageCounter : Nat;
    reportCounter : Nat;
    roomCounter : Nat;
  };

  // Extended migration message type (added senderPrincipal)
  type NewMessage = {
    id : Text;
    roomId : Text;
    sender : Text;
    senderPrincipal : ?Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type NewActor = {
    rooms : Map.Map<Text, Room>;
    messages : Map.Map<Text, List.List<NewMessage>>;
    mutes : Map.Map<Principal, List.List<Text>>;
    blocks : Map.Map<Principal, List.List<Text>>;
    reports : Map.Map<Text, List.List<Report>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    bannedUsers : Map.Map<Principal, Bool>;
    messageCounter : Nat;
    reportCounter : Nat;
    roomCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newMessages = old.messages.map<Text, List.List<OldMessage>, List.List<NewMessage>>(
      func(_roomId, oldMessagesList) {
        oldMessagesList.map<OldMessage, NewMessage>(
          func(oldMsg) { { oldMsg with senderPrincipal = null } }
        );
      }
    );

    {
      old with
      messages = newMessages;
      bannedUsers = Map.empty<Principal, Bool>();
    };
  };
};
