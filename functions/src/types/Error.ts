/* eslint-disable require-jsdoc */

export { ValidationError } from "joi";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}
