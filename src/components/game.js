import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import {Button, Glyphicon} from 'react-bootstrap';

import 'components/game.scss';

const EVENT_PREFIX = '_e_';

/**
 * Game wrapper iframe component.
 * Has two default events - onFlipEarned and onSave
 * provides data-state and data-uuid to iframe via attributes
 * additional arbitrary events can be added by adding additional
 * props prefixed with 'on'. Should the game issue events with
 * these names, any provided callbacks will fire.
 * event names are formatted as gameUuid-eventName, so for example
 * the onSave function will fire when 00e79c5a-9ad6-11e5-ae02-acbc32a6b1bb-save
 * is issued to window from with the iframe with:
 * ```
 * var uuid = window.frameElement.getAttribute('data-uuid');
 * var event = new Event(uuid + '-save');
 * parent.window.dispatchEvent(event)
 * ```
 * likewise, game state can be read with:
 * ```
 * var data = window.frameElement.getAttribute('data-uuid');
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
            gameState: {}
        };
    },
    componentDidMount: function () {
        if (this.props.uuid != null) {
            this.setEvents();
        }
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.uuid !== this.props.uuid) {
            this.clearEvents();
            this.setEvents();
        }
    },
    componentWillUnmount: function () {
        this.clearEvents();
    },
    /**
     * default events. These will always fire regardless of whether or not
     * there is an event defined in addition to the submission behavior
     */
    [EVENT_PREFIX + 'flipEarned']: function () {
    },
    [EVENT_PREFIX + 'save']: function () {
    },
    [EVENT_PREFIX + 'init']: function (e) {
        e.detail.init(this.props.gameState);
    },
   /** end of default events */
    gameEventHandler: function (e) {
        if (e.detail.type != null) {
            if (_.isFunction(this[EVENT_PREFIX + e.detail.type])) {
                this[EVENT_PREFIX + e.detail.type](...arguments);
            }
            if(_.isFunction(this.props['on' + e.detail.type])) {
                this.props['on' + e.detail.type](...arguments);
            }
        }
    },
    setEvent: function () {
        ReactDOM.findDOMNode(this.refs.gameRef).addEventListener('gameEvent', this.gameEventHandler);
    },
    clearEvent: function () {
        ReactDOM.findDOMNode(this.refs.gameRef).removeEventListener('gameEvent', this.gameEventHandler);
    },
    makeFullScreen: function () {
        ReactDOM.findDOMNode(this.refs.gameRef).webkitRequestFullScreen();
    },
    render: function () {
        if (this.props.uuid == null) {
            return null;
        }
        return (
            <div className="game">
                <iframe ref="gameRef" src={'http://www.bing.com/search?q=' + this.props.uuid} />
                <Button onClick={this.makeFullScreen}><Glyphicon glyph="fullscreen" /> Full Screen</Button>
            </div>
        );
    }
});

export default Game;
