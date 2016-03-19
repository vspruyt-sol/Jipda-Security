function RegularPathExpression(seed){ 
	//Index x represents edge with label 'x' in the NFA 
	this._map = [];
	//Check braces
	this.depth = 0;
	//Contains the NFA with its graph triples
	this.nfa = [];
	//temporal fix
	this.uid = seed || 0;
}

/**
 * -----------------------
 * USER DEFINED PREDICATES
 * -----------------------
 */

RegularPathExpression.prototype.udAssign = function(obj){ //left, right, leftName, rightName
	//todo fill in params
	var s = {};
	var objLeft = obj.left || this.getTmpVar('objLeft');
	var objRight = obj.right || this.getTmpVar('objRight');
	var objLeftName = obj.leftName || this.getTmpVar('objLeftName');
	var objRightName = obj.rightName || this.getTmpVar('objRightName');

	//make vars optional
	this.setupStateChain(s, ['node','expression','left'], objLeft);
	this.setupStateChain(s, ['node','expression','right'], objRight);	
	this.setupStateChain(s, ['node','expression','operator'], "=");
	this.setupProperty(s, objLeftName, objLeft + '.name');
	this.setupProperty(s, objRightName, objRight + '.name');

	return this.state(s);
}

RegularPathExpression.prototype.udFCall = function(obj){ //name, callee, arguments, argName (eerste arg);
	obj = obj || {};
	var s1 = {};

	var objName 	=	obj.name || this.getTmpVar('objName'); //naam van de functie
	var objCallee 	= 	obj.callee || this.getTmpVar('objNode'); //de callee node
	var objArguments= 	obj.arguments || this.getTmpVar('objArguments'); //de arguments node
	var firstArg 	= 	this.getTmpVar('firstArg');
	var firstArgName= 	obj.argName || this.getTmpVar('firstArgName'); //if user wants to know first argument name
	var calleeName 	= 	this.getTmpVar('calleeName'); //tmp var for matching
	var argName 	=	this.getTmpVar('argName');

	//Basic function call
	this.setupStateChain(s1, ['node','expression','callee'], objCallee);
	this.setupStateChain(s1, ['node','expression','arguments'], objArguments);
	
	//get first argument
	try{
		this.setupProperty(s1, firstArg, prop('at', objArguments, 0)); //tmp eerste arg
		this.setupProperty(s1, firstArgName, firstArg + '.name'); //tmp als niet geweten moet worden, anders vast
		this.setupProperty(s1, objName, objCallee + '.name');
	}
	catch(e){ //optional, just to catch errors
		console.log(e);
	}

	return this.state(s1);
}

RegularPathExpression.prototype.udOpenClosedFile = function(obj){
	obj = obj || {};
	var fileName = obj.name || this.getTmpVar('objName');

	return 	this	.udFCall({name: 'close', argName: fileName})
					.not()
					//.lBrace()
					.udFCall({name: 'open'})
					//.rBrace()
					.star()
					.udFCall({name: 'access', argName: fileName});
}

RegularPathExpression.prototype.udRecSink = function(obj){ //leakedValue
	// sink(x);
	// | tmp = x
	// | udRecTest(tmp)

	//info from argument
	obj = obj || {};
	//state info for alias
	var s = {};
	var leaked 	= obj.leakedValue || this.getTmpVar('leaked');
	var alias 	= this.getRecVar('leakedAlias'); //use temp var if you don't want to know the aliases
	var left = this.getTmpVar('left');
	var right = this.getTmpVar('right');
	//new obj for recursive function
	var newObj 	= {};
	newObj.leakedValue = alias;

	this.setupStateChain(s, ['node','expression','left'], left); //alias
	this.setupStateChain(s, ['node','expression','right'], right); //leaked

	this.setupProperty(s, alias, left + '.name'); 
	this.setupProperty(s, leaked, right + '.name');


	return this 	.lBrace()
					.udFCall({name: 'sink', argName: leaked})
					.or()
					.state(s)
					.skipZeroOrMore()
					.rec(newObj,this.udRecSink)
					.rBrace();
}

