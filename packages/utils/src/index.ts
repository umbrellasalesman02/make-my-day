import { Effect, Layer, ServiceMap } from "effect";

export function fn() {
  return "Hello, tsdown!";
}

export class GreetingService extends ServiceMap.Service<
  GreetingService,
  {
    readonly greet: (name: string) => Effect.Effect<string>;
  }
>()("@app/GreetingService") {
  static readonly layer = Layer.succeed(GreetingService, {
    greet: (name: string) => Effect.succeed(`Hello, ${name}!`),
  });
}

export const greetingFor = (name: string) =>
  Effect.gen(function* () {
    const service = yield* GreetingService;
    return yield* service.greet(name);
  });
