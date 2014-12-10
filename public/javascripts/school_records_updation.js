var edit_grade =function(id){
	var new_name = prompt('Enter the new grade name:');
	var url = window.location.href;
	if(new_name.length==0){
		window.location.href = url;
		return;
	}
	window.location.href = url+'?new_name='+new_name;
};

// var edit_subject_summary = function(id){
// 	var new_sub_name = prompt('Enter the new subject name:');
// 	var new_max_score = prompt('Enter the new max score:');
// 	var new_grade = prompt('Enter the new grade:');
// 	var url = window.location.href;
// 	window.location.href = url+'?new_sub_name='+new_sub_name+
// 	'&new_max_score='+new_max_score+'&new_grade='+new_grade;
// };