import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  ref,
  runTransaction,
  serverTimestamp,
  update,
} from 'firebase/database';
import { auth, database } from './firebase';

let pendingRegistration: Promise<void> | undefined;

export async function ensureProfile(user: User) {
  await runTransaction(
    ref(database, `users/${user.uid}`),
    current =>
      current ?? {
        displayName:
          user.displayName || user.email?.split('@')[0] || 'Người dùng',
        email: user.email ?? '',
        createdAt: serverTimestamp(),
      },
  );
}

export async function registerAccount(
  displayName: string,
  email: string,
  password: string,
) {
  pendingRegistration = (async () => {
    const result = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    await updateProfile(result.user, { displayName: displayName.trim() });
    await update(ref(database, `users/${result.user.uid}`), {
      displayName: displayName.trim(),
      email: result.user.email ?? email.trim(),
      createdAt: serverTimestamp(),
    });
  })();
  try {
    await pendingRegistration;
  } finally {
    pendingRegistration = undefined;
  }
}

export function loginAccount(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function logoutAccount() {
  return signOut(auth);
}

export type AuthUser = User;
export function observeAuth(
  callback: (user: User | null) => void,
  onError: (error: Error) => void,
) {
  return onAuthStateChanged(
    auth,
    async user => {
      // Keep the registration form mounted until the requested full name is saved.
      if (pendingRegistration) {
        try {
          await pendingRegistration;
        } catch {
          /* The authenticated session can retry profile setup. */
        }
      }
      callback(user);
    },
    onError,
  );
}
