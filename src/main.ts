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

    // Check if the summary should be suppressed
    const suppressSummary = core.getInput('suppress-summary') === 'true'

    // Generate attestation URL output
    const attestationUrl = generateAttestationUrl(predicate)

    // Set outputs
    core.setOutput('predicate', predicate.params)
    core.setOutput('predicate-type', predicate.type)
    core.setOutput('attestation-url', attestationUrl)

    // Conditionally skip summary generation
    if (!suppressSummary) {
      generateSummary(predicate)
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`${err}`)
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

/**
 * Generate the attestation URL output.
 * @param {object} predicate - The generated predicate.
 * @returns {string} The attestation URL.
 */
function generateAttestationUrl(predicate: any): string {
  // Example implementation, replace with actual logic
  return 'https://example.com/attestation-url'
}

/**
 * Conditionally generate the summary.
 * @param {object} predicate - The generated predicate.
 */
function generateSummary(predicate: any): void {
  // Example implementation, replace with actual logic
  console.log('Generating summary...')
}
