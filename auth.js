const passport = require('passport');
const localStrategy = require('passport-local');
const githubStrategy = require('passport-github').Strategy;
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

module.exports = function(app, db){

    passport.use(new localStrategy(
        (username, password, done)=>{
            db.collection('users').findOne({username:username}, (dbErr, user)=>{
                console.log('User '+ username + ' attempted to login');
                if(dbErr){return done(dbErr)}
                if(!user){return done(null, false)}
                if(!bcrypt.compareSync( password, user.password)){return done(null, false)}
                return done(null, user)
            })
        }
    ));
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        db.collection('users').findOne(
            {_id: new ObjectID(id)},
            (err, doc) => {
                done(null, doc);
            }
        );
    });
    app.post('/login', passport.authenticate('local',
        {successRedirect:'/profile', failureRedirect:'/'}), function(req, res){

    });

    passport.use(new githubStrategy(
        {
            clientID:process.env.GITHUB_CLIENT_ID,
            clientSecret:process.env.GITHUB_CLIENT_SECRET,
            callbackURL:'https://citrine-cuboid-farmhouse.glitch.me/auth/github/callback'

            //callbackURL:'https://extreme-ambiguous-save.glitch.me/auth/github/callback'
        },
        function(accessToken, refreshToken, profile, callback){
            //console.log(accessToken)
            db.collection('users').findAndModify(
                {id: profile.id},
                {},
                {$setOnInsert:{
                        id: profile.id,
                        name: profile.displayName || 'John Doe',
                        photo: profile.photos[0].value || '',
                        //email: profile.emails[0].value || 'No public email',
                        created_on: new Date(),
                        provider: profile.provider || ''
                    },$set:{
                        last_login: new Date()
                    },$inc:{
                        login_count: 1
                    }},
                {upsert:true, new: true},
                (err, doc) => {
                    //console.log(doc.value)
                    callback(null, doc.value);
                }
            );
        }
    ))
}