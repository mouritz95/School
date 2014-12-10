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
			});			
			onComplete(null,grades);
		});
	});	
};

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			
			grades.forEach(function(g){
				g.subjects = subjects.filter(function(s){return s.grade_id==g.id});
			});			
			onComplete(null,grades);
		});
	});	
};
var subScoreQuery = function(id){
	return 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc '+
		'where su.id = sc.subject_id and sc.student_id ='+id;
};

var studGradeQuery = function(id){
	return 'select s.name as name, s.id as id,'+
		' g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
}
var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = studGradeQuery(id);
	var subject_score_query = subScoreQuery(id);
	db.get(student_grade_query,function(est,student){
		if(!student){
			onComplete(null,null);
			return;
		}
		db.all(subject_score_query,function(esc,subjects){	
			student.subjects = subjects;
			onComplete(null,student);
		});
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

var runAndShowError = function(query,db){
	db.run(query,function(err){
		err && console.log(err);
	});
};

var runQuery = function(query,db,onComplete){
	db.run(query,function(err){
		onComplete(null);
	})
}
var getSubjectQuery = function(id){
	return ['select sb.id as subject_id, sb.name as subject_name,',
			' sb.maxScore, g.id as  grade_id, g.name as grade_name,',
			' st.name as',
			'  student_name, st.id as student_id, sc.score',
			' as score from students st, grades g,',
			' subjects sb, scores sc where sb.id =',id,
			' and sc.subject_id = ',id,
			' and sc.student_id = st.id ',
			'and st.grade_id = g.id'].join('');
};

var _getSubjectSummary = function(id,db,onComplete){
	var query = getSubjectQuery(id);
	db.all(query , function(err, subjectSummary){
		onComplete(null , subjectSummary);
	});
};

var _edit_grade = function(new_grade,db,onComplete){
	var query = "update grades set name='"+new_grade.new_name+"' where id="+new_grade.id;
	runQuery(query,db,onComplete);
};

var _editSubjectSummary =function(new_values,db,onComplete){
	var grade_query = "select id from grades where name='"+new_values.new_grade+"'";

	var subject_query = "update subjects set name='"+new_values. new_sub_name+"', maxScore="+
	new_values. new_max_score+" where id="+new_values.id;

	db.get(grade_query,function(err,grade){
		showError(err,grade,onComplete);
		new_values.grade_id = grade.id;
		db.run(subject_query,function(err){
			err && console.log(err);
			var updateSubject = 'update subjects set grade_i/ d='+new_values.grade_id+
							" where id="+new_values.id
			runQuery(updateSubject,db,onComplete);
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

var showError = function(err,data,onComplete){
	if(!data){
		err=true;
		onComplete(err);
		return;
	}
}

var _editStudentSummary = function(new_student,db,onComplete){
	var queryForGradeId = "select id from grades where name='"+new_student.gradeName+"'";
	db.get(queryForGradeId,function(egr,grade){
		showError(egr,grade,onComplete);
		new_student.gradeId = grade.id;
		var grade_query = "update students set grade_id='" + new_student.gradeId+
		"' where id="+new_student.studentId;
		runAndShowError(grade_query,db);

		var student_query = "update students set name='"+new_student.studentName+"' where id="+
						new_student.studentId;

		runAndShowError(student_query,db);						
		var ids = getSubjectIds(new_student);
		ids.forEach(function(id,index,array){
			var score_query = "update scores set score='"+new_student["subId_"+id]+
			"' where subject_id="+id+" and student_id="+new_student.studentId ;
			executeAsync(db,score_query,index,array,onComplete);
		});
	});
};

var executeAsync = function(db,query,index,array,onComplete){
	db.run(query,function(err){
		index==array.length-1 && onComplete(null);
	})
};

// var addStudentQueries

var _addStudents = function(new_student,db,onComplete){
	var insertStudent = "insert into students ('name','grade_id') values ('"+
		new_student.name+"',"+new_student.grade_id+");";

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
					executeAsync(db,insert_scores,index,array,onComplete);
				});
			});
		});
	});
};

var addSubjectQuery = function(new_subject){
	var insertSubject = "insert into subjects ('name','maxScore','grade_id') values ('"+
		new_subject.name+"',"+new_subject.maxScore+","+new_subject.grade_id+");";
	var studentIds = "select id from students where grade_id="+new_subject.grade_id;
	var subjectId = "select id from subjects where name='"+new_subject.name+"';";
	return [insertSubject,studentIds,subjectId];
}

var _addSubjects = function(new_subject,db,onComplete){
	var addSubQuery = addSubjectQuery(new_subject);
	db.run(addSubQuery[0],function(err){
		db.all(addSubQuery[1],function(err,student){
			db.get(addSubQuery[2],function(egr,subject){
				student.forEach(function(stud,index,array){
					var addSubjectInStud = "insert into scores ('student_id','subject_id','score')"+
							" values("+stud.id +", "+subject.id+" ,"+ 0+");";	
					executeAsync(db,addSubjectInStud,index,array,onComplete)
				})
			})
		})		
	});
};

var _addScores = function(new_score,db,onComplete){
	var insert_score = "update scores set score="+new_score.score+" where student_id="+
						new_score.student_id+" and subject_id="+new_score.subject_id+";";
	runQuery(insert_score,db,onComplete);	
};

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
		editGrade: operate(_edit_grade),
		editSubjectSummary : operate(_editSubjectSummary),
		editStudentSummary :operate(_editStudentSummary),
		addStudent :operate(_addStudents),
		addSubject :operate(_addSubjects),
		addScores :operate(_addScores)
	};

	return records;
};

exports.init = init;