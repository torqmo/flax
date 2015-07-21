"use strict";

var aerospike = require('aerospike');
var persistency = require('flax/persistency');

class EntityController {

	constructor(storeConf , controllerConf) {
		this.client = aerospike.client(storeConf);
		this.client.connect(function (response) {
			if ( response.code !== 0) {
				throw "could not connect to aerospike";
			}
		})
		this.ctrlConf = controllerConf;
	}
	get(id) {
		var query = new persistency.Query;
		var key = aerospike.key(this.ctrlConf.ns, this.ctrlConf.set, id);
		this.client.get(key, function(err, record, metadata, key) {
			switch (err.code) {
				case status.AEROSPIKE_OK:
					query.emit('response', record, metadata);
					break;
				case status.AEROSPIKE_ERR_RECORD_NOT_FOUND:
					query.emit('notFound');
					break;
				default:
					query.emit('error', err);
			}

		});
		return query;
	}
	save(id, data) {
		var key = aerospike.key(this.ctrlConf.ns, this.ctrlConf.set, id);
		var query = new persistency.Query;
		this.client.put(key, data, function(err) {
			if ( err.code !== aerospike.status.AEROSPIKE_OK ) {
				query.emit("error",  "error: "+ err.message);
			}
		});
	}
	search(criteria, selection) {
		var statement = {
			concurrent: true,
			nobins: false,
		};
		criteria = criteria || [];
		var filters = [];
		for(var i = 0; i < criteria.length; i++ ) {
			switch(criteria[i].type) {
				case 'range':
					filters.push(aerospike.filter.range(criteria[i].field, criteria[i].start, criteria[i].end) );
					break;
				case 'eq':
					filters.push(aerospike.filter.range(criteria[i].field, criteria[i].value) );
					break;
				default:
					throw "unimplemented filter type " +  criteria[i].type
			}

		}
		if(filters.length >0) {
			statement.filters = filters;
		}
		if(selection) {
			statement.select = selection;
		}
		var scan = this.client.query(this.ctrlConf.ns, this.ctrlConf.set, statement);
		var stream = scan.select();
		var query = new persistency.Query;

		stream.on('data', function(record) {
			query.emit('recordIn', record);
		});
		stream.on('error', function(error) {
			query.emit('error', error);
		});
		stream.on('end', function(end){
			query.emit('end', end);
		});
		return query;
	}
}
exports.EntityController = EntityController;