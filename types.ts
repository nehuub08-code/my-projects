export interface UserProfile {
  username: string;
  avatar: string;
  email: string;
  role: 'Admin' | 'User';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'spam' | 'ham' | 'system';
  timestamp: Date;
}

export interface AppState {
  isDarkMode: boolean;
  isLoggedIn: boolean;
  currentUser: UserProfile | null;
  notifications: AppNotification[];
  stats: {
    totalScanned: number;
    spamDetected: number;
    hamDetected: number;
  };
  permissions: {
    gmail: boolean;
    notifications: boolean;
    mobileSync: boolean;
  };
}
