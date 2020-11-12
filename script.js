var modal = document.querySelector("#modal");
var modalBody = modal.querySelector(".modalBody");
var headerSpan = document.querySelector("header span");
var searchHistory = document.querySelector("#history");
var searchBtn = document.querySelector("form button")
var searchForm = document.querySelector("form");
var searchItem = document.querySelector("#searchInput");
var historyItems = [];
var weatherDay = document.querySelectorAll("#display div");
var date = new Date();

// initializes site with data in local storage, sets Toronto as default city
init();

// just adds a custom title with the city name
function setCustomTitle(city) {
    var customTitle = "Viewing " + city + " | Weather Dashboard";
    var customSpan = "Now viewing " + city; 
    document.title = customTitle;
    headerSpan.innerText = customSpan;
}

function getData(city) {
    var msg = "";
    var requestUrl= "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=18e5d8f1eb5703b7275f0749950ba7d1&units=metric";
    // pass the url into the fetch function
    fetch(requestUrl)
    // once loaded, convert response to JSON
    .then(function(response) {
        if (response.status !== 200){
            msg = "We can't find that, are you sure you meant \"" + city + "\""
            return;
        }

        return response.json();
    })
    //once that's loaded, call it data and do stuff
    .then(function(data) {  
        var date = new Date();

        var longitude = data.coord.lon;
        var latitude = data.coord.lat;
        
        var days = ["Sun", "Mon", "Tue","Wed", "Thu", "Fri", "Sat"];

        var now = Date.now();
        var sunrise = data.sys.sunrise * 1000; // mult by 1000 to get ms
        var sunset = data.sys.sunset * 1000;
    
        // gets the sky color :)
        function getSkyColor() {
    
            var daylightTime = (Math.abs((now - sunrise) % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)); // total daylightTime over hours in day
            var brightness = 0.5;
            // I really doubt that this is how you actually ge the approx brightness of a city, but I tried :)
            var calc = 0.25 - (daylightTime - 0.5) ** 2;
            if (sunrise < now && now < sunset) {
                brightness = 0.5 + Math.sqrt(calc);
              } else {
                brightness = 0.5 - Math.sqrt(calc);
              }
            var color = "hsl(207, 44%, " + (brightness * 80 + 10) + "%)"; // max/min brightness is 90/10%
            document.querySelector("#display div").style.backgroundColor = color;
        }
        
        getSkyColor();

        // gets all variables to show
        var temp = Math.round(data.main.temp);
        var humidity = data.main.humidity + "%";
        var desc = data.weather[0].main;

        // add the variables and the icons to the HTML
        weatherDay[0].innerHTML = days[date.getDay()] + " " + date.toLocaleDateString() + "<br/>" + temp + "&deg;C \
        <br>" + getWeatherIcon(desc, sunrise < now && now < sunset) + "<br> humidity: " + humidity;

        // increases day by 1
        date.setDate(date.getDate() + 1).day;


        var requestUrlForecast = "https://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&exclude=current,minutely,hourly,alerts&appid=18e5d8f1eb5703b7275f0749950ba7d1&units=metric";

        fetch(requestUrlForecast)
        // once loaded, convert response to JSON
        .then(function(response) {
            return response.json();
        })
        //once that's loaded, call it data and do stuff
        .then(function(data) { 
            addHistoryItem(city);
            getWeather(data);
        })


    })
    .catch(function(error){
        var p = document.createElement("p");
        p.innerText = error;
        modalBody.appendChild(p);
        modal.style.display = "block";

        // so that the user can continue to enter queries w/o closing modal
        searchBtn.disabled = true;
        });
}

// just adds the city to the history panel
function addHistoryItem(city) {
    city = toLowerCase(city);
    setCustomTitle(city);
    var cityIndex = historyItems.indexOf(city);
    if (cityIndex === -1) {
        historyItems.push(city);
        renderHistoryItems();
    } else {
        historyItems.splice(cityIndex, 1);
        historyItems.push(city);
        renderHistoryItems();
    }
}

// stores history items to local storage
function storeHistoryItems() {
    localStorage.setItem("history", JSON.stringify(historyItems));
}

