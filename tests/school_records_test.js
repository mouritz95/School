var lib = require('../own_modules/school_records');
var assert = require('chai').assert;
var fs = require('fs');
var dbFileData = fs.readFileSync('tests/data/school.db.backup');
var sqlite3 = require("sqlite3").verbose();
var location = 'tests/data/school.db';
var sqlite3 = require("sqlite3").verbose();

//CREATE TABLE STUDENTS(name text, grade text);
//INSERT INTO STUDENTS VALUES ('Abu','one'), ('Babu','one')

var school_records;
describe('school_records',function(){
	beforeEach(function(){
		fs.writeFileSync('tests/data/school.db',dbFileData);
		school_records = lib.init('tests/data/school.db');
	});
	
	describe('#getGrades',function(){
		it('retrieves 2 grades',function(done){
			school_records.getGrades(function(err,grades){
				assert.deepEqual(grades,[{id:1,name:'1st std'},{id:2,name:'2nd std'}]);
				done();
			})
		})
	})

	describe('#getStudentsByGrade',function(){
		it('retrieves the students in the 2 grades',function(done){
			school_records.getStudentsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].students,4);
				assert.lengthOf(grades[1].students,3);
				done();
			})
		})
	})

	describe('#getSubjectsByGrade',function(){
		it('retrieves the subjects in the 2 grades',function(done){
			school_records.getSubjectsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].subjects,3);
				assert.lengthOf(grades[1].subjects,0);
				done();
			})
		})
	})

	describe('#getStudentSummary',function(){
		it('retrieves the summary of the student Abu',function(done){
			school_records.getStudentSummary(1, function(err,s){				
				assert.equal(s.name,'Abu');
				assert.equal(s.grade_name,'1st std');
				assert.deepEqual(s.subjects,[{id:1,name:'English-1',score:75,maxScore:100},
					{id:2,name:'Maths-1',score:50,maxScore:100},
					{id:3,name:'Moral Science',score:25,maxScore:50}]);
				done();
			})
		})

		it('retrieves nothing of the non existent student',function(done){
			school_records.getStudentSummary(9, function(err,s){
				assert.notOk(err);
				assert.notOk(s);				
				done();
			})
		})
	})
	describe('#getGradeSummary',function(){
		it('retrieves the summary of grade 1',function(done){
			school_records.getGradeSummary(1,function(err,grade){
				assert.notOk(err);
				assert.equal(grade.name,'1st std');
				assert.deepEqual(grade.subjects,[{id:1,name:'English-1'},
					{id:2,name:'Maths-1'},
					{id:3,name:'Moral Science'}]);
				assert.deepEqual(grade.students,[{id:1,name:'Abu'},
					{id:2,name:'Babu'},
					{id:3,name:'Kabu'},
					{id:4,name:'Dabu'}]);
				assert.equal(grade.id,1);
				done();
			})
		})
	})


	describe('#getSubjectSummary',function(){
		it('retrieves the summary of subject 1',function(done){
			school_records.getSubjectSummary(1,function(err,subject){
 				assert.notOk(err);
				assert.equal(subject[0].subject_name,'English-1');
				assert.deepEqual(subject, [{ subject_id: 1,
 						 subject_name: 'English-1',
 						 maxScore: 100,
 						 grade_id: 1,
 						 grade_name: '1st std',
 						 student_name: 'Abu',
 						 student_id: 1,
 						 score: 75 }]);
				done();
			})
		})
	})

	describe("#editGrade",function(){
		it("grade can't be null",function(done){
			var new_grade = {new_name:"class 3",id:1};
			var db = new sqlite3.Database(location);
			school_records.editGrade(new_grade,function(err){
				db.get('select name from grades where id = 1',function(err,grade){
					assert.deepEqual(grade.name,new_grade.new_name);
					done();
				});
			});
		});
	})

	describe('#editSubjectSummary',function(){
		it('edit subjects summary',function(done){
			var new_subject = {id:2,new_sub_name:'base_ball',
							new_grade:'2nd std',new_max_score:50};
			school_records.editSubjectSummary(new_subject,function(err){
				assert.notOk(err);
				school_records.getSubjectSummary(2,function(esb,sub){
					assert.equal(sub[0].subject_name,'base_ball');
					assert.equal(sub[0].maxScore,50);
					done();
				});
			});
		});		
	});
	
	describe('#editStudentSummary',function(){
		it('edit student summary',function(done){
			var newStudent = {studentId:1,studentName:'Vishnu',
							gradeName:'2nd std',subId_1:20,subId_2:23,subId_3:50};
			var expected = [{id:1,name:'English-1',score:20,maxScore:100},
							{id:2,name:'Maths-1',score:23,maxScore:100},
							{id:3,name:'Moral Science',score:50,maxScore:50}];
			school_records.editStudentSummary(newStudent,function(err){
				assert.notOk(err);
				school_records.getStudentSummary(2,function(ess,s2){
					assert.equal(s2.name,'Babu');
					assert.equal(s2.grade_name,'1st std');
					assert.deepEqual(s2.subjects,[]);

					school_records.getStudentSummary(1,function(ess,s1){
						assert.equal(s1.name,'Vishnu');
						assert.equal(s1.grade_id,'2');
						assert.deepEqual(s1.subjects,expected);
						done();
					});
				});
			});
		});
	});

	describe('#addNewStudentFromGradeSummaryPage',function(){
		it('add new student',function(done){
			var new_student = {name:'moti',grade_id:1};
			school_records.addStudent(new_student,function(err){
				assert.notOk(err);
				school_records.getStudentSummary(8,function(est,stu){
					assert.equal(stu.name,'moti')
					done();
				});
			});
		});		
	});

	describe('#addNewSubjectFromGradeSummaryPage',function(){
		it('add new subject',function(done){
			var new_subject = {name:'history',maxScore:100,grade_id:1};
			var db = new sqlite3.Database(location);
			school_records.addSubject(new_subject,function(err){
				assert.notOk(err);
				db.get('select * from subjects where id = 4',function(err,stu){
					assert.deepEqual(stu.name,'history');
					done();
				});
			});
		});		
	});
	describe('#addScoreForAStudentFromSubjectSummaryPage',function(){
		it('add score for a student in subject summary page',function(done){
			var new_score = {student_id:1,subject_id:3,score:45};
			var db = new sqlite3.Database(location);
			school_records.addScores(new_score,function(err){
				assert.notOk(err);
				db.get('select * from scores where student_id=1 and subject_id=3',function(esc,score){
					assert.deepEqual(new_score,score);
					done();
				})
			})
		})
	})
})