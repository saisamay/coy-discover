import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { openDiscoverStore } from '../lib/db.mjs';

const directory = mkdtempSync(join(tmpdir(), 'coy-discover-'));
process.env.COY_DB_PATH = join(directory, 'http-test.sqlite');
const { handleFeed, handleMatches, handleSwipe } = await import('../lib/http.mjs');

after(() => rmSync(directory, { recursive: true, force: true }));

function post(profileId, decision) {
  return handleSwipe(new Request('http://localhost/swipe', {
    method: 'POST',
    body: JSON.stringify({ profileId, decision }),
  }));
}

test('fresh feed contains 30 display-only profiles and no mutual matches', async () => {
  const response = handleFeed();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const { profiles } = await response.json();
  assert.equal(profiles.length, 30);
  assert.equal(new Set(profiles.map(profile => profile.id)).size, 30);
  for (const profile of profiles) {
    assert.deepEqual(Object.keys(profile).sort(), ['age', 'bio', 'city', 'id', 'interests', 'name', 'photo']);
    assert.ok(profile.age >= 18 && profile.interests.length);
  }
  assert.deepEqual(await handleMatches().json(), { matches: [] });
});

test('pass, unilateral like, and mutual like have distinct outcomes', async () => {
  const store = openDiscoverStore(':memory:');
  try {
    assert.deepEqual(store.swipe('profile-06', 'pass'), {
      recordedDecision: 'pass', createdMatch: false, match: null,
    });
    assert.deepEqual(store.swipe('profile-02', 'like'), {
      recordedDecision: 'like', createdMatch: false, match: null,
    });
    const result = store.swipe('profile-03', 'like');
    assert.equal(result.createdMatch, true);
    assert.equal(result.match.profile.id, 'profile-03');
    assert.deepEqual(store.getMatches(), [result.match]);
    assert.equal(store.getFeed().length, 27);
  } finally {
    store.close();
  }
});

test('swipes and mutual matches survive reopening the database', () => {
  const file = join(directory, 'reopen.sqlite');
  const first = openDiscoverStore(file);
  const initialMatch = first.swipe('profile-03', 'like').match;
  first.swipe('profile-01', 'pass');
  first.close();

  const second = openDiscoverStore(file);
  try {
    assert.deepEqual(second.getMatches(), [initialMatch]);
    assert.equal(second.getFeed().length, 28);
    assert.deepEqual(second.swipe('profile-03', 'like'), {
      recordedDecision: 'like', createdMatch: false, match: initialMatch,
    });
    assert.deepEqual(second.swipe('profile-01', 'like'), {
      recordedDecision: 'pass', createdMatch: false, match: null,
    });
    assert.deepEqual(second.getMatches(), [initialMatch]);
  } finally {
    second.close();
  }
});

test('invalid requests, self-swipes and unknown profile IDs do not modify the feed', async () => {
  assert.equal((await post('profile-01', 'skip')).status, 400);
  assert.equal((await post('demo-user', 'like')).status, 400);
  assert.equal((await post('profile-99', 'like')).status, 404);
  const malformed = new Request('http://localhost/swipe', { method: 'POST', body: '{' });
  assert.equal((await handleSwipe(malformed)).status, 400);
  const { profiles } = await handleFeed().json();
  assert.equal(profiles.length, 30);
});

test('overlapping HTTP swipes reveal a newly created match only once', async () => {
  const results = await Promise.all([post('profile-11', 'like'), post('profile-11', 'like')]);
  const outcomes = await Promise.all(results.map(response => response.json()));
  assert.equal(outcomes.filter(result => result.createdMatch).length, 1);
  const { matches } = await handleMatches().json();
  assert.deepEqual(matches.map(match => match.profile.id), ['profile-11']);
});

test('passing on every remaining profile empties the feed without matching', () => {
  const store = openDiscoverStore(':memory:');
  try {
    for (const profile of store.getFeed()) store.swipe(profile.id, 'pass');
    assert.deepEqual(store.getFeed(), []);
    assert.deepEqual(store.getMatches(), []);
  } finally {
    store.close();
  }
});
