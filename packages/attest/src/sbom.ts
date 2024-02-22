import type { SBOM, Predicate } from './shared.types'

export const generateSBOMPredicate = (sbom: SBOM): Predicate => {
  if (sbom.type === 'spdx') {
    return generateSPDXIntoto(sbom.object)
  }
  if (sbom.type === 'cyclonedx') {
    return generateCycloneDXIntoto(sbom.object)
  }
  throw new Error('Unsupported SBOM format')
}

// ref: https://github.com/in-toto/attestation/blob/main/spec/predicates/spdx.md
const generateSPDXIntoto = (sbom: object): Predicate => {
  const spdxVersion = (sbom as { spdxVersion?: string })?.['spdxVersion']
  if (!spdxVersion) {
    throw new Error('Cannot find spdxVersion in the SBOM')
  }

  const version = spdxVersion.split('-')[1]

  return {
    type: `https://spdx.dev/Document/v${version}`,
    params: sbom
  }
}

// ref: https://github.com/in-toto/attestation/blob/main/spec/predicates/cyclonedx.md
const generateCycloneDXIntoto = (sbom: object): Predicate => {
  return {
    type: 'https://cyclonedx.org/bom',
    params: sbom
  }
}
