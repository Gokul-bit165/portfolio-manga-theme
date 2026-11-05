/**
 * Decision D10: every fact about Gokul carries a verified flag, so unconfirmed
 * text cannot reach the page. Components only ever receive publishable() output.
 */
export type Claim<T> = { value: T; verified: true } | { value: T; verified: false; needs: string };

export function publishable<T>(claims: readonly Claim<T>[]): T[] {
  return claims.flatMap((claim) => (claim.verified ? [claim.value] : []));
}
