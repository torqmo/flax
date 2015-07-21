"use strict";
var events = require("events");

class Server extends events.EventEmitter  {
	constructor() {
		super();
		this.routes = {};
	}

	/**
	 *
	 * @param conf - requires properties : route, domain , fn
	 */
	addMatchRoute(conf) {
		if (!this.routes.hasOwnProperty(conf.domain)) {
			this.routes[conf.domain] = {routes: {}};
		}
		conf.type = 'function';
		conf.context = conf.context || this;
		this.routes[conf.domain].matchRoutes[conf.route] = conf;
	}
	/**
	 *
	 * @param conf - requires properties : route, domain , fn
	 */
	addExactRoute(conf) {
		if (!this.routes.hasOwnProperty(conf.domain)) {
			this.routes[conf.domain] = {exactRoutes: {},matchRoutes:{}};
		}
		conf.context = conf.context || this;
		this.routes[conf.domain].exactRoutes[conf.route] = conf;
	}
	/**
	 *
	 * @param conf - requires properties : route, domain , path
	 */
	mapRouteDir(conf) {
		if (!this.routes.hasOwnProperty(conf.domain)) {
			this.routes[conf.domain] = {exactRoutes: {},matchRoutes:{}};
		}
		conf.type = 'directory';
		this.routes[conf.domain].matchRoutes[conf.route] = conf;
	}
	setDomainDefaultRoute(conf) {
		if (!this.routes.hasOwnProperty(conf.domain)) {
			this.routes[conf.domain] = {exactRoutes: {},matchRoutes:{}};
		}
		conf.context = conf.context || this;

		this.routes[conf.domain].defaultRoute = conf;

	}

	defaultRoute(req, res) {
		res.textOut('resource not found', 404);
	}

	initServer() {
		var srvContrainer = this;

		this.server = require('http').createServer(function (req, res) {
			var respWrapper = new ResponseWrapper(res);
			var reqWrapper = new RequestWrapper(req);
			var domain = reqWrapper.getDomain();
			if (srvContrainer.routes.hasOwnProperty(domain)) {
				var exactRoutes = srvContrainer.routes[domain].exactRoutes;
				var matchRoutes = srvContrainer.routes[domain].matchRoutes;
				var path = reqWrapper.getPath();
				if(exactRoutes.hasOwnProperty(path)) {
					switch(exactRoutes[path].type) {
						case 'function':
							return exactRoutes[path].fn.apply(exactRoutes[path].context, [reqWrapper, respWrapper]);
							break;
					}
				}
				for (var route in matchRoutes) {
					var reg = '^' + route;

					if (path.match(new RegExp(reg))) {
						switch(matchRoutes[route].type) {
							case 'function':
								return matchRoutes[route].fn.apply(matchRoutes[route].context, [reqWrapper, respWrapper]);
								break;
							case 'directory':
								var filepath = matchRoutes[route].path + reqWrapper.parsedQuery.href.substr(route.length);
								console.log(reqWrapper.parsedQuery.href);
								require('fs').readFile(filepath, {}, function (err, content) {
									if(!err) {
										console.log()
										respWrapper.textOut(content, 200, reqWrapper.getMime());
									} else {
										respWrapper.textOut('resource not found', 404);
									}
								});
								return;
								break;
							default:
								throw "unknown route type: " +routes[route].type;
						}
					}
				}
				if (srvContrainer.routes[domain].hasOwnProperty('defaultRoute')) {
					return srvContrainer.routes[domain].defaultRoute.apply(srvContrainer, [reqWrapper, respWrapper]);
				}
			}
			srvContrainer.defaultRoute.apply(srvContrainer, [reqWrapper, respWrapper]);

		});
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