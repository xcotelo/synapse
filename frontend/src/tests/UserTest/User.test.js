// import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// import { MemoryRouter } from "react-router-dom";
// import { login, loginAdmin, signUp } from "../../../backend/userService";
// import renderer from "react-test-renderer";
// import Login from "../../../modules/user/components/Login";
// import LoginAdmin from "../../../modules/user/components/LoginAdmin";
// import Register from "../../../modules/user/components/Register";
// import { RoleType } from "../../../modules/common";

// import "@testing-library/jest-dom";

// const mockLogIn = jest.fn();
// const mockLogOut = jest.fn();
// jest.mock("../../../modules/common/components/UserContext", () => ({
//   useUser: () => ({
//     logIn: mockLogIn,
//     logOut: mockLogOut,
//   }),
// }));

// const mockSetPage = jest.fn();
// jest.mock("../../../modules/player/components/PlayerSearchContext", () => ({
//   usePlayerSearch: () => ({
//     setPage: mockSetPage,
//   }),
// }));

// jest.mock("../../../backend/userService", () => ({
//   login: jest.fn(),
//   loginAdmin: jest.fn(),
//   signUp: jest.fn(),
// }));

// const mockNavigate = jest.fn();

// jest.mock("react-router-dom", () => ({
//   ...jest.requireActual("react-router-dom"),
//   useNavigate: () => mockNavigate,
// }));

// describe("Login", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("renders correctly", () => {
//     const tree = renderer
//       .create(
//         <MemoryRouter>
//           <Login />
//         </MemoryRouter>
//       )
//       .toJSON();
//     expect(tree).toMatchSnapshot();
//   });

//   it("renders login form with all fields", () => {
//     render(
//       <MemoryRouter>
//         <Login />
//       </MemoryRouter>
//     );

//     expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
//     expect(
//       screen.getByRole("button", { name: /iniciar sesión/i })
//     ).toBeInTheDocument();
//     expect(
//       screen.getByRole("link", { name: /registrarse/i })
//     ).toBeInTheDocument();
//     expect(
//       screen.getByRole("link", { name: /administrador/i })
//     ).toBeInTheDocument();
//   });

//   it("should call login API and navigate on successful login", async () => {
//     const mockAuthenticatedUser = {
//       serviceToken: "faketoken",
//       user: {
//         id: 6,
//         userName: "anton",
//         firstName: "Anton",
//         lastName: "Saenz",
//         email: "anton@gmail.com",
//         role: "USER",
//       },
//     };

//     login.mockImplementation((userName, password, onSuccess) => {
//       onSuccess(mockAuthenticatedUser);
//     });

//     render(
//       <MemoryRouter>
//         <Login />
//       </MemoryRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/usuario/i), {
//       target: { value: "anton" },
//     });
//     fireEvent.change(screen.getByLabelText(/contraseña/i), {
//       target: { value: "pa2324" },
//     });

//     fireEvent.click(screen.getByText(/iniciar sesión/i));

//     await waitFor(() => expect(mockSetPage).toHaveBeenCalledWith(0));
//     await waitFor(() =>
//       expect(mockNavigate).toHaveBeenCalledWith("/league/ShowLeagues")
//     );
//     await waitFor(() =>
//       expect(mockLogIn).toHaveBeenCalledWith(
//         RoleType.USER,
//         mockAuthenticatedUser.user,
//         Number(mockAuthenticatedUser.user.id)
//       )
//     );
//   });

//   it("should call setBackendErrors when login API returns errors", async () => {
//     const mockErrorResponse = "Invalid username or password";

//     login.mockImplementation((userName, password, onSuccess, onError) => {
//       onError(mockErrorResponse);
//     });

//     render(
//       <MemoryRouter>
//         <Login />
//       </MemoryRouter>
//     );

//     const userNameInput = screen.getByLabelText(/usuario/i);
//     const passwordInput = screen.getByLabelText(/contraseña/i);
//     const submitButton = screen.getByRole("button", {
//       name: /iniciar sesión/i,
//     });

//     fireEvent.change(userNameInput, { target: { value: "wrongUser" } });
//     fireEvent.change(passwordInput, { target: { value: "wrongPassword" } });

//     fireEvent.click(submitButton);

//     expect(screen.getByText(mockErrorResponse)).toBeInTheDocument();

//     expect(mockNavigate).not.toHaveBeenCalled();
//   });

//   it("should call logOut on component mount", () => {
//     render(
//       <MemoryRouter>
//         <Login />
//       </MemoryRouter>
//     );

//     expect(mockLogOut).toHaveBeenCalled();
//   });

//   it("send invalid form", async () => {
//     render(
//       <MemoryRouter>
//         <Login />
//       </MemoryRouter>
//     );

