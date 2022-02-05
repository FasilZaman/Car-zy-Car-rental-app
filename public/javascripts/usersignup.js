$(document).ready(function(){
    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test( value );
})
    $("#signup").validate({
        rules:{
            username:{
                required:true,
                minlength:6
            },
            email:{
                required:true,
                minlength:6,
                myemail:true
            },
            password:{
                required:true,
                minlength:8,
                mypassword:true
            },
            confirmPassword:{
                required:true,
                equalTo:'#spassword'
            },
            mobileNumber: {
                required: true,
                number: true,
                minlength: 10,
                maxlength: 10
              }
        },
        messages:{
            email:{
                myemail:"enter a valid emailId"
            },
            password:{
                mypassword:"include both number and alphabets"
            },
            confirmPassword:{
                equalTo:'not equal to the entered password'
            }
        }
      });
})