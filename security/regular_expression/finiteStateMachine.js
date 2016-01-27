function FiniteStateMachine(acceptStates, graph, origin, type){
	this.acceptStates = acceptStates || {};
	this.graph = graph || {}; //TODO: Should I make a separate 'class' for node->edge->node connections?
	this.origin = origin || 0;
	this.tpe = type || ''; //debugging purposes
}

FiniteStateMachine.prototype.getNodeCount = function(){
	return this.getNodeNames().length;
}

FiniteStateMachine.prototype.getNodeNames = function(){
	var nodes = [];
	for (var key in this.graph){
		nodes.push(key);
		for (var subkey in this.graph[key]){
			Array.prototype.push.apply(nodes, this.graph[key][subkey]);
		}
	}
	return nodes.getUnique().sort(function(a,b){ return a-b;});
}

FiniteStateMachine.prototype.attachGraph = function(attachPoint, fsm, debug){
	var nodeCount = this.getNodeCount();
	
	//clone, since it will be 'reused'
	var fsmC = clone(fsm);

	this.incrementNodeLabels.apply(fsmC, [nodeCount - 1]);
	//fsmC.incrementNodeLabels = this.incrementNodeLabels;
	//fsmC.incrementNodeLabels(nodeCount - 1);

	var rootEdges = fsmC.graph[fsmC.origin];
	delete fsmC.graph[fsmC.origin];

	if(this.graph[attachPoint] === undefined) {
		this.graph[attachPoint] = {};
	}

	for(var k in rootEdges){
		this.graph[attachPoint][k] = rootEdges[k];
	}

	for(var j in fsmC.acceptStates){
		this.acceptStates[j] = fsmC.acceptStates[j];
	}

	for(var i in fsmC.graph){
		this.graph[i] = fsmC.graph[i];
	}

	//return this.getNodeCount();
}

FiniteStateMachine.prototype.deleteEdge = function(from, label, to){
	//Undefined handling
	if(this.graph[from] === undefined) return;
	if(this.graph[from][label] === undefined) return;

	//If there exists an edge, delete it
	//if(_.contains(this.graph[from][label], to)){
	//	removeFromArray(this.graph[from][label], to);
	//}

	//More consize
	this.graph[from][label] = _.reject(this.graph[from][label], function(x){ return (x === to); });

	//If above deletion was the last edge from a node, delete it.
	if(this.graph[from][label].length === 0){
		delete this.graph[from][label];
	}
}

FiniteStateMachine.prototype.addEdge = function(from, label, to){
	//new edge setup
	if(this.graph[from] === undefined){
		this.graph[from] = {};
	}

	if(!this.graph[from][label]){ //if there is not already an edge with this label
		this.graph[from][label] = [to];
	}
	else{ //if already an edge exists, we have to add the destination nodes
		if(this.graph[from][label].constructor !== Array){ //Wrap in an array
			this.graph[from][label] = [this.graph[from][label]];
		}
		if(!_.contains(this.graph[from][label], to)){
			this.graph[from][label].push(to);
		}
	}
}

FiniteStateMachine.prototype.replaceEdge = function(from, label, to, fsm, debug){
	if(!fsm.acceptStates || fsm.acceptStates === {}){
		throw 'The fsm to be inserted doesn\'t have any accept states.';
	}

	if (this.graph[from][label].constructor !== Array){
		this.graph[from][label] = [this.graph[from][label]];
    }

    var offset = this.getNodeCount() - 1;
    this.attachGraph(from, fsm, debug);

    //for each of the edges pointing at the accept state of the graph
    //redirect them to point at dest
    for(var acc in fsm.acceptStates){
    	console.log((parseInt(acc) + offset) + ' => ' + to);
    	this.retargetEdges(parseInt(acc) + offset, to);
    	delete this.acceptStates[parseInt(acc) + offset];
    }

    //this one gives some trouble if the first one is a cat followed by a kleene star
    this.deleteEdge(from, label, to); 

    console.log('Check ut ut');

    this.renumberNodes();

    console.log(JSON.stringify(this));

    return this;
}

