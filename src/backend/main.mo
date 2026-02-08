// BUILD ISSUE FIXED: Removed deprecated actor references that caused deployment to fail.
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  var adminPassword : Text = "DFINITY";
  var messageCounter = 0;
  var roomCounter = 0;
  var reportCounter = 0;

  let MESSAGE_RETENTION_LIMIT = 100;

  let rooms = Map.empty<Text, Room>();
  let messages = Map.empty<Text, List.List<Message>>();
  let mutes = Map.empty<Principal, List.List<Text>>();
  let blocks = Map.empty<Principal, List.List<Text>>();
  let reports = Map.empty<Text, List.List<Report>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let bannedUsers = Map.empty<Principal, Bool>();
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

  public shared ({ caller }) func createRoom(name : Text, location : ?Text) : async Room {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (content.size() > 500) {
      Runtime.trap("Content cannot exceed 500 characters");
    };

    // Check if caller is banned
    if (isUserBannedImpl(caller)) {
      Runtime.trap("You are banned from sending messages");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mute other users");
    };
    updateUserMuteList(caller, targetUser);
  };

  public shared ({ caller }) func blockUser(targetUser : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can block other users");
    };
    updateUserBlockList(caller, targetUser);
  };

  public shared ({ caller }) func reportContent(
    reportedUser : ?Text,
    reportedMessage : ?Text,
    room : Text,
    reason : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can report content");
    };

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
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own mute list");
    };
    switch (mutes.get(user)) {
      case (?mutes) { ?mutes.toArray() };
      case (null) { null };
    };
  };

  public query ({ caller }) func getBlocks(user : Principal) : async ?[Text] {
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own block list");
    };
    switch (blocks.get(user)) {
      case (?blocks) { ?blocks.toArray() };
      case (null) { null };
    };
  };

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

  public shared ({ caller }) func deleteMessage(roomId : Text, messageId : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete messages");
    };

    removeMessageFromRoom(roomId, messageId);
    true;
  };

  public shared ({ caller }) func deleteAllMessagesInRoom(roomId : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete all messages");
    };

    messages.remove(roomId);
    true;
  };

  public shared ({ caller }) func deleteRoom(roomId : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete rooms");
    };

    rooms.remove(roomId);
    messages.remove(roomId);
    reports.remove(roomId);
    true;
  };

  public shared ({ caller }) func banUser(user : Principal) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };

    bannedUsers.add(user, true);
    true;
  };

  public shared ({ caller }) func unbanUser(user : Principal) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unban users");
    };

    bannedUsers.remove(user);
    true;
  };

  public query ({ caller }) func isUserBanned(user : Principal) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check ban status");
    };
    isUserBannedImpl(user);
  };

  public shared ({ caller }) func setAdminPassword(newPassword : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set the admin password");
    };
    adminPassword := newPassword;
  };

  func removeMessageFromRoom(roomId : Text, messageId : Text) {
    switch (messages.get(roomId)) {
      case (?existingMessages) {
        let filteredMessages = existingMessages.clone().filter(
          func(message) {
            message.id != messageId;
          }
        );
        messages.add(roomId, filteredMessages);
      };
      case (null) {
        Runtime.trap("No messages found for room");
      };
    };
  };

  func isUserBannedImpl(user : Principal) : Bool {
    switch (bannedUsers.get(user)) {
      case (?isBanned) { isBanned };
      case (null) { false };
    };
  };
};
