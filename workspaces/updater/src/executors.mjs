import { LocalExecutor } from "./executor.mjs";
import { NativeExecutor } from "./native-executor.mjs";

export const createExecutor = (config) => config.executor === "native" ? new NativeExecutor(config) : new LocalExecutor(config);
