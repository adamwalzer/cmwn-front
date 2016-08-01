import React from 'react';
import ReactDOM from 'react-dom';
import Screenfull from 'screenfull';
import ClassNames from 'classnames';
import _ from 'lodash';
import {Button, Glyphicon} from 'react-bootstrap';

import GLOBALS from 'components/globals';
import HttpManager from 'components/http_manager';
import Toast from 'components/toast';
import Log from 'components/log';
import Detector from 'components/browser_detector';

import 'components/game.scss';

const EVENT_PREFIX = '_e_';

const FULLSCREEN = 'Full Screen';
const DEMO_MODE = 'Demo Mode';

const BAD_FLIP = 'There was a problem registering your earned flip. Please try again in a little while';
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
    },
    componentDidMount: function () {
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        var callApi = _.debounce(function () {
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
    componentWillUnmount: function () {
        this.clearEvent();
    },
    submitFlip: function (flip) {
        if (!this.props.flipUrl) {
            return;
        }
        HttpManager.POST({url: this.props.flipUrl}, {'flip_id': flip}).catch(err => {
            Toast.error(BAD_FLIP);
            Log.log('Server refused flip update', err, flip);
        });
    },
    /*
     * default events. These will always fire regardless of whether or not
     * there is an event defined in addition to the submission behavior
     */
    [EVENT_PREFIX + 'Flipped']: function (e) {
        var flipId = e.gameData.id || e.gameData.game || e.gameData.flip;
        // TODO MPR 7/14/16: .game and .flip can be removed once all games are in React
        this.setState({flipId});
        this.submitFlip(flipId);
        ('set', 'dimension5', flipId);
    },
    [EVENT_PREFIX + 'Flip']: function (e) {
        var flipId = e.gameData.id || e.gameData.game || e.gameData.flip;
        this.setState({flipId});
        this.submitFlip(flipId);
        ('set', 'dimension5', flipId);
    },
    [EVENT_PREFIX + 'Save']: function (e) {
        var version = 1;
        if (this.props.saveUrl == null) {
            Log.error('Something went wrong. No game save url was provided. Game data will not be saved');
            return;
        }
        version = e.gameData.version || version;
        ('set', 'metric1', e.gameData.currentScreenIndex);
        HttpManager.POST(this.props.saveUrl.replace('{game_id}', e.gameData.game),
            {data: e.gameData, version});
    },
    [EVENT_PREFIX + 'Exit']: function () {
        this.setState({fullscreenFallback: false});
    },
    [EVENT_PREFIX + 'Init']: function (e) {
        e.respond(this.props.gameState);
        ('set', 'dimension4', e.gameData.id || e.gameData.game || e.gameData.flip);
    },
    /* end of default events */
    gameEventHandler: function (e) {
        if (e.name != null) {
            if (_.isFunction(this[EVENT_PREFIX + _.capitalize(e.name)])) {
                this[EVENT_PREFIX + _.capitalize(e.name)](...arguments);
            }
            if (_.isFunction(this.props['on' + _.capitalize(e.name)])) {
                this.props['on' + _.capitalize(e.name)](...arguments);
            }
        }
    },
    setEvent: function () {
        window.addEventListener('game-event', this.gameEventHandler);
        window.addEventListener('platform-event', this.gameEventHandler);
        window.addEventListener('keydown', this.listenForEsc);
        window.addEventListener('resize', this.checkForPortrait);
    },
    clearEvent: function () {
        window.removeEventListener('game-event', this.gameEventHandler);
        window.removeEventListener('keydown', this.listenForEsc);
    },
    listenForEsc: function (e) {
        var self = this;
        if (e.keyCode === 27 || e.charCode === 27) {
            self.setState({fullscreenFallback: false});
            Screenfull.exit();
        }
    },
    dispatchPlatformEvent(name, data) {
        /** TODO: MPR, 1/15/16: Polyfill event */
        var event = new Event('platform-event', {bubbles: true, cancelable: false});
        this.toggleDemoButton();
        _.defaults(event, {type: 'platform-event', name, data});
        ReactDOM.findDOMNode(this.refs.gameRef).contentWindow.dispatchEvent(event);
    },
    makeFullScreen: function () {
        var self = this;
        if (Screenfull.enabled) {
            if (!this.state.isPortrait) {
                Screenfull.request(ReactDOM.findDOMNode(self.refs.gameRef));
            } else {
                Screenfull.request(ReactDOM.findDOMNode(self.refs.overlay));
            }
        } else {
            self.setState({fullscreenFallback: true});
        }
    },
    checkForPortrait: function () {
        if (Detector.isMobileOrTablet() && Detector.isPortrait()) {
            this.setState({
                isPortrait: true
            });
        } else {
             this.setState({
                isPortrait: false
            });
        }
    },
    toggleDemoButton: function () {
        if (this.state.demo){
            this.setState({demo: false});
        } else {
            this.setState({demo: true});
        }
    },
    render: function () {
        if (this.props.url == null) {
            return null;
        }
        return (
            <div ref="wrapRef" className={ClassNames(
                'game', {'fullscreen': this.state.fullscreenFallback}
            )}>
                <div ref="overlay" className={ClassNames('overlay', {'portrait': this.state.isPortrait})}>
                    {PORTRAIT_TEXT}
                </div>
                <iframe ref="gameRef" src={this.props.url} allowtransparency="true"
                    className={ClassNames({'portrait': this.state.isPortrait})}/>
                <Button className="purple standard full-screen-btn" onClick={this.makeFullScreen}>
                    <Glyphicon glyph="fullscreen" /> {FULLSCREEN}
                </Button>
                <Button className={ClassNames('standard',
                        {'purple': !this.state.demo},
                        {'green': this.state.demo},
                        {hidden: !this.props.isTeacher}
                    )}
                    onClick={() => this.dispatchPlatformEvent('toggle-demo-mode')}>{DEMO_MODE}
                </Button>
            </div>
        );
    }
});

export default Game;

