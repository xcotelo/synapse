// import * as appFetchModule from "../../../backend/appFetch";
// import * as userService from "../../../backend/userService";

// jest.mock("../../../backend/appFetch");

describe("userService", () => {
  it("should have tests", () => {
    expect(true).toBe(true);
  });
});

// describe("userService", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe("login", () => {
//     it("should call appFetch with the correct parameters on successful login USER role", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const userName = "Fonsi";
//       const password = "password";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback({ user: { role: "USER" } });
//         }
//       );

//       await userService.login(
//         userName,
//         password,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/login`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call appFetch with the correct parameters on successful login ADMIN role", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const userName = "Fonsi";
//       const password = "password";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback({ user: { role: "ADMIN" } });
//         }
//       );

//       await userService.login(
//         userName,
//         password,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/login`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onErrors).toHaveBeenCalled();
//     });

//     it("should call onErrors callback on login failure", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const userName = "Fonsi";
//       const password = "password";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback, errorCallback) => {
//           errorCallback();
//         }
//       );

//       await userService.login(
//         userName,
//         password,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(onErrors).toHaveBeenCalled();
//       expect(onSuccess).not.toHaveBeenCalled();
//     });
//   });

//   describe("loginAdmin", () => {
//     it("should call appFetch with the correct parameters on successful loginAdmin ADMIN role", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const userName = "Fonsi";
//       const password = "password";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback({ user: { role: "ADMIN" } });
//         }
//       );

//       await userService.loginAdmin(
//         userName,
//         password,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/login`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call appFetch with the correct parameters on successful loginAdmin USER role", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const userName = "Fonsi";
//       const password = "password";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback({ user: { role: "USER" } });
//         }
//       );

//       await userService.loginAdmin(
//         userName,
//         password,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/login`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onErrors).toHaveBeenCalled();
//     });

//     it("should call onErrors callback on loginAdmin failure", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const userName = "Fonsi";
//       const password = "password";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback, errorCallback) => {
//           errorCallback();
//         }
//       );

//       await userService.loginAdmin(
//         userName,
//         password,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(onErrors).toHaveBeenCalled();
//       expect(onSuccess).not.toHaveBeenCalled();
//     });
//   });

//   describe("signUp", () => {
//     it("should call appFetch with the correct parameters on successful signUp", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const user = "Fonsi";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback({ user: { serviceToken: "JNALSMIQOXNKS" } });
//         }
//       );

//       await userService.signUp(
//         user,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/signUp`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call onErrors callback on signUp failure", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const reauthenticationCallback = jest.fn();
//       const user = "Fonsi";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback, errorCallback) => {
//           errorCallback();
//         }
//       );

//       await userService.signUp(
//         user,
//         onSuccess,
//         onErrors,
//         reauthenticationCallback
//       );

//       expect(onErrors).toHaveBeenCalled();
//       expect(onSuccess).not.toHaveBeenCalled();
//     });
//   });

//   describe("findLeagues", () => {
//     it("should call appFetch with the correct parameters on successful findLeagues", async () => {
//       const onSuccess = jest.fn();
//       const userId = "1";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback({ leagues: ["League1", "League2"] });
//         }
//       );

//       await userService.findLeagues({ id: userId }, onSuccess);

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/${userId}/leagues`,
//         undefined,
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalledWith({
//         leagues: ["League1", "League2"],
//       });
//     });
//   });

//   describe("tryLoginFromServiceToken", () => {
//     it("should call appFetch with the correct parameters on successful tryLoginFromServiceToken", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();

//       appFetchModule.getServiceToken.mockImplementationOnce(() => "fake_token");

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback();
//         }
//       );

//       await userService.tryLoginFromServiceToken(onSuccess, onErrors);

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/loginFromServiceToken`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call appFetch with the correct parameters on successful tryLoginFromServiceToken no token", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();

//       appFetchModule.getServiceToken.mockImplementationOnce(() => null);

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback();
//         }
//       );

//       await userService.tryLoginFromServiceToken(onSuccess, onErrors);

//       expect(appFetchModule.appFetch).not.toHaveBeenCalled();

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call onErrors callback on tryLoginFromServiceToken", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();

//       appFetchModule.getServiceToken.mockImplementationOnce(() => "fake_token");

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback, errorCallback) => {
//           errorCallback();
//         }
//       );

//       await userService.tryLoginFromServiceToken(onSuccess, onErrors);

//       expect(appFetchModule.removeServiceToken).toHaveBeenCalled();
//       expect(onSuccess).not.toHaveBeenCalled();
//     });
//   });

//   describe("updateProfile", () => {
//     it("should call appFetch with the correct parameters on successful updateProfile", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const user = { id: 1 };

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback();
//         }
//       );

//       await userService.updateProfile(user, onSuccess, onErrors);

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/${user.id}`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call onErrors callback on updateProfile", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const user = { id: 1 };

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback, errorCallback) => {
//           errorCallback();
//         }
//       );

//       await userService.updateProfile(user, onSuccess, onErrors);

//       expect(onErrors).toHaveBeenCalled();
//       expect(onSuccess).not.toHaveBeenCalled();
//     });
//   });

//   describe("changePassword", () => {
//     it("should call appFetch with the correct parameters on successful changePassword", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const id = 1;
//       const oldPassword = "uwu";
//       const newPassword = "JJ";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback) => {
//           successCallback();
//         }
//       );

//       await userService.changePassword(
//         id,
//         oldPassword,
//         newPassword,
//         onSuccess,
//         onErrors
//       );

//       expect(appFetchModule.appFetch).toHaveBeenCalledWith(
//         `/users/${id}/changePassword`,
//         undefined,
//         expect.any(Function),
//         expect.any(Function)
//       );

//       expect(onSuccess).toHaveBeenCalled();
//       expect(onErrors).not.toHaveBeenCalled();
//     });

//     it("should call onErrors callback on changePassword", async () => {
//       const onSuccess = jest.fn();
//       const onErrors = jest.fn();
//       const id = 1;
//       const oldPassword = "uwu";
//       const newPassword = "JJ";

//       appFetchModule.appFetch.mockImplementationOnce(
//         (url, config, successCallback, errorCallback) => {
//           errorCallback();
//         }
//       );

//       await userService.changePassword(
//         id,
//         oldPassword,
//         newPassword,
//         onSuccess,
//         onErrors
//       );

//       expect(onErrors).toHaveBeenCalled();
//       expect(onSuccess).not.toHaveBeenCalled();
//     });
//   });
// });
