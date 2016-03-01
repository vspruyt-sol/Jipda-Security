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
					theta = this.match(tripleG.edge,tripleP.edge);
					for(var k = 0; k < theta.length; k++){
						W = this.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	var E = [];
	while(W.length > 0){
		tripleW = W.shift();
		R = this.union(R, [tripleW]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(tripleW.v)){ //KLOPT DIT WEL????
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];	
					if(tripleP.from.equals(tripleW.s)){ //KLOPT DIT WEL????
						//CHECK LAMBDA
						//UITCOMMENTEN VOOR NEGATIE
						theta = this.match(tripleG.edge,tripleP.edge); //theta = [[{x:a},{callee:sink}]]
						for(var k = 0; k < theta.length; k++){
							theta2 = this.merge(tripleW.theta, theta[k]);
							if(theta2){
						
						//komt in plaats
						//theta2 = this.extensions(tripleW.theta, tripleP.edge); // [[{},{}],[{},{}]]
						//for(var k = 0; k < theta2.length; k++){
						//	if(this.match(tripleG.edge, tripleP.edge)){ //match(el, theta2(tl)) != {{}} KAN PROBLEMEN GEVEN
						//einde komt in plaats
								tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
								if(!contains(R, tripleTemp)){
									W = this.union(W, [tripleTemp]);
								}
							}
						}//end for		
					}
				} //end for 
			}
		} //end for
		
		if(contains(this.F, tripleW.s)){
			E = this.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
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
					theta = this.match(tripleG.edge,tripleP.edge);
					for(var k = 0; k < theta.length; k++){
						W = this.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	var E = [];
	while(W.length > 0){
		tripleW = W.shift();
		R = this.union(R, [tripleW]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(tripleW.v)){ //KLOPT DIT WEL????
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];	
					if(tripleP.from.equals(tripleW.s)){
						//if tripleP.edge.negated && allBound(tripleP.edge, tripleW.theta)
						//theta2 = this.extensions()
						//doe 'modified' matching (als ok return je lege substitutie!)
						//if(!tripleP.edge.negated){
							theta = this.match(tripleG.edge,tripleP.edge);
							for(var k = 0; k < theta.length; k++){
								theta2 = this.merge(tripleW.theta, theta[k]);
								if(theta2){
									tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
									if(!contains(R, tripleTemp)){
										W = this.union(W, [tripleTemp]);
									}
								}
							}//end for
						//}//if !negated
						//else{
							//if all are bound

						//}			
					}
				} //end for 
			}
		} //end for
		
		if(contains(this.F, tripleW.s)){
			E = this.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
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
					theta = this.match(tripleG.edge,tripleP.edge); 
					for(var k = 0; k < theta.length; k++){
						W = this.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
						Wts = this.union(Wts, [new VertexPair(tripleG.target, tripleP.target)]);
						Mts = this.union(Mts, [new Quintuple(tripleG.from, tripleP.from, tripleG.target, tripleP.target, theta[k])]);
					}
				}
			}
		}
	}
	while(Wts.length > 0){
		pairWts = Wts.pop();
		Rts = this.union(Rts, [pairWts]);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			if(tripleG.from.equals(pairWts.v)){ 
				for(var j = 0; j < this.P.length; j++){
					tripleP = this.P[j];			
					if(tripleP.from.equals(pairWts.s)){
						theta = this.match(tripleG.edge,tripleP.edge);
						for(var k = 0; k < theta.length; k++){
							pairTemp = new VertexPair(tripleG.target, tripleP.target);
							if(!contains(Rts, pairTemp)){
								Wts = this.union(Wts, [pairTemp]);
								Mts = this.union(Mts, [new Quintuple(tripleG.from, tripleP.from, tripleG.target, tripleP.target, theta[k])])
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
		R = this.union(R, [tripleW]);
		for(var i = 0; i < Mts.length; i++){
			quintupleMts = Mts[i];
			if(quintupleMts.vfrom.equals(tripleW.v) && quintupleMts.sfrom.equals(tripleW.s)){
				theta2 = this.merge(tripleW.theta, quintupleMts.theta);
				if(theta2){
					tripleTemp = new WorklistTriple(quintupleMts.vto, quintupleMts.sto, theta2);
					if(!contains(R, tripleTemp)){
						W = this.union(W, [tripleTemp]);
					}
				}
			}
		}
		if(contains(this.F, tripleW.s)){
			E = this.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
		}
	} //end while
	//END UPDATE WORKLIST
	return E;
}

ExistentialQuery.prototype.extensions = function(theta, tl){

}

ExistentialQuery.prototype.match = function(el, tl){
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
		case 'assign'		: 	_map = this.matchAssign(el, tl);
								break;
		case 'fCall'		: 	_map = this.matchFCall(el, tl); 
								break;
		case 'endFCall'		: 	_map = this.matchEndFCall(el, tl); 
								break;
		case 'return'		: 	_map = this.matchReturn(el, tl); 
								break;
		case '_'			: 	_map = []; 
								break;
		case 'dummy'		: 	_map = [];
								break;
		default:
			throw "Can not handle 'tl.name': " + tl.name + ". Source: ExistentialQuery.match(el, tl)"
	}

	//TODO
	//Als Substitutions elementen bevat, dan matcht el tl onder theta
	//M.a.w. moeten we {{}} returnen, anders returnen we {}
	if(_map){
		if(tl.negated) return [];
		substitutions.push(_map);
	}
	return tl.negated ? [[{}]] : substitutions; //substitution	
}

// MATCHING
ExistentialQuery.prototype.isWildCard = function(x){
	return (x === undefined || (x === '_')); 
}

var isResolvableVariable = function(x){
	return (typeof x === 'string' && x.charAt(0) === '?');
}

ExistentialQuery.prototype.resolveVariable = function(varName, table){
	for(var i = 0; i < table.length; i++){
		if(table[i][varName]) return table[i][varName];
	}
	return false;
}

ExistentialQuery.prototype.verifyConditions = function(table, conds){

	//als er iets foutgelopen is is de tabel leeg:
	if(table.length === 0) return [];

	var func, args, resolvedArg, resolvedArgs = [];
	for(var j = 0; j < conds.length; j++){
		func = conds[j][0];
		args = conds[j][1];
		for(var i = 0; i < args.length; i++){
			if(isResolvableVariable(args[i])){
				resolvedArg = this.resolveVariable(args[i], table);
				if(!resolvedArg) throw 'could not resolve argument ' + args[i];
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

ExistentialQuery.prototype.addExtraProperties = function(table, props){
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
				if(isResolvableVariable(args[i])){
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

ExistentialQuery.prototype.matchState = function(el, tl){
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

ExistentialQuery.prototype.matchRecursive = function(key, value, statePart, subs){
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

//TEMP test function (maps keys to state keys)
var mapStateKey = function(key, statePart){
	//TODO:do some reifying
	return statePart[key] ? statePart[key] : false;
}

ExistentialQuery.prototype.matchAssign = function(el, tl){
	//tl can contain fields for: 
	//leftName
	var elInfo = el.node; //als deze niet bestaat dan hebben we Kont of iets dergelijks
	var tlInfo = tl.state;
	var subst = [];
	var _map = {};
	var info, nodeInfo, kontInfo;

	if(elInfo && elInfo.type === 'ExpressionStatement' && elInfo.expression.type === 'AssignmentExpression'){		
		info = JipdaInfo.lookup(elInfo.expression, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if(!this.isWildCard(tlInfo.leftName)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.leftName] = nodeInfo.leftName;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.rightName)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.rightName] = nodeInfo.rightName;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.rightArgument) && nodeInfo.right.arguments) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.rightArgument] = nodeInfo.right.arguments[0].name;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.location)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.location] = nodeInfo.location;
			subst.push(obj);
		}
	}
	else if(elInfo && elInfo.type === 'VariableDeclaration' && elInfo.declarations.length > 0){
		info = JipdaInfo.lookup(elInfo, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		console.log(tlInfo);
		//_map[tlInfo.leftName] = elInfo.expression.left.name;
		for(var i = 0; i < nodeInfo.declarations.length; i++){
			if(!nodeInfo.declarations[i].isFunction || (nodeInfo.declarations[i].isFunction && tlInfo.canBeFunction)){ //check om te zien of er geassigned is
				if(!this.isWildCard(tlInfo.leftName)) {
					var obj = {};
					console.log(info);
					console.log('declarations?');
					obj[tlInfo.leftName] = nodeInfo.declarations[i].leftName;
					subst.push(obj);
				}
				if(!this.isWildCard(tlInfo.rightName)) {
					var obj = {};
					obj[tlInfo.rightName] = nodeInfo.declarations[i].rightName;
					subst.push(obj);
				}
				if(!this.isWildCard(tlInfo.rightArgument) && nodeInfo.declarations[i].right.arguments) {
					//_map[tlInfo.leftName] = elInfo.expression.left.name;
					var obj = {};
					obj[tlInfo.rightArgument] = nodeInfo.declarations[i].right.arguments[0].name;
					subst.push(obj);
				}
				if(!this.isWildCard(tlInfo.location)) {
					var obj = {};
					obj[tlInfo.location] = nodeInfo.declarations[i].location;
					subst.push(obj);
				}
			}
		}	
	}
	else if(elInfo && elInfo.type === 'VariableDeclarator'){
		info = JipdaInfo.lookup(elInfo, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if(!nodeInfo.isFunction || (nodeInfo.isFunction && tlInfo.canBeFunction)){
			if(!this.isWildCard(tlInfo.leftName)) {
				var obj = {};
				obj[tlInfo.leftName] = nodeInfo.leftName;
				subst.push(obj);
			}
			if(!this.isWildCard(tlInfo.rightName)){
				var obj = {};
				obj[tlInfo.rightName] = nodeInfo.rightName;
				subst.push(obj);
			}
			if(!this.isWildCard(tlInfo.rightArgument) && nodeInfo.right.arguments) {
				//_map[tlInfo.leftName] = elInfo.expression.left.name;
				var obj = {};
				obj[tlInfo.rightArgument] = nodeInfo.right.arguments[0].name;
				subst.push(obj);
			}
			if(!this.isWildCard(tlInfo.location)){
				var obj = {};
				obj[tlInfo.location] = nodeInfo.location;
				subst.push(obj);
			}
		}
	}
	return (subst.length === 0 ? false : subst);
}

ExistentialQuery.prototype.matchFCall = function(el, tl){
	//tl can contain fields for: 
	//argument
	//callee
	var elInfo = el.node;
	var tlInfo = tl.state;
	
	var argumentFirst = function(args){
		for(var i = 0; i < args.length; i++){
			return args[i].name;
		}
		return 'No arguments';
	}

	var subst = [];
	var _map = {};
	var info, nodeInfo, kontInfo;
	//Momenteel voor arguments enkel ondersteuning voor literals/identifiers & single argument
	if(elInfo && elInfo.type === 'CallExpression'){
		info = JipdaInfo.lookup(elInfo, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if (!this.isWildCard(tlInfo.argument)) {
			var obj = {}; 
			obj[tlInfo.argument] = argumentFirst(nodeInfo.arguments); 
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.arguments);
		}
		if (!this.isWildCard(tlInfo.callee)){
			var obj = {}; 
			obj[tlInfo.callee] = nodeInfo.callee.name; 
			subst.push(obj);
			//_map[tlInfo.callee] = elInfo.callee.name;
		}
		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
	}
	else if(elInfo && elInfo.type === 'ExpressionStatement' && elInfo.expression.type === 'CallExpression'){
		info = JipdaInfo.lookup(elInfo.expression, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if (!this.isWildCard(tlInfo.argument)) {
			var obj = {}; 
			obj[tlInfo.argument] = argumentFirst(nodeInfo.arguments); 
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.expression.arguments);
		}	
		if (!this.isWildCard(tlInfo.callee)){
			var obj = {}; 
			obj[tlInfo.callee] = nodeInfo.callee.name; 
			subst.push(obj);
			//_map[tlInfo.callee] = elInfo.expression.callee.name;
		}

		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
	}
	else if(elInfo && elInfo.type === 'BlockStatement' && elInfo.body.length === 1 
			&& elInfo.body[0].type === 'ExpressionStatement' 
			&& elInfo.body[0].expression.type === 'CallExpression'){
		info = JipdaInfo.lookup(elInfo.body[0].expression, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if (!this.isWildCard(tlInfo.argument)) {
			var obj = {};
			obj[tlInfo.argument] = argumentFirst(nodeInfo.arguments); 
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.body[0].expression.arguments);
		}
		if (!this.isWildCard(tlInfo.callee)) {
			var obj = {}; 
			console.log(info);
			obj[tlInfo.callee] = nodeInfo.callee.name ;
			subst.push(obj);
			//_map[tlInfo.callee] = elInfo.body[0].expression.callee.name;
		}

		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
		//
	}
	return (subst.length === 0 ? false : subst); //substitution
}

ExistentialQuery.prototype.matchEndFCall = function(el, tl){

	//End of function call can also be a return
	var retRes = this.matchReturn(el, tl);
	if(retRes) return retRes;

	//search no further (small hack with constructor)
	if(el.constructor.name !== 'KontState' || el.lkont.length != 0) return false; 
	var elKont = el.kont;
	var tlInfo = tl.state;

	var subst = [];
	//var _map = {};
	var info, nodeInfo, kontInfo;
	if(elKont.ex.type === 'CallExpression'){
		info = JipdaInfo.lookup(elKont, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if (!this.isWildCard(tlInfo.name)) {
			var obj = {}; 
			obj[tlInfo.name] = kontInfo.ex.name
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.arguments);
		}
		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
	}
	
	
	return (subst.length === 0 ? false : subst); //substitution
}

ExistentialQuery.prototype.matchReturn = function(el, tl){
	//tl can contain fields for: 
	//leftName
	var elInfo = el.node; //als deze niet bestaat dan hebben we Kont of iets dergelijks
	var tlInfo = tl.state;
	var subst = [];
	var _map = {};
	var info, nodeInfo, kontInfo;
	if(elInfo && elInfo.type === 'ReturnStatement'){
		info = JipdaInfo.lookup(elInfo, el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;		
		if(!this.isWildCard(tlInfo.value)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.value] = nodeInfo.name;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.location)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.location] = nodeInfo.location;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.name)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.name] = kontInfo.ex.name;
			subst.push(obj);
		}
	}
	else if(elInfo && elInfo.type === 'BlockStatement' && elInfo.body.length === 1 
			&& elInfo.body[0].type === 'ReturnStatement'){
		info = JipdaInfo.lookup(elInfo.body[0], el);
		nodeInfo = info.nodeInfo;
		kontInfo = info.kontInfo;
		if(!this.isWildCard(tlInfo.value)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.value] = nodeInfo.name;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.location)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.location] = nodeInfo.location;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.name)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.name] = kontInfo.ex.name;
			subst.push(obj);
		}
	}
	return (subst.length === 0 ? false : subst);
}
// END MATCHING

