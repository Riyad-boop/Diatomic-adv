import React from 'react';
import MapComponent from './components/Map';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen">
      <Dashboard/>
      <MapComponent />
     
    </div>
  );
};

export default App;