const express = require('express');
const ejs = require('ejs');
const fetch = require('node-fetch')
var req = require('request');
const {MongoClient} = require("mongodb");
const firebase = require('firebase/auth');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const localStorage = require('web-storage')().localStorage;
require('dotenv').config({ path: '.env'});
const app = express();
app.set('view engine', 'ejs');
const bodyParser = require('body-parser');
const firebaseApp = require('firebase/app');


//configuration
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: process.env['secret'],
    saveUninitialized: true,
    cookie: {maxAge: oneDay},
    resave: false
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded());
app.use(express.json());

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messaginSenderId,
    appId: process.env.appId
};
require('path');
firebaseApp.initializeApp(firebaseConfig);
const uri = process.env.uri;
const dbName = "user";
const client = new MongoClient(uri);


let session;
let uid = -1;
let db;


async function run() {
    try {
        await client.connect();
        await listDatabases(client);
        await client.db("admin").command({ping: 1});
        console.log("Connected successfully to server");
        db = client.db(dbName);
    } catch (e) {
        console.error(e);
    }
}

run().catch(console.dir);


app.get('/login', async (req, res) => {
    res.render('pages/login')
})

app.post('/login', async (req, res) => {
    await signin(res, req, req.body.email, req.body.password)
    session = req.session;
    session.userid = uid;
    //console.log(req.session)
    console.log("Signed in,redirecting ");
});

app.get('/registration', async (req, res) => {
    res.render('pages/registration',);
});

app.get('/', async function (req, res) {
    const auth = firebase.getAuth();
    session = req.session;

    if (session.userid) {
        res.redirect('/index')
        console.log('Signed in')
    } else {
        console.log('Not signed in')
        res.redirect('/registration')
    }

});

app.post('/register', async (req, res) => {
    await signup(req, res, req.body.email, req.body.password)
});

app.use(function (req, res, next) {
    uid = req.session.userid
    if (uid == null && uid !== -1) {
        uid = -1
        res.redirect('/');
    } else {
        next();
    }
});


app.get('/index', async (req, res) => {
    let arr=localStorage.get('tasks');
    arr=arr.filter(n => n);
    console.log(arr);
    localStorage.set('tasks',arr);
    res.render('pages/index', {
        resp: localStorage.get('news'),
        weather: localStorage.get('weather'),
        tasks: localStorage.get('tasks')
    })
})

app.get('/news', async (req, res) => {
    let jsonResponse = localStorage.get('news');
    res.render('pages/news', {resp: jsonResponse});
});

app.post('/refresh_weather',async (req, res) => {
    localStorage.set('weather',await get_weather((localStorage.get('user-data')['city'])));
    console.log('Refreshed weather');
});

app.post('/refresh_news',async (req, res) => {
    localStorage.set('news',await get_news());
    console.log('Refreshed news');
});

app.get('/weather', async function (req, res) {
    let resp = localStorage.get('weather');
    res.render('pages/weather', {data: resp});
});

app.get('/profile', async function (req, res) {
    res.render('pages/profile',{data:localStorage.get('user-data')});
});

app.get('/tasks', async function (req, res) {
    res.render('pages/tasks',{tasks:localStorage.get('tasks')});
});

app.post('/tasks-delete', async (req, res) =>{
    let tasks_doc=localStorage.get('tasks');
    tasks_doc.splice(req.body.task_id,1);
    localStorage.set('tasks',tasks_doc);
    await update_tasks(tasks_doc)
    console.log('deleted',tasks_doc);
    return 'done';
})

app.post('/tasks-update', async (req, res) => {
    let task_id = req.body.task_id;
    let task_name = req.body.task;
    let status = req.body.task_status;
    let tasks_doc = localStorage.get('tasks');
    tasks_doc[task_id]={task: task_name, status: status, id: task_id}
    localStorage.set('tasks', tasks_doc);
    console.log('post', req.body);
    console.log('local storage', localStorage.get('tasks'));
    await update_tasks(tasks_doc);
    //res.redirect('/index');
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    const auth = firebase.getAuth();
    firebase.signOut(auth).then(() => {
        res.redirect('/')
    }).catch((error) => {
        console.log('Error signing out')
    });

    res.redirect('/');
});

app.get('/test', async function (req, res) {
    await get_userData(req.session.userid);
    await get_news_2();
    console.log('tasks', localStorage.get('tasks'));
});

app.listen(8080);
console.log('Server started at http://localhost:' + 8080);

async function listDatabases(client) {
    let databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
}

async function get_loc() {
    let url = "https://ipinfo.io/json?token=" + process.env.location_token
    const request = await fetch(url)
    return await request.json();
}

async function insert_data(client, doc, tasks) {
    const result = await client.db("user").collection("userDetails").insertOne(doc);
    await client.db("user").collection("tasks").insertOne({_id: doc['_id'], tasks: tasks});
    console.log(
        `A document was inserted with the _id: ${result.insertedId}`,
    );
}

async function signup(req, res, email, password) {
    const auth = firebase.getAuth();
    let status = true;
    firebase.createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            uid = user.uid;
            req.session.userid = uid;
            const doc = await create_doc(req);
            let tasks = []
            await insert_data(client, doc, tasks);
            await loadup_process();
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorMessage);
            console.log(errorCode);
            if(errorCode==='auth/email-already-in-use')
            {
                popupS.alert({content: 'Email already in use. Wanna try logging in?'})
            }
            throw "error";
        })
        .finally(() => {
            res.redirect('/index');
        })
}

async function create_doc(req) {
    const user_data = await get_loc();
    let doc = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        _id: req.session.userid,
        country: user_data.country,
        city: user_data.city,
        state: user_data.region,
    }
    localStorage.set('user-data', doc);
    localStorage.set('tasks', []);
    return doc;
}

function signin(res, req, email, password) {

    const auth = firebase.getAuth();
    firebase.signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Signed in
            const user = userCredential.user;
            uid = user.uid;
            req.session.userid = uid;
            localStorage.set('user-data',await get_userData(uid));
            localStorage.set('tasks', await get_userTasks(uid));
            await loadup_process();
            res.redirect('/index');
            return true;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            return false;
        });
}

async function loadup_process()
{
    let news=await get_news();
    let weather=await get_weather(localStorage.get('user-data')['city']);
    localStorage.set('news',news);
    localStorage.set('weather',weather);
    return true;
}

async function update_tasks(tasks) {
    let doc = localStorage.get('user-data');
    await client.db("user").collection("tasks").findOneAndReplace({_id: doc['_id']},{_id: doc['_id'], tasks: tasks});
}

async function get_userTasks(id) {
    return (await client.db("user").collection("tasks").findOne({'_id': id}))['tasks'];
}

async function get_userData(id) {
    return await client.db("user").collection("userDetails").findOne({'_id': id});
}

async function get_news_2() {
    let url = 'https://newsdata.io/api/1/news?apikey=' + process.env.news_apikey + '&language=en'
    const resp = await fetch(url)
    return await resp.json();
}

async function get_news()
{
    var url = 'https://api.newscatcherapi.com/v2/latest_headlines?lang=en';
    var headers = {
        'x-api-key': process.env['newscatcher_api']
    };
    const resp = await fetch(url,{headers:headers});
    //console.log(await resp.json());
    return await resp.json()
}


async function get_weather(city) {
    let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&appid=' + process.env.weather_apikey + '&units=metric'
    const request = await fetch(url);
    const jsonResponse = await request.json()
    jsonResponse['main']['temp'] = Math.round(jsonResponse['main']['temp'])
    return jsonResponse;
}