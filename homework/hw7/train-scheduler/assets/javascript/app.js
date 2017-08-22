// Configure Firebase
const config = {
    apiKey           : "AIzaSyDTZzRZokWqHyFnA0T11Hte9ZwJ9QgO4kI",
    authDomain       : "train-scheduler-3f682.firebaseapp.com",
    databaseURL      : "https://train-scheduler-3f682.firebaseio.com",
    projectId        : "train-scheduler-3f682",
    storageBucket    : "train-scheduler-3f682.appspot.com",
    messagingSenderId: "886128771331"
};

firebase.initializeApp(config);


// Define test case
const testInput = [{"name"       : "Trenton Express",
                    "destination": "Trenton",
                    "departure"  : [8, 0],
                    "frequency"  : 25,
                    "nextArrival": [17, 35],
                    "minutesAway": 10},

                   {"name"       : "Oregon Trail",
                    "destination": "Salem",
                    "departure"  : [8, 0],
                    "frequency"  : 3600,
                    "nextArrival": [13, 39],
                    "minutesAway": 1154}
                  ];



/****************************************************************************
 ****************************************************************************
    
    Train scheduler
    
*****************************************************************************
*****************************************************************************/
// Global variables
let database;
let trains;

var loadDatabase = function() {
    database = firebase.database();

    database.ref().once("value", function(snapshot) {
        // Create database if it doesn't exist
        if (snapshot.val() == null) {
            trains = testInput;

            database.ref().set(testInput);

        // Load database if it exists
        } else {
            trains = snapshot.val();

        }

        displaySchedule();
    });
}

function displayTime(timeArray) {
    // Get the hour and minute
    let h = timeArray[0], m = timeArray[1];
    const period = (0 <= h && h < 12) ? "AM": "PM";

    // Display the hour
    if (h === 0) {
        h = 12;

    } else if (h > 12) {
        h -= 12;

    }

    // Display the minute
    if (m < 10) {
        m = "0" + m;
    }

    return `${h}:${m} ${period}`;
}

function displaySchedule() {
    let output = "";

    trains.forEach(train => {
        output += `<tr>
                       <td>${train.name}</td>
                       <td>${train.destination}</td>
                       <td>${train.frequency}</td>
                       <td>${displayTime(train.nextArrival)}</td>
                       <td>${train.minutesAway}</td>
                   </tr>`;
    });

    $("#currentSchedule tbody").empty().append(output);
}

function updateSchedule() {
    trains.forEach(train => {

    })
}

function addTrain() {
    const train = {"name"       : $("#name").val().trim(),
                   "destination": $("#destination").val().trim(),
                   "departure"  : $("#departure").val().trim(),
                   "frequency"  : parseInt($("#frequency").val())};

    const currentTime = new Date();

    
    /************************************************************************
        
        Express the departure in minutes (time0)
        
    *************************************************************************/
    const index   = train.departure.indexOf(":");
    const hour0   = parseInt(train.departure.substring(0, index));
    const minute0 = parseInt(train.departure.substring(index + 1));

    const time0 = 60 * hour0 + minute0;

    
    /************************************************************************
        
        Express the current time in minutes (time1)
        
    *************************************************************************/
    const hour1   = currentTime.getHours();
    const minute1 = currentTime.getMinutes();

    const time1 = 60 * hour1 + minute1;

    
    /************************************************************************
        
        Calculate the next arrival
        
    *************************************************************************/
    const numTripsMade = Math.floor((time1 - time0) / train.frequency);
    console.log("numTripsMade: " + numTripsMade);

    // Departure time
    let hour2, minute2, time2;

    // The train will depart much later
    if (numTripsMade < 0) {
        hour2   = hour0;
        minute2 = minute0;
        time2   = 60 * hour2 + minute2;

    // The train will depart soon
    } else {
        time2   = time0 + (numTripsMade + 1) * train.frequency;
        hour2   = Math.floor(time2 / 60);
        minute2 = time2 - 60 * hour2;

//        hour2   = hour2 % 24;

    }
    
    
    train.nextArrival = [hour2, minute2];
    train.minutesAway = time2 - time1;

    trains.push(train);
    database.ref().set(trains);
    
    displaySchedule();
}


$(document).ready(function() {
    loadDatabase();

    // Update the train schedule every minute
//    setInterval(updateSchedule, 60000);

    $("#button_submit").on("click", function() {
        /*
        // Input validation
        $("input").each(function() {
            var element = $(this);
            console.log(element);

            if (element.val() == undefined) {
                element.css({"background-color": "red"});
                element.attr("placeholder", `Please fill out the ${this.id}!`);
            }
        });

        if ($("#name").val() === "") {
            console.log("Fill out name");
            return;
        }
        if ($("#destination").val() === "") {
            console.log("Fill out destination");
            return;
        }
        if ($("#departure").val() === "") {
            console.log("Fill out departure");
            return;
        }
        if ($("#frequency").val() === "") {
            console.log("Fill out frequency");
            return;
        }
        */

        addTrain();
    });
});