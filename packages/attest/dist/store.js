"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAttestation = void 0;
const github = __importStar(require("@actions/github"));
const make_fetch_happen_1 = __importDefault(require("make-fetch-happen"));
const CREATE_ATTESTATION_REQUEST = 'POST /repos/{owner}/{repo}/attestations';
// Upload the attestation to the repository's attestations endpoint. Returns the
// ID of the uploaded attestation.
const writeAttestation = async (attestation, token) => {
    const octokit = github.getOctokit(token, { request: { fetch: make_fetch_happen_1.default } });
    try {
        const response = await octokit.request(CREATE_ATTESTATION_REQUEST, {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            data: { bundle: attestation }
        });
        return response.data?.id;
    }
    catch (err) {
        /* istanbul ignore next */
        const message = err instanceof Error ? err.message : err;
        throw new Error(`Failed to persist attestation: ${message}`);
    }
};
exports.writeAttestation = writeAttestation;
