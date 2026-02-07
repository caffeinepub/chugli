import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: string;
    content: string;
    sender: string;
    senderPrincipal?: Principal;
    timestamp: Time;
    roomId: string;
}
export interface Room {
    id: string;
    creator: Principal;
    name: string;
    createdTimestamp: Time;
    location?: string;
}
export type Time = bigint;
export interface UserProfile {
    bio: string;
    username: string;
    joinedTimestamp: Time;
    lastUpdated: Time;
    avatarURL: string;
}
export interface backendInterface {
    blockUser(targetUser: string): Promise<void>;
    createRoom(name: string, location: string | null): Promise<Room>;
    deleteCallerUserProfile(): Promise<void>;
    getBlocks(user: Principal): Promise<Array<string> | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getMessagesForRoom(roomId: string): Promise<Array<Message> | null>;
    getMutes(user: Principal): Promise<Array<string> | null>;
    getRoom(id: string): Promise<Room | null>;
    getRoomsByLocation(location: string | null): Promise<Array<Room>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    muteUser(targetUser: string): Promise<void>;
    reportContent(reportedUser: string | null, reportedMessage: string | null, room: string, reason: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(roomId: string, sender: string, content: string): Promise<Message>;
}
