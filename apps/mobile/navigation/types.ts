import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth stack (unauthenticated)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main tab navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Moderation: NavigatorScreenParams<ModerationStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
  Parent: NavigatorScreenParams<ParentStackParamList>;
  Settings: undefined;
  Help: undefined;
};

// Dashboard stack (inside Dashboard tab)
export type DashboardStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; displayName?: string };
};

// Moderation stack
export type ModerationStackParamList = {
  ModerationQueue: undefined;
  ModerationDetail: { itemId: string };
};

// Admin stack
export type AdminStackParamList = {
  AdminUsers: undefined;
  AdminInviteCodes: undefined;
};

// Parent stack
export type ParentStackParamList = {
  ParentMembers: undefined;
  ParentMemberDetail: { userId: string; displayName: string };
};

// Root navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  AcceptTerms: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen prop types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type DashboardScreenProps<T extends keyof DashboardStackParamList> = NativeStackScreenProps<
  DashboardStackParamList,
  T
>;
