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
const async = require('hbs/lib/async');

// check admin logged in or not

const verifylogin = (req,res,next) =>{
  if(req.session.adminLogin){
      next()
  }else{
    res.redirect('/admin/login')
  }
}
  



// admin login and home page

router.get('/login', async function (req, res, next) {
  if (req.session.adminLogin) {
    let response = await adminHelpers.getmostbookedcar()
    console.log(response);
    mostbookedcarname = response.name
    mostbookedcarbrand = response.Brand
    console.log(mostbookedcarname, "wewewe", mostbookedcarbrand);

    let mostbookedbrand = await adminHelpers.getmostbookedbrand()

    let mostbookedtype = await adminHelpers.getmostbookedtype()

    let allbookingscount = await adminHelpers.getallbookingscount()

    let allbookingsthismonth = await adminHelpers.getallbookingsthismonth()

    let allbookingstoday = await adminHelpers.getallbookingstoday()

    let allrecentbookings = await adminHelpers.getallrecentbookings()

    adminHelpers.getalluserscount().then((allusercount) => {
      adminHelpers.getallapprovedusercount().then((approvedusercount) => {
        adminHelpers.getallcarscount().then((allcarscount) => {
          adminHelpers.getallavailablecarscount().then((availablecarscount) => {
            res.render('admin/adminhome', {
              admin: true, allusercount, approvedusercount, allcarscount, allbookingsthismonth, allrecentbookings,
              allbookingstoday, availablecarscount, mostbookedcarname, mostbookedcarbrand, mostbookedbrand, mostbookedtype, allbookingscount
            })
          })
        })
      })
    })



  } else {
    res.render('admin/adminlogin', { adminerr: req.session.adminerr, user: true })
    req.session.adminerr = false
  }

});

//admin login page

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

//admin logout

router.get('/logout', (req, res) => {
  req.session.adminLogin = false
  res.redirect('/admin/login')
})

// showing all cars in admin side

router.get('/carslist', (req, res) => {
  if (req.session.adminLogin) {
    carsHelpers.getcardetails().then((Cars) => {
      res.render('admin/carslist', { Cars, admin: true })
    })
  } else {
    res.redirect('/admin/login')
  }

})

// admin add a car page

router.get('/addcars', (req, res) => {
  if (req.session.adminLogin) {
    res.render('admin/addcars', { carfound: req.session.carfound, admin: true })
  } else {
    res.redirect('/admin/login')
  }

})

// admin car details page

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

// admin add a car

