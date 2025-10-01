export class CatBreedAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatBreedAlreadyExistsError";
  }
}
