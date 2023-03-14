
// variables
const registrationInput = document.getElementById("registerForm");
const registerButton = document.getElementById("registerButton");
const registerOverlay = document.getElementById("registerOverlay");
const loginButton = document.getElementById("loginButton");
const loginOverlay = document.getElementById("loginOverlay");



// Changes the active form to login
function cambiar_login() {
    // Add "cont_forms_active_login" class to "cont_forms" div element
    document.querySelector('.cont_forms').className = "cont_forms cont_forms_active_login";  
    // Display the login form
    document.querySelector('.cont_form_login').style.display = "block";
    // Set the opacity of the sign-up form to 0 to hide it
    document.querySelector('.cont_form_sign_up').style.opacity = "0";               

    // After a delay of 400ms, set the opacity of the login form to 1 to show it
    setTimeout(function(){  document.querySelector('.cont_form_login').style.opacity = "1"; },400);  
    
    // After a delay of 200ms, hide the sign-up form
    setTimeout(function(){    
    document.querySelector('.cont_form_sign_up').style.display = "none";
    },200);  
}



// This function changes the active form to the sign-up form
function cambiar_sign_up(at) {
    // Select the forms container and add the class to activate the sign-up form
    document.querySelector('.cont_forms').className = "cont_forms cont_forms_active_sign_up";
    // Display the sign-up form and hide the login form
    document.querySelector('.cont_form_sign_up').style.display = "block";
    document.querySelector('.cont_form_login').style.opacity = "0";
    
    // Set a timeout to fade in the sign-up form
    setTimeout(function(){  document.querySelector('.cont_form_sign_up').style.opacity = "1";
    },100);  

    // Set a timeout to hide the login form
    setTimeout(function(){   document.querySelector('.cont_form_login').style.display = "none";
    },400);  
}    



// Function to hide login and sign up forms
function ocultar_login_sign_up() {
    // Set the class name of the form container to "cont_forms"
    document.querySelector('.cont_forms').className = "cont_forms";  
    // Set the opacity of the sign up form to 0
    document.querySelector('.cont_form_sign_up').style.opacity = "0";               
    // Set the opacity of the login form to 0
    document.querySelector('.cont_form_login').style.opacity = "0"; 
    
    // Use setTimeout to delay the hiding of the forms for 500ms
    setTimeout(function(){
        // Set the display property of the sign up form to "none"
        document.querySelector('.cont_form_sign_up').style.display = "none";
        // Set the display property of the login form to "none"
        document.querySelector('.cont_form_login').style.display = "none";
    },500);  
}



// User registration
// Register button click event listener
registrationInput.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get the user's input values for username and password
    const registerUsername = document.getElementById("registerUsername").value;
    const registerPassword = document.getElementById("registerPassword").value;

    // Send a POST request to the server to register the user
    const registerResponse = await fetch("http://localhost:3000/register",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({registerUsername, registerPassword})
    });

    // If the registration is successful, display a success message
    if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log(registerData);
        alert(registerData.message)

    // If the username is already taken, display an error message
    } else if (registerResponse.status === 409) {
        const registerData = await registerResponse.json();
        console.log(registerData);
        alert(registerData.message)
        
    // If there is a server error, display an error message
    } else {
        const registerData = await registerResponse.json();
        console.error(registerData);
        alert("Server error");
    }
});



// Get the HTML input element for the login form
const loginInput = document.getElementById("loginForm");



// User login function that sends a POST request to the server with the user's login information
const Userlogin = async (loginUsername, loginPassword) => {
    try {
        const loginResponse = await fetch("http://localhost:3000/login",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
        },
        body: JSON.stringify({loginUsername, loginPassword}),
    });

    // If the response from the server is successful, display the success message and redirect the user to a new page
    if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log(loginData);
        alert(loginData.message)

        // Redirect to a new page if there is a redirectUrl in the response data
        if (loginData.redirectUrl) {
            window.location.href = loginData.redirectUrl;
          }

    // If the response from the server is not successful, display an error message
    } else {
        alert("Invalid Username or Password!")
    }
} catch (error) {
    console.log(error.message);
    }  
}



// Add an event listener to the login form that calls the Userlogin function when the form is submitted
loginInput.addEventListener("submit", (event) => {
    event.preventDefault();

    const loginUsername = document.getElementById("loginUsername").value;
    const loginPassword = document.getElementById("loginPassword").value;

    Userlogin(loginUsername, loginPassword)
});