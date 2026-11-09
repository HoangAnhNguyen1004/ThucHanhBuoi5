import {
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  type DataSnapshot,
  type DatabaseReference,
} from 'firebase/database';
import { startPresence } from '../src/services/presence';

jest.mock('../src/services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  onDisconnect: jest.fn(),
  onValue: jest.fn(),
  push: jest.fn(),
  ref: jest.fn(),
  remove: jest.fn(),
  set: jest.fn(),
  serverTimestamp: () => ({ '.sv': 'timestamp' }),
}));

let notify: (snapshot: DataSnapshot) => unknown;
const unsubscribe = jest.fn();
const connection = { key: 'device-1' } as ReturnType<typeof push>;
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(onValue).mockImplementation((_reference, callback) => {
    notify = callback;
    return unsubscribe;
  });
  jest
    .mocked(ref)
    .mockImplementation(
      (_database, path) => ({ key: path } as DatabaseReference),
    );
  jest.mocked(push).mockReturnValue(connection);
  jest.mocked(remove).mockResolvedValue(undefined);
  jest.mocked(set).mockResolvedValue(undefined);
  jest.mocked(onDisconnect).mockReturnValue({
    remove: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof onDisconnect>);
});

async function connect() {
  notify({ val: () => true } as DataSnapshot);
  for (let tick = 0; tick < 4; tick++) {
    await Promise.resolve();
  }
}

test('explicit logout and effect cleanup stop the same presence only once', async () => {
  const stop = startPresence('alice', jest.fn());
  await connect();
  const firstStop = stop();
  const secondStop = stop();
  expect(firstStop).toBe(secondStop);
  await firstStop;
  await stop();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith(connection);
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(set).toHaveBeenCalledTimes(2);
});

test('offline cleanup does not queue authenticated writes to run after sign-out', async () => {
  const stop = startPresence('alice', jest.fn());
  await connect();
  notify({ val: () => false } as DataSnapshot);
  jest.mocked(set).mockClear();
  await stop();
  expect(remove).not.toHaveBeenCalled();
  expect(set).not.toHaveBeenCalled();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
