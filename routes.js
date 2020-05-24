const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, db){

    function ensureAuthenticated(req, res, next){

        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect("/")

    }

    app.route("/chat")
        .get(ensureAuthenticated, (req, res)=>{
            //console.log('req.user: '+ req.user)
            res.render('pug/chat', {
                user: req.user
            })
        });

    app.route('/logout').get(function (req, res) {
        req.logout();
        res.redirect('/')
    })

    app.route('/register').post(
        (req, res, next)=>{
            // check if user existed already
            db.collection('users').findOne(
                {username:req.body.username},
                function(err, data){
                    if(err){
                        next(err)
                    }else if(data){
                        res.redirect('/')
                    }else{
                        //hash the pwd before saving
                        const hashPassword = bcrypt.hashSync(req.body.password, 12)
                        //insert data into db
                        db.collection('users').insertOne({
                            username:req.body.username,
                            password:hashPassword
                        }, (insertError, insertResult)=>{
                            if(insertError){
                                res.redirect('/')
                            }else{
                                next(null, data)
                            }
                        })
                    }
                }
            )
        },
        passport.authenticate('local', {failureRedirect:'/'}),(req, res, next)=>{
            res.redirect('/profile')
        }
    )

    app.route('/auth/github').get(
        passport.authenticate('github')
    )

    app.route('/auth/github/callback').get(
        passport.authenticate('github', {failureRedirect:'/'}), function (reqCallback, resCallback, next) {

            resCallback.redirect('/chat');

            next();
        }
    );

    app.route('/').get((req, res, next)=>{
        res.render('pug/index')
    })
}