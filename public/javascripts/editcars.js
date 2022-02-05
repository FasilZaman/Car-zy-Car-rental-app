$(document).ready(function () {
    $("#editcars").validate({
        rules: {
            Name: {
                required: true,
            },
            Brand: {
                required: true,
            },
            Fuel: {
                required: true
            },
            Type: {
                required: true
            },
            Transmission: {
                required: true
            },
            Seats: {
                required: true
            },
            Carnumber: {
                required: true
            },
            Mileage: {
                required: true
            },
            Price: {
                required: true
            },
            Status: {
                required: true
            }
        }
    });
})