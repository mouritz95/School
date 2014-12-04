var edit_grade =function(id){
	var new_name = prompt('Enter the new grade name:');
	var url = window.location.href;
	window.location.href = url+'?new_name='+new_name;
};