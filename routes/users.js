var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Include User Model
var User = require('../models/user');
// Include Student Model
var Student = require('../models/student');
// Include Instructor Model
var Instructor= require('../models/instructor');

// User Register
router.get('/register', function(req, res, next) {
  res.render('users/register');
});

// Register User
router.post('/register', function(req, res, next) {
 	// Get Form Values
	var {first_name, last_name, street_address, city, state, zip, email, username, password, password2, type} = req.body

	// Form Validation
	req.checkBody('first_name', 'First name field is required').notEmpty();
	req.checkBody('last_name', 'Last name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Email must be a valid email address').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	errors = req.validationErrors();

	if(errors){
		res.render('users/register', {
			errors: errors
		});
	} else {
		User.findOne({email: email})
        .then(user => {
            if(user){
				//errors.push('User Exists');
				 req.flash('error_msg', 'User Exists');
				 res.redirect('/');
                //  res.render('users/register', {
                //      errors
                //     //  name,
                //     //  email,
                //     //  password,
                //     //  password2
				//  });	 
			} 
			else
			 {
                const newUser = new User({
                    username,
                    email,
                    password,
                    type
				});

				if(type == 'student'){
					console.log('Registering Student...');
		
					var newStudent = new Student({
						first_name: first_name,
						last_name: last_name,
						address: [{
							street_address: street_address,
							city: city,
							state: state,
							zip: zip
						}],
						email: email,
						username:username
					});
		
		
					User.saveStudent(newUser, newStudent, function(err, user){
						console.log('Student created');
						req.flash('success_msg', 'Student Added');
						res.redirect('/');
					});
				} else {
					console.log('Registering Instructor...');
					var newInstructor = new Instructor({
						first_name: first_name,
						last_name: last_name,
						address: [{
							street_address: street_address,
							city: city,
							state: state,
							zip: zip
						}],
						email: email,
						username:username
					});
		
					User.saveInstructor(newUser, newInstructor, function(err, user){
						console.log('Instructor created');
						req.flash('success_msg', 'Instructor Added');
						res.redirect('/');
					});
				}
				//req.flash('success_msg', 'User Added');
				//res.redirect('/');
					
			}

		});
			
	}
});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});


passport.deserializeUser(function(id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});

router.post('/login', passport.authenticate('local',{failureRedirect:'/', failureFlash: true}), function(req, res, next) {
  	req.flash('success_msg','You are now logged in');
  	var usertype = req.user.type;
  	res.redirect('/'+usertype+'s/classes');
});

passport.use(new LocalStrategy(
  function(username, password, done) {
  	User.getUserByUsername(username, function(err, user){
    	if (err) throw err;
    	if(!user){
    		return done(null, false, { message: 'Unknown user ' + username }); 
    	}

    	User.comparePassword(password, user.password, function(err, isMatch) {
      		if (err) return done(err);
      		if(isMatch) {
        		return done(null, user);
      		} else {
      			console.log('Invalid Password');
      			// Success Message
        		return done(null, false, { message: 'Invalid password' });
      		}
   	 	});
    });
  }
));

// Log User Out
router.get('/logout', function(req, res){
	req.logout();
 	// Success Message
	req.flash('success_msg', "You have logged out");
  	res.redirect('/');
});

module.exports = router;
