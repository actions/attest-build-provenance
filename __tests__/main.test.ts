import * as core from '@actions/core'
import * as jose from 'jose'
import nock from 'nock'
import * as main from '../src/main'

// Mock the GitHub Actions core library functions
const setOutputMock = jest.spyOn(core, 'setOutput')
const setFailedMock = jest.spyOn(core, 'setFailed')

// Ensure that setFailed doesn't set an exit code during tests
setFailedMock.mockImplementation(() => {})

describe('main', () => {
  let outputs = {} as Record<string, string>
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetAllMocks()

    setOutputMock.mockImplementation((key, value) => {
      outputs[key] = value
    })
  })

  afterEach(() => {
    outputs = {}
    process.env = originalEnv
  })

  describe('when the default OIDC issuer is used', () => {
    const issuer = 'https://token.actions.githubusercontent.com'
    const audience = 'nobody'
    const jwksPath = '/.well-known/jwks.json'
    const tokenPath = '/token'

    const claims = {
      iss: issuer,
      aud: 'nobody',
      repository: 'owner/repo',
      ref: 'refs/heads/main',
      sha: 'babca52ab0c93ae16539e5923cb0d7403b9a093b',
      workflow_ref: 'owner/repo/.github/workflows/main.yml@main',
      job_workflow_ref: 'owner/shared/.github/workflows/build.yml@main',
      event_name: 'push',
      repository_id: 'repo-id',
      repository_owner_id: 'owner-id',
      run_id: 'run-id',
      run_attempt: 'run-attempt',
      runner_environment: 'github-hosted'
    }

    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        ACTIONS_ID_TOKEN_REQUEST_URL: `${issuer}${tokenPath}?`,
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'token',
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: claims.repository
      }

      // Generate JWT signing key
      const key = await jose.generateKeyPair('PS256')

      // Create JWK, JWKS, and JWT
      const kid = '12345'
      const jwk = await jose.exportJWK(key.publicKey)
      const jwks = { keys: [{ ...jwk, kid }] }
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg: 'PS256', kid })
        .sign(key.privateKey)

      // Mock OpenID configuration and JWKS endpoints
      nock(issuer)
        .get('/.well-known/openid-configuration')
        .reply(200, { jwks_uri: `${issuer}${jwksPath}` })
      nock(issuer).get(jwksPath).reply(200, jwks)

      // Mock OIDC token endpoint for populating the provenance
      nock(issuer).get(tokenPath).query({ audience }).reply(200, { value: jwt })
    })

    it('successfully run main', async () => {
      // Run the main function
      await main.run()

      // Verify that outputs were set correctly
      expect(setOutputMock).toHaveBeenCalledTimes(2)

      expect(outputs['predicate']).toMatchSnapshot()
      expect(outputs['predicate-type']).toBe('https://slsa.dev/provenance/v1')
    })
  })

  describe('when a non-default OIDC issuer is used', () => {
    const issuer = 'https://token.actions.example-01.ghe.com'
    const audience = 'nobody'
    const jwksPath = '/.well-known/jwks.json'
    const tokenPath = '/token'

    const claims = {
      iss: issuer,
      aud: 'nobody',
      repository: 'owner/repo',
      ref: 'refs/heads/main',
      sha: 'babca52ab0c93ae16539e5923cb0d7403b9a093b',
      workflow_ref: 'owner/repo/.github/workflows/main.yml@main',
      job_workflow_ref: 'owner/shared/.github/workflows/build.yml@main',
      event_name: 'push',
      repository_id: 'repo-id',
      repository_owner_id: 'owner-id',
      run_id: 'run-id',
      run_attempt: 'run-attempt',
      runner_environment: 'github-hosted'
    }

    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        ACTIONS_ID_TOKEN_REQUEST_URL: `${issuer}${tokenPath}?`,
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'token',
        GITHUB_SERVER_URL: 'https://example-01.ghe.com',
        GITHUB_REPOSITORY: claims.repository
      }

      // Generate JWT signing key
      const key = await jose.generateKeyPair('PS256')

      // Create JWK, JWKS, and JWT
      const kid = '12345'
      const jwk = await jose.exportJWK(key.publicKey)
      const jwks = { keys: [{ ...jwk, kid }] }
      const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({ alg: 'PS256', kid })
        .sign(key.privateKey)

      // Mock OpenID configuration and JWKS endpoints
      nock(issuer)
        .get('/.well-known/openid-configuration')
        .reply(200, { jwks_uri: `${issuer}${jwksPath}` })
      nock(issuer).get(jwksPath).reply(200, jwks)

      // Mock OIDC token endpoint for populating the provenance
      nock(issuer).get(tokenPath).query({ audience }).reply(200, { value: jwt })
    })

    it('successfully run main', async () => {
      // Run the main function
      await main.run()

      // Verify that outputs were set correctly
      expect(setOutputMock).toHaveBeenCalledTimes(2)

      expect(outputs['predicate']).toMatchSnapshot()
      expect(outputs['predicate-type']).toBe('https://slsa.dev/provenance/v1')
    })
  })
})
