import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  get,
  ref,
  set,
  update,
  remove,
  serverTimestamp,
  runTransaction,
  onValue,
} from 'firebase/database';

let environment;
const profile = uid => ({
  displayName: uid,
  email: `${uid}@example.com`,
  createdAt: Date.now() - 1000,
});
const dbFor = uid =>
  environment
    .authenticatedContext(uid, { email: `${uid}@example.com` })
    .database();
const room = { userA: 'alice', userB: 'bob', createdAt: Date.now() - 500 };
const textMessage = (senderId = 'alice', text = 'Xin chào!') => ({
  senderId,
  type: 'text',
  text,
  createdAt: serverTimestamp(),
});

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-chatbuoi5',
    database: {
      host: '127.0.0.1',
      port: 9000,
      rules: readFileSync('database.rules.json', 'utf8'),
    },
  });
});
beforeEach(async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await set(ref(context.database()), {
      users: {
        alice: profile('alice'),
        bob: profile('bob'),
        mallory: profile('mallory'),
      },
      rooms: { alice_bob: room },
    });
  });
});
after(async () => {
  await environment?.cleanup();
});

test('signed-out clients cannot read contacts, presence, indexes, or messages', async () => {
  const db = environment.unauthenticatedContext().database();
  for (const path of [
    'users',
    'presence',
    'lastOnline',
    'userRooms/alice',
    'rooms/alice_bob',
  ]) {
    await assertFails(get(ref(db, path)));
  }
});

test('a user can update only their own valid profile and presence', async () => {
  const db = dbFor('alice');
  await assertSucceeds(get(ref(db, 'users')));
  await assertSucceeds(set(ref(db, 'users/alice'), profile('alice')));
  await assertFails(set(ref(db, 'users/bob'), profile('bob')));
  await assertFails(set(ref(db, 'users/alice/displayName'), '  '));
  await assertFails(set(ref(db, 'users/alice/email'), 'someone@example.com'));
  await assertSucceeds(set(ref(db, 'presence/alice/device1'), true));
  await assertSucceeds(remove(ref(db, 'presence/alice/device1')));
  await assertFails(set(ref(db, 'presence/bob/device1'), true));
});

test('create a room with a transaction and atomically index both participants', async () => {
  const db = dbFor('alice');
  const result = await assertSucceeds(
    runTransaction(
      ref(db, 'rooms/alice_mallory'),
      current =>
        current ?? {
          userA: 'alice',
          userB: 'mallory',
          createdAt: serverTimestamp(),
        },
    ),
  );
  assert.equal(result.committed, true);
  await assertSucceeds(
    update(ref(db), {
      'userRooms/alice/alice_mallory': true,
      'userRooms/mallory/alice_mallory': true,
    }),
  );
  await assertFails(set(ref(db, 'userRooms/bob/alice_mallory'), true));
  await assertFails(
    set(ref(db, 'rooms/bob_mallory'), {
      userA: 'bob',
      userB: 'mallory',
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    set(ref(db, 'rooms/alice_unknown'), {
      userA: 'alice',
      userB: 'unknown',
      createdAt: serverTimestamp(),
    }),
  );
});

test('reopening an existing room aborts the transaction without permission errors', async () => {
  const result = await assertSucceeds(
    runTransaction(ref(dbFor('alice'), 'rooms/alice_bob'), current =>
      current ? undefined : room,
    ),
  );
  assert.equal(result.committed, false);
});

test('only participants can read messages; no one can impersonate, edit, or delete messages', async () => {
  const alice = dbFor('alice');
  await assertSucceeds(
    set(ref(alice, 'rooms/alice_bob/messages/msg001'), textMessage()),
  );
  await assertSucceeds(get(ref(dbFor('bob'), 'rooms/alice_bob')));
  await assertFails(get(ref(dbFor('mallory'), 'rooms/alice_bob')));
  await assertFails(
    set(ref(alice, 'rooms/alice_bob/messages/msg002'), textMessage('bob')),
  );
  await assertFails(
    set(ref(alice, 'rooms/alice_bob/messages/msg001/text'), 'Changed'),
  );
  await assertFails(remove(ref(alice, 'rooms/alice_bob/messages/msg001')));
  await assertFails(set(ref(alice, 'rooms/alice_bob/userB'), 'mallory'));
});

test('reject empty text, whitespace, oversized text, invalid coordinates, and unexpected fields', async () => {
  const db = dbFor('alice');
  for (const text of ['', ' \n\t ', 'x'.repeat(4001)]) {
    await assertFails(
      set(
        ref(db, 'rooms/alice_bob/messages/invalid'),
        textMessage('alice', text),
      ),
    );
  }
  await assertSucceeds(
    set(
      ref(db, 'rooms/alice_bob/messages/multiline'),
      textMessage('alice', 'Chào bạn\nHẹn gặp nhé!'),
    ),
  );
  await assertSucceeds(
    set(ref(db, 'rooms/alice_bob/messages/location'), {
      senderId: 'alice',
      type: 'location',
      latitude: 10.7769,
      longitude: 106.7009,
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    set(ref(db, 'rooms/alice_bob/messages/invalid'), {
      senderId: 'alice',
      type: 'location',
      latitude: 100,
      longitude: 106,
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    set(ref(db, 'rooms/alice_bob/messages/invalid'), {
      ...textMessage(),
      extra: 'unexpected',
    }),
  );
});

test('read markers belong to the reader, reference an existing message, and cannot move backwards', async () => {
  const alice = dbFor('alice');
  const bob = dbFor('bob');
  await set(ref(alice, 'rooms/alice_bob/messages/msg001'), textMessage());
  await set(ref(alice, 'rooms/alice_bob/messages/msg002'), textMessage());
  await assertSucceeds(set(ref(bob, 'rooms/alice_bob/reads/bob'), 'msg002'));
  await assertFails(set(ref(bob, 'rooms/alice_bob/reads/alice'), 'msg002'));
  await assertFails(set(ref(bob, 'rooms/alice_bob/reads/bob'), 'msg001'));
  await assertFails(set(ref(bob, 'rooms/alice_bob/reads/bob'), 'missing'));
});

test('a recipient receives new messages in realtime and unsubscribe stops updates', async () => {
  const alice = dbFor('alice');
  const bob = dbFor('bob');
  let count = 0;
  let firstUpdate;
  const received = new Promise(resolve => {
    firstUpdate = resolve;
  });
  const unsubscribe = onValue(
    ref(bob, 'rooms/alice_bob/messages'),
    snapshot => {
      if (snapshot.exists()) {
        count++;
        firstUpdate(snapshot.val());
      }
    },
  );
  await set(ref(alice, 'rooms/alice_bob/messages/realtime1'), textMessage());
  const snapshot = await Promise.race([
    received,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Realtime timeout')), 5000),
    ),
  ]);
  assert.equal(snapshot.realtime1.text, 'Xin chào!');
  unsubscribe();
  const beforeCount = count;
  await set(ref(alice, 'rooms/alice_bob/messages/realtime2'), textMessage());
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(count, beforeCount);
});
