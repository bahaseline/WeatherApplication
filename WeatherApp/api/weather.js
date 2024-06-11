import { apiKey } from '../constants';
import { apiCall } from './utils';

const forecastEndpoint = params => `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${params.cityName}&days=${params.days}&aqi=no&alerts=no`;
const locationsEndpoint = params => `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${params.cityName}`;

export const fetchWeatherForecast = params => {
    return apiCall(forecastEndpoint(params));
};

export const fetchLocations = params => {
    return apiCall(locationsEndpoint(params));
};
