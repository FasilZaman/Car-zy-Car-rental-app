$(document).ready(function(){
    jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test( value );
})
    $("#searchcar").validate({
        rules:{
            pickupDate:{
                required:true
            },
            pickuptime:{
                required:true
            },
            dropoffDate:{
                required:true
            },
            dropofftime:{
                required:true
            }
        }
      });
})
