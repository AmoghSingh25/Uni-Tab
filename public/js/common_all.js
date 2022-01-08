$(document).ready(function(){
    display_ct6();
})
function display_ct6() {
    document.getElementById('ct6').innerHTML = moment().format('MMMM Do YYYY, h:mm:ss a');
    display_c6();
}
function display_c6(){
    const refresh = 1000; // Refresh rate in milli seconds
    const mytime = setTimeout('display_ct6()', refresh);
}
