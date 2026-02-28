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
        <div
            className="d-flex justify-content-center align-items-center"
            style={{
                minHeight: 'calc(100vh - 64px)',
                width: '100%',
                background: 'linear-gradient(135deg, #1D3557 0%, #457B9D 50%, #A8DADC 100%)'
            }}
        >
            <div className="col-11 col-sm-8 col-md-6 col-lg-5">
                <div className="card shadow-lg border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                    <div className="card-header text-center bazul3 py-4">
                        <h3 className="blanco mb-1">Crear cuenta</h3>
                        <p className="mb-0 azul1" style={{ fontSize: '0.9rem' }}>Empieza a usar tu cerebro digital</p>
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
                                    placeholder="Elige un nombre de usuario"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label azul3" htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    className="form-control bblanco"
                                    id="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label azul3" htmlFor="password">Contraseña</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-control bblanco"
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
                                    Registrarse
                                </button>
                            </div>
                            <div className="text-center mt-3">
                                <small className="azul3">
                                    ¿Ya registrado?{' '}
                                    <Link to="/" className="azul2" style={{ fontWeight: 500 }}>
                                        Iniciar sesión
                                    </Link>
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