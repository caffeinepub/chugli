import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  type OldActor = {
    rooms : Map.Map<Text, { id : Text; name : Text; location : ?Text; creator : Principal; createdTimestamp : Int }>;
    // Other old fields...
  };

  type NewActor = {
    rooms : Map.Map<Text, { id : Text; name : Text; location : ?Text; creator : Principal; createdTimestamp : Int }>;
    roomPasswords : Map.Map<Text, Text>;
    // Other new fields...
  };

  public func run(old : OldActor) : NewActor {
    {
      rooms = old.rooms;
      roomPasswords = Map.empty<Text, Text>();
    };
  };
};
