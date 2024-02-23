import { generateProvenance } from '../provenance'
import type { Subject } from '../shared.types'

describe('generateProvenance', () => {
  const subject: Subject = {
    name: 'subjecty',
    digest: {
      sha256: '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
    }
  }

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

  it('returns a provenance hydrated from env vars', () => {
    const provenance = generateProvenance(subject, env)
    expect(provenance).toMatchSnapshot()
  })
})
