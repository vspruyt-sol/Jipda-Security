var EMPTY_SET_NEGATION = [[{}]];

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
		if(tl.negated) return EMPTY_SET_NEGATION;
		substitutions.push(_map);

	}
	return tl.negated ? [[]] : substitutions; //substitution	
}

// MATCHING
ExistentialQuery.prototype.isWildCard = function(x){
	return (x === undefined || (x === '_')); 
}

ExistentialQuery.prototype.matchState = function(el, tl){
	var tlInfo = tl.state;
	var subst = [];
	var matchInfo, reified;

	for(var key in tlInfo){
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
			console.log('statePart');
			console.log(JipdaInfo.lookup(statePart))
			console.log(statePart);
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
        if (_.isEqual(set[i], elem) || set[i] === elem) {
            return true;
        }
    }
    return false;
}

/**
 * EXTRACT INFO FROM JIPDA
 */

function JipdaInfo(){
}

JipdaInfo.assignmentExpression = function(exp){
	var l = JipdaInfo.lookup(exp.left);
	var r = JipdaInfo.lookup(exp.right);
	return {
		leftName	: l.nodeInfo.name,
		left 		: l.nodeInfo,
		operator	: exp.operator,
		rightName	: r.nodeInfo.name,
		right 		: r.nodeInfo,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.identifier = function(exp){
	return {
		name 	: exp.name,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.literal = function(exp){
	return {
		name	: exp.raw,
		raw		: exp.raw,
		value	: exp.value,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.objectExpression = function(exp){
	var tmp = '{';
	var arr = [];
	//calculate name if nested
	for(var i = 0; i < exp.properties.length; i++){
		arr.push(properties[i]);
		tmp +=  JipdaInfo.lookup(exp.properties[i]).nodeInfo.name + ', ';
	}

	if (exp.properties.length > 0 )tmp = tmp.slice(0, -2);

	tmp += '}';

	return {
		name		: tmp,
		properties 	: arr,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.arrayExpression = function(exp){
	var tmp = '[';
	//calculate name if nested
	for(var i = 0; i < exp.elements.length; i++){
		tmp += JipdaInfo.lookup(exp.elements[i]).nodeInfo.name + ', ';
	}

	if (exp.elements.length > 0) tmp = tmp.slice(0, -2);

	tmp += ']'

	return {
		name	: tmp,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.property = function(exp){
	var k = JipdaInfo.lookup(exp.key).nodeInfo.name;
	var v = JipdaInfo.lookup(exp.value).nodeInfo.name;
	return {
		name	: k + ' : '+ v,
		key 	: k,
		value 	: v,
		kind	: exp.kind,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.memberExpression = function(exp){
	var prop = [];
	var o = JipdaInfo.lookup(exp.object).nodeInfo;
	var p = JipdaInfo.lookup(exp.property).nodeInfo;
	
	if(o.properties) prop.push.apply(prop, o.properties);
	prop.push(p.name);

	return {
		object	 	: o.name,
		property 	: p.name,
		properties 	: prop,
		name 		: o.name + '['+ p.name + ']',
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.variableDeclaration = function(exp){
	var decl, decls = [];
	var tmp = '';
	//calculate name if nested
	for(var i = 0; i < exp.declarations.length; i++){
		decl = JipdaInfo.lookup(exp.declarations[i]).nodeInfo;
		tmp += decl.name + ', ';
		decls.push(decl);
	}

	tmp = tmp.slice(0, -2);

	return {
		name 		: tmp,
		declarations: decls,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.variableDeclarator = function(exp){
	var i = JipdaInfo.lookup(exp.id).nodeInfo;
	var ini = JipdaInfo.lookup(exp.init).nodeInfo;

	return {
		id 			: i.name,
		init 		: ini.name,
		leftName	: i.name,
		left 		: i,
		rightName 	: ini.name,
		right 		: ini,
		name 		: i.name + ' = ' + ini.name,
		operator 	: '=',
		isFunction 	: (exp.init && exp.init.type === 'FunctionExpression'),
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.functionExpression = function(exp){
	var i = exp.id ? JipdaInfo.lookup(exp.id).nodeInfo : { name : 'Lambda' };
	var par = [];

	for(var j = 0; j < exp.params.length; j++){
		par.push(JipdaInfo.lookup(exp.params[j]).nodeInfo);
	}

	return {
		name 		: i.name,
		id 			: i,
		parameters 	: par,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.callExpression = function(exp){
	var c = JipdaInfo.lookup(exp.callee).nodeInfo;
	var tmp = c.name + '(';
	var arg, args = [];
	for(var i = 0; i < exp.arguments.length; i++){
		arg = exp.arguments[i];
		args.push(JipdaInfo.lookup(arg).nodeInfo);
		tmp += JipdaInfo.lookup(arg).nodeInfo.name + ', ';
	}

	if (exp.arguments.length > 0) tmp = tmp.slice(0, -2);
	tmp +=  ')';

	return {
		//name 		: tmp,
		name 		: c.name,
		arguments 	: args,
		callee 		: c,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.returnStatement = function(exp){
	var arg = JipdaInfo.lookup(exp.argument).nodeInfo;

	return {
		name 		: arg.name,
		argument 	: arg,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.binaryExpression = function(exp){
	var l = JipdaInfo.lookup(exp.left).nodeInfo;
	var r = JipdaInfo.lookup(exp.right).nodeInfo;

	return {
		name 		: l.name + ' ' + exp.operator + ' ' + r.name,
		left 		: l,
		right 		: r,
		operator 	: exp.operator,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.expressionStatement = function(exp){
	var ex = JipdaInfo.lookup(exp.expression).nodeInfo;

	return {
		name 		: ex.name,
		expression	: ex,
		location 	: ex.loc.start.line + ' - ' + ex.loc.end.line,
	}
}

JipdaInfo.blockStatement = function(exp){
	var elem, elems = [];
	//calculate name if nested
	for(var i = 0; i < exp.body.length; i++){
		elems.push(JipdaInfo.lookup(exp.body[i]).nodeInfo);
	}

	return {
		name 		: 'BlockStatement',
		body		: elems,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.lookup = function(exp, el){
	var nodeInfo = {};
	var kontInfo = {};

	var kont = el ? el.kont : false;
	if(exp && exp.type) nodeInfo = LOOKUP_INFO[exp.type](exp);
	if(kont){
		if(kont.ex) kontInfo.ex = LOOKUP_INFO[kont.ex.type](kont.ex);
	} 

	return {
		nodeInfo : nodeInfo,
		kontInfo : kontInfo,
	}
}

var LOOKUP_INFO = {
	'AssignmentExpression' 	: JipdaInfo.assignmentExpression,
	'Identifier'			: JipdaInfo.identifier,
	'Literal'				: JipdaInfo.literal,
	'ObjectExpression'		: JipdaInfo.objectExpression,
	'ArrayExpression'		: JipdaInfo.arrayExpression,
	'Property'				: JipdaInfo.property,
	'MemberExpression'		: JipdaInfo.memberExpression,
	'VariableDeclaration'	: JipdaInfo.variableDeclaration,
	'VariableDeclarator'	: JipdaInfo.variableDeclarator,
	'FunctionExpression' 	: JipdaInfo.functionExpression,
	'CallExpression' 		: JipdaInfo.callExpression,
	'ReturnStatement' 		: JipdaInfo.returnStatement,
	'BinaryExpression' 		: JipdaInfo.binaryExpression,
	'ExpressionStatement'	: JipdaInfo.expressionStatement,
	'BlockStatement'		: JipdaInfo.blockStatement,
};
