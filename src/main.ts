import { buildSLSAProvenancePredicate } from '@actions/attest'
import * as core from '@actions/core'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Calculate subject from inputs and generate provenance
    const predicate = await buildSLSAProvenancePredicate()

    core.setOutput('predicate', predicate.params)
    core.setOutput('predicate-type', predicate.type)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`${err}`)
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

/**
 * Replaces all occurrences of the word "block" with "BLOCK" in the input string.
 * @param {string} input - The input string.
 * @returns {string} The modified string with "block" replaced by "BLOCK".
 */
export function block(input: string): string {
  return input.replace(/block/g, 'BLOCK')
}
