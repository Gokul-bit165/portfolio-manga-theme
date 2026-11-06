// State shared by the world runtime and the character stage, kept apart so neither imports the other.
// One stepped clock for every banner and mover, in every world: animation on twos.
export const stepU = { uStep: { value: 0 } };
