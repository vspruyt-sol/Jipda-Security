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
      && this.from.equals(x.from)
      && this.edge.equals(x.edge)
      && this.target.equals(x.target);
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

WorklistTriple.prototype.equals = function(x){
	//TODO
    return (x instanceof WorklistTriple)
      && this.v === x.v
      && (this.s === x.s || this.s.equals(x.s))
      && this.theta.equals(x.theta);
}

//VertexThetaPair
function VertexThetaPair(v, theta){
	this.v = v;
	this.theta = theta;
}

VertexThetaPair.prototype.equals = function(x){
	//TODO
    return (x instanceof VertexThetapair)
      && this.v === x.v
      && this.theta.equals(x.theta);
}

//Theta
function Theta(map){
	this._map = map || {};
}

Theta.prototype.substitute = function(toSubstitute){
	return this._map[toSubstitute] || false;
}

Theta.prototype.equals = function(x){
	//TODO
    return (x instanceof Theta)
      && _.isEqual(this._map, x);
}

//InfoPair
function InfoPair(name, info){
	this.name = name;
	this.info = info;
}

//DUMMY NODE TO CHECK ALGORITHM
function DummyNode(id){
	this._id = id || -1;
}

//ARRAY EQUALITY
//http://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript