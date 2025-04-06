
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

// Catch any errors during rendering
try {
  root.render(<App />);
} catch (error) {
  console.error("Failed to render the application:", error);
  
  // If there's an error, render a fallback UI
  root.render(
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="text-gray-700 mb-4">We're sorry, but something went wrong. Please try refreshing the page.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Page
      </button>
    </div>
  );
}
