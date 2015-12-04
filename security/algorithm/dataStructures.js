//TODO: equality!

//GraphTriple
function GraphTriple(fromState, edgeLabel, toState, initial, final){
	this.from = fromState;
	this.edge = edgeLabel;
	this.target = toState;
	this.initial = initial || false;
	this.final = final || false;
}

GraphTriple.prototype.equals = function(x){
	//TODO
    return (x instanceof GraphTriple)
      && (this.from === x.from || this.from.equals(x.from))
      && (this.edge === x.edge || this.edge.equals(x.edge))
      && (this.target === x.target || this.target.equals(x.target));
}

GraphTriple.prototype.toString = function(x){
	var prefix = this.initial ? 'initial: ' : (this.final ? 'final: ' : '');
	var fts = '(' + this.from._id + ')';
	if(!this.final){
		var elts = '--' + (this.edge ? this.edge.name : '') + '-->';
		var tts = '(' + this.target._id + ')';
		return prefix + fts + elts + tts;
	}
	return prefix + fts;
}

//WorklistTriple
function WorklistTriple(v, s, theta){
	this.v = v;
	this.s = s;
	this.theta = theta;
}

WorklistTriple.prototype.equals = function(x){ //OK
	//TODO
    return (x instanceof WorklistTriple)
      && (this.v === x.v || this.v.equals(x.v))
      && (this.s === x.s || this.s.equals(x.s))
      && (this.theta === x.theta || _.isEqual(this.theta, x.theta));
}

WorklistTriple.prototype.toString = function(){ //OK
	//TODO
    var str = this.v.toString() + '& ' + this.s.toString() + ' {';
    for(var prop in this.theta){
    	if(this.theta.hasOwnProperty(prop)){
    		str += prop + ' -> ' + this.theta[prop] + ', ';
    	}
    }
    return str.substring(0, str.length - 2) + '}';
}

//VertexThetaPair
function VertexThetaPair(v, theta){
	this.v = v;
	this.theta = theta;
}

VertexThetaPair.prototype.equals = function(x){
	//TODO
    return (x instanceof VertexThetaPair)
      && (this.v === x.v || this.v.equals(x.v))
      && (this.theta === x.theta || _.isEqual(this.theta, x.theta));
}

VertexThetaPair.prototype.toString = function(){
    var str = this.v.toString() + ' {';
    var props = false;
    for(var prop in this.theta){
    	if(this.theta.hasOwnProperty(prop)){
    		props = true;
    		str += prop + ' -> ' + this.theta[prop] + ', ';
    	}
    }
    str = props ?  str.substring(0, str.length - 2) : str;
    return  str + '}';
}

//DUMMY NODE TO CHECK ALGORITHM
function DummyNode(id){
	this._id = id || -1;
}

DummyNode.prototype.equals = function(x){
	return this._id === x._id;
}

DummyNode.prototype.toString = function(){
	return this._id;
}



//ARRAY EQUALITY
//http://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript