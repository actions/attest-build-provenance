/// <reference types="node" />
import { Bundle } from '@sigstore/bundle';
import { IdentityProvider } from '@sigstore/sign';
export type Payload = {
    body: Buffer;
    type: string;
};
export type SignOptions = {
    fulcioURL: string;
    rekorURL?: string;
    tsaServerURL?: string;
    identityProvider?: IdentityProvider;
    timeout?: number;
    retry?: number;
};
export declare const signPayload: (payload: Payload, options: SignOptions) => Promise<Bundle>;
