import { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  displayName: string;
  username: string;
};

type UserContextType = {
  user: User;
  setUser: (u: Partial<User>) => void;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User>({ displayName: '', username: '' });

  const setUser = (u: Partial<User>) => {
    setUserState((prev) => ({ ...prev, ...u }));
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
