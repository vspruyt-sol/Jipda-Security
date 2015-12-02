function Triple(fromState, edgeLabel, toState, initial, final){
	this.from = fromState;
	this.edge = edgeLabel;
	this.target = toState;
	this.initial = initial || false;
	this.final = final || false;
}

Triple.prototype.equals = function(x){
    return (x instanceof Triple)
      && this.from === x.from
      //todo && edge
      && this.target === x.target;
}

Triple.prototype.toString = function(x){
	var prefix = this.initial ? 'initial: ' : (this.final ? 'final: ' : '');
	var fts = '(' + this.from._id + ')';
	if(!this.final){
		var elts = '--' + (this.edge ? this.edge.name : '') + '-->';
		var tts = '(' + this.target._id + ')';
		return prefix + fts + elts + tts;
	}
	return prefix + fts;
}