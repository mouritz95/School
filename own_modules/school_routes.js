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
	if(req.query.new_sub_name){
		var id = req.path[req.path.length-1];
		var updated_fields = {id:id,
			new_sub_name:req.query.new_sub_name,
			new_max_score:req.query.new_max_score,
			new_grade:req.query.new_grade
		};
		school_records.editSubjectSummary(updated_fields,function(err){
			res.writeHead(302,{"Location": "/subject/"+id});
			res.end();
		});
		return;
	}
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
exports.editStudentSummary= function(req,res,next){
	school_records.getStudentSummary(req.params.id,function(err,student){
		if(!student) 
			next();
		else 
			res.render('editStudentSummary',student);
	});
};

exports.edit_student_summary = function(req,res,next){
	var new_student = req.body;
	new_student.studentId = req.params.id;
	school_records.editStudentSummary(new_student,function(err){
		res.writeHead(302,{"Location": "/students/"+new_student.studentId});
		res.end();
	})
};

exports.addStudent = function(req,res,next){
	res.render('addStudent',{id:req.params.id});
};

exports.add_student = function(req,res,next){
	var new_student = req.body;
	new_student.grade_id = req.params.id;
	school_records.addStudent(new_student,function(err){
		res.writeHead(302,{"Location": "/grades/"+new_student.grade_id});
		res.end();
	});
};

exports.addSubject = function(req,res,next){
	res.render('addSubject',{id:req.params.id});
};

exports.add_subject = function(req,res,next){
	var new_subject = req.body;
	new_subject.grade_id = req.params.id;
	school_records.addSubject(new_subject,function(err){
		res.writeHead(302,{"Location": "/grades/"+new_subject.grade_id});
		res.end();
	});
};

exports.addScore = function(req,res,next){
	school_records.getSubjectSummary(req.params.id,function(err,subject){
		var newStudent = subject.filter(function(student){
		 	if(student.score == 0)
				return true;
		})
		if(newStudent.length==0) {
			res.writeHead(302,{"Location": "/subject/"+req.params.id});
			res.end();
			return;
		}	
		else
			res.render('addScore',{subject:newStudent});
	});
};

exports.add_score = function(req,res,next){
	var new_score = req.body;
	new_score.subject_id = req.params.id;
	school_records.addScores(new_score,function(err){
		res.writeHead(302,{"Location": "/subject/"+new_score.subject_id});
		res.end();
	});
};