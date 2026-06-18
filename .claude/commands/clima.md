# Skill: clima

Fetch and display current local weather using wttr.in (no API key needed).

## Steps

1. Run the following Bash command to get weather data:

```bash
curl -s "wttr.in/?format=j1&lang=es"
```

2. Parse and present the result in a clean, human-readable summary in Spanish, including:
   - Current temperature (°C) and "feels like"
   - Weather description
   - Humidity and wind speed
   - Today's high/low

If the user provides a `$ARGUMENTS` (city name), use it instead of auto-detected location:

```bash
curl -s "wttr.in/$ARGUMENTS?format=j1&lang=es"
```

3. If the request fails (no internet, blocked), inform the user and suggest trying `curl wttr.in` directly.

## Output format example

```
Clima actual en [Ciudad]:
  Temp: 22°C (sensación 20°C)
  Descripción: Parcialmente nublado
  Humedad: 65% | Viento: 15 km/h
  Hoy: min 18°C / max 26°C
```