//     const userNameInput = screen.getByLabelText(/usuario/i);
//     const passwordInput = screen.getByLabelText(/contraseña/i);
//     const submitButton = screen.getByRole("button", {
//       name: /iniciar sesión/i,
//     });

//     fireEvent.change(userNameInput, { target: { value: "" } });
//     fireEvent.change(passwordInput, { target: { value: "" } });

//     fireEvent.click(submitButton);

//     await screen.findByText(/usuario/i);
//     expect(userNameInput.closest("form")).toHaveClass("was-validated");

//     expect(login).not.toHaveBeenCalled();
//   });
// });

// describe("LoginAdmin", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("renders correctly", () => {
//     const tree = renderer
//       .create(
//         <MemoryRouter>
//           <LoginAdmin />
//         </MemoryRouter>
//       )
//       .toJSON();
//     expect(tree).toMatchSnapshot();
//   });

//   it("renders login form with all fields", () => {
//     render(
//       <MemoryRouter>
//         <LoginAdmin />
//       </MemoryRouter>
//     );

//     expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
//     expect(
//       screen.getByRole("button", { name: /iniciar sesión/i })
//     ).toBeInTheDocument();
//     expect(
//       screen.getByRole("link", { name: /no soy administrador/i })
//     ).toBeInTheDocument();
//   });

//   it("should call login API and navigate on successful login", async () => {
//     const mockAuthenticatedUser = {
//       serviceToken: "faketoken",
//       user: {
//         id: 1,
//         userName: "diego",
//         firstName: "Diego",
//         lastName: "Viqueira",
//         email: "diego@gmail.com",
//         role: "ADMIN",
//       },
//     };

//     loginAdmin.mockImplementation((userName, password, onSuccess) => {
//       onSuccess(mockAuthenticatedUser);
//     });

//     render(
//       <MemoryRouter>
//         <LoginAdmin />
//       </MemoryRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/usuario/i), {
//       target: { value: "diego" },
//     });
//     fireEvent.change(screen.getByLabelText(/contraseña/i), {
//       target: { value: "pa2324" },
//     });

//     fireEvent.click(screen.getByText(/iniciar sesión/i));

//     await waitFor(() => expect(mockSetPage).toHaveBeenCalledWith(0));
//     await waitFor(() =>
//       expect(mockNavigate).toHaveBeenCalledWith("/player/find-players")
//     );
//     await waitFor(() => expect(mockLogIn).toHaveBeenCalledWith(RoleType.ADMIN));
//   });

//   it("should call setBackendErrors when login API returns errors", async () => {
//     const mockErrorResponse = "Invalid username or password";

//     loginAdmin.mockImplementation((userName, password, onSuccess, onError) => {
//       onError(mockErrorResponse);
//     });

//     render(
//       <MemoryRouter>
//         <LoginAdmin />
//       </MemoryRouter>
//     );

//     const userNameInput = screen.getByLabelText(/usuario/i);
//     const passwordInput = screen.getByLabelText(/contraseña/i);
//     const submitButton = screen.getByRole("button", {
//       name: /iniciar sesión/i,
//     });

//     fireEvent.change(userNameInput, { target: { value: "wrongUser" } });
//     fireEvent.change(passwordInput, { target: { value: "wrongPassword" } });

//     fireEvent.click(submitButton);

//     expect(screen.getByText(mockErrorResponse)).toBeInTheDocument();

//     expect(mockNavigate).not.toHaveBeenCalled();
//   });

//   it("should call logOut on component mount", () => {
//     render(
//       <MemoryRouter>
//         <LoginAdmin />
//       </MemoryRouter>
//     );

//     expect(mockLogOut).toHaveBeenCalled();
//   });

//   it("send invalid form", async () => {
//     render(
//       <MemoryRouter>
//         <LoginAdmin />
//       </MemoryRouter>
//     );

//     const userNameInput = screen.getByLabelText(/usuario/i);
//     const passwordInput = screen.getByLabelText(/contraseña/i);
//     const submitButton = screen.getByRole("button", {
//       name: /iniciar sesión/i,
//     });

//     fireEvent.change(userNameInput, { target: { value: "" } });
//     fireEvent.change(passwordInput, { target: { value: "" } });

//     fireEvent.click(submitButton);

//     await screen.findByText(/usuario/i);
//     expect(userNameInput.closest("form")).toHaveClass("was-validated");

//     expect(loginAdmin).not.toHaveBeenCalled();
//   });
// });

// describe("Register", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("renders correctly", () => {
//     const tree = renderer
//       .create(
//         <MemoryRouter>
//           <Register />
//         </MemoryRouter>
//       )
//       .toJSON();
//     expect(tree).toMatchSnapshot();
//   });

