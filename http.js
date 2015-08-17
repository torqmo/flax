"use strict";
var core = require("flax/core");

class Server extends events.EventEmitter  {
	constructor() {
		super();
		this.domainRoutes = {};
		this.globalRoutes = {matchRoutes: {}, exactRoutes: {}};
		this.addExactRoute({
			route: '/showRoutes',
			fn : function(req, res) {
				res.textOut('<pre>' + JSON.stringify({domainRoutes : this.domainRoutes, global : this.globalRoutes}, null,4) + '</pre>');
			}
		});
	}
	setupClient(domain, route) {
		route = route || '/client';
		this.mapDirectory(core.path + '/client', route, domain);
	}

	/**
	 *
	 * @param conf - requires properties : route, domain , fn
	 */
	addMatchRoute(conf) {
		conf.type =conf.type || 'function';
		if(conf.hasOwnProperty('domain')) {
			var routes = this._getDomainRoutes(conf.domain);

		} else {
			var routes = this.globalRoutes;
		}
		routes.matchRoutes[conf.route] = conf;
	}
	/**
	 *
	 * @param conf - requires properties : route, domain , fn
	 */
	addExactRoute(conf) {
		conf.type =conf.type || 'function';
		if(conf.hasOwnProperty('domain')) {
			var routes = this._getDomainRoutes(conf.domain);

		} else {
			var routes = this.globalRoutes;
		}
		routes.exactRoutes[conf.route] = conf;
	}
	/**
	 *
	 * @param conf - requires properties : route, domain , fn
	 */
	addDefaultRoute(conf) {
		if(conf.hasOwnProperty('domain')) {
			var routes = this._getDomainRoutes(conf.domain);

		} else {
			var routes = this.globalRoutes;
		}
		routes.default = conf.fn;
	}
	mapDirectory(path, route, domain) {
		var conf = {path : path, route: route, type: 'path' };
		if(domain) {
			conf.domain = domain;
		}
		this.addMatchRoute(conf);
	}
	mapFile(path, route, domain) {
		var conf = {path : path, route: route, type: 'path' };
		if(domain) {
			conf.domain = domain;
		}
		this.addExactRoute(conf);
	}
	/**
	 * initializes if not initialized already and returns
	 * @param domain
	 * @returns object
	 * @private
	 */
	_getDomainRoutes(domain) {
		if (!this.domainRoutes.hasOwnProperty(domain)) {
			this.domainRoutes[domain] = {matchRoutes: {}, exactRoutes: {}};
		}
		return this.domainRoutes[domain];
	}





	initServer() {
		var srvContrainer = this;

		this.server = require('http').createServer(function (req, res) {
			var respWrapper = new ResponseWrapper(res);
			var reqWrapper = new RequestWrapper(req);
			var domain = reqWrapper.getDomain();
			if (srvContrainer.domainRoutes.hasOwnProperty(domain)) {
				if(false !== srvContrainer._handleRoutes(srvContrainer.domainRoutes[domain], reqWrapper, respWrapper)) {
					return;
				}
			}
			if(false !== srvContrainer._handleRoutes(srvContrainer.globalRoutes, reqWrapper, respWrapper)) {
				return;
			}
		});
	}
	_handleRoutes(routes, req, res) {
		var path = req.getPath();
		if(routes.exactRoutes.hasOwnProperty(path)) {
			var routeConf = routes.exactRoutes[path];
			var context = routeConf.context || this;
			switch(routeConf.type) {
				case 'function':
					routeConf.fn.apply(context, [req, res]);
					break;
				case 'path':
					var filepath = routeConf.path;
					require('fs').readFile(filepath, {}, function (err, content) {
						if(!err) {
							res.textOut(content, 200, req.getMime());
						} else {
							res.textOut('resource not found', 404);
						}
					});
					break;
				default:
					throw "unknown route type: " +routeConf.type;
			}
			return true;
		}
		for (var route in routes.matchRoutes) {
			var reg = '^' + route;

			if (path.match(new RegExp(reg))) {
				var routeConf = routes.matchRoutes[route];
				var context = routeConf.context || this;
				switch(routes.matchRoutes[route].type) {
					case 'function':
						routeConf.fn.apply(context, [req, res]);
						break;
					case 'path':
						var filepath = routeConf.path + req.parsedQuery.href.substr(route.length);
						require('fs').readFile(filepath, {}, function (err, content) {
							if(!err) {
								res.textOut(content, 200, req.getMime());
							} else {
								res.textOut('resource not found', 404);
							}
						});

						break;
					default:
						throw "unknown route type: " +routeConf.type;
				}
				return true;
			}
		}
		if (routes.hasOwnProperty('default')) {
			routes.default.apply(this, [req, res]);
			return true;
		}
		return false;
	}
	listen(port) {
		this.server.listen(port);
	}
}
class ResponseWrapper extends events.EventEmitter {
	constructor(res) {
		super();
		this.res = res;
	}

	textOut(text, code , mime) {
		mime = mime || 'text/html';
		code = code || 200;
		this.res.writeHead(code, {
			'Content-Type': mime
		});
		this.res.end(text);
	}
}
class RequestWrapper extends events.EventEmitter {
	constructor(req) {
		super();
		this.req = req;
		this.domain = this.req.headers.host.split(':')[0];
		this.parsedQuery = require('url').parse(this.req.url);
	}

	getDomain() {
		return this.domain;
	}
	getPath() {
		return this.parsedQuery.pathname;
	}
	getMime() {
		var ext = this.parsedQuery.href.split('.').pop().toLowerCase();
		var mime = 'text/html';
		switch(ext) {
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'gif':
			case 'giff':
			case 'tiff':
				mime = 'image/' + ext;
				break;
			case 'svg':
				mime = 'image/svg+xml';
				break;
			case 'js':
				mime = 'application/javascript';
				break;
			case 'css':
				mime = 'text/css';
				break;
		}
		return mime;
	}
}
exports.Server = Server;