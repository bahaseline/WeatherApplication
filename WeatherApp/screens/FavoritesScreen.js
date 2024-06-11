import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { getData } from "../utils/asyncStorage";
import { fetchWeatherForecast } from "../api/weather";
import { weatherImages } from "../constants";
import { Ionicons } from '@expo/vector-icons';
import { theme } from "../theme";

export default function FavoritesScreen({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [weatherData, setWeatherData] = useState([]);

    const fetchFavorites = async () => {
        const favCities = await getData('favorites') || [];
        setFavorites(favCities);
    };

    const fetchWeatherData = () => {
        if (favorites.length > 0) {
            Promise.all(favorites.map(city => fetchWeatherForecast({ cityName: city, days: '1' })))
                .then(data => setWeatherData(data))
                .catch(err => {
                    Alert.alert('Error', 'Failed to fetch weather data');
                });
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    useEffect(() => {
        fetchWeatherData();
    }, [favorites]);

    const handleReload = () => {
        fetchFavorites();
        fetchWeatherData();
    };

    return (
        <ScrollView className="bg-gray-100">
            <View className="p-6 mt-20">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold">Favorite Cities</Text>
                    <TouchableOpacity onPress={handleReload}>
                        <Ionicons name="reload-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                {weatherData.map((weather, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => navigation.navigate('HomeScreen', { city: weather.location.name })}
                        className="mb-4 p-4 rounded-xl"
                        style={{ backgroundColor: theme.bgWhite(0.9) }}
                    >
                        <View className="flex-row items-center">
                            <View className="flex-1">
                                <Text className="text-lg font-semibold">{weather.location.name}, {weather.location.country}</Text>
                                <Text>{weather.current.condition.text}</Text>
                            </View>
                            <Image source={weatherImages[weather.current.condition.text]} className="h-12 w-12" />
                            <Text className="ml-2">{`${weather.current.temp_c}°C`}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

}
