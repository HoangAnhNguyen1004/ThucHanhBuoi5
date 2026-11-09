import { useCallback, useEffect, useState } from 'react';
import { goOffline, goOnline, onValue, ref } from 'firebase/database';
import { database } from './firebase';
import { errorMessage } from './errors';

export function setDatabaseActive(active: boolean) {
  if (active) {
    goOnline(database);
  } else {
    goOffline(database);
  }
}

export function useRealtime<T>(path: string | null, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<number>();
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion(previous => previous + 1), []);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    // Return Firebase's unsubscribe directly: a single listener per effect.
    return onValue(
      ref(database, path),
      snapshot => {
        setValue(snapshot.val() ?? fallback);
        setUpdatedAt(Date.now());
        setLoading(false);
        setError('');
      },
      failure => {
        setError(errorMessage(failure));
        setLoading(false);
      },
    );
  }, [path, version, fallback]);
  return { value, loading, error, updatedAt, retry };
}
