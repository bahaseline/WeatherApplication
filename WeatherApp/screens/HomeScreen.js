import React, { useState, useCallback, useEffect } from "react";
import { View, Text, SafeAreaView, Image, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from '@expo/vector-icons';
import { theme } from "../theme";
import { debounce } from 'lodash';
import { fetchLocations, fetchWeatherForecast } from "../api/weather";
import { weatherImages } from "../constants";
import * as Progress from 'react-native-progress';
import { storeData, getData } from "../utils/asyncStorage";

export default function HomeScreen({ route, navigation }) {
    const { city: initialCity } = route.params || {};
    const [showSearch, toggleSearch] = useState(false);
    const [locations, setLocations] = useState([]);
    const [weather, setWeather] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unit, setUnit] = useState('C');
    const [favorites, setFavorites] = useState([]);

    const saveFavorite = async () => {
        const currentCity = weather?.location?.name;
        if (currentCity && !favorites.includes(currentCity)) {
            const newFavorites = [...favorites, currentCity];
            setFavorites(newFavorites);
            await storeData('favorites', newFavorites);
        }
    }

    const removeFavorite = async () => {
        const currentCity = weather?.location?.name;
        if (currentCity && favorites.includes(currentCity)) {
            const newFavorites = favorites.filter(city => city !== currentCity);
            setFavorites(newFavorites);
            await storeData('favorites', newFavorites);
        }
    }

    const handleLocation = (loc) => {
        toggleSearch(false);
        setLoading(true);
        setLocations([]);
        setError(null);

        fetchWeatherForecast({
            cityName: loc.name,
            days: '7'
        }).then(data => {
            setLoading(false);
            storeData('city', loc.name);
            setWeather(data);
        }).catch(err => {
            setLoading(false);
            setError('Failed to fetch weather data');
            Alert.alert('Error', 'Failed to fetch weather data');
        });
    }

    const handleSearch = (value) => {
        if (value.length > 2) {
            fetchLocations({ cityName: value }).then(data => {
                setLocations(data);
            }).catch(err => {
                setError('Failed to fetch locations');
                Alert.alert('Error', 'Failed to fetch locations');
            });
        }
    }

    useEffect(() => {
        if (initialCity) {
            handleLocation({ name: initialCity });
        } else {
            fetchMyWeatherData();
        }
        loadFavorites();
    }, [initialCity]);

    const fetchMyWeatherData = async () => {
        const myCity = await getData('city');
        let cityName = 'Paris';
        if (myCity) cityName = myCity;

        setLoading(true);
        setError(null);

        fetchWeatherForecast({
            cityName,
            days: '7'
        }).then(data => {
            setWeather(data);
            setLoading(false);
        }).catch(err => {
            setLoading(false);
            setError('Failed to fetch weather data');
            Alert.alert('Error', 'Failed to fetch weather data');
        });
    }

    const loadFavorites = async () => {
        const favCities = await getData('favorites') || [];
        setFavorites(favCities);
    }

    const handleTextDebounce = useCallback(debounce(handleSearch, 1200), [handleSearch]);

    const toggleUnit = () => {
        setUnit(unit === 'C' ? 'F' : 'C');
    }

    const convertTemp = (tempC) => {
        return unit === 'C' ? tempC : (tempC * 9 / 5) + 32;
    }

    const formatTemp = (temp) => {
        return `${convertTemp(temp).toFixed(1)}°${unit}`;
    }

    const { current, location, forecast } = weather;
    const isFavorite = location && favorites.includes(location.name);

    return (
        <View className="flex-1 relative">
            <StatusBar style="light" />
            <Image
                blurRadius={70}
                source={require('../assets/images/bg.png')}
                className="absolute h-full w-full"
            />
            {
                loading ? (
                    <View className="absolute h-full w-full flex justify-center items-center">
                        <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
                    </View>
                ) : (
                    <SafeAreaView className="flex flex-1">
                        {/* Search section */}
                        <View style={{ height: '7%' }} className="mx-4 relative z-50">
                            <View className="flex-row justify-end items-center rounded-full"
                                  style={{ backgroundColor: showSearch ? theme.bgWhite(0.2) : 'transparent' }}>
                                {
                                    showSearch && (
                                        <TextInput
                                            onChangeText={handleTextDebounce}
                                            placeholder='Search city'
                                            placeholderTextColor='lightgrey'
                                            className="pl-6 h-12 flex-1 text-base text-white"
                                        />
                                    )
                                }
                                <TouchableOpacity
                                    onPress={() => toggleSearch(!showSearch)}
                                    style={{ backgroundColor: theme.bgWhite(0.3) }}
                                    className="rounded-full p-3 m-1">
                                    <Ionicons name="search-outline" size={25} color="white" />
                                </TouchableOpacity>
                            </View>
                            {
                                locations.length > 0 && showSearch && (
                                    <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                                        {
                                            locations.map((loc, index) => {
                                                let showBorder = index + 1 !== locations.length;
                                                let borderClass = showBorder ? 'border-b-2 border-gray-400' : '';
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => handleLocation(loc)}
                                                        key={index}
                                                        className={"p-3 flex-row items-center border-0 px-4 mb-1 " + borderClass}>
                                                        <Ionicons name="location-outline" size={25} color="gray" />
                                                        <Text className='text-black text-lg ml-2'>{loc.name}, {loc.country}</Text>
                                                    </TouchableOpacity>
                                                )
                                            })
                                        }
                                    </View>
                                )
                            }
                        </View>
                        {/* Forecast section */}
                        <View className="mx-4 flex justify-around flex-1 mb-2">
                            {/* Location */}
                            <Text className="text-white text-center text-2xl font-bold">{location?.name},
                                <Text className="text-lg font-semibold text-gray-300">{" " + location?.country}</Text>
                            </Text>
                            {/* Weather image */}
                            {current && (
                                <View className="flex-row justify-center ">
                                    <Image
                                        source={weatherImages[current.condition.text]}
                                        className="h-52 w-52"
                                    />
                                </View>
                            )}
                            {/* Temperature */}
                            {current && (
                                <View className="space-y-2 ">
                                    <Text className="text-white text-center text-6xl font-bold ml-5">{formatTemp(current.temp_c)}</Text>
                                    <Text className="text-white text-center text-xl tracking-widest">{current.condition.text}</Text>
                                    <TouchableOpacity onPress={toggleUnit} style={{ alignSelf: 'center' }}>
                                        <Text className="text-white text-sm">Switch to °{unit === 'C' ? 'F' : 'C'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {/* Other stats */}
                            {current && (
                                <View className="flex-row justify-between mx-4">
                                    <View className="flex-row space-x-2 items-center">
                                        <Image source={require('../assets/icons/wind.png')} className="h-6 w-6" />
                                        <Text className="text-white text-base font-semibold"> {current.wind_kph} km/h </Text>
                                    </View>
                                    <View className="flex-row space-x-2 items-center">
                                        <Image source={require('../assets/icons/drop.png')} className="h-6 w-6" />
                                        <Text className="text-white text-base font-semibold">{current.humidity} % </Text>
                                    </View>
                                    <View className="flex-row space-x-2 items-center">
                                        <Image source={require('../assets/icons/sun.png')} className="h-6 w-6" />
                                        <Text className="text-white text-base font-semibold">{weather?.forecast?.forecastday?.[0]?.astro?.sunrise} </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Forecast for the next days */}
                        <View className="mb-2 space-y-3">
                            <View className="flex-row items-center mx-5 space-x-2">
                                <Ionicons name="calendar-outline" size={22} color="white" />
                                <Text className="text-white text-base"> Daily forecast</Text>
                            </View>
                            <ScrollView
                                horizontal
                                contentContainerStyle={{ paddingHorizontal: 15 }}
                                showsHorizontalScrollIndicator={false}
                            >
                                {
                                    forecast?.forecastday?.slice(0, 7).map((item, index) => {
                                        const date = new Date(item.date);
                                        let options = { weekday: 'long' };
                                        let dayName = date.toLocaleDateString('en-US', options).split(',')[0];
                                        return (
                                            <View
                                                key={index}
                                                className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
                                                style={{ backgroundColor: theme.bgWhite(0.15) }}>
                                                <Image source={weatherImages[item.day.condition.text]} className="h-11 w-11" />
                                                <Text className="text-white">{dayName}</Text>
                                                <Text className="text-white text-xl font-semibold"> {formatTemp(item.day.avgtemp_c)} </Text>
                                            </View>
                                        )
                                    })
                                }
                            </ScrollView>
                        </View>
                        {/* Heart icon to save/remove favorite */}
                        <View className="absolute bottom-4 right-4">
                            <TouchableOpacity
                                onPress={isFavorite ? removeFavorite : saveFavorite}
                                className="rounded-full p-3 bg-white bg-opacity-30"
                            >
                                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={25} color="red" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                )
            }
        </View>
    );
}