RegularPathExpression.prototype.udAvailableExpression = function(obj){ //left(Name),right(Name), Operator
	obj = obj || {};
	var s = {};

	var objLeft = obj.left || this.getTmpVar('obLeft');
	var objRight = obj.right || this.getTmpVar('obRight');
	var objLeftName = obj.leftName || this.getTmpVar('obLeftName');
	var objRightName = obj.rightName || this.getTmpVar('obRightName');
	var objOperator = obj.operator || this.getTmpVar('obOperator');

	this.setupStateChain(s, ['node','type'], 'BinaryExpression');
	this.setupStateChain(s, ['node','left'], objLeft);
	this.setupStateChain(s, ['node','right'], objRight);
	this.setupStateChain(s, ['node','operator'], objOperator);
	
	this.setupProperty(s, objLeftName, objLeft + '.name');
	this.setupProperty(s, objRightName, objRight + '.name');

	return this .state(s)
				.skipZeroOrMore()
				.lBrace()
				.udAssign({leftName: objLeftName})
				.or()
				.udAssign({leftName: objRightName})
				.rBrace();
}

/**
 * ------------------
 * Properties/filters
 * ------------------
 */

RegularPathExpression.prototype.setupStateChain = function(obj, chain, val){
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

RegularPathExpression.prototype.setupProperty = function(obj, left, right){
	if(!obj.properties) obj.properties = {};
	//Is variable
	if(isVar(left)){
		obj.properties[left] = right;
	}
	else{
		//no variable, so we have to add condition
		var tmp = this.getTmpVar('tmpName');
		obj.properties[tmp] = right;
		this.setupFilter(	obj, 
							'equals',
							tmp,
							left);
	}	
}

RegularPathExpression.prototype.setupFilter = function(obj, f){
	var args = Array.prototype.slice.call(arguments, 2);
	var fArgs = Array.prototype.concat.apply([], [f, args])
	if(!obj.filters) obj.filters = [];
	obj.filters.push(cond.apply(this,fArgs));	
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

//subgraph (for recursion)
RegularPathExpression.prototype.rec = function(obj, f){
	//context that has an empty _map (for the creation of the subgraph)
	//and an index equal to the 'this' object, to avoid overlapping of tmpVars/recVars
	//var thisContext = new RegularPathExpression();
	//thisContext.uid = this.uid;
	this._map.push(new RegexPart('subGraph', obj, 'idx' + this._map.length, f, this.uid));
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

	this.lBrace();
	this._map.push(new RegexPart('wildcard', obj, '_'));
	this._map.push(new RegexPart('star', obj, '*'));
	this.rBrace();
	//Fluent API
	return this;
}

//Wildcard followed by Plus
RegularPathExpression.prototype.skipOneOrMore = function(obj){
	this.lBrace();
	this._map.push(new RegexPart('wildcard', obj, '_'));
	this._map.push(new RegexPart('plus', obj, '+'));
	this.rBrace();
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

RegularPathExpression.prototype.getUid = function(){
	return this.uid++;
}

RegularPathExpression.prototype.getTmpVar = function(name){
	return '?__tmp__' + name + this.uid++;
}

RegularPathExpression.prototype.getRecVar = function(name){
	return '?r:' + name + this.uid++;
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

 function RegexPart(name, obj, symbol, expandFunction, expandContext){
 	this.name = name;
 	this.symbol = symbol;
 	this.obj = obj;
 	this.expandFunction = expandFunction || false;
 	this.expandContext = expandContext || false;
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


var isVar = function(x){
	return x.charAt(0) === '?';
}

//Builtin functions for properties
var prop = function(f){
	var args = Array.prototype.slice.call(arguments, 1);

	//lookup function
	var found = queryFunctions.properties[f];
	if(!found) throw 'function ' + f + ' is not a valid function';
	return [found, args];
}

//Builtin functions for conditions
var cond = function(f){
	var args = Array.prototype.slice.call(arguments, 1);

	//lookup function
	var found = queryFunctions.conditions[f];
	if(!found) throw 'function ' + f + ' is not a valid function';
	return [found, args];
}

var queryFunctions = {
	conditions : { //filters
				equals 		: _.isEqual,
				contains 	: contains, 
				testTrue 	: function(){return true;},
				testFalse 	: function(){return false;}
				},
	properties : {
				identity 		: function(a){ return a; },
				length			: function(a){ return a.length; },
				at 				: function(a,idx){ return a[idx]; },
				}
}
