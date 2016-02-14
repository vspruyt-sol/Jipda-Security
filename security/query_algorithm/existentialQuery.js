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
								if(!this.contains(R, tripleTemp)){
									W = this.union(W, [tripleTemp]);
								}
							}
						}//end for		
					}
				} //end for 
			}
		} //end for
		
		if(this.contains(this.F, tripleW.s)){
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
							if(!this.contains(Rts, pairTemp)){
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
					if(!this.contains(R, tripleTemp)){
						W = this.union(W, [tripleTemp]);
					}
				}
			}
		}
		if(this.contains(this.F, tripleW.s)){
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
		case 'assign'		: 	_map = this.matchAssign(el, tl);
								break;
		case 'fCall'		: 	_map = this.matchFCall(el, tl); 
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

ExistentialQuery.prototype.matchAssign = function(el, tl){
	//tl can contain fields for: 
	//leftName
	var elInfo = el.node; //als deze niet bestaat dan hebben we Kont of iets dergelijks
	var tlInfo = tl.state;
	var subst = [];
	var _map = {};
	var info;

	if(elInfo && elInfo.type === 'ExpressionStatement' && elInfo.expression.type === 'AssignmentExpression'){		
		info = LOOKUP_INFO[elInfo.expression.type](elInfo.expression);
		if(!this.isWildCard(tlInfo.leftName)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.leftName] = info.leftName;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.rightName)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.rightName] = info.rightName;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.location)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.location] = info.location;
			subst.push(obj);
		}
	}
	else if(elInfo && elInfo.type === 'VariableDeclaration' && elInfo.declarations.length > 0){
		info = LOOKUP_INFO[elInfo.type](elInfo);
		//_map[tlInfo.leftName] = elInfo.expression.left.name;
		for(var i = 0; i < info.declarations.length; i++){
			if(!info.declarations[i].isFunction || (info.declarations[i].isFunction && tlInfo.canBeFunction)){ //check om te zien of er geassigned is
				if(!this.isWildCard(tlInfo.leftName)) {
					var obj = {};
					obj[tlInfo.leftName] = info.declarations[i].leftName;
					subst.push(obj);
				}
				if(!this.isWildCard(tlInfo.rightName)) {
					var obj = {};
					obj[tlInfo.rightName] = info.declarations[i].rightName;
					subst.push(obj);
				}
				if(!this.isWildCard(tlInfo.location)) {
					var obj = {};
					obj[tlInfo.location] = info.declarations[i].location;
					subst.push(obj);
				}
			}
		}	
	}
	else if(elInfo && elInfo.type === 'VariableDeclarator'){
		info = LOOKUP_INFO[elInfo.type](elInfo);
		if(!info.isFunction || (info.isFunction && tlInfo.canBeFunction)){
			if(!this.isWildCard(tlInfo.leftName)) {
				var obj = {};
				obj[tlInfo.leftName] = info.leftName;
				subst.push(obj);
			}
			if(!this.isWildCard(tlInfo.rightName)){
				var obj = {};
				obj[tlInfo.rightName] = info.rightName;
				subst.push(obj);
			}
			if(!this.isWildCard(tlInfo.location)){
				var obj = {};
				obj[tlInfo.location] = info.location;
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
	var info;
	//Momenteel voor arguments enkel ondersteuning voor literals/identifiers & single argument
	if(elInfo && elInfo.type === 'CallExpression'){
		info = LOOKUP_INFO[elInfo.type](elInfo);
		if (!this.isWildCard(tlInfo.argument)) {
			var obj = {}; 
			obj[tlInfo.argument] = argumentFirst(elInfo.arguments); 
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.arguments);
		}
		if (!this.isWildCard(tlInfo.callee)){
			var obj = {}; 
			obj[tlInfo.callee] = elInfo.callee.name; 
			subst.push(obj);
			//_map[tlInfo.callee] = elInfo.callee.name;
		}
		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
	}
	else if(elInfo && elInfo.type === 'ExpressionStatement' && elInfo.expression.type === 'CallExpression'){
		info = LOOKUP_INFO[elInfo.expression.type](elInfo.expression);
		if (!this.isWildCard(tlInfo.argument)) {
			var obj = {}; 
			obj[tlInfo.argument] = argumentFirst(elInfo.expression.arguments); 
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.expression.arguments);
		}	
		if (!this.isWildCard(tlInfo.callee)){
			var obj = {}; 
			obj[tlInfo.callee] = elInfo.expression.callee.name; 
			subst.push(obj);
			//_map[tlInfo.callee] = elInfo.expression.callee.name;
		}

		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
	}
	else if(elInfo && elInfo.type === 'BlockStatement' && elInfo.body.length === 1 
			&& elInfo.body[0].type === 'ExpressionStatement' 
			&& elInfo.body[0].expression.type === 'CallExpression'){
		info = LOOKUP_INFO[elInfo.body[0].expression.type](elInfo.body[0].expression);
		if (!this.isWildCard(tlInfo.argument)) {
			var obj = {};
			obj[tlInfo.argument] = argumentFirst(elInfo.body[0].expression.arguments); 
			subst.push(obj);
			//_map[tlInfo.argument] = argumentFirstLiteral(elInfo.body[0].expression.arguments);
		}
		if (!this.isWildCard(tlInfo.callee)) {
			var obj = {}; 
			obj[tlInfo.callee] =  elInfo.body[0].expression.callee.name ;
			subst.push(obj);
			//_map[tlInfo.callee] = elInfo.body[0].expression.callee.name;
		}

		//in order to be able to detect parameterless predicates
		if (subst.length === 0) subst.push({});
		//
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
	var info;
	if(elInfo && elInfo.type === 'ReturnStatement'){		
		info = LOOKUP_INFO[elInfo.type](elInfo);
		if(!this.isWildCard(tlInfo.value)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.value] = info.name;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.location)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.location] = info.location;
			subst.push(obj);
		}
	}
	else if(elInfo && elInfo.type === 'BlockStatement' && elInfo.body.length === 1 
			&& elInfo.body[0].type === 'ReturnStatement'){
		info = LOOKUP_INFO[elInfo.body[0].type](elInfo.body[0]);
		if(!this.isWildCard(tlInfo.value)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.value] = info.name;
			subst.push(obj);
		}
		if(!this.isWildCard(tlInfo.location)) {
			//_map[tlInfo.leftName] = elInfo.expression.left.name;
			var obj = {};
			obj[tlInfo.location] = info.location;
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
						if(!(p === theta[i][prop])){ //If not equal
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
					if(property === prop) return arr[i][property];
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
        if (!this.contains(result, otherSet[i])) {
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

ExistentialQuery.prototype.contains = function(set, elem){
	//console.log(JSON.stringify(set));
	//console.log(JSON.stringify(elem));
	
	for (var i = 0; i < set.length; i++) {
        if (set[i].equals(elem) || set[i] === elem) {
        	//console.log(true);
        	//console.log('----');
            return true;
        }
    }
    //console.log(false);
    //console.log('----');
    return false;
}

/**
 * EXTRACT INFO FROM JIPDA
 */

function JipdaInfo(){
}

JipdaInfo.assignmentExpression = function(exp){
	return {
		leftName	: LOOKUP_INFO[exp.left.type](exp.left).name,
		operator	: exp.operator,
		rightName	: LOOKUP_INFO[exp.right.type](exp.right).name,
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
	//calculate name if nested
	for(var i = 0; i < exp.properties.length; i++){
		tmp +=  LOOKUP_INFO[exp.properties[i].type](exp.properties[i]).name + ', ';
	}

	if (exp.properties.length > 0 )tmp = tmp.slice(0, -2);

	tmp += '}';

	return {
		name	: tmp,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.arrayExpression = function(exp){
	var tmp = '[';
	//calculate name if nested
	for(var i = 0; i < exp.elements.length; i++){
		tmp += LOOKUP_INFO[exp.elements[i].type](exp.elements[i]).name + ', ';
	}

	if (exp.elements.length > 0) tmp = tmp.slice(0, -2);

	tmp += ']'

	return {
		name	: tmp,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.property = function(exp){
	var k = LOOKUP_INFO[exp.key.type](exp.key).name;
	var v = LOOKUP_INFO[exp.value.type](exp.value).name;
	return {
		name	: k + ' : '+ v,
		key 	: k,
		value 	: v,
		kind	: exp.kind,
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.memberExpression = function(exp){
	var o = LOOKUP_INFO[exp.object.type](exp.object).name;
	var p = LOOKUP_INFO[exp.property.type](exp.property).name;

	return {
		object	: o,
		property: p,
		name 	: o + '['+ p + ']',
		location: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.variableDeclaration = function(exp){
	var decl, decls = [];
	var tmp = '';
	//calculate name if nested
	for(var i = 0; i < exp.declarations.length; i++){
		decl = LOOKUP_INFO[exp.declarations[i].type](exp.declarations[i]);
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
	var i = LOOKUP_INFO[exp.id.type](exp.id);
	var ini = LOOKUP_INFO[exp.init.type](exp.init);

	return {
		id 			: i.name,
		init 		: ini.name,
		leftName	: i.name,
		rightName 	: ini.name,
		name 		: i.name + ' = ' + ini.name,
		operator 	: '=',
		isFunction 	: (exp.init && exp.init.type === 'FunctionExpression'),
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.functionExpression = function(exp){
	var i = exp.id ? LOOKUP_INFO[exp.id.type](exp.id) : { name : 'Lambda' };
	var par = [];

	for(var j = 0; j < exp.params.length; j++){
		par.push(LOOKUP_INFO[exp.params[j].type](exp.params[j]));
	}

	return {
		name 		: i.name,
		id 			: i,
		parameters 	: par,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.callExpression = function(exp){
	var c = LOOKUP_INFO[exp.callee.type](exp.callee);
	var tmp = c.name + '(';
	var arg, args = [];
	for(var i = 0; i < exp.arguments.length; i++){
		arg = exp.arguments[i];
		args.push(LOOKUP_INFO[arg.type](arg));
		tmp += LOOKUP_INFO[arg.type](arg).name + ', ';
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
	var arg = LOOKUP_INFO[exp.argument.type](exp.argument);

	return {
		name 		: arg.name,
		argument 	: arg,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.binaryExpression = function(exp){
	var l = LOOKUP_INFO[exp.left.type](exp.left);
	var r = LOOKUP_INFO[exp.right.type](exp.right);

	return {
		name 		: l.name + ' ' + exp.operator + ' ' + r.name,
		left 		: l,
		right 		: r,
		operator 	: exp.operator,
		location 	: exp.loc.start.line + ' - ' + exp.loc.end.line,
	}
}

JipdaInfo.lookup = function(exp){
	//TODO
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
};
