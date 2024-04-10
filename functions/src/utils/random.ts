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

/**
 * Get a random integer in a range.
 *
 * @param { number } min Minimum value - inclusive.
 * @param { number } max Maximum value - inclusive.
 * @return { number } Random integer.
 */
export function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
