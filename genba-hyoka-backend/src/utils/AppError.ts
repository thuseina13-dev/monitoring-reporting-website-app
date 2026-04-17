export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
