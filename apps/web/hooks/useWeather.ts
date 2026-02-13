"use client";

import { useState, useEffect } from "react";

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

interface WeatherData {
    temp: number;
    condition: string;
    description: string;
    icon: string;
    location: string;
}

export const useWeather = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!API_KEY) {
            setError("Falta la API Key de OpenWeatherMap");
            setLoading(false);
            return;
        }

        const fetchWeather = async (lat: number, lon: number) => {
            try {
                const res = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=sp&appid=${API_KEY}`
                );

                if (!res.ok) throw new Error("Error fetching weather");

                const data = await res.json();

                setWeather({
                    temp: Math.round(data.main.temp),
                    condition: data.weather[0].main,
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    location: data.name
                });
            } catch (err) {
                console.error(err);
                setError("No se pudo obtener el clima");
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.warn("Geolocation denied or error:", err);
                    // Default to Lima, Peru if geo fails
                    fetchWeather(-12.0464, -77.0428);
                }
            );
        } else {
            // Default fallback
            fetchWeather(-12.0464, -77.0428);
        }
    }, []);

    return { weather, loading, error };
};
