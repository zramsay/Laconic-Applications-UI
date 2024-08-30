# Laconic Applications UI

This project is a Next.js-based user interface for managing Laconic applications.

## Features

- View a list of Laconic applications
- Display detailed information about each application
- Check deployment status of applications
- Modern and responsive UI using Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/laconic-apps-ui.git
   cd laconic-apps-ui
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Development Server

To start the development server, run:

```
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Contains the main application pages
- `src/components`: Reusable React components
- `src/app/api`: API routes for server-side functionality

## Configuration

The Laconic API URL is configured in `next.config.mjs`. You can modify it there if needed:
```
startLine: 2
endLine: 5
```


## Built With

- [Next.js](https://nextjs.org/) - The React framework for production
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons



