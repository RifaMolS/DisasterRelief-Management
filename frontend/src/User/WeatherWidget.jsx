import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from 'reactstrap';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, Eye } from 'lucide-react';

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchCity, setSearchCity] = useState('');
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const fetchWeather = async (lat, lon, city = null) => {
        setLoading(true);
        try {
            let url = `http://localhost:5000/api/config/weather`;
            if (city) {
                url += `?q=${encodeURIComponent(city)}`;
            } else {
                url += `?lat=${lat}&lon=${lon}`;
            }
            const res = await axios.get(url);
            setWeather(res.data);
            setLoading(false);
            setError(null);
        } catch (err) {
            setError("Weather data unreachable. Check Node.");
            setLoading(false);
        }
    };

    useEffect(() => {

        const handleUserBaseLocation = () => {
             // Fallback to user's registered location if available
             if (user.location) {
                fetchWeather(null, null, user.location);
             } else {
                fetchWeather(9.9312, 76.2673); // Default to Kerala HQ (Kochi) if all else fails
             }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => handleUserBaseLocation()
            );
        } else {
            handleUserBaseLocation();
        }
    }, [user.location]); // user is in outer scope, location is stable enough for this widget

    const getWeatherIcon = (main) => {
        switch (main) {
            case 'Rain': return <CloudRain size={56} color="#7dd3fc" strokeWidth={1.5} />;
            case 'Clouds': return <Cloud size={56} color="#cbd5e1" strokeWidth={1.5} />;
            default: return <Sun size={56} color="#fbbf24" strokeWidth={1.5} />;
        }
    };

    const getWeatherGradient = (main) => {
        switch (main) {
            case 'Rain': return 'linear-gradient(135deg, rgba(56, 189, 248, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)';
            case 'Clouds': return 'linear-gradient(135deg, rgba(148, 163, 184, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)';
            default: return 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)';
        }
    };

    if (loading) return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '300px', borderRadius: '28px',
            background: 'linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <Spinner style={{ color: '#38bdf8', width: '2.5rem', height: '2.5rem' }} />
                <p style={{ marginTop: '12px', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '1px' }}>
                    FETCHING TELEMETRY...
                </p>
            </div>
        </div>
    );

    if (error) return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '200px', borderRadius: '28px',
            background: 'linear-gradient(145deg, rgba(239,68,68,0.15), rgba(15,23,42,0.9))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontWeight: 600
        }}>
            ⚠ {error}
        </div>
    );

    const weatherMain = weather?.weather?.[0]?.main || 'Clear';
    const weatherDesc = weather?.weather?.[0]?.description || '';

    const statRowStyle = {
        padding: '14px 18px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        marginBottom: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const labelStyle = {
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '1.5px',
        color: '#94a3b8',
        textTransform: 'uppercase'
    };

    const valueStyle = {
        fontSize: '1.05rem',
        fontWeight: 800,
        color: '#f1f5f9',
        letterSpacing: '-0.3px'
    };

    return (
        <div style={{
            borderRadius: '28px',
            background: getWeatherGradient(weatherMain),
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Decorative glow orb */}
            <div style={{
                position: 'absolute', top: '-60px', right: '-60px',
                width: '220px', height: '220px',
                borderRadius: '50%',
                background: weatherMain === 'Rain'
                    ? 'radial-gradient(circle, rgba(14,165,233,0.20), transparent 70%)'
                    : weatherMain === 'Clouds'
                    ? 'radial-gradient(circle, rgba(148,163,184,0.15), transparent 70%)'
                    : 'radial-gradient(circle, rgba(251,191,36,0.18), transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{ padding: '24px 20px' }}>
                {/* Search Bar */}
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if(searchCity.trim()) fetchWeather(null, null, searchCity.trim());
                }} style={{ display: 'flex', gap: '10px', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
                    <input 
                        type="text" 
                        placeholder="Override location..." 
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: '0.85rem'
                        }}
                    />
                    <button type="submit" style={{
                        background: '#4ade80',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                    }}>
                        SCAN
                    </button>
                </form>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <MapPin size={14} color="#4ade80" strokeWidth={2.5} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '2px', color: '#4ade80', textTransform: 'uppercase' }}>
                                {weather.name}
                            </span>
                        </div>
                        <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: '#ffffff', letterSpacing: '-2px' }}>
                            {Math.round(weather.main.temp)}
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#cbd5e1', marginLeft: '4px' }}>°C</span>
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        padding: '16px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {getWeatherIcon(weatherMain)}
                    </div>
                </div>

                {/* Weather description badge */}
                <div style={{ marginBottom: '22px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 16px',
                        borderRadius: '30px',
                        background: 'rgba(74, 222, 128, 0.18)',
                        border: '1px solid rgba(74, 222, 128, 0.35)',
                        color: '#86efac',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase'
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
                        {weatherDesc}
                    </span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '18px' }} />

                {/* Stats rows */}
                <div style={statRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(56,189,248,0.20)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                            <Wind size={18} color="#38bdf8" strokeWidth={2} />
                        </div>
                        <span style={labelStyle}>WIND</span>
                    </div>
                    <span style={valueStyle}>{weather.wind.speed} <span style={{ color: '#64748b', fontSize: '0.75rem' }}>m/s</span></span>
                </div>

                <div style={statRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(99,102,241,0.20)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                            <Droplets size={18} color="#818cf8" strokeWidth={2} />
                        </div>
                        <span style={labelStyle}>HUMIDITY</span>
                    </div>
                    <span style={valueStyle}>{weather.main.humidity}<span style={{ color: '#64748b', fontSize: '0.75rem' }}>%</span></span>
                </div>

                <div style={{ ...statRowStyle, marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(251,191,36,0.20)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                            <Thermometer size={18} color="#fbbf24" strokeWidth={2} />
                        </div>
                        <span style={labelStyle}>FEELS LIKE</span>
                    </div>
                    <span style={valueStyle}>{Math.round(weather.main.feels_like)}<span style={{ color: '#64748b', fontSize: '0.75rem' }}>°C</span></span>
                </div>

                {/* Visibility row if available */}
                {weather.visibility && (
                    <div style={{ ...statRowStyle, marginTop: '10px', marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(34,197,94,0.20)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                                <Eye size={18} color="#4ade80" strokeWidth={2} />
                            </div>
                            <span style={labelStyle}>VISIBILITY</span>
                        </div>
                        <span style={valueStyle}>{(weather.visibility / 1000).toFixed(1)}<span style={{ color: '#64748b', fontSize: '0.75rem' }}>km</span></span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherWidget;
