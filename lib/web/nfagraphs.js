function createNFAGraph(nfa)
{
  var graph = new dagreD3.Digraph();
  var uniq = [];
  var ctr = 0;

	nfa.triples.forEach(
    function (s)
    {
      var id = s.from._id;
      if (uniq.indexOf(id) === -1) uniq.push(id);
    });

    uniq.forEach(
    function (s){
		graph.addNode(s, {label: s});
    });

    nfa.acceptStates.forEach(
    function (s)
    {
		graph.addNode(s, {label: s});
    });

	nfa.triples.forEach(
	function (s)
	{
		var edgeLabel = s.edge.name;
		graph.addEdge(ctr++, s.from._id, s.target._id, {label: edgeLabel});          
	})
    return graph;
}



function drawNFAGraph(graph)
{
  var renderer = new dagreD3.Renderer();
  renderer.run(graph, d3.select("svg.nfa g"));
}