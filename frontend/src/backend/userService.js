import {
  fetchConfig,
  appFetch,
  setServiceToken,
  getServiceToken,
  removeServiceToken,
  setReauthenticationCallback,
} from "./appFetch";

const processLoginSignUp = (authenticatedUser, reauthenticationCallback, onSuccess) => {
  setServiceToken(authenticatedUser.serviceToken);
  setReauthenticationCallback(reauthenticationCallback);
  onSuccess(authenticatedUser);
}

export const login = (
  userName,
  password,
  onSuccess,
  onErrors,
  reauthenticationCallback
) =>
  appFetch(
    "/users/login",
    fetchConfig("POST", { userName, password }),
    (authenticatedUser) => {
      if (authenticatedUser.user.role === "USER") {
        processLoginSignUp(authenticatedUser, reauthenticationCallback, onSuccess);
      } else {
        onErrors("No dispone de credenciales de usuario")
      }
    },
    onErrors
  );

export const loginAdmin = (
  userName,
  password,
  onSuccess,
  onErrors,
  reauthenticationCallback
) =>
  appFetch(
    "/users/login",
    fetchConfig("POST", { userName, password }),
    (authenticatedUser) => {
      if (authenticatedUser.user.role === "ADMIN") {
        processLoginSignUp(authenticatedUser, reauthenticationCallback, onSuccess);
      } else {
        onErrors("No dispone de credenciales de administrador")
      }
    },
    onErrors
  );

export const tryLoginFromServiceToken = (
  onSuccess,
  reauthenticationCallback
) => {
  const serviceToken = getServiceToken();

  if (!serviceToken) {
    onSuccess();
    return;
  }

  setReauthenticationCallback(reauthenticationCallback);

  appFetch(
    "/users/loginFromServiceToken",
    fetchConfig("POST"),
    (authenticatedUser) => onSuccess(authenticatedUser),
    () => removeServiceToken()
  );
};

export const signUp = (user, onSuccess, onErrors, reauthenticationCallback) => {
  appFetch(
    "/users/signUp",
    fetchConfig("POST", user),
    (authenticatedUser) => {
      processLoginSignUp(authenticatedUser, reauthenticationCallback, onSuccess);
    },
    onErrors
  );
};

export const logout = () => removeServiceToken();

export const updateProfile = (user, onSuccess, onErrors) =>
  appFetch(`/users/${user.id}`, fetchConfig("PUT", user), onSuccess, onErrors);

export const changePassword = (
  id,
  oldPassword,
  newPassword,
  onSuccess,
  onErrors
) =>
  appFetch(
    `/users/${id}/changePassword`,
    fetchConfig("POST", { oldPassword, newPassword }),
    onSuccess,
    onErrors
  );

export const getAllUsers = ({ page }, onSuccess) => {

  let path = `/users/allUsers?page=${page}`;
  appFetch(path, fetchConfig('GET'), onSuccess)
};

export const removeUser = (userId, onSuccess, onErrors) =>
  appFetch(`/users/${userId}/removeUser`, fetchConfig('POST'), onSuccess, onErrors);
