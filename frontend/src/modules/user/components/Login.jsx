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
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh', background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 50%, #A8DADC 100%)' }}>
      <div className="col-11 col-sm-8 col-md-6 col-lg-4">
        <div className="card shadow-lg border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <div className="card-header text-center bazul3 py-4">
            <h3 className="blanco mb-1">Bienvenido a Synapse</h3>
            <p className="mb-0 azul1" style={{ fontSize: '0.9rem' }}>Conecta tu cerebro digital</p>
          </div>
          <div className="card-body bazul1 p-4">
            <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
            <form
              ref={node => form = node}
              className="needs-validation"
              noValidate
              onSubmit={e => handleSubmit(e)}
            >
              <div className="mb-3">
                <label className="form-label azul3" htmlFor="userName">Usuario</label>
                <input
                  type="text"
                  className="form-control bblanco"
                  id="userName"
                  placeholder="Tu usuario"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label azul3" htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  className="form-control bblanco"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-grid gap-2 mt-3">
                <button
                  type="submit"
                  className="btn bazul2 blanco py-2"
                  style={{ borderRadius: '999px', fontWeight: 500 }}
                >
                  Iniciar sesión
                </button>
              </div>
              <div className="text-center mt-3">
                <small className="azul3">
                  ¿No tienes cuenta todavía?{' '}
                  <Link to="register" className="azul2" style={{ fontWeight: 500 }}>
                    Registrarse
                  </Link>
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