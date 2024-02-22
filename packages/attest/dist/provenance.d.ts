/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import type { Predicate, Subject } from './shared.types';
export declare const SLSA_PREDICATE_V1_TYPE = "https://slsa.dev/provenance/v1";
export declare const generateProvenancePredicate: (env: NodeJS.ProcessEnv) => Predicate;
export declare const generateProvenance: (subject: Subject, env: NodeJS.ProcessEnv) => object;
