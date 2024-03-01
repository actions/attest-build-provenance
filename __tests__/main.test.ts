import * as core from '@actions/core'
import * as main from '../src/main'

// Mock the GitHub Actions core library
jest.mock('@actions/core')
const setOutputMock = jest.spyOn(core, 'setOutput')
const setFailedMock = jest.spyOn(core, 'setFailed')

// Ensure that setFailed doesn't set an exit code during tests
setFailedMock.mockImplementation(() => {})

describe('main', () => {
  let outputs = {} as Record<string, string>

  beforeEach(() => {
    jest.resetAllMocks()
    setOutputMock.mockImplementation((key, value) => {
      outputs[key] = value
    })
  })

  afterEach(() => {
    outputs = {}
  })

  it('successfully run main', async () => {
    const originalEnv = process.env
    process.env = {
      ...originalEnv,
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

    // Run the main function
    await main.run()

    // Verify that outputs were set correctly
    expect(setOutputMock).toHaveBeenCalledTimes(2)

    // Use the expected object in the test assertion
    expect(outputs['predicate']).toMatchSnapshot()

    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'predicate-type',
      'https://slsa.dev/provenance/v1'
    )

    process.env = originalEnv
  })
})
