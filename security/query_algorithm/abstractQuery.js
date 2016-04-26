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
		case '_'			: 	_map = [[]]; 
								break;
		default:
			throw "Can not handle 'tl.name': " + tl.name + ". Source: AbstractQuery.match(el, tl)"
	}

	if(_map){
		for(var i = 0; i < _map.length; i++){
			if(tl.negated && AbstractQuery.merge(_map[i], curTheta)){
				//substitutions.push(_map[i]);
				return [];
			}			
			substitutions.push(_map[i]);
		}	
	}

	//console.log(substitutions);
	//see what happens when we get more than one result
	//RESULT: it is perfectly fine to have: [[{?xAddr : "obj-1"}],[{?xAddr : "obj-3"}]]
	/*if(substitutions.length === 1) {
		var x = substitutions[0].slice();
		substitutions[0].push({'?xAddr':'obj-1'});

		x.push({'?xAddr':'obj-2'});
		substitutions.push(x);
	}*/
	//return substitutions;
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
		if(table[i][varName] !== undefined) return table[i][varName];
	}
	return undefined;
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
		if(!res) return false;
	}
	return table.length === 0 ? false : table;
}

AbstractQuery.addExtraProperty = function(key, map, lookupTables, propString, curTheta){
	if(propString instanceof Array){ //[function, [arguments]]
		func = propString[0];
		args = propString[1];
		res = this.addExtraPropertyWithFunc(map, lookupTables, func, args, key);
	}
	else{
		toLookup = propString.split('.')[0];
		accessors = propString.split('.').slice(1);
		res = this.addExtraPropertyWithChain(map, lookupTables, toLookup, accessors, key);
	}
	return res;
}

AbstractQuery.addExtraProperties = function(table, props, curTheta){
	//curTheta is added to access already bound variables from previous matching steps
	var map, lookupTables;
	var lookupTable = table;

	if(curTheta) lookupTable = AbstractQuery.merge(table, curTheta);

	//var lookupTable = table;
	if(!lookupTable) return false;	
	map = [lookupTable];
	lookupTables = [lookupTable]; //DEZE ZIJN HETZELFDE DUS ER KLOPT IETS NIET!

	var propString, res, added, newLT, merged, found = [];
	for(var key in props){
		propString = props[key];
			//prefetch lookuptable values
		res = this.addExtraProperty(key, map, lookupTables, propString, curTheta);
		map = res[0];
		added = res[1];
		//update lookup table to contain added properties
		newLT = [];
		for(var i = 0; i < lookupTables.length; i++){
			for(var j = 0; j < added.length; j++){
				merged = this.merge(lookupTables[i], [added[j]]);
				if(merged) newLT.push(merged);
			}
		}
		lookupTables = newLT.slice();
	}

	return map.length === 0 ? false : map;
	//return table.length === 0 ? false : table;
}

AbstractQuery.addExtraPropertyWithChain = function(map, lookupTables, toLookup, accessors, key){
	//lookup in every table
	found = [];
	//get unique found set TODO
	var lookedUp, lookupInfo, merged, newMap = [];
	for(var i = 0; i < map.length; i++){		
		if(this.isResolvableVariable(toLookup)){
			lookedUp = this.resolveVariable(toLookup, map[i]);
		}
		else{
			lookedUp = toLookup;
		}
		if(lookedUp === undefined){ // als niet leeg
			return false;
		}
		var obj = {};
		//console.log(lookedUp);
		lookupInfo = JipdaInfo.getInfo(lookedUp); //expression matching on val
		//lookupInfo = lookedUp;

		for(var g = 0; g < accessors.length; g++){
			if(lookupInfo) lookupInfo = lookupInfo[accessors[g]];
		}
		obj[key] = lookupInfo;

		if(obj[key] !== undefined){
			//add to found objects
			if(!contains(found, obj)) found.push(obj);
			/*NEWLY ADDED TEST CODE*/
			newMap = [];
			for(var s = 0; s < map.length; s++){
				if(s === i){
					merged = this.merge(map[s], [obj]);
					if(merged) newMap.push(merged);
				}
				else{
					newMap.push(map[s]);
				}
				
			}
			map = newMap.slice();
			/*END*/
			//lookupTable.push(obj);
		}
		else{
			return false;
		}
	}

	//Once we found all objects, it is time to add them to the map
	/*console.log(JSON.stringify(found));
	newMap = [];
	for(var s = 0; s < map.length; s++){
		for(var f = 0; f < found.length; f++){
			merged = this.merge(map[s], [found[f]]);
			if(merged) newMap.push(merged);
		}
	}
	map = newMap.slice();*/

	return [map, found];
}

