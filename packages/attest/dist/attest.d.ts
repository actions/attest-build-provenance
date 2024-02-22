import { SignOptions } from './sign';
import type { Attestation } from './shared.types';
type AttestBaseOptions = SignOptions & {
    subjectName: string;
    subjectDigest: Record<string, string>;
    token: string;
    skipWrite?: boolean;
};
export type AttestOptions = AttestBaseOptions & {
    predicateType: string;
    predicate: object;
};
export type AttestProvenanceOptions = AttestBaseOptions;
export declare function attest(options: AttestOptions): Promise<Attestation>;
export declare function attestProvenance(options: AttestProvenanceOptions): Promise<Attestation>;
export {};
