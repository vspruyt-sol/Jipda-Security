var subgraphCache = {};

/*
 * G = States van JIPDA graph
 * P = Pattern (RPE)
 * F = Final states
 * v0 = initial state van G
 * s0 = initial state van P
 */
function ExistentialQuery(G, P, F, v0, s0){
	this.G = G;
	this.P = P;
	this.F = F;
	this.v0 = v0;
	this.s0 = s0;	
}

ExistentialQuery.prototype.runNaive = function(){
	//used variables
	var tripleG, tripleP, theta, theta2,
		tripleW, tripleTemp;
	//start algorithm
	var R = [];
	var W = [];
	for(var i = 0; i < this.G.length; i++){
		tripleG = this.G[i];
		if(tripleG.from.equals(this.v0)){ //Is de Jipda-node gelijk aan onze initial (Jipda-)node
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];	
				if(tripleP.from.equals(this.s0)){ //Is de NFA-node gelijk aan de initial (NFA-)node
					theta = AbstractQuery.match(tripleG.edge,tripleP.edge);
					for(var k = 0; k < theta.length; k++){
						W = AbstractQuery.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	var E = [];
	while(W.length > 0){
		tripleW = W.shift();
		R = AbstractQuery.union(R, [tripleW]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(tripleW.v)){ //KLOPT DIT WEL????
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];	
					if(tripleP.from.equals(tripleW.s)){ //KLOPT DIT WEL????
						theta = AbstractQuery.match(tripleG.edge,tripleP.edge); //theta = [[{x:a},{callee:sink}]]
						for(var k = 0; k < theta.length; k++){
							theta2 = AbstractQuery.merge(tripleW.theta, theta[k]);
							if(theta2){
								tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
								if(!contains(R, tripleTemp)){
									W = AbstractQuery.union(W, [tripleTemp]);
								}
							}
						}//end for		
					}
				} //end for 
			}
		} //end for
		
		if(contains(this.F, tripleW.s)){
			E = AbstractQuery.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
		}
	} //end while
	return E;
}

ExistentialQuery.prototype.runNaiveWithNegation = function(){
	//used variables
	var tripleG, tripleP, theta, theta2,
		tripleW, tripleTemp;
	//start algorithm
	var R = [];
	var W = [];
	for(var i = 0; i < this.G.length; i++){
		tripleG = this.G[i];
		if(tripleG.from.equals(this.v0)){ //Is de Jipda-node gelijk aan onze initial (Jipda-)node
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];	
				if(tripleP.from.equals(this.s0)){ //Is de NFA-node gelijk aan de initial (NFA-)node
					theta = AbstractQuery.match(tripleG.edge,tripleP.edge);
					for(var k = 0; k < theta.length; k++){
						W = AbstractQuery.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	var E = [];
	while(W.length > 0){
		tripleW = W.shift();
		R = AbstractQuery.union(R, [tripleW]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(tripleW.v)){
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];	
					if(tripleP.from.equals(tripleW.s)){
							if(tripleP.edge.name === 'subGraph'){
								var newTriples;
								if(subgraphCache[tripleP]){
									//console.log('CACHED');
									newTriples = subgraphCache[tripleP];
								}
								else{
									newTriples = AbstractQuery.expandSubgraph(tripleP, this.P);
									//console.log('NOT YET CACHED');
									subgraphCache[tripleP] = newTriples;
								}
								Array.prototype.push.apply(this.P,newTriples);
							}
							else{
								theta = AbstractQuery.match(tripleG.edge,tripleP.edge);
								for(var k = 0; k < theta.length; k++){
									theta2 = AbstractQuery.merge(tripleW.theta, theta[k]);
									if(theta2){
										tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
										if(!contains(R, tripleTemp)){
											W = AbstractQuery.union(W, [tripleTemp]);
										}
									}
								}
							}		
					}
				} //end for 
			}
		} //end for
		
		if(contains(this.F, tripleW.s)){
			E = AbstractQuery.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
		}
	} //end while
	return E;
}

