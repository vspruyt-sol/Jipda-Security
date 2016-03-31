var subgraphCache = {};
//maps negationmarker ID's to true/false, meaning resp. 
//that the pattern inside the negation is still being matched/has stopped matching.
var negationMap = {};

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

ExistentialQuery.prototype.runNaiveWithNegation = function(){
	//used variables
	var tripleG, tripleP, theta, theta2,
		tripleW, tripleTemp;

	//Reset stuff
	subgraphCache = {};
	negationMap = {};
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
									newTriples = subgraphCache[tripleP];
								}
								else{
									newTriples = AbstractQuery.expandSubgraph(tripleP, this.P);
									subgraphCache[tripleP] = newTriples;
								}
								//add if it isn't in P yet
								for(var z = 0; z < newTriples.length; z++){
									if(!contains(this.P, newTriples[z])) this.P.push(newTriples[z]);
								}
							}
							else{
								theta = AbstractQuery.match(tripleG.edge,tripleP.edge, tripleW.theta); //theta added
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
	//for matchedPair, 1 and 2 are just names without any meaning
	var tripleG, tripleP, theta, tripleW, theta1, theta2, tripleTemp, tripleTemp2, matchPair;
	//start algorithm
	var R = [];
	var W = [];
	for(var i = 0; i < this.G.length; i++){
		tripleG = this.G[i];
		if(tripleG.from.equals(this.v0)){ //Is de Jipda-node gelijk aan onze initial (Jipda-)node
			matchPair = undefined;
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];	
				if(tripleP.from.equals(this.s0)){ //Is de NFA-node gelijk aan de initial (NFA-)node
					if(tripleP.edge.name === 'subGraph'){
						var newTriples;
						if(subgraphCache[tripleP]){
							newTriples = subgraphCache[tripleP];
						}
						else{
							newTriples = AbstractQuery.expandSubgraph(tripleP, this.P);
							subgraphCache[tripleP] = newTriples;
						}
						//add if it isn't in P yet
						for(var z = 0; z < newTriples.length; z++){
							if(!contains(this.P, newTriples[z])) this.P.push(newTriples[z]);
						}
					}
					else{
						theta = AbstractQuery.match(tripleG.edge,tripleP.edge);
						for(var k = 0; k < theta.length; k++){
							if(matchPair === undefined || matchPair[3] === "_"){
								matchPair = {
									1: tripleP.target, 
									2: theta[k],
									3: tripleP.edge.name
								};
								W = AbstractQuery.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
								//console.log('added');
								//console.log(new WorklistTriple(tripleG.target, tripleP.target, theta[k]));
							}
							else{
								if((matchPair[1] !== tripleP.target) || (matchPair[2] !== theta[k])){
									throw 'Determinism condition doesn\'t hold for universal query!';
								}
							}
						}
						if(matchPair === undefined){
							W = AbstractQuery.union(W, [new WorklistTriple(tripleG.target, undefined, undefined)]);
						}
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
				matchPair = undefined;
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];	
					if(tripleP.from.equals(tripleW.s)){
						
						if(tripleP.edge.name === 'subGraph'){
							var newTriples;
							if(subgraphCache[tripleP]){
								newTriples = subgraphCache[tripleP];
							}
							else{
								newTriples = AbstractQuery.expandSubgraph(tripleP, this.P);
								subgraphCache[tripleP] = newTriples;
							}
							//add if it isn't in P yet
							for(var z = 0; z < newTriples.length; z++){
								if(!contains(this.P, newTriples[z])) this.P.push(newTriples[z]);
							}
						}
						else{
							theta1 = AbstractQuery.match(tripleG.edge,tripleP.edge, tripleW.theta);
							for(var k = 0; k < theta1.length; k++){
								theta2 = AbstractQuery.merge(tripleW.theta, theta1[k]);
								if(theta2){
									if(matchPair === undefined || matchPair[3] === "_"){ //suppress error
										matchPair = {
											1: tripleP.target,
											2: theta2,
											3: tripleP.edge.name
										}
										tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
										if(!contains(R, tripleTemp)){
											W = AbstractQuery.union(W, [tripleTemp]);
										}
									}				
									else{
										if((matchPair[1] !== tripleP.target) || (matchPair[2] !== theta2)){
											throw 'Determinism condition doesn\'t hold for universal query!';
										}
									}
								}
							}//end for		
							if(matchPair === undefined){
								tripleTemp2 = new WorklistTriple(tripleG.target, undefined, undefined);
								if(!contains(R, tripleTemp2)){
									W = AbstractQuery.union(W, [tripleTemp2]);
								}
							}
						}
					}
				} //end for 
			}
		} //end for

		if((T[tripleW.v] === undefined) || (T[tripleW.v] !== false)){
			T[tripleW.v] = contains(this.F, tripleW.s);
		}
		if(T[tripleW.v]){
			if(U[tripleW.v] === undefined){
				U[tripleW.v] = tripleW.theta;
			}
			else{
				U[tripleW.v] = AbstractQuery.merge(U[tripleW.v],tripleW.theta);
			}			
		}
		else{
			U[tripleW.v] = undefined;
		}
	} //end while
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

