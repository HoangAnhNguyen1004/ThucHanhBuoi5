import {
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
} from 'firebase/database';
import { database } from './firebase';

export function startPresence(uid: string, onError: (error: unknown) => void) {
  let disposed = false;
  let connected = false;
  let stopTask: Promise<void> | undefined;
  let connection: ReturnType<typeof push> | undefined;
  const unsubscribe = onValue(
    ref(database, '.info/connected'),
    snapshot => {
      connected = Boolean(snapshot.val());
      if (!connected) {
        return;
      }
      const next = push(ref(database, `presence/${uid}`));
      connection = next;
      void (async () => {
        // Register disconnect operations before publishing online status.
        await onDisconnect(next).remove();
        await onDisconnect(ref(database, `lastOnline/${uid}`)).set(
          serverTimestamp(),
        );
        if (!disposed) {
          await set(next, true);
        }
      })().catch(onError);
    },
    onError,
  );

  return () => {
    if (stopTask) {
      return stopTask;
    }
    disposed = true;
    unsubscribe();
    stopTask = (async () => {
      // An offline socket is already covered by onDisconnect; do not queue writes after sign-out.
      if (!connection || !connected) {
        return;
      }
      await remove(connection);
      await onDisconnect(connection).cancel();
      await set(ref(database, `lastOnline/${uid}`), serverTimestamp());
    })();
    return stopTask;
  };
}
