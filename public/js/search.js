
document.getElementById("search_query").addEventListener("keyup", function(event) {

    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("search_web").click();
    }
});

// document.addEventListener('keypress', function (event){
//     if (event.keyCode === 47) {
//         document.getElementById('search_query').focus();
//         document.getElementById('search_query').value='';
//     }
//     console.log(event.keyCode)
// });

document.getElementById('search_web').addEventListener('click', function(){
    let text=document.getElementById('search_query').value;
    console.log(text);
    text='https://www.google.com/search?q='+text
    window.open(text,'_blank');
});