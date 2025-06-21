// DOM Elements
const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const weatherInfoSection = document.querySelector('.weather-info');
const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const forecastItemsContainer = document.querySelector('.forecast-items-container');
const weatherAnimation = document.getElementById('weather-animation');
const themeToggle = document.getElementById('themeSwitch');

// Theme toggle handler
function applyTheme(theme) {
    document.body.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('change', () => {
    applyTheme(themeToggle.checked ? 'dark' : 'light');
});

// Apply saved theme on load
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);
themeToggle.checked = savedTheme === 'dark';

function getPreferredWindUnit(countryCode) {
    const windUnitPreferences = {
        'US': 'mph', 'LR': 'mph', 'MM': 'mph',
        'CA': 'km/h', 'AU': 'km/h', 'NZ': 'km/h', 'IN': 'km/h',
        'CN': 'km/h', 'JP': 'km/h', 'ZA': 'km/h',
    };
    return windUnitPreferences[countryCode] || 'm/s';
}

function convertWindSpeed(speedMs, targetUnit) {
    switch (targetUnit) {
        case 'km/h': return (speedMs * 3.6).toFixed(1);
        case 'mph': return (speedMs * 2.237).toFixed(1);
        default: return speedMs.toFixed(1);
    }
}

function getCurrentDate() {
    return new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
}

function getWeatherIcon(id) {
    if (id <= 232) return 'Thunderstorm.svg';
    if (id <= 321) return 'drizzle.svg';
    if (id <= 531) return 'HeavyDrizzle.svg';
    if (id <= 622) return 'snow.svg';
    if (id <= 781) return 'atmosphere.svg';
    if (id === 800) return 'SunnyDayV3.svg';
    if (id <= 804) return 'CloudyV3.svg';
    return 'MostlyCloudyDayV2.svg';
}


async function getFetchData(endPoint, city) {
    const params = new URLSearchParams({
        city: city,
        type: endPoint  // Changed from 'endPoint' to 'type' to match your Netlify function
    });

    const apiURL = `/.netlify/functions/weather?${params}`;

    try {
        const response = await fetch(apiURL);
        const data = await response.json();

        console.log('Response status:', response.status); // Debug log
        console.log('Response data:', data); // Debug log

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Fetching Error:', error);
        throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
}

async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city);
        if (weatherData.cod !== 200) return showDisplaySection(notFoundSection);

        const {
            name: country,
            sys: { country: countryCode },
            main: { temp, humidity },
            weather: [{ id, main }],
            wind: { speed }
        } = weatherData;

        const windUnit = getPreferredWindUnit(countryCode);
        const convertedSpeed = convertWindSpeed(speed, windUnit);

        countryTxt.textContent = country;
        tempTxt.textContent = Math.round(temp) + '°C';
        conditionTxt.textContent = main;
        humidityValueTxt.textContent = humidity + '%';
        windValueTxt.textContent = `${convertedSpeed} ${windUnit}`;
        currentDateTxt.textContent = getCurrentDate();
        weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

        await updateForecastInfo(city);
        showDisplaySection(weatherInfoSection);
    } catch (err) {
        showDisplaySection(notFoundSection);
    }
}

async function updateForecastInfo(city) {
    const forecastData = await getFetchData('forecast', city);
    const today = new Date().toISOString().split('T')[0];
    forecastItemsContainer.innerHTML = '';

    let count = 0;
    for (const entry of forecastData.list) {
        if (entry.dt_txt.includes('12:00:00') && !entry.dt_txt.includes(today)) {
            updateForecastItems(entry);
            if (++count === 5) break;
        }
    }
}

function updateForecastItems({ dt_txt: date, weather: [{ id }], main: { temp } }) {
    const dateLabel = new Date(date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short'
    });
    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateLabel}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" alt="" class="forecast-item-img" />
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `;
    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection].forEach(s => s.style.display = 'none');
    section.style.display = 'flex';
}

// Search triggers
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim()) {
        updateWeatherInfo(cityInput.value.trim());
        cityInput.value = '';
    }
});

cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && cityInput.value.trim()) {
        updateWeatherInfo(cityInput.value.trim());
        cityInput.value = '';
    }
});