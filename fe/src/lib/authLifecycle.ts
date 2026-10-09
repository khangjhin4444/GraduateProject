let authOperationVersion = 0;
let logoutInProgress = false;

export function beginLogout() {
  authOperationVersion += 1;
  logoutInProgress = true;
}

export function completeLogin() {
  authOperationVersion += 1;
  logoutInProgress = false;
}

export function getAuthOperationVersion() {
  return authOperationVersion;
}

export function isAuthOperationCurrent(version: number) {
  return version === authOperationVersion;
}

export function isLogoutInProgress() {
  return logoutInProgress;
}
