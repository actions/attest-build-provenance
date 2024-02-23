import { mockFulcio, mockRekor, mockTSA } from '@sigstore/mock'
import nock from 'nock'
import { attestProvenance } from '../attest'

describe('attest functions', () => {
  // Capture original environment variables and GitHub context so we can restore
  // them after each test
  const originalEnv = process.env

  // Fake an OIDC token
  const subject = 'foo@bar.com'
  const oidcPayload = { sub: subject, iss: '' }
  const oidcToken = `.${Buffer.from(JSON.stringify(oidcPayload)).toString(
    'base64'
  )}.}`

  const tokenURL = 'https://token.url'
  const fulcioURL = 'https://fulcio.url'
  const rekorURL = 'https://rekor.url'
  const tsaServerURL = 'https://tsa.url'
  const attestationID = '1234567890'

  beforeEach(async () => {
    jest.clearAllMocks()

    nock(tokenURL)
      .get('/')
      .query({ audience: 'sigstore' })
      .reply(200, { value: oidcToken })

    // Mock Fulcio endpoint
    await mockFulcio({ baseURL: fulcioURL, strict: false })

    // Set-up GHA environment variables
    process.env = {
      ...originalEnv,
      ACTIONS_ID_TOKEN_REQUEST_URL: tokenURL,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'token'
    }
  })

  afterEach(() => {
    // Restore the original environment
    process.env = originalEnv
  })

  describe('#attestProvenance', () => {
    const env = {
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_REF: 'refs/heads/main',
      GITHUB_SHA: 'babca52ab0c93ae16539e5923cb0d7403b9a093b',
      GITHUB_WORKFLOW_REF: 'owner/repo/.github/workflows/main.yml@main',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_EVENT_NAME: 'push',
      GITHUB_REPOSITORY_ID: 'repo-id',
      GITHUB_REPOSITORY_OWNER_ID: 'owner-id',
      GITHUB_RUN_ID: 'run-id',
      GITHUB_RUN_ATTEMPT: 'run-attempt',
      RUNNER_ENVIRONMENT: 'github-hosted'
    }

    beforeEach(() => {
      process.env = { ...process.env, ...env }
    })

    describe('when the timestamp authority URL is set', () => {
      beforeEach(async () => {
        await mockTSA({ baseURL: tsaServerURL })

        // Mock GH attestations API
        nock('https://api.github.com')
          .post(/^\/repos\/.*\/.*\/attestations$/)
          .reply(201, { id: attestationID })
      })

      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName: 'subjective',
          subjectDigest: {
            sha256:
              '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
          },
          token: 'token',
          fulcioURL,
          tsaServerURL
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeUndefined()
        expect(attestation.attestationID).toBe(attestationID)
      })
    })

    describe('when the transparency log URL is set', () => {
      beforeEach(async () => {
        await mockRekor({ baseURL: rekorURL })

        // Mock GH attestations API
        nock('https://api.github.com')
          .post(/^\/repos\/.*\/.*\/attestations$/)
          .reply(201, { id: attestationID })
      })

      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName: 'subjective',
          subjectDigest: {
            sha256:
              '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
          },
          token: 'token',
          fulcioURL,
          rekorURL
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeDefined()
        expect(attestation.attestationID).toBe(attestationID)
      })
    })

    describe('when skipWrite is set to true', () => {
      beforeEach(async () => {
        await mockRekor({ baseURL: rekorURL })
        await mockTSA({ baseURL: tsaServerURL })
      })

      it('attests provenance', async () => {
        const attestation = await attestProvenance({
          subjectName: 'subjective',
          subjectDigest: {
            sha256:
              '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
          },
          token: 'token',
          fulcioURL,
          rekorURL,
          tsaServerURL,
          skipWrite: true
        })

        expect(attestation).toBeDefined()
        expect(attestation.bundle).toBeDefined()
        expect(attestation.certificate).toMatch(/-----BEGIN CERTIFICATE-----/)
        expect(attestation.tlogID).toBeDefined()
        expect(attestation.attestationID).toBeUndefined()
      })
    })
  })
})
