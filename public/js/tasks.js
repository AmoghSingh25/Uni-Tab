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
                $('#loading').show();
                document.activeElement.blur();
                let doc = {
                    task: item.value,
                    task_status: 0,
                    task_id: item.id,
                }
                let ct=document.getElementsByClassName('tasks-div').length-1;
                if(document.getElementById('task-count'))
                    document.getElementById('task-count').innerHTML=ct+" Tasks remaining";
                let result = await postData('/tasks-update', doc);
                console.log('done-success');
                console.log(result);
                if (result.status === 200)
                {
                    $('#loading').hide();
                    console.log('done-success');
                }
            }
        });
    });
}

async function task_checked(id)
{
    $('#loading').show();
    console.log('checked');
    let div = document.getElementById("task-"+id);
    div.remove();
    let ct=document.getElementsByClassName('tasks-div').length-1;
    if(ct!=1 && document.getElementById('task-count'))
        document.getElementById('task-count').innerHTML=ct+" Tasks remaining";
    else if(document.getElementById('task-count'))
        document.getElementById('task-count').innerHTML=ct+" Task remaining";
    console.log(ct);
    let resp = await postData('/tasks-delete', {task_id:id});
    if(resp.status===200)
    {
        $('#loading').hide();
    }
    else
    {
        console.log('error');
    }
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
    return response.json();
}




//Shows Input Box When Focussed
