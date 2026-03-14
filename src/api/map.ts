/**
 * Map API: street/address by coordinates.
 */

import { request } from './client';

export async function getStreet(latitude: number, longitude: number): Promise<string> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return request<string>(`/api/map/street?${params}`, 'GET', undefined, { responseText: true });
}
