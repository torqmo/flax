"use strict";

var mongodb = require('mongodb');
var events = require('events');
var persistency = require('flax/persistency');

class EntityController extends events.EventEmitter {

	constructor(storeConf , controllerConf) {
		super();
		var cluster;
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
			est.equal(null, err);
			// Perform a read
			self.collection = db.collection(controllerConf.collection);
			self.emit('ready');
		});

	}
	get(id) {
		var query = persistency.Query;
		this.collection.findOne({_id: id}, function(err,data) {
			query.emit('response', data);
		});
		return query;
	}
	save(id, data) {
		var query = persistency.Query;
		this.collection.save({_id: id}, data, function(data) {
			query.emit('response', data);
		});
		return query;
	}
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
		var query = new persistency.Query;

		var stream = this.collection.find(search, options).stream();
		stream.on('data', function(data) {
			query.emit('recordIn', data);
		});
		return query;
	}
}
exports.EntityController = EntityController;