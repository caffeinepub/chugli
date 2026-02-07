import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Room = {
    id : Text;
    name : Text;
    location : ?Text;
    creator : Principal;
    createdTimestamp : Time.Time;
  };

  public type Message = {
    id : Text;
    roomId : Text;
    sender : Text;
    senderPrincipal : ?Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type Member = {
    principal : Principal;
    name : Text;
    roomId : Text;
    joinedTimestamp : Time.Time;
  };

  public type Report = {
    id : Text;
    reporter : Text;
    reportedUser : ?Text;
    reportedMessage : ?Text;
    room : Text;
    reason : Text;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    username : Text;
    avatarURL : Text;
    bio : Text;
    joinedTimestamp : Time.Time;
    lastUpdated : Time.Time;
  };

  var messageCounter = 0;
  var reportCounter = 0;
  var roomCounter = 0;

  let MESSAGE_RETENTION_LIMIT = 100;

  let rooms = Map.empty<Text, Room>();
  let messages = Map.empty<Text, List.List<Message>>();
  let mutes = Map.empty<Principal, List.List<Text>>();
  let blocks = Map.empty<Principal, List.List<Text>>();
  let reports = Map.empty<Text, List.List<Report>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let bannedUsers = Map.empty<Principal, Bool>();

  public shared ({ caller }) func createRoom(name : Text, location : ?Text) : async Room {
    enforceUserAuthenticated(caller);

    if (isUserBannedInternal(caller)) {
      Runtime.trap("Banned users cannot create new rooms. This action cannot be performed until the ban has been waived by admin.");
    };

    let id = roomCounter.toText();
    let room : Room = {
      id;
      name;
      location;
      creator = caller;
      createdTimestamp = Time.now();
    };
    rooms.add(id, room);
    messages.add(id, List.empty<Message>());
    roomCounter += 1;
    room;
  };

  public shared ({ caller }) func sendMessage(roomId : Text, sender : Text, content : Text) : async Message {
    enforceUserAuthenticated(caller);

    if (isUserBannedInternal(caller)) {
      Runtime.trap("Banned users cannot send messages. This action cannot be performed until the ban has been waived by admin.");
    };

    if (content.size() > 500) {
      Runtime.trap("Content cannot exceed 500 characters");
    };

    let newMessage = {
      id = messageCounter.toText();
      roomId;
      sender;
      senderPrincipal = ?caller;
      content;
      timestamp = Time.now();
    };
    messageCounter += 1;

    switch (messages.get(roomId)) {
      case (?existingMessages) {
        let updatedMessages = existingMessages.clone();
        updatedMessages.add(newMessage);

        if (updatedMessages.size() > MESSAGE_RETENTION_LIMIT) {
          ignore updatedMessages.removeLast();
        };

        messages.add(roomId, updatedMessages);
      };
      case (null) {
        let newList = List.empty<Message>();
        newList.add(newMessage);
        messages.add(roomId, newList);
      };
    };
    newMessage;
  };

  public shared ({ caller }) func muteUser(targetUser : Text) : async () {
    enforceUserAuthenticated(caller);
    updateUserMuteList(caller, targetUser);
  };

  public shared ({ caller }) func blockUser(targetUser : Text) : async () {
    enforceUserAuthenticated(caller);
    updateUserBlockList(caller, targetUser);
  };

  public shared ({ caller }) func reportContent(
    reportedUser : ?Text,
    reportedMessage : ?Text,
    room : Text,
    reason : Text,
  ) : async Bool {
    enforceUserAuthenticated(caller);

    let newReport = {
      id = reportCounter.toText();
      reporter = caller.toText();
      reportedUser;
      reportedMessage;
      room;
      reason;
      timestamp = Time.now();
    };
    reportCounter += 1;

    let roomPosition = reports.get(room);
    let newReports = switch (roomPosition) {
      case (?existingReports) {
        let clonedReports = existingReports.clone();
        clonedReports.add(newReport);
        clonedReports;
      };
      case (null) {
        let newList = List.empty<Report>();
        newList.add(newReport);
        newList;
      };
    };
    reports.add(room, newReports);
    true;
  };

  public query ({ caller }) func getRoomsByLocation(location : ?Text) : async [Room] {
    switch (location) {
      case (null) { rooms.values().toArray() };
      case (?loc) {
        rooms.values().toArray().filter(
          func(room) {
            if (room.location == null) {
              return false;
            };
            switch (room.location) {
              case (?roomLoc) { roomLoc == loc };
              case (null) { false };
            };
          }
        );
      };
    };
  };

  public query ({ caller }) func getRoom(id : Text) : async ?Room {
    rooms.get(id);
  };

  public query ({ caller }) func getMessagesForRoom(roomId : Text) : async ?[Message] {
    switch (messages.get(roomId)) {
      case (?msgs) {
        ?msgs.toArray();
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getMutes(user : Principal) : async ?[Text] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own mute list");
    };
    switch (mutes.get(user)) {
      case (?mutes) { ?mutes.toArray() };
      case (null) { null };
    };
  };

  public query ({ caller }) func getBlocks(user : Principal) : async ?[Text] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own block list");
    };
    switch (blocks.get(user)) {
      case (?blocks) { ?blocks.toArray() };
      case (null) { null };
    };
  };

  public query ({ caller }) func getReportsForRoom(room : Text) : async ?[Report] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view reports");
    };
    switch (reports.get(room)) {
      case (?reports) { ?reports.toArray() };
      case (null) { null };
    };
  };

  // New admin moderation functions
  public shared ({ caller }) func deleteRoom(roomId : Text) : async () {
    enforceAdminAuthenticated(caller);

    switch (rooms.get(roomId)) {
      case (?_) {
        rooms.remove(roomId);
        messages.remove(roomId);
        reports.remove(roomId);
      };
      case (null) { Runtime.trap("Room not found") };
    };
  };

  public shared ({ caller }) func deleteMessage(roomId : Text, messageId : Text) : async () {
    enforceAdminAuthenticated(caller);
    switch (messages.get(roomId)) {
      case (?existingMessages) {
        let filteredMessages = List.empty<Message>();
        for (msg in existingMessages.values()) {
          if (msg.id != messageId) {
            filteredMessages.add(msg);
          };
        };
        messages.add(roomId, filteredMessages);
      };
      case (null) {
        Runtime.trap("Room messages not found");
      };
    };
  };

  public shared ({ caller }) func banUser(user : Principal) : async () {
    enforceAdminAuthenticated(caller);
    bannedUsers.add(user, true);
  };

  public shared ({ caller }) func unbanUser(user : Principal) : async () {
    enforceAdminAuthenticated(caller);
    bannedUsers.remove(user);
  };

  public query ({ caller }) func isUserBanned(user : Principal) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can check ban status");
    };
    bannedUsers.containsKey(user);
  };

  // Profile management with authorization
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile = {
      profile with
      lastUpdated = Time.now();
    };
    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func deleteCallerUserProfile() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete profiles");
    };
    switch (userProfiles.get(caller)) {
      case (?_) {
        userProfiles.remove(caller);
      };
      case (null) {
        Runtime.trap("Profile not found");
      };
    };
  };

  // Helper functions for enforcing authentication and user state
  func enforceAdminAuthenticated(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("You are not authorized to manage critical moderation actions. Make sure you are logged into the system with the correct admin credentials and that your principal was assigned admin permissions during canister setup. If not, contact the application owner to adjust your permissions.");
    };
  };

  func enforceUserAuthenticated(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Publishing messages is reserved to authenticated users. You are currently using the app in visitor mode. Please sign in with Internet Identity to create or respond to local rooms.");
    };
  };

  func isUserBannedInternal(user : Principal) : Bool {
    bannedUsers.containsKey(user);
  };

  // Helper functions for updating user mute/block lists
  func updateUserMuteList(user : Principal, target : Text) {
    let newMuteList = switch (mutes.get(user)) {
      case (?existingMutes) {
        let filtered = existingMutes.clone().filter(
          func(u) { u != target }
        );
        filtered.add(target);
        filtered;
      };
      case (null) {
        let newList = List.empty<Text>();
        newList.add(target);
        newList;
      };
    };
    mutes.add(user, newMuteList);
  };

  func updateUserBlockList(user : Principal, target : Text) {
    let newBlockList = switch (blocks.get(user)) {
      case (?existingBlocks) {
        let filtered = existingBlocks.clone().filter(
          func(u) { u != target }
        );
        filtered.add(target);
        filtered;
      };
      case (null) {
        let newList = List.empty<Text>();
        newList.add(target);
        newList;
      };
    };
    blocks.add(user, newBlockList);
  };

  // Internal state exposure for testing and debugging - ADMIN ONLY
  public query ({ caller }) func _getInternalState() : async {
    rooms : [(Text, Room)];
    messages : [(Text, [Message])];
    mutes : [(Principal, [Text])];
    blocks : [(Principal, [Text])];
    reports : [(Text, [Report])];
    profiles : [(Principal, UserProfile)];
    messageCounter : Nat;
    reportCounter : Nat;
    roomCounter : Nat;
    bannedUsers : [Principal];
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access internal state");
    };

    let allMessages = messages.toArray().map(
      func((id, msgs)) {
        (id, switch (messages.get(id)) {
          case (?msgs) { msgs.toArray() };
          case (null) { [] };
        });
      }
    );

    let allMutes = mutes.toArray().map(
      func((user, muteList)) {
        (user, switch (mutes.get(user)) {
          case (?mutes) { mutes.toArray() };
          case (null) { [] };
        });
      }
    );

    let allBlocks = blocks.toArray().map(
      func((user, blockList)) {
        (user, switch (blocks.get(user)) {
          case (?blocks) { blocks.toArray() };
          case (null) { [] };
        });
      }
    );

    let allReports = reports.toArray().map(
      func((room, reportList)) {
        (room, switch (reports.get(room)) {
          case (?reports) { reports.toArray() };
          case (null) { [] };
        });
      }
    );

    {
      rooms = rooms.toArray();
      messages = allMessages;
      mutes = allMutes;
      blocks = allBlocks;
      reports = allReports;
      profiles = userProfiles.toArray();
      messageCounter;
      reportCounter;
      roomCounter;
      bannedUsers = bannedUsers.toArray().map(func((principal, _)) { principal });
    };
  };
};
