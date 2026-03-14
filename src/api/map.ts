/**
 * Map API: street/address by coordinates.
 */

import { request } from './client';

export async function getStreet(latitude: number, longitude: number, lang = 'en'): Promise<string> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    lang,
  });
  return request<string>(`/api/map/street?${params}`, 'GET', undefined, { responseText: true });
}

export interface QuizQuestion {
  truth: string;
  options: string[];   // shuffled array: 1 truth + 2 lies
  truthIndex: number;  // index of the truth in options[]
}

function parseQuizText(raw: string): QuizQuestion {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let truth = '';
  const lies: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('truth:')) {
      truth = line.slice(line.indexOf(':') + 1).trim();
    } else if (lower.startsWith('lie:')) {
      lies.push(line.slice(line.indexOf(':') + 1).trim());
    }
  }
  if (!truth) truth = 'A historical event occurred at this location.';
  while (lies.length < 2) lies.push('This is a fabricated story about this place.');

  const options = [truth, lies[0], lies[1]];
  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { truth, options, truthIndex: options.indexOf(truth) };
}

export async function getQuiz(latitude: number, longitude: number): Promise<QuizQuestion> {
  const lat = latitude || 50.4501;
  const lng = longitude || 30.5234;
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
  });
  const raw = await request<string>(`/api/map/quiz?${params}`, 'GET', undefined, { responseText: true });
  return parseQuizText(raw);
}
