(function(window) {
	"use strict";
	Function.prototype.inheritsFrom = function( parentClassOrObject ){
		if(!this.prototype.hasOwnProperty('parents')) {
			this.prototype.parents = {}
		}

		if ( parentClassOrObject.constructor == Function )
		{
			//Normal Inheritance
			for(var prop in parentClassOrObject.prototype) {
				if(prop != 'constructor') {
					this.prototype[prop] = parentClassOrObject.prototype[prop];
				}
			}

			this.prototype.parents[parentClassOrObject.prototype.constructor.name] = parentClassOrObject.prototype;

		} else {
			//Pure Virtual Inheritance
			for(var prop in parentClassOrObject) {
				if(prop != 'constructor') {
					this.prototype[prop] = parentClassOrObject[prop];
				}
			}

			this.prototype.parents[parentClassOrObject.constructor.name] = parentClassOrObject.prototype;

		}
		return this;
	};
	Object.prototype.inherits = function(cls) {
		return (this.constructor.prototype.hasOwnProperty('parents') && this.constructor.prototype.parents.hasOwnProperty(cls));

	}
	/**
	 * main object
	 */
	function pew() {
		this.modules = {};
		this.evalScriptPath();
	};


	/**
	 * get the pew lib script relative path, later on use it to try to load assets
	 */

	pew.prototype.evalScriptPath = function() {
		var scripts = document.getElementsByTagName('script');
		var scriptURI = scripts[scripts.length - 1].src;
		var uriParseParts;
		if(uriParseParts = scriptURI.match(/(http[s]?:\/\/)([^\/]*)(\/.*\/)/i)) {
			return uriParseParts[3];
		}
		return null;
	};


		/**
	 * loades a module, returns either the module or an eventable object that emits 'loaded'
	 * @param module <string | object:inherits:pew.module | class:inherits:pew.module>
	 */

	pew.prototype.loadModule = function(module) {
		// if string load it from file
		if(typeof module == 'string') {
			var scriptname = module + '.js';

			var loader = this.loadScript(scriptname);
			var self = this;
			loader.on('loaded', function() {
				self.loadModule(eval(module));
			});

			return loader;
		}
		// if not string load it from
		if(typeof module == 'function') {
			var moduleObjct = new module(this);
		} else {
			moduleObjct = module;
		}
		if(typeof moduleObjct != 'object') {
			throw new Error('whyOhWhy Exception, trying to load module which is not an object but of type ' + typeof moduleObjct);
		}
		if(!moduleObjct.inherits('module') ) {
			throw new Error('whyOhWhy Exception, trying to load module which does not inherit from module but from ' + Object.keys(moduleObjct.parents).join(', ') );
		}
		var name = moduleObjct.getName();
		if(this.modules.hasOwnProperty(name) )  {
			throw new Error('whyOhWhy Exception, trying to load module ' + name + ' while all ready loaded (his father used to be ');
		}
		this.modules[name] = moduleObjct;
		return moduleObjct;
	};
	/**
	 *
	 * loads multiple events
	 * returns an eventable with aggregate
	 *
	 * should be used with .onState('loaded' ,.... and not .on(
	 */
	pew.prototype.loadModules = function() {
		var modules = arguments;
		var loader = new eventable();
		for(var i = 0; i < modules.length; i++) {
			var retobj = this.loadModule(modules[i]);
			if(!retobj.inherits('module')) {
				loader.regAggregate('loaded', retobj, 'loaded');
			}
		}
		if(loader.hasAggregateListener('loaded')) {
			loader.emit('loaded');
		};
		return loader;
	}
	/**
	 *
	 * @param name
	 * @returns object<inheirts:module>
	 */
	pew.prototype.module = function(name) {
		return this.modules[name];
	};

	/**
	 *
	 * @param path
	 */
	pew.prototype.loadScript = function(path) {
		var loader = new eventable();
		var givenHead = this.module('ui').dom.getHead();
		var script = givenHead.inject('script').attrs({'src' : path, async: true});
		script.element.onload = function() {
			loader.emit('loaded');
		}
		return loader;
	};
	/**
	 * all these params defined here in the constructor have initialization functions to support inheritance
	 *
	 */

	function eventable() {
		this.aggregates = {};
		this.listeners = {};
		this.states = {};
	};

	eventable.prototype.once = function(ev, handler) {
		this.initListenersStack(ev);
		this.listeners[ev].push({type: 'once', handler :handler});
	};
	eventable.prototype.on = function(ev, handler) {
		this.initListenersStack(ev);
		this.listeners[ev].push({type: 'on', handler :handler});
	};
	eventable.prototype.onState = function(ev, handler) {
		this.initStates();
		if(this.states.hasOwnProperty('ev')) {
			handler.apply(this, this.states[ev]);
		} else {
			this.on(ev, handler);
		}
	};

	eventable.prototype.emit = function(ev, args) {
		if(this.hasOwnProperty('listeners') && this.listeners.hasOwnProperty(ev)) {
			for(var i = 0; i < this.listeners[ev].length; i++) {
				this.listeners[ev][i].handler.apply(this, args);
				if(this.listeners[ev][i].type == 'once') {
					delete(this.listeners[ev][i]);
				}
			}
		}
		this.initStates();
		this.states[ev] = args;
	};
	eventable.prototype.initListenersStack = function(ev) {
		if (!this.hasOwnProperty('listeners')) {
			this.listeners = {};
		}
		;
		if (!this.listeners.hasOwnProperty(ev)) {
			this.listeners[ev] = [];
		}
	};
	eventable.prototype.initStates = function() {
		this.states = {};
	}
	eventable.prototype.initAggregate = function(ev) {
		if(!this.aggregates.hasOwnProperty(ev)) {
			this.aggregates[ev] = {emitters : [], emits :0}
		}
	};
	/**
	 *
	 * @param ev
	 * @param emitter
	 * @param emitterEv
	 */
	eventable.prototype.regAggregate = function(ev, emitter, emitterEv) {
		this.initAggregate(ev);
		this.aggregates[ev].emitters.push(emitter);
		var self = this;
		emitter.on(emitterEv, function() {
			self.aggregates[ev].emits++;
			if(self.aggregates[ev].emitters.length == self.aggregates[ev].emits) {
				self.emit(ev);
			}
		});
	};
	/**
	 *
	 */
	eventable.prototype.hasAggregateListener = function(ev) {
		return (this.hasOwnProperty('aggregates') && this.aggregates.hasOwnProperty(ev) && this.aggregates[ev].emitters.length > 0);
	};

		/**
	 * MODULE
	 */
	function module() {

	};
	module.prototype.getName = function() {
		return this.constructor.name;
	}


	/**
	 *  MODULE UI
	 *
	 *
	 * @type {module}
	 */
	function ui(pew) {
		this.dom = new domTree(document);
	};
	ui.inheritsFrom(module);
	function domElm(element) {
		this.element = element;
	}
	domElm.prototype.inject = function(tag) {
		var elm = document.createElement(tag);
		this.element.appendChild(elm);
		return new domElm(elm);
	}
	domElm.prototype.attrs = function(attrs) {
		for(var attr in attrs) {
			this.element[attr] = attrs[attr];
		}
		return this;
	};

	function domTree(docRoot) {
		this.root = docRoot;
	}
	ui.inheritsFrom(module);

	domTree.prototype.getHead = function() {
		return this.findFirst('head');
	};
	/**
	 *
	 * @param tag
	 * @returns {NodeList}
	 */
	domTree.prototype.find = function(tag) {
		return this.root.getElementsByTagName(tag);
	};

	/**
	 *
	 * @returns {null}
	 */
	domTree.prototype.findFirst = function() {
		var found = this.find('head');
		if(found.length > 0) {
			return new domElm(found[0]);
		}
		return null;
	};

	pew.module = module;
	pew.eventable = eventable;
	window.pewProto = pew;
	window.pew = new pew();
	window.pew.loadModule(ui);
})(window);