AbstractQuery.addExtraPropertyWithFunc = function(map, lookupTables, func, args, key){
	var merged, newMap = [],res, resolvedArg, resolvedArgs = [], found = [];
	for (var l = 0; l < map.length; l++){
		for(var i = 0; i < args.length; i++){
			if(this.isResolvableVariable(args[i])){
				resolvedArg = this.resolveVariable(args[i], map[l]);
				if(resolvedArg === undefined) return false; //couldn't find a resolution
			}
			else{
				resolvedArg = args[i];
			}
			resolvedArgs.push(resolvedArg);
		}
		res = func.apply(this, resolvedArgs);
		if(res === undefined) return false;
		if(res.constructor.name === "BundledResult"){ //if we have multiple results
			//newMap = [];
			//for(var s = 0; s < map.length; s++){
				for(var j = 0; j < res.vals.length; j++){
					var newO = {};
					newO[key] = res.vals[j];
					if(!contains(found, obj)) found.push(newO);
			//		merged = this.merge(map[s], [newO]);
			//		if(merged) {newMap.push(merged);console.log('waaa');}
				}
			//}
			//map = newMap.slice();
		}
		else{
			var obj = {};
			obj[key] = res;
			/*NEWLY ADDED TEST CODE*/
			//newMap = [];
			//for(var s = 0; s < map.length; s++){
			//	merged = this.merge(map[s], [obj]);
			//	if(merged) {newMap.push(merged);};
			//}
			//map = newMap.slice();
			/*END*/
			
			if(!contains(found, obj)) found.push(obj);
		}
	}


	//Once all is found, add them to the map
	newMap = [];
	for(var s = 0; s < map.length; s++){
		for(var f = 0; f < found.length; f++){
			merged = this.merge(map[s], [found[f]]);
			if(merged) newMap.push(merged);
		}
	}
	map = newMap.slice();

	return [map, found];
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

AbstractQuery.getAddresses = function(obj, env, store, subs, curTheta){
	var map = [[]], newMap = [], foundAddresses;
	var resolved, curAddr, curVal, addrName;
	var toLookup, prop, names, found, startRes, restRes, merged, resolvedProp;

	var lookupTable = subs;

	if(curTheta) lookupTable = AbstractQuery.merge(subs, curTheta);

	//var lookupTable = table;
	if(!lookupTable) return false;	

	for(var varName in obj){
		addrName = obj[varName];

		//allow '?var.prop1.prop2'
		startRes = varName.split('.')[0];
		restRes = varName.split('.').slice(1);

		//benv:{?varName : ?addr}
		if(this.isResolvableVariable(startRes)){
			resolved = this.resolveVariable(startRes, lookupTable);
			if(resolved === undefined) return false;
			resolved = [].concat.apply([resolved], restRes).join('.');	
		}
		//benv:{?varName : ?addr}
		else{
			resolved = varName;
		}
		
		/*************************************************
		* Check for string literals, lambdas and numbers *
		**************************************************/

		if(Utilities.isNumeric(resolved) || resolved === "Lambda" || resolved.charAt(0) === '"' || resolved.charAt(0) === '\''){
			//if it doesn't match a specified value
			if(!this.isResolvableVariable(addrName)){
				if (addrName !== resolved) return false;
			}

			var newO = {};
			newO[addrName] = resolved;
			newMap = [];
			for(var i = 0; i < map.length; i++){
				merged = this.merge(map[i], [newO]);
				if(merged) newMap.push(merged);
			}
			map = newMap.slice(); //set back into map
			//map = this.merge(map, [newO]); //[{?x:1},{?y:2}]
			if(!map || map.length === 0) return false;
			//map.push(newO);
			continue;
		}

		/****************************************
		* Finds the starting point in the store *
		*****************************************/

		if(resolved instanceof Object){
			//TODO
		}
		else{ //String
			if(env._global || startRes === '_global'){
				curAddr = [1];
				prop = (startRes === '_global') ? resolved.split('.').slice(1) : resolved.split('.'); //still have to look for resolved in the global object
			}
			else{
				//split on dots for objects
				toLookup = resolved.split('.')[0];
				prop = resolved.split('.').slice(1);
				//console.log(env);
				//console.log(toLookup);
				curAddr = env.lookup(toLookup);
				if(curAddr.toString() === "_") {
					//Not found in environment, maybe in global object
					curAddr = [1];
					prop = resolved.split('.');
				}
				else{
					curAddr = this.processLookup(store.lookupAval(curAddr)); 
					if(!curAddr || curAddr.length === 0) return false;
				}
			}
		}

		/******************************
		* Resolve properties (if any) *
		*******************************/

		for(var i = 0; i < prop.length; i++){
			resolvedProp = prop[i];
			if(this.isResolvableVariable(prop[i])){
				resolvedProp = this.resolveVariable(prop[i], lookupTable);
				if(resolvedProp === undefined) return false; 
			}
			prop[i] = resolvedProp;
		}

		/**********************************
		* Find all addresses in the store *
		***********************************/

		var recurLookup = function(curAddrs, props, store, acc){
			var names, curVal, newCurAddrs, found;
			for(var i = 0; i < curAddrs.length; i++){
				//currAddr of form: ["obj-1","obj-2"]
				newCurAddrs = [];
				//descend down the first prop to get the next set of addresses
				if(props.length > 0){
					try{
						curVal = store.lookupAval(curAddrs[i]);
					}
					catch(e) {continue;}
					found = false;
					if(curVal.isObject() || curVal.isFunction()){
						names = curVal.names();
						for(var h = 0; h < names.length; h++){
							if(names[h].toString() === props[0]){ //first prop
								newCurAddrs = AbstractQuery.processLookup(curVal.lookup(names[h])[0]); 
								if(!newCurAddrs || newCurAddrs.length === 0) continue;
								found = true;
								break;
							}
						}
						//if we didn't find it, it is not in this object address, so continue for the next curAddr
						if(!found) continue;

						//We did find it
						recurLookup(newCurAddrs, props.slice(1), store, acc);
					}
					else{
						NewCurAddrs = AbstractQuery.processLookup(curVal); //TODO: hier kan lijst uit komen
						if(!newCurAddrs || newCurAddrs.length === 0) continue;
					}
				}
				else{ //we have our final value
					acc.push(curAddrs[i]);
				}
			}
			return acc;
		}

		
		//After this, we are sure to have a (possibly empty) list of final values
		foundAddresses = recurLookup(curAddr, prop, store, []);

		//If the lookup wasn't successful
		if(foundAddresses.length === 0) return false;

		/********************************************
		* Assemble/merge the results of recurLookup *
		*********************************************/

		//for every substitution, make a new SET of substitutions, one for each found address
		newMap = [];
		for(var s = 0; s < map.length; s++){
			for(var i = 0; i < foundAddresses.length; i++){
				var newO = {};
				//if it doesn't match a specified value
				if(!this.isResolvableVariable(addrName)){
					if (addrName !== foundAddresses[i]) continue;
				}
				//create new sub for the address
				newO[addrName] = foundAddresses[i];

				merged = this.merge(map[s], [newO]);
				if(merged) newMap.push(merged);
			}
		}
		map = newMap.slice();	
	}

	newMap = [];
	for(var i = 0; i < map.length; i++){
		merged = this.merge(map[i], subs);
		if(merged) newMap.push(merged);
	}
	map = newMap.slice();
	return map.length > 0 ? map : false;
}

AbstractQuery.processLookup = function(lookedUp){
	
	if(lookedUp.addresses() && lookedUp.addresses().values().length > 0){
		//console.log(lookedUp.addresses());
		//console.log(lookedUp.as.values());
		/*if(!lookedUp.as){
			console.log('Functions lookup is not supported yet!');
			return false;
		}*/
		return lookedUp.addresses().values();
	}
	return [lookedUp.toString()]; //change to false if we don't want values, TODO: wrap in list
}

AbstractQuery.matchState = function(el, tl, curTheta){
	var tlInfo = tl.state;
	var subst = [[]];
	var matchInfo, reified;
	var benv, store, mapping, newSubs, tmpSubs;
	//TODO herschrijven naar minder duplicate code
	for(var key in tlInfo){
		switch (key){
			case 'filters': 
						newSubs = [];
						for(var i = 0;i < subst.length; i++){
							tmpSubs = this.verifyConditions(subst[i], tlInfo[key], curTheta);
							if(tmpSubs) newSubs.push(tmpSubs);
						}
						subst = newSubs.slice();
						break;
			case 'properties': 
						newSubs = [];
						/*for(var i = 0;i < subst.length; i++){
							tmpSubs = this.addExtraProperties(subst[i], tlInfo[key], curTheta);
							if(tmpSubs) newSubs.push(tmpSubs);
						}*/
						for(var i = 0; i < subst.length; i++){
							matchInfo = this.addExtraProperties(subst[i], tlInfo[key], curTheta);//[[{},{}],[{},{}]]
							if(matchInfo){
								newSubs.push.apply(newSubs, matchInfo)
							}
						}
						subst = newSubs.slice();
						break;
			case 'lookup':
						benv = 	mapStateKey('benv', el);
						store = mapStateKey('store', el);
						mapping = tlInfo[key];

						//console.log(benv);
						if(!benv || !store) return false;

						//1. for each subst
						//2. getAddresses
						//3. put each subst of getAddresses in subst

						//Subs are already merged in getAddresses

						newSubs = [];
						for(var i = 0; i < subst.length; i++){
							matchInfo = this.getAddresses(mapping, benv, store, subst[i], curTheta);//[[{},{}],[{},{}]]
							if(matchInfo){
								//console.log(JSON.stringify(matchInfo));
								newSubs.push.apply(newSubs, matchInfo)
							}
						}
						//if(newSubs.length === 0) return false;
						subst = newSubs.slice();
						break;
			case 'value': 
						console.log('I WANT VALUE');
						break;
			default: 	reified = mapStateKey(key, el);
						//if(key === 'kont') console.log(key + '->' + reified);
						if(reified === undefined) return false;

						newSubs = [];
						for(var i = 0; i < subst.length; i++){
							tmpSubs = this.matchRecursive(key, tlInfo[key], reified, subst[i]); //[{},{}]
							if(tmpSubs){
								newSubs.push(tmpSubs)
							}
						}
						//if(newSubs.length === 0) return false;
						subst = newSubs.slice();
						//matchInfo = this.matchRecursive(key, tlInfo[key], reified); //[{},{}]
						//console.log(JSON.stringify(subst));
						//if(matchInfo){
						//	subst.push.apply(subst, matchInfo)
						//}
						//else{
						//	return false;
						//};
		}
	}
	//console.log(subst);

	return subst.length === 0 ? false : subst;
}

AbstractQuery.matchRecursive = function(key, value, statePart, subs){
	var reified, matchInfo, merged, tmp;

	subs = subs || [];
	if(value instanceof Array){
		console.log('ARRAY');
		//TODO overloop alle elems (momenteel skip)?
	}
	else if(value instanceof Object) {
		for(var k in value){
			reified = mapStateKey(k, statePart);

			//console.log(k)
			if(reified === undefined) return false;

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
			tmp = statePart;//JipdaInfo.getInfo(statePart);
			if(tmp === undefined){
				obj[value] = {name: "NotDefined"};
			}
			else{
				obj[value] =  tmp;
			}
			//obj[value] =  JipdaInfo.getInfo(statePart) || {name: "NotDefined"};
			//console.log(statePart);
			//console.log('----');
			//obj[value] =  statePart;
			//if(value == '?id') console.log('added ' + value + ' -> ' + statePart + ' to ' + JSON.stringify(subs));
			//subs.push(obj); //IN CASE ANYTHING GOES WRONG: REVERT TO THIS
			subs = AbstractQuery.merge(subs, [obj]);
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
	//console.log(JSON.stringify(theta));
	//console.log(JSON.stringify(otherTheta));
	//iterate over set 1
	var res = [];
	function mergeIterate(theta, otherTheta){
		var p;
		for(var i = 0; i < theta.length; i++){
			for(var prop in theta[i]){ //only one prop...
				if(theta[i].hasOwnProperty(prop)){
					p = findProp(otherTheta, prop);
					if(p !== undefined){ 
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
		return undefined;
	}

	theta = theta || [];
	otherTheta = otherTheta || [];
	res = mergeIterate(theta.slice(), otherTheta.slice()); //Changed this to merge copies instead of the actual arrays

	//console.log(JSON.stringify(res));
	//console.log('----');
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

	//console.log(key);
	//console.log(statePart[key] !== undefined ? statePart[key] : "UNDEFINED");

	switch (key){
		case 'this' : 	return JipdaInfo.getInfo(statePart); break;
		//case 'id'	: 	return JipdaInfo.getInfo(statePart['_id']); break;
		default		: 	return statePart[key] !== undefined ? JipdaInfo.getInfo(statePart[key]) : undefined;
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