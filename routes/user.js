const { response } = require('express');
var express = require('express');
const res = require('express/lib/response');
var moment = require('moment')
var router = express.Router();
const userhelpers = require('../helpers/userhelpers')
var carsHelpers = require('../helpers/carshelpers');
const { Client } = require('twilio/lib/twiml/VoiceResponse');
var fs = require('fs');
const serviceSID = process.env.serviceSID
const accountSID = process.env.accountSID
const authTockon = process.env.authToken
const paypalsecret = process.env.paypalsecret
const req = require('express/lib/request');
const async = require('hbs/lib/async');
const client = require('twilio')(accountSID, authTockon);
const paypal = require('paypal-rest-sdk');
const { ObjectId } = require('mongodb');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'Af9zpw5WTBmWLed-SFeHXO7fj-Jkga5zVQoe7CTZEFP8ynZE8X-XYxS2Yb3i3xMnbQOP2E66oD4F75U-',
  'client_secret': paypalsecret
});

const verifyUser = async (req, res, next) => {
  if (req.session.Mobilenum) {
    let userblocked = await userhelpers.getuserdetails(req.session.Mobilenum)
    if (userblocked) {
      if (userblocked.blocked) {
        req.session.user = false
      } else {
        req.session.userDetails = userblocked
      }
    } else {
      req.session.user = false
    }
  }
  next()
}

/* GET home page. */
router.get('/', verifyUser, function (req, res, next) {
  userdetails = req.session.userdetails
  res.render('user/home', { 'loggedIn': req.session.user, user: true, userdetails });
});

//loading user login page
router.get('/loginpage', verifyUser, (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginerr: req.session.loginerr, user: true })
  }
})

//user login
router.post('/userlogin', (req, res) => {
  userhelpers.userlogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = true
      req.session.userdetails = response.user
      req.session.Mobilenum = response.user.mobileNumber
      req.session.loginerr = false
      res.redirect('/')
    } else {
      req.session.loginerr = true
      res.redirect('/loginpage')
    }
  })

})


