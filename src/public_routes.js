import _ from 'lodash';

import Home from 'routes/home';
import Logout from 'routes/logout';
import Login from 'routes/login';
import Terms from 'routes/terms';

import 'routes/logout.scss';

var redirect = function (path) {
    return function (nextState, transition) {
        _.each(nextState.params, (v, k) => {
            path = path.replace(`:${k}`, v);
        });

        transition(null, path);
    };
};

var routes = [
    { path: 'home(/)', component: Home, title: 'Change My World Now', endpoint: ''},
    { path: 'ginas-corner(/)', onEnter: redirect('/')},
    { path: 'ginas-corner/ginas-ink(/)', onEnter: redirect('/')},
    { path: 'grown-ups/partnerships-media/ginas-ink(/)', onEnter: redirect('/')},
    { path: 'grown-ups/partnerships-media/press-room/live-interviews(/)', onEnter: redirect('/')},
    { path: 'whats-my-story/my-interests/your-mark/lifestyle-design/your-own-zone(/)',
        onEnter: redirect('/')},
    { path: 'for-grown-ups/partnerships-media/our-partners(/)', onEnter: redirect('/')},
    { path: 'whats-my-story/my-interests/your-mark(/)', onEnter: redirect('/')},
    { path: 'for-grown-ups/partnerships-media/press-room/blog-posts(/)', onEnter: redirect('/')},
    { path: 'terms(/)', component: Terms, endpoint: ''},
    { path: 'logout(/)', component: Logout, endpoint: '/logout'},
    { path: 'login(/)', component: Login, title: 'Login', endpoint: '/'}
];

routes = _.map(routes, i => {
    //defaults
    i.title = i.title || 'Change My World Now';
    i.public = true;
    return i;
});

routes.hasPath = function (path) {
    path = path[0] === '/' ? path.slice(1) : path;
    return _.reduce(routes, (a, v) => {
        return a || v.path.indexOf(path) === 0;
    }, false);
};

export default routes;

