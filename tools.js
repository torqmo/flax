"use strict";
var events = require('events');
class StatefulEventEmitter extends events.EventEmitter {
	constructor() {
		super();
		this.states = {};
	}

	/**
	 * override default implmentation -- set event state to true
	 * @param ev
	 */
	emit(ev) {
		this.states[ev] = true;
		events.EventEmitter.prototype.emit.apply(this, arguments);
	}

	/**
	 * if event already fired then run fn now, else register it to event
	 *
	 * @param event
	 * @param fn
	 */
	onState(event, fn) {

		if(this.states.hasOwnProperty(event)) {
			fn.apply(this);
		} else {
			this.on(event, fn);
		}
	}
}

exports.StatefulEventEmitter = StatefulEventEmitter;