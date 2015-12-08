import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import {Button} from 'react-bootstrap';

import 'components/game.scss';

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
 * var event = new Event(uuid + '-save);
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
    componentWillMount: function () {
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
    flipEarned: function () {
    },
    save: function () {
    },
   /** end of default events */
    setEvents: function () {
        var callback = function (eventName, prop) {
            if (_.isFunction(this[eventName])) { //there is no possible way this could ever go wrong
                this[eventName](...arguments);
            }
            prop(...arguments);
        };
        _.each(this.props, (prop, key) => {
            var eventName, eventCallback;
            if (key.indexOf('on') === 0 && _.isFunction(prop)) {
                eventName = `${this.props.uuid}-${_.camelCase(key.slice(2))}`;
                eventCallback = callback.bind(this, eventName, prop);
                window.addEventListener(eventName, eventCallback);
                this.registeredEvents = this.registeredEvents || {};
                this.registeredEvents[eventName] = eventCallback;
            }
        });
    },
    clearEvents: function () {
        _.each(this.registeredEvents, (prop, key) => window.removeEventListener(key, prop));
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
                <iframe ref="gameRef" src={'http://www.bing.com/search?q=' + this.props.id} data-state={this.props.gameState} data-uuid={this.props.uuid} />
                <Button onClick={this.makeFullScreen}>Full Screen</Button>
            </div>
        );
    }
});

export default Game;
