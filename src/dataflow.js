"use strict";
const parser = require('./parsers/states').parser;

var Dataflow = function() {
	this.fMap = {};
	this.tMap = {};
	this.dMap = {};
	this.dMap['default'] = {
		state: {
			pstate: null,
			cstate: null,
			dict: {},
			barrier: [],
			flood: false
		},
		values: null
	}
	this.deepCopy = function(dObj) {
		const tmpValue = dObj.values;
		dObj.values = null;
		const dCopy = JSON.parse(JSON.stringify(dObj));
		dCopy.values = tmpValue;
		dObj.values = tmpValue;
		return dCopy;
	}
	this.lookUp = function(context) {
		return function(state) {
			return context.state.barrier.filter(v => {
				return v == state;
			}).length > 0 ? true : false;
		}
	};
	this.dObj = this.dMap['default'];
}

Dataflow.prototype = {
	create: function(details, f) {
		this.fMap[details.name] = {
			func: f,
			details: details
		};
		this.dMap[details.name] = this.dObj;
		return this;
	},
	fire: function(resource, data, pstate = 'begin') {
		const state = resource.split(':')[0];
		const port = resource.split(':')[1];
		const fObj = this.fMap[state] ? this.fMap[state] : void(0);
		const f = fObj.func;
		const cntx = this.dMap[state] || this.dObj;
		const pcntx = this.dMap[pstate] || this.dObj;
		const deepCopy = this.deepCopy;
		const lookUp = this.lookUp(cntx);
		this.dMap[state] = cntx;
		cntx.state.cstate = state;
		cntx.state.pstate = pstate;
		cntx.values = {
			value: data,
			state: pstate
		};
		if (fObj.details.expression) {
			cntx.state.barrier.push(port);
			cntx.state.dict[port] = data;
			const r = eval(parser.parse(fObj.details.expression));
			this.dMap[state] = cntx;
			if (!r || cntx.state.flood) {
				return;
			} else if (!cntx.state.flood) {
				cntx.state.flood = true;
				cntx.values = cntx.state.dict;
			}
		}
		let that = this;
		f(cntx.values, function(progressStates, errorStates) {
			return function(e, d) {
				progressStates.forEach((s) => {
					const cp = progressStates.length > 1 ? deepCopy(cntx) : cntx;
					cp.state.pstate = state
					that.dMap[state] = cp
					that.fire(s, d, state);
				});
				if (e) {
					errorStates.forEach((s) => {
						const cp = errorStates.length > 1 ? deepCopy(cntx) : cntx;
						cp.state.pstate = state
						that.dMap[state] = cp
						that.fire(s, e, state);
					});
				}
			}
		}, cntx.state);
	}
}

module.exports.Dataflow = Dataflow;
