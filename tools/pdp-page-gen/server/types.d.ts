declare module '@koa/cors' {
  import { Context } from 'koa';
  function cors(options?: { origin?: string | ((ctx: Context) => string) }): (ctx: Context, next: () => Promise<void>) => Promise<void>;
  export default cors;
}

declare module '@koa/router' {
  import { Context } from 'koa';
  class Router {
    get(path: string, handler: (ctx: Context, next: () => Promise<void>) => Promise<void>): this;
    routes(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
    allowedMethods(): (ctx: Context, next: () => Promise<void>) => Promise<void>;
  }
  export default Router;
}
