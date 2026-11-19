import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { incomingLikes, profiles } from './seed.mjs';

const demoUserId = 'demo-user';
const publicColumns = 'p.id, p.name, p.age, p.photo, p.bio, p.city, p.interests';
function publicProfile({ id, name, age, photo, bio, city, interests }) {
  return { id, name, age, photo, bio, city, interests: JSON.parse(interests) };
}

export function openDiscoverStore(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  try {
    db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY REFERENCES accounts(id),
        position INTEGER NOT NULL UNIQUE, name TEXT NOT NULL,
        age INTEGER NOT NULL, photo TEXT NOT NULL, bio TEXT NOT NULL,
        city TEXT NOT NULL, interests TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS swipes (
        actor_id TEXT NOT NULL REFERENCES accounts(id),
        target_id TEXT NOT NULL REFERENCES accounts(id),
        decision TEXT NOT NULL CHECK (decision IN ('like', 'pass')),
        created_at TEXT NOT NULL,
        PRIMARY KEY (actor_id, target_id),
        CHECK (actor_id <> target_id)
      );
    `);

    function transaction(write) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = write();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }

    transaction(() => {
      const addAccount = db.prepare('INSERT INTO accounts VALUES (?) ON CONFLICT DO NOTHING');
      const addProfile = db.prepare(`
        INSERT INTO profiles (id, position, name, age, photo, bio, city, interests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING
      `);
      const seedSwipe = db.prepare('INSERT INTO swipes VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING');
      addAccount.run(demoUserId);
      for (const [position, profile] of profiles.entries()) {
        addAccount.run(profile.id);
        addProfile.run(profile.id, position, profile.name, profile.age, profile.photo,
          profile.bio, profile.city, JSON.stringify(profile.interests));
      }
      for (const profileId of incomingLikes) {
        seedSwipe.run(profileId, demoUserId, 'like', '2026-01-01T00:00:00.000Z');
      }
    });

    const feed = db.prepare(`
      SELECT ${publicColumns} FROM profiles p
      WHERE NOT EXISTS (SELECT 1 FROM swipes s WHERE s.actor_id = ? AND s.target_id = p.id)
      ORDER BY p.position
    `);
    const matchQuery = `
      SELECT ${publicColumns}, MAX(outgoing.created_at, incoming.created_at) AS matchedAt
      FROM swipes outgoing
      JOIN swipes incoming ON incoming.actor_id = outgoing.target_id
                          AND incoming.target_id = outgoing.actor_id
      JOIN profiles p ON p.id = outgoing.target_id
      WHERE outgoing.actor_id = ? AND outgoing.decision = 'like' AND incoming.decision = 'like'
    `;
    const listMatches = db.prepare(matchQuery + ' ORDER BY matchedAt DESC, p.position');
    const findMatch = db.prepare(matchQuery + ' AND p.id = ?');
    const findProfile = db.prepare('SELECT id FROM profiles WHERE id = ?');
    const insertSwipe = db.prepare(`
      INSERT INTO swipes VALUES (?, ?, ?, ?)
      ON CONFLICT (actor_id, target_id) DO NOTHING
    `);
    const findDecision = db.prepare('SELECT decision FROM swipes WHERE actor_id = ? AND target_id = ?');

    function toMatch(row) {
      return { profile: publicProfile(row), matchedAt: row.matchedAt };
    }

    return {
      getFeed: () => feed.all(demoUserId).map(publicProfile),
      getMatches: () => listMatches.all(demoUserId).map(toMatch),
      swipe(profileId, decision) {
        return transaction(() => {
          if (!findProfile.get(profileId)) return null;
          const inserted = insertSwipe.run(demoUserId, profileId, decision, new Date().toISOString());
          const recordedDecision = findDecision.get(demoUserId, profileId).decision;
          const match = recordedDecision === 'like' ? findMatch.get(demoUserId, profileId) : null;
          return {
            recordedDecision,
            createdMatch: inserted.changes === 1 && Boolean(match),
            match: match ? toMatch(match) : null,
          };
        });
      },
      close: () => db.close(),
    };
  } catch (error) {
    db.close();
    throw error;
  }
}

let store;
export function getDiscoverStore() {
  store ??= openDiscoverStore(process.env.COY_DB_PATH || resolve('.data', 'discover.sqlite'));
  return store;
}
