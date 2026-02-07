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
export interface Report {
    id: string;
    reportedUser?: string;
    room: string;
    timestamp: Time;
    reportedMessage?: string;
    reporter: string;
    reason: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    joinedTimestamp: Time;
    lastUpdated: Time;
    avatarURL: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(user: Principal): Promise<void>;
    blockUser(targetUser: string): Promise<void>;
    createRoom(name: string, location: string | null): Promise<Room>;
    deleteCallerUserProfile(): Promise<void>;
    deleteMessage(roomId: string, messageId: string): Promise<void>;
    deleteRoom(roomId: string): Promise<void>;
    getBlocks(user: Principal): Promise<Array<string> | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMessagesForRoom(roomId: string): Promise<Array<Message> | null>;
    getMutes(user: Principal): Promise<Array<string> | null>;
    getReportsForRoom(room: string): Promise<Array<Report> | null>;
    getRoom(id: string): Promise<Room | null>;
    getRoomsByLocation(location: string | null): Promise<Array<Room>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isUserBanned(user: Principal): Promise<boolean>;
    muteUser(targetUser: string): Promise<void>;
    reportContent(reportedUser: string | null, reportedMessage: string | null, room: string, reason: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(roomId: string, sender: string, content: string): Promise<Message>;
    unbanUser(user: Principal): Promise<void>;
}
