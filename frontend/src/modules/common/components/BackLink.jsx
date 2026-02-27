import { useNavigate } from 'react-router-dom';

import backArrow from '../../../assets/backArrow.svg';

const BackLink = () => {

    const navigate = useNavigate();

    return (

        <button className="btn rounded-pill mt-1 bblanco" onClick={() => navigate(-1)}>
            <img src={backArrow} alt="Back" style={{ width: '20px', height: '20px' }} />
        </button>

    );

};

export default BackLink;
