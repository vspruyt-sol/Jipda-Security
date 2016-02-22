function RegularPathExpression(){ 
	//Index x represents edge with label 'x' in the NFA 
	this._map = [];
	//Check braces
	this.depth = 0;
	//Contains the NFA with its graph triples
	this.nfa = [];
}

/**
 * -----------------------
 * USER DEFINED PREDICATES
 * -----------------------
 */



RegularPathExpression.prototype.udAssign = function(obj){ //obj -> {left: '?left', right: '3'} bvb
	//todo fill in params
	var s = {};
	//make vars optional
	if(obj['left']) 		setupStateChain(s, ['node','expression','left'], obj['left']);
	if(obj['right']) 		setupStateChain(s, ['node','expression','right'], obj['right']);

	return this.state(s);
}

RegularPathExpression.prototype.udFindAlias = function(obj){ //obj -> {aliasFor: '?a', alias: '?alias'}
	//todo fill in params
	var s1 = {};
	//make vars optional
	if(obj['aliasFor']) setupStateChain(s1, ['node','expression','left','name'], obj['aliasFor']);

	var s2 = {};
	if(obj['aliasFor']) setupStateChain(s2, ['node','expression','right','name'], obj['aliasFor']);
	if(obj['alias']) 	setupStateChain(s2, ['node','expression','left','name'], obj['alias']);

	return this.state(s1).skipZeroOrMore().state(s2);
}

/**
 * ----------------
 * THINGS TO DETECT
 * ----------------
 */

//State
RegularPathExpression.prototype.state = function(obj){
	this._map.push(new RegexPart('state', obj, 'idx' + this._map.length));
	//Fluent API
	return this;
}

//Assignment
RegularPathExpression.prototype.assign = function(obj){
	this._map.push(new RegexPart('assign', obj, 'idx' + this._map.length));
	//Fluent API
	return this;
}

//Function calls
RegularPathExpression.prototype.fCall = function(obj){
	this._map.push(new RegexPart('fCall', obj, 'idx' + this._map.length));
	//Fluent API
	return this;
}

//End of function calls
RegularPathExpression.prototype.endFCall = function(obj){
	this._map.push(new RegexPart('endFCall', obj, 'idx' + this._map.length));
	//Fluent API
	return this;
}

//Return statements
RegularPathExpression.prototype.return = function(obj){
	this._map.push(new RegexPart('return', obj, 'idx' + this._map.length));
	//Fluent API
	return this;
}

/**
 * ----------
 * DELIMITERS
 * ----------
 */

//Left brace
RegularPathExpression.prototype.lBrace = function(obj){
	this.depth++;
	this._map.push(new RegexPart('lBrace', obj, '('));
	//Fluent API
	return this;
}

//Right brace
RegularPathExpression.prototype.rBrace = function(obj){
	if(this.depth === 0) throw 'Can\'t close a non-existing brace. Check brace order';
	
	this.depth--;
	this._map.push(new RegexPart('rBrace', obj, ')'));
	//Fluent API
	return this;
}

//or
RegularPathExpression.prototype.or = function(obj){
	this._map.push(new RegexPart('or', obj, '|'));
	//Fluent API
	return this;
}

//Wildcard
RegularPathExpression.prototype.wildcard = function(obj){

	this._map.push(new RegexPart('wildcard', obj, '_'));
	//Fluent API
	return this;
}

//Not
RegularPathExpression.prototype.not = function(obj){

	this._map.push(new RegexPart('not', obj, '¬'));
	//Fluent API
	return this;
}

//Star
RegularPathExpression.prototype.star = function(obj){

	this._map.push(new RegexPart('star', obj, '*'));
	//Fluent API
	return this;
}

//Wildcard followed by Star
RegularPathExpression.prototype.skipZeroOrMore = function(obj){

	this._map.push(new RegexPart('wildcard', obj, '_'));
	this._map.push(new RegexPart('star', obj, '*'));
	//Fluent API
	return this;
}

//Wildcard followed by Plus
RegularPathExpression.prototype.skipOneOrMore = function(obj){

	this._map.push(new RegexPart('wildcard', obj, '_'));
	this._map.push(new RegexPart('plus', obj, '+'));
	//Fluent API
	return this;
}


//Plus
RegularPathExpression.prototype.plus = function(obj){

	this._map.push(new RegexPart('plus', obj, '+'));
	//Fluent API
	return this;
}

/*
 * ----
 * MISC
 * ----
 */

RegularPathExpression.prototype.toString = function(obj){
	return this._map.map(function(x){ return x.toString(); }).join('');
}

RegularPathExpression.prototype.toPrettyString = function(obj){
	return this._map.map(function(x){ return x.toString() + '\n'; }).join('.');
}


/**
 * -------------
 * BUILD NFA/DFA
 * -------------
 */
RegularPathExpression.prototype.toNFA = function(){
	if(this.depth !== 0) throw 'Not all braces are closed!'; 
	var tsc = new ThompsonConstruction();
	//returns a finite state machine, we need to convert it to array of graph triples, e.g.:
	// new GraphTriple(new DummyNode(1), new EdgeLabel('assign', {leftName: 'x'}), new DummyNode(2))
	var fsm = tsc.toNFA(this._map);
	var nfa = new Automaton();
	//One way to make a nfa, from a FSM
	nfa.fromFSM(fsm, this._map); //built so that NFA's don't depend on FSM's per sé.
	//return the NFA
	return nfa;
}

RegularPathExpression.prototype.toDFA = function(){
	if(this.depth !== 0) throw 'Not all braces are closed!'; 
	
	var tsc = new ThompsonConstruction();
	var ssc = new SubsetConstruction();
	
	var nfa = tsc.toNFA(this._map);
	var newFsm = ssc.toDFA(nfa);

	var dfa = new Automaton();
	dfa.fromFSM(newFsm, this._map);

	//return the DFA
	return dfa;


}

/**
 * -----------------------
 * TESTSTRUCTURE FOR REGEX
 * -----------------------
 */

 function RegexPart(name, obj, symbol){
 	this.name = name;
 	this.symbol = symbol;
 	this.obj = obj;
 }

RegexPart.prototype.toString = function(){
	if (this.symbol) return this.symbol;
	var str = this.obj ? JSON.stringify(this.obj) : '';
	return this.name + '(' + str +')';
}


/**
 * -------
 * HELPERS
 * -------
 */

var setupStateChain = function(obj, chain, val){
	var cur = obj;
	for(var i = 0; i < chain.length; i++){
		if(i === chain.length - 1){
			cur[chain[i]] = val;
		}
		else{
			if(!cur[chain[i]]) cur[chain[i]] = {};
			cur = cur[chain[i]];
		}
		
	}
}

//Builtin functions for conditions
var cond = function(f){
	var args = Array.prototype.slice.call(arguments, 1);

	//lookup function
	var found = conditions[f];
	if(!found) throw 'function ' + f + ' is not a valid function';
	return [found, args];
}

var conditions = {
	equals 		: _.isEqual,
	contains 	: contains, //defined in existentialQuery

}
