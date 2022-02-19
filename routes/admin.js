const { response } = require('express');
var express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
var router = express.Router();
var adminHelpers = require('../helpers/adminhelpers')
var carsHelpers = require('../helpers/carshelpers')
var fs = require('fs');
const { request } = require('http');
const userhelpers = require('../helpers/userhelpers');
const adminhelpers = require('../helpers/adminhelpers');


/* GET users listing. */
router.get('/login', function (req, res, next) {
  if (req.session.adminLogin) {
    res.render('admin/adminhome', { admin: true })
  } else {
    res.render('admin/adminlogin', { adminerr: req.session.adminerr, user: true })
  }

});
router.post('/adminlogin', (req, res) => {
  adminHelpers.adminLogin(req.body).then((response) => {
    if (response.adminstatus) {
      req.session.adminLogin = true
      req.session.adminerr = false
      res.redirect('/admin/login')
    } else {
      req.session.adminerr = true
      res.redirect('/admin/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.adminLogin = false
  res.redirect('/admin/login')
})
router.get('/carslist', (req, res) => {
  if (req.session.adminLogin) {
    carsHelpers.getcardetails().then((Cars) => {
      res.render('admin/carslist', { Cars, admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }

})
router.get('/addcars', (req, res) => {
  if (req.session.adminLogin) {
    res.render('admin/addcars', { carfound: req.session.carfound, admin: true })
  } else {
    res.redirect('/admin/login')
  }

})
router.get('/cardetails/:id', (req, res) => {
  if (req.session.adminLogin) {
    let carId = req.params.id
    carsHelpers.carDetails(carId).then((Car) => {
      console.log(Car);
      res.render('admin/cardetails', { Car, admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }

})
router.post('/addone', (req, res) => {
  carsHelpers.addcardetails(req.body).then((response) => {
    if (response.carfound) {
      req.session.carfound = true
      console.log("car already exist");
      res.redirect('/admin/carslist')
    } else {
      let car1 = req.files.carImage1
      let car2 = req.files.carImage2
      let car3 = req.files.carImage3
      car1.mv('./public/carimages/' + response.id + '1.jpg')
      car2.mv('./public/carimages/' + response.id + '2.jpg')
      car3.mv('./public/carimages/' + response.id + '3.jpg')
      res.redirect('/admin/carslist')
    }
  })
})
router.get('/deletecar/:id', (req, res) => {
  carId = req.params.id
  carsHelpers.deletecar(carId).then((response) => {
    console.log('Car Deleted');
    fs.unlinkSync('./public/carimages/' + carId + '1.jpg')
    fs.unlinkSync('./public/carimages/' + carId + '2.jpg')
    fs.unlinkSync('./public/carimages/' + carId + '3.jpg')
    res.redirect('/admin/carslist')
  })
})
router.get('/editCarPage/:id', (req, res) => {
  if (req.session.adminLogin) {
    let carId = req.params.id
    console.log(carId);
    carsHelpers.carDetails(carId).then((Car) => {
      res.render('admin/editcars', { Car, admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }

})

router.post('/editCars/:id', (req, res) => {
  carId = req.params.id
  if (req.files) {
    if (req.files.carImage1) {
      carsHelpers.editCarDetails(carId, req.body).then((response) => {
        let car1 = req.files.carImage1
        car1.mv('./public/carimages/' + carId + '1.jpg')
      })
    }
    if (req.files.carImage2) {
      carsHelpers.editCarDetails(carId, req.body).then((response) => {
        let car2 = req.files.carImage2
        car2.mv('./public/carimages/' + carId + '2.jpg')
      })
    }
    if (req.files.carImage3) {
      carsHelpers.editCarDetails(carId, req.body).then((response) => {
        let car3 = req.files.carImage3
        car3.mv('./public/carimages/' + carId + '3.jpg')
      })
    }
    res.redirect('/admin/carslist')

  } else {
    console.log("no file found");
    carsHelpers.editCarDetails(carId, req.body).then((response) => {
      res.redirect('/admin/carslist')
    })

  }

})

router.get('/approvedusers', (req, res) => {
  userhelpers.approveduser().then((approvedusers) => {
    res.render('admin/approvedusers', { admin: true, approvedusers })
  })
})

router.get('/notapprovedusers', (req, res) => {
  userhelpers.notapproveduser().then((notapprovedusers) => {
    res.render('admin/notapprovedusers', { admin: true, notapprovedusers })
  })
})
router.get('/userdetails/:id', (req, res) => {
  let userId = req.params.id
  console.log(userId);
  userhelpers.userdetail(userId).then((users) => {
    res.render('admin/userdetails', { admin: true, users })
  })
})

router.get('/approveuser/:id', (req, res) => {
  let userId = req.params.id
  userhelpers.approveuser(userId).then((response) => {
    res.redirect('/admin/login')
  })
})

//get bookings details

router.get('/upcomingbookings', (req, res) => {
  adminHelpers.getallupcomingbookings().then((Bookings) => {

    console.log("All bookings :", Bookings);
    res.render('admin/allbookings', { Bookings, admin: true })
  })

})

router.get('/bookingstodaypickup',(req,res)=>{
  adminHelpers.getbookingstoday().then((bookingstoday)=>{
    pickup=true
    res.render('admin/bookingstoday',{admin:true,bookingstoday,pickup})

  })
})

router.get('/fordelivery',(req,res)=>{
  adminHelpers.getbookingstodaydelivery().then((bookingstodaydelivery)=>{
      console.log("ererererer:",  bookingstodaydelivery);
    res.render('admin/bookingstoday',{admin:true,bookingstodaydelivery})

  })
})

router.get('/ongoingbookings',(req,res)=>{
  adminHelpers.getongoingbookings().then((bookings)=>{
    console.log("*********************1234",bookings);
    res.render('admin/ongoingbookings',{admin:true,bookings})

  })

})

router.get('/endedbookings',(req,res)=>{
  adminHelpers.getendedbookings().then((bookings)=>{

    res.render('admin/endedbookings',{admin:true,bookings})

  })

})

router.get('/starttrip/',(req,res)=>{
  bookingid = req.query.id
  console.log("***********************************************************",bookingid);
  adminHelpers.startatrip(bookingid).then((response)=>{
    res.redirect('/admin/ongoingbookings')
  })
})

router.get('/endtrip/',(req,res)=>{
  bookingid = req.query.id
  console.log("***********************************************************",bookingid);
  adminHelpers.endatrip(bookingid).then((response)=>{
    res.redirect('/admin/endedbookings')
  })
})

router.get('/coupons',(req,res)=>{
  adminHelpers.getcoupons().then((coupons)=>{
    console.log("..........................................................................................",coupons);
    res.render("admin/coupons",{admin:true , coupons})
  })
})

router.post('/addCoupons',(req,res)=>{
  adminHelpers.addcoupon(req.body).then((response)=>{
    res.redirect('/admin/coupons')
  })
})

router.get('/deletecoupon',(req,res)=>{
  id = req.query.id
  console.log("abcd",id);
  adminHelpers.deletecoupon(id).then((response)=>{
    res.redirect('/admin/coupons')
  })
})



module.exports = router;
 