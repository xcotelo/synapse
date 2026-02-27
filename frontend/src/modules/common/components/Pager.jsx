import PropTypes from 'prop-types';

const Pager = ({ back, next, currentPage, setPage }) => {

    return (
        <nav aria-label="page navigation">
            <ul className="pagination justify-content-center">
                <li className={`page-item ${back.enabled ? "" : "disabled"}`}>
                    <button className="page-link"
                        onClick={() => {
                            setPage(currentPage - 1);
                            back.onClick();
                        }}>
                        Anterior
                    </button>
                </li>
                <li className={`page-item ${next.enabled ? "" : "disabled"}`}>
                    <button className="page-link"
                        onClick={() => {
                            setPage(currentPage + 1);
                            next.onClick();
                        }}>
                        Siguiente
                    </button>
                </li>
            </ul>
        </nav>
    )
};

Pager.propTypes = {
    back: PropTypes.object.isRequired,
    next: PropTypes.object.isRequired,
    currentPage: PropTypes.number.isRequired,
    setPage: PropTypes.func.isRequired
};

export default Pager;
