const { response } = require("../../app");
const { post } = require("../../routes/admin");

function getrazorpay() {
    $.ajax({
        url: '/razorpay',
        method: "get",
        success: (response) => {
            alert(response)
            console.log("qwerty");
            var options = {
                "key": "rzp_test_eLURsrDuG4E6Yb", // Enter the Key ID generated from the Dashboard
                "amount": response.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                "currency": "INR",
                "name": "car-Zy",
                "description": "Booking Transaction",
                "image": "https://example.com/your_logo",
                "order_id": response.id, //This is a sample Order ID. Pass the `id` obtained in the previous step
                "handler": function (response) {
                    // alert(response.razorpay_payment_id);
                    // alert(response.razorpay_order_id);
                    // alert(response.razorpay_signature)

                    verifypayment(response)
                },
                "prefill": {
                    "name": "Gaurav Kumar",
                    "email": "gaurav.kumar@example.com",
                    "contact": "9999999999"
                },
                "notes": {
                    "address": "Razorpay Corporate Office"
                },
                "theme": {
                    "color": "#3399cc"
                }
            };
            var rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.code);
                alert(response.error.description);
                alert(response.error.source);
                alert(response.error.step);
                alert(response.error.reason);
                alert(response.error.metadata.order_id);
                alert(response.error.metadata.payment_id);
            });
            rzp1.open();
            e.preventDefault();
        }
    })
}
function verifypayment(payment) {
    $.ajax({
        url: '/verifypayment',
        data: {
            payment
        },
        method: 'post',
        success:(response)=>{
            if(response.status){
                window.location.href ='/ordersuccess'
            }else{
                alert("paymentfailed")
            }
        }
    })
}