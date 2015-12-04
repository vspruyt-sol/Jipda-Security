//TODO: MEMOIZATION & PRECOMPUTATION

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

ExistentialQuery.prototype.run = function(){
	//Debug
	var idx = 0;
	//used variables
	var tripleG, tripleP, theta, theta2,
		tripleW, tripleTemp;
	//start algorithm
	var R = [];
	var W = [];
	for(var i = 0; i < this.G.length; i++){
		tripleG = this.G[i];
		for(var j = 0; j < this.P.length; j++){
			tripleP = this.P[j];
			theta = this.match(tripleG.edge,tripleP.edge); //PROBLEEM: RETURNT {...}, moet array zijn? 
			for(var k = 0; k < theta.length; k++){
				W = this.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
			}
			//for(var property in theta){
			//	if(theta.hasOwnProperty(property)){
			//		W = this.union(W, [new WorklistTriple(tripleG.target, tripleP.target, ))])
			//	}
			//}
		}
	}
	//return W; //SHOULDNT BE HERE

	var E = [];
	while(W.length > 0){
		tripleW = W.pop();
		R = this.union(R, [tripleW]);
		//W = this.removeTriple(W, tripleW); //DONE BY POP()!
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];
				theta = this.match(tripleG.edge,tripleP.edge);
				//for(var property in theta){
				for(var k = 0; k < theta.length; k++){
					//if(theta.hasOwnProperty(property)){
						theta2 = this.merge(tripleW.theta, theta[k])
						if(theta2){
							tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
							if(!this.contains(R, tripleTemp)){
								W = this.union(W, [tripleTemp]);
								
							}
						}
					//}
				}//end for
			} //end for 
		} //end for
		if(this.contains(this.F, tripleW.s)){
			E = this.union(E, [new VertexThetaPair(tripleW.v, tripleW.theta)]);
		}
	} //end while
	return E;
}

ExistentialQuery.prototype.match = function(el, tl){
	//Given an edge label el and a transition label tl, let match(tl,el), 
	//which takes a set of symbols as an implicit argument, be the set of minimal substitutions θ 
	//such that el matches tl under θ. The resulting set has at most one element when tl contains 
	//no negations but can be very large otherwise. For example, match(use(a),¬use(x)) is the set of 
	//substitutions of the form {x 􏰀→ b}, where b is any symbol other than a.
	var substitutions = [];
	var _map = {};
	switch(tl.name){
		case 'assign'		: substitutions.push(this.matchAssign(el, tl)); break;
		case 'fCall'		: substitutions.push(this.matchFCall(el, tl)); break;
		case 'dummy'		: break;
		default:
			throw "Can not handle 'tl.name'. Source: ExistentialQuery.match(el, tl)"
	}
	substitutions.push(_map);
	return substitutions; //substitution
}

// MATCHING
// TODO BLOCKSTATEMENTS MET 1 ELEMENT
// TODO CHECK FOR NOT/WILDCARDS
ExistentialQuery.prototype.matchAssign = function(el, tl){
	//tl can contain fields for: 
	//leftName
	var elInfo = el.info;
	var tlInfo = tl.info;
	var _map = {};
	if(el.name === 'ExpressionStatement' && elInfo.expression.type === 'AssignExpression'){
		if(tlInfo.leftName) _map[tlInfo.leftName] = elInfo.expression.left.name;
	}
	return _map;
}

ExistentialQuery.prototype.matchFCall = function(el, tl){
	//tl can contain fields for: 
	//argument
	//callee
	var elInfo = el.info;
	var tlInfo = tl.info;

	var argumentFirstLiteral = function(args){
		for(var i = 0; i < args.length; i++){
			if(args[i].type === 'Literal') return args[i].name;
		}
	return false;
	}

	var _map = {};
	//Momenteel voor arguments enkel ondersteuning voor literals & single argument
	if(el.name === 'CallExpression'){
		if (tlInfo.argument) _map[tlInfo.argument] = argumentFirstLiteral(elInfo.arguments);
		if (tlInfo.callee) _map[tlInfo.callee] = elInfo.callee.name;
	}
	else if(el.name === 'ExpressionStatement' && elInfo.expression.type === 'CallExpression'){
		if (tlInfo.argument) _map[tlInfo.argument] = argumentFirstLiteral(elInfo.expression.arguments);
		if (tlInfo.callee) _map[tlInfo.callee] = elInfo.expression.callee.name;
	}
	else if(el.name === 'BlockStatement' && elInfo.body.length === 1 
			&& elInfo.body[0].type === 'ExpressionStatement' 
			&& elInfo.body[0].expression.type === 'CallExpression'){
		if (tlInfo.argument) _map[tlInfo.argument] = argumentFirstLiteral(elInfo.body[0].expression.arguments);
		if (tlInfo.callee) _map[tlInfo.callee] = elInfo.body[0].expression.callee.name;
	}
	return _map; //substitution
}
// END MATCHING

ExistentialQuery.prototype.merge = function(theta, otherTheta){
	//TODO
	//(1) undefined if any two substitutions in S disagree on the mapping 
	//of any variable in the intersection of their domains and 
	//(2) the union of the substitutions in S otherwise.
	//iterate over set 1
	for (var property in theta) {
	    if (theta.hasOwnProperty(property)) {
	        if(otherTheta[property]){
	        	if(otherTheta[property] !== theta[property]) return false;
	        }
	        else{
	        	otherTheta[property] = theta[property];
	        }
	    }
	}

	return otherTheta;
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
	for (var i = 0; i < set.length; i++) {
        if (set[i].equals(elem) || set[i] === elem) {
            return true;
        }
    }
    return false;
}
