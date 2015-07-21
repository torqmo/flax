"use strict";

var tools = require('flax/tools');
/**
 * Emits: ready
 * general abstraction for a storage for entities
 */

class entityControllerInterface {
	/**
	 * emits state: ready
	 */
	constructor() {

	}
	/**
	 * @param id
	 * @return query <emits:ready>
	 */
	get(id) {}


	/**
	 * @param id
	 * @return query <emits:ready>
	 */
	save(id, data) {}


	/**
	 *
	 * @param criteria
	 * @return query <emits:recordIn>
	 */
	search(criteria) {}
}



/**
 * Emits : recordIn, recordIn , failed
 */
class Query extends tools.StatefulEventEmitter {
	feedRecord(record) {
		this.emit('recordIn', record)
	}
}
exports.getEntityController  = function(conf, confName) {
	// this the persistency layer general conf
	var controllerConf = conf.controllers[confName].config;
	// this the referenced store reusable config
	var storeConf = conf.stores[conf.controllers[confName].store];


	switch(storeConf.type) {
		case 'aerospike':
			var lib = require('flax/persistency/aerospike');
			break;
		case 'mongo':
			var lib = require('flax/persistency/mongo');
			break;
		default :
			throw "Unknown client db library: " + storeConf.type;
	}
	return new lib.EntityController(storeConf.clientConfig, controllerConf);

}
exports.Query = Query;