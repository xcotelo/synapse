import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../modules/user/components/Login";
import Register from "../../modules/user/components/Register";
import * as userService from "../../backend/userService";

const mockNavigate = jest.fn();
const mockLogIn = jest.fn();
const mockLogOut = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../modules/common/components/UserContext", () => ({
  useUser: () => ({
    logIn: mockLogIn,
    logOut: mockLogOut,
  }),
}));

jest.mock("../../backend/userService");

describe("Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form with usuario, contraseña and iniciar sesión", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /registrarse/i })).toBeInTheDocument();
  });

  it("calls login and navigate on successful submit", async () => {
    const auth = {
      serviceToken: "t",
      userDto: { userName: "user", id: 7 },
    };
    userService.login.mockImplementation((userName, password, onSuccess) => {
      onSuccess(auth);
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "user" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(userService.login).toHaveBeenCalledWith(
        "user",
        "pass",
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });
    await waitFor(() => {
      expect(mockLogIn).toHaveBeenCalledWith("user", 7);
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/brain/inbox");
    });
  });

  it("shows backend error when login fails", async () => {
    userService.login.mockImplementation((userName, password, onSuccess, onErrors) => {
      onErrors("Usuario o contraseña incorrectos");
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "y" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });

  it("adds was-validated to form when submit with empty fields", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      const form = screen.getByLabelText(/usuario/i).closest("form");
      expect(form).toHaveClass("was-validated");
    });
    expect(userService.login).not.toHaveBeenCalled();
  });
});

describe("Register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders register form with usuario, email, contraseña and registrarse", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registrarse/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("calls signUp and navigate on successful submit", async () => {
    userService.signUp.mockImplementation((user, onSuccess) => {
      onSuccess();
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "newuser" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(userService.signUp).toHaveBeenCalledWith(
        { userName: "newuser", password: "pass123", email: "a@b.com" },
        expect.any(Function),
        expect.any(Function)
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows backend error when signUp fails", async () => {
    userService.signUp.mockImplementation((user, onSuccess, onErrors) => {
      onErrors("Error, el usuario ya existe");
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "u" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "u@u.com" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "p" } });
    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/el usuario ya existe/i)).toBeInTheDocument();
    });
  });
});