FiniteStateMachine.prototype.renumberNodes = function(){
	//TODO BUGGED

	var nodes = this.getNodeNames();
	console.log(JSON.stringify(nodes));
	var n;
	for(var i = 0; i < nodes.length; i++){
		n = nodes[i];
		if(parseInt(n) !== i){
			this.retargetEdges(n, i);
			if(this.acceptStates[n] !== undefined){
				this.acceptStates[i] = this.acceptStates[n];
				delete this.acceptStates[n];
			} 
			this.graph[i] = this.graph[n];
			delete this.graph[n];
		}
	}
}

FiniteStateMachine.prototype.incrementNodeLabels = function(amount){
	var newGraph = {};
	var newAcceptStates = {};
	var newSubGraph, toNodes, subGraph, value;
	for(var key in this.graph){
		subGraph = this.graph[key];
		newSubGraph = {};
		for(var subkey in subGraph){
			value = subGraph[subkey];
			if(value.constructor === Array){
				newSubGraph[subkey] = value.map(function(x){ return x + amount; });
			}
			else{
				newSubGraph[subkey] = value + amount;
			}
		}

		newGraph[parseInt(key) + amount] = newSubGraph; //we have to cast for some reason
	}

	for(var acc in this.acceptStates){
		newAcceptStates[parseInt(acc) + amount] = this.acceptStates[acc];
	}
     
    this.graph = newGraph;
    this.acceptStates = newAcceptStates; 
    this.origin += amount;
}

FiniteStateMachine.prototype.retargetEdges = function(oldTarget, newTarget){
	var from, edge, label, to;
	for(var from in this.graph){
		edge = this.graph[from];
		for(var label in edge){
			to = edge[label];
			if(_.include(to, oldTarget)){ //als edge naar oude target, vervang deze door nieuwe
				this.addEdge(from, label, newTarget);
				this.deleteEdge(from, label, oldTarget);
			}
		}
	}
}

/**
 * MACHINES
 */

var CAT_MACHINE = function(label){
 	var obj = {};
 	obj[label] = [1];
 	return new FiniteStateMachine(	{ 1 : 'end' },
 									{ 
 										0 : obj 
 									}, 0, 'Cat'
 								 );
}

var ALT_MACHINE = function(){
 	return new FiniteStateMachine(	{ 5 : 'end' },
 									{ 
 										0 : { 'lambda' : [1,3] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [5]   },
 										3 : { 0        : [4]   }, //PENDING
 										4 : { 'lambda' : [5]   }
 									}, 0, 'Alt'
 								 );
}

var KLEENE_MACHINE = function(){
 	return new FiniteStateMachine(	{ 3 : 'end' },
 									{ 
 										0 : { 'lambda' : [1,3] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [1,3] }
 									}, 0, 'kleene'
 								 );
}

var PLUS_MACHINE = function(){
 	return new FiniteStateMachine(	{ 3 : 'end' },
 									{ 
 										0 : { 'lambda' : [1] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [1,3] }
 									}, 0, 'plus'
 								 );
}


/**
 * Extend Array prototype for extra functionality
 *
 */
Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}

var removeFromArray = function(arr, obj) {
	for (var i = arr.length - 1; i>=0; i--) {
	    if (arr[i] === obj) {
	        arr.splice(i, 1);
	    }
	}
}

//https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
function clone(objectToBeCloned) {

  // Basis.
  if (!(objectToBeCloned instanceof Object)) {
    return objectToBeCloned;
  }
  var objectClone;
  
  // Filter out special objects.
  var Constructor = objectToBeCloned.constructor;
  switch (Constructor) {
    // Implement other special objects here.
    case RegExp:
      objectClone = new Constructor(objectToBeCloned);
      break;
    case Date:
      objectClone = new Constructor(objectToBeCloned.getTime());
      break;
    default:
      objectClone = new Constructor();
  }
  
  // Clone each property.
  for (var prop in objectToBeCloned) {
    objectClone[prop] = clone(objectToBeCloned[prop]);
  }
  
  return objectClone;
}

