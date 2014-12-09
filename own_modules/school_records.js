var sqlite3 = require("sqlite3").verbose();

var _getGrades = function(db,onComplete){
	var q = 'select * from grades';
	db.all(q,onComplete);
};

var _getStudentsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from students', function(err1,students){
			grades.forEach(function(g){
				g.students = students.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			
			grades.forEach(function(g){
				g.subjects = subjects.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc '+
		'where su.id = sc.subject_id and sc.student_id ='+id;
	db.get(student_grade_query,function(est,student){
		if(!student){
			onComplete(null,null);
			return;
		}
		db.all(subject_score_query,function(esc,subjects){	
			student.subjects = subjects;
			onComplete(null,student);
		})
	});
};

var _getGradeSummary = function(id,db,onComplete){
	var student_query = "select id,name from students where grade_id="+id;
	var subject_query = "select id,name from subjects where grade_id="+id;
	var grade_query = "select id,name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		db.all(student_query,function(est,students){
			grade.students = students;
			db.all(subject_query,function(esu,subjects){
				grade.subjects = subjects;
				onComplete(null,grade);		
			});
		});
	});
};


var _getSubjectSummary = function(id,db,onComplete){
	var query  = ['select sb.id as subject_id, sb.name as subject_name,',
	' sb.maxScore, g.id as  grade_id, g.name as grade_name,',
	' st.name as',
	'  student_name, st.id as student_id, sc.score',
	' as score from students st, grades g,',
	' subjects sb, scores sc where sb.id =',id,
	' and sc.subject_id = ',id,
	' and sc.student_id = st.id ',
	'and st.grade_id = g.id'].join('');
	db.all(query , function(err, subjectSummary){
		onComplete(null , subjectSummary);
	})


};

var _edit_grade = function(new_grade,db,onComplete){
	var query = "update grades set name='"+new_grade.new_name+"' where id="+new_grade.id;
	db.run(query, function(err){
		onComplete(null,null);
	})
};

var _editSubjectSummary =function(new_values,db,onComplete){
	var grade_query = "select id from grades where name='"+new_values.new_grade+"'";
	var subject_query = "update subjects set name='"+new_values. new_sub_name+"', maxScore="+new_values. new_max_score+" where id="+new_values.id;
	db.get(grade_query,function(err,grade){
		if(!grade){
			err = true
			onComplete(err);
			return;
		}
		new_values.grade_id = grade.id;
		db.run(subject_query,function(err){
			err && console.log(err);
			db.run('update subjects set grade_i/ d='+new_values.grade_id+" where id="+new_values.id,function(err){
				onComplete(null)});
		});
	});
};

var getSubjectIds = function(new_student){
	var expression = new RegExp(/^subId_/);
	var ids = Object.keys(new_student).filter(function(key){
		return key.match(expression) && key;
	});
	return ids.map(function(id){
		return id.split('_')[1];
	})
}

var _editStudentSummary = function(new_student,db,onComplete){
	var queryForGradeId = "select id from grades where name='"+new_student.gradeName+"'";
	db.get(queryForGradeId,function(egr,grade){
		if(!grade){
			egr = true;
			onComplete(egr);
			return;
		}
		new_student.gradeId = grade.id;
		var grade_query = "update students set grade_id='" + new_student.gradeId+"' where id="+new_student.studentId;
		db.run(grade_query,function(egr){
			egr && console.log(egr)
		});
		var student_query = "update students set name='"+new_student.studentName+"' where id="+new_student.studentId;
		db.run(student_query,function(err){
			err && console.log(err);
		});
		var ids = getSubjectIds(new_student);
		ids.forEach(function(id,index,array){
			var score_query = "update scores set score='"+new_student["subId_"+id]+"' where subject_id="+id+" and student_id="+new_student.studentId ;
				db.run(score_query,function(esc){
					index==array.length-1 && onComplete(null);
				});
		});
	});
};

var _addStudents = function(new_student,db,onComplete){
	var insertStudent = "insert into students ('name','grade_id') values ('"+new_student.name+"',"+new_student.grade_id+");";
	var get_ids = "select id from students order by id desc limit 1;";
	var subject_query = "select id from subjects where grade_id = "+new_student.grade_id;
	

	db.run(insertStudent,function(ein){
		db.get(get_ids , function(err, id){
			new_student.id = id.id;
			db.all(subject_query , function(err , subject){
				new_student.subject_id = subject.map(function(sub){
					 return sub.id;
				})
				new_student.subject_id.forEach(function(id,index , array){
					var insert_scores = "insert into scores values("+new_student.id+","+id+", 0);";
					db.run(insert_scores,function(esc){
						index==array.length-1 && onComplete(null);
					});
				});
			})
		})
	})
}

var _addSubjects = function(new_subject,db,onComplete){
	var insertSubject = "insert into subjects ('name','maxScore','grade_id') values ('"+new_subject.name+"',"+new_subject.maxScore+","+new_subject.grade_id+");";
	db.run(insertSubject,function(err){
		onComplete(null);
	})
}

var init = function(location){	
	var operate = function(operation){
		return function(){
			var onComplete = (arguments.length == 2)?arguments[1]:arguments[0];
			var arg = (arguments.length == 2) && arguments[0];
			var onDBOpen = function(err){
				if(err){onComplete(err);return;}
				db.run("PRAGMA foreign_keys = 'ON';");
				arg && operation(arg,db,onComplete);
				arg || operation(db,onComplete);
				db.close();
			};
			var db = new sqlite3.Database(location,onDBOpen);
		};	
	};

	var records = {		
		getGrades: operate(_getGrades),
		getStudentsByGrade: operate(_getStudentsByGrade),
		getSubjectsByGrade: operate(_getSubjectsByGrade),
		getStudentSummary: operate(_getStudentSummary),
		getGradeSummary: operate(_getGradeSummary),
		getSubjectSummary: operate(_getSubjectSummary),
		edit_grade: operate(_edit_grade),
		editSubjectSummary : operate(_editSubjectSummary),
		editStudentSummary :operate(_editStudentSummary),
		addStudent :operate(_addStudents),
		addSubject :operate(_addSubjects)
	};

	return records;
};

exports.init = init;