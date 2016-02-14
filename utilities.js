function Utilities(){

}

Utilities.containsTriple = function(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i].equals(obj)) {
            return true;
        }
    }
    return false;
}

Utilities.objToString = function(obj){
	var str = '&nbsp;&nbsp;&nbsp;&nbsp;';
	for(var i = 0; i < obj.length; i++){
		for(var key in obj[i]){
			str += '<b class="resultKey">' + key + '</b>' + ': ' + obj[i][key] + '&nbsp;&nbsp;&nbsp;&nbsp;'; 
		}
	}
	
	return str;
}