import React from 'react';
import ReactDOM from 'react-dom';
import Screenfull from 'screenfull';
import ClassNames from 'classnames';
import _ from 'lodash';
import {Button, Glyphicon} from 'react-bootstrap';

import getEventsForGame from 'components/game_events';
import GLOBALS from 'components/globals';
import HttpManager from 'components/http_manager';
import Detector from 'components/browser_detector';

import 'components/game.scss';

const EVENT_PREFIX = '_e_';

const FULLSCREEN = 'Full Screen';
const DEMO_MODE = 'Demo Mode';

const PORTRAIT_TEXT = 'Please turn this game into landscape mode to continue.';

/**
 * Game wrapper iframe component.
 * Listens for 'game-event'
 * Has three default events - init, onFlipEarned, and onSave
 * Provides data to component via respond method in details of init event
 * additional arbitrary events can be added by adding additional
 * props prefixed with 'on'. Should the game issue events with
 * these names, any provided callbacks will fire. For example:
 * ```
 * var event = new Event('save', {bubbles: true}, {name: 'save', gameData: {state: {...}}});
 * window.frameElement.dispatchEvent(event)
 * ```
 * note that the component may provide incomplete or empty
 * state data, so any missing properties should be actively
 * regenerated by the game itself.
 */
var Game = React.createClass({
    getDefaultProps: function () {
        return {
            onFlipEarned: _.noop,
            onSave: _.noop,
            isTeacher: false,
            gameState: {}
        };
    },
    getInitialState: function () {
        return {
            fullscreenFallback: false,
            demo: false
        };
    },
    componentWillMount: function () {
        this.setEvent();
        this.setState({
            currentGame: this.props.game,
            eventHandler: getEventsForGame(
                EVENT_PREFIX,
                this.props.game,
                this.props.currentUser._links,
                this.onExit
            )
        });
    },
    componentDidMount: function () {
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        var callApi;

        if (!frame) {
            return;
        }

        callApi = _.debounce(function () {
            HttpManager.GET({
                url: (GLOBALS.API_URL),
                handleErrors: false
            });
        }, 5000);
        frame.addEventListener('load', function () {
            frame.contentWindow.addEventListener('click', callApi, false);
        }, false);
        this.checkForPortrait();
    },
    componentWillReceiveProps: function (nextProps) {
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        var callApi = _.debounce(function () {
            HttpManager.GET({
                url: (GLOBALS.API_URL),
                handleErrors: false
            });
        }, 10000);
        frame.addEventListener('load', function () {
            frame.contentWindow.addEventListener('click', callApi, false);
        }, false);

        this.setState({
            currentGame: nextProps.game,
            eventHandler: getEventsForGame(
                EVENT_PREFIX,
                nextProps.game,
                nextProps.currentUser._links,
                this.onExit
            )
        });
    },
    componentWillUnmount: function () {
        this.clearEvent();
    },
    onExit: function (nextState) {
        this.setState(nextState);
    },
    gameEventHandler: function (e) {
        if (e.name != null) {
            if (_.isFunction(this[EVENT_PREFIX + _.upperFirst(e.name)])) {
                this[EVENT_PREFIX + _.upperFirst(e.name)](...arguments);
            }
            if (_.isFunction(this.state.eventHandler[EVENT_PREFIX + _.upperFirst(e.name)])) {
                this.state.eventHandler[EVENT_PREFIX + _.upperFirst(e.name)](...arguments);
            }
            if (_.isFunction(this.props['on' + _.upperFirst(e.name)])) {
                this.props['on' + _.upperFirst(e.name)](...arguments);
            }
        }
    },
    setEvent: function () {
        window.addEventListener('game-event', this.gameEventHandler);
        window.addEventListener('platform-event', this.gameEventHandler);
        window.addEventListener('keydown', this.listenForEsc);
        window.addEventListener('resize', this.checkForPortrait);
        window.addEventListener('orientationchange', this.resizeFrame);
    },
    clearEvent: function () {
        window.removeEventListener('game-event', this.gameEventHandler);
        window.removeEventListener('keydown', this.listenForEsc);
        window.removeEventListener('resize', this.checkForPortrait);
        window.addEventListener('orientationchange', this.resizeFrame);
    },
    listenForEsc: function (e) {
        var self = this;
        if (e.keyCode === 27 || e.charCode === 27) {
            Screenfull.exit();
            self.setState({
                fullscreenFallback: false,
            });
        }
    },
    resizeFrame: function () {
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        if (frame) {
            frame.contentWindow.innerWidth = ReactDOM.findDOMNode(this.refs.wrapRef).offsetWidth;
            frame.contentWindow.innerHeight = ReactDOM.findDOMNode(this.refs.wrapRef).offsetHeight;
        }
        this.dispatchPlatformEvent('resize');
    },
    dispatchPlatformEvent: function (name, data) {
        /** TODO: MPR, 1/15/16: Polyfill event */
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        var event = new Event('platform-event', {bubbles: true, cancelable: false});
        this.toggleDemoButton();
        _.defaults(event, {type: 'platform-event', name, data});
        if (frame) frame.contentWindow.dispatchEvent(event);
    },
    makeFullScreen: function () {
        if (Screenfull.enabled) {
            Screenfull.request(ReactDOM.findDOMNode(this.refs.wrapRef));
        } else {
            this.setState({fullscreenFallback: true});
            this.resizeFrame();
        }
    },
    checkForPortrait: function () {
        var isPortrait = (Detector.isMobileOrTablet() && Detector.isPortrait());
        this.setState({isPortrait});
    },
    toggleDemoButton: function () {
        this.state.demo ? this.setState({demo: false}) : this.setState({demo: true});
    },
    render: function () {
        if (this.props.url == null) return null;
        return (
            <div className="wrapper">
                <div ref="wrapRef" className={ClassNames(
                    'game',
                    {fullscreen: this.state.fullscreenFallback}
                )}>
                    <div
                        ref="overlay"
                        className={ClassNames('overlay', {
                            portrait: this.state.isPortrait,
                            fullscreen: Screenfull.isFullscreen
                        })}
                    >
                        <p>{PORTRAIT_TEXT}</p>
                    </div>
                    <iframe
                        ref="gameRef"
                        className={ClassNames('game-frame', {
                            portrait: this.state.isPortrait
                        })}
                        src={this.props.url}
                        allowTransparency="true"
                    />
                </div>
                <Button
                    onClick={this.makeFullScreen}
                    className={ClassNames('purple', 'standard', 'full-screen-btn', {
                        hidden: this.state.isPortrait
                    })}
                >
                    <Glyphicon glyph="fullscreen" /> {FULLSCREEN}
                </Button>
                <Button
                    className={ClassNames('standard',
                        {'purple': !this.state.demo},
                        {'green': this.state.demo},
                        {hidden: !this.props.isTeacher}
                    )}
                    onClick={() => this.dispatchPlatformEvent('toggle-demo-mode')}
                >
                    {DEMO_MODE}
                </Button>
            </div>
        );
    }
});

export default Game;

