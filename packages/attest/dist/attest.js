"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attestProvenance = exports.attest = void 0;
const bundle_1 = require("@sigstore/bundle");
const provenance_1 = require("./provenance");
const sign_1 = require("./sign");
const store_1 = require("./store");
const assert_1 = __importDefault(require("assert"));
const crypto_1 = require("crypto");
const INTOTO_PAYLOAD_TYPE = 'application/vnd.in-toto+json';
const INTOTO_STATEMENT_V1_TYPE = 'https://in-toto.io/Statement/v1';
async function attest(options) {
    const subject = {
        name: options.subjectName,
        digest: options.subjectDigest
    };
    const statement = {
        _type: INTOTO_STATEMENT_V1_TYPE,
        subject: [subject],
        predicateType: options.predicateType,
        predicate: options.predicate
    };
    // Sign the provenance statement
    const payload = {
        body: Buffer.from(JSON.stringify(statement)),
        type: INTOTO_PAYLOAD_TYPE
    };
    const bundle = await (0, sign_1.signPayload)(payload, options);
    // Store the attestation
    let attestationID;
    if (options.skipWrite !== true) {
        attestationID = await (0, store_1.writeAttestation)((0, bundle_1.bundleToJSON)(bundle), options.token);
    }
    return toAttestation(bundle, attestationID);
}
exports.attest = attest;
async function attestProvenance(options) {
    const predicate = (0, provenance_1.generateProvenancePredicate)(process.env);
    return attest({
        ...options,
        predicateType: predicate.type,
        predicate: predicate.params
    });
}
exports.attestProvenance = attestProvenance;
function toAttestation(bundle, attestationID) {
    // Extract the signing certificate from the bundle
    (0, assert_1.default)(bundle.verificationMaterial.content.$case === 'x509CertificateChain', 'Bundle must contain an x509 certificate chain');
    const signingCert = new crypto_1.X509Certificate(bundle.verificationMaterial.content.x509CertificateChain.certificates[0].rawBytes);
    // Determine if we can provide a link to the transparency log
    const tlogEntries = bundle.verificationMaterial.tlogEntries;
    const tlogID = tlogEntries.length > 0 ? tlogEntries[0].logIndex : undefined;
    return {
        bundle: (0, bundle_1.bundleToJSON)(bundle),
        certificate: signingCert.toString(),
        tlogID,
        attestationID
    };
}
