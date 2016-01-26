function FiniteStateMachine(acceptStates, graph){
	this.acceptStates = acceptStates || {};
	this.graph = graph || {}; //TODO: Should I make a separate 'class' for node->edge->node connections?
}

FiniteStateMachine.prototype.getNodeCount = function(){
	return this.getNodeNames().length;
}

FiniteStateMachine.getNodeNames = function(){
	var nodes = [];
	for (var key in this.graph){
		nodes.push(key);
		for (var subkey in this.graph[key]){
			Array.prototype.push.apply(nodes, this.graph[key][subkey]);
		}
	}
	return _.unique(nodes);
	//return nodes.getUnique();
}

FiniteStateMachine.prototype.impAttachGraph = function(attachPoint, fsm){
	//TODO
	my_node_count = get_node_count
    graft = fsm.clone
    graft.increment_node_labels(my_node_count-1) # prevent collisions
    
    graft_root_edges = graft.graph_hash.delete(graft.origin)
    @graph_hash[attach_point] ||= Hash.new
    @graph_hash[attach_point].merge!(graft_root_edges)

    @accept_states.merge!(graft.accept_states)
    @graph_hash.merge!(graft.graph_hash)
    get_node_count
}

FiniteStateMachine.prototype.deleteEdge = function(from, label, to){
	//Undefined handling
	if(!this.graph[from]) return;
	if(!this.graph[from][label]) return;

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
	//TODO
      @graph_hash[src] = Hash.new if @graph_hash[src].nil?
      if @graph_hash[src][label].nil?
        @graph_hash[src][label] = [dest]
      else
        if @graph_hash[src][label].class != Array
          @graph_hash[src][label] = [@graph_hash[src][label]]
        end
        @graph_hash[src][label] << dest if !@graph_hash[src][label].include?(dest)
      end
}

FiniteStateMachine.prototype.replaceEdge = function(from, label, to, fsm){
	if(!fsm.acceptStates || fsm.acceptStates === {}){
		throw 'The fsm to be inserted doesn\'t have any accept states.');
	}

	if (this.graph[src][label].constructor !== Array){
		this.graph[src][label] = [this.graph[src][label]];
    }

    var offset = this.getNodeCount - 1;
    impAttachGraph(from, graph);

    //for each of the edges pointing at the accept state of the graph
    //redirect them to point at dest
    _.each(fsm.acceptStates, function(acc){
    	retargetEdges(acc + offset, to);
    	delete this.acceptStates[acc + offset];
    });

    deleteEdge(from, label, to);
    renumberNodes();
}

FiniteStateMachine.prototype.renumberNodes = function(){
	//TODO
	var nodes = getNodeNames();
	var n;
	for(var i = 0; i < nodes.length; i++){
		n = nodes[i];
		if(n !== i){
			retarget_edges(n, i);
			if(this.acceptStates[n]){
				this.acceptStates[i] = this.acceptStates[n];
				delete this.acceptStates[n];
			} 
			this.graph[i] = this.graph[n];
			delete this.graph[n];
		}
	}
}

FiniteStateMachine.prototype.retargetEdges = function(oldTarget, newTarget){
	var from, edge, label, to;
	for(var key in this.graph){
		from = key;
		edge = this.graph[from];
		for(var subkey in edge){
			label = subkey;
			to = edge[subkey];
			if(_.include(to, oldTarget)){ //als edge naar oude target, vervang deze door nieuwe
				addEdge(from, label, to);
				deleteEdge(from, label, to);
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
 									{ 0 : obj }	
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
 									}	
 								 );
}

var KLEENE_MACHINE = function(){
 	return new FiniteStateMachine(	{ 3 : 'end' },
 									{ 
 										0 : { 'lambda' : [1,3] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [1,3] }
 									}	
 								 );
}

var PLUS_MACHINE = function(){
 	return new FiniteStateMachine(	{ 3 : 'end' },
 									{ 
 										0 : { 'lambda' : [1] },
 										1 : { 0		   : [2]   }, //PENDING
 										2 : { 'lambda' : [1,3] }
 									}	
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

