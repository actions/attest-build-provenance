/**
 * Utility functions for the action.
 */

/**
 * Parses the multi-image input string and returns an array of image strings.
 * @param {string} input - The multi-image input string.
 * @returns {string[]} An array of image strings.
 */
export function parseMultiImageInput(input: string): string[] {
  return input.split('\n').map(image => image.trim()).filter(image => image.length > 0)
}
