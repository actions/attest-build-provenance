import { buildSLSAProvenancePredicate } from '@actions/attest'
import * as core from '@actions/core'

const VALID_SERVER_URLS = [
  'https://github.com',
  new RegExp('^https://[a-z0-9-]+\\.ghe\\.com$')
] as const

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const issuer = getIssuer()

    // Calculate subject from inputs and generate provenance
    const predicate = await buildSLSAProvenancePredicate(issuer)

    core.setOutput('predicate', predicate.params)
    core.setOutput('predicate-type', predicate.type)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`${err}`)
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

// Derive the current OIDC issuer based on the server URL
function getIssuer(): string {
  const serverURL = process.env.GITHUB_SERVER_URL || 'https://github.com'

  // Ensure the server URL is a valid GitHub server URL
  if (!VALID_SERVER_URLS.some(valid_url => serverURL.match(valid_url))) {
    throw new Error(`Invalid server URL: ${serverURL}`)
  }

  let host = new URL(serverURL).hostname

  if (host === 'github.com') {
    host = 'githubusercontent.com'
  }

  return `https://token.actions.${host}`
}
