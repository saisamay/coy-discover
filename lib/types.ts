export type Profile = {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  interests: string[];
};

export type Decision = 'like' | 'pass';
export type Match = { profile: Profile; matchedAt: string };
export type SwipeResult = {
  recordedDecision: Decision;
  createdMatch: boolean;
  match: Match | null;
};
