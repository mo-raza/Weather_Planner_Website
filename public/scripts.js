
function accountHover() {
   document.getElementById("dropdown").classList.toggle("show");
}



function getWeather() {
    const apiKey = 'dc63ac949bf01fe3c328dad5421e1c1b';

    const city = document.getElementById('city').value;

    if(!city) {
        alert('Please enter a city');
        return;
    }

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    fetch(currentWeatherUrl)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
        })
        .catch(error => {
            console.error('Error fetching current weather data: ', error);
            alert('Error getting weather data. Please try again.');
        });

    fetch(forecastUrl)
    .then(response => response.json())
    .then(data => {
        displayHourlyForecast(data.list);
    })
    .catch(error => {
        console.error('Error fetching hourly forecast data: ', error);
        alert('Error getting hourly forecast. Please try again.');
    });
}

function displayWeather(data) {
    const tempInfoDiv = document.getElementById('temperature-info');
    const weatherInfoDiv = document.getElementById('weather-info');
    const weatherIcon = document.getElementById('weather-icon');
    const hourlyForecastDiv = document.getElementById('hourly-forecast');

    // to clear previous content
    weatherInfoDiv.innerHTML = '';
    hourlyForecastDiv.innerHTML = '';
    tempInfoDiv.innerHTML = '';

    if (data.cod === '404') {
        weatherInfoDiv.innerHTML = `<p>${data.message}</p>`;
    } 
    else {
        const cityName = data.name;
        const temperature = Math.round(data.main.temp - 273.15);
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

        const temperatureHTML = `<p>${temperature}&deg C</p>`;
        const weatherHTML = `<p><b>${cityName}</b></p> <p class="desc">${description}</p>`;

        tempInfoDiv.innerHTML = temperatureHTML;
        weatherInfoDiv.innerHTML = weatherHTML;
        weatherIcon.src = iconUrl;
        weatherIcon.alt = description;

        showImage();
    }
}

function displayHourlyForecast(hourlyData) {
    const hourlyForecastDiv = document.getElementById('hourly-forecast');
    const next24Hours = hourlyData.slice(0,8);

    next24Hours.forEach(item => {
        const dateTime = new Date(item.dt * 1000);
        const hour = dateTime.getHours();
        const temperature = Math.round(item.main.temp - 273.15);
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

        const hourlyItemHTML = `
        <div class="hourly-item">
            <span>${hour}:00</span>
            <img src="${iconUrl}" alt="Hourly Weather Icon">
            <span>${temperature}&deg C</span>
        </div>
        `;
        hourlyForecastDiv.innerHTML += hourlyItemHTML;
    });
}

function showImage() {
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.style.display = 'block';
}



// FullCalendar

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    // Initialize FullCalendar
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',  
      selectable: true,             // Enables selecting a date range
      selectHelper: true,           // Adds a "select" helper during drag
      editable: true,               // Allows events to be dragged and resized
      events: function(fetchInfo, successCallback, failureCallback) {
        fetch('/get-events')
          .then(response => response.json())
          .then(events => successCallback(events))
          .catch(error => failureCallback(error));
      },
      select: function(info) {
        var title = prompt('Enter Event Title:');
        if (title) {
          var newEvent = {
            title: title,
            start: info.startStr,
            end: info.endStr,
            allDay: info.allDay,
            userId: window.sessionUserId  // Use the userId from the session
          };
    
          // Send new event data to the server
          fetch('/add-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEvent)
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              calendar.addEvent(data.event); // Use the event returned from the server
            } else {
              alert('Failed to save event.');
            }
          })
          .catch(error => {
            console.error('Error:', error);
          });
        }
        calendar.unselect();
      },
      eventClick: function(info) {
        const eventId = info.event.id;
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEvent(eventId);
        }
    }
  });
  calendar.render();
});

// Function to delete an event
function deleteEvent(eventId) {
  fetch(`/delete-event/${eventId}`, {
      method: 'DELETE',
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          alert('Event deleted successfully');
          // Removes the event from the calendar view
          calendar.getEventById(eventId).remove();
      } else {
          alert('Failed to delete event');
      }
  })
  .catch(error => {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
  });
}