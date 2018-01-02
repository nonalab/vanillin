import React from 'react';
import ReactDOM from 'react-dom';

import registerServiceWorker from 'registerServiceWorker';

import TransitionGroup from 'react-transition-group/TransitionGroup';

import {BrowserRouter as Router, Route} from 'react-router-dom';

import AnimatedSwitch from 'components/AnimatedSwitch';

import Home from 'pages/Home';

import {BASENAME_MAP as basenameMap} from 'variables';

const {location} = window;

const basename = basenameMap[location.host]

// Global page, so it also include some section
const App = () => (<Router basename={basename}>
    <TransitionGroup>
        <AnimatedSwitch>
            <Route exact="exact" path="/" component={Home}/>
        </AnimatedSwitch>
    </TransitionGroup>
</Router>);

const rootEl = document.getElementById('root');

if (rootEl) {
    ReactDOM.render(<App/>, rootEl);
    registerServiceWorker();
}

export default App;
