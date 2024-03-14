/**
 * Solves conflict of Firebase Body Parser
 * and Koa Body Parser
 *
 */
declare module "http" {
  interface IncomingMessage {
    rawBody: any;
  }
}
