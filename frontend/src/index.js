import React from 'react';
import ReactDOM from 'react-dom';

import registerServiceWorker from './registerServiceWorker';

import { App } from "./modules/app";
import { UserProvider } from './modules/common/components/UserContext';
import { NotificationProvider } from './modules/common/components/NotificationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <UserProvider>
        <NotificationProvider>
            <App />
        </NotificationProvider>
    </UserProvider>

);

registerServiceWorker();
