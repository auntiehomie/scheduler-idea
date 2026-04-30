# scheduler-idea 🌿

A health-aware daily schedule suggestion app powered by **Oura Ring** data.

## What It Does

- Pulls your daily readiness, activity, and sleep data from the Oura API
- Suggests a daily schedule tuned to your current energy and health state
- Incorporates menstrual cycle awareness for more nuanced scheduling
- Recommends hobbies and activities appropriate for how you're feeling today

## Getting Started

### Prerequisites

- Node.js 18+
- An [Oura Ring](https://ouraring.com/) and personal access token

### Setup

```bash
git clone https://github.com/auntiehomie/scheduler-idea.git
cd scheduler-idea
npm install
cp .env.example .env
# Edit .env and add your OURA_ACCESS_TOKEN
node src/index.js
```

## Project Structure

```
src/
  oura.js       – Oura API client (readiness, activity, sleep)
  scheduler.js  – Energy/health-based schedule suggestion engine
  menstrual.js  – Menstrual cycle awareness module
  hobbies.js    – Hobby suggestion based on health state
  index.js      – App entry point
```

## Environment Variables

| Variable             | Description                         |
|----------------------|-------------------------------------|
| `OURA_ACCESS_TOKEN`  | Personal access token from Oura app |
| `CYCLE_START_DATE`   | (Optional) Last period start date (YYYY-MM-DD) |
| `CYCLE_LENGTH`       | (Optional) Average cycle length in days (default: 28) |

## Roadmap

See [BACKLOG.md](./BACKLOG.md) for the project kanban.

## License

MIT
