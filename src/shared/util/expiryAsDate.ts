export default function expiryAsDate(expiryInSeconds: number): Date {
  const now = new Date();
  return new Date(now.getTime() + expiryInSeconds * 1000);
}
