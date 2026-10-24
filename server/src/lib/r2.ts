import { isMocksMode } from './mocks.js';
import * as r2Mock from './r2.mock.js';
import * as r2Real from './r2.real.js';

const impl = () => (isMocksMode() ? r2Mock : r2Real);

export async function getSignedUploadUrl(key: string, expiresInSeconds = 900) {
  return impl().getSignedUploadUrl(key, expiresInSeconds);
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number,
) {
  return impl().getSignedDownloadUrl(key, expiresInSeconds);
}

export async function getPrivateObjectBuffer(key: string): Promise<Buffer> {
  return impl().getPrivateObjectBuffer(key);
}

export async function getPrivateObjectSize(key: string): Promise<number> {
  return impl().getPrivateObjectSize(key);
}

export async function uploadPublicSample(key: string, body: Buffer) {
  return impl().uploadPublicSample(key, body);
}

export function getPublicSampleUrl(key: string) {
  return impl().getPublicSampleUrl(key);
}
