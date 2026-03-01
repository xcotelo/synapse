import * as userService from "../../backend/userService";

const mockAppFetch = jest.fn();
const mockGetServiceToken = jest.fn();
const mockRemoveServiceToken = jest.fn();
jest.mock("../../backend/appFetch", () => ({
  ...jest.requireActual("../../backend/appFetch"),
  appFetch: (...args) => mockAppFetch(...args),
  getServiceToken: () => mockGetServiceToken(),
  removeServiceToken: () => mockRemoveServiceToken(),
}));

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("calls appFetch with correct path and config and invokes onSuccess on success", () => {
      const onSuccess = jest.fn();
      const onErrors = jest.fn();
      const reauth = jest.fn();
      const authenticatedUser = {
        serviceToken: "token",
        userDto: { userName: "user", id: 1 },
      };

      mockAppFetch.mockImplementation((path, opts, successCb) => {
        successCb(authenticatedUser);
      });

      userService.login("user", "pass", onSuccess, onErrors, reauth);

      expect(mockAppFetch).toHaveBeenCalledWith(
        "/users/login",
        expect.objectContaining({ method: "POST" }),
        expect.any(Function),
        onErrors
      );
      expect(onSuccess).toHaveBeenCalledWith(authenticatedUser);
      expect(onErrors).not.toHaveBeenCalled();
    });

    it("invokes onErrors when appFetch calls error callback", () => {
      const onSuccess = jest.fn();
      const onErrors = jest.fn();

      mockAppFetch.mockImplementation((path, opts, successCb, errorCb) => {
        errorCb({ globalError: "Invalid login" });
      });

      userService.login("x", "y", onSuccess, onErrors, jest.fn());

      expect(onErrors).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("signUp", () => {
    it("calls appFetch with correct path and invokes onSuccess on success", () => {
      const onSuccess = jest.fn();
      const onErrors = jest.fn();
      const user = { userName: "newuser", password: "pass", email: "a@b.com" };

      mockAppFetch.mockImplementation((path, opts, successCb) => {
        successCb({ serviceToken: "t", userDto: {} });
      });

      userService.signUp(user, onSuccess, onErrors, jest.fn());

      expect(mockAppFetch).toHaveBeenCalledWith(
        "/users/signUp",
        expect.anything(),
        expect.any(Function),
        onErrors
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onErrors).not.toHaveBeenCalled();
    });

    it("invokes onErrors on signUp failure", () => {
      const onSuccess = jest.fn();
      const onErrors = jest.fn();

      mockAppFetch.mockImplementation((path, opts, successCb, errorCb) => {
        errorCb("El usuario ya existe");
      });

      userService.signUp(
        { userName: "u", password: "p", email: "e@e.com" },
        onSuccess,
        onErrors,
        jest.fn()
      );

      expect(onErrors).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("tryLoginFromServiceToken", () => {
    it("calls appFetch when serviceToken exists and invokes onSuccess with result", () => {
      mockGetServiceToken.mockReturnValue("token");
      const onSuccess = jest.fn();
      const auth = { userDto: {}, serviceToken: "t" };

      mockAppFetch.mockImplementation((path, opts, successCb) => {
        successCb(auth);
      });

      userService.tryLoginFromServiceToken(onSuccess, jest.fn());

      expect(mockAppFetch).toHaveBeenCalledWith(
        "/users/loginFromServiceToken",
        expect.anything(),
        expect.any(Function),
        expect.any(Function)
      );
      expect(onSuccess).toHaveBeenCalledWith(auth);
    });

    it("calls onSuccess without calling appFetch when no serviceToken", () => {
      mockGetServiceToken.mockReturnValue(null);
      const onSuccess = jest.fn();

      userService.tryLoginFromServiceToken(onSuccess, jest.fn());

      expect(mockAppFetch).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    it("calls appFetch with user id and PUT config", () => {
      const onSuccess = jest.fn();
      const onErrors = jest.fn();
      const user = { id: 5, userName: "u", email: "u@u.com" };

      mockAppFetch.mockImplementation((path, opts, successCb) => successCb());

      userService.updateProfile(user, onSuccess, onErrors);

      expect(mockAppFetch).toHaveBeenCalledWith(
        "/users/5",
        expect.anything(),
        onSuccess,
        onErrors
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("calls appFetch with changePassword path and invokes onSuccess", () => {
      const onSuccess = jest.fn();
      const onErrors = jest.fn();

      mockAppFetch.mockImplementation((path, opts, successCb) => successCb());

      userService.changePassword(1, "old", "new", onSuccess, onErrors);

      expect(mockAppFetch).toHaveBeenCalledWith(
        "/users/1/changePassword",
        expect.anything(),
        onSuccess,
        onErrors
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("calls removeServiceToken", () => {
      userService.logout();
      expect(mockRemoveServiceToken).toHaveBeenCalled();
    });
  });
});
