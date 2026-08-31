import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 12);

export function id(prefix?: string): string {
  return prefix ? `${prefix}_${nano()}` : nano();
}
