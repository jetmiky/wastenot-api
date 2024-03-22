/**
 * Solves conflict of Firebase Body Parser
 * and Koa Body Parser.
 *
 */
declare module "http" {
  interface IncomingMessage {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawBody: any;
  }
}
