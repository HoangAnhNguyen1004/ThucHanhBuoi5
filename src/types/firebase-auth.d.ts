import type { Persistence } from 'firebase/auth';
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';

// Firebase's public declaration omits this React Native export; Metro selects its RN implementation.
declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: AsyncStorageStatic,
  ): Persistence;
}