AbstractQuery.match = function(el, tl, curTheta){
	//curTheta is optional
	//Given an edge label el and a transition label tl, let match(tl,el), 
	//which takes a set of symbols as an implicit argument, be the set of minimal substitutions θ 
	//such that el matches tl under θ. The resulting set has at most one element when tl contains 
	//no negations but can be very large otherwise. For example, match(use(a),¬use(x)) is the set of 
	//substitutions of the form {x → b}, where b is any symbol other than a.
	var substitutions = [];
	var _map = [];
	var lastMatch = false;
	switch(tl.name){
		case 'state'		: 	_map = this.matchState(el, tl, curTheta);
								break;
		case '_'			: 	_map = []; 
								break;
		default:
			throw "Can not handle 'tl.name': " + tl.name + ". Source: AbstractQuery.match(el, tl)"
	}

	//If we look at this, be sure to clean up temp variables
	//WE ARE IN THE MIDDLE OF A NEGATION! 
	//ATTENTION: NO NESTED NEGATION ALLOWED
	//ALL VARIABLES IN A NEGATION HAVE TO BE BOUND ALREADY
	/*if(tl.negationMarkers.length > 0){
		//Do this for all negationmarkers
		for(var i = 0; i < tl.negationMarkers.length; i++){
			//create it if it doesn't exist (default value)
			if(negationMap[tl.negationMarkers[i].id] === undefined) negationMap[tl.negationMarkers[i].id] = true;

			if(tl.negationMarkers[i].last){
				if(!_map) negationMap[tl.negationMarkers[i].id] = false;
				lastMatch = lastMatch || negationMap[tl.negationMarkers[i].id];
				return negationMap[tl.negationMarkers[i].id] ? [] : [[]];
			}
			else{
				if(!_map){
					negationMap[tl.negationMarkers[i].id] = false;
				}
				
			}

		}
		return lastMatch ? [] : [[]];
		// ALTIJD PAS HET ALGO STOPPEN/DOORGAAN ALS DE VOLLEDIGE NEGATIE KLAAR IS
		// Eerste geval: we zijn aan het einde van de negatie
		// dus, als last = true && match: return [], anders return [[]];
		// Tweede geval: er is een match gevonden, maar nog niet aan einde
		// dus, pas de map aan naar mapValue = mapValue && true en return [[]]; (om het algo niet te stoppen)
		// Derde geval: er is geen match gevonden, maar nog niet aan einde
		// dus, pas de map aan naar mapValue = false && return [[]]; (om het algo niet te stoppen)
	}*/

	if(_map){
		//Drop temp variables!
		//_map = AbstractQuery.cleanupTempVars(_map);

		if(tl.negated && AbstractQuery.merge(_map, curTheta)){
			return [];
		}

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

AbstractQuery.verifyConditions = function(table, conds, curTheta){

	var lookupTable = table;
	//als er iets foutgelopen is is de tabel leeg:
	if(!table || table.length === 0) return [];
	
	if(curTheta) lookupTable = AbstractQuery.merge(table, curTheta);
	//var lookupTable = table;
	if(!lookupTable) return false;	
	
	var func, args, resolvedArg, resolvedArgs = [];
	for(var j = 0; j < conds.length; j++){
		func = conds[j][0];
		args = conds[j][1];
		resolvedArgs = [];
		for(var i = 0; i < args.length; i++){
			if(this.isResolvableVariable(args[i])){
				resolvedArg = this.resolveVariable(args[i], lookupTable);
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

AbstractQuery.addExtraProperties = function(table, props, curTheta){
	//curTheta is added to access already bound variables from previous matching steps
	var lookupTable = table;

	if(curTheta) lookupTable = AbstractQuery.merge(table, curTheta);

	//var lookupTable = table;
	if(!lookupTable) return false;	

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
					resolvedArg = this.resolveVariable(args[i], lookupTable);
					if(resolvedArg.length === 0) return false; //couldn't find a resolution
				}
				else{
					resolvedArg = args[i];
				}
				resolvedArgs.push(resolvedArg);
			}
			res = func.apply(this, resolvedArgs);
			if(!res) return false;
			var obj = {};
			obj[key] = res;
			//for the current lookup
			lookupTable.push(obj);
			table.push(obj);
		}
		else{
			toLookup = propString.split('.')[0];
			accessors = propString.split('.').slice(1);
			for(var i = 0; i < lookupTable.length; i++){
				subSubs = lookupTable[i];
				if(subSubs[toLookup]) lookedUp = subSubs[toLookup] //lookup variable
				if(subSubs[key]){ //variable already defined
					//throw 'Substitution for ' + key + ' already exists.'
					break; 
				}
				if(lookedUp){ //not already defined and found in table
					var obj = {};
					//console.log(lookedUp);
					lookupInfo = JipdaInfo.getInfo(lookedUp); //expression matching on val
					//lookupInfo = lookedUp;

					if(lookupInfo){
						for(var g = 0; g < accessors.length; g++){
							if(lookupInfo) lookupInfo = lookupInfo[accessors[g]];
						}
						obj[key] = lookupInfo;
					}
					if(obj[key]){
						lookupTable.push(obj);
						table.push(obj);
					} 
					else{
						return false; // was return [];
					}
					
				}
				lookedUp = false;
			}
		}
	}
	return table;
}

AbstractQuery.addExtraPropertiesSwapped = function(table, props, curTheta){
	function swap(obj){
	  var ret = {};
	  for(var key in obj){
	    ret[obj[key]] = key;
	  }
	  return ret;
	}
	var swapped = swap(props);
	return this.addExtraProperties(table, swapped, curTheta);
}

AbstractQuery.matchState = function(el, tl, curTheta){
	var tlInfo = tl.state;
	var subst = [];
	var matchInfo, reified;

	//TODO herschrijven naar minder duplicate code
	for(var key in tlInfo){
		switch (key){
			case 'filters': 
						subst = this.verifyConditions(subst, tlInfo[key], curTheta);
						break;
			case 'properties': 
						subst = this.addExtraProperties(subst, tlInfo[key], curTheta);
						break;
			/*case 'benvTest': //TESTING
						benv = 	mapStateKey('benv', el);
						console.log(benv);
						if(!benv) return false;
						matchInfo = this.matchRecursive('benv', tlInfo[key], mapStateKey('benv',el)); //pass along the corresponding statepart
						if(matchInfo){
							subst.push.apply(subst, matchInfo)
						}
						else{
							return false;
						};
						break;
			case 'storeTest': //TESTING
						store = mapStateKey('store', el);
						console.log(store);
						if(!store) return false;
						matchInfo = this.matchRecursive('store', tlInfo[key], mapStateKey('store',el)); //pass along the corresponding statepart
						if(matchInfo){
							subst.push.apply(subst, matchInfo)
						}
						else{
							return false;
						};
						break;*/
			default: 	reified = mapStateKey(key, el);
						if(reified === false) return false;
						matchInfo = this.matchRecursive(key, tlInfo[key], reified); //pass along the corresponding statepart
						if(matchInfo){
							subst.push.apply(subst, matchInfo)
						}
						else{
							return false;
						};
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
		//Handle benv and store differently as other objects
		if(key === 'benv'){
			console.log('I should BENV');
			return false;
		}
		else if(key === 'store'){
			console.log('I should STORE');
			return false;
		}
		else{
			for(var k in value){
				reified = mapStateKey(k, statePart);

				//console.log(k)
				if(reified === false) return false;

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
	}
	else if(value.constructor.name === 'String'){ //assume it is a string
		if(value.charAt(0) === '?'){ //it's a variable, store it
			var obj = {};
			obj[value] =  JipdaInfo.getInfo(statePart) || {name: "NotDefined"};
			//console.log(statePart);
			//obj[value] =  statePart;
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

	res = mergeIterate(theta.slice(), otherTheta.slice()); //Changed this to merge copies instead of the actual arrays

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
									return x;
								});

	return newTriples;
}

//TEMP test function (maps keys to state keys)
var mapStateKey = function(key, statePart){
	//TODO:do some reifying

	switch (key){
		case 'this' : 	return statePart; break;
		case 'id'	: 	return statePart['_id']; break;
		default		: 	return statePart[key] !== undefined ? statePart[key] : false;
	}
	
}

var contains = function(set, elem){	
	for (var i = 0; i < set.length; i++) {
        if (_.isEqual(set[i], elem) || set[i] === elem) {
            return true;
        }
    }
    return false;
}