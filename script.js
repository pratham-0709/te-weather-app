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

function getWeatherIcon(id) {
    if (id >= 200 && id <= 232) return 'thunderstorm.svg'; // Thunderstorm
    if (id >= 300 && id <= 321) return 'HeavyDrizzle.svg'; // Drizzle
    if (id >= 500 && id <= 531) return 'LightRainShowers.svg'; // Rain
    if (id >= 600 && id <= 622) return 'snow.svg'; // Snow
    if (id >= 701 && id <= 781) return 'atmosphere.svg'; // Atmosphere-like
    if (id === 800) return 'SunnyDayV3.svg'; // Clear
    if (id === 801) return 'D200PartlySunnyV2.svg'; // Few clouds
    if (id === 802) return 'MostlyCloudyDayV2.svg'; // Scattered
    if (id === 803 || id === 804) return 'CloudyV3.svg'; // Overcast
    return 'clear.svg'; // fallback
}


function getCurrentDate() {
    return new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
}


async function getFetchData(endPoint, city) {
    const apiURL = `https://api.weather.teckexplorers.com/?city=${encodeURIComponent(city)}&endpoint=${endPoint}`;

    try {
        const response = await fetch(apiURL);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return response.json();
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
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

    const seenDates = new Set();
    let count = 0;

    for (const entry of forecastData.list) {
        const [date, time] = entry.dt_txt.split(' ');

        if (time === '12:00:00' && !seenDates.has(date)) {
            updateForecastItems(entry);
            seenDates.add(date);
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