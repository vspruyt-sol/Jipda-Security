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

//BEWARE: USE ONLY IF OBJECT HAS PROPERTIES THAT ONLY YOU HAVE DEFINED 
//E.g. var x = {prop1: '1', prop2: '2'} would be fine.
Utilities.keyAt = function(obj, idx){
	return Object.keys(obj)[idx];
}

Utilities.arrayContainsArray = function(multiArr, arr){
	var found = multiArr.find(function(elem){
							return Utilities.arraysEqual(elem, arr);
						})
	return found;
}

Utilities.arraysEqual = function(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (!_.isEqual(a[i],b[i])) return false;
  }
  return true;
}


Utilities.removeFromArray = function(arr, obj) {
	for (var i = arr.length - 1; i>=0; i--) {
	    if (arr[i] === obj) {
	        arr.splice(i, 1);
	    }
	}
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


