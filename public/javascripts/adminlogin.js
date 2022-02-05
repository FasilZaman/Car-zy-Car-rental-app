$(document).ready(function(){
    jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test( value );
})
    $("#adminLogin").validate({
        rules:{
            email:{
                required:true,
                minlength:6,
                myemail:true
            },
            password:{
                required:true,
                minlength:3
            }
        },
        messages:{
            email:{
                myemail:'enter a valid email'
            }
        }
      });
})