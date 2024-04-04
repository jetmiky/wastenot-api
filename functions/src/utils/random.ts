/**
 * Get random item in an array.
 *
 * @param { T[] } array Array provided.
 * @return { T } Random item of array provided.
 */
export function getRandomItem<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
