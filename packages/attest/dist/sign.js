"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPayload = void 0;
const sign_1 = require("@sigstore/sign");
const OIDC_AUDIENCE = 'sigstore';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 3;
// Signs the provided payload with Sigstore.
const signPayload = async (payload, options) => {
    const artifact = {
        data: payload.body,
        type: payload.type
    };
    // Sign the artifact and build the bundle
    return initBundleBuilder(options).create(artifact);
};
exports.signPayload = signPayload;
// Assembles the Sigstore bundle builder with the appropriate options
const initBundleBuilder = (opts) => {
    const identityProvider = opts.identityProvider || new sign_1.CIContextProvider(OIDC_AUDIENCE);
    const timeout = opts.timeout || DEFAULT_TIMEOUT;
    const retry = opts.retry || DEFAULT_RETRIES;
    const witnesses = [];
    const signer = new sign_1.FulcioSigner({
        identityProvider: identityProvider,
        fulcioBaseURL: opts.fulcioURL,
        timeout: timeout,
        retry: retry
    });
    if (opts.rekorURL) {
        witnesses.push(new sign_1.RekorWitness({
            rekorBaseURL: opts.rekorURL,
            entryType: 'dsse',
            timeout: timeout,
            retry: retry
        }));
    }
    if (opts.tsaServerURL) {
        witnesses.push(new sign_1.TSAWitness({
            tsaBaseURL: opts.tsaServerURL,
            timeout: timeout,
            retry: retry
        }));
    }
    return new sign_1.DSSEBundleBuilder({ signer, witnesses });
};
