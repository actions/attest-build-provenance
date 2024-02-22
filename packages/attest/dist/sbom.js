"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSBOMPredicate = void 0;
const generateSBOMPredicate = (sbom) => {
    if (sbom.type === 'spdx') {
        return generateSPDXIntoto(sbom.object);
    }
    if (sbom.type === 'cyclonedx') {
        return generateCycloneDXIntoto(sbom.object);
    }
    throw new Error('Unsupported SBOM format');
};
exports.generateSBOMPredicate = generateSBOMPredicate;
// ref: https://github.com/in-toto/attestation/blob/main/spec/predicates/spdx.md
const generateSPDXIntoto = (sbom) => {
    const spdxVersion = sbom?.['spdxVersion'];
    if (!spdxVersion) {
        throw new Error('Cannot find spdxVersion in the SBOM');
    }
    const version = spdxVersion.split('-')[1];
    return {
        type: `https://spdx.dev/Document/v${version}`,
        params: sbom
    };
};
// ref: https://github.com/in-toto/attestation/blob/main/spec/predicates/cyclonedx.md
const generateCycloneDXIntoto = (sbom) => {
    return {
        type: 'https://cyclonedx.org/bom',
        params: sbom
    };
};
