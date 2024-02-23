import { fromPartial } from '@total-typescript/shoehorn'
import {
  AttestOptions,
  AttestProvenanceOptions,
  Attestation,
  Predicate,
  Subject,
  attest,
  attestProvenance
} from '..'

it('exports functions', () => {
  expect(attestProvenance).toBeInstanceOf(Function)
  expect(attest).toBeInstanceOf(Function)
})

it('exports types', async () => {
  const attestation: Attestation = fromPartial({})
  expect(attestation).toBeDefined()

  const attestOptions: AttestOptions = fromPartial({})
  expect(attestOptions).toBeDefined()

  const attestProvenanceOptions: AttestProvenanceOptions = fromPartial({})
  expect(attestProvenanceOptions).toBeDefined()

  const subject: Subject = fromPartial({})
  expect(subject).toBeDefined()

  const predicate: Predicate = fromPartial({})
  expect(predicate).toBeDefined()
})
