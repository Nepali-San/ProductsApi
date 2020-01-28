const express = require('express')
const router = express.Router()
const authController = require('../../controllers/authController')
const userController = require('../../controllers/userController')

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.post('/forgot-password', authController.forgotPassword)
router.patch('/reset-password/:token', authController.resetPassword)

//use protect function as middleware in all routes below it
router.use(authController.protect)

router.get('/me', userController.getMe, userController.getUser)
router.patch('/update-me', userController.updateMe)
router.patch('/delete-me', userController.deleteMe)

//use restriction function as middleware in all routes below it
router.use(authController.restrictTo('admin'))

router.get('/', userController.getusers)
router.patch('/update-user/:id', userController.updateUser)
router.delete('/delete-user/:id', userController.deleteUser)
router.get('/get-user/:id', userController.getUser)

//user-within/233/center/-40,45/unit/km
router.get('/user-within/:distance/center/:latlng/unit/:unit', userController.getUsersWithin)

module.exports = router