var express = require('express');
var router  = express.Router();
const { authenticateJWT } = require("../middleware/authenticateJWT");

// router.get('/', function(req, res) {
//   res.render('index', { title: 'Login' });
// });

router.get('/', function(req, res) {
  // res.json({
  //   status: 200,
  //   message: `Welcome to API`
  // });
  res.send(`Welcome to API`)
});

router.get('/terms-conditions', function(req, res) {
  res.render('termsAndConditions.ejs', { title: 'Terms And Conditions' });
});

router.get('/privacy-policy', function(req, res) {
  res.render('privacyPolicy.ejs', { title: 'Privacy Policy' });
});

router.get('/about-us', function(req, res) {
  res.render('aboutUs.ejs', { title: 'Privacy Policy' });
});

module.exports = router;
