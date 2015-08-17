"use strict";

var mongodb = require('mongodb');
var core = require('flax/core');
var persistency = require('flax/persistency');

class EntityPersistLayer extends core.StatefulEventEmitter {
	/**
	 * storeConf
	 * =========
	 * single host configuration : {type: 'server', host : <addr>, port: <port>}
	 * or
	 * replica set configuration : {type: 'replicaSet', hosts : <array: {host: <addr>, port: <port>} >
	 *
	 *
	 * controllerConf
	 * ==============
	 * {db: <string:dbName>, collection: <string:collectionName>}
	 *
	 * @param storeConf
	 * @param controllerConf
	 */
	constructor(storeConf , controllerConf) {
		super();
		var cluster, self = this;
		switch(storeConf.type) {
			case 'replicaSet':
				var servers = [];
				for(var i = 0;i < storeConf.hosts.length;i++ ) {
					servers.push(new mongodb.Server(storeConf.hosts[i].host, storeConf.hosts[i].port));
				}
				cluster = new mongodb.ReplSet(servers);
				break;
			case 'server':
				cluster = new mongodb.Server(storeConf.host, storeConf.port);
				break;
			default:

				break;
		}
		this.db = new mongodb.Db(controllerConf.db, cluster);

		this.db.open(function(err, db) {
			// Perform a read
			self.collection = self.db.collection(controllerConf.collection);
			self.emit('ready');
		});

	}

	/**
	 *
	 * @param id
	 * @returns Query
	 */
	get(id) {
		var query = persistency.Query, self = this;
		this.onState('ready', function() {
			self.collection.findOne({_id: id}, function (err, data) {
				query.emit('response', data);
			});
		});
		return query;
	}

	/**
	 *
	 * @param id
	 * @param data
	 * @returns Query
	 */
	save(id, data) {
		var query = new persistency.Query(), self = this;
		this.onState('ready', function() {
			self.collection.save({_id: id, data: data}, function(data) {
				query.emit('response', data);
			});
		});
		return query;
	}

	/**
	 *
	 * @param criteria
	 * @param selection
	 * @returns Query
	 */
	search(criteria, selection) {
		var search = {}
		var criteria = criteria || [];
		for(var i = 0; i < criteria.length; i++ ) {
			switch(criteria[i].type) {
				case 'range':
					search[criteria[i].field] = {$and: [{$gt: criteria[i].start},{$lt: criteria[i].end}]};
					break;
				case 'eq':
					search[criteria[i].field] = criteria[i].value;
					break;
				case 'gt':
				case 'gte':
				case 'lte':
				case 'lt':
					search[criteria[i].field] = {};
					search[criteria[i].field]['$' + criteria[i].type] = criteria[i].value;
				break;
				default:
					throw "unimplemented filter type " +  criteria[i].type
			}

		}
		var options = {}

		if(selection) {
			var project = {}
			for(var i = 0; i< selection.length;i++) {
				project[selection[i]] = true;
			}
			options.fields = project;
		}
		var query = new persistency.Query, self = this;
		this.onState('ready', function() {
			var stream = self.collection.find(search, options).stream();
			stream.on('data', function (data) {
				query.feedRecord(data);
			});
			stream.on('end', function (data) {
				query.emit('end', data);
			});
		});
		return query;
	}
}
exports.EntityPersistLayer = EntityPersistLayer;