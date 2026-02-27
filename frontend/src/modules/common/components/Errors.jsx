import PropTypes from 'prop-types';

const Errors = ({ errors, onClose }) => {

    if (!errors) {
        return null;
    }

    let globalError;
    let fieldErrors;

    if (errors.globalError) {
        globalError = errors.globalError;
    } else if (errors.fieldErrors) {
        fieldErrors = [];
        errors.fieldErrors.forEach(e => {
            fieldErrors.push(`${e.fieldName}: ${e.message}`)
        });

    }

    return (

        <div className="alert alert-danger alert-dismissible fade show" role="alert">

            {globalError ? globalError : ''}

            {fieldErrors ?
                <ul>
                    {fieldErrors.map((fieldError, index) =>
                        <li key={fieldError}>{fieldError}</li>
                    )}
                </ul>
                :
                ''
            }

            <button type="button" className="btn-close" aria-label="Close"
                onClick={onClose}>
            </button>
        </div>

    );

}

Errors.propTypes = {
    errors: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    onClose: PropTypes.func.isRequired
};

export default Errors;
