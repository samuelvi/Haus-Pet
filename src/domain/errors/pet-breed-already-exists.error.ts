export class PetBreedAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PetBreedAlreadyExistsError";
  }
}
