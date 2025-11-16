export class InactiveUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InactiveUserError";
  }
}
