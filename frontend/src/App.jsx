import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 text-slate-900 relative overflow-hidden">
      {/* Animated background geometric shapes */}
      <div className="fixed inset-0 -z-10">
        {/* Large purple circle - top left */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-300/10 to-purple-500/5 rounded-full blur-3xl"></div>
        
        {/* Large blue circle - top right */}
        <div className="absolute -top-20 -right-40 w-96 h-96 bg-gradient-to-bl from-blue-300/10 to-blue-500/5 rounded-full blur-3xl"></div>
        
        {/* Medium purple circle - center */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-violet-300/8 to-purple-500/4 rounded-full blur-3xl"></div>
        
        {/* Medium blue circle - right side */}
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-bl from-indigo-300/8 to-blue-500/4 rounded-full blur-3xl"></div>
        
        {/* Diagonal lines pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonal-lines" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="100" stroke="url(#gradient1)" strokeWidth="2"/>
            </pattern>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa"/>
              <stop offset="100%" stopColor="#60a5fa"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-lines)"/>
        </svg>
      </div>

      <AuthProvider>
        <Navbar />
        <main className="relative z-10">
          <Outlet />
        </main>
      </AuthProvider>
    </div>
  );
};

export default App;
