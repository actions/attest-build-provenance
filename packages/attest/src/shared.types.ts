import type { SerializedBundle } from '@sigstore/bundle'
export type Subject = {
  name: string
  digest: Record<string, string>
}

export type Predicate = {
  type: string
  params: object
}

export type Attestation = {
  bundle: SerializedBundle
  certificate: string
  tlogID?: string
  attestationID?: string
}

export type SBOM = {
  type: 'spdx' | 'cyclonedx'
  object: object
}
