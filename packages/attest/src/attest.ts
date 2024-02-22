import { Bundle, bundleToJSON } from '@sigstore/bundle'
import { generateProvenancePredicate } from './provenance'
import { Payload, SignOptions, signPayload } from './sign'
import { writeAttestation } from './store'

import assert from 'assert'
import { X509Certificate } from 'crypto'
import type { Attestation, Subject } from './shared.types'

const INTOTO_PAYLOAD_TYPE = 'application/vnd.in-toto+json'
const INTOTO_STATEMENT_V1_TYPE = 'https://in-toto.io/Statement/v1'

type AttestBaseOptions = SignOptions & {
  subjectName: string
  subjectDigest: Record<string, string>
  token: string
  skipWrite?: boolean
}

export type AttestOptions = AttestBaseOptions & {
  predicateType: string
  predicate: object
}

export type AttestProvenanceOptions = AttestBaseOptions

export async function attest(options: AttestOptions): Promise<Attestation> {
  const subject: Subject = {
    name: options.subjectName,
    digest: options.subjectDigest
  }

  const statement = {
    _type: INTOTO_STATEMENT_V1_TYPE,
    subject: [subject],
    predicateType: options.predicateType,
    predicate: options.predicate
  }

  // Sign the provenance statement
  const payload: Payload = {
    body: Buffer.from(JSON.stringify(statement)),
    type: INTOTO_PAYLOAD_TYPE
  }
  const bundle = await signPayload(payload, options)

  // Store the attestation
  let attestationID: string | undefined
  if (options.skipWrite !== true) {
    attestationID = await writeAttestation(bundleToJSON(bundle), options.token)
  }

  return toAttestation(bundle, attestationID)
}

export async function attestProvenance(
  options: AttestProvenanceOptions
): Promise<Attestation> {
  const predicate = generateProvenancePredicate(process.env)
  return attest({
    ...options,
    predicateType: predicate.type,
    predicate: predicate.params
  })
}

function toAttestation(bundle: Bundle, attestationID?: string): Attestation {
  // Extract the signing certificate from the bundle
  assert(
    bundle.verificationMaterial.content.$case === 'x509CertificateChain',
    'Bundle must contain an x509 certificate chain'
  )

  const signingCert = new X509Certificate(
    bundle.verificationMaterial.content.x509CertificateChain.certificates[0].rawBytes
  )

  // Determine if we can provide a link to the transparency log
  const tlogEntries = bundle.verificationMaterial.tlogEntries
  const tlogID = tlogEntries.length > 0 ? tlogEntries[0].logIndex : undefined

  return {
    bundle: bundleToJSON(bundle),
    certificate: signingCert.toString(),
    tlogID,
    attestationID
  }
}
