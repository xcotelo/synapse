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
        <div className="synapse-auth-page">
            <div className="col-11 col-sm-8 col-md-6 col-lg-5 synapse-animate-in synapse-animate-in-delay-2">
                <div className="card synapse-auth-card">
                    <div className="card-header">
                        <h3 className="mb-1">Crear cuenta</h3>
                        <p className="mb-0">Empieza a usar tu cerebro digital</p>
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
                                    placeholder="Elige un nombre de usuario"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="password">Contraseña</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="d-grid gap-2 mt-3">
                                <button type="submit" className="btn btn-primary synapse-btn-primary w-100 py-2">
                                    Registrarse
                                </button>
                            </div>
                            <div className="text-center mt-3">
                                <small className="text-muted">
                                    ¿Ya tienes cuenta? <Link to="/">Iniciar sesión</Link>
                                </small>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;