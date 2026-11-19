import { getDiscoverStore } from './db.mjs';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function handleFeed() {
  return json({ profiles: getDiscoverStore().getFeed() });
}

export function handleMatches() {
  return json({ matches: getDiscoverStore().getMatches() });
}

export async function handleSwipe(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Send a valid JSON request.' }, 400);
  }

  const { profileId, decision } = body ?? {};
  if (typeof profileId !== 'string' || !/^profile-\d{2}$/.test(profileId)
      || (decision !== 'like' && decision !== 'pass')) {
    return json({ error: 'A valid profileId and a like or pass decision are required.' }, 400);
  }

  const result = getDiscoverStore().swipe(profileId, decision);
  return result ? json(result) : json({ error: 'Profile not found.' }, 404);
}
