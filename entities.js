"use strict";
var core = require('flax/core');


class EntityController extends core.StatefulEventEmitter {
	constructor(name, pLayer, entityClass) {
		super();
		this.pLayer = pLayer;
		this.entityClass = entityClass;
		this.entities = {};
	}

	load() {
		var self = this;
		this.pLayer.onState('ready', function() {
			var query = this.search();
			query.on('recordIn', function(record) {
				var entity = self.factory(record.id, record.data);
				self.entities[entity.id] = entity;
			});
			query.on('end', function(end) {
				self.emit('loaded');
			});
		});
	}

	/**
	 *
	 * @param id
	 * @param data
	 * @returns object<this.Entity>
	 */
	factory(id, data) {
		var entity = new this.entityClass(id);
		if(data) {
			entity.setData(data);
		}
		entity.setupPersistantLayer(this.pLayer);
		return entity;
	}
	/**
	 * returns query
	 * @param criteria
	 * @returns {*|Number}
	 */
	search(criteria) {
		return this.pLayer.search(criteria);
	}
	each(fn) {
		for(var id in this.entities.length) {
			fn.apply(this, [this.entities[id]]);
		}
	}

	/**
	 *
	 * @param server
	 * @param domain
	 */
	registerControls(server, domain) {
		var ctrl = this;
		server.addExactRoute({domain:domain, route:'save', fn: function(req, res) {
			var id = req.getParam('id');
			if(!ctrl.entities.hasOwnProperty(id)) {
				res.error('could not find entity ' + id);
			}

			var entity = ctrl.entities[id], data = req.getParam('data');
			entity.setData(data);
			entity.save();
		}});
		server.addExactRoute({domain:domain, route:'get', fn: function(req, res) {
			var id = req.getParam('id');
			if(!ctrl.entities.hasOwnProperty(id)) {
				res.error('could not find entity ' + id);
			}

			var entity = ctrl.entities[id], data = req.getParam('data');
			entity.setData(data);
			entity.save();
		}});
	}

}
/**
 * entity class
 * composed of id, data, and static prop "props" defining the data schema.
 *
 */


class Entity extends core.StatefulEventEmitter {
	constructor(id) {
		super();
		this.data = {};
		this.id = id;
	}
	getProps()
	{
		return this.constructor.props;
	}
	getProp(prop) {
		var props = this.getProps();
		if(!props.hasOwnProperty(prop)) {
			return null;
		}
		return this.props[prop];

	}
	load() {
		var self = this;
		this.pLayer.onState('ready', function() {
			var query = self.pLayer.get(self.id);
			query.on('response', function(data) {
				self.data = data;
				self.emit('loaded');
			});
		});

	}
	setData(data) {
		this.data = data;
	}
	save() {
		var self = this;
		this.pLayer.onState('ready', function() {
			var query = self.pLayer.save(self.id, self.data);
			query.on('response', function () {
				self.emit('saved');
			});
		});
	}

	/**
	 *
	 * @param pLayer
	 */
	setupPersistantLayer(pLayer) {
		this.pLayer = pLayer;
	}

}



exports.EntityController = EntityController;
exports.Entity = Entity;