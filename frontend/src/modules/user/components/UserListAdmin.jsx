import React, { useState, useEffect } from 'react';
import { getAllUsers, removeUser } from '../../../backend/userService';
import { Pager, Errors } from '../../common';

const UserListAdmin = () => {
    const [users, setUsers] = useState({ items: [], existMoreItems: false });
    const [currentPage, setCurrentPage] = useState(0);
    const [deleteUser, setDeleteUser] = useState(null);
    const [backendErrors, setBackendErrors] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        // Fetch users when the component mounts or currentPage changes
        getAllUsers({ page: currentPage }, (result) => {
            setUsers(result);
        });
    }, [currentPage]);

    const handleRemoveUser = (userId) => {
        removeUser(userId,
            () => {
                setSuccessMessage('Eliminado con éxito');
                setBackendErrors(null);
            },
            backendErrors => setBackendErrors(backendErrors)
        );

    };

    const openModalRemoveUser = (userId) => {
        setDeleteUser(userId);
        setBackendErrors(null);
        setSuccessMessage(null);
    };

    const closeModal = () => {
        setDeleteUser(null);
        setBackendErrors(null);
        setSuccessMessage(null);
    };

    const previousPage = () => {
        if (currentPage > 0) {
            getAllUsers({ page: currentPage - 1 }, (result) => {
                setUsers(result);
                setCurrentPage(currentPage - 1);
            });
        }
    };

    const nextPage = () => {
        if (users.existMoreItems) {
            getAllUsers({ page: currentPage + 1 }, (result) => {
                setUsers(result);
                setCurrentPage(currentPage + 1);
            });
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-10">
                <div className="card shadow-lg" >
                    <div className="card-header bazul3">
                        <div className="row">
                            <div className="col-12 d-flex justify-content-between align-items-center">
                                <h3 className="blanco">Usuarios</h3>
                            </div>
                        </div>
                    </div>
                    <div className="card-body bazul1">
                        {users.items.length > 0 ? (
                            <>
                                <div className="d-flex justify-content-center">
                                    <table id="userTable" className="table table-striped table-hover" style={{ width: '80%' }}>
                                        <thead>
                                            <tr>
                                                <th scope="col" style={{ width: "20%" }}>
                                                    Usuario
                                                </th>
                                                <th scope="col" style={{ width: "20%" }}>
                                                    Correo electrónico
                                                </th>
                                                <th scope="col" style={{ width: "20%" }}>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.items.map(user => (
                                                <tr key={user.id}>
                                                    <td style={{ verticalAlign: 'middle' }}>{user.userName}</td>
                                                    <td style={{ verticalAlign: 'middle' }}>{user.email}</td>
                                                    <td style={{ verticalAlign: 'middle' }}>
                                                        <button
                                                            className="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#exampleModalRemoveUser" onClick={() => openModalRemoveUser(user.id)}>
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <Pager
                                        back={{
                                            enabled: currentPage >= 1,
                                            onClick: previousPage
                                        }}
                                        next={{
                                            enabled: users.existMoreItems,
                                            onClick: nextPage
                                        }}
                                        currentPage={currentPage}
                                        setPage={setCurrentPage}
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-center">No hay usuarios disponibles</p>
                        )}
                    </div>
                </div>
            </div>
            <div data-testid="removeUserModal" className="modal fade" id="exampleModalRemoveUser" tabIndex="-1" aria-labelledby="exampleModalLabel">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bazul3 blanco">
                            <h5 className="modal-title fw-bold" id="exampleModalLabel">Eliminar usuario</h5>
                            <button data-testid="closeBuy" type="button" className="btn-close brojo" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body bazul1">
                            {successMessage ? (
                                <p>{successMessage}</p>
                            ) : (
                                <>
                                    <p>¿Está seguro de que desea eliminar a este usuario?</p>
                                    <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
                                </>
                            )}
                        </div>
                        <div className="modal-footer bazul1">
                            {successMessage ? (
                                <button type="button" className="btn btn-danger brojo" data-bs-dismiss="modal" onClick={() => window.location.reload()}>
                                    Aceptar
                                </button>
                            ) : (
                                <>
                                    <button type="button" className="btn btn-secondary bazul2 blanco" data-bs-dismiss="modal" onClick={closeModal}>Cancelar</button>
                                    <button type="button" className="btn btn-danger brojo" onClick={() => {
                                        if (deleteUser != null) {
                                            handleRemoveUser(deleteUser);
                                        }
                                    }}>Sí, eliminar usuario</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserListAdmin;