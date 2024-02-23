import * as github from '@actions/github'
import fetch from 'make-fetch-happen'

const CREATE_ATTESTATION_REQUEST = 'POST /repos/{owner}/{repo}/attestations'

// Upload the attestation to the repository's attestations endpoint. Returns the
// ID of the uploaded attestation.
export const writeAttestation = async (
  attestation: unknown,
  token: string
): Promise<string> => {
  const octokit = github.getOctokit(token, { request: { fetch } })

  try {
    const response = await octokit.request(CREATE_ATTESTATION_REQUEST, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      data: { bundle: attestation }
    })

    return response.data?.id
  } catch (err) {
    /* istanbul ignore next */
    const message = err instanceof Error ? err.message : err
    throw new Error(`Failed to persist attestation: ${message}`)
  }
}
