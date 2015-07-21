"use strict";
var events = require('events');
class StatefulEventEmitter extends events.EventEmitter {
	constructor() {
		super();
		this.states = {};
		this.stateListeners = {};
	}

	/**
	 * change object's state 'state' to value 'flag'(by default "on") on event 'event'
	 * @param string state
	 * @param string event
	 * @param string flag
	 */
	stateOnEvent(state, event, flag) {
		if(flag===undefined) flag = 'on';
		var self = this;
		this.on(event, function() {
			self.states[state] = flag;
			var stateChangeKey = state  + '!!' + flag;
			if(self.stateListeners.hasOwnProperty(stateChangeKey)) {
				for(var i = 0; i < self.stateListeners[stateChangeKey].length; i++) {
					self.stateListeners[stateChangeKey][i].apply(self, arguments);
				}
			}
		})
	}
	/**
	 * if state 'state' == 'flag' execute 'fn', otherwise register to run 'fn' when state 'state' changes to value 'flag'
	 * @param string state
	 * @param string flag <optional>
	 * @param function fn
	 */
	onState(state, flag, fn) {
		if(undefined === fn) {
			fn = flag;
			flag = 'on';
		}
		if(this.states.hasOwnProperty(state) && this.states[state] == flag) {
			fn.apply(this);
		} else {
			var stateChangeKey = state + '!!' + flag;
			if (!this.stateListeners.hasOwnProperty(stateChangeKey)) {
				this.stateListeners[stateChangeKey] = [];
			}
			this.stateListeners[stateChangeKey].push(fn);
		}
	}
}

exports.StatefulEventEmitter = StatefulEventEmitter;