router.post('/addone',verifylogin, (req, res) => {
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

// admin delete a car

router.get('/deletecar/:id',verifylogin, (req, res) => {
  carId = req.params.id
  carsHelpers.deletecar(carId).then((response) => {
    console.log('Car Deleted');
    fs.unlinkSync('./public/carimages/' + carId + '1.jpg')
    fs.unlinkSync('./public/carimages/' + carId + '2.jpg')
    fs.unlinkSync('./public/carimages/' + carId + '3.jpg')
    res.redirect('/admin/carslist')
  })
})

// admin edit a car details page

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

// admin edit a car

router.post('/editCars/:id',verifylogin, (req, res) => {
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

//approved users list

router.get('/approvedusers',verifylogin, (req, res) => {
  userhelpers.approveduser().then((approvedusers) => {
    res.render('admin/approvedusers', { admin: true, approvedusers })
  })
})

//not approved users list

router.get('/notapprovedusers',verifylogin, (req, res) => {
  userhelpers.notapproveduser().then((notapprovedusers) => {
    res.render('admin/notapprovedusers', { admin: true, notapprovedusers })
  })
})

//user details

router.get('/userdetails/:id',verifylogin, (req, res) => {
  let userId = req.params.id
  console.log(userId);
  userhelpers.userdetail(userId).then((users) => {
    res.render('admin/userdetails', { admin: true, users })
  })
})

//approve a user

router.get('/approveuser/:id',verifylogin, (req, res) => {
  let userId = req.params.id
  userhelpers.approveuser(userId).then((response) => {
    res.redirect('/admin/login')
  })
})

//get bookings details

router.get('/upcomingbookings',verifylogin, (req, res) => {
  adminHelpers.getallupcomingbookings().then((Bookings) => {

    console.log("All bookings :", Bookings);
    res.render('admin/allbookings', { Bookings, admin: true })
  })
})

//todays pickup bookings

router.get('/bookingstodaypickup',verifylogin, (req, res) => {
  adminHelpers.getbookingstoday().then((bookingstoday) => {
    pickup = true
    res.render('admin/bookingstoday', { admin: true, bookingstoday, pickup })

  })
})

// todays booking for for delivery

router.get('/fordelivery',verifylogin, (req, res) => {
  adminHelpers.getbookingstodaydelivery().then((bookingstodaydelivery) => {
    console.log("ererererer:", bookingstodaydelivery);
    res.render('admin/bookingstoday', { admin: true, bookingstodaydelivery })

  })
})

// all ongoing bookings

router.get('/ongoingbookings',verifylogin, (req, res) => {
  adminHelpers.getongoingbookings().then((bookings) => {
    console.log("*********************1234", bookings);
    res.render('admin/ongoingbookings', { admin: true, bookings })

  })

})

// all ended bookkings

router.get('/endedbookings',verifylogin, (req, res) => {
  adminHelpers.getendedbookings().then((bookings) => {

    res.render('admin/endedbookings', { admin: true, bookings })

  })

})

// all cancelled bookings

router.get('/cancelledbookings',verifylogin, (req, res) => {
  adminHelpers.getcancelledbookings().then((bookings) => {
    res.render('admin/cancelledbookings', { admin: true, bookings })
  })
})


// admin can start a trip


router.get('/starttrip/',verifylogin, (req, res) => {
  bookingid = req.query.id
  console.log("***********************************************************", bookingid);
  adminHelpers.startatrip(bookingid).then((response) => {
    res.redirect('/admin/ongoingbookings')
  })
})

// admin can end a trip

router.get('/endtrip/',verifylogin, (req, res) => {
  bookingid = req.query.id
  userid = req.query.user
  console.log("***********************************************************", bookingid);
  adminHelpers.endatrip(bookingid,userid).then((response) => {
    res.redirect('/admin/endedbookings')
  })
})

// all coupons page

router.get('/coupons',verifylogin, (req, res) => {
  adminHelpers.getcoupons().then((coupons) => {
    console.log("..........................................................................................", coupons);
    res.render("admin/coupons", { admin: true, coupons , couponfound:req.session.couponfound })
  })
})

// add a coupon

router.post('/addCoupons',verifylogin, (req, res) => {
  adminHelpers.addcoupon(req.body).then((response) => {
    console.log("requestbody : ",req.body);
    if(response.couponfound){
      req.session.couponfound = true
      res.redirect('/admin/coupons')
    }else{
      req.session.couponfound = false
      res.redirect('/admin/coupons')
    }
   
  })
})

// delete a coupon

router.get('/deletecoupon',verifylogin, (req, res) => {
  id = req.query.id
  console.log("abcd", id);
  adminHelpers.deletecoupon(id).then((response) => {
    res.redirect('/admin/coupons')
  })
})

// all offers

router.get('/offers',verifylogin, (req, res) => {
  adminHelpers.getbrand().then((Brands) => {
    adminHelpers.getType().then((Type) => {
      adminHelpers.getoffers().then((offers) => {
        res.render("admin/offers", { admin: true, Brands, Type, offers, alreadyexists: req.session.offerexist })
      })
    })
  })

})

// add a offer

router.post('/addoffers',verifylogin, (req, res) => {
  adminHelpers.addoffer(req.body).then((response) => {
    req.session.offerexist = response.alreadyexist
    console.log(response)
    res.redirect('/admin/offers')
  })
})

// delete an offer

router.get('/deleteoffer/',verifylogin, (req, res) => {
  console.log("qwerty");
  id = req.query.id
  console.log("abcd", id);
  adminHelpers.deleteoffer(id).then((response) => {

    res.redirect('/admin/offers')
  })
})

// get data into a chart

router.get('/getChartdata',verifylogin, async (req, res) => {
  let response = {}
  await adminHelpers.getchartdata().then((allbookings) => {
    response.all = allbookings
  })
  await adminHelpers.getpricebyType().then((pricebyType) => {
    response.Type = pricebyType
  })
  res.json(response)
})

// search report

router.get('/bookingsreport',verifylogin, (req, res) => {
  res.render('admin/bookingsreport', { admin: true })
})


// all bookings report

router.post('/searchbookingsreport',verifylogin, (req, res) => {
  console.log("reportside1 : ", req.body);
  let startdate = req.body.startDate
  let enddate = req.body.endDate
  adminHelpers.getbookingsreport(req.body).then((bookingsreport) => {
    res.render('admin/report', { admin: true, bookingsreport,startdate,enddate })
  })
})

// user reports

router.get('/userreport',verifylogin, (req, res) => {
  adminhelpers.getuserreport().then((userreport) => {
    res.render('admin/userreport', { admin: true, userreport })
  })
})

//cancel a ride

router.get('/cancelrideadmin/',verifylogin, (req, res) => {
  console.log("qertyuyuy:");
  id = req.query.id
  userid = req.query.user
  console.log("userfor:::....................................", userid);
  carsHelpers.getbookingdata(id).then((booking) => {
    let Price = booking.price
    console.log(Price);
    wallet = parseInt(Price) * (80 / 100)
    console.log(wallet);
    carsHelpers.cancelbooking(id).then((response) => {
      console.log("ride cancelled");
    })
    carsHelpers.updateuserwallet(userid, wallet).then((response) => {
      res.redirect('/admin/cancelledbookings')
    })
  })
})
  

module.exports = router;
