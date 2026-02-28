import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from '../../../backend/userService';
import { useUser } from "../../common/components/UserContext";
import { Errors } from "../../common";

const Login = () => {
  const { logIn, logOut } = useUser();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [backendErrors, setBackendErrors] = useState(null);
  let form;

  const handleSubmit = event => {

    event.preventDefault();

    if (form.checkValidity()) {
      login(
        userName.trim(),
        password,
        (authenticatedUser) => {
          logIn(authenticatedUser.userDto.userName, Number(authenticatedUser.userDto.id));
          navigate('/brain/inbox');
        },
        errors => {
          if (typeof errors === 'string') {
            setBackendErrors({ globalError: errors });
          } else {
            setBackendErrors(errors);
          }
        },
        () => {
          navigate('/');
        }
      );
    } else {
      setBackendErrors(null);
      form.classList.add('was-validated');
    }
  }

  useEffect(() => {
    logOut();
  }, []);

  return (
    <div className="synapse-auth-page">
      <div className="col-11 col-sm-8 col-md-6 col-lg-4 synapse-animate-in synapse-animate-in-delay-2">
        <div className="card synapse-auth-card">
          <div className="card-header">
            <h3 className="mb-1">Bienvenido</h3>
            <p className="mb-0">Conecta tu cerebro digital</p>
          </div>
          <div className="card-body">
            <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
            <form
              ref={node => form = node}
              className="needs-validation"
              noValidate
              onSubmit={e => handleSubmit(e)}
            >
              <div className="mb-3">
                <label className="form-label" htmlFor="userName">Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  id="userName"
                  placeholder="Tu usuario"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-primary synapse-btn-primary w-100 py-2">
                  Iniciar sesión
                </button>
              </div>
              <div className="text-center mt-3">
                <small className="text-muted">
                  ¿No tienes cuenta? <Link to="register">Registrarse</Link>
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;