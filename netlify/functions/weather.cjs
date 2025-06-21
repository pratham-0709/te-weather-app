const fetch = require('node-fetch');

exports.handler = async function (event) {
  const city = event.queryStringParameters?.city;
  const type = event.queryStringParameters?.type || 'weather';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: 'OK',
    };
  }

  // Validate required parameters
  if (!city) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'City parameter is required' }),
    };
  }

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'API key not configured' }),
    };
  }

  // Validate endpoint type
  const validTypes = ['weather', 'forecast', 'onecall'];
  if (!validTypes.includes(type)) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ 
        error: 'Invalid type parameter', 
        validTypes 
      }),
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/${type}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Handle OpenWeatherMap API errors
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders(),
        body: JSON.stringify({ 
          error: data.message || 'Weather API error',
          code: data.cod 
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Weather API fetch error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Failed to fetch weather data' }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}