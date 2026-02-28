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
    <div className="row justify-content-center">
      <div className="col-4">
        <div className="card shadow-lg mt-4">
          <div className="card-header text-center bazul3">
            <h3 className="blanco">Login</h3>
          </div>
          <div className="card-body bazul1">
            <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
            <form ref={node => form = node}
              className="needs-validation" noValidate
              onSubmit={e => handleSubmit(e)}>
              <div className="row">
                <div className="col">
                  <label className="form-label" htmlFor="userName">Usuario</label>
                  <input type="text" className="form-control bblanco" id="userName"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    autoFocus
                    required />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col">
                  <label className="form-label" htmlFor="password">Contraseña</label>
                  <input type="password" className="form-control bblanco" id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required />
                </div>
              </div>
              <div className="row justify-content-center">
                <div className="col-8 text-center">
                  <button type="submit" className="btn btn-primary btn-block my-4 bazul2 blanco">Iniciar sesión</button>
                </div>
              </div>
              <div className="text-center">
                <p>¿No registrado? <Link to="register">Registrarse</Link></p>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;