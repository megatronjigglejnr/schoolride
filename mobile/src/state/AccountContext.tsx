/**
 * The parent's account: profile, photos, trusted friends, privacy choices and the recovery email switch. It holds
 * no child selection; the active child lives only in ChildContext. Kept in memory for now (no storage library yet).
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { initialFriends, initialProfile, type Friend, type Profile } from '@/data/account';
import type { ChildKey } from '@/data/types';

export type PhotoOwner = 'me' | ChildKey;
export type PrivacyKey = 'analytics' | 'crash';

type Account = {
  profile: Profile;
  saveProfile: (p: Profile) => void;
  /** A local image URI per person; null shows their initials (the default). */
  photos: Record<PhotoOwner, string | null>;
  setPhoto: (who: PhotoOwner, uri: string | null) => void;
  /** Whose photo the photo sheet is changing. */
  photoTarget: PhotoOwner;
  setPhotoTarget: (who: PhotoOwner) => void;
  friends: Friend[];
  addFriend: (f: Omit<Friend, 'id'>) => void;
  removeFriend: (id: string) => void;
  /** Both off by default. */
  privacy: Record<PrivacyKey, boolean>;
  togglePrivacy: (key: PrivacyKey) => void;
  dataRequested: boolean;
  requestData: () => void;
  /** The optional recovery email: off by default (CLAUDE.md). */
  recovery: boolean;
  setRecovery: (on: boolean) => void;
};

const Ctx = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(initialProfile);
  const [photos, setPhotos] = useState<Record<PhotoOwner, string | null>>({ me: null, jane: null, liam: null });
  const [photoTarget, setPhotoTarget] = useState<PhotoOwner>('me');
  const [friends, setFriends] = useState(initialFriends);
  const [privacy, setPrivacy] = useState<Record<PrivacyKey, boolean>>({ analytics: false, crash: false });
  const [dataRequested, setDataRequested] = useState(false);
  const [recovery, setRecovery] = useState(false);

  const setPhoto = useCallback((who: PhotoOwner, uri: string | null) => setPhotos((p) => ({ ...p, [who]: uri })), []);
  const addFriend = useCallback(
    (f: Omit<Friend, 'id'>) => setFriends((list) => [...list, { ...f, id: String(Date.now()) }]),
    [],
  );
  const removeFriend = useCallback((id: string) => setFriends((list) => list.filter((f) => f.id !== id)), []);
  const togglePrivacy = useCallback((key: PrivacyKey) => setPrivacy((p) => ({ ...p, [key]: !p[key] })), []);
  const requestData = useCallback(() => setDataRequested(true), []);

  const value = useMemo(
    () => ({
      profile,
      saveProfile: setProfile,
      photos,
      setPhoto,
      photoTarget,
      setPhotoTarget,
      friends,
      addFriend,
      removeFriend,
      privacy,
      togglePrivacy,
      dataRequested,
      requestData,
      recovery,
      setRecovery,
    }),
    [
      profile,
      photos,
      setPhoto,
      photoTarget,
      friends,
      addFriend,
      removeFriend,
      privacy,
      togglePrivacy,
      dataRequested,
      requestData,
      recovery,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): Account {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount must be used inside <AccountProvider>');
  return v;
}
