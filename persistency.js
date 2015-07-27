"use strict";

var tools = require('flax/tools');


/**
 * Emits: ready
 * general abstraction for a storage for entities


interface EntityPersistLayer {
	/**
	 * emits state: ready
	 *
	constructor() {

	}
	/**
	 * @param id
	 * @return query <emits:ready>
	 *
	get(id) {}


	/**
	 * @param id
	 * @return query <emits:ready>
	 *
	save(id, data) {}


	/**
	 *
	 * @param criteria
	 * @return query <emits:recordIn>
	 *
	search(criteria) {}
}

*/

/**
 * Emits : recordIn, recordIn , failed
 */
class Query extends tools.StatefulEventEmitter {
	feedRecord(record) {
		this.emit('recordIn', record)
	}
}


/**
 * configuration of stores and controllers
 *
 * goes like this :
 * stores contain information of connection to a database instance or cluster - the physical layer
 * controller contains a reference to a store + additional information like database table or a namespace
 */
class PersistConfig {
	constructor() {
		this.stores = {};
		this.controllers = {};
	}
	setStore(store, conf) {
		this.stores[store] = conf;
	}
	setStores(stores) {
		for(var store in stores) {
			this.setStore(store, stores[store]);
		}
	}
	setController(controller, conf) {
		this.controllers[controller] = conf;
	}
	setControllers(controllers) {
		for(var controller in controllers) {
			this.setController(controller, controllers[controller]);
		}
	}
	getController(ctrl) {
		return this.controllers[ctrl];
	}
	getStore(store) {
		return this.stores[store];
	}
}

class Factory {
	constructor() {
		this.cache = {};
		this.config = new PersistConfig();
	}
	getByController(ctrlName) {
		if(this.cache.hasOwnProperty(ctrlName)) {
			return this.cache[ctrlName];
		}
		var ctrlConf = this.config.getController(ctrlName);
		var storeConf = this.config.getStore(ctrlConf.store);
		switch (storeConf.type) {
			case 'aerospike':
				var lib = require('flax/persistency/aerospike');
				break;
			case 'mongo':
				var lib = require('flax/persistency/mongo');
				break;
			default :
				throw "Unknown client db library: " + storeConf.type;
		}
		var pLayer =  new lib.EntityPersistLayer(storeConf.conf, ctrlConf.conf);
		this.cache[ctrlName] = pLayer;
		return pLayer;
	}
}


exports.Query = Query;
exports.factory =  new Factory;
