const __toastify = (className, message) => {
    Toastify({
        className: className,
        text: message, // Display server message in the toast
        offset: { x: 50, y: 10 },
    }).showToast();
};

const errorHandler = (xhr) => {
    let serverMessage = '';
    if (xhr.responseJSON) {
        // If the server sends a JSON response
        serverMessage = xhr.responseJSON.message || 'An error occurred';
    } else if (xhr.responseText) {
        // If the server sends a plain text response
        serverMessage = xhr.responseText;
    } else {
        serverMessage = 'An unknown error occurred';
    }
    __toastify("danger", serverMessage);
};

const generatePwd = () => {
    const chars = 'abcdefgABCDEFGHI012345@#$%&';
    let passwd = '';
    for (let i = 0; i < 8; i++) {
        passwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $("#password").val(passwd);
    $("#password").css('color', '#888');
    $("#password-error").text('');
};

const loadFile  = function(event) {
    const output  = URL.createObjectURL(event.target.files[0]);
    $("#imagePreview img").attr('src', output);
};

$('input[type="number"]').on('keypress', function(e){
    return e.metaKey || // cmd/ctrl
        e.which <= 0 || // arrow keys
        e.which == 8 || // delete key
        /[0-9]/.test(String.fromCharCode(e.which)); // numbers
});

const routeName = window.location.pathname.split("/")[1];
switch (routeName) {
    case 'dashboard': 
        $(".dashboard").parent().addClass('active');
        break;
    case 'drivers':
    case 'create-driver':
    case 'driver':
    case 'get-driver': 
        $(".drivers").parent().addClass('active');
        break;
}