//TODO BUGFIX
ExistentialQuery.prototype.runMemo = function(){
	//used variables
	var tripleG, tripleP, pairWts, theta, pairTemp, quintupleMts, theta2;
	//start algorithm
	var R = [];
	//START INITIALIZE WORKLIST
	var W = [];
	var Rts = [];
	var Wts = [];
	var Mts = [];
	for(var i = 0; i < this.G.length; i++){
		tripleG = this.G[i];
		if(tripleG.from.equals(this.v0)){
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];
				if(tripleP.from.equals(this.s0)){
					theta = AbstractQuery.match(tripleG.edge,tripleP.edge); 
					for(var k = 0; k < theta.length; k++){
						W = AbstractQuery.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
						Wts = AbstractQuery.union(Wts, [new VertexPair(tripleG.target, tripleP.target)]);
						Mts = AbstractQuery.union(Mts, [new Quintuple(tripleG.from, tripleP.from, tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	while(Wts.length > 0){
		pairWts = Wts.pop();
		Rts = AbstractQuery.union(Rts, [pairWts]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(pairWts.v)){ 
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];			
					if(tripleP.from.equals(pairWts.s)){
						theta = AbstractQuery.match(tripleG.edge,tripleP.edge);
						for(var k = 0; k < theta.length; k++){
							pairTemp = new VertexPair(tripleG.target, tripleP.target);
							if(!contains(Rts, pairTemp)){
								Wts = AbstractQuery.union(Wts, [pairTemp]);
								Mts = AbstractQuery.union(Mts, [new Quintuple(tripleG.from, tripleP.from, tripleG.target, tripleP.target, theta[k])])
							}
						}//end for
					}
				} //end for 
			}
		} //end for
	}
	//END INITIALIZE WORKLIST
	//START UPDATE WORKLIST
	var E = [];
	while(W.length > 0){
		tripleW = W.pop();
		R = AbstractQuery.union(R, [tripleW]);
		for(var i = 0; i < Mts.length; i++){
			quintupleMts = Mts[i];
			if(quintupleMts.vfrom.equals(tripleW.v) && quintupleMts.sfrom.equals(tripleW.s)){
				theta2 = AbstractQuery.merge(tripleW.theta, quintupleMts.theta);
				if(theta2){
					tripleTemp = new WorklistTriple(quintupleMts.vto, quintupleMts.sto, theta2);
					if(!contains(R, tripleTemp)){
						W = AbstractQuery.union(W, [tripleTemp]);
					}
				}
			}
		}
		if(contains(this.F, tripleW.s)){
			E = AbstractQuery.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
		}
	} //end while
	//END UPDATE WORKLIST
	return E;
}

/*
 * G = States van JIPDA graph
 * P = Pattern (RPE)
 * F = Final states
 * v0 = initial state van G
 * s0 = initial state van P
 */
function UniversalQuery(G, P, F, v0, s0){
	this.G = G;
	this.P = P;
	this.F = F;
	this.v0 = v0;
	this.s0 = s0;	
}

UniversalQuery.prototype.runNaiveWithNegation = function(){
	//used variables
	var tripleG, tripleP, theta, matched, tripleW, theta1, theta2, tripleTemp, tripleTemp2;
	//start algorithm
	var R = [];
	var W = [];
	for(var i = 0; i < this.G.length; i++){
		tripleG = this.G[i];
		if(tripleG.from.equals(this.v0)){ //Is de Jipda-node gelijk aan onze initial (Jipda-)node
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];	
				if(tripleP.from.equals(this.s0)){ //Is de NFA-node gelijk aan de initial (NFA-)node
					theta = AbstractQuery.match(tripleG.edge,tripleP.edge);
					for(var k = 0; k < theta.length; k++){
						W = AbstractQuery.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	var T = {};
	var U = {};
	while(W.length > 0){
		tripleW = W.shift();
		R = AbstractQuery.union(R, [tripleW]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(tripleW.v)){
				matched = false;
				//hier prevMatch ofzo resetten (bijhouden of er veranderingen in match zijn)
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];	
					if(tripleP.from.equals(tripleW.s)){
						theta1 = AbstractQuery.match(tripleG.edge,tripleP.edge);
						for(var k = 0; k < theta1.length; k++){
							theta2 = AbstractQuery.merge(tripleW.theta, theta1[k]);
							if(theta2){
								if(matched){
									throw 'Determinism condition doesn\'t hold for universal query!';
								}
								matched = (tripleP.edge.name === '_' ? matched : true); 
								//TODO: controleren of we de lijnen hieronder nog moeten doen
								tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
								if(!contains(R, tripleTemp)){
									W = AbstractQuery.union(W, [tripleTemp]);
								}
							}
						}//end for		
						if(!matched){
							tripleTemp2 = new WorklistTriple(tripleG.target, undefined, undefined);
							if(!contains(R, tripleTemp2)){
								W = AbstractQuery.union(W, [tripleTemp2]);
							}
						}
					}
				} //end for 
			}
		} //end for
		if(!T[tripleW.v]){
			T[tripleW.v] = contains(this.F, tripleW.s);
		}
		if(T[tripleW.v]){
			var thetaUv = U[tripleW.v] || [];
			U[tripleW.v] = AbstractQuery.merge(tripleW.theta, thetaUv);
		}
		else{
			U[tripleW.v] = undefined;
		}
	} //end while
	//TODO: TRANSFORM RESULTS
	return this.transformToPairs(U);
}

UniversalQuery.prototype.transformToPairs = function(res){
	var val;
	var transformed = [];
	for(var key in res){
		val = res[key];
		if(val) transformed.push(new VertexThetaPair(new DummyNode(parseInt(key)), val));
	}
	return transformed;
}

/**
 * All functions used by ExistentialQuery and UniversalQuery
 * ---------------------------------------------------------
 */

function AbstractQuery(){
}

AbstractQuery.extensions = function(theta, tl){
}

AbstractQuery.match = function(el, tl){
	//Given an edge label el and a transition label tl, let match(tl,el), 
	//which takes a set of symbols as an implicit argument, be the set of minimal substitutions θ 
	//such that el matches tl under θ. The resulting set has at most one element when tl contains 
	//no negations but can be very large otherwise. For example, match(use(a),¬use(x)) is the set of 
	//substitutions of the form {x → b}, where b is any symbol other than a.
	var substitutions = [];
	var _map = [];
	switch(tl.name){
		case 'state'		: 	_map = this.matchState(el, tl);
								break;
		case '_'			: 	_map = []; 
								break;					
		case 'dummy'		: 	_map = [];
								break;
		default:
			throw "Can not handle 'tl.name': " + tl.name + ". Source: AbstractQuery.match(el, tl)"
	}

	if(_map){
		//TODO: Drop temp variables!
		_map = AbstractQuery.cleanupTempVars(_map);
		if(tl.negated) return [];
		substitutions.push(_map);
	}
	return tl.negated ? [[{}]] : substitutions; //substitution	
}

AbstractQuery.cleanupTempVars = function(subs){
	var sub, newSubs = [];
	for(var i = 0; i < subs.length; i++){
		sub = subs[i];
		for(var key in sub){
			if(!(key.lastIndexOf('?__tmp__') === 0)) {
				newSubs.push(sub);
			}
		}
	}
	return newSubs;
}

AbstractQuery.isWildCard = function(x){
	return (x === undefined || (x === '_')); 
}

AbstractQuery.isResolvableVariable = function(x){
	return (typeof x === 'string' && x.charAt(0) === '?');
}

AbstractQuery.resolveVariable = function(varName, table){
	for(var i = 0; i < table.length; i++){
		if(table[i][varName]) return table[i][varName];
	}
	return false;
}

AbstractQuery.verifyConditions = function(table, conds){

	//als er iets foutgelopen is is de tabel leeg:
	if(table.length === 0) return [];

	var func, args, resolvedArg, resolvedArgs = [];
	for(var j = 0; j < conds.length; j++){
		func = conds[j][0];
		args = conds[j][1];
		resolvedArgs = [];
		for(var i = 0; i < args.length; i++){
			if(this.isResolvableVariable(args[i])){
				resolvedArg = this.resolveVariable(args[i], table);
				//if(!resolvedArg) throw 'could not resolve argument ' + args[i];
			}
			else{
				resolvedArg = args[i];
			}
			resolvedArgs.push(resolvedArg);
		}
		res = func.apply(this, resolvedArgs);
		if(!res) return [];
	}
	return table;
}

AbstractQuery.addExtraProperties = function(table, props){
	var toLookup, propString, subSubs, accessors, lookupInfo, lookedUp, func, args, resolvedArg, res;
	var matches = true;
	var resolvedArgs = [];
	for(var key in props){
		propString = props[key];
		if(propString instanceof Array){ //[function, [arguments]]
			resolvedArgs = [];
			func = propString[0];
			args = propString[1];
			for(var i = 0; i < args.length; i++){
				if(this.isResolvableVariable(args[i])){
					resolvedArg = this.resolveVariable(args[i], table);
					if(!resolvedArg) throw 'could not resolve argument ' + args[i];
				}
				else{
					resolvedArg = args[i];
				}
				resolvedArgs.push(resolvedArg);
			}
			res = func.apply(this, resolvedArgs);
			var obj = {};
			obj[key] = res;
			table.push(obj);
		}
		else{
			toLookup = propString.split('.')[0];
			accessors = propString.split('.').slice(1);
			for(var i = 0; i < table.length; i++){
				subSubs = table[i];
				if(subSubs[toLookup]) lookedUp = subSubs[toLookup] //lookup variable
				if(subSubs[key]){ //variable already defined
					//throw 'Substitution for ' + key + ' already exists.'
					break; 
				}
				if(lookedUp){ //not already defined and found in table
					var obj = {};
					lookupInfo = JipdaInfo.getInfo(lookedUp); //expression matching on val
					if(lookupInfo){
						for(var g = 0; g < accessors.length; g++){
							if(lookupInfo) lookupInfo = lookupInfo[accessors[g]];
						}
						obj[key] = lookupInfo;
					}
					if(obj[key]){
						table.push(obj);
					} 
					else{
						return [];
					}
					
				}
				lookedUp = false;
			}
		}
	}
	return table;
}

AbstractQuery.matchState = function(el, tl){
	var tlInfo = tl.state;
	var subst = [];
	var matchInfo, reified;

	for(var key in tlInfo){
		if(key === 'filters') {
			subst = this.verifyConditions(subst, tlInfo[key]);
		}
		else if(key === 'properties') {
			subst = this.addExtraProperties(subst, tlInfo[key]);
		}
		else{
			reified = mapStateKey(key, el);
			if(!reified) return false;
			matchInfo = this.matchRecursive(key, tlInfo[key], mapStateKey(key,el)); //pass along the corresponding statepart
			if(matchInfo){
				subst.push.apply(subst, matchInfo)
			}
			else{
				return false;
			}
		}	
	}
	return subst.length === 0 ? false : subst;
}

AbstractQuery.matchRecursive = function(key, value, statePart, subs){
	var reified, matchInfo, merged;
	subs = subs || [];
	if(value instanceof Array){
		//TODO overloop alle elems (momenteel skip)?
	}
	else if(value instanceof Object) {
		for(var k in value){
			reified = mapStateKey(k, statePart);
			if(!reified) return false;
			matchInfo = this.matchRecursive(k, value[k], reified, subs);
			if (matchInfo){
				subs = this.merge(subs, matchInfo);
				if(!subs) return false;
			}
			else{
				return false;
			}
		}
	}
	else if(value.constructor.name === 'String'){ //assume it is a string
		if(value.charAt(0) === '?'){ //it's a variable, store it
			var obj = {};
			obj[value] =  statePart;
			subs.push(obj);
		}
		else{
			//TODO check wildcard
			if(value !== '_' && value !== statePart) return false;
		}
	}
	else{ //number or boolean
		if(value !== statePart) return false;
	}
	return subs.length === 0 ? [{}] : subs;
}

//arguments of form: [{?x: Value1},{?y: Value2}, ...]
AbstractQuery.merge = function(theta, otherTheta){
	//(1) undefined if any two substitutions in S disagree on the mapping 
	//of any variable in the intersection of their domains and 
	//(2) the union of the substitutions in S otherwise.
	//iterate over set 1
	var res = [];
	function mergeIterate(theta, otherTheta){
		var p;
		for(var i = 0; i < theta.length; i++){
			for(var prop in theta[i]){ //only one prop...
				if(theta[i].hasOwnProperty(prop)){
					p = findProp(otherTheta, prop);
					if(p){ 
						if(!(_.isEqual(p,theta[i][prop]))){ //If not equal
							return false;
						}
					}
					else if(_.keys(theta[i]).length > 0){//not found
						otherTheta.push(theta[i]);
						//res.push(theta[i]);
					}
				}
			}
		}
		return otherTheta;
	}

	function findProp(arr, prop){
		for(var i = 0; i <  arr.length; i++){
			for(var property in arr[i]){
				if(arr[i].hasOwnProperty(property)){
					if(_.isEqual(property,prop)) return arr[i][property];
				}
			}
		}
		return false;
	}
	res = mergeIterate(theta, otherTheta);

	return res;
}

AbstractQuery.union = function(set, otherSet, debug){
	var result = set.slice(0);
	
	for (var i = 0; i < otherSet.length; i++) {
        if (!contains(result, otherSet[i])) {
            result.push(otherSet[i]);
        }
    }
    if (debug) {
    	console.log(set);
    	console.log(otherSet);
	    console.log(result);
	    console.log('****');
	}
    return result;
}

AbstractQuery.removeTriple = function(set, triple){
	return set.filter(function(x){
		return (x.from !== triple.from && x.target !== triple.target);
	});
}

AbstractQuery.expandSubgraph = function(triple, currPattern){
	var f,state,uid,ctx,rpe, nextIndex, newTriples;
	f 		= triple.edge.expandFunction;
	state 	= triple.edge.state;
	uid 	= triple.edge.expandContext;
	ctx 	= new RegularPathExpression(uid);
	rpe 	= f.call(ctx, state);
	triples = rpe.toDFA().triples;
	nextIndex = currPattern.reduce(function(acc, o){ 
										if(o.from._id > acc){
											if(o.target._id > o.from._id) return o.target._id;
											return o.from._id;
										}
										return acc;
									}, 0) + 1; //avoid overlaps
	newTriples = triples.map(function(x){
									if(x.initial) {
										x.from = triple.from;
										x.initial = false;
									}
									else{
										x.from._id += nextIndex;
									}
									if(x.final){
										x.target = triple.target;
										x.final = false;
									}
									else{
										x.target._id += nextIndex;
									}

									//TODO: Set initial and final to false?
									return x;
								});

	return newTriples;
}

//TEMP test function (maps keys to state keys)
var mapStateKey = function(key, statePart){
	//TODO:do some reifying
	return statePart[key] ? statePart[key] : false;
}

var contains = function(set, elem){	
	for (var i = 0; i < set.length; i++) {
        if (_.isEqual(set[i], elem) || set[i] === elem) {
            return true;
        }
    }
    return false;
}