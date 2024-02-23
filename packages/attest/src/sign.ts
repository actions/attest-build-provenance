import { Bundle } from '@sigstore/bundle'
import {
  BundleBuilder,
  CIContextProvider,
  DSSEBundleBuilder,
  FulcioSigner,
  IdentityProvider,
  RekorWitness,
  TSAWitness,
  Witness
} from '@sigstore/sign'

const OIDC_AUDIENCE = 'sigstore'
const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 3

export type Payload = {
  body: Buffer
  type: string
}

export type SignOptions = {
  fulcioURL: string
  rekorURL?: string
  tsaServerURL?: string
  identityProvider?: IdentityProvider
  timeout?: number
  retry?: number
}

// Signs the provided payload with Sigstore.
export const signPayload = async (
  payload: Payload,
  options: SignOptions
): Promise<Bundle> => {
  const artifact = {
    data: payload.body,
    type: payload.type
  }

  // Sign the artifact and build the bundle
  return initBundleBuilder(options).create(artifact)
}

// Assembles the Sigstore bundle builder with the appropriate options
const initBundleBuilder = (opts: SignOptions): BundleBuilder => {
  const identityProvider =
    opts.identityProvider || new CIContextProvider(OIDC_AUDIENCE)
  const timeout = opts.timeout || DEFAULT_TIMEOUT
  const retry = opts.retry || DEFAULT_RETRIES
  const witnesses: Witness[] = []

  const signer = new FulcioSigner({
    identityProvider: identityProvider,
    fulcioBaseURL: opts.fulcioURL,
    timeout: timeout,
    retry: retry
  })

  if (opts.rekorURL) {
    witnesses.push(
      new RekorWitness({
        rekorBaseURL: opts.rekorURL,
        entryType: 'dsse',
        timeout: timeout,
        retry: retry
      })
    )
  }

  if (opts.tsaServerURL) {
    witnesses.push(
      new TSAWitness({
        tsaBaseURL: opts.tsaServerURL,
        timeout: timeout,
        retry: retry
      })
    )
  }

  return new DSSEBundleBuilder({ signer, witnesses })
}
