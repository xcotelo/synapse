import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from '../../../backend/userService';
import { Errors } from "../../common";

const Register = () => {

    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);
    let form;

    const handleSubmit = event => {
        event.preventDefault();

        if (form.checkValidity()) {
            signUp(
                {
                    userName: userName.trim(),
                    password: password.trim(),
                    email: email.trim(),
                },
                () => navigate('/'),
                errors => {
                    if (typeof errors === 'string') {
                        setBackendErrors({ globalError: errors });
                    } else {
                        setBackendErrors(errors);
                    }
                }
            );
        } else {
            setBackendErrors(null);
            form.classList.add('was-validated');
        }
    };

    return (
        <div className="row justify-content-center ">
            <div className="col-6">
                <div className="card shadow-lg mt-4">
                    <div className="card-header text-center bazul3">
                        <h3 className="blanco">Registro</h3>
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
                                <div className="col">
                                    <label className="form-label" htmlFor="password">Contraseña</label>
                                    <input type="password" id="password" className="form-control bblanco"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <label className="form-label" htmlFor="email">Email</label>
                                    <input type="email" className="form-control bblanco" id="email" placeholder="name@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoFocus
                                        required />
                                </div>
                                <div className="col text-center">
                                    <button type="submit" className="btn btn-primary btn-block my-4 bazul2">Registrarse</button>
                                </div>
                            </div>
                            <div className="text-center">
                                <p>¿Ya registrado? <Link to="/">Iniciar Sesión</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;