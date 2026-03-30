import { Data, Effect, Layer, ServiceMap } from "effect";
import type { DeployInput, DeployResult } from "./contracts.js";
import { createLocalFsDeployer, type LocalFsDeployerOptions } from "./localFsDeployer.js";

export class DeployerServiceError extends Data.TaggedError("DeployerServiceError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class DeployerService extends ServiceMap.Service<
  DeployerService,
  {
    readonly deploy: (input: DeployInput) => Effect.Effect<DeployResult, DeployerServiceError>;
  }
>()("@app/DeployerService") {
  static layer(options?: LocalFsDeployerOptions) {
    return Layer.sync(DeployerService, () => {
      const deployer = createLocalFsDeployer(options);
      return {
        deploy: (input: DeployInput) =>
          Effect.tryPromise({
            try: () => deployer.deploy(input),
            catch: (cause) =>
              new DeployerServiceError({
                message: cause instanceof Error ? cause.message : `Deploy failed: ${String(cause)}`,
                cause,
              }),
          }),
      };
    });
  }
}