// initializes the site with whats in local storage, Toronto is the default city for now
function init(){
    var city = "Toronto";
    var storedItems = localStorage.getItem("history");
    if (storedItems) {
        historyItems = JSON.parse(storedItems);
        city = historyItems[historyItems.length - 1];
    } renderHistoryItems();
    getData(city);
}

// Creates a history item on the site in the history panel
function renderHistoryItems() {
    searchHistory.innerHTML = "";
    for (var i = historyItems.length - 1; i >= 0 && i >= historyItems.length - 8; i--) {
        var newDiv = document.createElement("div");
        newDiv.classList.add("historyItem");
        newDiv.addEventListener("click", render);
        newDiv.innerText = historyItems[i];
        searchHistory.appendChild(newDiv);
    } storeHistoryItems();
}

// renders the weather according to what the user searches/clicks on
function render(event) {
    if (event.type === "submit") {
        event.preventDefault();
        getData(searchItem.value);
    } else {
        getData(this.innerHTML);
    }
    searchItem.value = "";
};


// just gets the weather icon according to the description in the JSON
function getWeatherIcon(desc, isDaylight) {
    var image = "";
    switch(desc) {
        case "Clear": 
            if (isDaylight) {
                image = "<i class='fas fa-circle'></i>";
            } else {
                image = "<i class='fas fa-circle night'></i>"
            }
            break;
        case "Rain":
            image =  "<i class='fas fa-umbrella'></i>";
            break;
        case "Thunderstorm":
            image =  "<i class='fas fa-bolt'></i>";
            break;
        case "Drizzle":
            image =  "<i class='fas fa-cloud-rain'></i>";
            break;
        case "Snow":
            image =  "<i class='fas fa-snowflake'></i>";   
            break; 
        case "Clouds":
            image =  "<i class='fas fa-cloud'></i>";   
            break; 
        default: 
            image =  "<i class='fas fa-smog'></i>";   
    } return image;
}

// gets the color associated with each UV index
function getUviColor(uvi) {
    color = "";
    switch(true) {
        case (uvi <= 2):
            color = "green";
            break;
        case (uvi <= 5):
            color = "yellow";
            break;
        case (uvi <= 7):
            color = "orange";
            break;
        case (uvi <= 10):
            color = "red";
            break;
        default:
            color = "violet"
    } return color;
}

// gets the weather forecast and displays it on the page
function getWeather(data) {
    var date = new Date();
    var days = ["Sun", "Mon", "Tue","Wed", "Thu", "Fri", "Sat"]
    for (var i = 0; i < 6; i++) {
        // for the first day (i.e. current day)
        if (i === 0) {

            // creates span with UV index
            var spanUvi = document.createElement("span");
            spanUvi.classList.add("uvi");
            var uvi = data.daily[0].uvi;
            spanUvi.innerHTML = "uv: " + uvi;
            color = getUviColor(uvi);
            spanUvi.style.backgroundColor = color;

            weatherDay[0].appendChild(spanUvi);

            // creates span with wind speed info
            var spanWS = document.createElement("span");
            spanWS.classList.add("ws");
            var WS = data.daily[0].wind_speed;
            spanWS.innerHTML = "wind speed: " + WS + "m/s";

            weatherDay[0].appendChild(spanWS);

        // for every other day (forecast)
        } else {
            weatherDay[i].innerHTML = "";
            date.setDate(date.getDate() + 1).day;

            //gets weather info
            var spanOther  = document.createElement("span");
            var temp = Math.round(data.daily[i].temp.max);
            var humidity = data.daily[i].humidity + "%";
            var desc = data.daily[i].weather[0].main;
            
            // displays weather info
            spanOther.innerHTML = days[date.getDay()] + " " + date.toLocaleDateString() + "<br/>" + temp + "&deg;C \
            <br>" + getWeatherIcon(desc, true) + "<br> humidity: " + humidity;
            weatherDay[i].appendChild(spanOther);
        }
    }
;}

// makes sure everything is rendered when the user submits form
searchForm.addEventListener("submit", render, false);

// just makes sure that the cities are all stored in the same case (picked lower case so it would work nicely with text-transform in the CSS)
function toLowerCase(str) {
    return str.toLowerCase()
}

// close modal when you press x
modalBody.querySelector(".modalX").addEventListener("click", function() {
    modal.style.display = "none";
    searchBtn.disabled = false;
    modalBody.removeChild(modalBody.lastChild);
})
 