//loading user login with otp page
router.get('/loginotp', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/loginotp', { invalidnumber: req.session.invalidnumber, user: true })
  }
})
//otp logging in
router.post('/userloginotp', (req, res) => {
  let mobile = req.body.mobileNumber
  req.session.number = mobile
  userhelpers.getuserdetails(mobile).then((user) => {
    if (user) {
      req.session.invalidnumber = false
      req.session.temp = req.body
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.mobileNumber}`,
          channel: "sms"
        }).then((resp) => {
          res.redirect('/otplogin');
        }).catch((err) => {
          console.log(err);
        })
    } else {
      req.session.invalidnumber = true
      res.redirect('/loginotp')

    }
  })
})


//resend button
router.get('/resendotp', (req, res) => {

  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `+91${req.session.number}`,
      channel: "sms"
    }).then((resp) => {
      res.redirect('/otplogin');
    }).catch((err) => {
      console.log(err);
    })
})

router.get('/otplogin', (req, res) => {
  res.render('user/userloginotp', { invalidloginotp: req.session.invalidloginotp, user: true })
})

router.post('/loginotp', (req, res) => {
  let OTP = req.body.otp
  let number = req.session.number

  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: OTP
    }).then(async (resp) => {
      if (resp.valid) {
        req.session.Mobilenum = number
        req.session.invalidloginotp = false
        // let user = await userHelper.getuserdetails(number)
        req.session.user = true
        res.redirect('/')
      } else {
        req.session.invalidloginotp = true
        res.redirect('/otplogin')
      }
    }).catch((err) => {
      req.session.invalidloginotp = true
      res.redirect('/otplogin')
    })
})
//end login with otp

//otp signup

router.get('/signuppage', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/signup', { user: true })
  }
})



router.post('/usersignup', (req, res) => {
  let mobile = req.body.mobileNumber
  req.session.number = mobile
  userhelpers.getuserdetails(mobile).then((user) => {
    if (user) {
      res.redirect('/signuppage')
    } else {
      req.session.temp = req.body
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: `+91${req.body.mobileNumber}`,
          channel: "sms"
        }).then((resp) => {
          res.redirect('/otp');
        }).catch((err) => {
          console.log(err);
        })

    }
  })
})


router.get('/resendotpsignup', (req, res) => {

  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `+91${req.session.number}`,
      channel: "sms"
    }).then((resp) => {
      res.redirect('/otp');
    }).catch((err) => {
      console.log(err);
    })
})

router.get('/otp', (req, res) => {
  res.render('user/signupotp.hbs', { user: true })
})


router.post('/otp', (req, res) => {
  let OTP = req.body.otp
  let number = req.session.number
  console.log(number);
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: OTP
    }).then(async (resp) => {
      if (resp.valid) {
        req.session.Mobilenum = number
        await userhelpers.usersignup(req.session.temp).then((response) => {
          fs.copyFile('./public/images/blankprofile.jpg', './public/profileimages/' + response.insertedId + 'dp.jpg', (err) => {
            if (err) throw err;
            console.log('source.txt was copied to destination.txt');
          })
          // let user = await userHelper.getuserdetails(number)
          req.session.user = true
          res.redirect('/')
        })
      } else {
        userhelpers.
          req.session.inavlidloginOtp = true
        res.redirect('/otp')
      }
    }).catch((err) => {
      req.session.inavlidloginOtp = true
      res.redirect('/otp')
    })
})

//end otp signup

router.get('/logout', (req, res) => {
  req.session.user = false
  res.redirect('/')
})

router.post('/carslist', (req, res) => {
  //date and time
  var pickup = new Date(`${req.body.pickupDate} ${req.body.pickuptime}`)
  console.log('IST :', pickup.toString());
  console.log("pickup date and time :", pickup);
  var dropoff = new Date(`${req.body.dropoffDate} ${req.body.dropofftime}`)
  console.log('IST :', dropoff.toString());
  console.log('dropoff date and time :', dropoff);

  var timediff = dropoff.getTime() - pickup.getTime()
  console.log('sec :', timediff);

  hourdiff = timediff / (1000 * 60 * 60)

  req.session.totalhours = hourdiff

  console.log('diff :', hourdiff);
  var diff = parseInt(hourdiff)
  console.log(diff);
  //end date and time

  req.session.bookingdetail = req.body
  bookingdetails = req.session.bookingdetail
  carsHelpers.getusercars(diff, req.body).then((Cars) => {
    
    for (let i of Cars){
      if(i.discount){        
        // req.session.discount = true
        discountamount = (i.Price*i.discount)/100
        discountedPrice = (i.Price - discountamount )
        i.realPrice = i.Price
        i.Price = parseInt(discountedPrice)
        i.discountamount = parseInt(discountamount)
      }
    }
    console.log(Cars);
   
  
      res.render('user/carslist', { Cars, user: true, bookingdetails  })
   
    

  })
})
router.get('/carslistpage', (req, res) => {
  location = bookingdetails.location
  carsHelpers.getcardetails().then((Cars) => {
    res.render('user/carslist', { Cars, user: true, })
  })
})

router.get('/carsdetails/:id', (req, res) => {
  let carId = req.params.id
  carsHelpers.carDetails(carId).then((Car) => {
    Car.Price = parseInt(Car.Price * req.session.totalhours)
    console.log("miniminimini",Car);
    if(Car.discount){
      console.log("wertyq");
      discountamount = (Car.Price*Car.discount)/100
      discountedPrice = (Car.Price - discountamount )
      Car.realPrice = Car.Price
      Car.Price = parseInt(discountedPrice)
      Car.discountamount = parseInt(discountamount)
    }
    req.session.car = Car
    console.log(Car);
    res.render('user/carsdetails', { Car, user: true })
  })
})

router.get('/Bookcar/', verifyUser, async (req, res) => {
  let carId = req.query.id
  if (req.query.id) {
    req.session.coupon = false
    req.session.carid = carId
    console.log("11111111111111111111111111111111111111111111111", carId);
  }
  carId = req.session.carid
  couponid = req.session.couponid
  if (req.session.user) {
    approved = req.session.userDetails.approved
    user = req.session.userDetails

    let coupon = await userhelpers.getcoupon()
    
    if(user.coupon){
      for (let i in coupon){
        for (let j of user.coupon){
          console.log(coupon[i]._id,"=======",ObjectId(j));
          var usercoupon = coupon[i]._id.toString()
          var couponid =  ObjectId(j).toString()
          console.log(usercoupon,":::",couponid);
          if(usercoupon == couponid){
            console.log("yes");
            coupon.splice(i,1)
          }
        }
      }
    }

    console.log("after splice : ",coupon);

    console.log("12345678900909090900909090", coupon);




    carsHelpers.carDetails(carId).then((Car) => {
      console.log("sssssssssssssssssssssssssssssssssssssssssssssssssssssss", Car);
      Car.Price = parseInt(Car.Price * req.session.totalhours)
      console.log(Car.Price);
      let discount = 0


      if(Car.discount){
        console.log("wertyq");
        discountamount = (Car.Price*Car.discount)/100
        discountedPrice = (Car.Price - discountamount )
        // Car.realPrice = Car.Price
        Car.Price = parseInt(discountedPrice)
        // Car.discountamount = parseInt(discountamount)
      }


      
      if (req.session.coupon) {
        off = req.session.couponoff
        console.log(off);
        discount = Car.Price * (parseInt(off) / 100)
        discount = parseInt(discount)
        Car.Price = Car.Price * ((100 - parseInt(off)) / 100)
        console.log(Car.Price);
        Car.Price = parseInt(Car.Price)
      }

      userdetails = req.session.userDetails
      console.log(userdetails);
      if (userdetails.wallet) {
        walletmoney = parseInt(userdetails.wallet)
        Price1 = Car.Price
        // console.log("wallet: ",walletmoney,"JKKJHJHJHJHJHJH: ",Price1);
        if (walletmoney > Price1) {
          req.session.wallet = true
          // console.log("und");
        } else {
          req.session.wallet = false
          // console.log("sadhanam illa");
        }
      }
      req.session.car = Car
      console.log(Car);
      res.render('user/userbooking', { Car, user: true, bookingdetails, approved, wallet: req.session.wallet, coupon, couponoff: req.session.coupon, discount })
    })
  } else {
    res.redirect('/loginpage')
  }
})

router.get('/applycoupon/', (req, res) => {
  if (req.query.couponoff) {
    off = req.query.couponoff
    id = req.query.couponid
    req.session.couponid = id
    req.session.couponoff = off
    console.log(req.session.couponoff);
    req.session.coupon = true
    res.redirect('/Bookcar')
  } else {
    req.session.coupon = false
    req.session.couponid = null
    res.redirect('/Bookcar')
  }

})


router.post('/searchCar', (req, res) => {
  let carname = req.body.search
  console.log(carname);
  location = bookingdetails.location
  console.log(location);
  carsHelpers.getCars(carname, location).then((Cars) => {
    if (Cars != "") {
      Cars.Price = parseInt(Cars.Price * req.session.totalhours)
      req.session.nocarfound = false
      console.log(Cars);
      match = req.session.allmatchcars
      res.render('user/carslist', { Cars, user: true, bookingdetails, match })
    }
    else {
      req.session.nocarfound = true
      carsHelpers.getcarinlocation(location).then((Cars) => {
        Cars.Price = parseInt(Cars.Price * req.session.totalhours)
        res.render('user/carslist', { Cars, user: true, bookingdetails })
      })

      // if(carname=""){
      //   req.session.nocarfound=false
      //   res.redirect('/carslistpage')
      // }else{
      //   req.session.nocarfound=true
      //   res.redirect('/carslistpage')
      // }

    }
  })
})

router.get('/userprofile', verifyUser, (req, res) => {
  if (req.session.user) {
    userdetails = req.session.userDetails
    if (userdetails.wallet) {
      req.session.wallet = true
    }
    userhelpers.getdetails(userdetails).then((userprofile) => {
      // console.log(userprofile);
      res.render('user/userprofile', { user: true, userprofile, wallet: req.session.wallet })
    })
  } else {
    res.redirect('/')
  }
})

router.get('/license', verifyUser, (req, res) => {
  if (req.session.user) {
    res.render('user/licenseedit', { user: true, userdetails })
  } else {
    res.redirect('/')
  }
})
router.post('/editlicense', (req, res) => {
  if (req.session.user) {
    console.log(req.body.licenseNumber);
    userdetails = req.session.userDetails
    userhelpers.license(userdetails, req.body.licenseNumber).then((response) => {
      if (req.files) {
        if (req.files.licenseImage1) {
          let license1 = req.files.licenseImage1
          license1.mv('./public/licenseimages/' + userdetails._id + 'license1.jpg')
        }
        if (req.files.licenseImage2) {
          let license2 = req.files.licenseImage2
          license2.mv('./public/licenseimages/' + userdetails._id + 'license2.jpg')
        }
        res.redirect('/userprofile')
      } else {
        res.redirect('/userprofile')
      }


    })

  } else {
    res.redirect('/')
  }
})

router.get('/editprofile', verifyUser, (req, res) => {
  if (req.session.user) {
    res.render('user/editprofile', { user: true, userdetails, emailnumbererror: req.session.emailnumbererror, emailerror: req.session.emailerror, numbererror: req.session.numbererror })
  } else {
    res.redirect('/')
  }
})

router.post('/change', (req, res) => {
  console.log("qwerty : ", req.body);
  if (req.session.user) {

    userhelpers.edituser(userdetails, req.body).then((response) => {
      if (response.emailnumbererror) {
        console.log("qwertyuiop");
        req.session.emailnumbererror = true
        res.redirect('/editprofile')
      } else if (response.emailerror) {
        req.session.emailerror = true
        res.redirect('/editprofile')
      } else if (response.numbererror) {
        req.session.numbererror = true
        res.redirect('/editprofile')
      } else {
        if (req.files) {
          let profile = req.files.profilepic
          profile.mv('./public/profileimages/' + userdetails._id + 'dp.jpg')
          console.log("qertyhhngcfxxyguvtgcgu");
          res.redirect('/userprofile')
        } else {
          console.log("jSHAGSHAGSH");
          res.redirect('/userprofile')
        }

      }
    })
  } else {
    res.redirect('/')
  }
})

router.get('/editpassword', (req, res) => {
  if (req.session.user) {
    res.render('user/editpassword', { user: true, userdetails, wrongpassword: req.session.wrongpassword })
  } else {
    res.redirect('/')
  }
})

router.post('/newpassword', (req, res) => {
  if (req.session.user) {
    userhelpers.editpassword(userdetails, req.body).then((response) => {
      if (response.wrongpassword) {
        req.session.wrongpassword = true
        res.redirect('/editpassword')
      } else {
        console.log('nthelujm');
        res.redirect('/userprofile')
      }
    })
  } else {
    res.redirect('/')
  }
})

//Booking
router.post('/booknow', (req, res) => {
  console.log(req.body);
  longitude = req.body.longitude
  lattitude = req.body.lattitude
  req.session.longitude = longitude
  req.session.lattitude = lattitude
  if (req.body.details == 'paymentoptions=razorpay') {
    console.log(Price);
    userhelpers.generateRazorpay(Price).then((response) => {
      response.razorpay = true
      res.json(response)
    })

  } else if (req.body.details == 'paymentoptions=paypal') {
    console.log("qwerty1234567890");
    Price = parseInt(Price) / 75
    Price = parseInt(Price)
    const create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": "http://localhost:3000/deliveryordersuccess",
        "cancel_url": "http://localhost:3000/"
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": "Car-zy",
            "sku": "001",
            "price": Price,
            "currency": "USD",
            "quantity": 1
          }]
        },
        "amount": {
          "currency": "USD",
          "total": Price
        },
        "description": "best rentals ever"
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            response.payment = payment.links[i].href
            response.paypal = true
            res.json(response)
          }
        }
      }
    });

  } else if (req.body.details == 'paymentoptions=wallet') {
    console.log("qwerty");
    userdetails = req.session.userDetails
    userId = req.session.userDetails._id
    walletbal = userdetails.wallet - parseInt(Price)
    walletbalance = parseInt(walletbal)
    userhelpers.getfromwallet(userId, walletbalance).then(() => {
      response.wallet = true
      res.json(response)

    })

  }
})

router.post('/delivery', (req, res) => {
  console.log(req.body);
  if (req.session.user) {
    car = req.session.car
    Price = parseInt(req.session.car.Price) + 50
    car.Price = Price
    if (userdetails.wallet) {
      walletmoney = parseInt(userdetails.wallet)
      Price1 = car.Price
      console.log("wallet: ", walletmoney, "JKKJHJHJHJHJHJH: ", Price1);
      if (walletmoney > Price1) {
        req.session.wallet = true
        // console.log("und");
      } else {
        req.session.wallet = false
        // console.log("sadhanam illa");
      }
    }
    //  bookingdetails = req.session.bookingdetail
    res.render('user/delivery.hbs', { car, bookingdetails, wallet: req.session.wallet })
  } else {
    res.redirect('/loginpage')
  }
})

router.get('/razorpay', (req, res) => {
  console.log("qwerty---------------------------------------------------");
  if (req.session.user) {
    Price = req.session.car.Price
    userhelpers.generateRazorpay(Price).then((response) => {

      res.json(response)
    })
  } else {
    res.redirect('/loginpage')
  }

})

router.post('/verifypayment', (req, res) => {
  console.log(req.body);
  userhelpers.verifypayment(req.body).then(() => {

    console.log('paymentsuccessfull');
    res.json({ status: true })

  }).catch((err) => {
    console.log(err);
    res.json({ status: 'paymentfailed' })
  })
})

router.get('/ordersuccess', (req, res) => {
  userId = req.session.userDetails._id
  carId = req.session.car._id
  Price = req.session.car.Price
  couponid = req.session.couponid
  userhelpers.addcoupontouser(userId, couponid)
  userhelpers.bookacar(userId, carId, bookingdetails, Price).then(() => {
    res.render('user/successpage', { user: true })
  })
})

router.get('/deliveryordersuccess', (req, res) => {
  userId = req.session.userDetails._id
  carId = req.session.car._id
  Price = req.session.car.Price
  longitude = req.session.longitude
  lattitude = req.session.lattitude
  userhelpers.bookacardelivery(userId, carId, bookingdetails, Price, longitude, lattitude).then(() => {
    res.render('user/successpage', { user: true })
  })
})

router.get('/payfromwallet', (req, res) => {
  userdetails = req.session.userDetails

  userId = req.session.userDetails._id
  carId = req.session.car._id
  Price = req.session.car.Price

  walletbal = userdetails.wallet - parseInt(Price)
  walletbalance = parseInt(walletbal)
  userhelpers.getfromwallet(userId, walletbalance).then(() => {
    userhelpers.bookacar(userId, carId, bookingdetails, Price).then(() => {
      res.render('user/successpage', { user: true })
    })
  })
})

router.get('/paypal', (req, res) => {
  Price = req.session.car.Price
  Price = parseInt(Price) / 75
  Price = parseInt(Price)
  console.log(Price);
  const create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:3000/ordersuccess",
      "cancel_url": "http://localhost:3000/"
    },
    "transactions": [{
      "item_list": {
        "items": [{
          "name": "Car-zy",
          "sku": "001",
          "price": Price,
          "currency": "USD",
          "quantity": 1
        }]
      },
      "amount": {
        "currency": "USD",
        "total": Price
      },
      "description": "best rentals ever"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });

});

router.get('/userrides', verifyUser, (req, res) => {
  if (req.session.user) {
    carsHelpers.getuserbookings(userdetails).then((userBookings) => {
      allbooking = true
      res.render('user/bookinghistory', { user: true, userBookings, allbooking })
    })
  } else {
    res.redirect('/')
  }
})

router.get('/upcomingrides', (req, res) => {
  if (req.session.user) {
    carsHelpers.getupcomingbookings(userdetails).then((userBookings) => {
      upcoming = true
      res.render('user/bookinghistory', { user: true, userBookings, upcoming })
    })
  } else {
    res.redirect('/')
  }

})

router.get('/ongoingrides', (req, res) => {
  if (req.session.user) {
    carsHelpers.getongoingbookings(userdetails).then((userBookings) => {
      ongoing = true
      res.render('user/bookinghistory', { user: true, userBookings, ongoing })
    })
  } else {
    res.redirect('/')
  }
})

router.get('/endedrides', (req, res) => {
  if (req.session.user) {
    carsHelpers.getendedbookings(userdetails).then((userBookings) => {
      ended = true
      res.render('user/bookinghistory', { user: true, userBookings, ended })
    })
  } else {
    res.redirect('/')
  }

})

router.get('/cancelride/', (req, res) => {
  console.log("qertyuyuy:");
  id = req.query.id
  userid = req.query.user
  console.log("userfor:::....................................", userid);
  carsHelpers.getbookingdata(id).then((booking) => {
    let Price = booking.price
    console.log(Price);
    wallet = parseInt(Price) * (80 / 100)
    console.log(wallet);
    carsHelpers.deletebooking(id).then((response) => {
      console.log("ride cancelled");
    })
    carsHelpers.updateuserwallet(userid, wallet).then((response) => {
      res.redirect('/upcomingrides')
    })
  })
})









module.exports = router;