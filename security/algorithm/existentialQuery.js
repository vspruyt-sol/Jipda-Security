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
			theta = this.match(tripleG.edge,tripleP.edge);
			for(var k = 0; k < theta.length; k++){
				this.union(W, [new WorklistTriple(tripleG.target, tripleP.target, theta[k])]);
			}
		}
	}

	var E = [];
	while(W.length > 0){
		tripleW = W.pop();
		R = this.union(R, tripleW);
		W = this.removeTriple(W, tripleW);
		for(var i = 0; i < this.G.length; i++){
			tripleG = this.G[i];
			for(var j = 0; j < this.P.length; j++){
				tripleP = this.P[j];
				theta = this.match(tripleG.edge,tripleP.edge);
				for(var k = 0; k < theta.length; k++){
					theta2 = this.merge(tripleW.theta, theta[k])
					if(theta2){
						tripleTemp = new WorklistTriple(tripleG.target, tripleP.target, theta2);
						if(!this.contains(R, tripleTemp)){
							W = this.union(W, [tripleTemp]);
						}
					}
				} //end for
			} //end for 
		} //end for
		if(this.contains(F, tripleW.s)){
			E = this.unionE(E, new VertexThetaPair(tripleW.v, tripleW.theta));
		}
	} //end while

}

ExistentialQuery.prototype.match = function(el, tl){
	//TODO
	//tl zal iets zijn als: type, occurence(1,+ of *), parameters afhankelijk van type
	//el is de edgelabel met zelfde info als node in een state.
	return [];
}

ExistentialQuery.prototype.merge = function(theta, otherTheta){
	//TODO
	return [];
}

ExistentialQuery.prototype.union = function(set, otherSet){
	var result = set.slice(0);
	for (var i = 0; i < otherSet.length; i++) {
        if (!result.contains(otherSet[i])) {
            result.push(otherSet[i]);
        }
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
        if (set[i].equals(elem)) {
            return true;
        }
    }
    return false;
}