ExistentialQuery.prototype.merge = function(theta, otherTheta){
	//(1) undefined if any two substitutions in S disagree on the mapping 
	//of any variable in the intersection of their domains and 
	//(2) the union of the substitutions in S otherwise.
	//iterate over set 1
	/*for (var property in theta) {
	    if (theta.hasOwnProperty(property)) {
	        if(otherTheta[property]){
	        	if(otherTheta[property] !== theta[property]) return false;
	        }
	        else{
	        	otherTheta[property] = theta[property];
	        }
	    }
	}
	
	return otherTheta;*/

	var res = [];
	function mergeIterate(theta, otherTheta){
		var p;
		for(var i = 0; i < theta.length; i++){
			for(var prop in theta[i]){ //only one prop...
				if(theta[i].hasOwnProperty(prop)){
					p = findProp(otherTheta, prop);
					if(p){ 
						if(!(Utilities.myEqual(p,theta[i][prop]))){ //If not equal
							console.log('Not equal');
							console.log(p, theta[i][prop]);
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
					if(Utilities.myEqual(property,prop)) return arr[i][property];
				}
			}
		}
		return false;
	}

	/*function setProp(arr, prop, val){
		for(var i = 0; i <  arr.length; i++){
			for(var property in arr[i]){
				if(arr[i].hasOwnProperty(property)){
					if(property === prop) arr[i][property] = val;
				}
			}
		}
	}*/
	res = mergeIterate(theta, otherTheta);

	return res;
}

ExistentialQuery.prototype.union = function(set, otherSet, debug){
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

ExistentialQuery.prototype.removeTriple = function(set, triple){
	return set.filter(function(x){
		return (x.from !== triple.from && x.target !== triple.target);
	});
}

var contains = function(set, elem){	
	for (var i = 0; i < set.length; i++) {
        if (Utilities.myEqual(set[i], elem) || set[i] === elem) {
            return true;
        }
    }
    return false;
}