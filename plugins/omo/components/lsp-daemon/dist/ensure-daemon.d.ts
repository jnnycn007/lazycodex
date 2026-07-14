import type { OwnerPing } from "./ownership.js";
import { type DaemonPaths } from "./paths.js";
import { type DaemonRuntimeDefaults } from "./runtime-contract.js";
export { InvalidRuntimeOverrideError, OMO_LSP_DAEMON_CLI, resolveDaemonRuntime } from "./runtime-contract.js";
export declare class DaemonUnreachableError extends Error {
    constructor(socketPath: string);
}
export interface EnsureDaemonDeps {
    probe(paths: DaemonPaths): Promise<boolean>;
    spawnDaemon(paths: DaemonPaths): void;
    sleep(ms: number): Promise<void>;
    now(): number;
}
export interface EnsureDaemonOptions {
    readyTimeoutMs?: number;
    pollIntervalMs?: number;
}
export declare function ensureDaemonRunning(paths: DaemonPaths, deps?: EnsureDaemonDeps, options?: EnsureDaemonOptions): Promise<void>;
export declare function probeDaemon(paths: DaemonPaths, timeoutMs?: number): Promise<boolean>;
export declare function pingDaemon(paths: DaemonPaths, token: string, timeoutMs?: number): Promise<OwnerPing | null>;
export declare function spawnDaemonProcess(paths: DaemonPaths): void;
export declare function resolveDaemonCliPath(env?: NodeJS.ProcessEnv, defaults?: DaemonRuntimeDefaults): string;
export declare function defaultEnsureDaemonDeps(): EnsureDaemonDeps;
