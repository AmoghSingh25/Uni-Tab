var elements = document.getElementsByClassName("tasks");
let taskname,taskid,status;
// for (var i = 0; i < elements.length; i++) {
//     elements[i].addEventListener('keyup', function (event) {
//         if(event.keyCode===13)
//         {
//             document.activeElement.blur();
//             taskname=elements[i].innerHTML;
//             console.log(taskname);
//         }
//     }, false);
// }

document.addEventListener('DOMContentLoaded', add_listeners);

document.getElementById("add_button").addEventListener('click', function(){
    add_listeners();
})


function add_listeners() {
    document.querySelectorAll('.tasks').forEach(function (item) {
        item.addEventListener('keyup', async function (event) {
            if (event.keyCode === 13) {
                document.activeElement.blur();
                let doc = {
                    task: item.value,
                    task_status: 0,
                    task_id: item.id,
                }
                console.log(doc)
                await postData('/tasks-update', doc);
                console.log('here');
                window.location.reload();

            }
        });
    });
}

async function task_checked(id)
{
    console.log('checked');
    let div = document.getElementById("task-"+id);
    div.style.display="none";
    let resp = await postData('/tasks-delete', {task_id:id});
}

async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    //return response.json();
}




//Shows Input Box When Focussed
