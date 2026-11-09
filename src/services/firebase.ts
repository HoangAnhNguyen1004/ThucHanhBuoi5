import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Client configuration supplied by the project owner. Access is controlled by database.rules.json.
export const firebaseConfig = {
  apiKey: 'AIzaSyCauoV2aKgdAN9LyxcZFEqRiEVZfkFxh_U',
  authDomain: 'thuchanhbuoi5-ff704.firebaseapp.com',
  databaseURL:
    'https://thuchanhbuoi5-ff704-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'thuchanhbuoi5-ff704',
  storageBucket: 'thuchanhbuoi5-ff704.firebasestorage.app',
  messagingSenderId: '166901121052',
  appId: '1:166901121052:web:c6d0cb39fa8c29c2fc9fd9',
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
function persistedAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}
export const auth = persistedAuth();
export const database = getDatabase(firebaseApp);
