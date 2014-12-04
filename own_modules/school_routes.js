var school_records = require('./school_records').init('./data/school.db');
exports.get_grades = function(req,res){
	school_records.getGrades(function(err,grades){
		res.render('grades',{grades:grades});
	});
};

exports.get_students = function(req,res){
	school_records.getStudentsByGrade(function(err,grades){
		res.render('students',{grades:grades});
	});
};

exports.get_subjects = function(req,res){
	school_records.getSubjectsByGrade(function(err,grades){
		res.render('subjects',{grades:grades});
	});
};

exports.get_student = function(req,res,next){
	school_records.getStudentSummary(req.params.id,
	function(err,student){
		if(!student) 
			next();
		else 
			res.render('student',student);
	});
};

exports.get_subject_summary = function(req,res,next){
	school_records.getSubjectSummary(req.params.id,
	function(err,subject){
		if(!subject) 
			next();
		else 
			res.render('subject',{'subject':subject});
	});
};

exports.get_grade_summary = function(req,res,next){
	if(req.query.new_name){
		var id = req.path[req.path.length-1];
		var new_grade = {id:id,new_name:req.query.new_name};
		school_records.edit_grade(new_grade,function(err){
			res.writeHead(302,{"Location": "/grades/"+id});
			res.end();
		});
		return;
	}
	school_records.getGradeSummary(req.params.id,
		function(err,grade){
			if(!grade)
				next();
			else
				res.render('grade',grade);
		});
};
