"use strict";
var tools = require('flax/tools');


class EntityController extends tools.StatefulEventEmitter {
	constructor(entityClass, pLayer) {
		super();
		this.pLayer = pLayer;
		this.entityClass = entityClass;
		this.entities = [];
	}

	load() {
		var query = this.pLayer.search(), self = this;
		query.on('recordIn', function(record) {
			var entity = new this.entityClass(record.id);
			entity.setData(record.data);
			entity.pLayer = this.pLayer;
			this.entities.push(entity);
		});
		query.on('end', function(end) {
			self.emit('loaded');
		});
	}
	create() {
		return new this.entityClass;
	}
	/**
	 * returns query
	 * @param criteria
	 * @returns {*|Number}
	 */
	search(criteria) {
		return this.pLayer.search(criteria);
	}

}
/**
 * entity class
 * composed of id, data, and static prop "props" defining the data schema.
 *
 *
 */


class Entity extends tools.StatefulEventEmitter {
	constructor(id) {
		this.data = {};
		this.id = id;
		this.stateOnEvent('loaded', 'loaded');
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
		this.pLayer.onState('loaded', function() {
			var query = this.pLayer.get(this.id), self = this;

			query.on('response', function(data) {
				self.data = data;
				self.emit('loaded');
			});

		})

	}
	save() {
		var query = this.pLayer.set(this.id, this.data), self = this;

		query.on('response', function() {
			self.emit('saved');
		});
		return query;
	}
	setupPersistantLayer(pLayer) {
		this.pLayer = pLayer;
	}
}



exports.EntityController = EntityController;
exports.Entity = Entity;