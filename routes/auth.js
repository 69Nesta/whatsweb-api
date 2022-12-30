const express = require('express');
const router = express.Router();



// ------------------------------------------------------------------------------------------------
// ----------------------------------------  Controllers  -----------------------------------------
// ------------------------------------------------------------------------------------------------

const { isLoggedIn } = require('../controllers/auth')
const { register } = require('../controllers/auth/register');
const { login } = require('../controllers/auth/login');

const authControllerProfile = require('../controllers/auth/profile');

const { confirmation } = require('../controllers/auth/confirmation');
const { resendmail } = require('../controllers/auth/resendmail');
const { forgotpassword } = require('../controllers/auth/forgotpassword');
const { forgotpasswordreset } = require('../controllers/auth/reset');

const { close } = require('../controllers/auth/close');

const { deconnection } = require('../controllers/auth/deconnection');
const { logout } = require('../controllers/auth/logout');



// ------------------------------------------------------------------------------------------------
// -------------------------------------------  Routes  -------------------------------------------
// ------------------------------------------------------------------------------------------------

// router.post('/register', register);
router.post('/login', login);

router.post('/updateprofile', isLoggedIn, authControllerProfile.updateprofile);
// router.post('/updatepassword', isLoggedIn, authControllerProfile.updatepassword);

// router.get('/confirmation/:email/:key', confirmation);
// router.get('/resendmail', resendmail);
// router.post('/forgotpassword', forgotpassword);
// router.post('/reset', forgotpasswordreset);

// router.post('/close', close);

// router.get('/logout', logout)

// router.delete('/deconnection/:id', isLoggedIn, deconnection)

// ------------------------------------------------------------------------------------------------
// ---------------------------------------  Exportation  ------------------------------------------
// ------------------------------------------------------------------------------------------------

module.exports = router;