//   it("renders register form with all fields", () => {
//     render(
//       <MemoryRouter>
//         <Register />
//       </MemoryRouter>
//     );

//     expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
//     expect(
//       screen.getByRole("button", { name: /registrarse/i })
//     ).toBeInTheDocument();
//     expect(
//       screen.getByRole("link", { name: /iniciar sesión/i })
//     ).toBeInTheDocument();
//   });

//   it("should call signUp API and navigate on successful registration", async () => {
//     const mockUserData = {
//       userName: "anton",
//       firstName: "Anton",
//       lastName: "Saenz",
//       email: "anton@gmail.com",
//       password: "password123",
//     };

//     signUp.mockImplementation((data, onSuccess) => {
//       onSuccess();
//     });

//     render(
//       <MemoryRouter>
//         <Register />
//       </MemoryRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/usuario/i), {
//       target: { value: mockUserData.userName },
//     });
//     fireEvent.change(screen.getByLabelText(/contraseña/i), {
//       target: { value: mockUserData.password },
//     });
//     fireEvent.change(screen.getByLabelText(/nombre/i), {
//       target: { value: mockUserData.firstName },
//     });
//     fireEvent.change(screen.getByLabelText(/apellido/i), {
//       target: { value: mockUserData.lastName },
//     });
//     fireEvent.change(screen.getByLabelText(/email/i), {
//       target: { value: mockUserData.email },
//     });

//     fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

//     await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
//   });

//   it("should call setBackendErrors when signUp API returns errors", async () => {
//     const mockErrorResponse = "Error, el usuario ya existe";

//     signUp.mockImplementation((data, onSuccess, onError) => {
//       onError(mockErrorResponse);
//     });

//     render(
//       <MemoryRouter>
//         <Register />
//       </MemoryRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/usuario/i), {
//       target: { value: "anton" },
//     });
//     fireEvent.change(screen.getByLabelText(/contraseña/i), {
//       target: { value: "password123" },
//     });
//     fireEvent.change(screen.getByLabelText(/nombre/i), {
//       target: { value: "Anton" },
//     });
//     fireEvent.change(screen.getByLabelText(/apellido/i), {
//       target: { value: "Saenz" },
//     });
//     fireEvent.change(screen.getByLabelText(/email/i), {
//       target: { value: "anton@gmail.com" },
//     });

//     fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

//     expect(
//       screen.getByText(/Error, el usuario ya existe/i)
//     ).toBeInTheDocument();

//     expect(mockNavigate).not.toHaveBeenCalled();
//   });

//   it("should not submit form with invalid inputs", async () => {
//     render(
//       <MemoryRouter>
//         <Register />
//       </MemoryRouter>
//     );

//     const userNameInput = screen.getByLabelText(/usuario/i);
//     const passwordInput = screen.getByLabelText(/contraseña/i);
//     const firstNameInput = screen.getByLabelText(/nombre/i);
//     const lastNameInput = screen.getByLabelText(/apellido/i);
//     const emailInput = screen.getByLabelText(/email/i);
//     const submitButton = screen.getByRole("button", { name: /registrarse/i });

//     fireEvent.change(userNameInput, { target: { value: "" } });
//     fireEvent.change(passwordInput, { target: { value: "" } });
//     fireEvent.change(firstNameInput, { target: { value: "" } });
//     fireEvent.change(lastNameInput, { target: { value: "" } });
//     fireEvent.change(emailInput, { target: { value: "" } });

//     fireEvent.click(submitButton);

//     await screen.findByText(/usuario/i);
//     expect(userNameInput.closest("form")).toHaveClass("was-validated");

//     expect(signUp).not.toHaveBeenCalled();
//   });

//   it("should not show backend error messages after successful registration", async () => {
//     const mockUserData = {
//       userName: "anton",
//       firstName: "Anton",
//       lastName: "Saenz",
//       email: "anton@gmail.com",
//       password: "password123",
//     };

//     signUp.mockImplementation((data, onSuccess) => {
//       onSuccess();
//     });

//     render(
//       <MemoryRouter>
//         <Register />
//       </MemoryRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/usuario/i), {
//       target: { value: mockUserData.userName },
//     });
//     fireEvent.change(screen.getByLabelText(/contraseña/i), {
//       target: { value: mockUserData.password },
//     });
//     fireEvent.change(screen.getByLabelText(/nombre/i), {
//       target: { value: mockUserData.firstName },
//     });
//     fireEvent.change(screen.getByLabelText(/apellido/i), {
//       target: { value: mockUserData.lastName },
//     });
//     fireEvent.change(screen.getByLabelText(/email/i), {
//       target: { value: mockUserData.email },
//     });

//     fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

//     await waitFor(() => expect(screen.queryByText(/Error/i)).toBeNull());
//   });
// });
